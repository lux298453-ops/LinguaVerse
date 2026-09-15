/**
 * avatarHelper.js
 * 用户头像系统工具集 (User Avatar Utilities)
 * 提供精选预设奇幻角色头像、头像解析与渲染配置
 */

export const PRESET_AVATARS = [
  {
    id: 'preset_mage',
    name: '秘法导师',
    icon: 'MG',
    role: 'Mage',
    bg: 'linear-gradient(135deg, #6366f1, #a855f7)',
    border: '#c084fc'
  },
  {
    id: 'preset_elf',
    name: '翡翠精灵',
    icon: 'EL',
    role: 'Elf Guide',
    bg: 'linear-gradient(135deg, #10b981, #059669)',
    border: '#6ee7b7'
  },
  {
    id: 'preset_cat',
    name: '星界守望',
    icon: 'ST',
    role: 'Starlight',
    bg: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
    border: '#f472b6'
  },
  {
    id: 'preset_fox',
    name: '灵狐先驱',
    icon: 'FX',
    role: 'Flame Fox',
    bg: 'linear-gradient(135deg, #f97316, #ef4444)',
    border: '#fb923c'
  },
  {
    id: 'preset_knight',
    name: '圣堂骑士',
    icon: 'KN',
    role: 'Knight',
    bg: 'linear-gradient(135deg, #f59e0b, #d97706)',
    border: '#fde047'
  },
  {
    id: 'preset_cyborg',
    name: '智械助教',
    icon: 'AI',
    role: 'AI Tutor',
    bg: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
    border: '#38bdf8'
  },
  {
    id: 'preset_scholar',
    name: '博学导师',
    icon: 'SC',
    role: 'Scholar',
    bg: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
    border: '#93c5fd'
  },
  {
    id: 'preset_voyager',
    name: '星海先锋',
    icon: 'VY',
    role: 'Voyager',
    bg: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
    border: '#a78bfa'
  },
  {
    id: 'preset_alchemist',
    name: '炼金学者',
    icon: 'AL',
    role: 'Alchemist',
    bg: 'linear-gradient(135deg, #14b8a6, #0d9488)',
    border: '#5eead4'
  },
  {
    id: 'preset_bard',
    name: '风吟游侠',
    icon: 'BD',
    role: 'Bard',
    bg: 'linear-gradient(135deg, #eab308, #ca8a04)',
    border: '#fde047'
  },
  {
    id: 'preset_fairy',
    name: '幻境精灵',
    icon: 'FA',
    role: 'Fairy',
    bg: 'linear-gradient(135deg, #f43f5e, #be123c)',
    border: '#fda4af'
  },
  {
    id: 'preset_dragon',
    name: '龙魂领主',
    icon: 'DL',
    role: 'Dragon Lord',
    bg: 'linear-gradient(135deg, #475569, #0f172a)',
    border: '#94a3b8'
  }
]

const DEFAULT_GRADIENTS = [
  'linear-gradient(135deg, #3b82f6, #6366f1)',
  'linear-gradient(135deg, #10b981, #059669)',
  'linear-gradient(135deg, #f59e0b, #d97706)',
  'linear-gradient(135deg, #ec4899, #8b5cf6)',
  'linear-gradient(135deg, #06b6d4, #3b82f6)'
]

/**
 * 解析用户头像数据
 * @param {string} avatar - 存储在后端的 avatar 字符串
 * @param {string} fallbackName - 备选用户名或昵称
 * @returns {{ type: 'img'|'preset'|'text', src?: string, icon?: string, bg: string, border?: string, text?: string, name?: string }}
 */
export function parseAvatar(avatar, fallbackName = 'User') {
  if (avatar) {
    const trimmed = avatar.trim()
    // 1. 自定义外部网络图片 URL、本地上传文件或 Base64
    if (
      trimmed.startsWith('http://') ||
      trimmed.startsWith('https://') ||
      trimmed.startsWith('data:image') ||
      trimmed.startsWith('/uploads/') ||
      trimmed.startsWith('uploads/')
    ) {
      return {
        type: 'img',
        src: trimmed.startsWith('uploads/') ? `/${trimmed}` : trimmed,
        bg: '#f1f5f9',
        border: '#cbd5e1'
      }
    }
    // 2. 匹配预设头像
    const preset = PRESET_AVATARS.find(p => p.id === trimmed)
    if (preset) {
      return {
        type: 'preset',
        icon: preset.icon,
        bg: preset.bg,
        border: preset.border,
        name: preset.name
      }
    }
  }

  // 3. 兜底为首字母渐变背景
  const cleanName = (fallbackName || 'U').trim()
  const char = cleanName ? cleanName[0].toUpperCase() : 'U'
  const charCode = char.charCodeAt(0) || 0
  const bg = DEFAULT_GRADIENTS[charCode % DEFAULT_GRADIENTS.length]

  return {
    type: 'text',
    text: char,
    bg: bg,
    border: 'transparent'
  }
}