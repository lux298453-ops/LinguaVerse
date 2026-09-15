<template>
  <Transition name="slang-pop">
    <div v-if="visible" class="slang-overlay" @click.self="handleClose">
      <div class="slang-modal-container">
        <!-- 顶部导航栏 -->
        <div class="slang-header">
          <div class="header-left">
            <span class="lounge-icon">☕</span>
            <div>
              <div class="lounge-title-row">
                <h2 class="lounge-title">灵语茶歇馆 · 地道俚语实战台</h2>
                <span class="mastery-pill">已精通: {{ masteredCount }} / {{ totalSlangs }}</span>
              </div>
              <p class="lounge-subtitle">自由修习地道欧美谚语与俚语，在逼真情景交流中脱口而出！</p>
            </div>
          </div>

          <div class="header-right">
            <!-- 模式切换 Tabs -->
            <div class="mode-tabs">
              <button
                class="tab-btn"
                :class="{ active: currentView === 'INDEX' }"
                @click="switchView('INDEX')"
              >
                📜 俚语手册
              </button>
              <button
                class="tab-btn"
                :class="{ active: currentView === 'LEARN' }"
                @click="switchView('LEARN')"
                :disabled="!currentSlang"
              >
                📖 典故卡片
              </button>
              <button
                class="tab-btn"
                :class="{ active: currentView === 'SCENARIO' }"
                @click="switchView('SCENARIO')"
                :disabled="!currentSlang"
              >
                🎭 情景实战
              </button>
              <button
                class="tab-btn"
                :class="{ active: currentView === 'NOTEBOOK' }"
                @click="switchView('NOTEBOOK')"
              >
                ⭐ 表达本 ({{ masteredCount }})
              </button>
            </div>

            <button class="close-icon-btn" @click="handleClose" title="关闭">✕</button>
          </div>
        </div>

        <!-- 视图 1: 俚语手册目录 (INDEX) -->
        <div v-if="currentView === 'INDEX'" class="view-container index-view">
          <!-- 分类筛选器 -->
          <div class="category-filter-row">
            <button
              v-for="cat in SLANG_CATEGORIES"
              :key="cat.id"
              class="cat-chip"
              :class="{ active: selectedCategory === cat.id }"
              @click="selectedCategory = cat.id"
            >
              <span>{{ cat.icon }}</span>
              <span>{{ cat.name }}</span>
            </button>
          </div>

          <!-- 俚语卡片瀑布网格 -->
          <div class="slang-cards-grid">
            <div
              v-for="item in filteredSlangs"
              :key="item.id"
              class="slang-item-card"
              :class="{
                'is-mastered': isMastered(item.id),
                'is-learning': isLearning(item.id)
              }"
              @click="openSlang(item)"
            >
              <div class="item-top">
                <span class="item-phrase">{{ item.phrase }}</span>
                <span v-if="isMastered(item.id)" class="status-badge mastered">✓ 已精通</span>
                <span v-else-if="isLearning(item.id)" class="status-badge learning">修习中</span>
                <span v-else class="status-badge new">未修习</span>
              </div>

              <div class="item-meaning">
                <div class="literal"><span class="lbl">字面:</span> {{ item.literal_mean }}</div>
                <div class="actual"><span class="lbl">真意:</span> {{ item.actual_mean }}</div>
              </div>

              <div class="item-footer">
                <span class="item-scenario-hint">情境: {{ item.scenario.npcName }}</span>
                <button class="btn-card-action" @click.stop="openSlang(item)">
                  研读 & 实战 ➜
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 视图 2: 典故卡片与趣味故事 (LEARN) -->
        <div v-else-if="currentView === 'LEARN' && currentSlang" class="view-container learn-view">
          <div class="learn-hero-card">
            <div class="hero-top-bar">
              <button class="btn-back" @click="currentView = 'INDEX'">⬅ 返回手册</button>
              <span class="pronounce-tag">{{ currentSlang.phonetic }}</span>
              <button class="btn-audio-speak" @click="playSlangAudio" title="收听纯正真人发音">
                🔊 朗读发音
              </button>
            </div>

            <h1 class="hero-phrase">{{ currentSlang.phrase }}</h1>

            <!-- 误区 vs 地道含义对比板 -->
            <div class="meaning-compare-board">
              <div class="compare-card literal">
                <div class="cmp-title">❌ 字面误区字面意</div>
                <div class="cmp-text">{{ currentSlang.literal_mean }}</div>
                <div class="cmp-sub">初学者容易望文生义引发尴尬误会</div>
              </div>

              <div class="compare-arrow">➜</div>

              <div class="compare-card actual">
                <div class="cmp-title">✅ 地道真实含义</div>
                <div class="cmp-text">{{ currentSlang.actual_mean }}</div>
                <div class="cmp-sub">欧美母语者脱口而出的生动表达</div>
              </div>
            </div>

            <!-- 由来典故小故事 -->
            <div class="origin-story-box">
              <div class="story-title">
                <span>📜 典故由来小故事 (Cultural Origin)</span>
              </div>
              <p class="story-content">{{ currentSlang.origin_story }}</p>
            </div>

            <!-- 地道生活例句 -->
            <div class="example-box">
              <div class="ex-en">"{{ currentSlang.example_en }}"</div>
              <div class="ex-cn">{{ currentSlang.example_cn }}</div>
            </div>

            <!-- 底部前往实战大按钮 -->
            <div class="learn-actions-row">
              <button class="btn-goto-scenario" @click="startScenario(currentSlang)">
                ⚡ 立即去情景对话实战运用 (Apply Now) ➜
              </button>
            </div>
          </div>
        </div>

        <!-- 视图 3: 沉浸情景对话实战 (SCENARIO) -->
        <div v-else-if="currentView === 'SCENARIO' && currentSlang" class="view-container scenario-view">
          <div class="scenario-panel">
            <div class="scenario-header-bar">
              <div class="scenario-context-tag">
                <span>📍 情境任务：{{ currentSlang.scenario.context }}</span>
              </div>
              <button class="btn-back-link" @click="currentView = 'LEARN'">📖 查看俚语提示</button>
            </div>

            <!-- NPC 对话气泡区 -->
            <div class="dialogue-theater">
              <!-- NPC 对话气泡 -->
              <div class="dialogue-row npc-row">
                <div class="actor-avatar">{{ currentSlang.scenario.npcAvatar }}</div>
                <div class="bubble-wrap">
                  <div class="actor-name">{{ currentSlang.scenario.npcName }}</div>
                  <div class="dialogue-bubble npc-bubble">
                    {{ currentSlang.scenario.promptDialog }}
                  </div>
                </div>
              </div>

              <!-- 玩家回复气泡 (若已回答成功展示) -->
              <div v-if="scenarioSuccess" class="dialogue-row player-row">
                <div class="bubble-wrap">
                  <div class="actor-name player">You (冒险家)</div>
                  <div class="dialogue-bubble player-bubble">
                    {{ playerSentence }}
                  </div>
                </div>
                <div class="actor-avatar player">🧙‍♂️</div>
              </div>

              <!-- NPC 欣喜反馈气泡 -->
              <div v-if="scenarioSuccess" class="dialogue-row npc-row feedback-row">
                <div class="actor-avatar">{{ currentSlang.scenario.npcAvatar }}</div>
                <div class="bubble-wrap">
                  <div class="actor-name">{{ currentSlang.scenario.npcName }}</div>
                  <div class="dialogue-bubble npc-bubble success-bubble">
                    {{ currentSlang.scenario.npcSuccessReply }}
                  </div>
                </div>
              </div>
            </div>

            <!-- 输入实战区 (未完成时显示) -->
            <div v-if="!scenarioSuccess" class="interaction-tray">
              <div class="tray-tip">
                💡 <strong>提示：</strong>运用刚学的俚语 <code>{{ currentSlang.phrase }}</code> 回复对方：
                <span class="hint-text">"{{ currentSlang.scenario.expectedHint }}"</span>
              </div>

              <form class="scenario-input-form" @submit.prevent="submitScenarioReply">
                <input
                  ref="scenarioInputRef"
                  v-model="playerSentence"
                  type="text"
                  class="scenario-text-input"
                  :placeholder="`用英文打字回复...（记得带上 ${currentSlang.phrase}）`"
                  autocomplete="off"
                />
                <button
                  type="submit"
                  class="btn-submit-reply"
                  :disabled="!playerSentence.trim() || isSubmitting"
                >
                  ⚡ 回 复 (SEND)
                </button>
              </form>

              <!-- 判定反馈提示条 -->
              <Transition name="fade">
                <div v-if="scenarioFeedback" class="feedback-banner" :class="scenarioFeedback.type">
                  {{ scenarioFeedback.text }}
                </div>
              </Transition>
            </div>

            <!-- 通关奖励与流转卡 (成功后显示) -->
            <div v-else class="success-congrats-card">
              <div class="congrats-content">
                <div class="congrats-title">🎉 地道运用达成！Slang Mastered!</div>
                <div class="congrats-reward">+15 🪙 金币已入账 · 该句已收藏至地道表达本</div>
              </div>
              <div class="congrats-buttons">
                <button class="btn-again" @click="resetScenario">🔄 再练一次</button>
                <button class="btn-next-slang" @click="goToNextSlang">
                  ➜ 挑战下一个俚语 (NEXT)
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 视图 4: 我的地道表达本 (NOTEBOOK) -->
        <div v-else-if="currentView === 'NOTEBOOK'" class="view-container notebook-view">
          <div v-if="masteredList.length === 0" class="empty-notebook">
            <span class="empty-icon">📭</span>
            <h3>地道表达本空空如也</h3>
            <p>在“情景实战”中成功运用俚语交流，你的精彩英文句子将自动收录在这里！</p>
            <button class="btn-goto-index" @click="currentView = 'INDEX'">前往挑选手册 ➜</button>
          </div>

          <div v-else class="notebook-grid">
            <div
              v-for="item in masteredList"
              :key="item.id"
              class="notebook-entry"
            >
              <div class="entry-head">
                <span class="entry-phrase">{{ item.phrase }}</span>
                <span class="entry-time">{{ item.masteredAt }} 精通</span>
              </div>
              <div class="entry-meaning">{{ item.actual_mean }}</div>
              <div class="entry-quote">
                <span class="quote-lbl">你的精彩回复：</span>
                <span class="quote-text">"{{ item.userSentence }}"</span>
              </div>
              <div class="entry-actions">
                <button class="btn-review-card" @click="openSlang(item)">查看典故</button>
                <button class="btn-re-roleplay" @click="startScenario(item)">重回情景</button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, watch } from 'vue'
import { SLANG_CATEGORIES, SLANG_DATABASE } from './slangData.js'
import {
  getSlangProgress,
  markSlangLearning,
  markSlangMastered,
  getMasteredCount,
  judgeSlangInput
} from './slangJudgeService.js'
import { playWordAudio } from './dictService.js'

const props = defineProps({
  visible: { type: Boolean, default: false }
})

const emit = defineEmits(['close', 'reward'])

// 视图状态: 'INDEX' | 'LEARN' | 'SCENARIO' | 'NOTEBOOK'
const currentView = ref('INDEX')
const selectedCategory = ref('ALL')
const currentSlang = ref(null)

// 响应式进度字典
const progressMap = ref(getSlangProgress())
const masteredCount = computed(() => Object.values(progressMap.value).filter(p => p.status === 'MASTERED').length)
const totalSlangs = computed(() => SLANG_DATABASE.length)

// 筛选后的列表
const filteredSlangs = computed(() => {
  if (selectedCategory.value === 'ALL') return SLANG_DATABASE
  return SLANG_DATABASE.filter(item => item.category === selectedCategory.value)
})

// 表达本列表
const masteredList = computed(() => {
  const result = []
  for (const item of SLANG_DATABASE) {
    const prog = progressMap.value[item.id]
    if (prog && prog.status === 'MASTERED') {
      result.push({
        ...item,
        userSentence: prog.userSentence,
        masteredAt: prog.masteredAt || '已掌握'
      })
    }
  }
  return result
})

function isMastered(id) {
  return progressMap.value[id]?.status === 'MASTERED'
}

function isLearning(id) {
  return progressMap.value[id]?.status === 'LEARNING'
}

function switchView(view) {
  currentView.value = view
}

function openSlang(item) {
  currentSlang.value = item
  markSlangLearning(item.id)
  progressMap.value = getSlangProgress()
  currentView.value = 'LEARN'
}

// 朗读发音 (方案 A 有道真人原声)
function playSlangAudio() {
  if (!currentSlang.value) return
  // 使用俚语的核心词或原短语发音
  playWordAudio(currentSlang.value.phrase, 'us')
}

// ─── 实战情景交互 ────────────────────────────────────────────────────────────
const playerSentence = ref('')
const isSubmitting = ref(false)
const scenarioFeedback = ref(null)
const scenarioSuccess = ref(false)
const scenarioInputRef = ref(null)

function startScenario(item) {
  currentSlang.value = item
  currentView.value = 'SCENARIO'
  resetScenario()
}

function resetScenario() {
  playerSentence.value = ''
  scenarioFeedback.value = null
  scenarioSuccess.value = false
  isSubmitting.value = false
  nextTick(() => {
    scenarioInputRef.value?.focus()
  })
}

function submitScenarioReply() {
  if (!currentSlang.value || !playerSentence.value.trim()) return

  isSubmitting.value = true
  scenarioFeedback.value = null

  const result = judgeSlangInput(currentSlang.value, playerSentence.value)

  if (result.passed) {
    scenarioSuccess.value = true
    scenarioFeedback.value = { text: result.message, type: 'success' }
    // 标记精通并保存句子
    markSlangMastered(currentSlang.value.id, playerSentence.value.trim())
    progressMap.value = getSlangProgress()
    emit('reward', 15)
  } else {
    scenarioFeedback.value = { text: result.message, type: 'error' }
  }
  isSubmitting.value = false
}

// 快速跳转至下一个俚语实战
function goToNextSlang() {
  if (!currentSlang.value) return
  const currentIndex = SLANG_DATABASE.findIndex(s => s.id === currentSlang.value.id)
  const nextIndex = (currentIndex + 1) % SLANG_DATABASE.length
  openSlang(SLANG_DATABASE[nextIndex])
}

function handleClose() {
  emit('close')
}

watch(() => props.visible, (val) => {
  if (val) {
    progressMap.value = getSlangProgress()
    if (!currentSlang.value && SLANG_DATABASE.length > 0) {
      currentSlang.value = SLANG_DATABASE[0]
    }
  }
})
</script>

<style scoped>
.slang-overlay {
  position: fixed;
  inset: 0;
  background: rgba(5, 7, 18, 0.82);
  backdrop-filter: blur(12px);
  z-index: 2500;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.slang-modal-container {
  background: linear-gradient(145deg, #131929, #0a0e1a);
  border: 1.5px solid rgba(148, 163, 184, 0.22);
  border-radius: 20px;
  width: 920px;
  max-width: 95vw;
  height: 640px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.75), 0 0 45px rgba(245, 158, 11, 0.12);
  overflow: hidden;
  animation: modalPop 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes modalPop {
  0% { transform: scale(0.92); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

/* 顶部导航 */
.slang-header {
  padding: 16px 24px;
  background: rgba(15, 23, 42, 0.7);
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

.lounge-icon {
  font-size: 30px;
  filter: drop-shadow(0 2px 8px rgba(245, 158, 11, 0.4));
}

.lounge-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.lounge-title {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  color: #f8fafc;
}

.mastery-pill {
  font-size: 11px;
  font-weight: 700;
  background: rgba(245, 158, 11, 0.18);
  color: #fbbf24;
  border: 1px solid rgba(245, 158, 11, 0.35);
  padding: 2px 8px;
  border-radius: 12px;
}

.lounge-subtitle {
  margin: 3px 0 0;
  font-size: 11px;
  color: #94a3b8;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 14px;
}

.mode-tabs {
  display: flex;
  background: rgba(0, 0, 0, 0.3);
  padding: 3px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.tab-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 12px;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 7px;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn:hover:not(:disabled) {
  color: #fff;
}

.tab-btn.active {
  background: #3b82f6;
  color: #fff;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
}

.tab-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.close-icon-btn {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #94a3b8;
  font-size: 16px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s;
}

.close-icon-btn:hover {
  background: rgba(239, 68, 68, 0.25);
  color: #f87171;
}

/* 视图主容器 */
.view-container {
  flex: 1;
  padding: 20px 24px;
  overflow-y: auto;
}

/* ─── 视图 1: 俚语手册目录 (INDEX) ────────────────────────────────────────── */
.category-filter-row {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
}

.cat-chip {
  background: rgba(30, 41, 59, 0.5);
  border: 1px solid rgba(148, 163, 184, 0.18);
  color: #94a3b8;
  font-size: 12px;
  font-weight: 600;
  padding: 6px 14px;
  border-radius: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}

.cat-chip:hover {
  border-color: #60a5fa;
  color: #fff;
}

.cat-chip.active {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(30, 41, 59, 0.9));
  border-color: #3b82f6;
  color: #60a5fa;
}

.slang-cards-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}

.slang-item-card {
  background: rgba(30, 41, 59, 0.45);
  border: 1px solid rgba(148, 163, 184, 0.15);
  border-radius: 12px;
  padding: 14px 16px;
  cursor: pointer;
  transition: all 0.22s;
  display: flex;
  flex-direction: column;
}

.slang-item-card:hover {
  background: rgba(30, 41, 59, 0.75);
  border-color: #38bdf8;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
}

.slang-item-card.is-mastered {
  border-color: rgba(245, 158, 11, 0.45);
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(30, 41, 59, 0.6));
}

.item-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.item-phrase {
  font-size: 15px;
  font-weight: 800;
  color: #f1f5f9;
}

.status-badge {
  font-size: 10px;
  padding: 2px 7px;
  border-radius: 8px;
  font-weight: 700;
}
.status-badge.mastered { background: rgba(245, 158, 11, 0.2); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.4); }
.status-badge.learning { background: rgba(56, 189, 248, 0.2); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.4); }
.status-badge.new      { background: rgba(148, 163, 184, 0.15); color: #94a3b8; }

.item-meaning {
  font-size: 12px;
  line-height: 1.5;
  margin-bottom: 12px;
}

.item-meaning .lbl { color: #64748b; margin-right: 4px; }
.item-meaning .literal { color: #94a3b8; }
.item-meaning .actual  { color: #38bdf8; font-weight: 600; margin-top: 2px; }

.item-footer {
  margin-top: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.item-scenario-hint {
  font-size: 11px;
  color: #64748b;
}

.btn-card-action {
  background: rgba(59, 130, 246, 0.15);
  border: 1px solid rgba(59, 130, 246, 0.4);
  color: #93c5fd;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-card-action:hover {
  background: #3b82f6;
  color: #fff;
}

/* ─── 视图 2: 典故卡片与趣味故事 (LEARN) ─────────────────────────────────── */
.learn-hero-card {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.15);
  border-radius: 16px;
  padding: 24px;
}

.hero-top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.btn-back {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 12px;
  cursor: pointer;
}
.btn-back:hover { color: #fff; }

.pronounce-tag {
  font-size: 13px;
  color: #c084fc;
  font-family: monospace;
}

.btn-audio-speak {
  background: rgba(168, 85, 247, 0.15);
  border: 1px solid rgba(168, 85, 247, 0.35);
  color: #d8b4fe;
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 14px;
  cursor: pointer;
}
.btn-audio-speak:hover { background: #9333ea; color: #fff; }

.hero-phrase {
  font-size: 32px;
  font-weight: 900;
  text-align: center;
  color: #f8fafc;
  margin: 0 0 20px;
  letter-spacing: 0.5px;
}

.meaning-compare-board {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.compare-card {
  flex: 1;
  background: rgba(30, 41, 59, 0.5);
  border-radius: 12px;
  padding: 14px 16px;
}
.compare-card.literal { border: 1px solid rgba(239, 68, 68, 0.3); }
.compare-card.actual  { border: 1.5px solid rgba(16, 185, 129, 0.4); background: rgba(6, 78, 59, 0.2); }

.cmp-title { font-size: 11px; font-weight: 700; margin-bottom: 6px; }
.compare-card.literal .cmp-title { color: #f87171; }
.compare-card.actual .cmp-title  { color: #34d399; }

.cmp-text { font-size: 16px; font-weight: 800; color: #f8fafc; margin-bottom: 4px; }
.cmp-sub  { font-size: 11px; color: #64748b; }

.compare-arrow { font-size: 20px; color: #475569; }

.origin-story-box {
  background: rgba(30, 41, 59, 0.4);
  border-left: 3px solid #f59e0b;
  border-radius: 4px 8px 8px 4px;
  padding: 12px 16px;
  margin-bottom: 16px;
}

.story-title { font-size: 12px; font-weight: 700; color: #fbbf24; margin-bottom: 6px; }
.story-content { font-size: 13px; color: #cbd5e1; line-height: 1.6; margin: 0; }

.example-box {
  background: rgba(0, 0, 0, 0.25);
  border-radius: 8px;
  padding: 10px 14px;
  margin-bottom: 24px;
}
.ex-en { font-size: 13px; font-weight: 600; color: #38bdf8; font-style: italic; }
.ex-cn { font-size: 12px; color: #94a3b8; margin-top: 3px; }

.learn-actions-row {
  display: flex;
  justify-content: center;
}

.btn-goto-scenario {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  border: 1px solid #fde68a;
  color: #0f172a;
  font-size: 14px;
  font-weight: 800;
  padding: 12px 32px;
  border-radius: 25px;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(245, 158, 11, 0.4);
  transition: all 0.2s;
}
.btn-goto-scenario:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 22px rgba(245, 158, 11, 0.6);
}

/* ─── 视图 3: 沉浸情景对话实战 (SCENARIO) ────────────────────────────────── */
.scenario-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.scenario-header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.scenario-context-tag {
  font-size: 12px;
  color: #fbbf24;
  font-weight: 600;
}

.btn-back-link {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 11px;
  cursor: pointer;
}
.btn-back-link:hover { color: #fff; }

.dialogue-theater {
  flex: 1;
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 14px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  overflow-y: auto;
  margin-bottom: 14px;
}

.dialogue-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.actor-avatar {
  font-size: 28px;
  line-height: 1;
}

.bubble-wrap {
  display: flex;
  flex-direction: column;
  max-width: 80%;
}

.actor-name {
  font-size: 11px;
  font-weight: 700;
  color: #94a3b8;
  margin-bottom: 4px;
}
.actor-name.player { text-align: right; color: #60a5fa; }

.dialogue-bubble {
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 13px;
  line-height: 1.5;
}

.npc-bubble {
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(148, 163, 184, 0.2);
  color: #f1f5f9;
  border-top-left-radius: 2px;
}

.npc-bubble.success-bubble {
  background: rgba(6, 78, 59, 0.35);
  border-color: #10b981;
  color: #a7f3d0;
}

.player-row {
  justify-content: flex-end;
}

.player-bubble {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: #fff;
  border-top-right-radius: 2px;
}

.interaction-tray {
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(148, 163, 184, 0.15);
  border-radius: 12px;
  padding: 14px 16px;
}

.tray-tip {
  font-size: 12px;
  color: #94a3b8;
  margin-bottom: 10px;
}
.tray-tip code { color: #f59e0b; font-weight: 700; }
.hint-text { color: #64748b; font-style: italic; margin-left: 6px; }

.scenario-input-form {
  display: flex;
  gap: 10px;
}

.scenario-text-input {
  flex: 1;
  background: rgba(30, 41, 59, 0.8);
  border: 1.5px solid #475569;
  color: #fff;
  font-size: 13px;
  padding: 10px 14px;
  border-radius: 8px;
  outline: none;
}
.scenario-text-input:focus {
  border-color: #38bdf8;
  box-shadow: 0 0 10px rgba(56, 189, 248, 0.3);
}

.btn-submit-reply {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  border: none;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  padding: 0 20px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-submit-reply:hover:not(:disabled) {
  background: #2563eb;
  transform: translateY(-1px);
}
.btn-submit-reply:disabled { opacity: 0.4; cursor: not-allowed; }

.feedback-banner {
  margin-top: 10px;
  font-size: 12px;
  padding: 6px 12px;
  border-radius: 6px;
}
.feedback-banner.success { background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.4); }
.feedback-banner.error   { background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.4); }

.success-congrats-card {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(15, 23, 42, 0.9));
  border: 1.5px solid #10b981;
  border-radius: 12px;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.congrats-title { font-size: 14px; font-weight: 800; color: #34d399; }
.congrats-reward { font-size: 12px; color: #94a3b8; margin-top: 3px; }

.congrats-buttons {
  display: flex;
  gap: 10px;
}

.btn-again {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid #475569;
  color: #cbd5e1;
  font-size: 12px;
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
}
.btn-again:hover { color: #fff; background: rgba(255, 255, 255, 0.15); }

.btn-next-slang {
  background: linear-gradient(135deg, #10b981, #059669);
  border: 1px solid #6ee7b7;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  padding: 8px 20px;
  border-radius: 20px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.35);
}
.btn-next-slang:hover { transform: translateY(-1px); }

/* ─── 视图 4: 我的地道表达本 (NOTEBOOK) ─────────────────────────────────── */
.empty-notebook {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #94a3b8;
}

.empty-icon { font-size: 48px; margin-bottom: 12px; opacity: 0.6; }
.empty-notebook h3 { margin: 0 0 6px; color: #cbd5e1; font-size: 16px; }
.empty-notebook p  { margin: 0 0 18px; font-size: 12px; max-width: 320px; }

.btn-goto-index {
  background: #3b82f6;
  border: none;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  padding: 8px 20px;
  border-radius: 20px;
  cursor: pointer;
}

.notebook-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}

.notebook-entry {
  background: rgba(30, 41, 59, 0.45);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 12px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
}

.entry-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.entry-phrase { font-size: 15px; font-weight: 800; color: #fbbf24; }
.entry-time   { font-size: 10px; color: #64748b; }
.entry-meaning { font-size: 12px; color: #94a3b8; margin-bottom: 10px; }

.entry-quote {
  background: rgba(0, 0, 0, 0.25);
  border-radius: 8px;
  padding: 8px 10px;
  margin-bottom: 12px;
  font-size: 12px;
}
.quote-lbl  { color: #64748b; display: block; margin-bottom: 2px; font-size: 10px; }
.quote-text { color: #38bdf8; font-style: italic; }

.entry-actions {
  margin-top: auto;
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.btn-review-card, .btn-re-roleplay {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #cbd5e1;
  font-size: 11px;
  padding: 4px 10px;
  border-radius: 12px;
  cursor: pointer;
}
.btn-review-card:hover, .btn-re-roleplay:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
}

/* 过渡效果 */
.slang-pop-enter-active, .slang-pop-leave-active { transition: opacity 0.22s ease; }
.slang-pop-enter-from, .slang-pop-leave-to       { opacity: 0; }
</style>
