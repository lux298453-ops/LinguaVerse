<template>
  <Transition name="wheel-pop">
    <div v-if="visible" class="wheel-overlay" @click.self="emit('close')">
      <div class="wheel-panel">
        <div class="wheel-title">
          <span class="title-with-icon"><GameIcon name="mask" :size="18" /> 快捷动作 / 表情</span>
          <span class="hotkey-tip">按 [1-8] 快速触发 · ESC 关闭</span>
        </div>

        <div class="actions-grid">
          <button
            v-for="(item, index) in actions"
            :key="item.key"
            class="action-item"
            :style="{ '--delay': `${index * 0.03}s` }"
            @click="selectAction(item.key)"
          >
            <span class="action-num">{{ index + 1 }}</span>
            <span class="action-icon">{{ item.icon }}</span>
            <span class="action-name">{{ item.name }}</span>
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import GameIcon from './GameIcon.vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'select'])

const actions = [
  { key: 'wave',     icon: '👋', name: '打招呼' },
  { key: 'thumb_up', icon: '👍', name: '点个赞' },
  { key: 'heart',    icon: '❤️', name: '比个心' },
  { key: 'party',    icon: '🎉', name: '庆祝下' },
  { key: 'laugh',    icon: '😂', name: '哈哈哈' },
  { key: 'idea',     icon: '💡', name: '有灵感' },
  { key: 'thinking', icon: '💭', name: '思考中' },
  { key: 'coffee',   icon: '☕', name: '休息会' }
]

function selectAction(key) {
  emit('select', key)
  emit('close')
}

function handleKeyDown(e) {
  if (!props.visible) return

  if (e.key === 'Escape') {
    emit('close')
    return
  }

  const num = parseInt(e.key, 10)
  if (num >= 1 && num <= actions.length) {
    e.preventDefault()
    selectAction(actions[num - 1].key)
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<style scoped>
.wheel-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(4px);
}

.wheel-panel {
  width: 360px;
  background: linear-gradient(135deg, rgba(24, 19, 46, 0.95) 0%, rgba(15, 11, 30, 0.95) 100%);
  border: 1.5px solid rgba(192, 132, 252, 0.4);
  box-shadow: 0 24px 48px -12px rgba(0, 0, 0, 0.7), 0 0 35px rgba(168, 85, 247, 0.25);
  border-radius: 20px;
  padding: 18px 20px;
  user-select: none;
}

.wheel-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  color: #f0abfc;
  font-size: 15px;
  font-weight: 700;
}

.title-with-icon {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.hotkey-tip {
  font-size: 11px;
  color: #94a3b8;
  font-weight: 500;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.action-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 14px;
  padding: 12px 6px 10px;
  cursor: pointer;
  color: #f8fafc;
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  animation: item-in 0.3s ease-out backwards;
  animation-delay: var(--delay);
}

.action-item:hover {
  background: rgba(168, 85, 247, 0.2);
  border-color: rgba(192, 132, 252, 0.6);
  transform: translateY(-3px) scale(1.05);
  box-shadow: 0 6px 16px rgba(168, 85, 247, 0.3);
}

.action-item:active {
  transform: translateY(0) scale(0.98);
}

.action-num {
  position: absolute;
  top: 4px;
  left: 6px;
  font-size: 10px;
  font-weight: 800;
  color: #a855f7;
}

.action-icon {
  font-size: 26px;
  line-height: 1;
}

.action-name {
  font-size: 11px;
  font-weight: 600;
  color: #e2e8f0;
}

@keyframes item-in {
  from {
    opacity: 0;
    transform: scale(0.6);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.wheel-pop-enter-active,
.wheel-pop-leave-active {
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.wheel-pop-enter-from,
.wheel-pop-leave-to {
  opacity: 0;
  transform: scale(0.85);
}
</style>
