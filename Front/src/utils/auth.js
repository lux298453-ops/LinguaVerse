import { ElMessage } from 'element-plus'
import router from '../router'

/**
 * 校验 JWT Token 是否过期或无效
 * @param {string} token 
 * @returns {boolean} true 表示已过期或无效，false 表示有效
 */
export function isTokenExpired(token) {
  if (!token || typeof token !== 'string') return true
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return true
    // base64url decode (兼容 URL-safe base64 字符)
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    const { exp } = JSON.parse(jsonPayload)
    if (!exp) return false
    // 预留 3 秒时钟偏移安全缓冲，确保边界时间不发死请求
    return Date.now() >= (exp * 1000 - 3000)
  } catch {
    return true
  }
}

let isRedirecting = false

/**
 * 清除本地认证信息并防抖跳转到登录页
 * @param {string} message 提示文案
 */
export function handleAuthExpired(message = '登录状态已过期，请重新登录') {
  localStorage.removeItem('token')
  localStorage.removeItem('user')

  if (isRedirecting) return
  isRedirecting = true

  ElMessage.warning(message)

  const currentRoute = router.currentRoute.value
  const currentPath = currentRoute ? currentRoute.path : ''
  const isAuthPage = currentPath === '/login' || currentPath === '/register'

  if (!isAuthPage) {
    router.push({
      path: '/login',
      query: { redirect: currentRoute?.fullPath || '/' }
    }).finally(() => {
      setTimeout(() => {
        isRedirecting = false
      }, 1500)
    })
  } else {
    setTimeout(() => {
      isRedirecting = false
    }, 1500)
  }
}
