<template>
  <Transition name="slide-up">
    <div v-if="visible" class="npc-dialogue-wrap">
      <!-- 悬浮在对话框右上方的轻量伴读微词卡 (不遮挡对话框，无全屏黑幕) -->
      <Transition name="mini-card-pop">
        <div v-if="activeWordDetail" class="dialogue-mini-wordcard" @click.stop>
          <div class="mini-card-header">
            <div class="mini-word-left">
              <span class="mini-word-title">{{ activeWordDetail.word.toUpperCase() }}</span>
              <span v-if="activeWordDetail.isInflected" class="mini-base-badge">
                原型: {{ activeWordDetail.baseWord }}
              </span>
            </div>
            <div class="mini-card-actions">
              <button
                class="mini-btn-fav"
                :class="{ active: isWordFav }"
                @click="toggleWordFav"
                :title="isWordFav ? '已收藏到生词本' : '收藏到生词本'"
                type="button"
              >
                {{ isWordFav ? '⭐ 已收藏' : '☆ 收藏' }}
              </button>
              <button class="mini-btn-close" @click="closeMiniCard" title="关闭词卡" type="button">✕</button>
            </div>
          </div>

          <div class="mini-card-body">
            <!-- 读音与考纲标签 -->
            <div class="mini-phonetic-row">
              <button
                class="mini-btn-audio"
                :class="{ playing: isAudioPlaying }"
                @click="playWordAudioDirect(activeWordDetail.word)"
                title="播放真人美音发音"
                type="button"
              >
                <span class="audio-icon">{{ isAudioPlaying ? '🔊' : '🔈' }}</span>
                <span class="phonetic-text">{{ activeWordDetail.phonetic_us || activeWordDetail.phonetic_uk || ('/' + activeWordDetail.word + '/') }}</span>
              </button>

              <div v-if="activeWordDetail.tags && activeWordDetail.tags.length" class="mini-tags">
                <span
                  v-for="tag in activeWordDetail.tags.slice(0, 2)"
                  :key="tag"
                  class="mini-tag"
                >{{ tag }}</span>
              </div>
            </div>

            <!-- 词性与中文释义 -->
            <div class="mini-def-box">
              <span class="mini-pos">{{ activeWordDetail.pos || '释义' }}</span>
              <span class="mini-trans">{{ activeWordDetail.trans }}</span>
            </div>

            <!-- 精选简明语境例句 -->
            <div v-if="activeWordDetail.example" class="mini-example-box">
              <div class="mini-ex-en">"{{ activeWordDetail.example }}"</div>
              <div v-if="activeWordDetail.example_cn" class="mini-ex-cn">{{ activeWordDetail.example_cn }}</div>
            </div>
          </div>
        </div>
      </Transition>

      <div class="npc-dialogue">
        <!-- NPC 头部 -->
        <div class="npc-header">
          <div class="npc-avatar-badge">
            <div class="npc-avatar">{{ npcName[0] }}</div>
          </div>
          <div class="npc-info">
            <div class="npc-name-row">
              <span class="npc-name">{{ npcName }}</span>
              <span class="npc-badge">NPC · QUEST</span>
            </div>
            <span class="npc-desc">{{ getNpcSubtitle(npcName) }}</span>
          </div>
          <button class="dialogue-close-btn" @click="$emit('close')" title="Close">✕</button>
        </div>

      <!-- 对话历史列表 -->
      <div ref="chatListRef" class="dialogue-body">
        <!-- 历史气泡列表 -->
        <div
          v-for="(msg, index) in messageHistory"
          :key="index"
          :class="['chat-row', msg.sender === 'player' ? 'chat-row-player' : 'chat-row-npc']"
        >
          <div class="chat-sender-avatar">
            {{ msg.sender === 'player' ? '🧙‍♂️' : npcName[0] }}
          </div>
          <div class="chat-bubble-wrap">
            <div class="chat-sender-name-row">
              <span class="chat-sender-name">{{ msg.sender === 'player' ? 'You' : npcName }}</span>
              <!-- NPC 对话专属操作栏：朗读与翻译 -->
              <div v-if="msg.sender === 'npc'" class="bubble-action-dock">
                <button
                  class="bubble-btn bubble-btn-speak"
                  @click="playSpeech(msg.text)"
                  title="朗读英语语音 (Web Speech)"
                  type="button"
                >
                  🔊
                </button>
                <button
                  v-if="msg.translation"
                  class="bubble-btn bubble-btn-trans"
                  :class="{ active: msg.showTranslate }"
                  @click="msg.showTranslate = !msg.showTranslate"
                  title="展开/收起中文翻译"
                  type="button"
                >
                  🌐 译
                </button>
              </div>
            </div>

            <div class="speech-bubble" :class="msg.sender === 'player' ? 'player-bubble' : 'npc-bubble'">
              <!-- 玩家自己的输入直接展示纯文本 -->
              <template v-if="msg.sender === 'player'">
                {{ msg.text }}
              </template>
              <!-- NPC 的英文支持点击查词 -->
              <template v-else>
                <span
                  v-for="(tok, tIdx) in tokenizeText(msg.text)"
                  :key="tIdx"
                  :class="{ 'clickable-word': tok.type === 'word' }"
                  :title="tok.type === 'word' ? '点击查词: ' + tok.text : ''"
                  @click="tok.type === 'word' ? handleWordClick(tok.text) : null"
                >{{ tok.text }}</span>
              </template>

              <!-- 折叠中文翻译卡片 -->
              <Transition name="trans-slide">
                <div v-if="msg.showTranslate && msg.translation" class="translation-card">
                  <div class="trans-header">
                    <span class="trans-icon">🌐</span>
                    <span class="trans-tag">中文参考</span>
                  </div>
                  <div class="trans-text">{{ msg.translation }}</div>
                </div>
              </Transition>
            </div>
          </div>
        </div>

        <!-- 当前 NPC 正在流式打字的消息 -->
        <div v-if="isNpcTyping" class="chat-row chat-row-npc">
          <div class="chat-sender-avatar">{{ npcName[0] }}</div>
          <div class="chat-bubble-wrap">
            <div class="chat-sender-name">{{ npcName }}</div>
            <div class="speech-bubble npc-bubble">
              <span v-if="currentNpcText">{{ currentNpcText }}</span>
              <span v-else class="loading-dots">{{ npcName }} is thinking... 💭</span>
              <span v-if="!isTypingDone && currentNpcText" class="typing-cursor">▋</span>
            </div>
          </div>
        </div>

        <!-- 任务完成提示 -->
        <div v-if="taskComplete" class="task-complete">
          <div class="task-complete-icon">🎉</div>
          <div class="task-complete-text">
            <div class="complete-title">MISSION COMPLETE!</div>
            <div class="complete-reward">+{{ currentRewardCoins }} Gold Coins · Quest Recorded</div>
          </div>
        </div>

        <!-- 判定失败提示 -->
        <div v-if="failHint" class="fail-hint">
          <span class="fail-icon">💡</span>
          <span>{{ failHint }}</span>
        </div>

        <!-- 任务完成后关闭按钮 -->
        <div v-if="taskComplete" class="complete-actions">
          <button class="game-btn game-btn-complete" @click="$emit('close')">
            Awesome! 🌟
          </button>
        </div>
      </div>

      <!-- 玩家输入区（固定在底部） -->
      <div v-if="waitingInput && !taskComplete" class="input-bottom-bar">
        <div class="dialogue-input-capsule">
          <input
            v-model="playerInput"
            class="dialogue-native-input"
            :placeholder="inputPlaceholder"
            @keydown.enter.exact.prevent="submitReply"
            @keydown.stop
            autofocus
          />
          <button
            v-if="playerInput"
            class="dialogue-clear-btn"
            @click="playerInput = ''"
            type="button"
          >
            ✕
          </button>
        </div>
        <button
          class="dialogue-send-btn"
          :disabled="!playerInput.trim() || submitting"
          @click="submitReply"
        >
          <span v-if="submitting">⏳</span>
          <span v-else>Send 🚀</span>
        </button>
      </div>
    </div>
  </div>
</Transition>
</template>


<script setup>
import { ref, computed, nextTick } from 'vue'
import { getWordDetail, playWordAudio, isFavorite, toggleFavorite } from './games/dictService.js'

const props = defineProps({
  visible:     { type: Boolean, default: false },
  npcName:     { type: String, default: 'NPC' },
  rewardCoins: { type: Number, default: 10 },
})

const emit = defineEmits(['close', 'reply'])

// 对话历史与状态
const messageHistory  = ref([]) // { sender: 'npc' | 'player', text: string, translation?: string, showTranslate?: boolean }
const currentNpcText  = ref('')
const currentNpcTranslation = ref('')
const isNpcTyping     = ref(false)
const isTypingDone    = ref(true)
const waitingInput    = ref(false)
const playerInput     = ref('')
const submitting      = ref(false)
const failHint        = ref('')
const taskComplete    = ref(false)
const currentNodeKey  = ref('')
const currentRewardCoins = ref(props.rewardCoins)
const chatListRef     = ref(null)

// 轻量伴读微词卡状态 (悬浮在对话框上方，不挡对话)
const activeWordDetail = ref(null)
const isWordFav        = ref(false)
const isAudioPlaying   = ref(false)

const inputPlaceholder = computed(() =>
  'Type your reply in English... Press Enter to send'
)

function getNpcSubtitle(name) {
  if (name === 'Mary') return 'Sunshine Hall Guide · 阳光向导'
  if (name === 'Luna') return 'Arcade Gamer · 奇幻玩家'
  if (name === 'Tom') return 'Lexical Alchemist · 词根学者'
  if (name === 'Evelyn') return 'Grand Archivist · 奥术馆长'
  return 'World Resident · 星界居民'
}

/**
 * 将英文长句分词，拆分成纯单词（可点击）与标点/空白字符（不可点击）
 */
function tokenizeText(text) {
  if (!text) return []
  const regex = /([a-zA-Z]+(?:'[a-zA-Z]+)?)|([^a-zA-Z]+)/g
  const tokens = []
  let match
  while ((match = regex.exec(text)) !== null) {
    if (match[1]) {
      tokens.push({ type: 'word', text: match[1] })
    } else if (match[2]) {
      tokens.push({ type: 'punct', text: match[2] })
    }
  }
  return tokens
}

/**
 * 点击对话中的任意英文单词，在对话框上方唤出轻量伴读微词卡
 */
function handleWordClick(word) {
  if (!word) return
  const clean = word.toLowerCase().replace(/[^a-zA-Z]/g, '').trim()
  if (clean.length < 2) return

  // 点击同一词时切换关闭
  if (activeWordDetail.value && activeWordDetail.value.word === clean) {
    activeWordDetail.value = null
    return
  }

  const detail = getWordDetail(clean)
  if (detail) {
    activeWordDetail.value = detail
    isWordFav.value = isFavorite(clean)
    playWordAudioDirect(clean)
  }
}

function playWordAudioDirect(word) {
  isAudioPlaying.value = true
  playWordAudio(word, 'us').finally(() => {
    isAudioPlaying.value = false
  })
}

function toggleWordFav() {
  if (!activeWordDetail.value) return
  isWordFav.value = toggleFavorite(activeWordDetail.value)
}

function closeMiniCard() {
  activeWordDetail.value = null
}

/**
 * 原生 Web Speech API 朗读英语文本
 */
function playSpeech(text) {
  if (!window.speechSynthesis || !text) return
  window.speechSynthesis.cancel() // 停止之前的发音
  // 清理文本中的 emoji 避免语音合成报读
  const clean = text.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '')
  const utterance = new SpeechSynthesisUtterance(clean)
  utterance.lang = 'en-US'
  utterance.rate = 0.95
  window.speechSynthesis.speak(utterance)
}

function scrollToBottom() {
  nextTick(() => {
    if (chatListRef.value) {
      chatListRef.value.scrollTop = chatListRef.value.scrollHeight
    }
  })
}

// 打字机效果：逐词累积显示
function appendChunk(chunk) {
  currentNpcText.value += chunk
  scrollToBottom()
}

function startNewSpeech() {
  currentNpcText.value = ''
  currentNpcTranslation.value = ''
  isNpcTyping.value    = true
  isTypingDone.value   = false
  waitingInput.value   = false
  failHint.value       = ''
  scrollToBottom()
}

function finishTyping() {
  isTypingDone.value = true
  if (currentNpcText.value) {
    messageHistory.value.push({
      sender: 'npc',
      text: currentNpcText.value,
      translation: currentNpcTranslation.value,
      showTranslate: false
    })
    currentNpcText.value = ''
    currentNpcTranslation.value = ''
    isNpcTyping.value = false
  }
  scrollToBottom()
}

// NPC 流式输出处理（由 World.vue 调用）
function onChunk(msg) {
  console.log('[NpcDialogue] 收到 chunk:', msg)
  if (msg.nodeKey) {
    currentNodeKey.value = msg.nodeKey
  }
  if (msg.translation) {
    currentNpcTranslation.value = msg.translation
  }
  if (!isNpcTyping.value) startNewSpeech()
  appendChunk(msg.chunk)
  if (msg.isEnd) {
    finishTyping()
    // NPC 说完后，如果不是终止节点，等待玩家输入
    if (msg.nodeKey === 'COMPLETE') {
      taskComplete.value = true
      waitingInput.value = false
    } else if (!taskComplete.value) {
      setTimeout(() => {
        waitingInput.value = true
        scrollToBottom()
      }, 300)
    }
  }
}

// 任务判定结果（由 World.vue 调用）
function onTaskResult(msg) {
  console.log('[NpcDialogue] 任务结果:', msg)
  submitting.value = false
  if (msg.rewardCoins) {
    currentRewardCoins.value = msg.rewardCoins
  }
  if (msg.success) {
    failHint.value     = ''
    playerInput.value  = ''
    waitingInput.value = false
    if (msg.nextNode === 'COMPLETE') {
      taskComplete.value = true
    }
    scrollToBottom()
  } else {
    failHint.value = msg.hint || 'Please try again!'
    submitting.value = false
    scrollToBottom()
  }
}

// 重置（打开新对话时调用）
function reset() {
  messageHistory.value = []
  currentNpcText.value = ''
  currentNpcTranslation.value = ''
  isNpcTyping.value    = false
  isTypingDone.value   = true
  waitingInput.value   = false
  playerInput.value    = ''
  submitting.value     = false
  failHint.value       = ''
  taskComplete.value   = false
  currentNodeKey.value = ''
  currentRewardCoins.value = props.rewardCoins
  activeWordDetail.value = null
}

// 发送玩家回复
function submitReply() {
  const content = playerInput.value.trim()
  if (!content) return
  submitting.value = true
  failHint.value   = ''

  // 立即将玩家回复加入历史列表展示
  messageHistory.value.push({
    sender: 'player',
    text: content
  })
  scrollToBottom()

  emit('reply', { content, nodeKey: currentNodeKey.value })
}

// 暴露给父组件（World.vue）
defineExpose({ onChunk, onTaskResult, reset, setNodeKey: (k) => { currentNodeKey.value = k } })
</script>

<style scoped>
/* 对话框外层包裹器（作为定位基准，方便上方悬浮微词卡，不限制溢出） */
.npc-dialogue-wrap {
  position: fixed;
  bottom: 28px;
  left: 50%;
  transform: translateX(-50%);
  width: 580px;
  max-width: calc(100vw - 32px);
  z-index: 1000;
  pointer-events: none;
}

/* 伴读轻量微词卡 (悬浮于对话框上方，不遮挡对话框与选项) */
.dialogue-mini-wordcard {
  pointer-events: auto;
  position: absolute;
  bottom: calc(100% + 10px);
  right: 0;
  width: 380px;
  max-width: 100%;
  background: linear-gradient(145deg, rgba(23, 20, 48, 0.97) 0%, rgba(15, 23, 42, 0.98) 100%);
  border: 1.5px solid rgba(167, 139, 250, 0.45);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.65), 0 0 25px rgba(139, 92, 246, 0.2);
  border-radius: 16px;
  backdrop-filter: blur(16px);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.mini-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: rgba(139, 92, 246, 0.15);
  border-bottom: 1px solid rgba(167, 139, 250, 0.2);
}

.mini-word-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.mini-word-title {
  font-size: 15px;
  font-weight: 800;
  color: #f8fafc;
  letter-spacing: 0.5px;
}

.mini-base-badge {
  font-size: 11px;
  background: rgba(245, 158, 11, 0.2);
  color: #fbbf24;
  border: 1px solid rgba(245, 158, 11, 0.4);
  padding: 1px 6px;
  border-radius: 6px;
  font-weight: 600;
}

.mini-card-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mini-btn-fav {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #e2e8f0;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.mini-btn-fav:hover {
  background: rgba(245, 158, 11, 0.2);
  border-color: #fbbf24;
  color: #fbbf24;
}

.mini-btn-fav.active {
  background: rgba(245, 158, 11, 0.25);
  border-color: #f59e0b;
  color: #fcd34d;
}

.mini-btn-close {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 14px;
  width: 22px;
  height: 22px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.mini-btn-close:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.mini-card-body {
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mini-phonetic-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.mini-btn-audio {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(139, 92, 246, 0.15);
  border: 1px solid rgba(167, 139, 250, 0.3);
  padding: 3px 8px;
  border-radius: 8px;
  color: #c4b5fd;
  font-size: 12px;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s ease;
}

.mini-btn-audio:hover {
  background: rgba(139, 92, 246, 0.3);
  color: #ede9fe;
}

.mini-btn-audio.playing {
  border-color: #38bdf8;
  color: #7dd3fc;
}

.phonetic-text {
  font-style: italic;
}

.mini-tags {
  display: flex;
  gap: 4px;
}

.mini-tag {
  font-size: 10px;
  background: rgba(59, 130, 246, 0.2);
  border: 1px solid rgba(96, 165, 250, 0.35);
  color: #93c5fd;
  padding: 1px 6px;
  border-radius: 4px;
  font-weight: 600;
}

.mini-def-box {
  display: flex;
  align-items: baseline;
  gap: 8px;
  background: rgba(0, 0, 0, 0.25);
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.mini-pos {
  font-size: 11px;
  font-weight: 700;
  color: #a78bfa;
  flex-shrink: 0;
  font-style: italic;
}

.mini-trans {
  font-size: 13px;
  font-weight: 600;
  color: #f1f5f9;
  line-height: 1.4;
}

.mini-example-box {
  background: rgba(255, 255, 255, 0.03);
  border-left: 2px solid #8b5cf6;
  padding: 5px 8px;
  border-radius: 0 6px 6px 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.mini-ex-en {
  font-size: 11.5px;
  color: #cbd5e1;
  font-style: italic;
  line-height: 1.35;
}

.mini-ex-cn {
  font-size: 11px;
  color: #94a3b8;
  line-height: 1.35;
}

/* 微词卡淡入淡出动效 */
.mini-card-pop-enter-active,
.mini-card-pop-leave-active {
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.mini-card-pop-enter-from,
.mini-card-pop-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.96);
}

/* 对话框本体 */
.npc-dialogue {
  pointer-events: auto;
  width: 100%;
  background: linear-gradient(180deg, rgba(20, 27, 45, 0.96) 0%, rgba(11, 16, 30, 0.98) 100%);
  border: 1.5px solid rgba(251, 191, 36, 0.35);
  border-radius: 20px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.7), 0 0 28px rgba(251, 191, 36, 0.12);
  backdrop-filter: blur(16px);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* 顶部 NPC 状态条 */
.npc-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 20px;
  background: linear-gradient(90deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.7) 100%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  flex-shrink: 0;
}

.npc-avatar-badge {
  position: relative;
  width: 42px;
  height: 42px;
  flex-shrink: 0;
}

.npc-avatar {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 19px;
  font-weight: 800;
  border: 1.5px solid rgba(254, 243, 199, 0.5);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.35);
}

.npc-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.npc-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.npc-name {
  font-weight: 800;
  font-size: 15px;
  color: #f8fafc;
  letter-spacing: 0.3px;
}

.npc-badge {
  font-size: 10px;
  font-weight: 800;
  padding: 2px 7px;
  border-radius: 10px;
  background: rgba(245, 158, 11, 0.2);
  border: 1px solid rgba(245, 158, 11, 0.4);
  color: #fbbf24;
  letter-spacing: 0.5px;
}

.npc-desc {
  font-size: 11px;
  color: #94a3b8;
}

.dialogue-close-btn {
  margin-left: auto;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #94a3b8;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.dialogue-close-btn:hover {
  background: rgba(239, 68, 68, 0.25);
  border-color: #f87171;
  color: #fff;
  transform: rotate(90deg);
}

/* 对话消息滚动区 */
.dialogue-body {
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-height: 380px;
  min-height: 140px;
  overflow-y: auto;
  scroll-behavior: smooth;
  background: rgba(10, 14, 26, 0.65);
}

/* 消息气泡行 */
.chat-row {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  animation: fadeIn 0.22s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}

.chat-row-player {
  flex-direction: row-reverse;
}

.chat-sender-avatar {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(148, 163, 184, 0.3);
  color: #fbbf24;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: bold;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.chat-row-player .chat-sender-avatar {
  background: linear-gradient(135deg, #4f46e5, #3b82f6);
  border-color: rgba(165, 180, 252, 0.4);
  color: #fff;
}

.chat-bubble-wrap {
  display: flex;
  flex-direction: column;
  max-width: 82%;
}

.chat-row-player .chat-bubble-wrap {
  align-items: flex-end;
}

.chat-sender-name-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
  padding: 0 4px;
  gap: 8px;
}

.chat-sender-name {
  font-size: 11px;
  font-weight: 700;
  color: #64748b;
}

.chat-row-player .chat-sender-name {
  color: #818cf8;
}

/* NPC 对话操作按键 Dock (朗读 + 翻译) */
.bubble-action-dock {
  display: flex;
  align-items: center;
  gap: 5px;
}

.bubble-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 7px;
  font-size: 11px;
  border-radius: 6px;
  border: 1px solid rgba(148, 163, 184, 0.25);
  background: rgba(30, 41, 59, 0.65);
  color: #cbd5e1;
  cursor: pointer;
  line-height: 1.2;
  transition: all 0.2s ease;
  user-select: none;
}

.bubble-btn:hover {
  background: rgba(99, 102, 241, 0.25);
  border-color: rgba(165, 180, 252, 0.5);
  color: #ffffff;
  transform: translateY(-1px);
}

.bubble-btn-speak:hover {
  background: rgba(56, 189, 248, 0.2);
  border-color: rgba(56, 189, 248, 0.5);
}

.bubble-btn-trans.active {
  background: rgba(56, 189, 248, 0.25);
  border-color: rgba(56, 189, 248, 0.7);
  color: #38bdf8;
  font-weight: 700;
  box-shadow: 0 0 8px rgba(56, 189, 248, 0.25);
}

/* 可交互英文单词 */
.clickable-word {
  cursor: pointer;
  border-radius: 3px;
  padding: 0 1px;
  transition: all 0.15s ease;
}

.clickable-word:hover {
  background: rgba(99, 102, 241, 0.35);
  color: #93c5fd;
  text-decoration: underline;
  text-underline-offset: 3px;
}

/* 折叠中文翻译卡片 */
.translation-card {
  margin-top: 10px;
  padding: 10px 12px;
  background: rgba(15, 23, 42, 0.92);
  border-radius: 8px;
  border: 1px solid rgba(56, 189, 248, 0.35);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 4px 12px rgba(0, 0, 0, 0.3);
}

.trans-header {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 5px;
}

.trans-icon {
  font-size: 11px;
}

.trans-tag {
  font-size: 10px;
  font-weight: 700;
  color: #38bdf8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: rgba(56, 189, 248, 0.15);
  padding: 1px 5px;
  border-radius: 4px;
}

.trans-text {
  font-size: 13px;
  line-height: 1.6;
  color: #e2e8f0;
  font-family: system-ui, -apple-system, sans-serif;
  user-select: text;
}

.trans-slide-enter-active,
.trans-slide-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}

.trans-slide-enter-from,
.trans-slide-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* 气泡样式 */
.speech-bubble {
  border-radius: 14px;
  padding: 11px 16px;
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.npc-bubble {
  background: rgba(30, 41, 59, 0.9);
  color: #f1f5f9;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-top-left-radius: 4px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.3);
}

.player-bubble {
  background: linear-gradient(135deg, #4338ca 0%, #3b82f6 100%);
  color: #ffffff;
  border: 1px solid rgba(165, 180, 252, 0.35);
  border-top-right-radius: 4px;
  box-shadow: 0 4px 16px rgba(67, 56, 202, 0.35);
}

.loading-dots {
  color: #94a3b8;
  font-style: italic;
}

.typing-cursor {
  font-size: 14px;
  color: #fbbf24;
  margin-left: 2px;
  animation: blink 0.8s infinite;
}

@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }

/* 判定失败提示 */
.fail-hint {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  background: rgba(245, 158, 11, 0.12);
  border: 1px solid rgba(245, 158, 11, 0.35);
  padding: 10px 14px;
  border-radius: 10px;
  font-size: 13px;
  color: #fde68a;
  line-height: 1.5;
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.15);
}

.fail-icon {
  font-size: 15px;
  flex-shrink: 0;
}

/* 任务完成横幅 */
.task-complete {
  display: flex;
  align-items: center;
  gap: 12px;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.3));
  border: 1.5px solid rgba(52, 211, 153, 0.5);
  border-radius: 12px;
  padding: 12px 18px;
  box-shadow: 0 4px 18px rgba(16, 185, 129, 0.25);
}

.task-complete-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.complete-title {
  font-size: 13px;
  font-weight: 800;
  color: #34d399;
  letter-spacing: 0.8px;
}

.complete-reward {
  font-size: 12px;
  color: #a7f3d0;
  margin-top: 2px;
}

.complete-actions {
  text-align: center;
  margin-top: 6px;
}

.game-btn {
  font-family: inherit;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.game-btn-complete {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border: 1px solid rgba(167, 243, 208, 0.4);
  color: #ffffff;
  padding: 9px 24px;
  border-radius: 20px;
  font-size: 13px;
  box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);
}

.game-btn-complete:hover {
  background: linear-gradient(135deg, #34d399 0%, #10b981 100%);
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.55);
  transform: translateY(-1px);
}

.game-btn-complete:active {
  transform: scale(0.96);
}

/* 底部游戏输入栏 */
.input-bottom-bar {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 12px 18px;
  background: rgba(15, 23, 42, 0.95);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  flex-shrink: 0;
}

.dialogue-input-capsule {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
}

.dialogue-native-input {
  width: 100%;
  height: 38px;
  background: rgba(2, 6, 23, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 19px;
  padding: 0 34px 0 14px;
  color: #f8fafc;
  font-size: 13px;
  outline: none;
  transition: all 0.2s;
  font-family: inherit;
}

.dialogue-native-input:focus {
  border-color: #6366f1;
  background: rgba(2, 6, 23, 0.85);
  box-shadow: 0 0 14px rgba(99, 102, 241, 0.3);
}

.dialogue-native-input::placeholder {
  color: #64748b;
  font-size: 12px;
}

.dialogue-clear-btn {
  position: absolute;
  right: 10px;
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 12px;
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dialogue-clear-btn:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.1);
}

.dialogue-send-btn {
  height: 38px;
  padding: 0 18px;
  border-radius: 19px;
  background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%);
  border: 1px solid rgba(165, 180, 252, 0.4);
  color: #ffffff;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 14px rgba(79, 70, 229, 0.4);
  flex-shrink: 0;
  font-family: inherit;
}

.dialogue-send-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #6366f1 0%, #60a5fa 100%);
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.5);
  transform: translateY(-1px);
}

.dialogue-send-btn:active:not(:disabled) {
  transform: scale(0.96);
}

.dialogue-send-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  box-shadow: none;
  background: #334155;
  border-color: #475569;
}

/* 过渡动画 */
.slide-up-enter-active, .slide-up-leave-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.slide-up-enter-from, .slide-up-leave-to {
  transform: translateX(-50%) translateY(30px);
  opacity: 0;
}
</style>

