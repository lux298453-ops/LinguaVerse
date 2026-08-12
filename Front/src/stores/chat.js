import { defineStore } from 'pinia'
import { ElMessage } from 'element-plus'
import { getChatUsers, getConversations, getHistory, markRead, getUnread } from '../api/chat'
import { useUserStore } from './user'

export const useChatStore = defineStore('chat', {
  state: () => ({
    ws: null,
    connected: false,
    users: [],
    conversations: [],
    convSeq: 0,
    /** 消息列表: { [userId]: [...] } 按时间升序 */
    messages: {},
    activeUserId: null,
    unreadTotal: 0,
    /** 每个会话已加载的历史页数 */
    historyPage: {},
    /** 每个会话是否还有更早的历史 */
    hasMoreHistory: {},
    loadingEarlier: false
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
      } else if (frame.type === 'read') {
        this.applyReadReceipt(frame.from, frame.messageIds || [])
      } else if (frame.type === 'error') {
        ElMessage.error(frame.message || '消息发送失败')
      }
    },
    pushMessage(message, isIncoming = true) {
      const myId = useUserStore().user?.id
      // 按会话对象分组：自己发的消息归到 receiver，对方发的归到 sender
      const peerId = message.senderId === myId ? message.receiverId : message.senderId
      const isFromActive = peerId === this.activeUserId
      if (!this.messages[peerId]) {
        this.messages[peerId] = []
      }
      const exists = this.messages[peerId].some((m) => m.id === message.id)
      if (exists) return
      this.messages[peerId].push(message)
      if (isIncoming && !isFromActive) {
        const conv = this.conversations.find((c) => c.userId === peerId)
        if (conv) {
          conv.unread = Number(conv.unread || 0) + 1
        }
        this.refreshUnread()
      }
      if (isFromActive) {
        this.markRead(peerId)
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
      const seq = ++this.convSeq
      try {
        const list = await getConversations()
        // 只应用最新一次请求的结果，避免陈旧响应覆盖本地已清零的未读数
        if (seq === this.convSeq) {
          this.conversations = list
        }
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
      try {
        const list = await getHistory({ withUserId: userId, pageNum: 1, pageSize: 50 })
        // 历史与已收到的实时消息按 id 去重合并，按时间升序
        const byId = new Map()
        for (const m of this.messages[userId] || []) byId.set(m.id, m)
        for (const m of list) byId.set(m.id, m)
        this.messages[userId] = [...byId.values()].sort((a, b) =>
          (a.createTime || '').localeCompare(b.createTime || ''))
        this.historyPage[userId] = 1
        this.hasMoreHistory[userId] = list.length >= 50
      } catch {
        if (!this.messages[userId]) {
          this.messages[userId] = []
        }
      }
      const conv = this.conversations.find((c) => c.userId === userId)
      if (conv) {
        conv.unread = 0
      }
      // 先等已读接口完成再刷新总数，避免拉到旧的未读数
      await this.markRead(userId)
    },
    async markRead(userId) {
      try {
        await markRead(userId)
      } catch {
        /* 拦截器已提示 */
      }
      // 接口成功后兜底清零该会话未读，防止期间到达的旧快照残留
      const conv = this.conversations.find((c) => c.userId === userId)
      if (conv) {
        conv.unread = 0
      }
      this.refreshUnread()
    },
    /** 向上滚动加载更早一页历史，合并到会话消息列表 */
    async loadEarlier(userId) {
      if (this.loadingEarlier || !this.hasMoreHistory[userId]) {
        return
      }
      const nextPage = (this.historyPage[userId] || 1) + 1
      this.loadingEarlier = true
      try {
        const list = await getHistory({ withUserId: userId, pageNum: nextPage, pageSize: 50 })
        if (list.length > 0) {
          const byId = new Map((this.messages[userId] || []).map((m) => [m.id, m]))
          for (const m of list) byId.set(m.id, m)
          this.messages[userId] = [...byId.values()].sort((a, b) =>
            (a.createTime || '').localeCompare(b.createTime || ''))
          this.historyPage[userId] = nextPage
        }
        if (list.length < 50) {
          this.hasMoreHistory[userId] = false
        }
      } catch {
        /* 拦截器已提示 */
      } finally {
        this.loadingEarlier = false
      }
    },
    markUserOnline(userId, online) {
      const user = this.users.find((u) => u.id === userId)
      if (user) {
        user.online = online
      }
    },
    /** 对方已读回执: 把自己发给 fromUserId 的对应消息标记为已读 */
    applyReadReceipt(fromUserId, messageIds) {
      const myId = useUserStore().user?.id
      const list = this.messages[fromUserId] || []
      const ids = new Set(messageIds)
      for (const m of list) {
        if (m.senderId === myId && ids.has(m.id)) {
          m.isRead = 1
        }
      }
    }
  }
})
