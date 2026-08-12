import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    user: JSON.parse(localStorage.getItem('user') || 'null')
  }),
  getters: {
    isAdmin: (state) => state.user?.role === 'ADMIN',
    isLoggedIn: (state) => !!state.token
  },
  actions: {
    setLogin(data) {
      this.token = data.token
      this.user = {
        id: data.id,
        username: data.username,
        nickname: data.nickname,
        role: data.role
      }
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(this.user))
    },
    setUser(user) {
      this.user = user
      localStorage.setItem('user', JSON.stringify(user))
    },
    logout() {
      this.token = ''
      this.user = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
  }
})
