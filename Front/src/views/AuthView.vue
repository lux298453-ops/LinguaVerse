<template>
  <div class="vrc-auth-page">
    <!-- VRChat 漂浮微光粒子背景 -->
    <VrcParticleBackground />

    <!-- 双栏主卡片容器 -->
    <div class="vrc-main-card">
      <!-- ===== 左栏：虚拟世界探索总览 ===== -->
      <div class="vrc-left-column">
        <!-- Brand Logo -->
        <div class="vrc-brand-group">
          <div class="vrc-logo-badge">
            <svg viewBox="0 0 24 24">
              <path d="M21 7H3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2v-2H3V9h18v6h-2v2h2a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zM7 11a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm10 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/>
            </svg>
          </div>
          <div class="vrc-brand-text">
            <div class="vrc-brand-name">LINGUAVERSE</div>
            <div class="vrc-brand-tag">Virtual Language Metaverse</div>
          </div>
        </div>

        <!-- 核心文案与场景 -->
        <div class="vrc-hero-section">
          <h1 class="vrc-headline">
            漫步虚拟世界，<br>
            开启<span>多维沉浸式英语探索</span>
          </h1>
          <p class="vrc-description">
            与全球英语探索者同聚一堂！在开放自由的虚拟大厅中自由对话、在接龙区同台较量、漫游学术藏书楼与地道茶歇空间。
          </p>

          <!-- 四大核心场景空间 -->
          <div class="vrc-worlds-grid">
            <div class="vrc-world-item">
              <div class="vrc-world-icon">☀️</div>
              <div class="vrc-world-info">
                <span class="vrc-world-name">Sunshine Hall</span>
                <span class="vrc-world-sub">阳光大厅 · 自由漫步与向导</span>
              </div>
            </div>

            <div class="vrc-world-item">
              <div class="vrc-world-icon">🎮</div>
              <div class="vrc-world-info">
                <span class="vrc-world-name">Arcade Zone</span>
                <span class="vrc-world-sub">单词接龙 · 打字竞速擂台</span>
              </div>
            </div>

            <div class="vrc-world-item">
              <div class="vrc-world-icon">☕</div>
              <div class="vrc-world-info">
                <span class="vrc-world-name">Slang Lounge</span>
                <span class="vrc-world-sub">俚语茶歇 · 地道原声表达</span>
              </div>
            </div>

            <div class="vrc-world-item">
              <div class="vrc-world-icon">🏛️</div>
              <div class="vrc-world-info">
                <span class="vrc-world-name">Arcane Codex</span>
                <span class="vrc-world-sub">奥术藏书阁 · 修复残卷任务</span>
              </div>
            </div>
          </div>

          <!-- 空间特性标签 -->
          <div class="vrc-feature-tags">
            <span class="vrc-tag">✦ 空间实时漫游</span>
            <span class="vrc-tag">✦ 智能NPC口语对话</span>
            <span class="vrc-tag">✦ 单词接龙与打字对战</span>
          </div>

          <!-- 沉浸式功能提示 -->
          <div class="vrc-immersion-tip">
            <span class="vrc-immersion-tip-icon">🎙️</span>
            <span>支持空间距离立体语音衰减，靠近同伴即可畅聊交互</span>
          </div>
        </div>

        <!-- 底部指示栏：跳动的微光点 + 快捷键提示 -->
        <div class="vrc-left-footer">
          <div class="vrc-pulsing-dots" title="System Ready">
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
          </div>
          <span>↵ Enter 快速{{ currentMode === 'login' ? '登录' : '提交' }}</span>
        </div>
      </div>

      <!-- ===== 右栏：登录 / 注册操作区 ===== -->
      <div class="vrc-right-column">
        <!-- 模式切换 Tab -->
        <div class="vrc-tab-bar">
          <button
            type="button"
            class="vrc-tab-btn"
            :class="{ active: currentMode === 'login' }"
            @click="switchMode('login')"
          >
            登录账号
          </button>
          <button
            type="button"
            class="vrc-tab-btn"
            :class="{ active: currentMode === 'register' }"
            @click="switchMode('register')"
          >
            新用户注册
          </button>
        </div>

        <!-- 动态标题 -->
        <h2 class="vrc-form-title">
          {{ currentMode === 'login' ? '欢迎回到灵语世界' : '创建灵语世界账号' }}
        </h2>
        <p class="vrc-form-desc">
          {{ currentMode === 'login' ? '请输入你的账号密码，载入虚拟世界' : '填写基础信息，开启多维沉浸式虚拟学习' }}
        </p>

        <!-- 表单结构 -->
        <el-form
          ref="formRef"
          :model="form"
          :rules="currentRules"
          label-position="top"
          @keyup.enter="handleSubmit"
          class="vrc-el-form"
        >
          <!-- 用户名 -->
          <el-form-item prop="username" label="用户名 (USERNAME)">
            <el-input
              v-model="form.username"
              placeholder="请输入账号用户名"
              size="large"
              clearable
              class="vrc-custom-input"
            >
              <template #prefix>
                <el-icon class="vrc-input-icon"><User /></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <!-- 昵称（注册时出现） -->
          <el-form-item
            v-if="currentMode === 'register'"
            prop="nickname"
            label="世界昵称 (NICKNAME - 选填)"
          >
            <el-input
              v-model="form.nickname"
              placeholder="头顶展示昵称（例如：Leo）"
              size="large"
              clearable
              class="vrc-custom-input"
            >
              <template #prefix>
                <el-icon class="vrc-input-icon"><Star /></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <!-- 密码 -->
          <el-form-item prop="password" label="密码 (PASSWORD)">
            <el-input
              v-model="form.password"
              type="password"
              placeholder="请输入密码（6-20位）"
              size="large"
              show-password
              class="vrc-custom-input"
            >
              <template #prefix>
                <el-icon class="vrc-input-icon"><Lock /></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <!-- 确认密码（注册时出现） -->
          <el-form-item
            v-if="currentMode === 'register'"
            prop="confirmPassword"
            label="确认密码 (CONFIRM PASSWORD)"
          >
            <el-input
              v-model="form.confirmPassword"
              type="password"
              placeholder="请再次输入相同密码"
              size="large"
              show-password
              class="vrc-custom-input"
            >
              <template #prefix>
                <el-icon class="vrc-input-icon"><CircleCheck /></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <!-- 记住登录状态 / 忘记密码（仅登录模式展示） -->
          <div v-if="currentMode === 'login'" class="vrc-options-row">
            <el-checkbox v-model="rememberMe" class="vrc-checkbox">记住登录状态</el-checkbox>
            <a href="javascript:void(0)" class="vrc-forgot-btn" @click="handleForgot">忘记密码？</a>
          </div>

          <!-- VRChat 实心青绿大按键 -->
          <div class="vrc-btn-wrap">
            <button
              type="button"
              class="vrc-submit-btn"
              :disabled="loading"
              @click="handleSubmit"
            >
              <span v-if="loading" class="vrc-spinner"></span>
              <span>{{ currentMode === 'login' ? '进入灵语世界' : '注 册 账 号' }}</span>
              <svg v-if="!loading" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
          </div>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, Star, CircleCheck } from '@element-plus/icons-vue'
import { login, register } from '../api/auth'
import { useUserStore } from '../stores/user'
import VrcParticleBackground from '../components/auth/VrcParticleBackground.vue'

const props = defineProps({
  initialMode: {
    type: String,
    default: 'login'
  }
})

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const currentMode = ref(props.initialMode || (route.path.includes('register') ? 'register' : 'login'))
const loading = ref(false)
const rememberMe = ref(true)
const formRef = ref(null)

const form = reactive({
  username: '',
  nickname: '',
  password: '',
  confirmPassword: ''
})

// 监听路由路径动态变化，保持 Tab 对应
watch(
  () => route.path,
  (newPath) => {
    if (newPath === '/register' && currentMode.value !== 'register') {
      currentMode.value = 'register'
    } else if (newPath === '/login' && currentMode.value !== 'login') {
      currentMode.value = 'login'
    }
  }
)

const validateConfirm = (rule, value, callback) => {
  if (value !== form.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

// 登录规则
const loginRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

// 注册规则
const registerRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名需在3-20位之间', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_]+$/, message: '只能包含字母、数字、下划线', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度需在6-20位之间', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    { validator: validateConfirm, trigger: 'blur' }
  ]
}

const currentRules = computed(() => {
  return currentMode.value === 'login' ? loginRules : registerRules
})

function switchMode(newMode) {
  if (currentMode.value === newMode) return
  currentMode.value = newMode
  formRef.value?.clearValidate()
  const targetPath = newMode === 'login' ? '/login' : '/register'
  router.replace({ path: targetPath, query: route.query })
}

function handleForgot() {
  ElMessage.info('重置密码链接已生成，请联系系统管理员或检查绑定邮箱')
}

const handleSubmit = async () => {
  await formRef.value?.validate()
  loading.value = true

  try {
    if (currentMode.value === 'login') {
      const data = await login({
        username: form.username,
        password: form.password
      })
      userStore.setLogin(data)
      ElMessage.success('🚀 登录成功！正在载入灵语世界...')
      router.push(route.query.redirect || '/')
    } else {
      await register({
        username: form.username,
        nickname: form.nickname,
        password: form.password
      })
      ElMessage.success('✨ 注册成功！请使用新账号登录')
      form.password = ''
      form.confirmPassword = ''
      switchMode('login')
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* =========================================================
   VRChat 官方标志性经典配色规范
   ========================================================= */
:root {
  --vrc-bg-dark: #080d11;
  --vrc-card-bg: rgba(18, 28, 36, 0.94);
  --vrc-card-border: #1c2b37;
  --vrc-teal: #00b4c5;
  --vrc-teal-hover: #00cadc;
  --vrc-teal-active: #009aa8;
  --vrc-teal-glow: rgba(0, 180, 197, 0.28);
  --vrc-text-main: #ffffff;
  --vrc-text-muted: #7f91a3;
  --vrc-text-sub: #9bb0c1;
  --vrc-input-bg: #0b1218;
  --vrc-input-border: #1f303e;
}

.vrc-auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background-color: #080d11;
  position: relative;
  overflow-x: hidden;
  box-sizing: border-box;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* 主卡片容器：固定高度 580px，彻底避免模式切换时的上下跳动 */
.vrc-main-card {
  position: relative;
  z-index: 10;
  width: 1000px;
  max-width: 100%;
  height: 580px;
  min-height: 580px;
  background: rgba(18, 28, 36, 0.94);
  backdrop-filter: blur(28px);
  -webkit-backdrop-filter: blur(28px);
  border: 1px solid #1c2b37;
  border-radius: 20px;
  box-shadow: 
    0 30px 80px -15px rgba(0, 0, 0, 0.95),
    0 0 40px -5px rgba(0, 180, 197, 0.28),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
  display: grid;
  grid-template-columns: 1.15fr 1fr;
  overflow: hidden;
  animation: vrcCardFadeIn 0.45s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes vrcCardFadeIn {
  0% { opacity: 0; transform: translateY(16px) scale(0.985); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}

/* ===== 左栏：虚拟世界与场景空间展示 ===== */
.vrc-left-column {
  padding: 34px 38px;
  background: linear-gradient(155deg, rgba(17, 28, 37, 0.96) 0%, rgba(10, 17, 22, 0.98) 100%);
  border-right: 1px solid #1c2b37;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
  user-select: none;
}

/* Brand Logo */
.vrc-brand-group {
  display: flex;
  align-items: center;
  gap: 14px;
}

.vrc-logo-badge {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: linear-gradient(135deg, #00b4c5 0%, #007a87 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 20px rgba(0, 180, 197, 0.45);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.vrc-logo-badge svg {
  width: 24px;
  height: 24px;
  fill: #ffffff;
}

.vrc-brand-text {
  display: flex;
  flex-direction: column;
}

.vrc-brand-name {
  font-size: 21px;
  font-weight: 800;
  letter-spacing: 1px;
  color: #ffffff;
}

.vrc-brand-tag {
  font-size: 11px;
  font-weight: 700;
  color: #00b4c5;
  letter-spacing: 2px;
  text-transform: uppercase;
}

/* 核心文案与场景卡 */
.vrc-hero-section {
  margin: 0;
}

.vrc-headline {
  font-size: 26px;
  font-weight: 800;
  line-height: 1.28;
  letter-spacing: -0.5px;
  color: #ffffff;
  margin-bottom: 8px;
}

.vrc-headline span {
  color: #00b4c5;
  text-shadow: 0 0 20px rgba(0, 180, 197, 0.4);
}

.vrc-description {
  font-size: 12.5px;
  color: #7f91a3;
  line-height: 1.6;
  margin-bottom: 18px;
  max-width: 420px;
}

/* 场景卡网格 */
.vrc-worlds-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.vrc-world-item {
  background: #0e161c;
  border: 1px solid #1c2b37;
  border-radius: 12px;
  padding: 10px 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.vrc-world-item:hover {
  background: #142029;
  border-color: rgba(0, 180, 197, 0.45);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4), 0 0 12px rgba(0, 180, 197, 0.15);
}

.vrc-world-icon {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: #17242e;
  border: 1px solid #233746;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
}

.vrc-world-info {
  display: flex;
  flex-direction: column;
}

.vrc-world-name {
  font-size: 12px;
  font-weight: 700;
  color: #ffffff;
}

.vrc-world-sub {
  font-size: 10px;
  color: #7f91a3;
  margin-top: 1px;
}

/* 空间特性标签 */
.vrc-feature-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
}

.vrc-tag {
  font-size: 11px;
  font-weight: 600;
  color: #00b4c5;
  background: rgba(0, 180, 197, 0.08);
  border: 1px solid rgba(0, 180, 197, 0.22);
  border-radius: 999px;
  padding: 3px 10px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

/* 沉浸式提示小栏 */
.vrc-immersion-tip {
  margin-top: 12px;
  background: rgba(11, 18, 24, 0.6);
  border: 1px dashed rgba(0, 180, 197, 0.25);
  border-radius: 10px;
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: 11px;
  color: #8da4b8;
  line-height: 1.45;
}

.vrc-immersion-tip-icon {
  font-size: 15px;
  flex-shrink: 0;
}

/* 底部状态指示栏 */
.vrc-left-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 14px;
  border-top: 1px solid #1c2b37;
  font-size: 11.5px;
  color: #627688;
}

/* 跳动的光点动效 (Bouncing / Pulsing Light Dots) */
.vrc-pulsing-dots {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 18px;
}

.vrc-pulsing-dots .dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #00b4c5;
  box-shadow: 0 0 8px rgba(0, 180, 197, 0.5);
  animation: vrcBounceDot 1.4s ease-in-out infinite;
}

.vrc-pulsing-dots .dot:nth-child(1) { animation-delay: 0s; }
.vrc-pulsing-dots .dot:nth-child(2) { animation-delay: 0.2s; }
.vrc-pulsing-dots .dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes vrcBounceDot {
  0%, 80%, 100% {
    transform: translateY(0) scale(0.85);
    opacity: 0.35;
    box-shadow: 0 0 4px rgba(0, 180, 197, 0.2);
  }
  40% {
    transform: translateY(-5px) scale(1.2);
    opacity: 1;
    box-shadow: 0 0 12px #00b4c5, 0 0 20px rgba(0, 180, 197, 0.7);
  }
}

/* ===== 右栏：表单操作区 ===== */
.vrc-right-column {
  padding: 34px 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  background: rgba(18, 28, 36, 0.94);
  position: relative;
}

/* VRChat 胶囊切换器 */
.vrc-tab-bar {
  display: flex;
  background: #0b1217;
  padding: 4px;
  border-radius: 12px;
  border: 1px solid #1c2b37;
  margin-bottom: 16px;
}

.vrc-tab-btn {
  flex: 1;
  padding: 8px 0;
  border: none;
  background: transparent;
  color: #7f91a3;
  font-size: 13px;
  font-weight: 700;
  border-radius: 9px;
  cursor: pointer;
  transition: all 0.2s;
}

.vrc-tab-btn.active {
  background: #192733;
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(0, 180, 197, 0.3);
}

.vrc-form-title {
  font-size: 21px;
  font-weight: 800;
  color: #ffffff;
  letter-spacing: -0.3px;
  margin-bottom: 3px;
}

.vrc-form-desc {
  font-size: 12px;
  color: #7f91a3;
  margin-bottom: 14px;
}

/* 覆盖 Element Plus 表单在暗黑模式下的样式 */
.vrc-el-form :deep(.el-form-item) {
  margin-bottom: 12px;
}

.vrc-el-form :deep(.el-form-item__label) {
  font-size: 11px !important;
  font-weight: 700 !important;
  letter-spacing: 0.5px !important;
  color: #7f91a3 !important;
  padding-bottom: 3px !important;
  line-height: 1 !important;
}

.vrc-el-form :deep(.el-input__wrapper) {
  background-color: #0b1218 !important;
  box-shadow: 0 0 0 1px #1f303e inset !important;
  border-radius: 10px !important;
  padding: 1px 12px !important;
  height: 42px !important;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
}

.vrc-el-form :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #2a4154 inset !important;
}

.vrc-el-form :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1.5px #00b4c5 inset, 0 0 16px rgba(0, 180, 197, 0.25) !important;
  background-color: #0d161e !important;
}

.vrc-el-form :deep(.el-input__inner) {
  color: #ffffff !important;
  font-size: 13.5px !important;
  font-weight: 500 !important;
}

.vrc-el-form :deep(.el-input__inner::placeholder) {
  color: #4a5d6e !important;
}

.vrc-input-icon {
  color: #5a7082;
  font-size: 15px;
  margin-right: 4px;
}

.vrc-el-form :deep(.el-input__wrapper.is-focus) .vrc-input-icon {
  color: #00b4c5;
}

/* 选项栏 */
.vrc-options-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 4px 0 14px;
}

.vrc-options-row :deep(.el-checkbox__label) {
  color: #7f91a3 !important;
  font-size: 12px !important;
}

.vrc-options-row :deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: #00b4c5 !important;
  border-color: #00b4c5 !important;
}

.vrc-forgot-btn {
  font-size: 12px;
  color: #00b4c5;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s;
}

.vrc-forgot-btn:hover {
  color: #00cadc;
  text-decoration: underline;
}

/* VRChat 标志性主按键 */
.vrc-btn-wrap {
  margin-top: 6px;
}

.vrc-submit-btn {
  width: 100%;
  height: 46px;
  background: #00b4c5;
  color: #061016;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 800;
  letter-spacing: 0.5px;
  cursor: pointer;
  box-shadow: 0 8px 24px -4px rgba(0, 180, 197, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.vrc-submit-btn:hover:not(:disabled) {
  background: #00cadc;
  transform: translateY(-2px);
  box-shadow: 0 12px 28px -4px rgba(0, 180, 197, 0.6);
  color: #000000;
}

.vrc-submit-btn:active:not(:disabled) {
  background: #009aa8;
  transform: translateY(0);
}

.vrc-submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.vrc-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #061016;
  border-top-color: transparent;
  border-radius: 50%;
  animation: vrcSpin 0.7s linear infinite;
}

@keyframes vrcSpin {
  to { transform: rotate(360deg); }
}

@media (max-width: 860px) {
  .vrc-main-card {
    grid-template-columns: 1fr;
    max-width: 440px;
    height: auto;
    min-height: auto;
  }
  .vrc-left-column {
    display: none;
  }
  .vrc-right-column {
    padding: 32px 24px;
  }
}
</style>
