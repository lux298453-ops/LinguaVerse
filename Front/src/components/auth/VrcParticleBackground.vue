<template>
  <div class="vrc-bg-wrapper">
    <!-- VRChat 标志性深渊空间背景 -->
    <div class="vrchat-ambient-bg"></div>
    <!-- 极细微的虚拟网格微光（经典元宇宙呼吸感） -->
    <div class="vrchat-grid-overlay"></div>
    <!-- 漂浮微光粒子 Canvas -->
    <canvas ref="canvasRef" class="vrchat-particles-canvas"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const canvasRef = ref(null)
let animationId = null
let handleResize = null

onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  let width = 0
  let height = 0
  let dpr = window.devicePixelRatio || 1

  function resize() {
    dpr = window.devicePixelRatio || 1
    width = window.innerWidth
    height = window.innerHeight
    canvas.width = width * dpr
    canvas.height = height * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  handleResize = resize
  window.addEventListener('resize', handleResize)
  resize()

  // 粒子池
  const particles = []
  const particleCount = Math.min(65, Math.floor((width * height) / 22000))

  class Particle {
    constructor(isInitial = false) {
      this.reset(isInitial)
    }

    reset(isInitial = false) {
      this.x = Math.random() * width
      this.y = isInitial ? Math.random() * height : height + 10 + Math.random() * 20
      this.radius = 1.0 + Math.random() * 2.4
      // 向上慢速飘移，微弱水平摆动
      this.vx = (Math.random() - 0.5) * 0.32
      this.vy = -(0.18 + Math.random() * 0.45)
      this.baseAlpha = 0.2 + Math.random() * 0.55
      this.pulseSpeed = 0.015 + Math.random() * 0.025
      this.pulsePhase = Math.random() * Math.PI * 2

      // 颜色采样：经典 VRChat 青绿 (80%)、高光青蓝 (15%)、极光冰白 (5%)
      const colorRoll = Math.random()
      if (colorRoll < 0.8) {
        this.color = '0, 180, 197' // VRChat Teal
      } else if (colorRoll < 0.95) {
        this.color = '0, 225, 245' // Bright Cyan
      } else {
        this.color = '210, 245, 255' // Ice Glow
      }

      // 12% 概率生成大号虚焦散斑光晕
      this.isBokeh = Math.random() < 0.12
      if (this.isBokeh) {
        this.radius = 14 + Math.random() * 26
        this.baseAlpha = 0.03 + Math.random() * 0.05
        this.vy = -(0.08 + Math.random() * 0.15)
      }
    }

    update() {
      this.x += this.vx + Math.sin(this.pulsePhase) * 0.12
      this.y += this.vy
      this.pulsePhase += this.pulseSpeed

      // 越界重置
      if (this.y < -this.radius * 2) {
        this.reset(false)
      }
      if (this.x < -this.radius * 2) {
        this.x = width + this.radius
      } else if (this.x > width + this.radius * 2) {
        this.x = -this.radius
      }
    }

    draw() {
      const alpha = Math.max(0.05, this.baseAlpha + Math.sin(this.pulsePhase) * 0.18)
      ctx.beginPath()
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)

      if (this.isBokeh) {
        const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius)
        grad.addColorStop(0, `rgba(${this.color}, ${alpha})`)
        grad.addColorStop(0.6, `rgba(${this.color}, ${alpha * 0.4})`)
        grad.addColorStop(1, `rgba(${this.color}, 0)`)
        ctx.fillStyle = grad
        ctx.shadowBlur = 0
      } else {
        ctx.fillStyle = `rgba(${this.color}, ${alpha})`
        ctx.shadowColor = `rgba(${this.color}, 0.8)`
        ctx.shadowBlur = this.radius * 3.5
      }

      ctx.fill()
    }
  }

  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle(true))
  }

  function render() {
    ctx.clearRect(0, 0, width, height)
    for (let i = 0; i < particles.length; i++) {
      particles[i].update()
      particles[i].draw()
    }
    animationId = requestAnimationFrame(render)
  }

  render()
})

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
  if (handleResize) {
    window.removeEventListener('resize', handleResize)
  }
})
</script>

<style scoped>
.vrc-bg-wrapper {
  position: fixed;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
}

/* VRChat 标志性极简深暗空间背景：低饱和度暗青光晕 */
.vrchat-ambient-bg {
  position: absolute;
  inset: 0;
  background: 
    radial-gradient(circle at 18% 20%, rgba(0, 180, 197, 0.12) 0%, transparent 45%),
    radial-gradient(circle at 82% 80%, rgba(6, 182, 212, 0.08) 0%, transparent 50%),
    radial-gradient(circle at 50% 50%, rgba(15, 23, 42, 0.5) 0%, transparent 60%),
    #080d11;
}

/* 极细微的虚拟网格微光 */
.vrchat-grid-overlay {
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
  background-size: 60px 60px;
  mask-image: radial-gradient(circle at 50% 50%, rgba(0,0,0,0.8) 0%, transparent 80%);
  -webkit-mask-image: radial-gradient(circle at 50% 50%, rgba(0,0,0,0.8) 0%, transparent 80%);
}

/* 粒子 Canvas */
.vrchat-particles-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
</style>
