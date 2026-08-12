<template>
  <el-card>
    <template #header>
      <div class="card-header">
        <span>用户管理</span>
        <el-input v-model="keyword" placeholder="按用户名搜索" style="width: 220px" clearable
          @keyup.enter="loadList" @clear="loadList">
          <template #append>
            <el-button @click="loadList">搜索</el-button>
          </template>
        </el-input>
      </div>
    </template>

    <el-table :data="records" v-loading="loading" border stripe>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="username" label="用户名" />
      <el-table-column prop="nickname" label="昵称" />
      <el-table-column label="角色" width="120">
        <template #default="{ row }">
          <el-select :model-value="row.role" size="small" @change="(val) => handleRoleChange(row, val)">
            <el-option label="管理员" value="ADMIN" />
            <el-option label="普通用户" value="USER" />
          </el-select>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="110">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'">
            {{ row.status === 1 ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" width="180" />
      <el-table-column label="操作" width="120">
        <template #default="{ row }">
          <el-button link :type="row.status === 1 ? 'danger' : 'success'" size="small"
            @click="handleStatusChange(row)">
            {{ row.status === 1 ? '禁用' : '启用' }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination class="pagination" background layout="total, prev, pager, next" :total="total"
      :page-size="pageSize" :current-page="pageNum" @current-change="handlePageChange" />
  </el-card>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getUserList, updateRole, updateStatus } from '../api/user'

const loading = ref(false)
const keyword = ref('')
const records = ref([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)

const loadList = async () => {
  loading.value = true
  try {
    const data = await getUserList({
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      keyword: keyword.value || undefined
    })
    records.value = data.records
    total.value = Number(data.total)
  } finally {
    loading.value = false
  }
}

const handlePageChange = (page) => {
  pageNum.value = page
  loadList()
}

const handleRoleChange = async (row, role) => {
  try {
    await updateRole(row.id, role)
    row.role = role
    ElMessage.success('角色已更新')
  } catch {
    loadList()
  }
}

const handleStatusChange = async (row) => {
  const action = row.status === 1 ? '禁用' : '启用'
  try {
    await ElMessageBox.confirm(`确定要${action}用户「${row.username}」吗？`, '提示', { type: 'warning' })
  } catch {
    return
  }
  try {
    await updateStatus(row.id, row.status === 1 ? 0 : 1)
    row.status = row.status === 1 ? 0 : 1
    ElMessage.success(`已${action}`)
  } catch {
    /* 错误提示由拦截器统一处理 */
  }
}

onMounted(loadList)
</script>

<style scoped>
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.pagination {
  margin-top: 16px;
  justify-content: flex-end;
}
</style>