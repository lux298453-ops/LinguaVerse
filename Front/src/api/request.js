import axios from 'axios'
import { ElMessage } from 'element-plus'
import { isTokenExpired, handleAuthExpired } from '../utils/auth'

const request = axios.create({
  baseURL: '/api',
  timeout: 10000
})

request.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    // 若客户端已判定 Token 过期，提前拦截并引导重新登录，避免无效网络请求
    if (isTokenExpired(token) && !config.url?.includes('/auth/login') && !config.url?.includes('/auth/register')) {
      handleAuthExpired('登录凭证已过期，请重新登录')
      return Promise.reject(new Error('Token expired'))
    }
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

request.interceptors.response.use(
  (response) => {
    const res = response.data
    if (res.code !== 200) {
      // 401(未登录) 或 1004(Token无效或已过期)
      if (res.code === 401 || res.code === 1004) {
        handleAuthExpired(res.message || '登录状态已失效，请重新登录')
        return Promise.reject(new Error(res.message || '登录状态已失效'))
      }
      ElMessage.error(res.message || '请求失败')
      return Promise.reject(new Error(res.message || '请求失败'))
    }
    return res.data
  },
  (error) => {
    const status = error.response?.status
    const code = error.response?.data?.code
    if (status === 401 || code === 401 || code === 1004) {
      handleAuthExpired(error.response?.data?.message || '登录状态已失效，请重新登录')
      return Promise.reject(error)
    }
    // 避免已在跳转登录过程中重复弹出普通报错
    if (error.message !== 'Token expired') {
      ElMessage.error(error.response?.data?.message || '网络错误，请稍后重试')
    }
    return Promise.reject(error)
  }
)

export default request
