import { isTokenExpired, handleAuthExpired } from '../../utils/auth'

/**
 * WorldSocket.js
 * 游戏层 WebSocket 封装，负责与后端 /ws/world 通信
 */
export class WorldSocket {
  constructor() {
    this.ws = null
    this.handlers = {}
    this.reconnectTimer = null
    this._token = null
  }

  connect(token) {
    if (isTokenExpired(token)) {
      handleAuthExpired('游戏世界连接凭证已过期，请重新登录')
      return
    }

    this._token = token
    const protocol = location.protocol === 'https:' ? 'wss' : 'ws'
    const url = `${protocol}://${location.hostname}:8080/ws/world?token=${token}`
    this.ws = new WebSocket(url)

    this.ws.onopen = () => {
      console.log('[WorldSocket] 已连接')
      this._emit('open')
    }

    this.ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data)
        this._emit(msg.type, msg)
        this._emit('*', msg) // 通配符监听
      } catch (err) {
        console.error('[WorldSocket] 解析消息失败', err)
      }
    }

    this.ws.onclose = () => {
      this._emit('close')
      if (isTokenExpired(this._token)) {
        handleAuthExpired('游戏世界连接凭证已过期，请重新登录')
        return
      }
      console.warn('[WorldSocket] 连接断开，5s 后重连...')
      this.reconnectTimer = setTimeout(() => this.connect(this._token), 5000)
    }

    this.ws.onerror = (e) => {
      console.error('[WorldSocket] 错误', e)
    }
  }

  send(msg) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg))
    }
  }

  on(type, handler) {
    if (!this.handlers[type]) this.handlers[type] = []
    this.handlers[type].push(handler)
    return () => this.off(type, handler) // 返回取消订阅函数
  }

  off(type, handler) {
    if (this.handlers[type]) {
      this.handlers[type] = this.handlers[type].filter(h => h !== handler)
    }
  }

  _emit(type, data) {
    ;(this.handlers[type] || []).forEach(h => h(data))
  }

  disconnect() {
    clearTimeout(this.reconnectTimer)
    this.ws?.close()
  }

  // 发送移动消息（节流控制在 HallScene 侧实现）
  sendMove(x, y, direction) {
    this.send({ type: 'MOVE', x: Math.round(x), y: Math.round(y), direction })
  }

  // 发送空间聊天
  sendSpatialChat(content) {
    this.send({ type: 'SPATIAL_CHAT', content })
  }

  // 点击 NPC 触发任务
  sendNpcStart(taskId) {
    this.send({ type: 'NPC_START', taskId })
  }

  // 回复 NPC 对话
  sendNpcReply(taskId, nodeKey, content) {
    this.send({ type: 'NPC_REPLY', taskId, nodeKey, content })
  }

  // 切换地图/场景
  sendChangeMap(mapId, x, y) {
    this.send({ type: 'CHANGE_MAP', mapId, x: Math.round(x), y: Math.round(y) })
  }

  // 发送快捷表情/动作
  sendEmote(emote) {
    this.send({ type: 'SPATIAL_EMOTE', emote })
  }

  // 发送玩家间定向互动（打招呼、点赞等）
  sendInteract(targetUserId, action, emote, content) {
    this.send({
      type: 'PLAYER_INTERACT',
      targetUserId: Number(targetUserId),
      action,
      emote,
      content
    })
  }
}

// 全局单例
export const worldSocket = new WorldSocket()
