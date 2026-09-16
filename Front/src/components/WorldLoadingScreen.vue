<template>
  <transition name="loading-gate-fade">
    <div v-if="visible" class="vrc-loading-gate">
      <!-- 动态以太微尘与浮游光子画布（同源 VRChat 漂浮微光） -->
      <canvas ref="particleCanvasRef" class="particle-canvas" />

      <!-- 背景深邃冷夜微光光晕 -->
      <div class="ambient-glow" />

      <!-- 中央舞台：洛克王国风格 · 地图场景画卷轮播 HUD -->
      <div class="map-carousel-stage">
        <!-- 顶栏元宇宙徽标与区域切换指示器 -->
        <div class="stage-header">
          <div class="stage-brand">
            <span class="stage-brand-dot"></span>
            <span class="stage-brand-title">LINGUAVERSE</span>
            <span class="stage-brand-sub">· WORLD GATEWAY</span>
          </div>

          <!-- 场景指示胶囊点 (可点击直达预览) -->
          <div class="carousel-indicators">
            <span
              v-for="(scene, idx) in MAP_SCENES"
              :key="scene.id"
              class="indicator-pill"
              :class="{ active: currentSceneIndex === idx }"
              @click="selectScene(idx)"
              :title="scene.nameCn"
            />
          </div>
        </div>

        <!-- 地图画卷视口卡片 -->
        <div class="map-card-viewport">
          <transition name="scene-crossfade" mode="out-in">
            <div
              :key="currentScene.id"
              class="map-scene-item"
            >
              <!-- 场景原画背景（带慢速呼吸推镜 Ken Burns 特效） -->
              <div
                class="scene-artwork"
                :style="{ backgroundImage: `url(${currentScene.image})` }"
              />

              <!-- 暗角与高对比度渐变遮罩 -->
              <div class="scene-vignette-overlay" />

              <!-- 场景左上方徽章 -->
              <div class="scene-top-badge">
                <span class="badge-tag">{{ currentScene.badge }}</span>
                <span class="badge-realm">REALM // 0{{ currentSceneIndex + 1 }}</span>
              </div>

              <!-- 场景底部详细情报信息 HUD -->
              <div class="scene-info-hud">
                <div class="scene-title-row">
                  <h2 class="scene-name-en">{{ currentScene.nameEn }}</h2>
                  <span class="scene-name-cn">{{ currentScene.nameCn }}</span>
                  <span class="scene-subtitle">{{ currentScene.subtitle }}</span>
                </div>

                <p class="scene-desc">
                  {{ currentScene.desc }}
                </p>

                <!-- 特性玩法标签 -->
                <div class="scene-tags-row">
                  <span
                    v-for="(feat, fIdx) in currentScene.features"
                    :key="fIdx"
                    class="scene-feat-tag"
                  >
                    ✦ {{ feat }}
                  </span>
                </div>
              </div>
            </div>
          </transition>
        </div>
      </div>

      <!-- 底部控制台：极细松石青能量槽与实时状态 -->
      <div class="loading-console">
        <!-- 阶段性技术状态与跳动光点 -->
        <div class="status-indicator">
          <div class="status-left">
            <div class="vrc-pulsing-dots">
              <span class="dot"></span>
              <span class="dot"></span>
              <span class="dot"></span>
            </div>
            <span class="status-text">{{ currentStageText }}</span>
          </div>
          <span class="status-percent">{{ displayPercent }}%</span>
        </div>

        <!-- VRChat 极细松石青光纤能量槽 -->
        <div class="mana-gauge-track">
          <div class="mana-gauge-fill" :style="{ width: `${displayPercent}%` }">
            <!-- 能量流前端彗星高光光斑 -->
            <div class="mana-spark" />
          </div>
        </div>

        <!-- 底部极简探索箴言 -->
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
import { ref, computed, onMounted, onUnmounted } from 'vue'

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

// 洛克王国风格场景地图轮播数据表
const MAP_SCENES = [
  {
    id: 'sunshine_hall',
    badge: '📍 核心始发地',
    nameEn: 'Sunshine Hall',
    nameCn: '阳光大厅',
    image: '/assets/maps/sunshine_hall.jpg',
    subtitle: '自由漫步与跨国社交中枢',
    desc: '与全球英语探索者同聚一堂！向导 Mary 正在中央长廊等候，为你提供初访试炼委托与信件递送指引。',
    features: ['空间立体语音', '向导 Mary 剧情任务', '全息广场漫步']
  },
  {
    id: 'fantasy_arcade',
    badge: '🎮 单词竞速擂台',
    nameEn: 'Arcade Zone',
    nameCn: '奇幻街机区',
    image: '/assets/maps/fantasy_arcade.jpg',
    subtitle: '双人接龙与极速打字对决',
    desc: '在炫彩街机台开启词汇风暴！支持「打字竞速 Type Rush」与「灵语接龙 Word Chain」高能对抗。',
    features: ['造句共鸣额外加分', '词库智能匹配', '星语金币对战奖励']
  },
  {
    id: 'arcane_library',
    badge: '🏛️ 学术古籍阁',
    nameEn: 'Arcane Codex',
    nameCn: '奥术藏书阁',
    image: '/assets/maps/arcane_library.jpg',
    subtitle: '古卷残页修复与学术进阶',
    desc: '静谧的古籍殿堂收藏着四海典籍，沉浸式修复学术词汇残卷，探索深层语源与词根奥秘。',
    features: ['生词高亮收藏', '词根词缀深度解析', '艾宾浩斯复习记忆']
  }
]

const currentSceneIndex = ref(0)
const currentScene = computed(() => MAP_SCENES[currentSceneIndex.value])
let sceneTimer = null

function selectScene(index) {
  currentSceneIndex.value = index
  resetSceneTimer()
}

function resetSceneTimer() {
  if (sceneTimer) clearInterval(sceneTimer)
  sceneTimer = setInterval(() => {
    currentSceneIndex.value = (currentSceneIndex.value + 1) % MAP_SCENES.length
  }, 3800)
}

// 动态阶段性技术状态
const currentStageText = computed(() => {
  const p = smoothProgress.value
  const targetMap = currentScene.value.nameEn
  if (p < 0.25) return `正在建立世界空间坐标，接入 ${targetMap}...`
  if (p < 0.55) return `正在渲染 ${targetMap} 高精度地形与材质实体...`
  if (p < 0.85) return '正在同步多人空间距离语音通道与 NPC 节点...'
  if (p < 0.99) return '全息光影与着色器注入完成，准备传送降临...'
  return '传送之门已开启，正在载入虚拟维度...'
})

// 底部探索箴言
const LORE_TIPS = [
  '「在世界中靠近其他玩家，空间立体语音将随距离自然衰减，靠近即可畅聊。」',
  '「在阳光大厅寻找导游 Mary，开启你的第一篇信件递送英语试炼。」',
  '「奇幻街机区支持造句共鸣：完成单词接龙后尝试造句，可激活高额得分加成！」',
  '「在个人中心可随时更换 12 种不同风格的专属虚拟角色头像与头衔。」',
  '「轻按键盘方向键或 WASD 即可漫游世界，按回车键唤起即时聊天框。」'
]
const currentTipIndex = ref(0)
let tipTimer = null

// Canvas 浮游微光粒子系统（同源 VRChat 青碧微光）
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

  const particles = Array.from({ length: 36 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 2.0 + 0.8,
    speedY: Math.random() * 0.35 + 0.12,
    speedX: (Math.random() - 0.5) * 0.2,
    alpha: Math.random() * 0.55 + 0.2,
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
      const curAlpha = p.alpha + Math.sin(p.phase) * 0.18
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(0, 180, 197, ${Math.max(0.08, Math.min(0.9, curAlpha))})`
      ctx.shadowBlur = p.r * 4
      ctx.shadowColor = '#00e5ff'
      ctx.fill()
    }
    animId = requestAnimationFrame(render)
  }
  render()
}

// 平滑进度仿真循环
let simTimer = null
function startProgressAnimation() {
  simTimer = setInterval(() => {
    let target = Math.max(props.realProgress, smoothProgress.value)

    if (props.isReady) {
      target = 1
    } else {
      // 真实未完成时平滑爬升到 92%，等待场景完全初始化
      target = Math.min(0.92, target + 0.015)
    }

    if (smoothProgress.value < target) {
      const step = (target - smoothProgress.value) * 0.12 + 0.006
      smoothProgress.value = Math.min(target, smoothProgress.value + step)
    }

    if (props.isReady && smoothProgress.value >= 0.99) {
      smoothProgress.value = 1
      clearInterval(simTimer)
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
  resetSceneTimer()
  tipTimer = setInterval(() => {
    currentTipIndex.value = (currentTipIndex.value + 1) % LORE_TIPS.length
  }, 4200)
})

onUnmounted(() => {
  if (animId) cancelAnimationFrame(animId)
  if (simTimer) clearInterval(simTimer)
  if (sceneTimer) clearInterval(sceneTimer)
  if (tipTimer) clearInterval(tipTimer)
})
</script>

<style scoped>
/* 全屏深渊背景：VRChat 经典曜石黑板岩 */
.vrc-loading-gate {
  position: absolute;
  inset: 0;
  z-index: 999;
  background: radial-gradient(circle at center, #0e151c 0%, #080d11 75%, #04070a 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  user-select: none;
  pointer-events: all;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

/* 浮游粒子画布 */
.particle-canvas {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
}

/* 环境微光 */
.ambient-glow {
  position: absolute;
  width: 600px;
  height: 600px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(0, 180, 197, 0.12) 0%, rgba(6, 182, 212, 0.03) 50%, transparent 70%);
  filter: blur(50px);
  pointer-events: none;
  z-index: 1;
  animation: vrcPulseGlow 5s ease-in-out infinite alternate;
}

@keyframes vrcPulseGlow {
  0% { transform: scale(0.9); opacity: 0.7; }
  100% { transform: scale(1.15); opacity: 1; }
}

/* ===== 中央舞台：洛克王国风格地图卡片视口 ===== */
.map-carousel-stage {
  position: relative;
  z-index: 2;
  width: 820px;
  max-width: 90vw;
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

/* 顶栏品牌标与指示器 */
.stage-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 4px;
}

.stage-brand {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stage-brand-dot {
  width: 8px;
  height: 8px;
  background: #00b4c5;
  border-radius: 50%;
  box-shadow: 0 0 10px #00b4c5;
}

.stage-brand-title {
  font-size: 14px;
  font-weight: 800;
  color: #ffffff;
  letter-spacing: 1.5px;
}

.stage-brand-sub {
  font-size: 11px;
  font-weight: 700;
  color: #00b4c5;
  letter-spacing: 2px;
}

/* 场景胶囊圆点指示器 */
.carousel-indicators {
  display: flex;
  align-items: center;
  gap: 8px;
}

.indicator-pill {
  width: 22px;
  height: 5px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.18);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.indicator-pill.active {
  width: 36px;
  background: #00b4c5;
  box-shadow: 0 0 10px rgba(0, 180, 197, 0.7);
}

/* 地图视口卡片：精琢的 VRChat 板岩外框 */
.map-card-viewport {
  position: relative;
  width: 100%;
  height: 400px;
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid #1c2b37;
  background: #090e13;
  box-shadow: 
    0 24px 60px -12px rgba(0, 0, 0, 0.95),
    0 0 40px -5px rgba(0, 180, 197, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.map-scene-item {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

/* 场景大原画与慢速呼吸推镜 (Ken Burns 动效) */
.scene-artwork {
  position: absolute;
  inset: -15px;
  background-size: cover;
  background-position: center;
  animation: kenBurns 14s ease-in-out infinite alternate;
}

@keyframes kenBurns {
  0% { transform: scale(1) translate(0, 0); }
  100% { transform: scale(1.06) translate(-8px, -4px); }
}

/* 暗角与遮罩 */
.scene-vignette-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to top,
    rgba(8, 13, 17, 0.96) 0%,
    rgba(8, 13, 17, 0.65) 35%,
    rgba(8, 13, 17, 0.15) 70%,
    rgba(8, 13, 17, 0.7) 100%
  );
  pointer-events: none;
}

/* 场景左上方徽章 */
.scene-top-badge {
  position: absolute;
  top: 18px;
  left: 22px;
  display: flex;
  align-items: center;
  gap: 10px;
  z-index: 3;
}

.badge-tag {
  font-size: 11px;
  font-weight: 700;
  color: #061016;
  background: #00b4c5;
  padding: 3px 10px;
  border-radius: 6px;
  box-shadow: 0 0 14px rgba(0, 180, 197, 0.6);
  letter-spacing: 0.5px;
}

.badge-realm {
  font-size: 11px;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.6);
  letter-spacing: 1.5px;
  font-family: monospace;
}

/* 场景底部详细情报 HUD */
.scene-info-hud {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 24px 28px;
  z-index: 3;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.scene-title-row {
  display: flex;
  align-items: baseline;
  gap: 12px;
  flex-wrap: wrap;
}

.scene-name-en {
  font-size: 26px;
  font-weight: 800;
  color: #ffffff;
  letter-spacing: -0.3px;
  margin: 0;
}

.scene-name-cn {
  font-size: 18px;
  font-weight: 700;
  color: #00b4c5;
  text-shadow: 0 0 16px rgba(0, 180, 197, 0.5);
}

.scene-subtitle {
  font-size: 12px;
  color: #7f91a3;
  font-weight: 500;
  margin-left: 4px;
}

.scene-desc {
  font-size: 12.5px;
  color: #cbd5e1;
  line-height: 1.6;
  margin: 0;
  max-width: 720px;
}

/* 特性标签行 */
.scene-tags-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 2px;
}

.scene-feat-tag {
  font-size: 11px;
  font-weight: 600;
  color: #00b4c5;
  background: rgba(0, 180, 197, 0.1);
  border: 1px solid rgba(0, 180, 197, 0.25);
  border-radius: 999px;
  padding: 3px 10px;
}

/* 场景平滑交叉淡入淡出 */
.scene-crossfade-enter-active,
.scene-crossfade-leave-active {
  transition: opacity 0.75s ease-in-out;
}

.scene-crossfade-enter-from,
.scene-crossfade-leave-to {
  opacity: 0;
}

/* ===== 底部加载控制台 ===== */
.loading-console {
  width: 820px;
  max-width: 90vw;
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
}

.status-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* 跳动的光点动效 */
.vrc-pulsing-dots {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 16px;
}

.vrc-pulsing-dots .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #00b4c5;
  box-shadow: 0 0 8px rgba(0, 180, 197, 0.6);
  animation: vrcBounce 1.4s ease-in-out infinite;
}

.vrc-pulsing-dots .dot:nth-child(1) { animation-delay: 0s; }
.vrc-pulsing-dots .dot:nth-child(2) { animation-delay: 0.2s; }
.vrc-pulsing-dots .dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes vrcBounce {
  0%, 80%, 100% { transform: translateY(0) scale(0.85); opacity: 0.4; }
  40% { transform: translateY(-4px) scale(1.2); opacity: 1; box-shadow: 0 0 12px #00b4c5; }
}

.status-text {
  font-size: 12px;
  color: #7f91a3;
  letter-spacing: 0.3px;
}

.status-percent {
  font-family: monospace;
  font-weight: 800;
  color: #00b4c5;
  font-size: 13px;
  text-shadow: 0 0 10px rgba(0, 180, 197, 0.5);
}

/* VRChat 极细松石青能量槽 */
.mana-gauge-track {
  width: 100%;
  height: 5px;
  background: #0b1218;
  border: 1px solid #1c2b37;
  border-radius: 10px;
  overflow: hidden;
  position: relative;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.7);
}

.mana-gauge-fill {
  height: 100%;
  background: linear-gradient(90deg, #008f9d 0%, #00b4c5 70%, #00e5ff 100%);
  border-radius: 10px;
  position: relative;
  transition: width 0.08s linear;
  box-shadow: 0 0 12px rgba(0, 180, 197, 0.65);
}

.mana-spark {
  position: absolute;
  right: -2px;
  top: -3px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 0 10px #ffffff, 0 0 18px #00b4c5;
}

/* 箴言提示容器 */
.lore-tip-container {
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  margin-top: 6px;
}

.lore-tip-text {
  margin: 0;
  font-size: 11.5px;
  color: #627688;
  letter-spacing: 0.3px;
}

.tip-fade-enter-active,
.tip-fade-leave-active {
  transition: opacity 0.4s ease;
}

.tip-fade-enter-from,
.tip-fade-leave-to {
  opacity: 0;
}

.loading-gate-fade-leave-active {
  transition: opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1), transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.loading-gate-fade-leave-to {
  opacity: 0;
  transform: scale(1.02);
}

@media (max-width: 860px) {
  .map-card-viewport {
    height: 320px;
  }
  .scene-name-en {
    font-size: 20px;
  }
  .scene-name-cn {
    font-size: 15px;
  }
  .scene-desc {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}
</style>
