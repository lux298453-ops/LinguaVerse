import request from './request'

export const getMe = () => request.get('/user/me')

export const getUserList = (params) => request.get('/user/list', { params })

export const updateRole = (id, role) => request.put(`/user/${id}/role`, null, { params: { role } })

export const updateStatus = (id, status) => request.put(`/user/${id}/status`, null, { params: { status } })
