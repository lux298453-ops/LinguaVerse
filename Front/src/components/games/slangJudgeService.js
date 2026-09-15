/**
 * slangJudgeService.js
 * 灵语茶歇馆 · 俚语智能裁决与进度持久化服务
 */

import { SLANG_DATABASE } from './slangData.js'

const SLANG_PROGRESS_STORAGE_KEY = 'linguaverse_slang_progress_v1'

/**
 * 获取玩家当前的俚语学习与实战掌握档案
 * @returns {Record<string, { status: 'NEW'|'LEARNING'|'MASTERED', userSentence?: string, masteredAt?: string }>}
 */
export function getSlangProgress() {
  try {
    const raw = localStorage.getItem(SLANG_PROGRESS_STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch (e) {
    return {}
  }
}

/**
 * 标记俚语进入“学习中”状态（玩家翻看卡片）
 */
export function markSlangLearning(slangId) {
  const progress = getSlangProgress()
  if (!progress[slangId] || progress[slangId].status === 'NEW') {
    progress[slangId] = { status: 'LEARNING' }
    saveSlangProgress(progress)
  }
}

/**
 * 标记俚语已在情景中通关并保存句子
 */
export function markSlangMastered(slangId, sentence) {
  const progress = getSlangProgress()
  progress[slangId] = {
    status: 'MASTERED',
    userSentence: sentence,
    masteredAt: new Date().toLocaleDateString()
  }
  saveSlangProgress(progress)
}

function saveSlangProgress(progress) {
  try {
    localStorage.setItem(SLANG_PROGRESS_STORAGE_KEY, JSON.stringify(progress))
  } catch (e) {
    console.error('保存俚语进度失败:', e)
  }
}

/**
 * 获取已精通的俚语数量
 */
export function getMasteredCount() {
  const progress = getSlangProgress()
  return Object.values(progress).filter(p => p.status === 'MASTERED').length
}

/**
 * 智能判定玩家在情景挑战中的英文回答是否合规
 * @param {object} slang - 俚语配置对象
 * @param {string} playerInput - 玩家输入的英文回复
 * @returns {{ passed: boolean, message: string }}
 */
export function judgeSlangInput(slang, playerInput) {
  if (!playerInput || typeof playerInput !== 'string') {
    return { passed: false, message: '💡 请输入英文回复！' }
  }

  const trimmed = playerInput.trim()
  if (!trimmed) {
    return { passed: false, message: '💡 回复不能为空哦！' }
  }

  // 1. 中文或非拉丁字符检测
  if (/[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff]/.test(trimmed)) {
    return {
      passed: false,
      message: '🌍 地道俚语挑战请全程使用英文打字交流哦！Please type in English!'
    }
  }

  // 2. 标点与小写归一化
  const normalized = trimmed.toLowerCase().replace(/[^a-z0-9\s'-]/g, ' ')
  const words = normalized.split(/\s+/).filter(w => w.length > 0)

  // 3. 词数检查（至少 3 个词，构成起码的交际短句）
  if (words.length < 3) {
    return {
      passed: false,
      message: '💡 请写出一个完整的英文句子或短句（至少 3 个单词）！'
    }
  }

  // 4. 核心俚语命中检测
  const required = slang.scenario.requiredPhrases || slang.keywords || [slang.phrase.toLowerCase()]
  const hasSlang = required.some(phrase => {
    const cleanPhrase = phrase.toLowerCase().replace(/[^a-z0-9\s'-]/g, ' ').trim()
    return normalized.includes(cleanPhrase)
  })

  if (!hasSlang) {
    return {
      passed: false,
      message: `💡 句子中需要正确包含俚语 "${slang.phrase}" 才能打动对方哦！`
    }
  }

  // 5. 标点与句末规范检测
  const hasPunctuation = /[.!?]\s*$/.test(trimmed)

  return {
    passed: true,
    message: hasPunctuation
      ? '✨ 完美使用地道俚语！标点得体，情境极佳！'
      : '✨ 成功运用地道俚语！对方深受感染！'
  }
}
