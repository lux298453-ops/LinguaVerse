<template>
  <transition name="loading-gate-fade">
    <div v-if="visible" class="epic-loading-gate">
      <!-- 动态星空与以太微尘画布（超轻量 25 个浮游光子） -->
      <canvas ref="particleCanvasRef" class="particle-canvas" />

      <!-- 背景深邃径向光晕 -->
      <div class="ambient-glow" />

      <!-- 中央核心史诗星盘仪式台 -->
      <div class="astrolabe-portal">
        <!-- 外层逆时针旋转星象环 -->
        <svg class="ring-svg outer-ring" viewBox="0 0 240 240">
          <circle cx="120" cy="120" r="110" stroke="rgba(251, 191, 36, 0.25)" stroke-width="1.5" fill="none" stroke-dasharray="6 8" />
          <circle cx="120" cy="120" r="102" stroke="rgba(99, 102, 241, 0.35)" stroke-width="1" fill="none" />
          <!-- 4 象限符文星标 -->
          <polygon points="120,8 124,18 120,15 116,18" fill="#f59e0b" />
          <polygon points="120,232 124,222 120,225 116,222" fill="#f59e0b" />
          <polygon points="8,120 18,124 15,120 18,116" fill="#f59e0b" />
          <polygon points="232,120 222,124 225,120 222,116" fill="#f59e0b" />
        </svg>

        <!-- 内层顺时针旋转奥术环 -->
        <svg class="ring-svg inner-ring" viewBox="0 0 240 240">
          <circle cx="120" cy="120" r="78" stroke="rgba(56, 189, 248, 0.45)" stroke-width="1.5" fill="none" stroke-dasharray="14 10" />
          <circle cx="120" cy="120" r="64" stroke="rgba(244, 63, 94, 0.3)" stroke-width="1" fill="none" stroke-dasharray="4 6" />
          <!-- 8 方向能量刻度点 -->
          <circle cx="120" cy="42" r="2.5" fill="#38bdf8" />
          <circle cx="120" cy="198" r="2.5" fill="#38bdf8" />
          <circle cx="42" cy="120" r="2.5" fill="#38bdf8" />
          <circle cx="198" cy="120" r="2.5" fill="#38bdf8" />
          <circle cx="65" cy="65" r="2" fill="#818cf8" />
          <circle cx="175" cy="65" r="2" fill="#818cf8" />
          <circle cx="65" cy="175" r="2" fill="#818cf8" />
          <circle cx="175" cy="175" r="2" fill="#818cf8" />
        </svg>

        <!-- 核心图腾与标题 -->
        <div class="portal-emblem">
          <div class="crest-icon-box">
            <span class="crest-sigil">✦</span>
          </div>
          <h1 class="portal-world-title">LinguaVerse</h1>
          <div class="portal-world-sub">灵 语 之 界 · 虚 拟 维 度</div>
        </div>
      </div>

      <!-- 能量进度条底座 -->
      <div class="loading-console">
        <!-- 阶段性技术/魔导状态文案 -->
        <div class="status-indicator">
          <span class="status-dot"></span>
          <span class="status-text">{{ currentStageText }}</span>
          <span class="status-percent">{{ displayPercent }}%</span>
        </div>

        <!-- 史诗能量槽 -->
        <div class="mana-gauge-track">
          <div class="mana-gauge-fill" :style="{ width: `${displayPercent}%` }">
            <!-- 能量流前端彗星光斑 -->
            <div class="mana-spark" />
          </div>
        </div>

        <!-- 游戏世界观史诗箴言 (Cycling Lore Tips) -->
        <div class="lore-tip-container">
          <transition name="tip-fade" mode="out-in">
            <p :key="currentTipIndex" class="lore-tip-text">
              {{ LORE_TIPS[currentTipIndex] }}
            </p>
          </transition>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  // 外部传入真实加载比例 0 ~ 1
  realProgress: {
    type: Number,
    default: 0
  },
  // 是否已加载就绪
  isReady: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['loaded'])

const visible = ref(true)
const smoothProgress = ref(0)
const displayPercent = computed(() => Math.min(100, Math.round(smoothProgress.value * 100)))

// 阶段性文案演进
const currentStageText = computed(() => {
  const p = smoothProgress.value
  if (p < 0.25) return '正在唤醒灵语世界经纬...'
  if (p < 0.55) return '正在构筑 Sunshine Hall 场景实体...'
  if (p < 0.85) return '正在共鸣空间聊天与冒险者节点...'
  if (p < 0.99) return '正在注入全息环境光影...'
  return '传送之门已开启，降临中...'
})

// 史诗世界观冒险箴言
const LORE_TIPS = [
  '「每一个单词，都是构筑灵语大陆的璀璨魔法基石。」',
  '「在阳光大厅寻找导游 Mary，开启初访者的专属试炼委托。」',
  '「穿过东侧传送门造访奇幻游戏区，在桌游对决中激发词汇共鸣。」',
  '「地道俚语是通往高阶冒险者的语言秘钥，茶歇馆常备甘醇与灵感。」',
  '「轻按键盘空格或方向键漫游世界，与身边的同伴挥手致意。」'
]
const currentTipIndex = ref(0)
let tipTimer = null

// 画布粒子系统
const particleCanvasRef = ref(null)
let animId = null

function initParticles() {
  const canvas = particleCanvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const resize = () => {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
  }
  resize()
  window.addEventListener('resize', resize)

  const particles = Array.from({ length: 30 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 1.8 + 0.6,
    speedY: Math.random() * 0.4 + 0.15,
    speedX: (Math.random() - 0.5) * 0.2,
    alpha: Math.random() * 0.6 + 0.2,
    phase: Math.random() * Math.PI * 2
  }))

  const render = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    for (const p of particles) {
      p.y -= p.speedY
      p.x += p.speedX
      p.phase += 0.02
      if (p.y < -10) {
        p.y = canvas.height + 10
        p.x = Math.random() * canvas.width
      }
      const curAlpha = p.alpha + Math.sin(p.phase) * 0.2
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(147, 197, 253, ${Math.max(0, Math.min(1, curAlpha))})`
      ctx.shadowBlur = 8
      ctx.shadowColor = '#38bdf8'
      ctx.fill()
    }
    animId = requestAnimationFrame(render)
  }
  render()
}

// 平滑进度仿真循环：即便真实资源下载飞快，也保留 0.9s 优雅的仪式感，绝不闪烁卡顿
let simTimer = null
function startProgressAnimation() {
  simTimer = setInterval(() => {
    // 目标进度取真实进度与平滑上限的最大保底
    let target = Math.max(props.realProgress, smoothProgress.value)

    if (props.isReady) {
      target = 1
    } else {
      // 真实未完成时，平滑爬升最高到 92%，等待场景完全初始化
      target = Math.min(0.92, target + 0.015)
    }

    if (smoothProgress.value < target) {
      const step = (target - smoothProgress.value) * 0.12 + 0.005
      smoothProgress.value = Math.min(target, smoothProgress.value + step)
    }

    if (props.isReady && smoothProgress.value >= 0.99) {
      smoothProgress.value = 1
      clearInterval(simTimer)
      // 达成 100% 后稍停 250ms 优雅淡出
      setTimeout(() => {
        visible.value = false
        emit('loaded')
      }, 350)
    }
  }, 30)
}

onMounted(() => {
  initParticles()
  startProgressAnimation()
  tipTimer = setInterval(() => {
    currentTipIndex.value = (currentTipIndex.value + 1) % LORE_TIPS.length
  }, 3500)
})

onUnmounted(() => {
  if (animId) cancelAnimationFrame(animId)
  if (simTimer) clearInterval(simTimer)
  if (tipTimer) clearInterval(tipTimer)
})
</script>

<style scoped>
/* 全屏史诗加载幕布 */
.epic-loading-gate {
  position: absolute;
  inset: 0;
  z-index: 999;
  background: radial-gradient(circle at center, #111827 0%, #030712 75%, #000000 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  user-select: none;
  pointer-events: all;
}

/* 浮游粒子画布 */
.particle-canvas {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
}

/* 柔和环境光晕 */
.ambient-glow {
  position: absolute;
  width: 480px;
  height: 480px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(79, 70, 229, 0.25) 0%, rgba(37, 99, 235, 0.08) 50%, transparent 70%);
  filter: blur(40px);
  pointer-events: none;
  z-index: 1;
  animation: pulse-glow 4s ease-in-out infinite alternate;
}

@keyframes pulse-glow {
  0% { transform: scale(0.9); opacity: 0.7; }
  100% { transform: scale(1.15); opacity: 1; }
}

/* 星盘与传送仪式台 */
.astrolabe-portal {
  position: relative;
  width: 260px;
  height: 260px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  margin-bottom: 30px;
}

.ring-svg {
  position: absolute;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

/* 外环自转 */
.outer-ring {
  animation: rotate-counter 26s linear infinite;
}

/* 内环自转 */
.inner-ring {
  animation: rotate-clock 16s linear infinite;
}

@keyframes rotate-clock {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes rotate-counter {
  from { transform: rotate(0deg); }
  to { transform: rotate(-360deg); }
}

/* 中央图腾 */
.portal-emblem {
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 3;
}

.crest-icon-box {
  width: 46px;
  height: 46px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.4), rgba(124, 58, 237, 0.4));
  border: 1.5px solid rgba(251, 191, 36, 0.5);
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.5), inset 0 0 12px rgba(251, 191, 36, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  animation: float-sigil 3s ease-in-out infinite alternate;
}

@keyframes float-sigil {
  0% { transform: translateY(0); box-shadow: 0 0 16px rgba(59, 130, 246, 0.4); }
  100% { transform: translateY(-3px); box-shadow: 0 0 28px rgba(124, 58, 237, 0.7); }
}

.crest-sigil {
  font-size: 22px;
  color: #fbbf24;
  text-shadow: 0 0 10px #f59e0b;
}

.portal-world-title {
  font-size: 24px;
  font-weight: 900;
  letter-spacing: 2px;
  margin: 0;
  background: linear-gradient(135deg, #ffffff 30%, #93c5fd 70%, #60a5fa 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 2px 14px rgba(59, 130, 246, 0.35);
  font-family: system-ui, -apple-system, sans-serif;
}

.portal-world-sub {
  font-size: 10px;
  font-weight: 700;
  color: #94a3b8;
  letter-spacing: 3px;
  margin-top: 5px;
  text-transform: uppercase;
}

/* 控制台与能量条 */
.loading-console {
  width: 360px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 2;
}

.status-indicator {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: #cbd5e1;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #38bdf8;
  box-shadow: 0 0 8px #38bdf8;
  display: inline-block;
  margin-right: 8px;
  animation: blink 1.2s ease-in-out infinite;
}

@keyframes blink {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}

.status-text {
  flex: 1;
  font-size: 11.5px;
  color: #94a3b8;
  letter-spacing: 0.3px;
}

.status-percent {
  font-family: monospace;
  font-weight: 700;
  color: #38bdf8;
  font-size: 12px;
}

/* 史诗能量槽 */
.mana-gauge-track {
  width: 100%;
  height: 6px;
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  overflow: hidden;
  position: relative;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.6);
}

.mana-gauge-fill {
  height: 100%;
  background: linear-gradient(90deg, #38bdf8 0%, #818cf8 60%, #f59e0b 100%);
  border-radius: 10px;
  position: relative;
  transition: width 0.1s linear;
  box-shadow: 0 0 12px rgba(56, 189, 248, 0.6);
}

.mana-spark {
  position: absolute;
  right: -2px;
  top: -2px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 0 10px #ffffff, 0 0 16px #38bdf8;
}

/* 世界观箴言容器 */
.lore-tip-container {
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  margin-top: 14px;
}

.lore-tip-text {
  margin: 0;
  font-size: 11.5px;
  color: #64748b;
  line-height: 1.4;
  font-style: italic;
  letter-spacing: 0.3px;
}

/* 提示文字过渡 */
.tip-fade-enter-active,
.tip-fade-leave-active {
  transition: all 0.35s ease;
}

.tip-fade-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.tip-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* 离场破晓转场动效 (Exit Iris Wipe & Scale) */
.loading-gate-fade-enter-active {
  transition: opacity 0.3s;
}

.loading-gate-fade-leave-active {
  transition: opacity 0.65s cubic-bezier(0.16, 1, 0.3, 1), transform 0.65s cubic-bezier(0.16, 1, 0.3, 1);
}

.loading-gate-fade-leave-to {
  opacity: 0;
  transform: scale(1.04);
}
</style>
