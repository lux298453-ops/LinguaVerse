<template>
  <div class="world-page">
    <!-- 游戏画布挂载点 -->
    <div ref="gameContainer" class="game-canvas" />

    <!-- 空间聊天与动作轮盘（悬浮在画布底部，与 NPC 对话互斥） -->
    <div v-show="!npcDialogVisible" class="chat-bar" :class="{ active: chatFocused }">
      <button
        class="action-wheel-trigger-btn"
        title="打开动作与表情轮盘 (快捷键 E)"
        @click="actionWheelVisible = !actionWheelVisible"
      >
        🎭
      </button>
      <el-input
        ref="chatInputRef"
        v-model="chatInput"
        :placeholder="'Press Enter to chat · 按 E 唤起动作表情'"
        size="small"
        @focus="chatFocused = true"
        @blur="chatFocused = false"
        @keydown.enter.exact.prevent="sendChat"
        @keydown.esc="blurChatInput"
        @keydown.stop
        clearable
      />
      <button
        class="chat-send-btn"
        :disabled="!chatInput.trim()"
        @click="sendChat"
        title="发送 (Enter)"
      >
        <span class="send-icon">🚀</span>
        <span class="send-text">发送</span>
      </button>
    </div>

    <!-- NPC 对话框 -->
    <NpcDialogue
      ref="npcDialogRef"
      :visible="npcDialogVisible"
      :npc-name="currentNpc?.npcName || 'NPC'"
      :reward-coins="10"
      @close="closeNpcDialog"
      @reply="handlePlayerReply"
    />

    <!-- 奇幻游戏区小游戏：Type Rush 单词竞速 -->
    <TypeRush
      :visible="minigameVisible && (!currentMinigame?.gameType || currentMinigame?.gameType === 'TYPE_RUSH')"
      :game-info="currentMinigame"
      @close="closeMinigame"
      @reward="handleMinigameReward"
    />

    <!-- 奇幻游戏区小游戏：Word Chain 灵语连环对决 -->
    <WordChain
      :visible="minigameVisible && currentMinigame?.gameType === 'WORD_CHAIN'"
      :game-info="currentMinigame"
      @close="closeMinigame"
      @reward="handleMinigameReward"
    />

    <!-- 玩家交互资料卡 -->
    <PlayerCard
      :visible="playerCardVisible"
      :player="selectedPlayer"
      @close="closePlayerCard"
      @private-chat="handlePlayerPrivateChat"
      @greet="handlePlayerGreet"
      @like="handlePlayerLike"
    />

    <!-- 快捷动作/表情轮盘 -->
    <ActionWheel
      :visible="actionWheelVisible"
      @close="actionWheelVisible = false"
      @select="handleSelectAction"
    />

    <!-- 游戏级小地图罗盘框体（右下角）-->
    <div class="minimap-frame">
      <div class="minimap-header">
        <span class="minimap-compass-n">N</span>
        <span class="minimap-tag">MAP</span>
      </div>
      <div class="minimap-body">
        <div class="minimap-radar-grid" />
        <div
          class="minimap-player"
          :style="{ left: minimapX + 'px', top: minimapY + 'px' }"
        >
          <div class="player-dot-core" />
          <div class="player-dot-pulse" />
        </div>
      </div>
    </div>

    <!-- 洛克王国风格顶部场景标题 -->
    <div class="scene-header-card">
      <div class="scene-title">{{ currentMapName }}</div>
      <div class="scene-subtitle">{{ currentMapSubtitle }}</div>
    </div>

    <!-- 📜 HUD 微型任务追踪栏 (左上角) -->
    <div
      v-if="currentTrackedQuest"
      class="quest-hud-tracker"
      :class="{ collapsed: hudCollapsed }"
    >
      <div class="hud-tracker-header" @click="questModalVisible = true">
        <span class="hud-tag-badge" :class="currentTrackedQuest.category ? currentTrackedQuest.category.toLowerCase() : 'main'">
          {{ currentTrackedQuest.category === 'MAIN' ? '主线' : '学者' }}
        </span>
        <span class="hud-title-text">{{ currentTrackedQuest.title }}</span>
        <button
          class="hud-toggle-btn"
          @click.stop="hudCollapsed = !hudCollapsed"
          :title="hudCollapsed ? '展开任务追踪' : '收起任务追踪'"
        >
          {{ hudCollapsed ? '▾' : '▴' }}
        </button>
      </div>

      <div v-show="!hudCollapsed" class="hud-tracker-body" @click="questModalVisible = true">
        <div class="hud-step-row">
          <span class="hud-step-icon" :class="{ done: currentTrackedQuest.status === 'COMPLETED' }">
            {{ currentTrackedQuest.status === 'COMPLETED' ? '✓' : '▶' }}
          </span>
          <span class="hud-step-desc">{{ currentTrackedQuest.currentStepDesc }}</span>
        </div>
        <div class="hud-footer-row">
          <span class="hud-reward-pill">+{{ currentTrackedQuest.rewardCoins }} 🪙</span>
          <span class="hud-journal-key">按 J 委托书</span>
        </div>
      </div>
    </div>

    <!-- 顶部右侧状态与快捷功能栏 (Game Action Dock) -->
    <div class="top-right-bar">
      <!-- 🪙 玩家持有金币数 -->
      <div class="top-action-btn player-coins-badge" title="当前持有星语金币">
        <span class="coins-icon">🪙</span>
        <span class="coins-count">{{ playerCoins }}</span>
      </div>

      <!-- 📜 冒险委托书入口 -->
      <button class="top-action-btn quest-log-btn" @click="questModalVisible = true" title="冒险委托书 (快捷键 J)">
        <span class="action-icon">📜</span>
        <span class="action-text">任务</span>
        <span v-if="activeQuestCount > 0" class="quest-count-badge">{{ activeQuestCount }}</span>
      </button>

      <!-- 📚 当前修习词书选择徽章 -->
      <button class="top-action-btn vocab-book-btn" @click="vocabBookModalVisible = true" :title="'当前词书: ' + currentActiveBook.name + ' (点击切换)'">
        <span class="vocab-btn-icon">{{ currentActiveBook.icon }}</span>
        <span class="vocab-btn-text">{{ currentActiveBook.name.split(' ')[0] }}</span>
        <span class="vocab-btn-arrow">▾</span>
      </button>

      <!-- 🎭 地道俚语演练台入口 -->
      <button class="top-action-btn slang-lounge-btn" @click="slangModalVisible = true" title="灵语茶歇馆 · 俚语实战">
        <span class="slang-btn-icon">☕</span>
        <span class="slang-btn-text">俚语</span>
      </button>

      <!-- 在线人数 -->
      <div class="online-badge" title="当前世界在线探险家">
        <span class="pulse-dot" />
        <span>{{ onlineCount }} 在线</span>
      </div>

      <!-- 好友聊天按钮（带未读徽标） -->
      <el-badge
        :value="chatStore.unreadTotal"
        :hidden="chatStore.unreadTotal === 0"
        :max="99"
        class="chat-btn-badge"
      >
        <button class="top-action-btn chat-nav-btn" @click="goToChat" title="前往好友私聊">
          <span class="action-icon">💬</span>
          <span class="action-text">消息</span>
        </button>
      </el-badge>

      <!-- 返回主界面按钮 -->
      <button class="top-action-btn exit-world-btn" @click="exitWorld" title="返回主界面 (ESC)">
        <span class="action-icon">🚪</span>
        <span class="action-text">返回</span>
      </button>
    </div>

    <!-- 📜 冒险委托书与任务日志弹窗 -->
    <QuestLogModal
      :visible="questModalVisible"
      :quests="userQuests"
      :tracked-task-id="trackedTaskId"
      @close="questModalVisible = false"
      @set-track="handleSetTrack"
    />

    <!-- 📚 灵语藏书阁 · 词书目标管理弹窗 -->
    <VocabBookModal
      :visible="vocabBookModalVisible"
      @close="vocabBookModalVisible = false"
      @change="handleBookChanged"
    />

    <!-- ☕ 灵语茶歇馆 · 地道俚语演练台弹窗 -->
    <SlangLoungeModal
      :visible="slangModalVisible"
      @close="slangModalVisible = false"
      @reward="handleSlangReward"
    />

    <!-- 🌌 史诗游戏世界入场仪式加载门 -->
    <WorldLoadingScreen
      :real-progress="worldLoadingProgress"
      :is-ready="worldReady"
      @loaded="onWorldLoaded"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore }  from '../stores/user.js'
import { useChatStore }  from '../stores/chat.js'
import { createGame, destroyGame } from '../game/GameManager.js'
import { worldSocket }   from '../game/network/WorldSocket.js'
import NpcDialogue from '../components/NpcDialogue.vue'
import TypeRush from '../components/games/TypeRush.vue'
import WordChain from '../components/games/WordChain.vue'
import PlayerCard from '../components/PlayerCard.vue'
import ActionWheel from '../components/ActionWheel.vue'
import VocabBookModal from '../components/games/VocabBookModal.vue'
import SlangLoungeModal from '../components/games/SlangLoungeModal.vue'
import WorldLoadingScreen from '../components/WorldLoadingScreen.vue'
import QuestLogModal from '../components/world/QuestLogModal.vue'
import { getUserQuests, getPlayerInfo } from '../api/task.js'
import { getCurrentBook, getCurrentBookId } from '../components/games/dictService.js'
import { ElNotification } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()
const chatStore = useChatStore()

// 词书选择状态
const vocabBookModalVisible = ref(false)
const currentActiveBook = ref(getCurrentBook())

function handleBookChanged(bookId) {
  currentActiveBook.value = getCurrentBook()
  ElNotification({
    title: '📖 词书切换成功',
    message: `当前主修词书已切换为：${currentActiveBook.value.name}`,
    type: 'success',
    position: 'top-right',
    duration: 3500
  })
}

// 俚语茶歇馆状态
const slangModalVisible = ref(false)

function handleSlangReward(coins) {
  ElNotification({
    title: '✨ 俚语实战达标！',
    message: `恭喜你在情景对话中地道使用俚语，获得 +${coins} 🪙 金币奖励！`,
    type: 'success',
    position: 'top-right',
    duration: 4000
  })
}

// 任务体系与追踪状态
const questModalVisible = ref(false)
const userQuests = ref([])
const trackedTaskId = ref(null)
const playerCoins = ref(100)
const hudCollapsed = ref(false)

const currentTrackedQuest = computed(() => {
  if (!userQuests.value || userQuests.value.length === 0) return null
  if (trackedTaskId.value) {
    const found = userQuests.value.find(q => Number(q.taskId) === Number(trackedTaskId.value))
    if (found) return found
  }
  // 默认找第一个进行中的主线任务，或第一个非已完成的任务
  return userQuests.value.find(q => q.status !== 'COMPLETED' && !q.isLocked) || userQuests.value[0]
})

const activeQuestCount = computed(() => {
  return userQuests.value.filter(q => q.status !== 'COMPLETED' && !q.isLocked).length
})

async function fetchQuests() {
  try {
    const res = await getUserQuests()
    if (res) {
      userQuests.value = res
      // 如果当前没有追踪任务或当前追踪的任务已完成，寻找下一个有效任务
      if (!trackedTaskId.value || userQuests.value.find(q => Number(q.taskId) === Number(trackedTaskId.value))?.status === 'COMPLETED') {
        const nextActive = userQuests.value.find(q => q.status !== 'COMPLETED' && !q.isLocked)
        if (nextActive) {
          trackedTaskId.value = nextActive.taskId
        }
      }
    }
  } catch (err) {
    console.error('[World.vue] 加载任务列表失败:', err)
  }
}

async function fetchPlayerInfo() {
  try {
    const res = await getPlayerInfo()
    if (res?.coins !== undefined) {
      playerCoins.value = res.coins
    }
  } catch (err) {
    console.error('[World.vue] 加载玩家金币失败:', err)
  }
}

function handleSetTrack(quest) {
  trackedTaskId.value = quest.taskId
  ElNotification({
    title: '📍 目标已锁定',
    message: `当前追踪委托已切换为：【${quest.title}】`,
    type: 'success',
    position: 'top-right',
    duration: 3000
  })
}

// DOM refs
const gameContainer  = ref(null)
const npcDialogRef   = ref(null)
const chatInputRef   = ref(null)

// 聊天状态
const chatInput    = ref('')
const chatFocused  = ref(false)

// NPC 对话状态
const npcDialogVisible = ref(false)
const currentNpc       = ref(null)
const currentTaskId    = ref(null)
const currentNodeKey   = ref('')

// 奇幻游戏区小游戏状态
const minigameVisible  = ref(false)
const currentMinigame  = ref(null)

// 玩家交互资料卡状态
const playerCardVisible = ref(false)
const selectedPlayer    = ref(null)

// 快捷动作/表情轮盘状态
const actionWheelVisible = ref(false)

// 在线人数（从 PLAYER_JOIN / PLAYER_LEAVE 统计）
const onlineCount = ref(1)

// 地图场景信息
const currentMapName = ref('☀️ Sunshine Hall · 阳光大厅')
const currentMapSubtitle = ref('Welcome to LinguaVerse!')

// 小地图（地图 1000x600 → 小地图 120x72）
const MAP_W = 1000, MAP_H = 600, MINI_W = 120, MINI_H = 72
const minimapX = ref(MINI_W / 2)
const minimapY = ref(MINI_H / 2)

// 史诗入场加载门状态
const worldLoadingProgress = ref(0)
const worldReady = ref(false)

function onWorldLoaded() {
  console.log('[World.vue] 史诗加载门仪式完成，玩家已正式降临虚拟世界')
}

// Phaser 游戏实例
let game = null
let hallScene = null

// NPC 事件总线（注入到 Phaser）
const currentMapWidth = ref(1200)
const currentMapHeight = ref(800)

const npcDialogBus = {
  open(npcData) {
    console.log('[World.vue] 打开 NPC 对话框:', npcData)
    currentNpc.value     = npcData
    currentTaskId.value  = npcData.taskId
    npcDialogRef.value?.reset()
    npcDialogVisible.value = true
  },
  close() {
    npcDialogVisible.value = false
    currentNpc.value       = null
  },
  openMinigame(gameData) {
    console.log('[World.vue] 打开小游戏:', gameData)
    currentMinigame.value = gameData
    minigameVisible.value = true
  },
  closeMinigame() {
    minigameVisible.value = false
    currentMinigame.value = null
  },
  openPlayerCard(playerData) {
    console.log('[World.vue] 打开玩家资料卡:', playerData)
    selectedPlayer.value = playerData
    playerCardVisible.value = true
  },
  onChunk(msg) {
    console.log('[World.vue] 收到 NPC Chunk:', msg)
    npcDialogRef.value?.onChunk(msg)
  },
  onTaskResult(msg) {
    console.log('[World.vue] 收到 Task Result:', msg)
    if (msg.nextNode && msg.nextNode !== 'COMPLETE') {
      currentNodeKey.value = msg.nextNode
      npcDialogRef.value?.setNodeKey(msg.nextNode)
    }
    npcDialogRef.value?.onTaskResult(msg)

    // 任务达成处理与金币增加、主线链式推进
    if (msg.taskComplete) {
      if (msg.totalCoins !== undefined && msg.totalCoins !== null) {
        playerCoins.value = msg.totalCoins
      } else if (msg.rewardCoins) {
        playerCoins.value += msg.rewardCoins
      }

      ElNotification({
        title: '🎉 委托圆满达成！',
        message: `恭喜达成【${msg.taskTitle || '委托'}】，获得 +${msg.rewardCoins || 10} 🪙 金币奖励！`,
        type: 'success',
        position: 'top-right',
        duration: 5000
      })

      fetchQuests()

      // 主线闭环导流逻辑
      const completedTaskId = msg.taskId || currentTaskId.value
      if (completedTaskId === 1) {
        setTimeout(() => {
          ElNotification({
            title: '📜 主线新篇章开启',
            message: '请穿过阳光大厅右侧传送门进入奇幻游戏区，将口信传达给戴紫帽子的 Luna！',
            type: 'info',
            position: 'top-right',
            duration: 6000
          })
          trackedTaskId.value = 2
        }, 1200)
      } else if (completedTaskId === 2) {
        setTimeout(() => {
          ElNotification({
            title: '🏆 奇幻星语探险大捷',
            message: '你已圆满完成主线第一章【星语传信人】！所有委托报酬已入账，可前往探索更多学者研习。',
            type: 'success',
            position: 'top-right',
            duration: 7000
          })
        }, 1200)
      } else if (completedTaskId === 3) {
        setTimeout(() => {
          ElNotification({
            title: '⚗️ 词根工坊研习认证',
            message: '炼金学者 Tom 授予你【词根炼金学徒】称号！词根奥秘已刻印进你的知识库。',
            type: 'success',
            position: 'top-right',
            duration: 7000
          })
        }, 1200)
      }
    }
  },
  onPlayerInteract(msg) {
    console.log('[World.vue] 收到玩家定向互动通知:', msg)
    const senderName = msg.nickname || '有位冒险家'
    if (msg.action === 'GREET') {
      ElNotification({
        title: '👋 收到空间问候',
        message: `${senderName} 走到你身边向你挥手打了个招呼！`,
        type: 'info',
        position: 'top-right',
        duration: 5000
      })
    } else if (msg.action === 'LIKE') {
      ElNotification({
        title: '❤️ 收到点赞',
        message: `${senderName} 刚刚为你的形象点了个赞！`,
        type: 'success',
        position: 'top-right',
        duration: 5000
      })
    }
  },
  onMapChanged(mapConfig, mapW, mapH) {
    console.log('[World.vue] 地图切换:', mapConfig, mapW, mapH)
    currentMapName.value = mapConfig.name
    currentMapSubtitle.value = mapConfig.subtitle
    if (mapW && mapH) {
      currentMapWidth.value = mapW
      currentMapHeight.value = mapH
    }
  }
}

function getHallScene() {
  return hallScene || game?.scene?.getScene('HallScene') || window.__linguaverse_hall_scene
}

function blurChatInput() {
  chatInputRef.value?.blur?.()
}

function sendChat() {
  const content = chatInput.value.trim()
  if (content) {
    const scene = getHallScene()
    if (scene?.sendSpatialChat) {
      scene.sendSpatialChat(content)
    } else {
      worldSocket.sendSpatialChat(content)
    }
    chatInput.value = ''
  }
  // 发送后自动让输入框失焦，将键盘控制权立即交回给游戏角色
  blurChatInput()
}

function closeNpcDialog() {
  npcDialogVisible.value = false
  currentNpc.value = null
}

function closeMinigame() {
  minigameVisible.value = false
  currentMinigame.value = null
}

function handleMinigameReward({ coins, score, rank }) {
  ElNotification({
    title: '🏆 挑战大捷！',
    message: `评级：${rank} 级！获得得分 ${score} 分，奖励 +${coins} 枚金币！`,
    type: 'success',
    duration: 4000
  })
}

function closePlayerCard() {
  playerCardVisible.value = false
  selectedPlayer.value = null
}

function handlePlayerPrivateChat(player) {
  if (player?.userId) {
    chatStore.selectUser(player.userId)
    router.push('/chat')
  }
}

let lastInteractTime = 0

function handlePlayerGreet(player) {
  if (!player?.userId) return
  const now = Date.now()
  if (now - lastInteractTime < 1500) return
  lastInteractTime = now

  const scene = getHallScene()

  // 1. 本地立即播放挥手表情
  scene?.sendSpatialEmote?.('wave')

  // 2. 发送单一定向互动协议（服务端直接精准通知对方并广播）
  worldSocket.sendInteract(player.userId, 'GREET', 'wave', `Hello @${player.nickname}! 👋`)

  // 3. 本地轻量提示
  ElNotification({
    title: '👋 已打招呼',
    message: `你向 ${player.nickname} 挥了挥手！`,
    type: 'success',
    duration: 2500
  })

  // 4. 关闭名片
  closePlayerCard()
}

function handlePlayerLike(player) {
  if (!player?.userId) return
  const now = Date.now()
  if (now - lastInteractTime < 1500) return
  lastInteractTime = now

  const scene = getHallScene()

  // 1. 本地立即播放比心表情
  scene?.sendSpatialEmote?.('heart')

  // 2. 发送单一定向互动协议（服务端直接精准通知对方并广播）
  worldSocket.sendInteract(player.userId, 'LIKE', 'heart', `Sent love to @${player.nickname}! ❤️`)

  // 3. 本地轻量提示
  ElNotification({
    title: '❤️ 点赞成功',
    message: `你为 ${player.nickname} 点了个赞！`,
    type: 'success',
    duration: 2500
  })

  // 4. 关闭名片
  closePlayerCard()
}

function handleSelectAction(emoteKey) {
  const scene = getHallScene()
  if (scene?.sendSpatialEmote) {
    scene.sendSpatialEmote(emoteKey)
  } else {
    worldSocket.sendEmote(emoteKey)
  }
}

function handlePlayerReply({ content, nodeKey }) {
  worldSocket.sendNpcReply(currentTaskId.value, nodeKey, content)
}

function goToChat() {
  router.push('/chat')
}

function exitWorld() {
  router.push('/')
}

// 监听在线人数变化
let unsubs = []

onMounted(async () => {
  // 保持私聊 WebSocket 在线并拉取未读数
  chatStore.connect()
  chatStore.refreshUnread()

  // 等 DOM 完成渲染，确保 gameContainer 有实际尺寸
  await nextTick()

  const userData = {
    userId:   userStore.user?.id,
    nickname: userStore.user?.nickname || userStore.user?.username || 'Player',
    token:    userStore.token,
  }

  const loadingCallbacks = {
    onProgress: (p) => {
      worldLoadingProgress.value = p
    },
    onComplete: () => {
      worldLoadingProgress.value = 1
    },
    onReady: () => {
      worldReady.value = true
    }
  }

  game = createGame(gameContainer.value, userData, npcDialogBus, loadingCallbacks)
  hallScene = game.scene.getScene('HallScene')

  // 在线人数统计
  unsubs.push(worldSocket.on('PLAYER_JOIN',  () => onlineCount.value++))
  unsubs.push(worldSocket.on('PLAYER_LEAVE', () => onlineCount.value = Math.max(1, onlineCount.value - 1)))

  // 更新小地图玩家位置
  unsubs.push(worldSocket.on('PLAYER_UPDATE', (msg) => {
    if (msg.userId === userData.userId) {
      minimapX.value = Math.round((msg.x / currentMapWidth.value) * MINI_W)
      minimapY.value = Math.round((msg.y / currentMapHeight.value) * MINI_H)
    }
  }))

  // 全局点击监听：点击除聊天栏、NPC对话、小游戏、名片、动作轮盘外的任意区域（如游戏画布），自动让输入框失焦恢复移动
  const onPointerDown = (e) => {
    if (e.target.closest('.chat-bar') || e.target.closest('.npc-dialogue') || e.target.closest('.typerush-overlay') || e.target.closest('.wordchain-overlay') || e.target.closest('.player-card') || e.target.closest('.wheel-panel')) {
      return
    }
    const el = document.activeElement
    if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) {
      el.blur()
    }
  }
  window.addEventListener('pointerdown', onPointerDown)
  unsubs.push(() => window.removeEventListener('pointerdown', onPointerDown))

  // 全局快捷键：
  // 1. 按 E 开启/关闭动作表情轮盘
  // 2. 按 Enter 快速聚焦到底部聊天栏
  const onGlobalKeyDown = (e) => {
    const el = document.activeElement
    const isTyping = el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')

    if ((e.key === 'e' || e.key === 'E') && !isTyping && !npcDialogVisible.value && !minigameVisible.value && !playerCardVisible.value) {
      e.preventDefault()
      actionWheelVisible.value = !actionWheelVisible.value
      return
    }

    // 2. 按 J 开启/关闭冒险委托书
    if ((e.key === 'j' || e.key === 'J') && !isTyping && !npcDialogVisible.value && !minigameVisible.value && !playerCardVisible.value) {
      e.preventDefault()
      questModalVisible.value = !questModalVisible.value
      return
    }

    // 3. 按 Enter 快速聚焦到底部聊天栏
    if (e.key === 'Enter' && !npcDialogVisible.value && !minigameVisible.value && !chatFocused.value && !actionWheelVisible.value && !playerCardVisible.value) {
      if (!isTyping) {
        e.preventDefault()
        chatInputRef.value?.focus?.()
      }
    }
  }
  window.addEventListener('keydown', onGlobalKeyDown)
  unsubs.push(() => window.removeEventListener('keydown', onGlobalKeyDown))

  // 首次拉取用户任务列表与玩家世界属性（金币等）
  fetchQuests()
  fetchPlayerInfo()
})


onUnmounted(() => {
  unsubs.forEach(unsub => unsub())
  destroyGame()
})
</script>

<style scoped>
.world-page {
  position: fixed;
  inset: 0;
  background: #1a1a2e;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.game-canvas {
  flex: 1;
  position: relative;
  overflow: hidden;
}
/* 让 Phaser 的 canvas 绝对定位铺满容器，不要用 !important 覆盖 Phaser 的宽高 */
.game-canvas :deep(canvas) {
  display: block;
  position: absolute;
  top: 0;
  left: 0;
}

/* 游戏级底部聊天胶囊栏 */
.chat-bar {
  position: absolute;
  bottom: 22px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 10px;
  align-items: center;
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.85), rgba(11, 15, 25, 0.92));
  backdrop-filter: blur(14px);
  padding: 6px 8px 6px 14px;
  border-radius: 30px;
  border: 1.5px solid rgba(148, 163, 184, 0.25);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.55), 0 0 20px rgba(99, 102, 241, 0.12);
  width: 520px;
  max-width: calc(100vw - 40px);
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  z-index: 100;
}
.chat-bar.active {
  border-color: rgba(56, 189, 248, 0.6);
  box-shadow: 0 12px 35px rgba(0, 0, 0, 0.7), 0 0 25px rgba(56, 189, 248, 0.25);
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(15, 23, 42, 0.98));
}
.chat-bar .el-input { flex: 1; }
.chat-bar :deep(.el-input__wrapper) {
  background: transparent !important;
  box-shadow: none !important;
  border-radius: 16px;
  padding: 0 4px;
}
.chat-bar :deep(.el-input__inner) {
  color: #f8fafc;
  font-size: 13px;
  font-weight: 500;
}
.chat-bar :deep(.el-input__inner::placeholder) {
  color: #64748b;
  font-size: 12px;
}

.action-wheel-trigger-btn {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 50%;
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 17px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  color: #fff;
  flex-shrink: 0;
  outline: none;
}
.action-wheel-trigger-btn:hover {
  background: rgba(168, 85, 247, 0.45);
  border-color: #c084fc;
  transform: scale(1.1);
  box-shadow: 0 0 14px rgba(168, 85, 247, 0.5);
}
.action-wheel-trigger-btn:active {
  transform: scale(0.94);
}

/* 游戏原生风格聊天发送按键 */
.chat-send-btn {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border: 1px solid #60a5fa;
  border-radius: 20px;
  color: #fff;
  height: 34px;
  padding: 0 16px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 2px 10px rgba(37, 99, 235, 0.4);
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  flex-shrink: 0;
}
.chat-send-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.6);
}
.chat-send-btn:active:not(:disabled) {
  transform: scale(0.96);
}
.chat-send-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
  filter: grayscale(0.6);
  border-color: #475569;
}
.send-icon { font-size: 13px; }
.send-text { letter-spacing: 0.5px; }

/* 游戏级小地图罗盘框体 */
.minimap-frame {
  position: absolute;
  bottom: 22px;
  right: 20px;
  width: 136px;
  height: 88px;
  background: rgba(10, 15, 28, 0.88);
  backdrop-filter: blur(10px);
  border: 1.5px solid rgba(245, 158, 11, 0.45);
  border-radius: 12px;
  overflow: hidden;
  z-index: 100;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6), 0 0 15px rgba(245, 158, 11, 0.15);
  display: flex;
  flex-direction: column;
}

.minimap-header {
  height: 18px;
  background: linear-gradient(90deg, rgba(245, 158, 11, 0.25), transparent);
  border-bottom: 1px solid rgba(245, 158, 11, 0.25);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px;
}

.minimap-compass-n {
  font-size: 9px;
  font-weight: 900;
  color: #f59e0b;
  font-family: monospace;
}

.minimap-tag {
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 1px;
  color: #94a3b8;
}

.minimap-body {
  flex: 1;
  position: relative;
  background: radial-gradient(circle at center, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.95) 100%);
  overflow: hidden;
}

.minimap-radar-grid {
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
  background-size: 16px 16px;
  pointer-events: none;
}

.minimap-player {
  position: absolute;
  width: 14px;
  height: 14px;
  transform: translate(-50%, -50%);
  transition: left 0.1s, top 0.1s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.player-dot-core {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #38bdf8;
  box-shadow: 0 0 6px #38bdf8;
  z-index: 2;
}

.player-dot-pulse {
  position: absolute;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: rgba(56, 189, 248, 0.35);
  animation: radarPulse 1.8s infinite ease-out;
  z-index: 1;
}

@keyframes radarPulse {
  0% { transform: scale(0.6); opacity: 0.9; }
  100% { transform: scale(1.6); opacity: 0; }
}

/* 顶部右侧状态与快捷功能栏 (Game Action Dock) */
.top-right-bar {
  position: absolute;
  top: 18px;
  right: 22px;
  display: flex;
  align-items: center;
  gap: 10px;
  z-index: 100;
  background: rgba(13, 17, 28, 0.7);
  backdrop-filter: blur(12px);
  padding: 4px 6px 4px 10px;
  border-radius: 26px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.online-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #94a3b8;
  font-size: 11px;
  font-weight: 600;
  padding: 0 8px 0 2px;
  user-select: none;
}

.pulse-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 8px #10b981;
  display: inline-block;
}

.chat-btn-badge :deep(.el-badge__content) {
  background-color: #ef4444;
  border: none;
  font-weight: bold;
}

.top-action-btn {
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.2);
  color: #e2e8f0;
  font-size: 12px;
  font-weight: 600;
  padding: 5px 12px;
  height: 32px;
  border-radius: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.top-action-btn:hover {
  background: rgba(51, 65, 85, 0.85);
  border-color: #60a5fa;
  color: #fff;
  transform: translateY(-1px);
}
.top-action-btn:active {
  transform: scale(0.96);
}

.vocab-book-btn {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(30, 41, 59, 0.8));
  border-color: rgba(129, 140, 248, 0.4);
  color: #c7d2fe;
}
.vocab-book-btn:hover {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.4), rgba(79, 70, 229, 0.9));
  border-color: #a5b4fc;
  color: #fff;
  box-shadow: 0 0 14px rgba(99, 102, 241, 0.35);
}
.vocab-btn-icon { font-size: 13px; }
.vocab-btn-text { font-size: 11px; font-weight: 700; }
.vocab-btn-arrow { font-size: 10px; opacity: 0.6; }

.slang-lounge-btn {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(30, 41, 59, 0.8));
  border-color: rgba(245, 158, 11, 0.4);
  color: #fde68a;
}
.slang-lounge-btn:hover {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.4), rgba(217, 119, 6, 0.9));
  border-color: #fbbf24;
  color: #fff;
  box-shadow: 0 0 14px rgba(245, 158, 11, 0.4);
}
.slang-btn-icon { font-size: 13px; }
.slang-btn-text { font-size: 11px; font-weight: 700; }

.chat-nav-btn:hover {
  border-color: #818cf8;
  background: rgba(99, 102, 241, 0.3);
}

.exit-world-btn {
  border-color: rgba(239, 68, 68, 0.3);
  color: #fca5a5;
}
.exit-world-btn:hover {
  background: rgba(239, 68, 68, 0.25);
  border-color: #f87171;
  color: #fff;
}

.action-icon { font-size: 12px; }
.action-text { font-size: 11px; }

/* 洛克王国风格顶部场景卡片 */
.scene-header-card {
  position: absolute;
  top: 18px;
  left: 22px;
  background: rgba(13, 17, 28, 0.82);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 12px;
  padding: 8px 18px;
  color: #fff;
  pointer-events: none;
  z-index: 10;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.4), 0 0 16px rgba(251, 191, 36, 0.1);
}
.scene-title {
  font-size: 14px;
  font-weight: 800;
  letter-spacing: 0.5px;
  color: #fbbf24;
}
.scene-subtitle {
  font-size: 10px;
  color: #94a3b8;
  margin-top: 2px;
}

/* 🪙 玩家持有金币数徽章 */
.player-coins-badge {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.18), rgba(30, 41, 59, 0.8));
  border-color: rgba(245, 158, 11, 0.4);
  color: #fde68a;
  cursor: default;
}
.player-coins-badge .coins-icon { font-size: 13px; }
.player-coins-badge .coins-count { font-size: 12px; font-weight: 700; color: #fbbf24; }

/* 📜 冒险委托书按钮 */
.quest-log-btn {
  position: relative;
  background: linear-gradient(135deg, rgba(217, 119, 6, 0.2), rgba(30, 41, 59, 0.8));
  border-color: rgba(245, 158, 11, 0.35);
  color: #fde68a;
}
.quest-log-btn:hover {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.35), rgba(217, 119, 6, 0.8));
  border-color: #fbbf24;
  color: #fff;
  box-shadow: 0 0 12px rgba(245, 158, 11, 0.35);
}
.quest-count-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #ef4444;
  color: #fff;
  font-size: 10px;
  font-weight: 800;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(239, 68, 68, 0.5);
}

/* 📜 HUD 微型任务追踪栏 (左上角) */
.quest-hud-tracker {
  position: absolute;
  top: 82px;
  left: 22px;
  width: 270px;
  background: rgba(13, 17, 28, 0.85);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 12px;
  overflow: hidden;
  z-index: 100;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.08);
  transition: all 0.25s ease;
  user-select: none;
}
.quest-hud-tracker:hover {
  border-color: rgba(245, 158, 11, 0.55);
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.55), 0 0 16px rgba(245, 158, 11, 0.2);
}

.hud-tracker-header {
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.03);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  cursor: pointer;
}
.quest-hud-tracker.collapsed .hud-tracker-header {
  border-bottom: none;
}
.hud-tag-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  flex-shrink: 0;
}
.hud-tag-badge.main {
  background: rgba(245, 158, 11, 0.22);
  color: #fbbf24;
  border: 1px solid rgba(245, 158, 11, 0.4);
}
.hud-tag-badge.academic {
  background: rgba(56, 189, 248, 0.22);
  color: #38bdf8;
  border: 1px solid rgba(56, 189, 248, 0.4);
}
.hud-title-text {
  font-size: 12px;
  font-weight: 700;
  color: #f1f5f9;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.hud-toggle-btn {
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 12px;
  cursor: pointer;
  padding: 0 2px;
}
.hud-toggle-btn:hover {
  color: #f1f5f9;
}

.hud-tracker-body {
  padding: 10px 12px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.hud-step-row {
  display: flex;
  align-items: flex-start;
  gap: 6px;
}
.hud-step-icon {
  font-size: 10px;
  font-weight: 900;
  color: #f59e0b;
  margin-top: 2px;
  flex-shrink: 0;
}
.hud-step-icon.done {
  color: #22c55e;
}
.hud-step-desc {
  font-size: 11px;
  line-height: 1.45;
  color: #cbd5e1;
}
.hud-footer-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 10px;
  padding-top: 4px;
  border-top: 1px dashed rgba(255, 255, 255, 0.08);
}
.hud-reward-pill {
  color: #fbbf24;
  font-weight: 700;
}
.hud-journal-key {
  color: #64748b;
}
</style>
