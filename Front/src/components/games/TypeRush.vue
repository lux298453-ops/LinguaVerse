<template>
  <Transition name="fade-scale">
    <div v-if="visible" class="typerush-overlay" @click.self="handleOverlayClick">
      <div class="arcade-cabinet">
        <!-- 顶部装饰栏 -->
        <div class="cabinet-header">
          <div class="header-left">
            <span class="arcade-dot red" />
            <span class="arcade-dot yellow" />
            <span class="arcade-dot green" />
            <span class="arcade-title">⚡ TYPE RUSH · 单词极速挑战</span>
          </div>
          <button class="arcade-close-btn" @click="closeGame">✕</button>
        </div>

        <!-- 游戏未开始 / 准备界面 -->
        <div v-if="gameState === 'READY'" class="cabinet-screen screen-ready">
          <div class="ready-hero">
            <div class="neon-badge">FANTASY ARCADE</div>
            <h1 class="game-title">TYPE RUSH</h1>
            <p class="game-desc">
              在 60 秒内尽可能快、准地输入眼前出现的英语单词！<br>
              保持连击（Combo）可以翻倍积分，挑战传说中的 <strong>S 级评级</strong> 并赢取丰厚金币！
            </p>
          </div>

          <div class="features-row">
            <div class="feat-item">
              <span class="feat-icon">⏱️</span>
              <span class="feat-label">60s 极限竞速</span>
            </div>
            <div class="feat-item">
              <span class="feat-icon">🔥</span>
              <span class="feat-label">连击加成 Combo</span>
            </div>
            <div class="feat-item">
              <span class="feat-icon">💰</span>
              <span class="feat-label">高额金币奖励</span>
            </div>
          </div>

          <!-- 词书选择 -->
          <div class="book-selection-section">
            <div class="diff-title">
              <span>📖 选择修习词库 (VOCABULARY BOOK)</span>
              <span class="active-book-pill">{{ currentBookObj.name }}</span>
            </div>
            <div class="book-options-row">
              <button
                v-for="b in VOCAB_BOOKS"
                :key="b.id"
                class="book-select-btn"
                :class="{ active: selectedBookId === b.id }"
                @click="selectedBookId = b.id"
                :title="b.desc"
              >
                <span class="b-btn-icon">{{ b.icon }}</span>
                <span class="b-btn-name">{{ b.name.split(' ')[0] }}</span>
              </button>
            </div>
          </div>

          <!-- 难度选择 -->
          <div class="difficulty-section">
            <div class="diff-title">🎯 选择挑战难度 (SELECT DIFFICULTY)</div>
            <div class="difficulty-options">
              <button
                v-for="diff in DIFFICULTY_LEVELS"
                :key="diff.key"
                class="diff-btn"
                :class="[diff.key.toLowerCase(), { active: currentDifficulty === diff.key }]"
                @click="currentDifficulty = diff.key"
              >
                <span class="diff-icon">{{ diff.icon }}</span>
                <span class="diff-name">{{ diff.name }}</span>
                <span class="diff-sub">{{ diff.sub }}</span>
                <span class="diff-mult">{{ diff.multiplier }}x 得分</span>
              </button>
            </div>
          </div>

          <div class="ready-actions">
            <button class="neon-btn-primary" @click="startCountdown">
              🚀 开始极速挑战 (START)
            </button>
            <button class="neon-btn-secondary" @click="openLeaderboard">
              🏆 荣誉榜单 (LEADERBOARD)
            </button>
          </div>
        </div>

        <!-- 3-2-1 倒计时状态 -->
        <div v-else-if="gameState === 'COUNTDOWN'" class="cabinet-screen screen-countdown">
          <div class="countdown-number" :key="countdownVal">
            {{ countdownVal > 0 ? countdownVal : 'GO!' }}
          </div>
          <div class="countdown-tip">准备好你的键盘，全神贯注！</div>
        </div>

        <!-- 游戏进行中状态 -->
        <div v-else-if="gameState === 'PLAYING'" class="cabinet-screen screen-playing">
          <!-- 顶部状态栏：计时、连击、得分、WPM、难度 -->
          <div class="stats-bar">
            <div class="stat-box timer-box">
              <span class="stat-label">TIME</span>
              <span class="stat-val" :class="{ 'urgent': timeLeft <= 10 }">{{ timeLeft }}s</span>
            </div>
            <div class="stat-box combo-box">
              <span class="stat-label">COMBO</span>
              <span class="stat-val combo-val" :class="{ 'hyper': combo >= 5 }">
                x{{ combo }} {{ combo >= 5 ? '🔥' : '' }}
              </span>
            </div>
            <div class="stat-box score-box">
              <span class="stat-label">SCORE</span>
              <span class="stat-val score-num">{{ score }}</span>
            </div>
            <div class="stat-box wpm-box">
              <span class="stat-label">WPM</span>
              <span class="stat-val">{{ currentWpm }}</span>
            </div>
            <div class="stat-box diff-box" :class="currentDifficulty.toLowerCase()">
              <span class="stat-label">DIFF</span>
              <span class="stat-val">{{ currentDifficultyObj.shortName }} {{ currentDifficultyObj.multiplier }}x</span>
            </div>
          </div>

          <!-- 时间进度条 -->
          <div class="time-progress-track">
            <div class="time-progress-bar" :style="{ width: (timeLeft / 60 * 100) + '%' }" />
          </div>

          <!-- 核心单词展示大卡片 -->
          <div class="word-card" :class="{ 'shake-anim': isShaking, 'word-success-anim': wordSuccess }">
            <div class="word-meta">
              <span class="word-category">🏷️ {{ currentWordObj.category }}</span>
              <span class="word-phonetic">{{ currentWordObj.phonetic }}</span>
            </div>

            <!-- 单词逐字母展示（绿色已打、当前高亮、未打） -->
            <div class="word-display">
              <span
                v-for="(letter, idx) in currentWordObj.word"
                :key="idx"
                class="letter-char"
                :class="{
                  'matched': idx < typedText.length,
                  'current': idx === typedText.length,
                  'unmatched': idx > typedText.length
                }"
              >
                {{ letter }}
              </span>
            </div>

            <!-- 中文释义与提示 -->
            <div class="word-meaning">
              💡 {{ currentWordObj.meaning }}
            </div>
          </div>

          <!-- 键盘实时输入引导与隐形捕获框 -->
          <div class="typing-capture-zone">
            <input
              ref="hiddenInputRef"
              v-model="typedText"
              type="text"
              class="hidden-input"
              autofocus
              autocomplete="off"
              autocapitalize="off"
              spellcheck="false"
              @input="handleInput"
              @keydown.stop
            />
            <div class="prompt-hint" @click="focusInput">
              <span class="blinking-cursor">▋</span>
              <span>直接敲击键盘输入英文（点击此处确保键盘聚焦）</span>
            </div>
          </div>
        </div>

        <!-- 游戏结算界面 -->
        <div v-else-if="gameState === 'RESULT'" class="cabinet-screen screen-result">
          <div class="result-badge-rank" :class="'rank-' + finalRank.toLowerCase()">
            {{ finalRank }}
          </div>
          <div class="result-title">挑战完成！CHALLENGE COMPLETED</div>

          <div class="result-grid">
            <div class="res-item">
              <span class="res-lbl">最终得分 (Score)</span>
              <span class="res-val highlight">{{ score }}</span>
            </div>
            <div class="res-item">
              <span class="res-lbl">挑战难度 (Difficulty)</span>
              <span class="res-val highlight-diff" :class="currentDifficulty.toLowerCase()">{{ currentDifficultyObj.name }} ({{ currentDifficultyObj.multiplier }}x)</span>
            </div>
            <div class="res-item">
              <span class="res-lbl">拼写词数 (Words)</span>
              <span class="res-val">{{ completedWordsCount }}</span>
            </div>
            <div class="res-item">
              <span class="res-lbl">正确率 (Accuracy)</span>
              <span class="res-val">{{ accuracy }}%</span>
            </div>
            <div class="res-item">
              <span class="res-lbl">最大连击 (Max Combo)</span>
              <span class="res-val">x{{ maxCombo }}</span>
            </div>
          </div>

          <!-- 奖励发放 -->
          <div class="gold-reward-card">
            <span class="gold-icon">🪙</span>
            <div class="gold-text">
              获得奖励：<strong>+{{ rewardCoins }} Gold Coins</strong>
            </div>
          </div>

          <!-- 本局拼写生词复盘与卡片查词 -->
          <div v-if="sessionCompletedWords.length > 0" class="rush-recap-box">
            <div class="rush-recap-title">✦ 本局拼写复盘 (WORDS LOG) · 点击单词查看卡片与发音 ✦</div>
            <div class="rush-recap-tags">
              <span
                v-for="(w, idx) in sessionCompletedWords"
                :key="idx"
                class="rush-recap-tag"
                @click="openWordCard(w.word)"
                title="点击查看音标、中文释义与真人发音"
              >
                {{ w.word.toUpperCase() }}
                <span class="rush-lookup-icon">🔊</span>
              </span>
            </div>
          </div>

          <div class="result-actions">
            <button class="neon-btn-secondary" @click="startCountdown">
              🔄 再来一局 (PLAY AGAIN)
            </button>
            <button class="neon-btn-secondary" @click="openLeaderboard">
              🏆 荣誉榜单 (LEADERBOARD)
            </button>
            <button class="neon-btn-primary" @click="closeGame">
              🚪 返回游戏 (EXIT)
            </button>
          </div>
        </div>

        <!-- 荣誉排行榜浮层 -->
        <Transition name="fade-fast">
          <div v-if="showLeaderboard" class="leaderboard-modal" @click.self="showLeaderboard = false">
            <div class="leaderboard-box">
              <div class="lb-header">
                <div class="lb-title-wrap">
                  <span class="lb-trophy">🏆</span>
                  <span class="lb-title">TYPE RUSH · 奇幻荣誉榜</span>
                </div>
                <button class="lb-close" @click="showLeaderboard = false">✕</button>
              </div>

              <div class="lb-list">
                <div
                  v-for="(item, index) in leaderboardData"
                  :key="index"
                  class="lb-item"
                  :class="{ 'my-recent': item.isRecent }"
                >
                  <div class="lb-rank">
                    <span v-if="index === 0" class="medal gold">🥇</span>
                    <span v-else-if="index === 1" class="medal silver">🥈</span>
                    <span v-else-if="index === 2" class="medal bronze">🥉</span>
                    <span v-else class="rank-num">#{{ index + 1 }}</span>
                  </div>
                  <div class="lb-player">
                    <div class="player-name">
                      {{ item.playerName }}
                      <span v-if="item.isRecent" class="recent-tag">本次</span>
                    </div>
                    <div class="player-meta">{{ item.date }} · {{ item.accuracy }}% 准确率 · 评级 {{ item.rank || 'A' }}</div>
                  </div>
                  <div class="lb-diff" :class="(item.difficulty || 'NORMAL').toLowerCase()">
                    {{ item.difficulty || 'NORMAL' }}
                  </div>
                  <div class="lb-score">
                    {{ item.score }} <span class="score-unit">pts</span>
                  </div>
                </div>
              </div>

              <div class="lb-footer">
                <button class="neon-btn-secondary btn-sm" @click="resetLeaderboard">
                  🗑️ 重置榜单
                </button>
                <button class="neon-btn-primary btn-sm" @click="showLeaderboard = false">
                  关 闭
                </button>
              </div>
            </div>
          </div>
        </Transition>

        <!-- 单词卡片弹窗 (WORD CARD MODAL) -->
        <WordCardModal
          :visible="showWordCard"
          :word="selectedWordForCard"
          @close="showWordCard = false"
        />
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useUserStore } from '../../stores/user.js'
import WordCardModal from './WordCardModal.vue'
import { VOCAB_BOOKS, getCurrentBookId, getWordsByBook } from './dictService.js'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  gameInfo: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['close', 'reward'])
const userStore = useUserStore()
const currentNick = computed(() => userStore.user?.nickname || userStore.user?.username || 'Player')

// ─── 词书选择状态 ─────────────────────────────────────────────────────────────
const selectedBookId = ref(getCurrentBookId())
const currentBookObj = computed(() => {
  return VOCAB_BOOKS.find(b => b.id === selectedBookId.value) || VOCAB_BOOKS[2]
})

// 当游戏重新打开时，拉取最新的主修词书作为默认选择
watch(() => props.visible, (v) => {
  if (v) {
    selectedBookId.value = getCurrentBookId()
  }
})

// ─── 单词卡片与复盘状态 ────────────────────────────────────────────────────────
const showWordCard = ref(false)
const selectedWordForCard = ref('')
const sessionCompletedWords = ref([])

function openWordCard(word) {
  if (!word) return
  selectedWordForCard.value = word
  showWordCard.value = true
}

// ─── 难度等级设定 ─────────────────────────────────────────────────────────────
const DIFFICULTY_LEVELS = [
  {
    key: 'EASY',
    name: '见习学徒',
    shortName: 'EASY',
    icon: '🟢',
    sub: '3-5 字母日常短词',
    multiplier: 1.0,
    baseScore: 80
  },
  {
    key: 'NORMAL',
    name: '魔法行者',
    shortName: 'NORM',
    icon: '🟡',
    sub: '5-7 字母进阶词汇',
    multiplier: 1.5,
    baseScore: 100
  },
  {
    key: 'HARD',
    name: '大魔导师',
    shortName: 'HARD',
    icon: '🔴',
    sub: '8+ 字母高级魔导词',
    multiplier: 2.0,
    baseScore: 150
  }
]

const currentDifficulty = ref('NORMAL')
const currentDifficultyObj = computed(() => {
  return DIFFICULTY_LEVELS.find(d => d.key === currentDifficulty.value) || DIFFICULTY_LEVELS[1]
})

// ─── 词库分级设计（趣味奇幻 + 日常高频 + 科技探索）────────────────────────
const EASY_VOCABULARY = [
  { word: 'book', meaning: '书本；书籍', phonetic: '/bʊk/', category: 'Daily' },
  { word: 'star', meaning: '星星；恒星', phonetic: '/stɑːr/', category: 'Nature' },
  { word: 'moon', meaning: '月亮；月球', phonetic: '/muːn/', category: 'Nature' },
  { word: 'hero', meaning: '英雄；勇士', phonetic: '/ˈhɪəroʊ/', category: 'Quest' },
  { word: 'tree', meaning: '树；树木', phonetic: '/triː/', category: 'Nature' },
  { word: 'snow', meaning: '雪；下雪', phonetic: '/snoʊ/', category: 'Weather' },
  { word: 'wind', meaning: '风；气流', phonetic: '/wɪnd/', category: 'Weather' },
  { word: 'bird', meaning: '鸟；飞禽', phonetic: '/bɜːrd/', category: 'Nature' },
  { word: 'rose', meaning: '玫瑰；蔷薇', phonetic: '/roʊz/', category: 'Plant' },
  { word: 'gold', meaning: '金子；金币', phonetic: '/ɡoʊld/', category: 'Item' },
  { word: 'jump', meaning: '跳跃；飞跃', phonetic: '/dʒʌmp/', category: 'Action' },
  { word: 'code', meaning: '代码；密码', phonetic: '/koʊd/', category: 'Sci-Fi' },
  { word: 'path', meaning: '小径；道路', phonetic: '/pæθ/', category: 'Place' },
  { word: 'blue', meaning: '蓝色的', phonetic: '/bluː/', category: 'Color' },
  { word: 'fire', meaning: '火；火焰', phonetic: '/ˈfaɪər/', category: 'Element' },
  { word: 'rain', meaning: '雨；下雨', phonetic: '/reɪn/', category: 'Weather' },
  { word: 'lamp', meaning: '灯；照明器', phonetic: '/læmp/', category: 'Item' },
  { word: 'ring', meaning: '戒指；指环', phonetic: '/rɪŋ/', category: 'Item' },
  { word: 'fish', meaning: '鱼；游鱼', phonetic: '/fɪʃ/', category: 'Nature' },
  { word: 'leaf', meaning: '叶子；树叶', phonetic: '/liːf/', category: 'Plant' },
  { word: 'song', meaning: '歌曲；旋律', phonetic: '/sɔːŋ/', category: 'Music' },
  { word: 'boat', meaning: '小船；舟', phonetic: '/boʊt/', category: 'Item' },
  { word: 'fast', meaning: '快速的；迅速的', phonetic: '/fæst/', category: 'Adj' },
  { word: 'game', meaning: '游戏；比赛', phonetic: '/ɡeɪm/', category: 'Fun' }
]

const NORMAL_VOCABULARY = [
  { word: 'magic', meaning: '魔法；魔力', phonetic: '/ˈmædʒɪk/', category: 'Fantasy' },
  { word: 'portal', meaning: '传送门；入口', phonetic: '/ˈpɔːrtl/', category: 'Fantasy' },
  { word: 'crystal', meaning: '水晶；结晶体', phonetic: '/ˈkrɪstl/', category: 'Fantasy' },
  { word: 'whisper', meaning: '低语；私语', phonetic: '/ˈwɪspər/', category: 'Action' },
  { word: 'explore', meaning: '探索；勘探', phonetic: '/ɪkˈsplɔːr/', category: 'Quest' },
  { word: 'journey', meaning: '旅程；旅行', phonetic: '/ˈdʒɜːrni/', category: 'Quest' },
  { word: 'treasure', meaning: '珍宝；宝藏', phonetic: '/ˈtreʒər/', category: 'Item' },
  { word: 'sparkle', meaning: '闪耀；发光', phonetic: '/ˈspɑːrkl/', category: 'Action' },
  { word: 'courage', meaning: '勇气；胆量', phonetic: '/ˈkɜːrɪdʒ/', category: 'Spirit' },
  { word: 'kingdom', meaning: '王国；界', phonetic: '/ˈkɪŋdəm/', category: 'Place' },
  { word: 'mystery', meaning: '神秘；谜团', phonetic: '/ˈmɪstəri/', category: 'Fantasy' },
  { word: 'horizon', meaning: '地平线；视野', phonetic: '/həˈraɪzn/', category: 'Nature' },
  { word: 'radiant', meaning: '绚丽的；容光焕发的', phonetic: '/ˈreɪdiənt/', category: 'Adj' },
  { word: 'dynamic', meaning: '充满活力的；动态的', phonetic: '/daɪˈnæmɪk/', category: 'Concept' },
  { word: 'harmony', meaning: '和谐；融洽', phonetic: '/ˈhɑːrməni/', category: 'Spirit' },
  { word: 'bravery', meaning: '勇敢；英勇', phonetic: '/ˈbreɪvəri/', category: 'Spirit' },
  { word: 'shield', meaning: '盾牌；保护', phonetic: '/ʃiːld/', category: 'Item' },
  { word: 'shadow', meaning: '阴影；暗影', phonetic: '/ˈʃædoʊ/', category: 'Fantasy' },
  { word: 'dragon', meaning: '巨龙；神龙', phonetic: '/ˈdræɡən/', category: 'Fantasy' },
  { word: 'castle', meaning: '城堡；要塞', phonetic: '/ˈkæsl/', category: 'Place' },
  { word: 'silver', meaning: '银；银色的', phonetic: '/ˈsɪlvər/', category: 'Item' },
  { word: 'energy', meaning: '能量；活力', phonetic: '/ˈenərdʒi/', category: 'Sci-Fi' }
]

const HARD_VOCABULARY = [
  { word: 'adventure', meaning: '冒险；奇遇', phonetic: '/ədˈventʃər/', category: 'Quest' },
  { word: 'champion', meaning: '冠军；拥护者', phonetic: '/ˈtʃæmpiən/', category: 'Title' },
  { word: 'challenge', meaning: '挑战；质疑', phonetic: '/ˈtʃælɪndʒ/', category: 'Quest' },
  { word: 'glorious', meaning: '光荣的；极好的', phonetic: '/ˈɡlɔːriəs/', category: 'Adj' },
  { word: 'guardian', meaning: '守护者；监护人', phonetic: '/ˈɡɑːrdiən/', category: 'Title' },
  { word: 'infinite', meaning: '无限的；极大的', phonetic: '/ˈɪnfɪnət/', category: 'Concept' },
  { word: 'velocity', meaning: '高速；速度', phonetic: '/vəˈlɑːsəti/', category: 'Sci-Fi' },
  { word: 'starlight', meaning: '星光', phonetic: '/ˈstɑːrlaɪt/', category: 'Fantasy' },
  { word: 'universe', meaning: '宇宙；天地万物', phonetic: '/ˈjuːnɪvɜːrs/', category: 'Sci-Fi' },
  { word: 'incredible', meaning: '令人难以置信的', phonetic: '/ɪnˈkredəbl/', category: 'Adj' },
  { word: 'magnificent', meaning: '宏伟的；壮丽的', phonetic: '/mæɡˈnɪfɪsnt/', category: 'Adj' },
  { word: 'extraordinary', meaning: '非凡的；特别的', phonetic: '/ɪkˈstrɔːrdəneri/', category: 'Adj' },
  { word: 'brilliance', meaning: '光辉；才华横溢', phonetic: '/ˈbrɪliəns/', category: 'Spirit' },
  { word: 'mysterious', meaning: '神秘的；不可思议的', phonetic: '/mɪˈstɪriəs/', category: 'Fantasy' },
  { word: 'sanctuary', meaning: '圣所；避难所', phonetic: '/ˈsæŋktʃueri/', category: 'Place' },
  { word: 'celebration', meaning: '庆祝；典礼', phonetic: '/ˌselɪˈbreɪʃn/', category: 'Event' },
  { word: 'imagination', meaning: '想象力；空想', phonetic: '/ɪˌmædʒɪˈneɪʃn/', category: 'Spirit' },
  { word: 'constellation', meaning: '星座；星群', phonetic: '/ˌkɑːnstəˈleɪʃn/', category: 'Nature' },
  { word: 'enchanting', meaning: '迷人的；令人陶醉的', phonetic: '/ɪnˈtʃæntɪŋ/', category: 'Fantasy' }
]

// 游戏状态: READY | COUNTDOWN | PLAYING | RESULT
const gameState = ref('READY')
const countdownVal = ref(3)
const timeLeft = ref(60)
const score = ref(0)
const combo = ref(0)
const maxCombo = ref(0)
const completedWordsCount = ref(0)
const totalStrokes = ref(0)
const correctStrokes = ref(0)
const startTime = ref(0)

const currentWordIndex = ref(0)
const shuffledWords = ref([])
const currentWordObj = computed(() => shuffledWords.value[currentWordIndex.value] || NORMAL_VOCABULARY[0])

const typedText = ref('')
const isShaking = ref(false)
const wordSuccess = ref(false)

const hiddenInputRef = ref(null)

let timerInterval = null
let countdownInterval = null

// ─── 荣誉排行榜 ─────────────────────────────────────────────────────────────
const LEADERBOARD_KEY = 'linguaverse_typerush_leaderboard'
const showLeaderboard = ref(false)
const leaderboardData = ref([])

const DEFAULT_LEADERBOARD = [
  { playerName: 'Mary (Guide)', score: 3450, difficulty: 'HARD', accuracy: 98, rank: 'S', date: '09-08 14:20' },
  { playerName: 'Luna (Arcade)', score: 2820, difficulty: 'NORMAL', accuracy: 96, rank: 'S', date: '09-08 16:45' },
  { playerName: 'Nova (Explorer)', score: 2150, difficulty: 'NORMAL', accuracy: 93, rank: 'A', date: '09-07 11:30' },
  { playerName: 'Echo (Apprentice)', score: 1680, difficulty: 'EASY', accuracy: 95, rank: 'A', date: '09-06 09:15' },
  { playerName: 'Pixel Star', score: 1250, difficulty: 'EASY', accuracy: 90, rank: 'B', date: '09-05 20:00' }
]

function loadLeaderboard() {
  try {
    const raw = localStorage.getItem(LEADERBOARD_KEY)
    if (raw) {
      leaderboardData.value = JSON.parse(raw)
    } else {
      leaderboardData.value = [...DEFAULT_LEADERBOARD]
      localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(DEFAULT_LEADERBOARD))
    }
  } catch (e) {
    leaderboardData.value = [...DEFAULT_LEADERBOARD]
  }
}

function saveRunToLeaderboard(record) {
  loadLeaderboard()
  leaderboardData.value.forEach(item => item.isRecent = false)
  leaderboardData.value.push({
    ...record,
    isRecent: true
  })
  // 按分数降序排列，保留前 10 名
  leaderboardData.value.sort((a, b) => b.score - a.score)
  leaderboardData.value = leaderboardData.value.slice(0, 10)
  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(leaderboardData.value))
}

function openLeaderboard() {
  loadLeaderboard()
  showLeaderboard.value = true
}

function resetLeaderboard() {
  leaderboardData.value = [...DEFAULT_LEADERBOARD]
  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(DEFAULT_LEADERBOARD))
}

// 动态计算实时 WPM (Words Per Minute)
const currentWpm = computed(() => {
  if (gameState.value !== 'PLAYING' || !startTime.value) return 0
  const elapsedMinutes = (Date.now() - startTime.value) / 60000
  if (elapsedMinutes <= 0.01) return 0
  return Math.round(completedWordsCount.value / elapsedMinutes)
})

// 正确率
const accuracy = computed(() => {
  if (totalStrokes.value === 0) return 100
  return Math.round((correctStrokes.value / totalStrokes.value) * 100)
})

// 评级计算
const finalRank = computed(() => {
  if (completedWordsCount.value >= 20 && accuracy.value >= 90) return 'S'
  if (completedWordsCount.value >= 15) return 'A'
  if (completedWordsCount.value >= 10) return 'B'
  return 'C'
})

// 奖励金币数
const rewardCoins = computed(() => {
  let baseCoins = 10
  switch (finalRank.value) {
    case 'S': baseCoins = 30; break
    case 'A': baseCoins = 20; break
    case 'B': baseCoins = 15; break
    default:  baseCoins = 10; break
  }
  return Math.round(baseCoins * currentDifficultyObj.value.multiplier)
})

// 随机打乱所选难度的词库（优先从选中的词书中筛选）
function shuffleWords() {
  // 1. 获取选中词书的全部收录词
  const bookWords = getWordsByBook(selectedBookId.value)
  
  // 2. 根据难度按单词长度区间初筛
  let minLen = 5, maxLen = 7
  let fallbackPool = NORMAL_VOCABULARY

  if (currentDifficulty.value === 'EASY') {
    minLen = 3
    maxLen = 5
    fallbackPool = EASY_VOCABULARY
  } else if (currentDifficulty.value === 'HARD') {
    minLen = 7
    maxLen = 15
    fallbackPool = HARD_VOCABULARY
  }

  // 格式化为 TypeRush 期望的结构 { word, meaning, phonetic, category }
  let matched = bookWords.filter(item => {
    const len = item.word.length
    return len >= minLen && len <= maxLen
  }).map(item => ({
    word: item.word,
    meaning: item.trans || '常见高频词汇',
    phonetic: item.phonetic_us || `/${item.word}/`,
    category: currentBookObj.value.name.split(' ')[0]
  }))

  // 如果筛选出来的词量不足 10 个，混入通用精选词作为保底填充
  if (matched.length < 10) {
    matched = [...matched, ...fallbackPool]
  }

  shuffledWords.value = matched.sort(() => Math.random() - 0.5)
  currentWordIndex.value = 0
}

// 开始倒计时
function startCountdown() {
  shuffleWords()
  gameState.value = 'COUNTDOWN'
  countdownVal.value = 3
  score.value = 0
  combo.value = 0
  maxCombo.value = 0
  completedWordsCount.value = 0
  totalStrokes.value = 0
  correctStrokes.value = 0
  typedText.value = ''
  sessionCompletedWords.value = []

  clearInterval(countdownInterval)
  countdownInterval = setInterval(() => {
    countdownVal.value--
    if (countdownVal.value <= 0) {
      clearInterval(countdownInterval)
      startGame()
    }
  }, 900)
}

// 正式开始竞速
function startGame() {
  gameState.value = 'PLAYING'
  timeLeft.value = 60
  startTime.value = Date.now()
  typedText.value = ''

  clearInterval(timerInterval)
  timerInterval = setInterval(() => {
    timeLeft.value--
    if (timeLeft.value <= 0) {
      endGame()
    }
  }, 1000)

  focusInput()
}

function focusInput() {
  nextTick(() => {
    hiddenInputRef.value?.focus()
  })
}

// 逐字符实时比对输入
function handleInput(e) {
  if (gameState.value !== 'PLAYING') return

  const inputVal = typedText.value.toLowerCase()
  const target = currentWordObj.value.word.toLowerCase()

  totalStrokes.value++

  // 检查输入的前缀是否匹配
  if (target.startsWith(inputVal)) {
    correctStrokes.value++
    // 如果完全拼写完单词
    if (inputVal === target) {
      handleWordCompleted()
    }
  } else {
    // 输错字母：触发抖动与重置连击
    combo.value = 0
    triggerShake()
    // 截回有效前缀
    typedText.value = inputVal.slice(0, -1)
  }
}

function triggerShake() {
  isShaking.value = true
  setTimeout(() => {
    isShaking.value = false
  }, 300)
}

function handleWordCompleted() {
  completedWordsCount.value++
  combo.value++
  if (combo.value > maxCombo.value) {
    maxCombo.value = combo.value
  }

  // 记录本局拼写完成的单词
  sessionCompletedWords.value.push(currentWordObj.value)

  // 加分机制：基础分 + 连击加成 * 难度倍率
  const base = currentDifficultyObj.value.baseScore
  const bonus = Math.min(combo.value, 10) * 20
  score.value += Math.round((base + bonus) * currentDifficultyObj.value.multiplier)

  // 成功动画
  wordSuccess.value = true
  setTimeout(() => {
    wordSuccess.value = false
  }, 200)

  // 切换到下一个单词
  typedText.value = ''
  currentWordIndex.value = (currentWordIndex.value + 1) % shuffledWords.value.length
}

// 结束游戏
function endGame() {
  clearInterval(timerInterval)
  gameState.value = 'RESULT'

  // 保存成绩到荣誉榜
  const d = new Date()
  const dateStr = `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  const record = {
    playerName: currentNick.value,
    score: score.value,
    difficulty: currentDifficulty.value,
    accuracy: accuracy.value,
    rank: finalRank.value,
    date: dateStr
  }
  saveRunToLeaderboard(record)

  // 发放奖励事件
  emit('reward', {
    coins: rewardCoins.value,
    score: score.value,
    rank: finalRank.value,
    difficulty: currentDifficulty.value
  })
}

function closeGame() {
  clearInterval(timerInterval)
  clearInterval(countdownInterval)
  gameState.value = 'READY'
  emit('close')
}

function handleOverlayClick() {
  // 点击背景遮罩不自动关闭，防止误触，只能通过右上角或EXIT关闭
}

// 监听弹窗显示与键盘聚焦
watch(() => props.visible, (val) => {
  if (val) {
    gameState.value = 'READY'
    loadLeaderboard()
  } else {
    clearInterval(timerInterval)
    clearInterval(countdownInterval)
    showLeaderboard.value = false
  }
})

onMounted(() => {
  // 全局捕获：小游戏打开时阻止一切按键冒泡到外界 Phaser 场景
  const onKeydown = (e) => {
    if (props.visible) {
      if (e.key === 'Escape') {
        closeGame()
      } else {
        // 如果正在游戏中且输入框未聚焦，自动聚焦
        if (gameState.value === 'PLAYING') {
          hiddenInputRef.value?.focus()
        }
      }
    }
  }
  window.addEventListener('keydown', onKeydown)
  onUnmounted(() => {
    window.removeEventListener('keydown', onKeydown)
    clearInterval(timerInterval)
    clearInterval(countdownInterval)
  })
})
</script>

<style scoped>
.typerush-overlay {
  position: fixed;
  inset: 0;
  background: rgba(10, 15, 30, 0.85);
  backdrop-filter: blur(8px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.arcade-cabinet {
  width: 640px;
  max-width: 95vw;
  background: #111827;
  border: 3px solid #6366f1;
  border-radius: 18px;
  box-shadow: 0 0 35px rgba(99, 102, 241, 0.45), inset 0 0 15px rgba(99, 102, 241, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  color: #fff;
}

/* 顶部机台装饰 */
.cabinet-header {
  height: 48px;
  background: #1e1b4b;
  border-bottom: 2px solid #4338ca;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 18px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.arcade-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}
.arcade-dot.red { background: #ef4444; }
.arcade-dot.yellow { background: #f59e0b; }
.arcade-dot.green { background: #10b981; }

.arcade-title {
  font-weight: 800;
  font-size: 14px;
  letter-spacing: 1px;
  color: #c7d2fe;
  margin-left: 6px;
}

.arcade-close-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 18px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.2s;
}
.arcade-close-btn:hover {
  background: #ef4444;
  color: #fff;
}

/* 屏幕区域 */
.cabinet-screen {
  padding: 30px;
  min-height: 400px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative;
  background: radial-gradient(circle at center, #1e293b 0%, #0f172a 100%);
}

/* 1. READY 界面 */
.ready-hero {
  text-align: center;
  margin-bottom: 24px;
}

.neon-badge {
  display: inline-block;
  padding: 4px 14px;
  background: rgba(99, 102, 241, 0.25);
  border: 1px solid #818cf8;
  border-radius: 20px;
  color: #a5b4fc;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 2px;
  margin-bottom: 12px;
}

.game-title {
  font-size: 42px;
  font-weight: 900;
  letter-spacing: 3px;
  margin: 0 0 12px 0;
  background: linear-gradient(135deg, #38bdf8 0%, #818cf8 50%, #c084fc 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 20px rgba(129, 140, 248, 0.5);
}

.game-desc {
  font-size: 14px;
  color: #94a3b8;
  line-height: 1.6;
  max-width: 480px;
  margin: 0 auto;
}

.features-row {
  display: flex;
  gap: 16px;
  margin-bottom: 30px;
}

.feat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.05);
  padding: 8px 14px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 13px;
  color: #cbd5e1;
}

/* 2. 倒计时 */
.screen-countdown {
  gap: 16px;
}

.countdown-number {
  font-size: 88px;
  font-weight: 900;
  color: #38bdf8;
  text-shadow: 0 0 30px #38bdf8;
  animation: popScale 0.8s ease-out;
}

.countdown-tip {
  font-size: 15px;
  color: #94a3b8;
}

/* 3. PLAYING 界面 */
.screen-playing {
  justify-content: flex-start;
  padding-top: 20px;
}

.stats-bar {
  width: 100%;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.stat-box {
  flex: 1;
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid #334155;
  border-radius: 10px;
  padding: 8px 10px;
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 10px;
  font-weight: 700;
  color: #64748b;
  letter-spacing: 1px;
}

.stat-val {
  font-size: 20px;
  font-weight: 800;
  color: #f8fafc;
}

.stat-val.urgent {
  color: #ef4444;
  animation: pulseUrgent 0.5s infinite alternate;
}

.combo-val.hyper {
  color: #f59e0b;
  text-shadow: 0 0 10px rgba(245, 158, 11, 0.6);
}

.score-num {
  color: #38bdf8;
}

.time-progress-track {
  width: 100%;
  height: 6px;
  background: #334155;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 24px;
}

.time-progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #10b981, #38bdf8);
  transition: width 1s linear;
}

/* 单词展示卡片 */
.word-card {
  width: 100%;
  background: rgba(30, 41, 59, 0.8);
  border: 2px solid #475569;
  border-radius: 16px;
  padding: 24px;
  text-align: center;
  margin-bottom: 24px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  transition: all 0.2s;
}

.word-card.shake-anim {
  animation: shake 0.25s ease-in-out;
  border-color: #ef4444;
}

.word-card.word-success-anim {
  border-color: #10b981;
  box-shadow: 0 0 25px rgba(16, 185, 129, 0.5);
}

.word-meta {
  display: flex;
  justify-content: center;
  gap: 14px;
  margin-bottom: 12px;
}

.word-category {
  font-size: 11px;
  color: #a5b4fc;
  background: rgba(99, 102, 241, 0.2);
  padding: 3px 8px;
  border-radius: 6px;
}

.word-phonetic {
  font-size: 13px;
  color: #94a3b8;
}

.word-display {
  font-size: 42px;
  font-weight: 800;
  letter-spacing: 4px;
  margin-bottom: 14px;
  display: flex;
  justify-content: center;
}

.letter-char {
  transition: all 0.15s;
}

.letter-char.matched {
  color: #10b981;
  text-shadow: 0 0 12px rgba(16, 185, 129, 0.8);
}

.letter-char.current {
  color: #38bdf8;
  border-bottom: 3px solid #38bdf8;
}

.letter-char.unmatched {
  color: #64748b;
}

.word-meaning {
  font-size: 16px;
  font-weight: 600;
  color: #f1f5f9;
}

/* 隐形键盘捕获 */
.typing-capture-zone {
  position: relative;
  width: 100%;
}

.hidden-input {
  position: absolute;
  opacity: 0;
  pointer-events: auto;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  cursor: default;
}

.prompt-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 13px;
  color: #94a3b8;
  padding: 10px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.2);
  cursor: pointer;
}

.blinking-cursor {
  color: #38bdf8;
  animation: blink 0.8s infinite;
}

/* 4. RESULT 界面 */
.screen-result {
  gap: 14px;
}

.result-badge-rank {
  font-size: 72px;
  font-weight: 900;
  line-height: 1;
  text-shadow: 0 0 30px currentColor;
}
.result-badge-rank.rank-s { color: #f59e0b; }
.result-badge-rank.rank-a { color: #8b5cf6; }
.result-badge-rank.rank-b { color: #3b82f6; }
.result-badge-rank.rank-c { color: #64748b; }

.result-title {
  font-size: 16px;
  font-weight: 700;
  color: #cbd5e1;
  letter-spacing: 2px;
}

.result-grid {
  width: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin: 10px 0;
}

.res-item {
  background: rgba(30, 41, 59, 0.7);
  border: 1px solid #334155;
  border-radius: 10px;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.res-lbl {
  font-size: 11px;
  color: #94a3b8;
}

.res-val {
  font-size: 22px;
  font-weight: 800;
  color: #f8fafc;
}

.res-val.highlight {
  color: #38bdf8;
}

.gold-reward-card {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(245, 158, 11, 0.15);
  border: 1px solid rgba(245, 158, 11, 0.4);
  padding: 10px 24px;
  border-radius: 30px;
  color: #fbbf24;
  font-size: 15px;
}

.gold-icon {
  font-size: 22px;
}

.result-actions {
  display: flex;
  gap: 16px;
  margin-top: 10px;
}

/* 按钮风格 */
.neon-btn-primary {
  background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
  color: #fff;
  border: none;
  padding: 12px 28px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4);
  transition: all 0.2s;
}
.neon-btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.6);
}

.neon-btn-secondary {
  background: rgba(255, 255, 255, 0.08);
  color: #cbd5e1;
  border: 1px solid #475569;
  padding: 12px 24px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}
.neon-btn-secondary:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
}

/* 动画效果 */
@keyframes popScale {
  0% { transform: scale(0.5); opacity: 0; }
  60% { transform: scale(1.15); opacity: 1; }
  100% { transform: scale(1); }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-6px); }
  75% { transform: translateX(6px); }
}

@keyframes pulseUrgent {
  0% { opacity: 0.6; }
  100% { opacity: 1; transform: scale(1.05); }
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

/* 过渡动效 */
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: all 0.25s ease-out;
}

.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

/* 词书选择样式 */
.book-selection-section {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 4px 0 10px;
}

.active-book-pill {
  float: right;
  font-size: 11px;
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.15);
  padding: 1px 8px;
  border-radius: 10px;
  border: 1px solid rgba(56, 189, 248, 0.3);
}

.book-options-row {
  display: flex;
  gap: 8px;
  width: 100%;
  overflow-x: auto;
  padding-bottom: 4px;
}

.book-select-btn {
  flex: 1;
  min-width: 80px;
  background: rgba(30, 41, 59, 0.6);
  border: 1.5px solid #334155;
  border-radius: 10px;
  padding: 6px 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  color: #94a3b8;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.book-select-btn:hover {
  background: rgba(51, 65, 85, 0.8);
  border-color: #64748b;
  color: #f1f5f9;
}

.book-select-btn.active {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(56, 189, 248, 0.2));
  border-color: #38bdf8;
  color: #38bdf8;
  box-shadow: 0 0 14px rgba(56, 189, 248, 0.35);
  transform: translateY(-1px);
}

.b-btn-icon {
  font-size: 14px;
}

/* 难度选择样式 */
.difficulty-section {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 6px 0 12px;
}

.diff-title {
  font-size: 12px;
  font-weight: 700;
  color: #94a3b8;
  letter-spacing: 1px;
}

.difficulty-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  width: 100%;
}

.diff-btn {
  background: rgba(30, 41, 59, 0.65);
  border: 1.5px solid #334155;
  border-radius: 12px;
  padding: 10px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  color: #94a3b8;
}

.diff-btn:hover {
  background: rgba(51, 65, 85, 0.8);
  border-color: #64748b;
  transform: translateY(-2px);
}

.diff-btn.active.easy {
  background: rgba(16, 185, 129, 0.15);
  border-color: #10b981;
  color: #10b981;
  box-shadow: 0 0 16px rgba(16, 185, 129, 0.25);
}

.diff-btn.active.normal {
  background: rgba(245, 158, 11, 0.15);
  border-color: #f59e0b;
  color: #fbbf24;
  box-shadow: 0 0 16px rgba(245, 158, 11, 0.25);
}

.diff-btn.active.hard {
  background: rgba(239, 68, 68, 0.15);
  border-color: #ef4444;
  color: #f87171;
  box-shadow: 0 0 16px rgba(239, 68, 68, 0.25);
}

.diff-icon { font-size: 16px; }
.diff-name { font-size: 13px; font-weight: 700; }
.diff-sub { font-size: 10px; opacity: 0.8; }
.diff-mult {
  font-size: 11px;
  font-weight: 800;
  padding: 2px 6px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.3);
  margin-top: 2px;
}

/* 顶部状态栏难度标识 */
.stat-box.diff-box.easy .stat-val { color: #10b981; }
.stat-box.diff-box.normal .stat-val { color: #f59e0b; }
.stat-box.diff-box.hard .stat-val { color: #ef4444; }

.highlight-diff.easy { color: #10b981; }
.highlight-diff.normal { color: #fbbf24; }
.highlight-diff.hard { color: #f87171; }

/* 荣誉排行榜弹窗 */
.leaderboard-modal {
  position: absolute;
  inset: 0;
  background: rgba(10, 8, 24, 0.85);
  backdrop-filter: blur(8px);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.leaderboard-box {
  width: 100%;
  max-width: 480px;
  background: linear-gradient(135deg, rgba(26, 20, 56, 0.98) 0%, rgba(15, 11, 35, 0.98) 100%);
  border: 1.5px solid rgba(192, 132, 252, 0.45);
  box-shadow: 0 20px 45px rgba(0, 0, 0, 0.8), 0 0 30px rgba(168, 85, 247, 0.25);
  border-radius: 18px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.lb-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 12px;
}

.lb-title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.lb-trophy { font-size: 20px; }

.lb-title {
  font-size: 16px;
  font-weight: 800;
  color: #fbbf24;
  letter-spacing: 1px;
}

.lb-close {
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 18px;
  cursor: pointer;
  padding: 4px;
}
.lb-close:hover { color: #fff; }

.lb-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 280px;
  overflow-y: auto;
  padding-right: 4px;
}

.lb-item {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(30, 41, 59, 0.45);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 8px 12px;
  transition: background 0.2s;
}

.lb-item.my-recent {
  border-color: #38bdf8;
  background: rgba(56, 189, 248, 0.15);
}

.lb-rank {
  width: 32px;
  display: flex;
  justify-content: center;
  font-size: 16px;
  font-weight: 800;
}
.rank-num { color: #64748b; font-size: 13px; }

.lb-player {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow: hidden;
}

.player-name {
  font-size: 13px;
  font-weight: 700;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 6px;
}

.recent-tag {
  font-size: 10px;
  background: #38bdf8;
  color: #0f172a;
  font-weight: 800;
  padding: 1px 5px;
  border-radius: 4px;
}

.player-meta {
  font-size: 10px;
  color: #94a3b8;
}

.lb-diff {
  font-size: 10px;
  font-weight: 800;
  padding: 2px 6px;
  border-radius: 4px;
  letter-spacing: 0.5px;
}
.lb-diff.easy { background: rgba(16, 185, 129, 0.2); color: #10b981; }
.lb-diff.normal { background: rgba(245, 158, 11, 0.2); color: #fbbf24; }
.lb-diff.hard { background: rgba(239, 68, 68, 0.2); color: #f87171; }

.lb-score {
  font-size: 16px;
  font-weight: 800;
  color: #f1f5f9;
  text-align: right;
  min-width: 65px;
}
.score-unit { font-size: 10px; color: #94a3b8; }

.lb-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 12px;
}

.btn-sm {
  padding: 8px 16px !important;
  font-size: 12px !important;
}

.fade-fast-enter-active,
.fade-fast-leave-active {
  transition: opacity 0.18s ease;
}
.fade-fast-enter-from,
.fade-fast-leave-to {
  opacity: 0;
}

/* ─── 本局拼写单词复盘与卡片查词 ────────────────────────────────────────── */
.rush-recap-box {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 12px;
  padding: 12px 16px;
  margin-top: 10px;
  max-height: 120px;
  overflow-y: auto;
}

.rush-recap-title {
  font-size: 11px;
  font-weight: 800;
  color: #a78bfa;
  margin-bottom: 8px;
  text-align: center;
  letter-spacing: 0.5px;
}

.rush-recap-tags {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 6px;
}

.rush-recap-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: rgba(168, 85, 247, 0.18);
  border: 1px solid rgba(168, 85, 247, 0.35);
  color: #e9d5ff;
  font-size: 12px;
  font-weight: 800;
  padding: 3px 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  user-select: none;
}
.rush-recap-tag:hover {
  background: rgba(168, 85, 247, 0.35);
  border-color: #fbbf24;
  color: #fff;
  transform: translateY(-2px) scale(1.06);
  box-shadow: 0 4px 12px rgba(168, 85, 247, 0.4);
}

.rush-lookup-icon {
  font-size: 10px;
  opacity: 0.6;
}
.rush-recap-tag:hover .rush-lookup-icon {
  opacity: 1;
}
</style>
