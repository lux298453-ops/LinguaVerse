import { createRouter, createWebHistory } from 'vue-router'
import { isTokenExpired } from '../utils/auth'

const routes = [
  { path: '/login', name: 'Login', component: () => import('../views/Login.vue'), meta: { public: true } },
  { path: '/register', name: 'Register', component: () => import('../views/Register.vue'), meta: { public: true } },
  // 游戏世界：全屏独立页面，不套 Layout
  { path: '/world', name: 'World', component: () => import('../views/World.vue') },
  {
    path: '/',
    component: () => import('../components/Layout.vue'),
    children: [
      { path: '', name: 'Home', component: () => import('../views/Home.vue') },
      { path: 'chat', name: 'Chat', component: () => import('../views/Chat.vue') },
      { path: 'users', name: 'UserManage', component: () => import('../views/UserManage.vue'), meta: { role: 'ADMIN' } }
    ]
  },
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to) => {
  let token = localStorage.getItem('token')
  const user = JSON.parse(localStorage.getItem('user') || 'null')

  // 若 Token 已经过期，则自动将其从本地清理，防止带过期 Token 访问页面或误拦截登录页
  if (token && isTokenExpired(token)) {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    token = null
  }

  if (to.meta.public) {
    return token ? { path: '/' } : true
  }
  if (!token) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }
  if (to.meta.role && user?.role !== to.meta.role) {
    return { path: '/' }
  }
  return true
})

export default router
