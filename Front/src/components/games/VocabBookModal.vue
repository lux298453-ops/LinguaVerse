<template>
  <Transition name="modal-fade">
    <div v-if="visible" class="vocab-modal-overlay" @click.self="handleClose">
      <div class="vocab-modal-box">
        <!-- 头部标题栏 -->
        <div class="modal-header">
          <div class="header-left">
            <span class="header-gem">📚</span>
            <div>
              <h2 class="modal-title">灵语藏书阁 · 词书目标管理</h2>
              <p class="modal-subtitle">选择你的攻坚词书，小游戏题库与结算复盘将针对性强化</p>
            </div>
          </div>
          <button class="modal-close-btn" @click="handleClose" title="关闭">✕</button>
        </div>

        <!-- 词书卡片网格 -->
        <div class="books-grid">
          <div
            v-for="book in VOCAB_BOOKS"
            :key="book.id"
            class="book-card"
            :class="{ active: currentBookId === book.id }"
            @click="selectBook(book.id)"
          >
            <div class="card-glow" />
            <div class="book-badge" v-if="currentBookId === book.id">
              ✓ 当前修习
            </div>
            
            <div class="book-top">
              <span class="book-icon">{{ book.icon }}</span>
              <div class="book-meta">
                <h3 class="book-name">{{ book.name }}</h3>
                <span class="book-tag" :class="book.id.toLowerCase()">
                  {{ book.tag ? book.tag : '全科通识' }}
                </span>
              </div>
            </div>

            <p class="book-desc">{{ book.desc }}</p>

            <div class="book-footer">
              <div class="stat-col">
                <span class="stat-label">收录词量</span>
                <span class="stat-val">{{ getBookWordCount(book.id) }} 词</span>
              </div>
              <button
                class="btn-select"
                :class="{ 'btn-selected': currentBookId === book.id }"
                @click.stop="selectBook(book.id)"
              >
                {{ currentBookId === book.id ? '当前修习中' : '设为主修' }}
              </button>
            </div>
          </div>
        </div>

        <!-- 底部快捷操作与提示 -->
        <div class="modal-footer">
          <div class="footer-tip">
            💡 提示：在 <strong>Type Rush</strong> 与 <strong>Word Chain</strong> 准备界面中，也可单局即时切换词书！
          </div>
          <button class="btn-confirm" @click="handleClose">
            确 定 (DONE)
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { computed } from 'vue'
import { VOCAB_BOOKS, getCurrentBookId, setCurrentBookId, getBookWordCount } from './dictService.js'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'change'])

const currentBookId = computed(() => getCurrentBookId())

function selectBook(bookId) {
  setCurrentBookId(bookId)
  emit('change', bookId)
}

function handleClose() {
  emit('close')
}
</script>

<style scoped>
.vocab-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(4, 7, 18, 0.78);
  backdrop-filter: blur(10px);
  z-index: 2500;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.vocab-modal-box {
  background: linear-gradient(145deg, #101828, #0b101c);
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 20px;
  width: 820px;
  max-width: 95vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.65), 0 0 40px rgba(99, 102, 241, 0.15);
  overflow: hidden;
  animation: boxPop 0.28s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes boxPop {
  0% { transform: scale(0.92); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

.modal-header {
  padding: 20px 24px;
  background: rgba(15, 23, 42, 0.6);
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

.header-gem {
  font-size: 32px;
  filter: drop-shadow(0 2px 8px rgba(251, 191, 36, 0.4));
}

.modal-title {
  margin: 0;
  font-size: 19px;
  font-weight: 800;
  color: #f8fafc;
  letter-spacing: 0.5px;
}

.modal-subtitle {
  margin: 3px 0 0;
  font-size: 12px;
  color: #94a3b8;
}

.modal-close-btn {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #94a3b8;
  font-size: 16px;
  width: 34px;
  height: 34px;
  border-radius: 50%;
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

/* 词书卡片网格 */
.books-grid {
  padding: 22px 24px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  overflow-y: auto;
}

@media (max-width: 640px) {
  .books-grid {
    grid-template-columns: 1fr;
  }
}

.book-card {
  position: relative;
  background: rgba(30, 41, 59, 0.45);
  border: 1.5px solid rgba(148, 163, 184, 0.14);
  border-radius: 14px;
  padding: 16px 18px;
  cursor: pointer;
  transition: all 0.24s cubic-bezier(0.16, 1, 0.3, 1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.book-card:hover {
  border-color: rgba(99, 102, 241, 0.5);
  background: rgba(30, 41, 59, 0.7);
  transform: translateY(-2px);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.35);
}

.book-card.active {
  border-color: #6366f1;
  background: linear-gradient(135deg, rgba(79, 70, 229, 0.18), rgba(30, 41, 59, 0.8));
  box-shadow: 0 0 20px rgba(99, 102, 241, 0.35);
}

.book-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  background: linear-gradient(135deg, #10b981, #059669);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 12px;
  box-shadow: 0 2px 6px rgba(16, 185, 129, 0.4);
}

.book-top {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.book-icon {
  font-size: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.book-meta {
  flex: 1;
}

.book-name {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: #f1f5f9;
}

.book-tag {
  display: inline-block;
  margin-top: 3px;
  font-size: 10px;
  padding: 1px 7px;
  border-radius: 8px;
  background: rgba(148, 163, 184, 0.15);
  color: #94a3b8;
  font-weight: 600;
}

.book-tag.gaokao { background: rgba(34, 197, 94, 0.18); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.3); }
.book-tag.cet4 { background: rgba(234, 179, 8, 0.18); color: #facc15; border: 1px solid rgba(234, 179, 8, 0.3); }
.book-tag.cet6 { background: rgba(239, 68, 68, 0.18); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); }
.book-tag.ielts { background: rgba(168, 85, 247, 0.18); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.3); }
.book-tag.fantasy { background: rgba(236, 72, 153, 0.18); color: #f472b6; border: 1px solid rgba(236, 72, 153, 0.3); }
.book-tag.all { background: rgba(56, 189, 248, 0.18); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); }

.book-desc {
  margin: 0 0 14px;
  font-size: 12px;
  color: #94a3b8;
  line-height: 1.5;
  min-height: 36px;
}

.book-footer {
  margin-top: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.stat-col {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 10px;
  color: #64748b;
  text-transform: uppercase;
}

.stat-val {
  font-size: 13px;
  font-weight: 700;
  color: #e2e8f0;
}

.btn-select {
  background: rgba(99, 102, 241, 0.15);
  border: 1px solid rgba(99, 102, 241, 0.4);
  color: #a5b4fc;
  font-size: 12px;
  font-weight: 600;
  padding: 5px 14px;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-select:hover {
  background: #6366f1;
  color: #fff;
  border-color: #6366f1;
}

.btn-selected {
  background: rgba(16, 185, 129, 0.2);
  border-color: rgba(16, 185, 129, 0.5);
  color: #34d399;
}

.btn-selected:hover {
  background: #10b981;
  color: #fff;
  border-color: #10b981;
}

/* 底部操作区 */
.modal-footer {
  padding: 16px 24px;
  background: rgba(15, 23, 42, 0.8);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.footer-tip {
  font-size: 12px;
  color: #94a3b8;
}

.footer-tip strong {
  color: #f1f5f9;
}

.btn-confirm {
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  border: 1px solid #818cf8;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  padding: 8px 24px;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 14px rgba(79, 70, 229, 0.4);
}

.btn-confirm:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(79, 70, 229, 0.6);
}

/* 过渡动效 */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.24s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
