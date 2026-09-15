<template>
  <div class="chat-page">
    <div class="user-panel">
      <div class="panel-title">
        <span>联系人</span>
        <el-badge :value="chatStore.unreadTotal" :hidden="chatStore.unreadTotal === 0" class="unread-badge">
          <el-icon :size="18"><Bell /></el-icon>
        </el-badge>
      </div>
      <div class="search">
        <el-input v-model="keyword" placeholder="搜索用户名/昵称" size="small" clearable />
      </div>
      <div v-if="!chatStore.users.length" class="empty">暂无其他用户</div>
      <div v-for="user in filteredUsers" :key="user.id"
        class="user-item" :class="{ active: user.id === chatStore.activeUserId }"
        @click="handleSelect(user)">
        <el-badge :value="chatStore.unreadOf(user.id)" :hidden="chatStore.unreadOf(user.id) === 0" :offset="[-6, 6]">
          <UserAvatar
            :avatar="user.avatar"
            :name="user.nickname || user.username"
            :size="38"
            radius="12px"
          />
        </el-badge>
        <div class="user-info">
          <div class="user-name">{{ user.nickname || user.username }}</div>
          <div class="user-detail">
            <span class="dot" :class="user.online ? 'online' : 'offline'"></span>
            {{ user.online ? '在线' : '离线' }} · {{ user.username }}
          </div>
        </div>
      </div>
    </div>

    <div class="chat-panel">
      <template v-if="activeUser">
        <div class="chat-header">
          <UserAvatar
            :avatar="activeUser.avatar"
            :name="activeUser.nickname || activeUser.username"
            :size="32"
            radius="10px"
          />
          <span class="chat-name">{{ activeUser.nickname || activeUser.username }}</span>
          <span class="dot" :class="activeUser.online ? 'online' : 'offline'"></span>
          <span class="chat-status">{{ activeUser.online ? '在线' : '离线' }}</span>
        </div>
          <div ref="messageBox" class="message-box">
          <div v-for="msg in chatStore.activeMessages" :key="msg.id" :data-mid="msg.id"
            class="message-row" :class="msg.senderId === myId ? 'mine' : 'theirs'">
            <UserAvatar
              :avatar="msg.senderId === myId ? userStore.user?.avatar : activeUser.avatar"
              :name="msg.senderId === myId ? myName : (activeUser.nickname || activeUser.username)"
              :size="34"
              radius="10px"
              class="avatar"
            />
            <div class="message-bubble">
              <div class="message-content">{{ msg.content }}</div>
              <div class="message-meta">
                <span class="message-time">{{ formatTime(msg.createTime) }}</span>
                <svg v-if="msg.senderId === myId" class="tick" :class="Number(msg.isRead) === 1 ? 'read' : 'sent'" viewBox="0 0 18 12">
                  <path d="M1.5 6.2 L5.2 9.8 L14 2" />
                  <path v-if="Number(msg.isRead) === 1" d="M7.8 6.2 L11.5 9.8 L16.5 5.2" />
                </svg>
              </div>
            </div>
          </div>
          <div v-if="!chatStore.activeMessages.length" class="empty-tip">开始聊天吧~</div>
        </div>
        <div class="input-area">
          <el-input v-model="draft" type="textarea" :rows="3" resize="none" placeholder="输入消息，Enter 发送"
            @keydown.enter.exact.prevent="handleSend" />
          <div class="input-actions">
            <el-button type="primary" :disabled="!draft.trim()" @click="handleSend">发送</el-button>
          </div>
        </div>
      </template>
      <div v-else class="chat-placeholder">选择一个联系人开始聊天</div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { Bell } from '@element-plus/icons-vue'
import { useUserStore } from '../stores/user'
import { useChatStore } from '../stores/chat'
import UserAvatar from '../components/UserAvatar.vue'

const userStore = useUserStore()
const chatStore = useChatStore()

const myId = userStore.user?.id
const myName = userStore.user?.nickname || userStore.user?.username || '我'
const keyword = ref('')
const draft = ref('')
const messageBox = ref(null)

const filteredUsers = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  let list = chatStore.users
  if (kw) {
    list = list.filter((u) =>
      (u.username || '').toLowerCase().includes(kw) || (u.nickname || '').toLowerCase().includes(kw))
  }
  return [...list].sort((a, b) => (b.online ? 1 : 0) - (a.online ? 1 : 0))
})

const activeUser = computed(() =>
  chatStore.users.find((u) => u.id === chatStore.activeUserId) || null
)

const formatTime = (t) => {
  const d = new Date(t)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getMonth() + 1}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const handleSelect = (user) => {
  chatStore.selectUser(user.id)
}

const handleSend = () => {
  const content = draft.value.trim()
  if (!content || !chatStore.activeUserId) return
  chatStore.sendMessage(chatStore.activeUserId, content)
  draft.value = ''
}

/** 向上滚动加载更早历史，加载完保持原滚动位置 */
const loadEarlier = async () => {
  const userId = chatStore.activeUserId
  if (!userId || chatStore.loadingEarlier || !chatStore.hasMoreHistory[userId]) return
  const box = messageBox.value
  const firstId = chatStore.activeMessages[0]?.id
  await chatStore.loadEarlier(userId)
  await nextTick()
  if (firstId != null && box) {
    const el = box.querySelector(`[data-mid="${firstId}"]`)
    if (el) {
      box.scrollTop = el.offsetTop - 80
    }
  }
}

const onScroll = () => {
  const box = messageBox.value
  if (!box || box.scrollTop > 30) return
  const userId = chatStore.activeUserId
  if (userId && chatStore.hasMoreHistory[userId] && !chatStore.loadingEarlier) {
    loadEarlier()
  }
}

// 只监听最后一条消息的变化：新消息/发送时滚到底，加载更早历史时不触发
watch(
  () => chatStore.activeMessages[chatStore.activeMessages.length - 1]?.id,
  async () => {
    await nextTick()
    if (messageBox.value) {
      messageBox.value.scrollTop = messageBox.value.scrollHeight
    }
  }
)

onMounted(() => {
  chatStore.loadUsers()
  chatStore.loadConversations()
  chatStore.refreshUnread()
  chatStore.connect()
  messageBox.value?.addEventListener('scroll', onScroll)
})

onUnmounted(() => {
  messageBox.value?.removeEventListener('scroll', onScroll)
  chatStore.activeUserId = null
})
</script>

<style scoped>
.chat-page {
  display: flex;
  height: calc(100vh - 60px - 40px);
  border: 1px solid #eee;
  border-radius: 8px;
  overflow: hidden;
}
.user-panel {
  width: 260px;
  border-right: 1px solid #eee;
  display: flex;
  flex-direction: column;
  background: #fafafa;
}
.panel-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  font-weight: bold;
  border-bottom: 1px solid #eee;
}
.search {
  padding: 10px;
}
.empty {
  padding: 32px;
  text-align: center;
  color: #999;
}
.user-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  cursor: pointer;
  border-bottom: 1px solid #f2f2f2;
}
.user-item:hover {
  background: #f0f7ff;
}
.user-item.active {
  background: #e6f4ff;
}
.user-info {
  flex: 1;
  min-width: 0;
}
.user-name {
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.user-detail {
  font-size: 12px;
  color: #999;
  display: flex;
  align-items: center;
  gap: 4px;
}
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}
.dot.online {
  background: #67c23a;
}
.dot.offline {
  background: #c0c4cc;
}
.chat-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.chat-header {
  padding: 14px 20px;
  border-bottom: 1px solid #eee;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}
.chat-status {
  font-size: 12px;
  color: #999;
  font-weight: normal;
}
.message-box {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
}
.message-row {
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
}
.message-row.mine {
  flex-direction: row-reverse;
}
.message-row.mine .message-bubble {
  background: #95ec69;
}
.message-bubble {
  max-width: 60%;
  background: #fff;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 8px 12px;
  word-break: break-word;
}
.message-content {
  white-space: pre-wrap;
}
.message-meta {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  margin-top: 4px;
}
.message-time {
  font-size: 11px;
  color: #999;
}
.tick {
  width: 16px;
  height: 11px;
  fill: none;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
  flex-shrink: 0;
}
.tick.sent path {
  stroke: #c0c4cc;
}
.tick.read path {
  stroke: #1677ff;
}
.empty-tip,
.chat-placeholder {
  color: #999;
  text-align: center;
  margin-top: 40px;
}
.input-area {
  border-top: 1px solid #eee;
  padding: 10px 14px;
}
.input-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}
.avatar {
  background: #409eff;
  color: #fff;
  flex-shrink: 0;
}
</style>