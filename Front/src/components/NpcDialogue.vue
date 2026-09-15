<template>
  <Transition name="slide-up">
    <div v-if="visible" class="npc-dialogue">
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
          <span class="npc-desc">Sunshine Hall Resident</span>
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
            <div class="chat-sender-name">
              {{ msg.sender === 'player' ? 'You' : npcName }}
            </div>
            <div class="speech-bubble" :class="msg.sender === 'player' ? 'player-bubble' : 'npc-bubble'">
              {{ msg.text }}
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
  </Transition>
</template>


<script setup>
import { ref, computed, nextTick } from 'vue'

const props = defineProps({
  visible:     { type: Boolean, default: false },
  npcName:     { type: String, default: 'NPC' },
  rewardCoins: { type: Number, default: 10 },
})

const emit = defineEmits(['close', 'reply'])

// 对话历史与状态
const messageHistory  = ref([]) // { sender: 'npc' | 'player', text: string }
const currentNpcText  = ref('')
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

const inputPlaceholder = computed(() =>
  'Type your reply in English... Press Enter to send'
)

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
      text: currentNpcText.value
    })
    currentNpcText.value = ''
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
  isNpcTyping.value    = false
  isTypingDone.value   = true
  waitingInput.value   = false
  playerInput.value    = ''
  submitting.value     = false
  failHint.value       = ''
  taskComplete.value   = false
  currentNodeKey.value = ''
  currentRewardCoins.value = props.rewardCoins
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
.npc-dialogue {
  position: fixed;
  bottom: 28px;
  left: 50%;
  transform: translateX(-50%);
  width: 580px;
  max-width: calc(100vw - 32px);
  background: linear-gradient(180deg, rgba(20, 27, 45, 0.96) 0%, rgba(11, 16, 30, 0.98) 100%);
  border: 1.5px solid rgba(251, 191, 36, 0.35);
  border-radius: 20px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.7), 0 0 28px rgba(251, 191, 36, 0.12);
  backdrop-filter: blur(16px);
  z-index: 1000;
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

.chat-sender-name {
  font-size: 11px;
  font-weight: 700;
  color: #64748b;
  margin-bottom: 4px;
  padding: 0 4px;
}

.chat-row-player .chat-sender-name {
  color: #818cf8;
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

