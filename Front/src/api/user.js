import request from './request'

export const getMe = () => request.get('/user/me')

export const getUserList = (params) => request.get('/user/list', { params })

export const updateRole = (id, role) => request.put(`/user/${id}/role`, null, { params: { role } })

export const updateStatus = (id, status) => request.put(`/user/${id}/status`, null, { params: { status } })

export const updateProfile = (data) => request.put('/user/profile', data)

export const uploadImage = (file) => {
  const formData = new FormData()
  formData.append('file', file)
  return request.post('/upload/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

