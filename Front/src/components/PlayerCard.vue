<template>
  <Transition name="player-card-pop">
    <div v-if="visible && player" class="player-card-overlay" @click.self="emit('close')">
      <div class="player-card">
        <!-- 头部装饰条与关闭按钮 -->
        <div class="card-header">
          <span class="card-badge">🎮 ADVENTURER</span>
          <button class="close-btn" @click="emit('close')">✕</button>
        </div>

        <!-- 玩家形象与基础信息 -->
        <div class="card-body">
          <div class="avatar-wrapper">
            <div class="avatar-ring">
              <span class="avatar-emoji">🧙‍♂️</span>
            </div>
            <span class="status-dot online" title="在线" />
          </div>

          <div class="player-info">
            <div class="player-name">{{ player.nickname || 'Unknown Player' }}</div>
            <div class="player-meta">
              <span class="meta-tag id-tag">UID: {{ player.userId }}</span>
              <span class="meta-tag status-tag">🟢 Online</span>
            </div>
          </div>
        </div>

        <!-- 快捷操作按钮组 -->
        <div class="card-actions">
          <button class="action-btn chat-btn" @click="handlePrivateChat">
            <span class="btn-icon">💬</span>
            <span class="btn-text">私聊信息</span>
          </button>

          <button class="action-btn wave-btn" @click="handleGreet">
            <span class="btn-icon">👋</span>
            <span class="btn-text">打个招呼</span>
          </button>

          <button class="action-btn like-btn" @click="handleLike">
            <span class="btn-icon">👍</span>
            <span class="btn-text">给Ta点赞</span>
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  player: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'privateChat', 'greet', 'like'])

function handlePrivateChat() {
  emit('privateChat', props.player)
  emit('close')
}

function handleGreet() {
  emit('greet', props.player)
}

function handleLike() {
  emit('like', props.player)
}
</script>

<style scoped>
.player-card-overlay {
  position: fixed;
  inset: 0;
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(4px);
}

.player-card {
  width: 320px;
  background: linear-gradient(135deg, rgba(30, 27, 75, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%);
  border: 1.5px solid rgba(168, 85, 247, 0.4);
  box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.6), 0 0 30px rgba(168, 85, 247, 0.2);
  border-radius: 18px;
  padding: 18px;
  color: #fff;
  user-select: none;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.card-badge {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1px;
  color: #c084fc;
  background: rgba(168, 85, 247, 0.15);
  border: 1px solid rgba(168, 85, 247, 0.35);
  padding: 3px 10px;
  border-radius: 999px;
}

.close-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 16px;
  cursor: pointer;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.card-body {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 6px 4px 18px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.avatar-wrapper {
  position: relative;
  flex-shrink: 0;
}

.avatar-ring {
  width: 62px;
  height: 62px;
  border-radius: 50%;
  background: radial-gradient(circle, #4f46e5 0%, #1e1b4b 100%);
  border: 2.5px solid #a855f7;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 16px rgba(168, 85, 247, 0.4);
}

.avatar-emoji {
  font-size: 30px;
}

.status-dot {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #22c55e;
  border: 2px solid #0f172a;
}

.player-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.player-name {
  font-size: 17px;
  font-weight: 700;
  color: #f8fafc;
  line-height: 1.2;
}

.player-meta {
  display: flex;
  gap: 8px;
  align-items: center;
}

.meta-tag {
  font-size: 11px;
  padding: 2px 7px;
  border-radius: 6px;
}

.id-tag {
  background: rgba(255, 255, 255, 0.08);
  color: #94a3b8;
}

.status-tag {
  background: rgba(34, 197, 94, 0.15);
  color: #4ade80;
}

.card-actions {
  display: flex;
  gap: 8px;
  margin-top: 14px;
}

.action-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 6px;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.action-btn:hover {
  transform: translateY(-2px);
}

.action-btn:active {
  transform: translateY(0);
}

.chat-btn {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: #fff;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.chat-btn:hover {
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.45);
}

.wave-btn {
  background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);
  color: #fff;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.wave-btn:hover {
  box-shadow: 0 6px 16px rgba(139, 92, 246, 0.45);
}

.like-btn {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: #fff;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

.like-btn:hover {
  box-shadow: 0 6px 16px rgba(245, 158, 11, 0.45);
}

.btn-icon {
  font-size: 18px;
}

/* 动效 */
.player-card-pop-enter-active,
.player-card-pop-leave-active {
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.player-card-pop-enter-from,
.player-card-pop-leave-to {
  opacity: 0;
  transform: scale(0.85);
}
</style>
