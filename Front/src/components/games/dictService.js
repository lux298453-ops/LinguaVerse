/**
 * dictService.js
 * 词库核心服务 (Vocabulary & Pronunciation Engine)
 * 提供：
 * 1. 方案 A：权威有道真人发音 CDN (US 美音 / UK 英音自由切换) + 本地 Web Speech 兜底
 * 2. 词形智能还原查词（支持复数、进行时、过去式自动回溯原型）
 * 3. 考纲与分级词书元数据定义 (高考 / CET-4 / CET-6 / 考研 / 雅思 / 奇幻)
 * 4. 生词本本地持久化收藏 (Favorites)
 */

import { DICT_DATABASE } from './dictData.js'

// 词书分类配置
export const VOCAB_BOOKS = [
  { id: 'ALL', name: '全科通识词汇 (All)', icon: '📚', tag: null, desc: '涵盖基础、四六级、考研与雅思核心词库' },
  { id: 'GAOKAO', name: '高中与高考必备 (High School)', icon: '🟢', tag: '高考', desc: '全国高中课程标准与高考核心 3500 词' },
  { id: 'CET4', name: '大学英语四级 (CET-4)', icon: '🟡', tag: 'CET4', desc: '全国大学英语四级大纲高频必考核心词' },
  { id: 'CET6', name: '大学六级与考研 (CET-6 & KY)', icon: '🔴', tag: 'CET6', desc: '六级与全国硕士研究生招生大纲进阶词' },
  { id: 'IELTS', name: '雅思学术核心 (IELTS)', icon: '🟣', tag: 'IELTS', desc: '国际雅思学术类阅读与写作高频核心词' },
  { id: 'FANTASY', name: '奇幻魔法特色 (Fantasy)', icon: '🔮', tag: '奇幻', desc: '灵语宇宙神话、魔法、装备与冒险对决词' },
]

// 正在播放的音频单例（防止连续点击重叠杂音）
let currentPlayingAudio = null

/**
 * 方案 A：播放单词真实真人发音
 * @param {string} word - 要发音的英文单词
 * @param {'us'|'uk'} accent - 发音口音：'us' (美音, type=2), 'uk' (英音, type=1)
 * @returns {Promise<boolean>} 播放是否成功
 */
export function playWordAudio(word, accent = 'us') {
  if (!word || typeof word !== 'string') return Promise.resolve(false)

  const cleanWord = word.trim().toLowerCase()
  if (!cleanWord) return Promise.resolve(false)

  // 停止上一个正在播放的音频
  if (currentPlayingAudio) {
    try {
      currentPlayingAudio.pause()
      currentPlayingAudio.currentTime = 0
    } catch (e) {
      // ignore
    }
  }

  return new Promise((resolve) => {
    // 有道真人发音 CDN: type=1 为英音, type=2 为美音
    const type = accent === 'uk' ? 1 : 2
    const audioUrl = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(cleanWord)}&type=${type}`
    const audio = new Audio(audioUrl)
    currentPlayingAudio = audio

    audio.onended = () => {
      currentPlayingAudio = null
      resolve(true)
    }

    audio.onerror = (e) => {
      console.warn(`[dictService] 真人音频 CDN 播放失败，尝试本地语音合成兜底:`, e)
      fallbackSpeechSynthesis(cleanWord, accent)
      currentPlayingAudio = null
      resolve(false)
    }

    audio.play().catch((err) => {
      console.warn(`[dictService] 音频播放受浏览器自动播放策略拦截或断网:`, err)
      fallbackSpeechSynthesis(cleanWord, accent)
      currentPlayingAudio = null
      resolve(false)
    })
  })
}

/**
 * 兜底方案：Web Speech API
 */
function fallbackSpeechSynthesis(word, accent) {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel()
      const utter = new SpeechSynthesisUtterance(word)
      utter.lang = accent === 'uk' ? 'en-GB' : 'en-US'
      utter.rate = 0.88 // 略微放慢，发音更清晰
      window.speechSynthesis.speak(utter)
    } catch (e) {
      console.error('[dictService] 本地语音合成也无法使用:', e)
    }
  }
}

/**
 * 常见词尾还原规则
 */
function stemWord(w) {
  const candidates = []
  // -s, -es
  if (w.endsWith('s') && w.length > 3) {
    candidates.push(w.slice(0, -1))
    if (w.endsWith('es')) candidates.push(w.slice(0, -2))
    if (w.endsWith('ies')) candidates.push(w.slice(0, -3) + 'y')
  }
  // -ing
  if (w.endsWith('ing') && w.length > 4) {
    candidates.push(w.slice(0, -3)) // asking -> ask
    candidates.push(w.slice(0, -3) + 'e') // making -> make
    // 双写辅音: running -> run
    const base = w.slice(0, -3)
    if (base.length >= 3 && base[base.length - 1] === base[base.length - 2]) {
      candidates.push(base.slice(0, -1))
    }
  }
  // -ed
  if (w.endsWith('ed') && w.length > 4) {
    candidates.push(w.slice(0, -2)) // played -> play
    candidates.push(w.slice(0, -1)) // danced -> dance
    if (w.endsWith('ied')) candidates.push(w.slice(0, -3) + 'y')
    const base = w.slice(0, -2)
    if (base.length >= 3 && base[base.length - 1] === base[base.length - 2]) {
      candidates.push(base.slice(0, -1))
    }
  }
  // -ly
  if (w.endsWith('ly') && w.length > 4) {
    candidates.push(w.slice(0, -2))
    if (w.endsWith('ily')) candidates.push(w.slice(0, -3) + 'y')
  }
  return candidates
}

/**
 * 智能查词：先查精确匹配，若无则自动还原词性时态
 * @param {string} inputWord - 输入单词
 * @returns {object} 单词详情对象
 */
export function getWordDetail(inputWord) {
  if (!inputWord || typeof inputWord !== 'string') return null

  const clean = inputWord.trim().toLowerCase()
  if (!clean) return null

  // 1. 精确命中
  if (DICT_DATABASE[clean]) {
    return {
      ...DICT_DATABASE[clean],
      isInflected: false,
      baseWord: clean
    }
  }

  // 2. 词形变形还原命中
  const stems = stemWord(clean)
  for (const s of stems) {
    if (DICT_DATABASE[s]) {
      const base = DICT_DATABASE[s]
      return {
        ...base,
        word: clean,
        baseWord: s,
        isInflected: true,
        trans: `[${s} 的屈折形式] ` + base.trans
      }
    }
  }

  // 3. 未在内置精选详尽库中收录时的友好兜底（依然支持有道真人发音！）
  return {
    word: clean,
    baseWord: clean,
    isInflected: false,
    phonetic_us: `/${clean}/`,
    phonetic_uk: `/${clean}/`,
    pos: "word",
    trans: "灵语词汇（点击上方发音按钮即可收听纯正真人原声）",
    example: `The word "${clean}" echoes within LinguaVerse.`,
    example_cn: `单词 "${clean}" 回荡在灵语宇宙的浩瀚殿堂中。`,
    tags: ["通用词汇"]
  }
}

// ─── 生词本本地持久化 (Favorites) ──────────────────────────────────────────
const FAVORITES_STORAGE_KEY = 'linguaverse_favorite_words'

export function getFavorites() {
  try {
    const raw = localStorage.getItem(FAVORITES_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch (e) {
    return []
  }
}

export function isFavorite(word) {
  if (!word) return false
  const list = getFavorites()
  return list.some(item => (typeof item === 'string' ? item : item.word) === word.toLowerCase().trim())
}

export function toggleFavorite(wordDetailOrString) {
  const list = getFavorites()
  const w = typeof wordDetailOrString === 'string'
    ? wordDetailOrString.toLowerCase().trim()
    : wordDetailOrString.word.toLowerCase().trim()

  const index = list.findIndex(item => (typeof item === 'string' ? item : item.word) === w)
  let isNowFav = false

  if (index >= 0) {
    list.splice(index, 1)
    isNowFav = false
  } else {
    const detail = typeof wordDetailOrString === 'object' ? wordDetailOrString : getWordDetail(w)
    list.unshift({
      word: w,
      trans: detail.trans,
      pos: detail.pos,
      date: new Date().toLocaleDateString()
    })
    isNowFav = true
  }

  try {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(list))
  } catch (e) {
    console.error('保存生词本失败', e)
  }

  return isNowFav
}

// ─── 词书选择状态与辅助方法 (Vocab Book Selection) ──────────────────────────
const CURRENT_BOOK_KEY = 'linguaverse_current_book_id'

export function getCurrentBookId() {
  try {
    const saved = localStorage.getItem(CURRENT_BOOK_KEY)
    if (saved && VOCAB_BOOKS.some(b => b.id === saved)) {
      return saved
    }
  } catch (e) {
    // ignore
  }
  return 'CET4' // 默认四级核心词
}

export function setCurrentBookId(bookId) {
  if (!bookId) return
  try {
    localStorage.setItem(CURRENT_BOOK_KEY, bookId)
    // 触发全局自定义事件通知各组件
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('linguaverse:book-changed', { detail: bookId }))
    }
  } catch (e) {
    console.error('保存当前词书失败', e)
  }
}

export function getCurrentBook() {
  const id = getCurrentBookId()
  return VOCAB_BOOKS.find(b => b.id === id) || VOCAB_BOOKS[2] // 默认 CET4
}

/**
 * 获取指定词书的收录词数
 */
export function getBookWordCount(bookId) {
  if (bookId === 'ALL') {
    return Object.keys(DICT_DATABASE).length
  }
  const book = VOCAB_BOOKS.find(b => b.id === bookId)
  if (!book || !book.tag) return Object.keys(DICT_DATABASE).length

  let count = 0
  for (const item of Object.values(DICT_DATABASE)) {
    if (item.tags && item.tags.includes(book.tag)) {
      count++
    }
  }
  return count
}

/**
 * 根据词书 ID 筛选词库列表，供小游戏调用
 * @param {string} bookId - 词书 ID (ALL / GAOKAO / CET4 / CET6 / IELTS / FANTASY)
 * @returns {Array} 符合标签的单词数组
 */
export function getWordsByBook(bookId) {
  const targetId = bookId || getCurrentBookId()
  const book = VOCAB_BOOKS.find(b => b.id === targetId)
  const allEntries = Object.values(DICT_DATABASE)

  if (!book || targetId === 'ALL' || !book.tag) {
    return allEntries
  }

  const filtered = allEntries.filter(item => item.tags && item.tags.includes(book.tag))
  return filtered.length > 0 ? filtered : allEntries
}
