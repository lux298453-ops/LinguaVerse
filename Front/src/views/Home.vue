<template>
  <div class="user-center-container">
    <!-- 个人基本资料卡片 -->
    <el-card class="profile-hero-card" shadow="never">
      <div class="profile-hero-inner">
        <div class="profile-avatar-wrap" @click="openAvatarModal" title="点击更换形象">
          <UserAvatar
            :avatar="user.avatar"
            :name="user.nickname || user.username"
            :size="68"
            radius="18px"
          />
          <div class="avatar-badge-edit">
            <el-icon><Camera /></el-icon>
            <span>更换</span>
          </div>
        </div>
        <div class="profile-main-info">
          <div class="profile-name-row">
            <h2 class="profile-display-name">{{ user.nickname || user.username }}</h2>
            <el-tag v-if="user.role === 'ADMIN'" type="danger" effect="dark" size="small">
              管理员 ADMIN
            </el-tag>
            <el-tag v-else type="primary" effect="plain" size="small">
              注册学员 LEARNER
            </el-tag>
          </div>
          <p class="profile-subtext">
            用户唯一标识 UID: #{{ user.id }} · 登录账号: {{ user.username }}
          </p>
        </div>
        <div class="profile-actions">
          <el-button type="primary" @click="openAvatarModal">
            <el-icon><EditPen /></el-icon>
            <span>更换头像与资料</span>
          </el-button>
          <el-button plain @click="handleRefresh" :loading="refreshing">
            <el-icon><Refresh /></el-icon>
            <span>刷新数据</span>
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 更换头像与资料弹窗 -->
    <el-dialog
      v-model="avatarModalVisible"
      title="选择或更换你的专属形象"
      width="560px"
      append-to-body
      destroy-on-close
    >
      <div class="avatar-picker-body">
        <div class="avatar-current-preview">
          <UserAvatar
            :avatar="selectedAvatar"
            :name="editNickname || user.username"
            :size="72"
            radius="18px"
          />
          <div class="preview-text">
            <span class="preview-label">当前选定形象</span>
            <span class="preview-name">{{ getSelectedAvatarLabel(selectedAvatar) }}</span>
          </div>
          <el-button
            v-if="canAdjustCurrentAvatar"
            size="small"
            type="primary"
            plain
            class="re-crop-btn"
            @click="openCropperWithCurrent"
          >
            <el-icon><Crop /></el-icon>
            <span>调整选区</span>
          </el-button>
        </div>

        <el-divider content-position="left">系统推荐形象</el-divider>
        <div class="preset-avatar-grid">
          <div
            v-for="p in PRESET_AVATARS"
            :key="p.id"
            class="preset-item"
            :class="{ active: selectedAvatar === p.id }"
            @click="selectedAvatar = p.id; customUrl = ''"
          >
            <UserAvatar :avatar="p.id" :name="p.name" :size="46" radius="12px" />
            <span class="preset-name">{{ p.name }}</span>
            <span v-if="selectedAvatar === p.id" class="preset-check">✓</span>
          </div>
        </div>

        <el-divider content-position="left">上传本地图片</el-divider>
        <div class="local-upload-dropzone" @click="triggerFileInput">
          <input
            ref="fileInputRef"
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
            style="display: none"
            @change="handleLocalFileChange"
          />
          <div class="dropzone-icon">
            <el-icon :size="24"><UploadFilled /></el-icon>
          </div>
          <div class="dropzone-text">
            <div class="dropzone-main-title">点击或选择电脑本地图片上传</div>
            <div class="dropzone-sub-tip">选择后自动开启框选与拖拽微调 · 支持 PNG / JPG / WEBP，最大 10MB</div>
          </div>
          <el-button type="primary" plain size="small" :loading="uploadingLocal" class="dropzone-btn">
            浏览本地文件
          </el-button>
        </div>

        <el-divider content-position="left">网络图片链接</el-divider>
        <el-input
          v-model="customUrl"
          placeholder="可粘贴任意图片 URL (以 http/https 开头)"
          clearable
          @input="onCustomUrlInput"
        />

        <el-divider content-position="left">用户昵称</el-divider>
        <el-input
          v-model="editNickname"
          placeholder="输入你想在世界中展示的昵称"
          maxlength="20"
          show-word-limit
        />
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="avatarModalVisible = false">取消</el-button>
          <el-button type="primary" :loading="savingProfile" @click="handleSaveProfile">
            保存形象与资料
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 学习与冒险生涯数据指标 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon-wrap icon-book">
          <el-icon :size="20"><Reading /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-label">当前研习词书</div>
          <div class="stat-value text-book">{{ currentBook.name }}</div>
          <div class="stat-desc">{{ currentBook.desc }}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon-wrap icon-slang">
          <el-icon :size="20"><ChatLineSquare /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-label">地道俚语实战</div>
          <div class="stat-value text-slang">{{ masteredSlangCount }} / {{ totalSlangCount }} 首</div>
          <div class="stat-desc">在逼真情景中已实战掌握</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon-wrap icon-fav">
          <el-icon :size="20"><Star /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-label">生词本收藏</div>
          <div class="stat-value text-fav">{{ favoriteWordsCount }} 词</div>
          <div class="stat-desc">沉浸查词一键高亮收藏</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon-wrap icon-shield">
          <el-icon :size="20"><CircleCheck /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-label">账号状态</div>
          <div class="stat-value text-status">正常通行</div>
          <div class="stat-desc">已连接 LinguaVerse 全服集群</div>
        </div>
      </div>
    </div>

    <!-- 账号详细信息 -->
    <el-card class="details-card" shadow="never">
      <template #header>
        <div class="details-header">
          <span class="details-title">账户档案详情</span>
        </div>
      </template>

      <el-descriptions :column="2" border>
        <el-descriptions-item label="系统内部编号 (UID)">{{ user.id }}</el-descriptions-item>
        <el-descriptions-item label="登录账号 (Username)">{{ user.username }}</el-descriptions-item>
        <el-descriptions-item label="个人昵称 (Nickname)">{{ user.nickname || '未设定' }}</el-descriptions-item>
        <el-descriptions-item label="身份权限 (Role)">
          <el-tag v-if="user.role === 'ADMIN'" type="danger" size="small">平台管理员</el-tag>
          <el-tag v-else size="small">正式学员</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="账号生命周期">永久有效</el-descriptions-item>
        <el-descriptions-item label="当前世界坐标">Sunshine Hall · 阳光大厅</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 头像框选裁剪微调弹窗 -->
    <AvatarCropperModal
      v-model="cropperModalVisible"
      :image-src="cropperImageSrc"
      @crop-success="onCropSuccess"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Camera,
  EditPen,
  Refresh,
  Crop,
  UploadFilled,
  Reading,
  ChatLineSquare,
  Star,
  CircleCheck
} from '@element-plus/icons-vue'
import { getMe, updateProfile, uploadImage } from '../api/user'
import { useUserStore } from '../stores/user'
import { getCurrentBook, getFavorites } from '../components/games/dictService'
import { getMasteredCount } from '../components/games/slangJudgeService'
import { SLANG_DATABASE } from '../components/games/slangData'
import { PRESET_AVATARS } from '../utils/avatarHelper'
import UserAvatar from '../components/UserAvatar.vue'
import AvatarCropperModal from '../components/AvatarCropperModal.vue'

const userStore = useUserStore()
const user = ref(userStore.user || {})
const refreshing = ref(false)

// 学习统计数据
const currentBook = ref(getCurrentBook())
const masteredSlangCount = ref(getMasteredCount())
const totalSlangCount = ref(SLANG_DATABASE.length)
const favoriteWordsCount = ref(getFavorites().length)

// 头像弹窗状态
const avatarModalVisible = ref(false)
const selectedAvatar = ref('')
const customUrl = ref('')
const editNickname = ref('')
const savingProfile = ref(false)
const fileInputRef = ref(null)
const uploadingLocal = ref(false)

// 框选裁剪状态
const cropperModalVisible = ref(false)
const cropperImageSrc = ref('')

const canAdjustCurrentAvatar = computed(() => {
  return !!selectedAvatar.value && (
    selectedAvatar.value.startsWith('/uploads/') ||
    selectedAvatar.value.startsWith('http') ||
    selectedAvatar.value.startsWith('data:')
  )
})

function openCropperWithCurrent() {
  if (!selectedAvatar.value) return
  cropperImageSrc.value = selectedAvatar.value
  cropperModalVisible.value = true
}

function openAvatarModal() {
  selectedAvatar.value = user.value.avatar || ''
  customUrl.value = (user.value.avatar && (user.value.avatar.startsWith('http') || user.value.avatar.startsWith('data:'))) ? user.value.avatar : ''
  editNickname.value = user.value.nickname || user.value.username || ''
  avatarModalVisible.value = true
}

function triggerFileInput() {
  fileInputRef.value?.click()
}

function handleLocalFileChange(e) {
  const file = e.target.files?.[0]
  if (!file) return

  if (file.size > 10 * 1024 * 1024) {
    ElMessage.warning('图片大小不能超过 10MB')
    return
  }

  // 本地先通过 FileReader 载入并打开框选调整窗口
  const reader = new FileReader()
  reader.onload = (evt) => {
    cropperImageSrc.value = evt.target.result
    cropperModalVisible.value = true
  }
  reader.readAsDataURL(file)
  if (e.target) e.target.value = ''
}

async function onCropSuccess({ file, dataUrl }) {
  uploadingLocal.value = true
  try {
    const res = await uploadImage(file)
    selectedAvatar.value = res.url
    customUrl.value = res.url
    ElMessage.success('头像裁剪并上传成功！已实时更新选定形象')
  } catch (err) {
    ElMessage.error(err?.message || '上传裁剪图片失败，请重试')
  } finally {
    uploadingLocal.value = false
  }
}

function onCustomUrlInput(val) {
  if (val && val.trim()) {
    selectedAvatar.value = val.trim()
  }
}

function getSelectedAvatarLabel(avatar) {
  if (!avatar) return '默认首字母'
  if (avatar.startsWith('/uploads/')) return '本地自定义图片'
  if (avatar.startsWith('http') || avatar.startsWith('data:')) return '网络外链图片'
  const p = PRESET_AVATARS.find(item => item.id === avatar)
  return p ? p.name : '预设形象'
}

async function handleSaveProfile() {
  savingProfile.value = true
  try {
    const res = await updateProfile({
      nickname: editNickname.value,
      avatar: selectedAvatar.value
    })
    user.value = res
    userStore.setUser(res)
    ElMessage.success('个人专属形象与资料已成功更新！')
    avatarModalVisible.value = false
  } catch (e) {
    // error handled by request interceptor
  } finally {
    savingProfile.value = false
  }
}

function reloadStats() {
  currentBook.value = getCurrentBook()
  masteredSlangCount.value = getMasteredCount()
  favoriteWordsCount.value = getFavorites().length
}

onMounted(() => {
  reloadStats()
})

const handleRefresh = async () => {
  refreshing.value = true
  try {
    const data = await getMe()
    user.value = data
    userStore.setUser(data)
    reloadStats()
    ElMessage.success('个人档案已刷新')
  } catch {
    /* 错误提示由拦截器统一处理 */
  } finally {
    refreshing.value = false
  }
}
</script>

<style scoped>
.user-center-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 个人信息横幅卡片 */
.profile-hero-card {
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  background: #ffffff;
}

.profile-hero-card :deep(.el-card__body) {
  padding: 24px 28px;
}

.profile-hero-inner {
  display: flex;
  align-items: center;
  gap: 20px;
}

.profile-avatar-wrap {
  position: relative;
  cursor: pointer;
  border-radius: 18px;
  transition: transform 0.2s;
  flex-shrink: 0;
}

.profile-avatar-wrap:hover {
  transform: scale(1.05);
}

.profile-avatar-wrap:hover .avatar-badge-edit {
  opacity: 1;
}

.avatar-badge-edit {
  position: absolute;
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(15, 23, 42, 0.85);
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 8px;
  white-space: nowrap;
  backdrop-filter: blur(4px);
  opacity: 0.9;
  transition: opacity 0.2s;
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 头像选择弹窗样式 */
.avatar-picker-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.avatar-current-preview {
  display: flex;
  align-items: center;
  gap: 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 12px 18px;
}

.preview-text {
  display: flex;
  flex-direction: column;
}

.preview-label {
  font-size: 12px;
  color: #64748b;
}

.preview-name {
  font-size: 15px;
  font-weight: 800;
  color: #0f172a;
  margin-top: 2px;
}

.re-crop-btn {
  margin-left: auto;
  border-radius: 8px;
  font-weight: 600;
}

.preset-avatar-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.preset-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 8px 4px;
  border-radius: 12px;
  border: 2px solid transparent;
  background: #f8fafc;
  cursor: pointer;
  position: relative;
  transition: all 0.2s;
}

.preset-item:hover {
  background: #f1f5f9;
  transform: translateY(-2px);
}

.preset-item.active {
  background: #eff6ff;
  border-color: #3b82f6;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
}

.preset-name {
  font-size: 11px;
  color: #475569;
  font-weight: 600;
  text-align: center;
}

.preset-item.active .preset-name {
  color: #2563eb;
  font-weight: 700;
}

.preset-check {
  position: absolute;
  top: 4px;
  right: 6px;
  font-size: 11px;
  color: #2563eb;
  font-weight: 900;
}

.local-upload-dropzone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 20px 16px;
  background: #f8fafc;
  border: 2px dashed #cbd5e1;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.25s ease;
  gap: 8px;
  user-select: none;
}

.local-upload-dropzone:hover {
  background: #eff6ff;
  border-color: #3b82f6;
  box-shadow: 0 4px 14px rgba(59, 130, 246, 0.08);
  transform: translateY(-1px);
}

.dropzone-icon {
  width: 46px;
  height: 46px;
  border-radius: 12px;
  background: #eff6ff;
  color: #2563eb;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease, background 0.2s ease;
}

.local-upload-dropzone:hover .dropzone-icon {
  background: #dbeafe;
  transform: translateY(-2px);
}

.dropzone-text {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.dropzone-main-title {
  font-size: 13px;
  font-weight: 700;
  color: #1e293b;
}

.dropzone-sub-tip {
  font-size: 11px;
  color: #64748b;
}

.dropzone-btn {
  margin-top: 4px;
  border-radius: 8px;
  font-weight: 600;
  pointer-events: none;
}



.profile-main-info {
  flex: 1;
}

.profile-name-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.profile-display-name {
  margin: 0;
  font-size: 20px;
  font-weight: 800;
  color: #0f172a;
}

.profile-subtext {
  margin: 6px 0 0 0;
  font-size: 13px;
  color: #64748b;
}

/* 四列数据卡片网格 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.stat-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 18px 20px;
  display: flex;
  align-items: flex-start;
  gap: 14px;
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.04);
}

.stat-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.icon-book { background: #eff6ff; color: #2563eb; }
.icon-slang { background: #fffbeb; color: #d97706; }
.icon-fav { background: #fdf2f8; color: #db2777; }
.icon-shield { background: #ecfdf5; color: #059669; }

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 12px;
  color: #64748b;
  font-weight: 600;
}

.stat-value {
  font-size: 17px;
  font-weight: 800;
  margin-top: 4px;
}

.text-book { color: #2563eb; }
.text-slang { color: #d97706; }
.text-fav { color: #db2777; }
.text-status { color: #059669; }

.stat-desc {
  font-size: 11px;
  color: #94a3b8;
  margin-top: 2px;
}

/* 详情卡片 */
.details-card {
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  background: #ffffff;
}

.details-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.details-title {
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
}
</style>