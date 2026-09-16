<template>
  <el-container class="layout">
    <!-- 现代化全高贯通侧边栏 -->
    <el-aside width="240px" class="aside-sidebar">
      <!-- 品牌 Logo 区 -->
      <div class="logo-area" @click="router.push('/')">
        <div class="logo-icon-box">
          <el-icon><Compass /></el-icon>
        </div>
        <div class="logo-info">
          <div class="logo-title">LinguaVerse</div>
          <div class="logo-sub">灵语世界 · 学习中枢</div>
        </div>
      </div>

      <!-- 快捷进入游戏世界卡片 -->
      <div class="quick-world-entry" @click="router.push('/world')">
        <div class="world-entry-content">
          <div class="world-entry-icon">
            <el-icon><Promotion /></el-icon>
          </div>
          <div class="world-entry-texts">
            <span class="world-entry-name">进入虚拟世界</span>
            <span class="world-entry-hint">Sunshine Hall 广场</span>
          </div>
          <el-icon class="world-entry-arrow"><ArrowRight /></el-icon>
        </div>
      </div>

      <div class="menu-divider-label">平台导航</div>

      <!-- 侧边栏导航菜单 -->
      <el-menu
        :default-active="$route.path"
        router
        class="custom-nav-menu"
      >
        <el-menu-item index="/">
          <el-icon><HomeFilled /></el-icon>
          <span>个人中心</span>
        </el-menu-item>
        <el-menu-item index="/chat">
          <el-icon><ChatDotRound /></el-icon>
          <span>实时私聊</span>
          <el-badge
            v-if="chatStore.unreadTotal > 0"
            :value="chatStore.unreadTotal"
            :max="99"
            class="sidebar-unread-badge"
          />
        </el-menu-item>
        <el-menu-item v-if="userStore.isAdmin" index="/users">
          <el-icon><UserFilled /></el-icon>
          <span>用户管理</span>
        </el-menu-item>
      </el-menu>

      <!-- 底部用户信息卡片 -->
      <div class="sidebar-footer">
        <UserAvatar
          :avatar="userStore.user?.avatar"
          :name="userStore.user?.nickname || userStore.user?.username"
          :size="38"
          radius="10px"
        />
        <div class="user-info">
          <div class="user-display-name">
            {{ userStore.user?.nickname || userStore.user?.username }}
          </div>
          <div class="user-role-tag">
            <span v-if="userStore.isAdmin" class="role-pill admin-pill">管理员</span>
            <span v-else class="role-pill user-pill">学员</span>
          </div>
        </div>
        <button class="logout-action-btn" @click="handleLogout" title="退出登录">
          <el-icon><SwitchButton /></el-icon>
        </button>
      </div>
    </el-aside>

    <!-- 右侧主体内容容器 -->
    <el-container class="main-container">
      <el-header class="top-header">
        <div class="header-breadcrumb">
          <span class="breadcrumb-dot">●</span>
          <span class="breadcrumb-text">{{ pageTitle }}</span>
        </div>
        <div class="header-right-actions">
          <div class="header-user-card" @click="router.push('/')" title="点击前往个人中心">
            <UserAvatar
              :avatar="userStore.user?.avatar"
              :name="userStore.user?.nickname || userStore.user?.username"
              :size="36"
              radius="10px"
              class="header-avatar"
            />
            <div class="header-user-meta">
              <span class="header-user-name">{{ userStore.user?.nickname || userStore.user?.username }}</span>
              <div class="header-user-badge">
                <span v-if="userStore.isAdmin" class="badge-role admin">管理员</span>
                <span v-else class="badge-role user">学员</span>
              </div>
            </div>
          </div>

          <div class="header-divider"></div>

          <el-button
            class="header-logout-btn"
            type="danger"
            plain
            size="small"
            @click="handleLogout"
          >
            <el-icon class="logout-icon"><SwitchButton /></el-icon>
            <span>退出登录</span>
          </el-button>
        </div>

      </el-header>
      <el-main class="layout-main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { useChatStore } from '../stores/chat'
import { HomeFilled, UserFilled, ChatDotRound, SwitchButton, Compass, Promotion, ArrowRight } from '@element-plus/icons-vue'
import UserAvatar from './UserAvatar.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const chatStore = useChatStore()

const pageTitle = computed(() => {
  if (route.path === '/') return '个人中心'
  if (route.path === '/chat') return '实时私聊'
  if (route.path === '/users') return '用户管理'
  return '管理控制台'
})

onMounted(() => {
  chatStore.connect()
  chatStore.refreshUnread()
})

const handleLogout = () => {
  chatStore.disconnect()
  userStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.layout {
  height: 100vh;
  overflow: hidden;
  background: #f8fafc;
}

/* 侧边栏主体：100% 满屏高度，再也不断层 */
.aside-sidebar {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border-right: 1px solid #e2e8f0;
  box-shadow: 2px 0 12px rgba(0, 0, 0, 0.03);
  user-select: none;
  z-index: 10;
}

/* Logo 区域 */
.logo-area {
  height: 64px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  gap: 12px;
  border-bottom: 1px solid #f1f5f9;
  cursor: pointer;
  transition: background 0.15s;
}

.logo-area:hover {
  background: #f8fafc;
}

.logo-icon-box {
  width: 32px;
  height: 32px;
  border-radius: 9px;
  background: linear-gradient(135deg, #008f9d, #00b4c5);
  color: #ffffff;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 10px rgba(0, 180, 197, 0.35);
}

.logo-info {
  display: flex;
  flex-direction: column;
}

.logo-title {
  font-size: 16px;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.3px;
  background: linear-gradient(135deg, #063940, #008f9d);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.logo-sub {
  font-size: 11px;
  color: #64748b;
  font-weight: 500;
  margin-top: 1px;
}

/* 侧边栏游戏快捷卡片 (VRChat 松石青绿高光卡片) */
.quick-world-entry {
  margin: 14px 14px 8px 14px;
  padding: 11px 14px;
  border-radius: 12px;
  background: linear-gradient(135deg, #088c99 0%, #00b4c5 100%);
  color: #ffffff;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(0, 180, 197, 0.35);
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.quick-world-entry:hover {
  transform: translateY(-1.5px);
  box-shadow: 0 6px 20px rgba(0, 180, 197, 0.48);
}

.quick-world-entry:active {
  transform: scale(0.98);
}

.world-entry-content {
  display: flex;
  align-items: center;
  gap: 10px;
}

.world-entry-icon {
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.95;
}

.world-entry-texts {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.world-entry-name {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.2px;
}

.world-entry-hint {
  font-size: 10px;
  opacity: 0.82;
  margin-top: 1px;
}

.world-entry-arrow {
  font-size: 13px;
  opacity: 0.85;
  transition: transform 0.2s;
  display: flex;
  align-items: center;
}

.quick-world-entry:hover .world-entry-arrow {
  transform: translateX(3px);
  opacity: 1;
}

/* 分组小标签 */
.menu-divider-label {
  padding: 12px 20px 6px;
  font-size: 11px;
  font-weight: 700;
  color: #94a3b8;
  letter-spacing: 0.6px;
  text-transform: uppercase;
}

/* 菜单定制：清爽圆角卡片，告别黑底古早感 */
.custom-nav-menu {
  flex: 1;
  border-right: none;
  background: transparent;
  padding: 4px 12px;
  overflow-y: auto;
}

.custom-nav-menu :deep(.el-menu-item) {
  height: 44px;
  line-height: 44px;
  border-radius: 10px;
  margin-bottom: 5px;
  color: #475569;
  font-weight: 600;
  font-size: 13px;
  padding: 0 14px !important;
  transition: all 0.15s ease-in-out;
}

.custom-nav-menu :deep(.el-menu-item:hover) {
  background-color: #f1f5f9;
  color: #0f172a;
}

.custom-nav-menu :deep(.el-menu-item.is-active) {
  background: #e6f7fa !important;
  color: #008a97 !important;
  font-weight: 700;
}

.custom-nav-menu :deep(.el-menu-item.is-active .el-icon) {
  color: #00b4c5 !important;
}

.custom-nav-menu :deep(.el-menu-item .el-icon) {
  font-size: 17px;
  margin-right: 8px;
}

.sidebar-unread-badge {
  margin-left: auto;
  line-height: 1;
}

.sidebar-unread-badge :deep(.el-badge__content) {
  background-color: #ef4444;
  border: none;
  font-weight: bold;
}

/* 底部用户信息卡片 */
.sidebar-footer {
  padding: 12px 16px;
  border-top: 1px solid #f1f5f9;
  display: flex;
  align-items: center;
  gap: 10px;
  background: #fbfcfe;
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, #008f9d, #00b4c5);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 15px;
  flex-shrink: 0;
  box-shadow: 0 2px 6px rgba(0, 180, 197, 0.3);
}

.user-info {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.user-display-name {
  font-size: 13px;
  font-weight: 700;
  color: #1e293b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-role-tag {
  margin-top: 2px;
}

.role-pill {
  font-size: 10px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 6px;
  display: inline-block;
}

.admin-pill {
  background: #fee2e2;
  color: #dc2626;
}

.user-pill {
  background: #f1f5f9;
  color: #64748b;
}

.logout-action-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  transition: all 0.2s;
  flex-shrink: 0;
}

.logout-action-btn:hover {
  background: #fee2e2;
  border-color: #fca5a5;
  color: #ef4444;
}

/* 主容器 */
.main-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

/* 顶部导航 Header */
.top-header {
  height: 60px;
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  flex-shrink: 0;
}

.header-breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
}

.breadcrumb-dot {
  color: #00b4c5;
  font-size: 10px;
}

.breadcrumb-text {
  font-size: 15px;
  font-weight: 700;
  color: #1e293b;
}

.header-right-actions {
  display: flex;
  align-items: center;
  gap: 14px;
}

.header-user-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 8px 4px 4px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
}

.header-user-card:hover {
  background: #f1f5f9;
}

.header-user-meta {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.header-user-name {
  font-size: 13px;
  font-weight: 700;
  color: #1e293b;
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.header-user-badge {
  margin-top: 2px;
}

.badge-role {
  font-size: 10px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 4px;
  display: inline-block;
  line-height: 1.2;
}

.badge-role.admin {
  background: #fee2e2;
  color: #dc2626;
}

.badge-role.user {
  background: #e6f7fa;
  color: #008a97;
}

.header-divider {
  width: 1px;
  height: 22px;
  background: #e2e8f0;
}

.header-logout-btn {
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  transition: all 0.2s ease;
}

.header-logout-btn .logout-icon {
  font-size: 14px;
}

/* 内容主区域 */
.layout-main-content {
  background: #f8fafc;
  padding: 24px;
  overflow-y: auto;
}
</style>

