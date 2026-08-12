import { defineStore } from 'pinia'
import { ElMessage } from 'element-plus'
import { getChatUsers, getConversations, getHistory, markRead, getUnread } from '../api/chat'

export const useChatStore = defineStore('chat', {
  state: () => ({
    ws: null,
    connected: false,
    users: [],
    conversations: [],
    /** 消息列表: { [userId]: [...] } 按时间升序 */
    messages: {},
    activeUserId: null,
    unreadTotal: 0
  }),
  getters: {
    activeMessages: (state) => (state.activeUserId ? state.messages[state.activeUserId] || [] : []),
    userOnline: (state) => (userId) => {
      const user = state.users.find((u) => u.id === userId)
      return user ? user.online : false
    },
    unreadOf: (state) => (userId) => {
      const conv = state.conversations.find((c) => c.userId === userId)
      return conv ? Number(conv.unread || 0) : 0
    }
  },
  actions: {
    connect() {
      const token = localStorage.getItem('token')
      if (!token || this.connected) return
      const protocol = location.protocol === 'https:' ? 'wss' : 'ws'
      const ws = new WebSocket(`${protocol}://${location.host}/ws/chat?token=${encodeURIComponent(token)}`)
      this.ws = ws

      ws.onopen = () => {
        this.connected = true
        this.loadUsers()
        this.loadConversations()
        this.refreshUnread()
      }
      ws.onmessage = (event) => {
        this.handleFrame(JSON.parse(event.data))
      }
      ws.onclose = () => {
        this.connected = false
        this.ws = null
      }
      ws.onerror = () => {
        ElMessage.error('聊天连接失败，请刷新页面重试')
      }
    },
    disconnect() {
      if (this.ws) {
        this.ws.onclose = null
        this.ws.close()
        this.ws = null
      }
      this.connected = false
    },
    handleFrame(frame) {
      if (frame.type === 'chat') {
        this.pushMessage(frame.message)
      } else if (frame.type === 'offline') {
        ;(frame.messages || []).forEach((m) => this.pushMessage(m, false))
        this.refreshUnread()
        this.loadConversations()
      } else if (frame.type === 'user_status') {
        this.markUserOnline(frame.userId, frame.online)
      } else if (frame.type === 'error') {
        ElMessage.error(frame.message || '消息发送失败')
      }
    },
    pushMessage(message, isIncoming = true) {
      const senderId = message.senderId
      const isFromActive = senderId === this.activeUserId
      if (!this.messages[senderId]) {
        this.messages[senderId] = []
      }
      const exists = this.messages[senderId].some((m) => m.id === message.id)
      if (exists) return
      this.messages[senderId].push(message)
      if (isIncoming && !isFromActive) {
        const conv = this.conversations.find((c) => c.userId === senderId)
        if (conv) {
          conv.unread = Number(conv.unread || 0) + 1
        }
        this.refreshUnread()
      }
      if (isFromActive) {
        this.markRead(senderId)
      }
    },
    sendMessage(to, content) {
      if (!this.connected || !this.ws) {
        ElMessage.warning('连接已断开，请刷新页面')
        return false
      }
      this.ws.send(JSON.stringify({ type: 'chat', to, content }))
      return true
    },
    async loadUsers() {
      try {
        this.users = await getChatUsers()
      } catch {
        /* 拦截器已提示 */
      }
    },
    async loadConversations() {
      try {
        this.conversations = await getConversations()
      } catch {
        /* 拦截器已提示 */
      }
    },
    async refreshUnread() {
      try {
        this.unreadTotal = await getUnread()
      } catch {
        /* 拦截器已提示 */
      }
    },
    async selectUser(userId) {
      this.activeUserId = userId
      if (!this.messages[userId]) {
        this.messages[userId] = []
        try {
          const list = await getHistory({ withUserId: userId, pageNum: 1, pageSize: 50 })
          this.messages[userId] = list.slice().reverse()
        } catch {
          /* 拦截器已提示 */
        }
      }
      const conv = this.conversations.find((c) => c.userId === userId)
      if (conv) {
        conv.unread = 0
        this.refreshUnread()
      }
      this.markRead(userId)
    },
    async markRead(userId) {
      try {
        await markRead(userId)
      } catch {
        /* 拦截器已提示 */
      }
    },
    markUserOnline(userId, online) {
      const user = this.users.find((u) => u.id === userId)
      if (user) {
        user.online = online
      }
    }
  }
})
