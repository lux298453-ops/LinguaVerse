/**
 * sentenceJudge.js
 * 造句共鸣智能裁决引擎 (Sentence Resonance Judge)
 * 轻量级前端英文造句合规性校验，用于 Word Chain 的「造句共鸣」进阶机制
 */

import { isValidWord } from './wordChainDictionary.js'

// 常见英语主语词 / 代词 / 限定词（句子主谓结构初筛）
const SUBJECT_WORDS = new Set([
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
  'my', 'your', 'his', 'its', 'our', 'their',
  'this', 'that', 'these', 'those', 'the', 'a', 'an',
  'who', 'what', 'which', 'where', 'when', 'how', 'why',
  'everyone', 'someone', 'anyone', 'nobody', 'people', 'one',
  'there', 'here'
])

// 常见英语动词 / 助动词（句子主谓结构初筛）
const VERB_WORDS = new Set([
  'is', 'are', 'was', 'were', 'am', 'be', 'been', 'being',
  'have', 'has', 'had', 'having',
  'do', 'does', 'did', 'doing', 'done',
  'will', 'would', 'shall', 'should', 'can', 'could', 'may', 'might', 'must',
  'go', 'goes', 'went', 'going', 'gone',
  'get', 'gets', 'got', 'getting',
  'make', 'makes', 'made', 'making',
  'say', 'says', 'said', 'saying',
  'know', 'knows', 'knew', 'knowing', 'known',
  'take', 'takes', 'took', 'taking', 'taken',
  'come', 'comes', 'came', 'coming',
  'see', 'sees', 'saw', 'seeing', 'seen',
  'want', 'wants', 'wanted', 'wanting',
  'look', 'looks', 'looked', 'looking',
  'give', 'gives', 'gave', 'giving', 'given',
  'use', 'uses', 'used', 'using',
  'find', 'finds', 'found', 'finding',
  'tell', 'tells', 'told', 'telling',
  'think', 'thinks', 'thought', 'thinking',
  'feel', 'feels', 'felt', 'feeling',
  'try', 'tries', 'tried', 'trying',
  'leave', 'leaves', 'left', 'leaving',
  'like', 'likes', 'liked', 'liking',
  'love', 'loves', 'loved', 'loving',
  'eat', 'eats', 'ate', 'eating', 'eaten',
  'run', 'runs', 'ran', 'running',
  'play', 'plays', 'played', 'playing',
  'need', 'needs', 'needed', 'needing',
  'keep', 'keeps', 'kept', 'keeping',
  'let', 'lets', 'put', 'puts', 'set', 'sets',
  'seem', 'seems', 'seemed', 'help', 'helps', 'helped',
  'show', 'shows', 'showed', 'shown',
  'hear', 'hears', 'heard',
  'stand', 'stands', 'stood',
  'bring', 'brings', 'brought',
  'write', 'writes', 'wrote', 'written',
  'learn', 'learns', 'learned',
  'read', 'reads', 'live', 'lives', 'lived',
  'walk', 'walks', 'walked', 'walking',
  'dance', 'dances', 'danced', 'dancing'
])

/**
 * 检查句子中是否包含目标关键词或其词法变体
 * @param {string[]} words - 句子拆分后的单词数组（小写）
 * @param {string} keyword - 接龙出的目标单词（小写）
 * @returns {boolean}
 */
function containsKeyword(words, keyword) {
  // 直接包含
  if (words.includes(keyword)) return true

  // 词法变体匹配：检查词根关系
  const suffixes = ['s', 'es', 'ed', 'd', 'ing', 'er', 'est', 'ly', 'tion', 'ment', 'ness']
  for (const w of words) {
    // 句子中的词是关键词的变体
    for (const suf of suffixes) {
      if (w === keyword + suf) return true
      if (keyword === w + suf) return true
    }
    // 去 e 加 ing/ed 等
    if (w === keyword.replace(/e$/, '') + 'ing') return true
    if (w === keyword.replace(/e$/, '') + 'ed') return true
    if (keyword === w.replace(/e$/, '') + 'ing') return true
    if (keyword === w.replace(/e$/, '') + 'ed') return true
    // 双写辅音
    if (w.endsWith('ing') && w.length > 4) {
      const base = w.slice(0, -3)
      if (base.length >= 2 && base[base.length - 1] === base[base.length - 2]) {
        if (base.slice(0, -1) === keyword) return true
      }
    }
    // y -> ies/ied
    if (keyword.endsWith('y') && (w === keyword.slice(0, -1) + 'ies' || w === keyword.slice(0, -1) + 'ied')) return true
    if (w.endsWith('y') && (keyword === w.slice(0, -1) + 'ies' || keyword === w.slice(0, -1) + 'ied')) return true
  }
  return false
}

/**
 * 判定造句是否合规
 * @param {string} sentence - 玩家输入的句子原文
 * @param {string} targetWord - 本轮接龙出的目标单词
 * @returns {{ passed: boolean, message: string, punctuationBonus: boolean }}
 */
export function judgeSentence(sentence, targetWord) {
  if (!sentence || typeof sentence !== 'string') {
    return { passed: false, message: '💡 请输入一个英文句子！', punctuationBonus: false }
  }

  const trimmed = sentence.trim()
  if (!trimmed) {
    return { passed: false, message: '💡 请输入一个英文句子！', punctuationBonus: false }
  }

  // 1. 中文 / 非英文字符检测
  if (/[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff]/.test(trimmed)) {
    return { passed: false, message: '🌍 造句共鸣只接受英文句子哦！Please write in English!', punctuationBonus: false }
  }

  // 2. 提取纯单词（去掉标点）
  const rawWords = trimmed.toLowerCase().replace(/[^a-z\s'-]/g, ' ').split(/\s+/).filter(w => w.length > 0)

  // 3. 最小词数检查（至少 3 个有效单词）
  if (rawWords.length < 3) {
    return { passed: false, message: '💡 请写出一个完整的短句（至少 3 个单词）！', punctuationBonus: false }
  }

  // 4. 关键词包含检测
  const kw = targetWord.toLowerCase()
  if (!containsKeyword(rawWords, kw)) {
    return {
      passed: false,
      message: `💡 句子中必须包含单词 '${targetWord.toUpperCase()}' 或其变形哦！`,
      punctuationBonus: false
    }
  }

  // 5. 主谓结构初筛（宽松：有主语词或动词词即可）
  const hasSubject = rawWords.some(w => SUBJECT_WORDS.has(w))
  const hasVerb = rawWords.some(w => VERB_WORDS.has(w))
  if (!hasSubject && !hasVerb) {
    return {
      passed: false,
      message: '💡 请尝试写一个有主语和动词的完整句子！例如: "I love playing games."',
      punctuationBonus: false
    }
  }

  // 6. 乱码检测（超过一半的单词不在词库中且不是常见语法词，视为无意义输入）
  const grammarWords = new Set([...SUBJECT_WORDS, ...VERB_WORDS, 'not', 'no', 'and', 'or', 'but', 'so', 'if', 'then', 'when', 'while', 'because', 'since', 'for', 'with', 'without', 'about', 'from', 'into', 'to', 'at', 'in', 'on', 'of', 'by', 'up', 'out', 'off', 'over', 'under', 'very', 'really', 'just', 'also', 'too', 'more', 'most', 'much', 'many', 'some', 'any', 'all', 'every', 'each', 'both', 'few', 'own', 'other', 'another', 'such', 'than', 'after', 'before', 'between', 'through', 'during', 'new', 'old', 'good', 'bad', 'big', 'small', 'long', 'short', 'great', 'little', 'right', 'left', 'first', 'last', 'next', 'still', 'already', 'always', 'never', 'now', 'today', 'tomorrow', 'yesterday'])
  let validCount = 0
  for (const w of rawWords) {
    if (grammarWords.has(w) || isValidWord(w)) {
      validCount++
    }
  }
  if (validCount < rawWords.length * 0.5) {
    return {
      passed: false,
      message: '💡 请输入有意义的英文句子，不要随意乱拼哦！',
      punctuationBonus: false
    }
  }

  // 7. 标点规范检测（句末是否有 . ! ?）
  const hasPunctuation = /[.!?]\s*$/.test(trimmed)

  return {
    passed: true,
    message: hasPunctuation
      ? '✨ 灵语造句共鸣成功！规范标点额外奖励！'
      : '✨ 灵语造句共鸣成功！',
    punctuationBonus: hasPunctuation
  }
}
