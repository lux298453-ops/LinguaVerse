<template>
  <div
    class="user-avatar-comp"
    :style="containerStyle"
    :title="avatarParsed.name || name"
  >
    <!-- 1. 网络图片头像 -->
    <img
      v-if="avatarParsed.type === 'img' && !imgError"
      :src="avatarParsed.src"
      class="avatar-img"
      alt="avatar"
      @error="imgError = true"
    />

    <!-- 2. 预设角色头像 (Emoji / 图标) -->
    <span v-else-if="avatarParsed.type === 'preset'" class="avatar-icon">
      {{ avatarParsed.icon }}
    </span>

    <!-- 3. 首字母文字兜底 (或者图片加载失败时降级) -->
    <span v-else class="avatar-letter">
      {{ avatarParsed.text }}
    </span>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { parseAvatar } from '../utils/avatarHelper'

const props = defineProps({
  avatar: { type: String, default: '' },
  name:   { type: String, default: 'User' },
  size:   { type: [Number, String], default: 36 },
  round:  { type: Boolean, default: true },
  radius: { type: String, default: '' }
})

const imgError = ref(false)

// 当头像链接变化时重置错误状态
watch(() => props.avatar, () => {
  imgError.value = false
})

const avatarParsed = computed(() => {
  return parseAvatar(props.avatar, props.name)
})

const containerStyle = computed(() => {
  const sz = typeof props.size === 'number' ? `${props.size}px` : props.size
  const r = props.radius ? props.radius : (props.round ? '50%' : '10px')
  return {
    width: sz,
    height: sz,
    borderRadius: r,
    background: avatarParsed.value.bg || '#3b82f6',
    border: avatarParsed.value.border && avatarParsed.value.border !== 'transparent'
      ? `1.5px solid ${avatarParsed.value.border}`
      : 'none'
  }
})
const iconFontSize = computed(() => {
  const n = typeof props.size === 'number' ? props.size : parseInt(props.size) || 36
  return `${Math.round(n * 0.38)}px`
})

const textFontSize = computed(() => {
  const n = typeof props.size === 'number' ? props.size : parseInt(props.size) || 36
  return `${Math.round(n * 0.44)}px`
})
</script>

<style scoped>
.user-avatar-comp {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
  user-select: none;
  position: relative;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
  transition: transform 0.15s, box-shadow 0.15s;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.avatar-icon {
  font-size: v-bind(iconFontSize);
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  color: #ffffff;
  letter-spacing: 0.5px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
}

.avatar-letter {
  font-size: v-bind(textFontSize);
  font-weight: 800;
  color: #ffffff;
  line-height: 1;
  letter-spacing: -0.5px;
}
</style>