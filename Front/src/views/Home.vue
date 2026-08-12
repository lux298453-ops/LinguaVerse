<template>
  <el-card>
    <template #header>
      <span>个人中心</span>
    </template>
    <el-descriptions :column="2" border>
      <el-descriptions-item label="用户ID">{{ user.id }}</el-descriptions-item>
      <el-descriptions-item label="用户名">{{ user.username }}</el-descriptions-item>
      <el-descriptions-item label="昵称">{{ user.nickname || '-' }}</el-descriptions-item>
      <el-descriptions-item label="角色">
        <el-tag v-if="user.role === 'ADMIN'" type="danger">管理员</el-tag>
        <el-tag v-else>普通用户</el-tag>
      </el-descriptions-item>
    </el-descriptions>
    <el-button type="primary" style="margin-top: 20px" @click="handleRefresh">刷新信息</el-button>
  </el-card>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getMe } from '../api/user'
import { useUserStore } from '../stores/user'

const userStore = useUserStore()
const user = ref(userStore.user || {})

const handleRefresh = async () => {
  try {
    const data = await getMe()
    user.value = data
    userStore.setUser(data)
    ElMessage.success('已刷新')
  } catch {
    /* 错误提示由拦截器统一处理 */
  }
}
</script>