import request from './request'

export const getChatUsers = () => request.get('/chat/users')

export const getConversations = () => request.get('/chat/conversations')

export const getHistory = (params) => request.get('/chat/history', { params })

export const markRead = (fromUserId) => request.put('/chat/read', null, { params: { fromUserId } })

export const getUnread = () => request.get('/chat/unread')
