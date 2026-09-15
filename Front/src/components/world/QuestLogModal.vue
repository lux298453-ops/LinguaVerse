<template>
  <Transition name="quest-modal-fade">
    <div v-if="visible" class="quest-modal-backdrop" @click.self="$emit('close')">
      <div class="quest-modal-container">
        <!-- 模态框顶部 -->
        <div class="quest-modal-header">
          <div class="header-left">
            <span class="header-icon">📜</span>
            <div class="header-titles">
              <h2 class="modal-title">冒险委托书 · Quest Journal</h2>
              <span class="modal-subtitle">探索星语世界的主线剧情与学者委托</span>
            </div>
          </div>
          <button class="modal-close-btn" @click="$emit('close')" title="关闭 (ESC / J)">✕</button>
        </div>

        <!-- 任务分类筛选栏 -->
        <div class="quest-tabs-bar">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            class="tab-btn"
            :class="{ active: currentTab === tab.id }"
            @click="currentTab = tab.id"
          >
            <span class="tab-icon">{{ tab.icon }}</span>
            <span class="tab-label">{{ tab.label }}</span>
            <span class="tab-count">({{ getTabCount(tab.id) }})</span>
          </button>
        </div>

        <!-- 主内容区域 (左右分栏) -->
        <div class="quest-modal-body">
          <!-- 左侧：任务列表 -->
          <div class="quest-list-panel">
            <div v-if="filteredQuests.length === 0" class="empty-quest-list">
              <span class="empty-icon">📂</span>
              <p>暂无符合条件的委托记录</p>
            </div>

            <div
              v-for="q in filteredQuests"
              :key="q.taskId"
              class="quest-item-card"
              :class="{
                selected: selectedQuest?.taskId === q.taskId,
                completed: q.status === 'COMPLETED',
                locked: q.isLocked,
                tracked: isTracked(q.taskId)
              }"
              @click="selectedQuest = q"
            >
              <div class="card-top-row">
                <span class="category-tag" :class="q.category.toLowerCase()">
                  {{ q.category === 'MAIN' ? '主线' : '学者' }}
                </span>
                <span class="status-badge" :class="getStatusClass(q)">
                  {{ getStatusText(q) }}
                </span>
              </div>

              <div class="card-title-row">
                <span class="quest-title">{{ q.title }}</span>
                <span v-if="isTracked(q.taskId)" class="tracking-pin" title="正在追踪">📍 追踪中</span>
              </div>

              <div class="card-bottom-row">
                <span class="npc-giver-tag">👤 {{ q.npcName }}</span>
                <span class="location-tag">📍 {{ getMapLabel(q.npcMapId) }}</span>
                <span class="reward-pill">+{{ q.rewardCoins }} 🪙</span>
              </div>
            </div>
          </div>

          <!-- 右侧：选中任务详情看板 -->
          <div class="quest-detail-panel">
            <div v-if="selectedQuest" class="detail-wrapper">
              <!-- 标题与状态大栏 -->
              <div class="detail-header-card">
                <div class="detail-title-line">
                  <span class="category-banner" :class="selectedQuest.category.toLowerCase()">
                    {{ selectedQuest.category === 'MAIN' ? '主线剧情委托' : '学者研习委托' }}
                  </span>
                  <h3 class="detail-title">{{ selectedQuest.title }}</h3>
                </div>
                <div class="detail-status-row">
                  <span class="detail-status-pill" :class="getStatusClass(selectedQuest)">
                    {{ getStatusText(selectedQuest) }}
                  </span>
                  <span v-if="isTracked(selectedQuest.taskId)" class="active-track-pill">
                    ⚡ 当前追踪目标
                  </span>
                </div>
              </div>

              <!-- 发起人与背景叙事 -->
              <div class="detail-section">
                <div class="section-heading">委托人与背景</div>
                <div class="giver-card">
                  <div class="giver-avatar">
                    {{ selectedQuest.npcName ? selectedQuest.npcName[0] : 'N' }}
                  </div>
                  <div class="giver-info">
                    <div class="giver-name-row">
                      <span class="giver-name">{{ selectedQuest.npcName }}</span>
                      <span class="giver-location">📍 {{ getMapLabel(selectedQuest.npcMapId) }}</span>
                    </div>
                    <p class="giver-desc">{{ selectedQuest.goalDesc }}</p>
                  </div>
                </div>
              </div>

              <!-- 当前目标与阶段指引 -->
              <div class="detail-section">
                <div class="section-heading">阶段行动目标</div>
                <div class="objective-card" :class="{ completed: selectedQuest.status === 'COMPLETED' }">
                  <div class="objective-icon">
                    <span v-if="selectedQuest.status === 'COMPLETED'">✓</span>
                    <span v-else-if="selectedQuest.isLocked">🔒</span>
                    <span v-else>▶</span>
                  </div>
                  <div class="objective-body">
                    <div class="objective-text">
                      {{ selectedQuest.currentStepDesc || '与委托人对话接取或提交任务。' }}
                    </div>
                    <div class="objective-hint" v-if="!selectedQuest.isLocked && selectedQuest.status !== 'COMPLETED'">
                      提示：可前往对应场景寻找头上标有金色感叹号或徽记的 NPC 进行对话！
                    </div>
                  </div>
                </div>
              </div>

              <!-- 委托报酬 -->
              <div class="detail-section">
                <div class="section-heading">达成报酬</div>
                <div class="reward-grid">
                  <div class="reward-card">
                    <span class="reward-icon">🪙</span>
                    <div class="reward-meta">
                      <span class="reward-val">+{{ selectedQuest.rewardCoins }} 金币</span>
                      <span class="reward-desc">星语世界通用货币</span>
                    </div>
                  </div>
                  <div class="reward-card">
                    <span class="reward-icon">⭐</span>
                    <div class="reward-meta">
                      <span class="reward-val">+50 探险经验</span>
                      <span class="reward-desc">提升探险学者等级</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 底部操作按钮 -->
              <div class="detail-actions-bar">
                <button
                  v-if="selectedQuest.status !== 'COMPLETED' && !selectedQuest.isLocked"
                  class="action-btn track-btn"
                  :disabled="isTracked(selectedQuest.taskId)"
                  @click="handleSetTrack(selectedQuest)"
                >
                  <span v-if="isTracked(selectedQuest.taskId)">✓ 正在主界面追踪</span>
                  <span v-else>📍 设为当前追踪目标</span>
                </button>
                <div v-else-if="selectedQuest.status === 'COMPLETED'" class="completed-hint">
                  ✨ 该委托已功德圆满，随时可在场景中与 NPC 重新交谈！
                </div>
                <div v-else-if="selectedQuest.isLocked" class="locked-hint">
                  🔒 前置委托尚未达成，请按主线顺序依次探索！
                </div>
              </div>
            </div>

            <!-- 未选中任何任务 -->
            <div v-else class="no-selection">
              <span class="no-selection-icon">📜</span>
              <p>请在左侧列表中选择一项委托查看详情</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  quests: { type: Array, default: () => [] },
  trackedTaskId: { type: [Number, String], default: null }
})

const emit = defineEmits(['close', 'setTrack'])

const currentTab = ref('ALL')
const selectedQuest = ref(null)

const tabs = [
  { id: 'ALL', label: '全部委托', icon: '📋' },
  { id: 'MAIN', label: '主线剧情', icon: '⚔️' },
  { id: 'ACADEMIC', label: '学者研习', icon: '🧪' },
  { id: 'COMPLETED', label: '已达成', icon: '🏆' }
]

function getTabCount(tabId) {
  if (!props.quests) return 0
  if (tabId === 'ALL') return props.quests.length
  if (tabId === 'COMPLETED') return props.quests.filter(q => q.status === 'COMPLETED').length
  return props.quests.filter(q => q.category === tabId && q.status !== 'COMPLETED').length
}

const filteredQuests = computed(() => {
  if (!props.quests) return []
  if (currentTab.value === 'ALL') {
    return props.quests
  }
  if (currentTab.value === 'COMPLETED') {
    return props.quests.filter(q => q.status === 'COMPLETED')
  }
  return props.quests.filter(q => q.category === currentTab.value && q.status !== 'COMPLETED')
})

watch(
  () => props.visible,
  (val) => {
    if (val) {
      // 默认选中当前追踪的任务，或者第一个进行中的任务
      const target = props.quests.find(q => q.taskId === props.trackedTaskId) ||
                     props.quests.find(q => q.status !== 'COMPLETED' && !q.isLocked) ||
                     props.quests[0]
      selectedQuest.value = target || null
    }
  }
)

function isTracked(taskId) {
  return Number(props.trackedTaskId) === Number(taskId)
}

function getStatusClass(q) {
  if (q.status === 'COMPLETED') return 'status-completed'
  if (q.isLocked) return 'status-locked'
  return 'status-in-progress'
}

function getStatusText(q) {
  if (q.status === 'COMPLETED') return '✓ 已达成'
  if (q.isLocked) return '🔒 前置未锁'
  return '⏳ 进行中'
}

function getMapLabel(mapId) {
  if (mapId === 'hall') return '阳光大厅'
  if (mapId === 'game_zone') return '奇幻游戏区'
  return mapId || '未知世界'
}

function handleSetTrack(quest) {
  emit('setTrack', quest)
}
</script>

<style scoped>
.quest-modal-fade-enter-active,
.quest-modal-fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.quest-modal-fade-enter-from,
.quest-modal-fade-leave-to {
  opacity: 0;
  transform: scale(0.96);
}

.quest-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 2200;
  background: rgba(10, 14, 26, 0.78);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.quest-modal-container {
  width: 960px;
  max-width: 95vw;
  height: 640px;
  max-height: 90vh;
  background: linear-gradient(135deg, rgba(22, 28, 45, 0.95), rgba(15, 20, 35, 0.98));
  border: 1px solid rgba(255, 215, 0, 0.22);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  color: #f1f5f9;
}

/* Header */
.quest-modal-header {
  padding: 18px 24px;
  background: rgba(15, 22, 38, 0.85);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 14px;
}
.header-icon {
  font-size: 26px;
}
.modal-title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #f8fafc;
  letter-spacing: 0.5px;
}
.modal-subtitle {
  font-size: 12px;
  color: #94a3b8;
}
.modal-close-btn {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #94a3b8;
  font-size: 16px;
  width: 34px;
  height: 34px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.modal-close-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
  border-color: rgba(239, 68, 68, 0.4);
}

/* Tabs */
.quest-tabs-bar {
  display: flex;
  gap: 8px;
  padding: 12px 24px;
  background: rgba(10, 15, 28, 0.7);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}
.tab-btn {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #94a3b8;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}
.tab-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #f1f5f9;
}
.tab-btn.active {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(217, 119, 6, 0.15));
  border-color: rgba(245, 158, 11, 0.55);
  color: #fbbf24;
}
.tab-count {
  font-size: 11px;
  opacity: 0.8;
}

/* Body */
.quest-modal-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* Left List Panel */
.quest-list-panel {
  width: 360px;
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: rgba(10, 14, 25, 0.35);
}
.empty-quest-list {
  text-align: center;
  padding: 48px 16px;
  color: #64748b;
  font-size: 13px;
}
.empty-icon {
  font-size: 36px;
  display: block;
  margin-bottom: 8px;
  opacity: 0.5;
}

.quest-item-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 10px;
  padding: 12px 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.quest-item-card:hover {
  background: rgba(255, 255, 255, 0.07);
  border-color: rgba(255, 255, 255, 0.18);
  transform: translateY(-1px);
}
.quest-item-card.selected {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.18), rgba(217, 119, 6, 0.08));
  border-color: rgba(245, 158, 11, 0.5);
}
.quest-item-card.completed {
  opacity: 0.72;
}
.quest-item-card.locked {
  opacity: 0.55;
  filter: grayscale(0.5);
}

.card-top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.category-tag {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  letter-spacing: 0.4px;
}
.category-tag.main {
  background: rgba(245, 158, 11, 0.2);
  color: #fbbf24;
  border: 1px solid rgba(245, 158, 11, 0.35);
}
.category-tag.academic {
  background: rgba(56, 189, 248, 0.2);
  color: #38bdf8;
  border: 1px solid rgba(56, 189, 248, 0.35);
}

.status-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
}
.status-completed {
  background: rgba(34, 197, 94, 0.18);
  color: #4ade80;
}
.status-in-progress {
  background: rgba(245, 158, 11, 0.18);
  color: #fbbf24;
}
.status-locked {
  background: rgba(148, 163, 184, 0.12);
  color: #94a3b8;
}

.card-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.quest-title {
  font-size: 14px;
  font-weight: 600;
  color: #f8fafc;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.tracking-pin {
  font-size: 11px;
  color: #f59e0b;
  font-weight: 600;
  flex-shrink: 0;
}

.card-bottom-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: #94a3b8;
}
.npc-giver-tag, .location-tag {
  background: rgba(255, 255, 255, 0.04);
  padding: 2px 6px;
  border-radius: 4px;
}
.reward-pill {
  margin-left: auto;
  font-weight: 700;
  color: #fbbf24;
}

/* Right Detail Panel */
.quest-detail-panel {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  background: rgba(15, 20, 36, 0.45);
}
.detail-wrapper {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.detail-header-card {
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}
.detail-title-line {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 8px;
}
.category-banner {
  align-self: flex-start;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 4px;
}
.category-banner.main {
  background: rgba(245, 158, 11, 0.2);
  color: #fbbf24;
  border: 1px solid rgba(245, 158, 11, 0.4);
}
.category-banner.academic {
  background: rgba(56, 189, 248, 0.2);
  color: #38bdf8;
  border: 1px solid rgba(56, 189, 248, 0.4);
}
.detail-title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #f8fafc;
}
.detail-status-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.detail-status-pill {
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 6px;
}
.active-track-pill {
  font-size: 12px;
  font-weight: 600;
  background: rgba(245, 158, 11, 0.2);
  color: #fbbf24;
  border: 1px solid rgba(245, 158, 11, 0.4);
  padding: 4px 10px;
  border-radius: 6px;
}

.detail-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.section-heading {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  color: #94a3b8;
  letter-spacing: 0.5px;
}

.giver-card {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  padding: 14px;
  border-radius: 10px;
}
.giver-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  color: #ffffff;
  font-size: 18px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}
.giver-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.giver-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.giver-name {
  font-size: 15px;
  font-weight: 700;
  color: #f1f5f9;
}
.giver-location {
  font-size: 12px;
  color: #60a5fa;
}
.giver-desc {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  color: #cbd5e1;
}

.objective-card {
  display: flex;
  gap: 12px;
  background: rgba(245, 158, 11, 0.06);
  border: 1px solid rgba(245, 158, 11, 0.25);
  padding: 14px;
  border-radius: 10px;
}
.objective-card.completed {
  background: rgba(34, 197, 94, 0.06);
  border-color: rgba(34, 197, 94, 0.25);
}
.objective-icon {
  font-size: 16px;
  font-weight: 700;
  color: #fbbf24;
  flex-shrink: 0;
  margin-top: 1px;
}
.objective-card.completed .objective-icon {
  color: #4ade80;
}
.objective-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.objective-text {
  font-size: 14px;
  font-weight: 600;
  color: #f8fafc;
  line-height: 1.5;
}
.objective-hint {
  font-size: 12px;
  color: #94a3b8;
}

.reward-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}
.reward-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  padding: 12px 14px;
  border-radius: 10px;
}
.reward-icon {
  font-size: 24px;
}
.reward-meta {
  display: flex;
  flex-direction: column;
}
.reward-val {
  font-size: 14px;
  font-weight: 700;
  color: #fbbf24;
}
.reward-desc {
  font-size: 11px;
  color: #94a3b8;
}

.detail-actions-bar {
  margin-top: 8px;
  display: flex;
  justify-content: flex-end;
}
.action-btn {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}
.track-btn {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: #1e1b4b;
  box-shadow: 0 4px 14px rgba(245, 158, 11, 0.35);
}
.track-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(245, 158, 11, 0.45);
}
.track-btn:disabled {
  background: rgba(255, 255, 255, 0.08);
  color: #94a3b8;
  box-shadow: none;
  cursor: not-allowed;
}

.completed-hint {
  font-size: 13px;
  color: #4ade80;
  font-weight: 600;
}
.locked-hint {
  font-size: 13px;
  color: #94a3b8;
  font-weight: 600;
}

.no-selection {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #64748b;
  font-size: 14px;
  gap: 12px;
}
.no-selection-icon {
  font-size: 44px;
  opacity: 0.5;
}
</style>
