/**
 * wordChainDictionary.js
 * 灵语连环英语词库：收录近万级现代高频规范英文单词，支持 O(1) 极速校验、智能屈折词形还原与 AI 对弈按首字母检索
 */
import { WORDS_10K } from './words_10k.js'

export const STARTING_SEEDS = [
  'magic', 'crystal', 'dragon', 'spell', 'kingdom',
  'phoenix', 'portal', 'legend', 'shadow', 'castle',
  'warrior', 'potion', 'spirit', 'feather', 'galaxy',
  'comet', 'mystic', 'oracle', 'spark', 'flame',
  'forest', 'island', 'beacon', 'thunder', 'frost',
  'puzzle', 'riddle', 'shield', 'sword', 'temple',
  'silver', 'golden', 'breeze', 'bridge'
]

// 1. 基础快速查询集合 O(1)
export const COMMON_WORDS_SET = new Set(WORDS_10K.map(w => w.toLowerCase()))

// 补充部分极高频口语、专有名词变体或奇幻色彩词
const EXTRA_RESONANCE_WORDS = [
  'eat', 'eating', 'eats', 'eaten', 'eater',
  'run', 'running', 'runs', 'runner',
  'fly', 'flying', 'flies', 'flew', 'flown',
  'play', 'playing', 'plays', 'player', 'played',
  'cry', 'crying', 'cries', 'cried',
  'try', 'trying', 'tries', 'tried',
  'happy', 'happily', 'happiness',
  'quick', 'quickly',
  'dance', 'dancing', 'danced', 'dancer',
  'walk', 'walking', 'walked', 'walker',
  'spell', 'spelling', 'spells', 'spelled',
  'cast', 'casting', 'casts', 'caster',
  'heal', 'healing', 'heals', 'healed', 'healer',
  'sword', 'swords', 'shield', 'shields',
  'knight', 'knights', 'mage', 'mages',
  'quest', 'quests', 'questing'
]

for (const w of EXTRA_RESONANCE_WORDS) {
  COMMON_WORDS_SET.add(w.toLowerCase())
}

// 2. 按首字母分类的字典，用于 AI 快速按规则选词
export const WORD_DICT_BY_LETTER = {}

for (let i = 97; i <= 122; i++) {
  const ch = String.fromCharCode(i)
  WORD_DICT_BY_LETTER[ch] = []
}

for (const w of COMMON_WORDS_SET) {
  if (!w || typeof w !== 'string') continue
  const first = w[0]
  if (WORD_DICT_BY_LETTER[first]) {
    WORD_DICT_BY_LETTER[first].push(w)
  }
}

/**
 * 智能词法还原判定函数 (isValidWord)
 * 支持英语日常派生与词形变化：
 * 1. 直接命中静态词库 (10,000+ 核心词)
 * 2. -ing 现在分词/动名词 (如 eating -> eat, dancing -> dance, running -> run, dying -> die)
 * 3. -ed 过去式/过去分词 (如 walked -> walk, loved -> love, carried -> carry, stopped -> stop)
 * 4. -s / -es 复数或第三人称单数 (如 cats -> cat, boxes -> box, candies -> candy)
 * 5. -ly 副词 (如 quickly -> quick, happily -> happy)
 * 6. -er / -est 比较级/最高级 (如 faster -> fast, nicer -> nice, bigger -> big)
 */
export function isValidWord(input) {
  if (!input || typeof input !== 'string') return false
  const word = input.trim().toLowerCase()
  if (word.length < 2) return false

  // 1. 直接全词匹配
  if (COMMON_WORDS_SET.has(word)) return true

  // 辅助检测词根是否收录
  const checkStem = (stem) => stem && stem.length >= 2 && COMMON_WORDS_SET.has(stem)

  // 2. -ing 处理 (如 eating -> eat)
  if (word.endsWith('ing') && word.length >= 4) {
    const base = word.slice(0, -3)
    // 形式 1: 直接加 ing (eat -> eating, play -> playing, look -> looking)
    if (checkStem(base)) {
      COMMON_WORDS_SET.add(word)
      return true
    }
    // 形式 2: 去 e 加 ing (dance -> dancing, write -> writing, make -> making)
    if (checkStem(base + 'e')) {
      COMMON_WORDS_SET.add(word)
      return true
    }
    // 形式 3: 双写辅音加 ing (run -> running, swim -> swimming, sit -> sitting)
    if (base.length >= 2 && base[base.length - 1] === base[base.length - 2]) {
      const singleConsonant = base.slice(0, -1)
      if (checkStem(singleConsonant)) {
        COMMON_WORDS_SET.add(word)
        return true
      }
    }
    // 形式 4: ying -> ie (die -> dying, lie -> lying, tie -> tying)
    if (word.endsWith('ying') && word.length >= 5) {
      const ieStem = word.slice(0, -4) + 'ie'
      if (checkStem(ieStem)) {
        COMMON_WORDS_SET.add(word)
        return true
      }
    }
  }

  // 3. -ed 处理 (如 walked -> walk, smiled -> smile)
  if (word.endsWith('ed') && word.length >= 4) {
    const base = word.slice(0, -2)
    // 形式 1: 直接加 ed (walk -> walked, play -> played)
    if (checkStem(base)) {
      COMMON_WORDS_SET.add(word)
      return true
    }
    // 形式 2: 加 d (smile -> smiled, live -> lived)
    if (checkStem(base + 'e')) {
      COMMON_WORDS_SET.add(word)
      return true
    }
    // 形式 3: 双写辅音加 ed (stop -> stopped, plan -> planned)
    if (base.length >= 2 && base[base.length - 1] === base[base.length - 2]) {
      const singleConsonant = base.slice(0, -1)
      if (checkStem(singleConsonant)) {
        COMMON_WORDS_SET.add(word)
        return true
      }
    }
    // 形式 4: ied -> y (carry -> carried, study -> studied)
    if (word.endsWith('ied') && word.length >= 4) {
      const yStem = word.slice(0, -3) + 'y'
      if (checkStem(yStem)) {
        COMMON_WORDS_SET.add(word)
        return true
      }
    }
  }

  // 4. -es / -ies / -s 处理 (如 boxes -> box, flies -> fly, cats -> cat)
  if (word.endsWith('ies') && word.length >= 4) {
    const yStem = word.slice(0, -3) + 'y'
    if (checkStem(yStem)) {
      COMMON_WORDS_SET.add(word)
      return true
    }
  }
  if (word.endsWith('es') && word.length >= 4) {
    const base = word.slice(0, -2)
    if (checkStem(base)) {
      COMMON_WORDS_SET.add(word)
      return true
    }
  }
  if (word.endsWith('s') && word.length >= 3) {
    const base = word.slice(0, -1)
    if (checkStem(base)) {
      COMMON_WORDS_SET.add(word)
      return true
    }
  }

  // 5. -ly 处理 (如 quickly -> quick, happily -> happy)
  if (word.endsWith('ly') && word.length >= 4) {
    const base = word.slice(0, -2)
    if (checkStem(base)) {
      COMMON_WORDS_SET.add(word)
      return true
    }
    if (word.endsWith('ily') && word.length >= 5) {
      const yStem = word.slice(0, -3) + 'y'
      if (checkStem(yStem)) {
        COMMON_WORDS_SET.add(word)
        return true
      }
    }
  }

  // 6. -er / -est 处理 (如 faster -> fast, fastest -> fast)
  if (word.endsWith('er') && word.length >= 4) {
    const base = word.slice(0, -2)
    if (checkStem(base) || checkStem(base + 'e')) {
      COMMON_WORDS_SET.add(word)
      return true
    }
  }
  if (word.endsWith('est') && word.length >= 5) {
    const base = word.slice(0, -3)
    if (checkStem(base) || checkStem(base + 'e')) {
      COMMON_WORDS_SET.add(word)
      return true
    }
  }

  return false
}
