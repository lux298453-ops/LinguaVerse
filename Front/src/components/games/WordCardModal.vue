<template>
  <Transition name="card-pop">
    <div v-if="visible" class="wordcard-overlay" @click.self="handleClose">
      <div class="wordcard-container">
        <!-- 顶部装饰栏 -->
        <div class="card-header">
          <div class="header-left">
            <span class="gem-dot purple" />
            <span class="gem-dot gold" />
            <span class="card-title-text">🔮 灵语词典 · 单词卡片</span>
          </div>
          <div class="header-actions">
            <button
              class="btn-fav"
              :class="{ active: isFav }"
              @click="handleToggleFavorite"
              :title="isFav ? '已收藏到生词本' : '收藏到生词本'"
            >
              {{ isFav ? '⭐ 已收藏' : '☆ 收藏' }}
            </button>
            <button class="btn-close" @click="handleClose" title="关闭">✕</button>
          </div>
        </div>

        <div v-if="detail" class="card-body">
          <!-- 单词主角区 -->
          <div class="word-hero">
            <div class="hero-word-row">
              <h2 class="hero-word">{{ detail.word.toUpperCase() }}</h2>
              <span v-if="detail.isInflected" class="inflected-badge">
                原型: {{ detail.baseWord }}
              </span>
            </div>

            <!-- 词书考纲标签栏 -->
            <div v-if="detail.tags && detail.tags.length" class="tags-row">
              <span
                v-for="tag in detail.tags"
                :key="tag"
                class="tag-pill"
                :class="getTagClass(tag)"
              >
                {{ tag }}
              </span>
            </div>
          </div>

          <!-- 双真人发音控制板 (方案 A: 有道真人发音 CDN) -->
          <div class="audio-control-bar">
            <div class="pronounce-item">
              <div class="accent-info">
                <span class="flag-icon">🇺🇸</span>
                <span class="accent-label">美音</span>
                <span class="phonetic-text">{{ detail.phonetic_us }}</span>
              </div>
              <button
                class="btn-play-audio"
                :class="{ 'is-playing': isPlayingUs }"
                @click="playAudio('us')"
                title="播放美式真人发音"
              >
                <span class="play-icon">{{ isPlayingUs ? '🔊' : '🔈' }}</span>
                <span>{{ isPlayingUs ? '播放中...' : '美音发音' }}</span>
                <span v-if="isPlayingUs" class="sound-wave">
                  <i /><i /><i />
                </span>
              </button>
            </div>

            <div class="pronounce-divider" />

            <div class="pronounce-item">
              <div class="accent-info">
                <span class="flag-icon">🇬🇧</span>
                <span class="accent-label">英音</span>
                <span class="phonetic-text">{{ detail.phonetic_uk }}</span>
              </div>
              <button
                class="btn-play-audio"
                :class="{ 'is-playing': isPlayingUk }"
                @click="playAudio('uk')"
                title="播放英式真人发音"
              >
                <span class="play-icon">{{ isPlayingUk ? '🔊' : '🔈' }}</span>
                <span>{{ isPlayingUk ? '播放中...' : '英音发音' }}</span>
                <span v-if="isPlayingUk" class="sound-wave">
                  <i /><i /><i />
                </span>
              </button>
            </div>
          </div>

          <!-- 词性与中文释义 -->
          <div class="definition-card">
            <div class="def-header">
              <span class="pos-badge">{{ detail.pos }}</span>
              <span class="def-lead">中文释义</span>
            </div>
            <div class="trans-text">
              {{ detail.trans }}
            </div>
          </div>

          <!-- 经典例句与双语语境 -->
          <div v-if="detail.example" class="example-card">
            <div class="example-header">
              <span class="ex-icon">💬</span>
              <span class="ex-title">经典语境例句</span>
            </div>
            <div class="example-en">
              "{{ detail.example }}"
            </div>
            <div v-if="detail.example_cn" class="example-cn">
              {{ detail.example_cn }}
            </div>
          </div>
        </div>

        <!-- 底部信息与确认按钮 -->
        <div class="card-footer">
          <div class="foot-tip">
            🎙️ 采用权威真人原声 (Youdao Audio CDN) · 支持离线智能回退
          </div>
          <button class="btn-confirm" @click="handleClose">
            确定 (GOT IT)
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { getWordDetail, playWordAudio, isFavorite, toggleFavorite } from './dictService.js'

const props = defineProps({
  visible: { type: Boolean, default: false },
  word: { type: String, default: '' }
})

const emit = defineEmits(['close'])

const isPlayingUs = ref(false)
const isPlayingUk = ref(false)
const isFav = ref(false)

const detail = computed(() => {
  if (!props.word) return null
  return getWordDetail(props.word)
})

watch(() => props.word, (newWord) => {
  if (newWord) {
    isFav.value = isFavorite(newWord)
    // 自动播放美音（初学体验丝滑）
    if (props.visible) {
      setTimeout(() => playAudio('us'), 200)
    }
  }
})

watch(() => props.visible, (val) => {
  if (val && props.word) {
    isFav.value = isFavorite(props.word)
    setTimeout(() => playAudio('us'), 200)
  }
})

async function playAudio(accent = 'us') {
  if (!detail.value) return
  const target = detail.value.baseWord || detail.value.word

  if (accent === 'us') {
    isPlayingUs.value = true
    await playWordAudio(target, 'us')
    isPlayingUs.value = false
  } else {
    isPlayingUk.value = true
    await playWordAudio(target, 'uk')
    isPlayingUk.value = false
  }
}

function handleToggleFavorite() {
  if (!detail.value) return
  isFav.value = toggleFavorite(detail.value)
}

function handleClose() {
  emit('close')
}

function getTagClass(tag) {
  if (tag.includes('高考')) return 'tag-gaokao'
  if (tag.includes('CET4')) return 'tag-cet4'
  if (tag.includes('CET6')) return 'tag-cet6'
  if (tag.includes('IELTS')) return 'tag-ielts'
  if (tag.includes('奇幻')) return 'tag-fantasy'
  return 'tag-default'
}
</script>

<style scoped>
.wordcard-overlay {
  position: fixed;
  inset: 0;
  background: rgba(8, 6, 20, 0.78);
  backdrop-filter: blur(8px);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.wordcard-container {
  width: 520px;
  max-width: 94vw;
  background: linear-gradient(165deg, #241646 0%, #150d2c 100%);
  border: 2px solid #a855f7;
  border-radius: 18px;
  box-shadow: 0 0 45px rgba(168, 85, 247, 0.35), 0 25px 50px rgba(0, 0, 0, 0.75);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: cardEnter 0.28s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes cardEnter {
  from {
    opacity: 0;
    transform: scale(0.92) translateY(12px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* 顶部栏 */
.card-header {
  height: 48px;
  background: rgba(30, 18, 58, 0.95);
  border-bottom: 1px solid rgba(168, 85, 247, 0.25);
  padding: 0 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.gem-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
}
.gem-dot.purple { background: #c084fc; box-shadow: 0 0 8px #c084fc; }
.gem-dot.gold   { background: #fbbf24; box-shadow: 0 0 8px #fbbf24; }

.card-title-text {
  font-size: 13px;
  font-weight: 800;
  color: #e9d5ff;
  letter-spacing: 0.5px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn-fav {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(251, 191, 36, 0.3);
  color: #fbbf24;
  font-size: 12px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-fav:hover, .btn-fav.active {
  background: rgba(251, 191, 36, 0.2);
  border-color: #fbbf24;
  box-shadow: 0 0 10px rgba(251, 191, 36, 0.4);
}

.btn-close {
  background: transparent;
  border: none;
  color: #a855f7;
  font-size: 16px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.2s;
}
.btn-close:hover {
  background: rgba(168, 85, 247, 0.2);
  color: #fff;
}

/* 核心内容区 */
.card-body {
  padding: 22px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: 75vh;
  overflow-y: auto;
}

/* 单词 Hero */
.word-hero {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.hero-word-row {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.hero-word {
  margin: 0;
  font-size: 32px;
  font-weight: 900;
  letter-spacing: 1.5px;
  background: linear-gradient(135deg, #ffffff 0%, #e9d5ff 60%, #c084fc 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 20px rgba(192, 132, 252, 0.3);
}

.inflected-badge {
  font-size: 11px;
  font-weight: 600;
  color: #fbbf24;
  background: rgba(251, 191, 36, 0.15);
  border: 1px solid rgba(251, 191, 36, 0.3);
  padding: 2px 8px;
  border-radius: 4px;
}

.tags-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag-pill {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
}
.tag-gaokao  { background: rgba(34, 197, 94, 0.2); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.4); }
.tag-cet4    { background: rgba(245, 158, 11, 0.2); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.4); }
.tag-cet6    { background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.4); }
.tag-ielts   { background: rgba(168, 85, 247, 0.2); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.4); }
.tag-fantasy { background: rgba(56, 189, 248, 0.2); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.4); }
.tag-default { background: rgba(255, 255, 255, 0.1); color: #cbd5e1; border: 1px solid rgba(255, 255, 255, 0.2); }

/* 真人发音控制面板 */
.audio-control-bar {
  display: flex;
  background: rgba(15, 9, 30, 0.7);
  border: 1px solid rgba(168, 85, 247, 0.25);
  border-radius: 12px;
  padding: 10px 14px;
  align-items: center;
}

.pronounce-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.accent-info {
  display: flex;
  align-items: center;
  gap: 6px;
}

.flag-icon { font-size: 14px; }
.accent-label {
  font-size: 11px;
  font-weight: 700;
  color: #94a3b8;
}
.phonetic-text {
  font-size: 12px;
  color: #c084fc;
  font-family: 'Times New Roman', serif;
}

.btn-play-audio {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 6px 12px;
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.25), rgba(124, 58, 237, 0.35));
  border: 1px solid rgba(168, 85, 247, 0.4);
  border-radius: 8px;
  color: #e9d5ff;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  overflow: hidden;
}
.btn-play-audio:hover {
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.4), rgba(124, 58, 237, 0.5));
  color: #fff;
  border-color: #c084fc;
  box-shadow: 0 0 12px rgba(168, 85, 247, 0.3);
}
.btn-play-audio.is-playing {
  border-color: #fbbf24;
  color: #fbbf24;
  box-shadow: 0 0 15px rgba(251, 191, 36, 0.4);
}

.sound-wave {
  display: inline-flex;
  align-items: flex-end;
  gap: 2px;
  height: 12px;
}
.sound-wave i {
  width: 2px;
  background: #fbbf24;
  border-radius: 1px;
  animation: waveAnim 0.6s ease-in-out infinite alternate;
}
.sound-wave i:nth-child(1) { height: 4px; animation-delay: 0.1s; }
.sound-wave i:nth-child(2) { height: 10px; animation-delay: 0.25s; }
.sound-wave i:nth-child(3) { height: 6px; animation-delay: 0.4s; }

@keyframes waveAnim {
  from { height: 3px; }
  to   { height: 12px; }
}

.pronounce-divider {
  width: 1px;
  height: 48px;
  background: rgba(168, 85, 247, 0.25);
  margin: 0 14px;
}

/* 释义卡片 */
.definition-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 12px 16px;
}

.def-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.pos-badge {
  font-size: 11px;
  font-weight: 800;
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.15);
  border: 1px solid rgba(56, 189, 248, 0.3);
  padding: 1px 6px;
  border-radius: 4px;
}

.def-lead {
  font-size: 12px;
  color: #94a3b8;
  font-weight: 700;
}

.trans-text {
  font-size: 15px;
  font-weight: 700;
  color: #f1f5f9;
  line-height: 1.5;
}

/* 例句卡片 */
.example-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 12px 16px;
}

.example-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}

.ex-icon { font-size: 13px; }
.ex-title {
  font-size: 12px;
  font-weight: 700;
  color: #94a3b8;
}

.example-en {
  font-size: 13px;
  color: #e2e8f0;
  line-height: 1.6;
  font-style: italic;
  margin-bottom: 6px;
}

.example-cn {
  font-size: 12px;
  color: #94a3b8;
  line-height: 1.5;
}

/* 底部操作 */
.card-footer {
  padding: 12px 20px;
  background: rgba(30, 18, 58, 0.95);
  border-top: 1px solid rgba(168, 85, 247, 0.25);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.foot-tip {
  font-size: 11px;
  color: #64748b;
}

.btn-confirm {
  padding: 7px 18px;
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-confirm:hover {
  background: linear-gradient(135deg, #a855f7, #8b5cf6);
  box-shadow: 0 0 12px rgba(168, 85, 247, 0.4);
}

/* 卡片过渡 */
.card-pop-enter-active, .card-pop-leave-active {
  transition: opacity 0.25s ease;
}
.card-pop-enter-from, .card-pop-leave-to {
  opacity: 0;
}
</style>
