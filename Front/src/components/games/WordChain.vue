<template>
  <Transition name="fade-scale">
    <div v-if="visible" class="wordchain-overlay" @click.self="handleOverlayClick">
      <div class="chain-cabinet">
        <!-- 顶部控制栏 -->
        <div class="cabinet-header">
          <div class="header-left">
            <span class="rune-dot purple" />
            <span class="rune-dot cyan" />
            <span class="rune-dot gold" />
            <span class="cabinet-title">🔮 WORD CHAIN · 灵语连环对决</span>
          </div>
          <button class="cabinet-close-btn" @click="closeGame" title="关闭游戏">✕</button>
        </div>

        <!-- 1. 准备界面 (READY) -->
        <div v-if="gameState === 'READY'" class="screen-box screen-ready">
          <div class="ready-hero">
            <div class="glow-pill">MYSTIC DUEL ARENA</div>
            <h1 class="hero-title">WORD CHAIN</h1>
            <div class="hero-subtitle">灵 语 连 环 · 首 尾 呼 应</div>
            <p class="hero-desc">
              与灵语守护者展开回合制单词对决！每一个接出的单词，首字母必须与前一个单词的末尾字母精准相接。<br>
              在倒计时结束前接出有效英文单词，守护生命水晶，冲击 <strong>S 级大魔导师</strong> 评级！
            </p>
          </div>

          <!-- 特性看板 -->
          <div class="hero-badges">
            <div class="badge-item">
              <span class="b-icon">⛓️</span>
              <span class="b-text">首尾字母链条</span>
            </div>
            <div class="badge-item">
              <span class="b-icon">🧙‍♂️</span>
              <span class="b-text">智慧守护者对决</span>
            </div>
            <div class="badge-item">
              <span class="b-icon">💡</span>
              <span class="b-text">灵语锦囊提示</span>
            </div>
            <div class="badge-item">
              <span class="b-icon">🏆</span>
              <span class="b-text">全服接龙天梯</span>
            </div>
          </div>

          <!-- 词书选择 -->
          <div class="diff-container book-select-container">
            <div class="section-tag">
              <span>✦ 修习灵语词库 (VOCABULARY BOOK) ✦</span>
              <span class="active-book-tag">{{ currentBookObj.name }}</span>
            </div>
            <div class="book-pill-grid">
              <button
                v-for="b in VOCAB_BOOKS"
                :key="b.id"
                class="chain-book-pill"
                :class="{ active: selectedBookId === b.id }"
                @click="selectedBookId = b.id"
                :title="b.desc"
              >
                <span class="pill-icon">{{ b.icon }}</span>
                <span class="pill-name">{{ b.name.split(' ')[0] }}</span>
              </button>
            </div>
          </div>

          <!-- 难度选择 -->
          <div class="diff-container">
            <div class="section-tag">✦ 选择挑战阶位 (CHOOSE DIFFICULTY) ✦</div>
            <div class="diff-grid">
              <div
                v-for="d in DIFFICULTY_TIERS"
                :key="d.key"
                class="diff-card"
                :class="[d.key.toLowerCase(), { active: selectedDiff === d.key }]"
                @click="selectedDiff = d.key"
              >
                <div class="diff-card-head">
                  <span class="diff-icon">{{ d.icon }}</span>
                  <span class="diff-name">{{ d.name }}</span>
                </div>
                <div class="diff-sub">{{ d.sub }}</div>
                <div class="diff-specs">
                  <span>⏱️ {{ d.timerSec }}s / 回合</span>
                  <span>📏 最短 {{ d.minLen }} 字母</span>
                  <span>💡 {{ d.hints }} 次锦囊</span>
                </div>
                <div class="diff-mult">得点倍率 ×{{ d.multiplier }}</div>
              </div>
            </div>
          </div>

          <!-- 底部开始按钮 -->
          <div class="ready-btn-group">
            <button class="btn-glow-primary" @click="startGame">
              ⚔️ 开启灵语对决 (START DUEL)
            </button>
            <button class="btn-glow-secondary" @click="showLeaderboard = true">
              🏆 荣誉榜单 (LEADERBOARD)
            </button>
          </div>
        </div>

        <!-- 2. 对决进行中 (PLAYING) -->
        <div v-else-if="gameState === 'PLAYING'" class="screen-box screen-playing">
          <!-- 顶部状态信息板 -->
          <div class="battle-dashboard">
            <!-- 玩家状态 -->
            <div class="combatant-panel player-side">
              <div class="avatar-box">🧙‍♂️</div>
              <div class="combatant-info">
                <div class="combatant-name">{{ playerName }}</div>
                <div class="hearts-row">
                  <span v-for="i in 3" :key="'p'+i" class="heart-icon" :class="{ empty: i > playerHp }">
                    {{ i <= playerHp ? '💖' : '🖤' }}
                  </span>
                  <span v-for="i in shieldCount" :key="'s'+i" class="shield-icon" title="魔法护盾">🛡️</span>
                </div>
              </div>
            </div>

            <!-- 中央核心计时与连环计数 -->
            <div class="center-metrics">
              <div class="chain-counter">
                <span class="metric-label">连环链数</span>
                <span class="metric-num">#{{ chainCount }}</span>
              </div>
              <div class="turn-indicator" :class="isPlayerTurn ? 'turn-player' : 'turn-ai'">
                {{ isPlayerTurn ? '👉 你的回合' : '⏳ 守护者思考中...' }}
              </div>
              <div class="timer-display" :class="{ urgent: isPlayerTurn && turnTimeLeft <= 4 }">
                <span class="time-val">{{ isPlayerTurn ? turnTimeLeft : '--' }}</span>
                <span class="time-unit">s</span>
              </div>
            </div>

            <!-- AI 守护者状态 -->
            <div class="combatant-panel ai-side">
              <div class="combatant-info text-right">
                <div class="combatant-name">{{ aiName }}</div>
                <div class="hearts-row justify-end">
                  <span v-for="i in 3" :key="'a'+i" class="heart-icon" :class="{ empty: i > aiHp }">
                    {{ i <= aiHp ? '💜' : '🖤' }}
                  </span>
                </div>
              </div>
              <div class="avatar-box ai-avatar">🦉</div>
            </div>
          </div>

          <!-- 中部：魔法连环历史链条轨道 -->
          <div class="chain-track-container" ref="chainTrackRef">
            <div class="track-header">
              <span>✦ 灵语共鸣锁链 (RESONANCE CHAIN) ✦</span>
              <span class="score-badge">SCORE: {{ currentScore }}</span>
            </div>

            <div class="chain-links-row">
              <div
                v-for="(item, idx) in wordHistory"
                :key="idx"
                class="chain-node"
                :class="item.by === 'PLAYER' ? 'node-player' : 'node-ai'"
              >
                <div class="node-speaker-tag">
                  {{ item.by === 'PLAYER' ? 'YOU' : 'AI' }}
                </div>
                <div class="node-word">
                  <span class="char-first">{{ item.word[0].toUpperCase() }}</span>
                  <span class="char-mid">{{ item.word.slice(1, -1).toUpperCase() }}</span>
                  <span class="char-last">{{ item.word.slice(-1).toUpperCase() }}</span>
                </div>
                <div v-if="idx < wordHistory.length - 1" class="node-connector">➜</div>
              </div>
            </div>
          </div>

          <!-- 当前接龙目标要求看板 -->
          <div class="target-requirement-card">
            <div class="target-rule-lead">
              请接出以
              <span class="target-letter-spotlight">{{ requiredLetter.toUpperCase() }}</span>
              开头的单词：
            </div>
            <div class="target-rule-detail">
              （上一词结尾为 <strong>{{ requiredLetter.toUpperCase() }}</strong>，长度 ≥ {{ currentTierConfig.minLen }} 字母）
            </div>
          </div>

          <!-- 底部输入与操作区域 -->
          <div class="action-dock">
            <!-- 错误与提示气泡 -->
            <Transition name="bounce">
              <div v-if="actionFeedback" class="feedback-bubble" :class="actionFeedback.type">
                {{ actionFeedback.text }}
              </div>
            </Transition>

            <form class="word-input-form" @submit.prevent="submitPlayerWord">
              <div class="input-wrapper">
                <span class="prefix-pin">{{ requiredLetter.toUpperCase() }}</span>
                <input
                  ref="wordInputRef"
                  v-model="inputWord"
                  type="text"
                  class="chain-input"
                  :placeholder="isPlayerTurn ? `输入以 ${requiredLetter.toUpperCase()} 开头的英语单词...` : '等待守护者回应...'"
                  :disabled="!isPlayerTurn"
                  autocomplete="off"
                  autofocus
                />
              </div>

              <button
                type="submit"
                class="btn-submit-word"
                :disabled="!isPlayerTurn || !inputWord.trim()"
              >
                ⚡ 释放灵语 (CAST)
              </button>

              <!-- 灵语锦囊 (提示) -->
              <button
                type="button"
                class="btn-hint-spell"
                :disabled="!isPlayerTurn || hintsRemaining <= 0"
                @click="useHintSpell"
                title="消耗一次锦囊，获取有效单词灵感"
              >
                💡 锦囊 ({{ hintsRemaining }})
              </button>
            </form>
          </div>

          <!-- 🌟 造句共鸣触发条（接龙成功后浮现 3s） -->
          <Transition name="bounce">
            <div v-if="showResonanceTrigger && !showResonanceModal" class="resonance-trigger-bar" @click="triggerResonance">
              <span class="trigger-icon">⚡</span>
              <span class="trigger-text">造句共鸣！用 <strong>{{ resonanceWord.toUpperCase() }}</strong> 造句获得 3x 暴击！</span>
              <span class="trigger-key">[点击 / 按 SPACE]</span>
            </div>
          </Transition>

          <!-- 🌟 造句共鸣模态面板 -->
          <Transition name="fade">
            <div v-if="showResonanceModal" class="resonance-modal-backdrop" @click.self="skipResonance">
              <div class="resonance-modal-panel">
                <div class="resonance-header">
                  <span class="resonance-title">⚡ 灵语造句共鸣 · SENTENCE RESONANCE</span>
                  <div class="resonance-timer" :class="{ urgent: resonanceTimeLeft <= 5 }">
                    {{ resonanceTimeLeft }}s
                  </div>
                </div>

                <div class="resonance-prompt">
                  用 <span class="keyword-highlight">{{ resonanceWord.toUpperCase() }}</span> 或其变形写一个英文句子，获得 <strong>3x 暴击得分</strong> + <strong>🛡️ 魔法护盾</strong>！
                </div>

                <form class="resonance-form" @submit.prevent="submitSentence">
                  <input
                    v-model="sentenceInput"
                    type="text"
                    class="resonance-input"
                    :placeholder="`Write a sentence with '${resonanceWord}'...`"
                    autocomplete="off"
                    autofocus
                  />
                  <div class="resonance-btn-row">
                    <button type="submit" class="btn-resonance-submit" :disabled="!sentenceInput.trim()">
                      ⚡ 释放共鸣 (RESONATE)
                    </button>
                    <button type="button" class="btn-resonance-skip" @click="skipResonance">
                      跳过 (SKIP)
                    </button>
                  </div>
                </form>

                <Transition name="bounce">
                  <div v-if="resonanceFeedback" class="resonance-feedback" :class="resonanceFeedback.type">
                    {{ resonanceFeedback.text }}
                  </div>
                </Transition>

                <div class="resonance-tips">
                  💡 要求：至少 3 个英文单词 · 需包含主语或动词 · 句末加 <code>. ! ?</code> 获额外 +50 分
                </div>
              </div>
            </div>
          </Transition>
        </div>

        <!-- 3. 对决结算界面 (GAMEOVER) -->
        <div v-else-if="gameState === 'GAMEOVER'" class="screen-box screen-gameover">
          <div class="result-banner" :class="isVictory ? 'victory' : 'defeat'">
            <div class="result-crest">{{ isVictory ? '🏆 灵语大捷！' : '🥀 晶石碎裂' }}</div>
            <div class="result-title">{{ isVictory ? 'YOU DEFEATED THE GUARDIAN' : 'THE SPELL WAS BROKEN' }}</div>
            <div class="result-desc">
              {{ isVictory ? '你以深厚词汇底蕴击败了灵语守护者，神庙为你的智慧闪耀！' : '词穷未及或拼写失误，守护者占据了上风，再接再厉！' }}
            </div>
          </div>

          <!-- 评级徽章与得分矩阵 -->
          <div class="performance-grid">
            <div class="rank-card">
              <div class="rank-letter" :class="'rank-' + finalRank.toLowerCase()">{{ finalRank }}</div>
              <div class="rank-label">阶位评级</div>
            </div>

            <div class="stats-matrix">
              <div class="matrix-cell">
                <span class="m-label">最终总得分</span>
                <span class="m-val highlight">{{ finalScore }}</span>
              </div>
              <div class="matrix-cell">
                <span class="m-label">达成连环数</span>
                <span class="m-val">{{ chainCount }} 环</span>
              </div>
              <div class="matrix-cell">
                <span class="m-label">挑战难度</span>
                <span class="m-val">{{ currentTierConfig.name }}</span>
              </div>
              <div class="matrix-cell">
                <span class="m-label">金币报酬</span>
                <span class="m-val coins">+{{ earnedCoins }} <GameIcon name="coin" :size="13" /></span>
              </div>
            </div>
          </div>

          <!-- 出词复盘抽屉 -->
          <div class="words-recap-box">
            <div class="recap-title">✦ 灵语对决复盘 (WORD CHAIN LOG) · 点击任意单词看卡片与真人发音 ✦</div>
            <div class="recap-tags">
              <div
                v-for="(w, idx) in wordHistory"
                :key="idx"
                class="recap-entry"
              >
                <span
                  class="recap-tag"
                  :class="[
                    w.by === 'PLAYER' ? 'tag-player' : 'tag-ai',
                    { 'tag-boosted': w.boostBonus > 0 }
                  ]"
                  @click="openWordCard(w.word)"
                  title="点击查看音标、中文释义与真人发音"
                >
                  {{ w.word.toUpperCase() }}
                  <span class="recap-lookup-icon"><GameIcon name="speaker" :size="12" /></span>
                  <span v-if="w.boostBonus > 0" class="boost-badge">⚡3x</span>
                </span>
                <div v-if="w.sentence" class="recap-sentence">
                  "{{ w.sentence }}" <span class="boost-score">+{{ w.boostBonus }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 操作按钮组 -->
          <div class="gameover-actions">
            <button class="btn-glow-primary" @click="startGame">
              <span>再次发起对决 (PLAY AGAIN)</span>
            </button>
            <button class="btn-glow-secondary" @click="showLeaderboard = true">
              <GameIcon name="trophy" :size="14" /> <span>查看荣誉天梯 (LEADERBOARD)</span>
            </button>
            <button class="btn-glow-ghost" @click="closeGame">
              <GameIcon name="exit" :size="14" /> <span>返回奇幻大厅 (EXIT)</span>
            </button>
          </div>
        </div>

        <!-- 4. 荣誉榜单弹窗 (LEADERBOARD MODAL) -->
        <Transition name="fade">
          <div v-if="showLeaderboard" class="modal-backdrop" @click.self="showLeaderboard = false">
            <div class="leaderboard-modal">
              <div class="modal-head">
                <div class="modal-title"><GameIcon name="trophy" :size="16" /> <span>灵语连环 · 全服荣誉殿堂</span></div>
                <button class="modal-close" @click="showLeaderboard = false">✕</button>
              </div>

              <div class="leaderboard-table-wrap">
                <table class="leaderboard-table">
                  <thead>
                    <tr>
                      <th style="width: 50px;">排名</th>
                      <th>冒险家</th>
                      <th>难度</th>
                      <th>最大连环</th>
                      <th>得分</th>
                      <th>评级</th>
                      <th>时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="(row, idx) in leaderboardList"
                      :key="idx"
                      :class="{ 'my-recent': row.isRecent }"
                    >
                      <td class="rank-col">
                        <span v-if="idx === 0" class="crown-gold">🥇 1</span>
                        <span v-else-if="idx === 1" class="crown-silver">🥈 2</span>
                        <span v-else-if="idx === 2" class="crown-bronze">🥉 3</span>
                        <span v-else class="rank-num">{{ idx + 1 }}</span>
                      </td>
                      <td class="player-col">
                        <span class="p-name">{{ row.name }}</span>
                        <span v-if="row.isRecent" class="tag-new">本次</span>
                      </td>
                      <td>
                        <span class="diff-tag" :class="row.diff.toLowerCase()">{{ row.diff }}</span>
                      </td>
                      <td class="chain-col">{{ row.chain }} 环</td>
                      <td class="score-col">{{ row.score }}</td>
                      <td>
                        <span class="rank-tag" :class="'rank-' + row.rank.toLowerCase()">{{ row.rank }}</span>
                      </td>
                      <td class="time-col">{{ row.date }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div class="modal-foot">
                <button class="btn-clear-lb" @click="resetLeaderboard">🗑️ 重置榜单记录</button>
                <button class="btn-back-lb" @click="showLeaderboard = false">返回对决</button>
              </div>
            </div>
          </div>
        </Transition>

        <!-- 5. 单词卡片弹窗 (WORD CARD MODAL) -->
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
import { ref, computed, nextTick, onMounted, onUnmounted, watch } from 'vue'
import { useUserStore } from '../../stores/user.js'
import { COMMON_WORDS_SET, WORD_DICT_BY_LETTER, STARTING_SEEDS, isValidWord } from './wordChainDictionary.js'
import { judgeSentence } from './sentenceJudge.js'
import WordCardModal from './WordCardModal.vue'
import GameIcon from '../GameIcon.vue'
import { VOCAB_BOOKS, getCurrentBookId, getWordsByBook } from './dictService.js'

const props = defineProps({
  visible: { type: Boolean, default: false },
  gameInfo: { type: Object, default: () => ({}) }
})

const emit = defineEmits(['close', 'reward'])
const userStore = useUserStore()

// ─── 词书选择状态 ─────────────────────────────────────────────────────────────
const selectedBookId = ref(getCurrentBookId())
const currentBookObj = computed(() => {
  return VOCAB_BOOKS.find(b => b.id === selectedBookId.value) || VOCAB_BOOKS[2]
})

watch(() => props.visible, (v) => {
  if (v) {
    selectedBookId.value = getCurrentBookId()
  }
})

// ─── 单词卡片弹窗 ──────────────────────────────────────────────────────────
const showWordCard = ref(false)
const selectedWordForCard = ref('')

function openWordCard(word) {
  if (!word) return
  selectedWordForCard.value = word
  showWordCard.value = true
}

// ─── 音效合成引擎 (Web Audio API) ──────────────────────────────────────────
class SynthAudio {
  constructor() {
    this.ctx = null
  }
  _init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (AudioCtx) this.ctx = new AudioCtx()
    }
    if (this.ctx?.state === 'suspended') {
      this.ctx.resume()
    }
  }
  playSuccess() {
    this._init()
    if (!this.ctx) return
    const now = this.ctx.currentTime
    const osc1 = this.ctx.createOscillator()
    const osc2 = this.ctx.createOscillator()
    const gain = this.ctx.createGain()

    osc1.type = 'sine'
    osc2.type = 'triangle'
    osc1.frequency.setValueAtTime(523.25, now) // C5
    osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.1) // E5
    osc2.frequency.setValueAtTime(783.99, now + 0.08) // G5
    osc2.frequency.exponentialRampToValueAtTime(1046.50, now + 0.22) // C6

    gain.gain.setValueAtTime(0.18, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35)

    osc1.connect(gain)
    osc2.connect(gain)
    gain.connect(this.ctx.destination)
    osc1.start(now)
    osc2.start(now)
    osc1.stop(now + 0.35)
    osc2.stop(now + 0.35)
  }
  playAiTurn() {
    this._init()
    if (!this.ctx) return
    const now = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(349.23, now) // F4
    osc.frequency.exponentialRampToValueAtTime(440.00, now + 0.15) // A4
    gain.gain.setValueAtTime(0.12, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3)
    osc.connect(gain)
    gain.connect(this.ctx.destination)
    osc.start(now)
    osc.stop(now + 0.3)
  }
  playError() {
    this._init()
    if (!this.ctx) return
    const now = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(160, now)
    osc.frequency.setValueAtTime(120, now + 0.1)
    gain.gain.setValueAtTime(0.2, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28)
    osc.connect(gain)
    gain.connect(this.ctx.destination)
    osc.start(now)
    osc.stop(now + 0.28)
  }
  playTick() {
    this._init()
    if (!this.ctx) return
    const now = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(800, now)
    gain.gain.setValueAtTime(0.06, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05)
    osc.connect(gain)
    gain.connect(this.ctx.destination)
    osc.start(now)
    osc.stop(now + 0.05)
  }
  playVictory() {
    this._init()
    if (!this.ctx) return
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51] // C, E, G, C, E
    notes.forEach((freq, idx) => {
      const t = this.ctx.currentTime + idx * 0.12
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, t)
      gain.gain.setValueAtTime(0.18, t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35)
      osc.connect(gain)
      gain.connect(this.ctx.destination)
      osc.start(t)
      osc.stop(t + 0.35)
    })
  }
  playResonance() {
    this._init()
    if (!this.ctx) return
    // 三和弦琶音 C-E-G + 高八度 C，金色共鸣音效
    const notes = [523.25, 659.25, 783.99, 1046.50]
    notes.forEach((freq, idx) => {
      const t = this.ctx.currentTime + idx * 0.08
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(freq, t)
      gain.gain.setValueAtTime(0.22, t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5)
      osc.connect(gain)
      gain.connect(this.ctx.destination)
      osc.start(t)
      osc.stop(t + 0.5)
    })
  }
  playShieldBreak() {
    this._init()
    if (!this.ctx) return
    const now = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = 'square'
    osc.frequency.setValueAtTime(440, now)
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.15)
    gain.gain.setValueAtTime(0.12, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22)
    osc.connect(gain)
    gain.connect(this.ctx.destination)
    osc.start(now)
    osc.stop(now + 0.22)
  }
}
const audio = new SynthAudio()

// ─── 难度配置 ──────────────────────────────────────────────────────────────
const DIFFICULTY_TIERS = [
  {
    key: 'EASY',
    name: '见习学徒',
    sub: 'Apprentice',
    icon: '🟢',
    timerSec: 20,
    minLen: 3,
    hints: 2,
    multiplier: 1.0,
    aiDelay: 1600
  },
  {
    key: 'NORMAL',
    name: '魔法学者',
    sub: 'Scholar',
    icon: '🟡',
    timerSec: 14,
    minLen: 4,
    hints: 1,
    multiplier: 1.5,
    aiDelay: 1200
  },
  {
    key: 'HARD',
    name: '大魔导师',
    sub: 'Archmage',
    icon: '🔴',
    timerSec: 9,
    minLen: 5,
    hints: 0,
    multiplier: 2.0,
    aiDelay: 900
  }
]

// ─── 核心响应式状态 ────────────────────────────────────────────────────────
const gameState = ref('READY') // 'READY' | 'PLAYING' | 'GAMEOVER'
const selectedDiff = ref('NORMAL')
const isPlayerTurn = ref(true)
const turnTimeLeft = ref(15)
const playerHp = ref(3)
const aiHp = ref(3)
const currentScore = ref(0)
const chainCount = ref(0)
const hintsRemaining = ref(1)

const wordHistory = ref([]) // Array<{ word: string, by: 'PLAYER'|'AI' }>
const usedWords = ref(new Set())
const inputWord = ref('')
const actionFeedback = ref(null) // { text: string, type: 'error'|'success'|'hint' }
const showLeaderboard = ref(false)

// ─── 造句共鸣 & 护盾系统 ──────────────────────────────────────────────────
const shieldCount = ref(0)
const showResonanceModal = ref(false)
const resonanceWord = ref('')
const sentenceInput = ref('')
const resonanceTimeLeft = ref(15)
const resonanceFeedback = ref(null) // { text, type }
const showResonanceTrigger = ref(false) // 3s trigger bar after chain success

let resonanceTimer = null
let resonanceTriggerTimer = null
const wordInputRef = ref(null)
const chainTrackRef = ref(null)

let turnTimer = null
let aiTimeout = null
let feedbackTimeout = null

const playerName = computed(() => userStore.user?.nickname || userStore.user?.username || 'Hero')
const aiName = computed(() => '灵语守护者 (Athena)')

const currentTierConfig = computed(() => {
  return DIFFICULTY_TIERS.find(t => t.key === selectedDiff.value) || DIFFICULTY_TIERS[1]
})

const requiredLetter = computed(() => {
  if (wordHistory.value.length === 0) return 'm'
  const last = wordHistory.value[wordHistory.value.length - 1].word
  return last.slice(-1).toLowerCase()
})

const isVictory = computed(() => aiHp.value <= 0)

const finalRank = computed(() => {
  if (chainCount.value >= 18 && isVictory.value) return 'S'
  if (chainCount.value >= 12) return 'A'
  if (chainCount.value >= 6) return 'B'
  return 'C'
})

const finalScore = computed(() => currentScore.value)

const earnedCoins = computed(() => {
  const base = isVictory.value ? 25 : 8
  const mult = currentTierConfig.value.multiplier
  return Math.round((base + chainCount.value * 2) * mult)
})

// ─── 游戏流程控制 ──────────────────────────────────────────────────────────
function startGame() {
  gameState.value = 'PLAYING'
  playerHp.value = 3
  aiHp.value = 3
  currentScore.value = 0
  chainCount.value = 0
  inputWord.value = ''
  actionFeedback.value = null
  usedWords.value = new Set()
  wordHistory.value = []
  hintsRemaining.value = currentTierConfig.value.hints
  shieldCount.value = 0
  showResonanceModal.value = false
  showResonanceTrigger.value = false
  resonanceFeedback.value = null
  clearTimeout(resonanceTriggerTimer)
  clearInterval(resonanceTimer)

  // 随机挑选一个优质起始词（如 magic, crystal, dragon, star...）
  const seed = STARTING_SEEDS[Math.floor(Math.random() * STARTING_SEEDS.length)]
  wordHistory.value.push({ word: seed, by: 'AI' })
  usedWords.value.add(seed.toLowerCase())
  chainCount.value = 1

  // 轮到玩家
  startPlayerTurn()
}

function startPlayerTurn() {
  clearTimers()
  isPlayerTurn.value = true
  turnTimeLeft.value = currentTierConfig.value.timerSec
  inputWord.value = ''
  actionFeedback.value = null

  nextTick(() => {
    wordInputRef.value?.focus?.()
    scrollChainToRight()
  })

  // 启动倒计时
  turnTimer = setInterval(() => {
    turnTimeLeft.value--
    if (turnTimeLeft.value <= 4 && turnTimeLeft.value > 0) {
      audio.playTick()
    }
    if (turnTimeLeft.value <= 0) {
      handlePlayerTimeout()
    }
  }, 1000)
}

function handlePlayerTimeout() {
  clearTimers()

  // 护盾优先消耗
  if (shieldCount.value > 0) {
    shieldCount.value--
    audio.playShieldBreak()
    setFeedback(`🛡️ 魔法护盾碎裂！挡住了一次失误！（剩余 ${shieldCount.value} 枚）`, 'hint')
    // 守护者给予一次接替援助
    setTimeout(() => { aiAutoPlayFallback() }, 1200)
    return
  }

  audio.playError()
  playerHp.value--
  setFeedback(`⏰ 时间耗尽！失去 1 点生命！`, 'error')

  if (playerHp.value <= 0) {
    endGame()
    return
  }

  // 守护者给予一次接替援助，出新词后重新把回合给玩家
  setTimeout(() => {
    aiAutoPlayFallback()
  }, 1200)
}

function submitPlayerWord() {
  if (!isPlayerTurn.value) return
  const raw = inputWord.value.trim().toLowerCase()
  if (!raw) return

  const reqChar = requiredLetter.value.toLowerCase()
  const minL = currentTierConfig.value.minLen

  // 1. 首字母检查
  if (raw[0] !== reqChar) {
    audio.playError()
    setFeedback(`❌ 首字母错误！必须以 '${reqChar.toUpperCase()}' 开头！`, 'error')
    return
  }

  // 2. 长度检查
  if (raw.length < minL) {
    audio.playError()
    setFeedback(`❌ 词长过短！当前难度需要至少 ${minL} 个字母！`, 'error')
    return
  }

  // 3. 重复使用检查
  if (usedWords.value.has(raw)) {
    audio.playError()
    setFeedback(`❌ 单词 '${raw.toUpperCase()}' 已经被使用过！`, 'error')
    return
  }

  // 4. 字典合法性检查（支持派生时态与词根还原）
  if (!isValidWord(raw)) {
    audio.playError()
    setFeedback(`❌ 词库未收录 '${raw.toUpperCase()}'，请拼写规范英语单词！`, 'error')
    return
  }

  // 验证通过！
  clearTimers()
  audio.playSuccess()
  usedWords.value.add(raw)
  chainCount.value++

  // 积分计算：长度分 + 剩余时间加成分 * 倍率
  const lengthBonus = raw.length * 25
  const speedBonus = turnTimeLeft.value * 10
  const baseGain = Math.round((lengthBonus + speedBonus) * currentTierConfig.value.multiplier)
  currentScore.value += baseGain

  // 将本轮单词及基础分记入历史
  wordHistory.value.push({ word: raw, by: 'PLAYER', baseGain, sentence: null, boostBonus: 0 })

  setFeedback(`✨ 灵语链接成功！+${baseGain} 分！`, 'success')
  inputWord.value = ''
  isPlayerTurn.value = false

  nextTick(() => scrollChainToRight())

  // 🌟 造句共鸣触发条（3 秒内可点击发起）
  resonanceWord.value = raw
  showResonanceTrigger.value = true
  clearTimeout(resonanceTriggerTimer)
  resonanceTriggerTimer = setTimeout(() => {
    // 3 秒未响应，自动跳过进入 AI 回合
    if (showResonanceTrigger.value && !showResonanceModal.value) {
      skipResonance()
    }
  }, 3000)
}

function triggerAiTurn() {
  clearTimers()
  const reqChar = requiredLetter.value.toLowerCase()
  const minL = currentTierConfig.value.minLen
  const candidates = WORD_DICT_BY_LETTER[reqChar] || []

  // 筛选未使用的合适词汇
  const available = candidates.filter(w => !usedWords.value.has(w) && w.length >= minL)

  // 优先挑选属于当前修习词书的单词，增强主题性与学习相关度
  const bookWords = getWordsByBook(selectedBookId.value).map(i => i.word.toLowerCase())
  const bookSet = new Set(bookWords)
  const bookCandidates = available.filter(w => bookSet.has(w))

  if (available.length === 0) {
    // AI 接不上！AI 扣除生命值！
    audio.playSuccess()
    aiHp.value--
    setFeedback(`🎉 守护者无法接出 '${reqChar.toUpperCase()}'！守护者受到重创！`, 'success')

    if (aiHp.value <= 0) {
      endGame()
      return
    }

    // AI 消耗一点能量重新洗牌一个起始词，继续给玩家回合
    const fallbackSeed = STARTING_SEEDS[Math.floor(Math.random() * STARTING_SEEDS.length)]
    wordHistory.value.push({ word: fallbackSeed, by: 'AI' })
    usedWords.value.add(fallbackSeed.toLowerCase())
    chainCount.value++

    setTimeout(() => startPlayerTurn(), 1200)
    return
  }

  // AI 策略性选词：根据难度挑选（优先从当前修习词书中选择）
  const pool = bookCandidates.length > 0 ? bookCandidates : available
  let chosenWord
  if (selectedDiff.value === 'HARD') {
    // 尽量挑选长词，或尾字母是生僻字母（x, y, w, z, k）的词施加压力
    const tricky = pool.filter(w => ['x', 'y', 'w', 'k', 'v'].includes(w.slice(-1)))
    chosenWord = (tricky.length > 0)
      ? tricky[Math.floor(Math.random() * tricky.length)]
      : pool[Math.floor(Math.random() * pool.length)]
  } else {
    // 随机挑选
    chosenWord = pool[Math.floor(Math.random() * pool.length)]
  }

  audio.playAiTurn()
  usedWords.value.add(chosenWord.toLowerCase())
  wordHistory.value.push({ word: chosenWord, by: 'AI' })
  chainCount.value++

  nextTick(() => scrollChainToRight())

  // 轮回玩家
  setTimeout(() => {
    startPlayerTurn()
  }, 700)
}

function aiAutoPlayFallback() {
  const reqChar = requiredLetter.value.toLowerCase()
  const candidates = (WORD_DICT_BY_LETTER[reqChar] || []).filter(w => !usedWords.value.has(w))
  const pick = candidates.length > 0 ? candidates[0] : 'wizard'
  usedWords.value.add(pick.toLowerCase())
  wordHistory.value.push({ word: pick, by: 'AI' })
  chainCount.value++
  nextTick(() => scrollChainToRight())
  startPlayerTurn()
}

function useHintSpell() {
  if (hintsRemaining.value <= 0 || !isPlayerTurn.value) return
  const reqChar = requiredLetter.value.toLowerCase()
  const minL = currentTierConfig.value.minLen
  const candidates = (WORD_DICT_BY_LETTER[reqChar] || []).filter(w => !usedWords.value.has(w) && w.length >= minL)

  if (candidates.length === 0) {
    setFeedback(`🔮 灵语迷雾笼罩，未探寻到有效提示！`, 'error')
    return
  }

  hintsRemaining.value--
  const suggestion = candidates[Math.floor(Math.random() * candidates.length)]
  inputWord.value = suggestion
  setFeedback(`💡 灵语锦囊指引：试试 '${suggestion.toUpperCase()}'！`, 'hint')
  nextTick(() => wordInputRef.value?.focus?.())
}

// ─── 造句共鸣系统 ──────────────────────────────────────────────────────────
function triggerResonance() {
  showResonanceTrigger.value = false
  clearTimeout(resonanceTriggerTimer)
  showResonanceModal.value = true
  sentenceInput.value = ''
  resonanceFeedback.value = null
  resonanceTimeLeft.value = 15

  // 启动 15 秒造句倒计时
  clearInterval(resonanceTimer)
  resonanceTimer = setInterval(() => {
    resonanceTimeLeft.value--
    if (resonanceTimeLeft.value <= 3 && resonanceTimeLeft.value > 0) {
      audio.playTick()
    }
    if (resonanceTimeLeft.value <= 0) {
      // 时间耗尽，自动跳过
      skipResonance()
    }
  }, 1000)
}

function submitSentence() {
  if (!showResonanceModal.value) return
  const result = judgeSentence(sentenceInput.value, resonanceWord.value)

  if (!result.passed) {
    resonanceFeedback.value = { text: result.message, type: 'error' }
    return
  }

  // 造句成功！
  clearInterval(resonanceTimer)
  showResonanceModal.value = false
  audio.playResonance()

  // 3x 暴击加分（基于本轮基础分）
  const lastEntry = wordHistory.value[wordHistory.value.length - 1]
  const boostGain = lastEntry.baseGain * 2 // 额外 2x，加上原本 1x = 总共 3x
  const punctBonus = result.punctuationBonus ? 50 : 0
  const totalBoost = boostGain + punctBonus
  currentScore.value += totalBoost

  // 获得 1 枚魔法护盾
  shieldCount.value++

  // 记录造句数据到历史条目
  lastEntry.sentence = sentenceInput.value.trim()
  lastEntry.boostBonus = totalBoost

  const msg = result.punctuationBonus
    ? `🌟 造句共鸣暴击！3x 得分 +${totalBoost}（含标点规范奖 +50）！获得 🛡️ 魔法护盾！`
    : `🌟 造句共鸣暴击！3x 得分 +${totalBoost}！获得 🛡️ 魔法护盾！`
  setFeedback(msg, 'success')

  // 进入 AI 回合
  proceedToAiTurn()
}

function skipResonance() {
  clearInterval(resonanceTimer)
  showResonanceModal.value = false
  showResonanceTrigger.value = false
  resonanceFeedback.value = null

  // 直接进入 AI 回合
  proceedToAiTurn()
}

function proceedToAiTurn() {
  showResonanceTrigger.value = false
  aiTimeout = setTimeout(() => {
    triggerAiTurn()
  }, currentTierConfig.value.aiDelay)
}

function setFeedback(text, type = 'error') {
  clearTimeout(feedbackTimeout)
  actionFeedback.value = { text, type }
  feedbackTimeout = setTimeout(() => {
    actionFeedback.value = null
  }, 2800)
}

function scrollChainToRight() {
  if (chainTrackRef.value) {
    chainTrackRef.value.scrollLeft = chainTrackRef.value.scrollWidth + 200
  }
}

function clearTimers() {
  clearInterval(turnTimer)
  clearTimeout(aiTimeout)
  clearInterval(resonanceTimer)
  clearTimeout(resonanceTriggerTimer)
}

function endGame() {
  clearTimers()
  gameState.value = 'GAMEOVER'

  if (isVictory.value) {
    audio.playVictory()
  } else {
    audio.playError()
  }

  // 发放结算奖励给 Vue 层
  emit('reward', {
    coins: earnedCoins.value,
    score: finalScore.value,
    rank: finalRank.value
  })

  // 保存记录到荣誉排行榜
  recordLeaderboard()
}

function closeGame() {
  clearTimers()
  gameState.value = 'READY'
  emit('close')
}

function handleOverlayClick() {
  // 点击遮罩安全关闭（游戏进行中防误触）
  if (gameState.value !== 'PLAYING') {
    closeGame()
  }
}

// ─── 荣誉天梯榜单逻辑 ──────────────────────────────────────────────────────
const LB_STORAGE_KEY = 'linguaverse_wordchain_leaderboard'
const leaderboardList = ref([])

function loadLeaderboard() {
  try {
    const raw = localStorage.getItem(LB_STORAGE_KEY)
    if (raw) {
      leaderboardList.value = JSON.parse(raw)
    } else {
      leaderboardList.value = [
        { name: 'Luna (Master)', diff: 'HARD', chain: 24, score: 3250, rank: 'S', date: '09-09 12:10' },
        { name: 'Mary (Guide)', diff: 'NORMAL', chain: 16, score: 1820, rank: 'A', date: '09-08 17:40' },
        { name: 'Archmage Puck', diff: 'HARD', chain: 14, score: 1540, rank: 'A', date: '09-08 14:22' },
        { name: 'Echo Wanderer', diff: 'NORMAL', chain: 9, score: 980, rank: 'B', date: '09-07 19:15' },
        { name: 'Star Apprentice', diff: 'EASY', chain: 5, score: 420, rank: 'C', date: '09-07 10:05' }
      ]
      saveLeaderboard()
    }
  } catch (e) {
    console.error('加载单词接龙排行榜失败', e)
  }
}

function saveLeaderboard() {
  try {
    localStorage.setItem(LB_STORAGE_KEY, JSON.stringify(leaderboardList.value))
  } catch (e) {
    console.error('保存单词接龙排行榜失败', e)
  }
}

function recordLeaderboard() {
  loadLeaderboard()
  const d = new Date()
  const dateStr = `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`

  // 清除旧的 isRecent 标记
  leaderboardList.value.forEach(r => r.isRecent = false)

  leaderboardList.value.push({
    name: playerName.value,
    diff: currentTierConfig.value.key,
    chain: chainCount.value,
    score: finalScore.value,
    rank: finalRank.value,
    date: dateStr,
    isRecent: true
  })

  // 排序：先得分、再链长
  leaderboardList.value.sort((a, b) => b.score - a.score || b.chain - a.chain)
  // 只保留 Top 10
  leaderboardList.value = leaderboardList.value.slice(0, 10)
  saveLeaderboard()
}

function resetLeaderboard() {
  localStorage.removeItem(LB_STORAGE_KEY)
  loadLeaderboard()
}

watch(() => props.visible, (val) => {
  if (val) {
    loadLeaderboard()
    gameState.value = 'READY'
  } else {
    clearTimers()
  }
})

onMounted(() => {
  loadLeaderboard()
  window.addEventListener('keydown', handleResonanceKeydown)
})

onUnmounted(() => {
  clearTimers()
  window.removeEventListener('keydown', handleResonanceKeydown)
})

function handleResonanceKeydown(e) {
  // SPACE 键触发造句共鸣（仅当触发条可见时）
  if (e.code === 'Space' && showResonanceTrigger.value && !showResonanceModal.value) {
    e.preventDefault()
    triggerResonance()
  }
}
</script>

<style scoped>
.wordchain-overlay {
  position: fixed;
  inset: 0;
  background: rgba(10, 8, 24, 0.88);
  backdrop-filter: blur(8px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  animation: overlayFadeIn 0.25s ease-out;
}

@keyframes overlayFadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

.chain-cabinet {
  width: 900px;
  max-width: 96vw;
  height: 640px;
  max-height: 92vh;
  background: linear-gradient(180deg, #18112c 0%, #0f0a1c 100%);
  border: 2px solid #8b5cf6;
  box-shadow: 0 0 35px rgba(139, 92, 246, 0.4), 0 25px 50px -12px rgba(0, 0, 0, 0.8);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

/* 顶部装饰栏 */
.cabinet-header {
  height: 48px;
  background: #1e1438;
  border-bottom: 1px solid rgba(139, 92, 246, 0.3);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rune-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}
.rune-dot.purple { background: #c084fc; box-shadow: 0 0 8px #c084fc; }
.rune-dot.cyan   { background: #22d3ee; box-shadow: 0 0 8px #22d3ee; }
.rune-dot.gold   { background: #fbbf24; box-shadow: 0 0 8px #fbbf24; }

.cabinet-title {
  font-size: 14px;
  font-weight: 800;
  color: #e9d5ff;
  letter-spacing: 1px;
  margin-left: 6px;
}

.cabinet-close-btn {
  background: transparent;
  border: none;
  color: #a855f7;
  font-size: 18px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.2s;
}
.cabinet-close-btn:hover {
  background: rgba(168, 85, 247, 0.2);
  color: #fff;
}

.screen-box {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

/* ─── READY 准备界面 ──────────────────────────────────────────────────────── */
.screen-ready {
  padding: 24px 36px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 16px;
}

.ready-hero {
  text-align: center;
}

.glow-pill {
  display: inline-block;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 2px;
  color: #c084fc;
  background: rgba(192, 132, 252, 0.15);
  border: 1px solid rgba(192, 132, 252, 0.4);
  padding: 4px 14px;
  border-radius: 20px;
  margin-bottom: 8px;
}

.hero-title {
  font-size: 38px;
  font-weight: 900;
  color: #fff;
  letter-spacing: 2px;
  margin: 0;
  text-shadow: 0 0 20px rgba(168, 85, 247, 0.7);
}

.hero-subtitle {
  font-size: 14px;
  font-weight: 700;
  color: #a855f7;
  letter-spacing: 6px;
  margin-top: 2px;
}

.hero-desc {
  font-size: 13px;
  line-height: 1.6;
  color: #cbd5e1;
  max-width: 680px;
  margin: 10px auto 0;
}

.hero-badges {
  display: flex;
  justify-content: center;
  gap: 16px;
}

.badge-item {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(139, 92, 246, 0.12);
  border: 1px solid rgba(139, 92, 246, 0.25);
  padding: 6px 14px;
  border-radius: 20px;
  color: #e2e8f0;
  font-size: 12px;
}

.diff-container {
  text-align: center;
}

.book-select-container {
  margin-bottom: 18px;
}

.active-book-tag {
  float: right;
  font-size: 11px;
  color: #c084fc;
  background: rgba(168, 85, 247, 0.15);
  border: 1px solid rgba(168, 85, 247, 0.35);
  padding: 1px 8px;
  border-radius: 10px;
}

.book-pill-grid {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.chain-book-pill {
  flex: 1;
  min-width: 85px;
  background: rgba(30, 20, 56, 0.6);
  border: 1.5px solid rgba(139, 92, 246, 0.28);
  border-radius: 10px;
  padding: 8px 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  color: #94a3b8;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.chain-book-pill:hover {
  background: rgba(139, 92, 246, 0.2);
  border-color: #c084fc;
  color: #e9d5ff;
}

.chain-book-pill.active {
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.28), rgba(99, 102, 241, 0.25));
  border-color: #a855f7;
  color: #f5d0fe;
  box-shadow: 0 0 14px rgba(168, 85, 247, 0.4);
  transform: translateY(-1px);
}

.pill-icon {
  font-size: 14px;
}

.section-tag {
  font-size: 12px;
  font-weight: 800;
  color: #94a3b8;
  letter-spacing: 1.5px;
  margin-bottom: 12px;
}

.diff-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}

.diff-card {
  background: rgba(30, 20, 56, 0.6);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 12px;
  padding: 14px;
  cursor: pointer;
  text-align: left;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.diff-card:hover {
  transform: translateY(-2px);
  border-color: #c084fc;
  box-shadow: 0 0 16px rgba(192, 132, 252, 0.25);
}

.diff-card.active {
  background: rgba(139, 92, 246, 0.25);
  border-color: #a855f7;
  box-shadow: 0 0 20px rgba(168, 85, 247, 0.45);
}

.diff-card-head {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 800;
  color: #fff;
}

.diff-sub {
  font-size: 11px;
  color: #94a3b8;
}

.diff-specs {
  display: flex;
  flex-direction: column;
  gap: 3px;
  font-size: 11px;
  color: #cbd5e1;
  margin: 4px 0;
}

.diff-mult {
  font-size: 12px;
  font-weight: 800;
  color: #fbbf24;
  margin-top: auto;
}

.ready-btn-group {
  display: flex;
  gap: 16px;
  justify-content: center;
}

/* 按钮风格 */
.btn-glow-primary {
  background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%);
  border: 1px solid #c084fc;
  color: #fff;
  font-size: 15px;
  font-weight: 800;
  padding: 12px 32px;
  border-radius: 26px;
  cursor: pointer;
  box-shadow: 0 0 20px rgba(124, 58, 237, 0.5);
  transition: all 0.2s;
}
.btn-glow-primary:hover {
  transform: scale(1.03);
  box-shadow: 0 0 28px rgba(124, 58, 237, 0.8);
}

.btn-glow-secondary {
  background: rgba(30, 20, 56, 0.8);
  border: 1px solid #8b5cf6;
  color: #e9d5ff;
  font-size: 14px;
  font-weight: 700;
  padding: 12px 24px;
  border-radius: 26px;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-glow-secondary:hover {
  background: rgba(139, 92, 246, 0.2);
  color: #fff;
}

.btn-glow-ghost {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #94a3b8;
  font-size: 13px;
  padding: 10px 20px;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-glow-ghost:hover {
  border-color: #fff;
  color: #fff;
}

/* ─── PLAYING 游戏界面 ────────────────────────────────────────────────────── */
.screen-playing {
  padding: 16px 24px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 12px;
}

.battle-dashboard {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(24, 15, 48, 0.7);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 12px;
  padding: 10px 16px;
}

.combatant-panel {
  display: flex;
  align-items: center;
  gap: 10px;
}

.avatar-box {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  border: 2px solid #60a5fa;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  box-shadow: 0 0 12px rgba(59, 130, 246, 0.5);
}

.avatar-box.ai-avatar {
  background: linear-gradient(135deg, #a855f7 0%, #6b21a8 100%);
  border-color: #c084fc;
  box-shadow: 0 0 12px rgba(168, 85, 247, 0.5);
}

.combatant-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.combatant-name {
  font-size: 13px;
  font-weight: 800;
  color: #fff;
}

.hearts-row {
  display: flex;
  gap: 3px;
  font-size: 14px;
}
.hearts-row.justify-end { justify-content: flex-end; }
.heart-icon.empty { filter: grayscale(1) opacity(0.4); }

.center-metrics {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.chain-counter {
  display: flex;
  align-items: center;
  gap: 6px;
}
.metric-label { font-size: 11px; color: #94a3b8; font-weight: 700; }
.metric-num { font-size: 16px; font-weight: 900; color: #fbbf24; }

.turn-indicator {
  font-size: 12px;
  font-weight: 800;
  padding: 3px 12px;
  border-radius: 12px;
}
.turn-player { background: rgba(34, 197, 94, 0.2); color: #4ade80; border: 1px solid #4ade80; }
.turn-ai { background: rgba(168, 85, 247, 0.2); color: #c084fc; border: 1px solid #c084fc; }

.timer-display {
  display: flex;
  align-items: baseline;
  gap: 2px;
}
.time-val { font-size: 24px; font-weight: 900; color: #38bdf8; font-family: monospace; }
.time-unit { font-size: 12px; color: #94a3b8; font-weight: 700; }
.timer-display.urgent .time-val {
  color: #ef4444;
  animation: pulseUrgent 0.5s infinite alternate;
}
@keyframes pulseUrgent {
  from { transform: scale(1); }
  to { transform: scale(1.18); }
}

/* 链条历史视轨 */
.chain-track-container {
  background: rgba(18, 11, 38, 0.85);
  border: 1px solid rgba(139, 92, 246, 0.35);
  border-radius: 12px;
  padding: 12px 16px;
  overflow-x: auto;
  white-space: nowrap;
  scroll-behavior: smooth;
}

.track-header {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  font-weight: 800;
  color: #a855f7;
  letter-spacing: 1px;
  margin-bottom: 8px;
}
.score-badge { color: #f59e0b; font-size: 12px; }

.chain-links-row {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 4px;
}

.chain-node {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(30, 20, 56, 0.85);
  border-radius: 8px;
  padding: 6px 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
}

.chain-node.node-player {
  border: 1.5px solid #38bdf8;
  background: rgba(14, 116, 144, 0.25);
}

.chain-node.node-ai {
  border: 1.5px solid #a855f7;
  background: rgba(126, 34, 206, 0.25);
}

.node-speaker-tag {
  font-size: 9px;
  font-weight: 800;
  padding: 2px 5px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.35);
  color: #94a3b8;
}

.node-word {
  font-size: 15px;
  font-weight: 800;
  font-family: monospace;
  letter-spacing: 1px;
}
.char-first { color: #22d3ee; font-weight: 900; }
.char-mid   { color: #ffffff; }
.char-last  { color: #f59e0b; font-weight: 900; }

.node-connector {
  color: #a855f7;
  font-size: 14px;
  margin-left: 2px;
}

/* 目标要求卡 */
.target-requirement-card {
  background: linear-gradient(135deg, rgba(76, 29, 149, 0.3) 0%, rgba(30, 27, 75, 0.4) 100%);
  border: 1px dashed rgba(168, 85, 247, 0.5);
  border-radius: 10px;
  padding: 12px;
  text-align: center;
}

.target-rule-lead {
  font-size: 15px;
  font-weight: 800;
  color: #fff;
}

.target-letter-spotlight {
  display: inline-block;
  font-size: 26px;
  font-weight: 900;
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.2);
  border: 2px solid #f59e0b;
  border-radius: 8px;
  padding: 2px 14px;
  margin: 0 6px;
  box-shadow: 0 0 15px rgba(245, 158, 11, 0.5);
  transform: translateY(-2px);
}

.target-rule-detail {
  font-size: 11px;
  color: #94a3b8;
  margin-top: 4px;
}

/* 输入与操作区 */
.action-dock {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.feedback-bubble {
  position: absolute;
  top: -34px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 12px;
  font-weight: 800;
  padding: 4px 14px;
  border-radius: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  white-space: nowrap;
}
.feedback-bubble.error   { background: #ef4444; color: #fff; }
.feedback-bubble.success { background: #10b981; color: #fff; }
.feedback-bubble.hint    { background: #f59e0b; color: #1e1138; }

.word-input-form {
  display: flex;
  gap: 10px;
  align-items: center;
}

.input-wrapper {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
}

.prefix-pin {
  position: absolute;
  left: 14px;
  font-size: 18px;
  font-weight: 900;
  color: #f59e0b;
  font-family: monospace;
}

.chain-input {
  width: 100%;
  height: 48px;
  background: rgba(18, 11, 38, 0.9);
  border: 2px solid rgba(139, 92, 246, 0.4);
  border-radius: 12px;
  padding: 0 16px 0 38px;
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  font-family: monospace;
  outline: none;
  transition: all 0.2s;
}
.chain-input:focus {
  border-color: #38bdf8;
  box-shadow: 0 0 16px rgba(56, 189, 248, 0.4);
}
.chain-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-submit-word {
  height: 48px;
  padding: 0 24px;
  background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
  border: 1px solid #38bdf8;
  color: #fff;
  font-size: 14px;
  font-weight: 800;
  border-radius: 12px;
  cursor: pointer;
  box-shadow: 0 0 15px rgba(2, 132, 199, 0.4);
  transition: all 0.2s;
  white-space: nowrap;
}
.btn-submit-word:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 0 22px rgba(56, 189, 248, 0.7);
}
.btn-submit-word:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.btn-hint-spell {
  height: 48px;
  padding: 0 16px;
  background: rgba(245, 158, 11, 0.15);
  border: 1px solid #f59e0b;
  color: #fbbf24;
  font-size: 13px;
  font-weight: 800;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}
.btn-hint-spell:hover:not(:disabled) {
  background: rgba(245, 158, 11, 0.3);
  box-shadow: 0 0 14px rgba(245, 158, 11, 0.5);
}
.btn-hint-spell:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

/* ─── GAMEOVER 结算界面 ───────────────────────────────────────────────────── */
.screen-gameover {
  padding: 24px 36px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 16px;
}

.result-banner {
  text-align: center;
  border-radius: 12px;
  padding: 14px;
}
.result-banner.victory {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.18) 0%, rgba(6, 95, 70, 0.3) 100%);
  border: 1px solid #10b981;
}
.result-banner.defeat {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.18) 0%, rgba(153, 27, 27, 0.3) 100%);
  border: 1px solid #ef4444;
}

.result-crest { font-size: 20px; font-weight: 900; margin-bottom: 2px; }
.result-title { font-size: 13px; font-weight: 800; letter-spacing: 2px; color: #94a3b8; }
.result-desc  { font-size: 12px; color: #cbd5e1; margin-top: 4px; }

.performance-grid {
  display: flex;
  gap: 16px;
  align-items: center;
}

.rank-card {
  width: 110px;
  height: 110px;
  border-radius: 16px;
  background: rgba(30, 20, 56, 0.85);
  border: 2px solid #8b5cf6;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 0 20px rgba(139, 92, 246, 0.3);
}

.rank-letter {
  font-size: 48px;
  font-weight: 900;
  line-height: 1;
}
.rank-s { color: #f59e0b; text-shadow: 0 0 15px #f59e0b; }
.rank-a { color: #a855f7; text-shadow: 0 0 15px #a855f7; }
.rank-b { color: #38bdf8; text-shadow: 0 0 15px #38bdf8; }
.rank-c { color: #94a3b8; }

.rank-label {
  font-size: 11px;
  font-weight: 700;
  color: #94a3b8;
  margin-top: 4px;
}

.stats-matrix {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.matrix-cell {
  background: rgba(24, 15, 48, 0.7);
  border: 1px solid rgba(139, 92, 246, 0.25);
  border-radius: 8px;
  padding: 8px 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.m-label { font-size: 11px; color: #94a3b8; }
.m-val   { font-size: 16px; font-weight: 800; color: #fff; }
.m-val.highlight { color: #f59e0b; }
.m-val.coins     { color: #38bdf8; }

.words-recap-box {
  background: rgba(18, 11, 38, 0.8);
  border: 1px solid rgba(139, 92, 246, 0.25);
  border-radius: 10px;
  padding: 10px 14px;
  max-height: 90px;
  overflow-y: auto;
}

.recap-title {
  font-size: 11px;
  font-weight: 800;
  color: #a855f7;
  margin-bottom: 6px;
}

.recap-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.recap-tag {
  font-size: 11px;
  font-family: monospace;
  padding: 2px 8px;
  border-radius: 4px;
}
.tag-player { background: rgba(56, 189, 248, 0.2); border: 1px solid #38bdf8; color: #bae6fd; }
.tag-ai     { background: rgba(168, 85, 247, 0.2); border: 1px solid #a855f7; color: #e9d5ff; }

.gameover-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

/* ─── 荣誉榜单弹窗 ────────────────────────────────────────────────────────── */
.modal-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(8, 4, 18, 0.85);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 20px;
}

.leaderboard-modal {
  width: 680px;
  max-width: 90%;
  background: #191230;
  border: 2px solid #a855f7;
  box-shadow: 0 0 30px rgba(168, 85, 247, 0.4);
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  max-height: 85%;
  overflow: hidden;
}

.modal-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 18px;
  background: #241a45;
  border-bottom: 1px solid rgba(168, 85, 247, 0.3);
}

.modal-title {
  font-size: 15px;
  font-weight: 800;
  color: #fff;
}

.modal-close {
  background: transparent;
  border: none;
  color: #a855f7;
  font-size: 18px;
  cursor: pointer;
}

.leaderboard-table-wrap {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.leaderboard-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  color: #cbd5e1;
}

.leaderboard-table th {
  text-align: left;
  padding: 8px 10px;
  color: #94a3b8;
  font-weight: 700;
  border-bottom: 1px solid rgba(139, 92, 246, 0.3);
}

.leaderboard-table td {
  padding: 8px 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.my-recent {
  background: rgba(168, 85, 247, 0.18);
}

.tag-new {
  font-size: 10px;
  background: #ec4899;
  color: #fff;
  padding: 1px 5px;
  border-radius: 4px;
  margin-left: 6px;
}

.diff-tag {
  font-size: 10px;
  font-weight: 800;
  padding: 2px 6px;
  border-radius: 4px;
}
.diff-tag.easy   { background: rgba(34, 197, 94, 0.2); color: #4ade80; }
.diff-tag.normal { background: rgba(245, 158, 11, 0.2); color: #fbbf24; }
.diff-tag.hard   { background: rgba(239, 68, 68, 0.2); color: #f87171; }

.rank-tag {
  font-weight: 900;
  padding: 2px 6px;
  border-radius: 4px;
}
.rank-tag.rank-s { color: #f59e0b; }
.rank-tag.rank-a { color: #c084fc; }
.rank-tag.rank-b { color: #38bdf8; }
.rank-tag.rank-c { color: #94a3b8; }

.modal-foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 18px;
  background: #1e1438;
  border-top: 1px solid rgba(139, 92, 246, 0.3);
}

.btn-clear-lb {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 12px;
  cursor: pointer;
}
.btn-clear-lb:hover { color: #ef4444; }

.btn-back-lb {
  background: #7c3aed;
  border: none;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  padding: 6px 16px;
  border-radius: 6px;
  cursor: pointer;
}

/* 过渡动画 */
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: all 0.22s ease-out;
}
.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: scale(0.96);
}

.bounce-enter-active {
  animation: bounceIn 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.bounce-leave-active {
  transition: opacity 0.2s ease-in;
}
.bounce-leave-to {
  opacity: 0;
}
@keyframes bounceIn {
  0%   { transform: translate(-50%, 6px) scale(0.85); opacity: 0; }
  100% { transform: translate(-50%, 0) scale(1); opacity: 1; }
}

/* ─── 造句共鸣触发条 ────────────────────────────────────────────────────── */
.resonance-trigger-bar {
  position: absolute;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(90deg, rgba(251, 191, 36, 0.9), rgba(245, 158, 11, 0.95));
  color: #1a0a00;
  padding: 10px 24px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 700;
  box-shadow: 0 0 25px rgba(251, 191, 36, 0.5), 0 4px 16px rgba(0, 0, 0, 0.4);
  animation: resonancePulse 1s ease-in-out infinite alternate;
  z-index: 20;
  white-space: nowrap;
}
.resonance-trigger-bar:hover {
  transform: translateX(-50%) scale(1.04);
  box-shadow: 0 0 35px rgba(251, 191, 36, 0.7);
}
.trigger-icon { font-size: 20px; }
.trigger-key {
  font-size: 11px;
  opacity: 0.7;
  margin-left: 4px;
}

@keyframes resonancePulse {
  0%   { box-shadow: 0 0 15px rgba(251, 191, 36, 0.4); }
  100% { box-shadow: 0 0 30px rgba(251, 191, 36, 0.7); }
}

/* ─── 造句共鸣模态面板 ──────────────────────────────────────────────────── */
.resonance-modal-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(10, 8, 24, 0.75);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 30;
}

.resonance-modal-panel {
  width: 520px;
  max-width: 90%;
  background: linear-gradient(160deg, #2a1850 0%, #1a0e32 100%);
  border: 2px solid #fbbf24;
  border-radius: 14px;
  padding: 20px 24px;
  box-shadow: 0 0 40px rgba(251, 191, 36, 0.3), 0 20px 50px rgba(0, 0, 0, 0.6);
}

.resonance-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.resonance-title {
  font-size: 15px;
  font-weight: 800;
  color: #fbbf24;
  letter-spacing: 0.5px;
}

.resonance-timer {
  font-size: 20px;
  font-weight: 900;
  color: #fbbf24;
  text-shadow: 0 0 8px rgba(251, 191, 36, 0.6);
}
.resonance-timer.urgent {
  color: #ef4444;
  text-shadow: 0 0 12px rgba(239, 68, 68, 0.7);
  animation: timerBlink 0.5s ease-in-out infinite alternate;
}

@keyframes timerBlink {
  0%   { opacity: 1; }
  100% { opacity: 0.5; }
}

.resonance-prompt {
  font-size: 13px;
  color: #e2e8f0;
  line-height: 1.6;
  margin-bottom: 14px;
}

.keyword-highlight {
  display: inline-block;
  background: rgba(251, 191, 36, 0.25);
  color: #fbbf24;
  font-weight: 900;
  padding: 1px 8px;
  border-radius: 4px;
  border: 1px solid rgba(251, 191, 36, 0.4);
}

.resonance-form { }

.resonance-input {
  width: 100%;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(251, 191, 36, 0.4);
  border-radius: 8px;
  color: #f8fafc;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
  margin-bottom: 10px;
}
.resonance-input:focus {
  border-color: #fbbf24;
  box-shadow: 0 0 10px rgba(251, 191, 36, 0.3);
}
.resonance-input::placeholder { color: #64748b; }

.resonance-btn-row {
  display: flex;
  gap: 10px;
}

.btn-resonance-submit {
  flex: 1;
  padding: 9px 16px;
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  border: none;
  border-radius: 8px;
  color: #1a0a00;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-resonance-submit:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 15px rgba(251, 191, 36, 0.5);
}
.btn-resonance-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-resonance-skip {
  padding: 9px 16px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: #94a3b8;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-resonance-skip:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #e2e8f0;
}

.resonance-feedback {
  margin-top: 10px;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
}
.resonance-feedback.error {
  background: rgba(239, 68, 68, 0.2);
  color: #fca5a5;
  border: 1px solid rgba(239, 68, 68, 0.3);
}
.resonance-feedback.success {
  background: rgba(34, 197, 94, 0.2);
  color: #86efac;
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.resonance-tips {
  margin-top: 12px;
  font-size: 11px;
  color: #64748b;
  text-align: center;
}
.resonance-tips code {
  background: rgba(251, 191, 36, 0.15);
  color: #fbbf24;
  padding: 1px 4px;
  border-radius: 3px;
}

/* ─── 护盾图标 ──────────────────────────────────────────────────────────── */
.shield-icon {
  font-size: 14px;
  margin-left: 2px;
  animation: shieldGlow 1.5s ease-in-out infinite alternate;
}

@keyframes shieldGlow {
  0%   { filter: drop-shadow(0 0 2px rgba(59, 130, 246, 0.4)); }
  100% { filter: drop-shadow(0 0 6px rgba(59, 130, 246, 0.8)); }
}

/* ─── 复盘增强 ──────────────────────────────────────────────────────────── */
.recap-entry {
  display: inline-block;
  margin: 3px 4px;
  text-align: center;
}

.recap-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  user-select: none;
}
.recap-tag:hover {
  transform: translateY(-2px) scale(1.06);
  box-shadow: 0 4px 14px rgba(168, 85, 247, 0.45);
  border-color: #fbbf24 !important;
}
.recap-lookup-icon {
  font-size: 11px;
  opacity: 0.6;
  transition: opacity 0.2s;
}
.recap-tag:hover .recap-lookup-icon {
  opacity: 1;
}

.tag-player {
  background: rgba(168, 85, 247, 0.25);
  color: #e9d5ff;
  border: 1px solid rgba(168, 85, 247, 0.4);
}
.tag-ai {
  background: rgba(59, 130, 246, 0.25);
  color: #bfdbfe;
  border: 1px solid rgba(59, 130, 246, 0.4);
}

.tag-boosted {
  border: 1px solid rgba(251, 191, 36, 0.5) !important;
  box-shadow: 0 0 8px rgba(251, 191, 36, 0.3);
}

.boost-badge {
  font-size: 9px;
  background: #fbbf24;
  color: #1a0a00;
  padding: 0 4px;
  border-radius: 3px;
  margin-left: 3px;
  font-weight: 900;
}

.recap-sentence {
  font-size: 10px;
  color: #94a3b8;
  font-style: italic;
  margin-top: 2px;
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.boost-score {
  color: #fbbf24;
  font-weight: 800;
  font-style: normal;
}

/* ─── fade 过渡 ──────────────────────────────────────────────────────── */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
