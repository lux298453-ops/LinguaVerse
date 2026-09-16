<template>
  <svg
    :class="['game-icon', 'game-icon-' + name, customClass]"
    :width="actualSize"
    :height="actualSize"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    :style="customStyle"
    aria-hidden="true"
  >
    <!-- 金币 / 财富 (Coin) -->
    <g v-if="name === 'coin'">
      <circle cx="12" cy="12" r="9.5" fill="url(#gi-gold-grad)" stroke="#d97706" stroke-width="1" />
      <circle cx="12" cy="12" r="7" stroke="#fde68a" stroke-width="0.8" stroke-dasharray="1.5 1.5" />
      <path d="M12 7.5L13.2 10.8L16.5 12L13.2 13.2L12 16.5L10.8 13.2L7.5 12L10.8 10.8L12 7.5Z" fill="#78350f" />
    </g>

    <!-- 任务 / 卷轴 (Quest Scroll) -->
    <g v-else-if="name === 'quest' || name === 'scroll'">
      <path d="M19 19C19 20.1 18.1 21 17 21H6C4.34 21 3 19.66 3 18C3 16.34 4.34 15 6 15H17C18.1 15 19 15.9 19 17V19Z" fill="#b45309" opacity="0.8" />
      <path d="M5 15V5C5 3.9 5.9 3 7 3H19C20.1 3 21 3.9 21 5V17C21 18.1 20.1 19 19 19H6C4.34 19 3 17.66 3 16C3 15.5 3.12 15.03 3.34 14.62L5 15Z" fill="url(#gi-amber-grad)" stroke="#f59e0b" stroke-width="1.2" />
      <path d="M8 7H16M8 10H14M8 13H12" stroke="#78350f" stroke-width="1.4" stroke-linecap="round" />
      <circle cx="18" cy="16" r="2" fill="#ef4444" stroke="#7f1d1d" stroke-width="0.8" />
    </g>

    <!-- 词书 / 典籍 (Book / Grimoire) -->
    <g v-else-if="name === 'book'">
      <path d="M4 19.5C4 18.12 5.12 17 6.5 17H20V4H6.5C5.12 4 4 5.12 4 6.5V19.5Z" fill="url(#gi-blue-grad)" stroke="#38bdf8" stroke-width="1.2" />
      <path d="M4 19.5C4 20.88 5.12 22 6.5 22H20V17H6.5C5.12 17 4 18.12 4 19.5Z" fill="#0369a1" stroke="#38bdf8" stroke-width="1" />
      <path d="M10 4V12L12.5 10.5L15 12V4" fill="#fbbf24" />
      <line x1="8" y1="17" x2="18" y2="17" stroke="#bae6fd" stroke-width="0.8" />
    </g>

    <!-- 俚语茶歇 / 茶杯 (Tea / Slang Lounge) -->
    <g v-else-if="name === 'tea' || name === 'cup'">
      <path d="M3 19H19C19.55 19 20 19.45 20 20C20 20.55 19.55 21 19 21H3C2.45 21 2 20.55 2 20C2 19.45 2.45 19 3 19Z" fill="#a78bfa" />
      <path d="M4 8H16V13C16 16.31 13.31 19 10 19C6.69 19 4 16.31 4 13V8Z" fill="url(#gi-purple-grad)" stroke="#c084fc" stroke-width="1.2" />
      <path d="M16 9H18C19.66 9 21 10.34 21 12C21 13.66 19.66 15 18 15H16" stroke="#c084fc" stroke-width="1.3" stroke-linecap="round" />
      <path d="M7 3C7 5 9 5 9 7M10 2C10 4 12 4 12 6M13 3C13 5 15 5 15 7" stroke="#e9d5ff" stroke-width="1.1" stroke-linecap="round" opacity="0.8" />
    </g>

    <!-- 空间聊天 / 消息 (Chat Bubble) -->
    <g v-else-if="name === 'chat' || name === 'message'">
      <path d="M20 12C20 7.58 16.42 4 12 4C7.58 4 4 7.58 4 12C4 13.81 4.6 15.48 5.62 16.83L4.2 20.2C4.04 20.58 4.42 20.96 4.8 20.8L8.17 19.38C9.52 20.4 11.19 21 13 21C16.87 21 20 17.87 20 14V12Z" fill="url(#gi-cyan-grad)" stroke="#38bdf8" stroke-width="1.2" />
      <circle cx="8.5" cy="12" r="1.3" fill="#ffffff" />
      <circle cx="12.5" cy="12" r="1.3" fill="#ffffff" />
      <circle cx="16.5" cy="12" r="1.3" fill="#ffffff" />
    </g>

    <!-- 返回 / 传送门退出 (Exit / Portal Door) -->
    <g v-else-if="name === 'exit' || name === 'door'">
      <path d="M13 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H13C14.1 21 15 20.1 15 19V17H13V19H5V5H13V7H15V5C15 3.9 14.1 3 13 3Z" fill="url(#gi-rose-grad)" />
      <path d="M18.3 11L15.7 8.4L17.1 7L22.1 12L17.1 17L15.7 15.6L18.3 13H9V11H18.3Z" fill="#fb7185" />
    </g>

    <!-- 动作轮盘 / 面具 (Action Mask) -->
    <g v-else-if="name === 'mask' || name === 'action'">
      <path d="M2 13C2 7.5 6.5 3 12 3C17.5 3 22 7.5 22 13C22 18.5 17.5 21 12 21C6.5 21 2 18.5 2 13Z" fill="url(#gi-violet-grad)" stroke="#a855f7" stroke-width="1.2" />
      <ellipse cx="8" cy="10.5" rx="2" ry="2.5" fill="#1e1b4b" stroke="#c084fc" stroke-width="0.8" />
      <ellipse cx="16" cy="10.5" rx="2" ry="2.5" fill="#1e1b4b" stroke="#c084fc" stroke-width="0.8" />
      <path d="M8 15.5C9.2 17 14.8 17 16 15.5" stroke="#fbcfe8" stroke-width="1.5" stroke-linecap="round" />
    </g>

    <!-- 飞行火箭 / 发送 (Rocket / Launch) -->
    <g v-else-if="name === 'rocket' || name === 'send'">
      <path d="M12 2.5C9.5 5.5 8 9.5 8 13.5L12 17L16 13.5C16 9.5 14.5 5.5 12 2.5Z" fill="url(#gi-blue-grad)" stroke="#60a5fa" stroke-width="1.2" />
      <circle cx="12" cy="8.5" r="1.8" fill="#e0f2fe" stroke="#0284c7" stroke-width="0.8" />
      <path d="M8 13.5L4 16L5.5 12L8 11.5V13.5Z" fill="#3b82f6" />
      <path d="M16 13.5L20 16L18.5 12L16 11.5V13.5Z" fill="#3b82f6" />
      <path d="M10.5 17L12 21.5L13.5 17" fill="#f59e0b" stroke="#ef4444" stroke-width="0.8" />
    </g>

    <!-- 玩家大法师 / 巫师帽 (Wizard Hat Player Avatar) -->
    <g v-else-if="name === 'wizard' || name === 'player'">
      <path d="M12 2.5L7 16.5C6.5 18 8 18.5 12 18.5C16 18.5 17.5 18 17 16.5L12 2.5Z" fill="url(#gi-indigo-grad)" stroke="#818cf8" stroke-width="1.2" />
      <path d="M2 18.5C2 17 6 16.5 12 16.5C18 16.5 22 17 22 18.5C22 20 18 20.5 12 20.5C6 20.5 2 20 2 18.5Z" fill="#312e81" stroke="#818cf8" stroke-width="1.2" />
      <path d="M12 8L12.7 10L14.7 10.3L13.2 11.6L13.6 13.5L12 12.5L10.4 13.5L10.8 11.6L9.3 10.3L11.3 10L12 8Z" fill="#fbbf24" />
      <ellipse cx="12" cy="16.5" rx="4.5" ry="1.2" fill="#fbbf24" />
    </g>

    <!-- 朗读 / 扬声器 (Speaker Audio) -->
    <g v-else-if="name === 'speaker' || name === 'sound'">
      <path d="M3 10V14H7L12 18V6L7 10H3Z" fill="url(#gi-cyan-grad)" stroke="#38bdf8" stroke-width="1.2" stroke-linejoin="round" />
      <path d="M15.5 8.5C16.8 9.8 17.5 11 17.5 12C17.5 13 16.8 14.2 15.5 15.5" stroke="#7dd3fc" stroke-width="1.5" stroke-linecap="round" />
      <path d="M18.5 5.5C20.5 7.5 21.5 9.5 21.5 12C21.5 14.5 20.5 16.5 18.5 18.5" stroke="#bae6fd" stroke-width="1.5" stroke-linecap="round" />
    </g>

    <!-- 扬声器单音 (Speaker Soft) -->
    <g v-else-if="name === 'speaker-soft'">
      <path d="M3 10V14H7L12 18V6L7 10H3Z" fill="url(#gi-cyan-grad)" stroke="#38bdf8" stroke-width="1.2" stroke-linejoin="round" />
      <path d="M15.5 9.5C16.3 10.3 16.8 11.1 16.8 12C16.8 12.9 16.3 13.7 15.5 14.5" stroke="#7dd3fc" stroke-width="1.5" stroke-linecap="round" />
    </g>

    <!-- 全球翻译 (Translate Globe) -->
    <g v-else-if="name === 'translate' || name === 'globe'">
      <circle cx="12" cy="12" r="9.2" stroke="#60a5fa" stroke-width="1.3" fill="url(#gi-blue-grad)" fill-opacity="0.3" />
      <ellipse cx="12" cy="12" rx="4.8" ry="9.2" stroke="#93c5fd" stroke-width="1" />
      <line x1="3" y1="12" x2="21" y2="12" stroke="#93c5fd" stroke-width="1" />
      <line x1="5" y1="7" x2="19" y2="7" stroke="#93c5fd" stroke-width="0.8" stroke-dasharray="2 1" />
      <line x1="5" y1="17" x2="19" y2="17" stroke="#93c5fd" stroke-width="0.8" stroke-dasharray="2 1" />
      <!-- 小微标文 -->
      <circle cx="17.5" cy="6.5" r="4.2" fill="#1d4ed8" stroke="#60a5fa" stroke-width="0.8" />
      <path d="M16 5H19M17.5 5V8.5M16 8.5C16.5 7.5 18.5 7.5 19 8.5" stroke="#ffffff" stroke-width="0.8" stroke-linecap="round" />
    </g>

    <!-- 灵感 / 提示灯泡 (Hint Lamp) -->
    <g v-else-if="name === 'hint' || name === 'lightbulb'">
      <path d="M12 2C8.13 2 5 5.13 5 9C5 11.38 6.19 13.47 8 14.74V17C8 17.55 8.45 18 9 18H15C15.55 18 16 17.55 16 17V14.74C17.81 13.47 19 11.38 19 9C19 5.13 15.87 2 12 2Z" fill="url(#gi-gold-grad)" stroke="#f59e0b" stroke-width="1.2" />
      <path d="M9 21C9 21.55 9.45 22 10 22H14C14.55 22 15 21.55 15 21V20H9V21Z" fill="#b45309" />
      <path d="M10 10L12 7L14 10" stroke="#78350f" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" />
    </g>

    <!-- 胜利 / 庆祝奖杯 (Trophy / Celebration) -->
    <g v-else-if="name === 'trophy' || name === 'celebrate'">
      <path d="M6 3H18V9C18 12.31 15.31 15 12 15C8.69 15 6 12.31 6 9V3Z" fill="url(#gi-gold-grad)" stroke="#d97706" stroke-width="1.2" />
      <path d="M6 5H3C2.45 5 2 5.45 2 6C2 8.5 4 10.5 6 10.5V5Z" fill="#f59e0b" stroke="#d97706" stroke-width="1" />
      <path d="M18 5H21C21.55 5 22 5.45 22 6C22 8.5 20 10.5 18 10.5V5Z" fill="#f59e0b" stroke="#d97706" stroke-width="1" />
      <path d="M10 15H14V18H10V15Z" fill="#d97706" />
      <path d="M7 19H17C17.55 19 18 19.45 18 20C18 20.55 17.55 21 17 21H7C6.45 21 6 20.55 6 20C6 19.45 6.45 19 7 19Z" fill="#92400e" />
      <polygon points="12,6.5 12.8,8.2 14.6,8.4 13.2,9.6 13.6,11.4 12,10.5 10.4,11.4 10.8,9.6 9.4,8.4 11.2,8.2" fill="#ffffff" />
    </g>

    <!-- 星星实心 (Star Filled) -->
    <g v-else-if="name === 'star' || name === 'star-fill'">
      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" fill="url(#gi-gold-grad)" stroke="#f59e0b" stroke-width="1.2" stroke-linejoin="round" />
    </g>

    <!-- 星星空心 (Star Outline) -->
    <g v-else-if="name === 'star-outline'">
      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" fill="none" stroke="#fbbf24" stroke-width="1.5" stroke-linejoin="round" />
    </g>

    <!-- 闪烁星芒 (Sparkles) -->
    <g v-else-if="name === 'sparkles'">
      <path d="M12 2L13.8 8.2L20 10L13.8 11.8L12 18L10.2 11.8L4 10L10.2 8.2L12 2Z" fill="url(#gi-gold-grad)" />
      <path d="M19 16L19.9 19.1L23 20L19.9 20.9L19 24L18.1 20.9L15 20L18.1 19.1L19 16Z" fill="#fde68a" />
      <path d="M5 16L5.6 18.4L8 19L5.6 19.6L5 22L4.4 19.6L2 19L4.4 18.4L5 16Z" fill="#fde68a" />
    </g>

    <!-- 魔法水晶 / 灵语宝石 (Crystal Gem) -->
    <g v-else-if="name === 'crystal' || name === 'gem'">
      <polygon points="6,3 18,3 22,9 12,22 2,9" fill="url(#gi-purple-grad)" stroke="#c084fc" stroke-width="1.2" stroke-linejoin="round" />
      <line x1="2" y1="9" x2="22" y2="9" stroke="#e9d5ff" stroke-width="0.8" />
      <polygon points="12,22 8,9 12,3 16,9" fill="none" stroke="#e9d5ff" stroke-width="0.8" />
      <polygon points="6,3 8,9 2,9" fill="#7c3aed" opacity="0.4" />
      <polygon points="18,3 16,9 22,9" fill="#7c3aed" opacity="0.4" />
    </g>

    <!-- 地点图钉 (Location Pin) -->
    <g v-else-if="name === 'pin'">
      <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2Z" fill="url(#gi-rose-grad)" stroke="#f43f5e" stroke-width="1.2" />
      <circle cx="12" cy="9" r="3" fill="#ffffff" />
    </g>

    <!-- 炼金药水瓶 (Potion Flask) -->
    <g v-else-if="name === 'potion' || name === 'flask'">
      <path d="M9 3H15M10 3V7L5 18C4.3 19.4 5.3 21 6.8 21H17.2C18.7 21 19.7 19.4 19 18L14 7V3" stroke="#a78bfa" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M6.5 17L9 11H15L17.5 17C18 18 17.5 19.5 16.5 19.5H7.5C6.5 19.5 6 18 6.5 17Z" fill="url(#gi-purple-grad)" />
      <circle cx="10" cy="15" r="1" fill="#fde68a" />
      <circle cx="13" cy="17" r="0.7" fill="#fde68a" />
      <circle cx="12" cy="13" r="0.8" fill="#fde68a" />
    </g>

    <!-- 双剑交错 / 对决 (Crossed Swords) -->
    <g v-else-if="name === 'swords' || name === 'combat'">
      <path d="M4 20L10 14M14 10L20 4M20 4H15M20 4V9" stroke="#cbd5e1" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M20 20L14 14M10 10L4 4M4 4H9M4 4V9" stroke="#94a3b8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
      <circle cx="12" cy="12" r="2.5" fill="#f59e0b" stroke="#d97706" stroke-width="1" />
    </g>

    <!-- 游戏手柄 (Gamepad) -->
    <g v-else-if="name === 'gamepad'">
      <path d="M6 7H18C20.2 7 22 8.8 22 11V14C22 17.3 19.3 20 16 20L13.5 17H10.5L8 20C4.7 20 2 17.3 2 14V11C2 8.8 3.8 7 6 7Z" fill="url(#gi-indigo-grad)" stroke="#818cf8" stroke-width="1.2" />
      <!-- 十字键 -->
      <path d="M7 10V14M5 12H9" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" />
      <!-- ABXY 按键 -->
      <circle cx="17" cy="10.5" r="1" fill="#f43f5e" />
      <circle cx="15.5" cy="12" r="1" fill="#38bdf8" />
      <circle cx="18.5" cy="12" r="1" fill="#fbbf24" />
      <circle cx="17" cy="13.5" r="1" fill="#34d399" />
    </g>

    <!-- 阳光 / 旭日 (Sun) -->
    <g v-else-if="name === 'sun'">
      <circle cx="12" cy="12" r="5" fill="url(#gi-gold-grad)" stroke="#f59e0b" stroke-width="1.2" />
      <path d="M12 2V4M12 20V22M4 12H2M22 12H20M4.93 4.93L6.34 6.34M17.66 17.66L19.07 19.07M4.93 19.07L6.34 17.66M17.66 6.34L19.07 4.93" stroke="#f59e0b" stroke-width="1.5" stroke-linecap="round" />
    </g>

    <!-- 用户人像 (User Avatar) -->
    <g v-else-if="name === 'user'">
      <circle cx="12" cy="8" r="4.5" fill="url(#gi-cyan-grad)" stroke="#38bdf8" stroke-width="1" />
      <path d="M4 20C4 16.5 7.5 14.5 12 14.5C16.5 14.5 20 16.5 20 20" stroke="#38bdf8" stroke-width="1.5" stroke-linecap="round" />
    </g>

    <!-- 麦克风 (Microphone) -->
    <g v-else-if="name === 'mic'">
      <rect x="9" y="3" width="6" height="11" rx="3" fill="url(#gi-purple-grad)" stroke="#c084fc" stroke-width="1.2" />
      <path d="M5 10C5 13.87 8.13 17 12 17C15.87 17 19 13.87 19 10" stroke="#c084fc" stroke-width="1.4" stroke-linecap="round" />
      <line x1="12" y1="17" x2="12" y2="21" stroke="#c084fc" stroke-width="1.4" stroke-linecap="round" />
      <line x1="8" y1="21" x2="16" y2="21" stroke="#c084fc" stroke-width="1.4" stroke-linecap="round" />
    </g>

    <!-- 引号例句 (Quote) -->
    <g v-else-if="name === 'quote'">
      <path d="M5 9C5 7 6.5 5.5 8.5 5.5V7C7.5 7 7 7.5 7 8.5H9V12H5V9ZM13 9C13 7 14.5 5.5 16.5 5.5V7C15.5 7 15 7.5 15 8.5H17V12H13V9Z" fill="#a78bfa" />
    </g>

    <!-- 成功对勾 (Check) -->
    <g v-else-if="name === 'check'">
      <circle cx="12" cy="12" r="9" fill="#059669" stroke="#34d399" stroke-width="1" />
      <path d="M8 12.5L10.8 15.3L16 9.5" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
    </g>

    <!-- 叉号关闭 (Close) -->
    <g v-else-if="name === 'close'">
      <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
      <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
    </g>

    <!-- 锁头 (Lock) -->
    <g v-else-if="name === 'lock'">
      <rect x="5" y="11" width="14" height="10" rx="2" fill="#475569" stroke="#94a3b8" stroke-width="1.2" />
      <path d="M8 11V7C8 4.79 9.79 3 12 3C14.21 3 16 4.79 16 7V11" stroke="#94a3b8" stroke-width="1.4" stroke-linecap="round" />
      <circle cx="12" cy="16" r="1.5" fill="#f1f5f9" />
    </g>

    <!-- 兜底通用星星 -->
    <g v-else>
      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" fill="url(#gi-gold-grad)" />
    </g>

    <!-- 内置灵语渐变色板系统 -->
    <defs>
      <!-- 金辉 -->
      <linearGradient id="gi-gold-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#fef08a" />
        <stop offset="50%" stop-color="#f59e0b" />
        <stop offset="100%" stop-color="#d97706" />
      </linearGradient>

      <!-- 琥珀羊皮纸 -->
      <linearGradient id="gi-amber-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#fef3c7" />
        <stop offset="60%" stop-color="#fde68a" />
        <stop offset="100%" stop-color="#f59e0b" />
      </linearGradient>

      <!-- 秘术紫晶 -->
      <linearGradient id="gi-purple-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#e9d5ff" />
        <stop offset="50%" stop-color="#c084fc" />
        <stop offset="100%" stop-color="#7c3aed" />
      </linearGradient>

      <!-- 幻魅深紫 -->
      <linearGradient id="gi-violet-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#d8b4fe" />
        <stop offset="100%" stop-color="#9333ea" />
      </linearGradient>

      <!-- 苍穹蓝 -->
      <linearGradient id="gi-blue-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#93c5fd" />
        <stop offset="50%" stop-color="#3b82f6" />
        <stop offset="100%" stop-color="#1d4ed8" />
      </linearGradient>

      <!-- 蔚蓝青空 -->
      <linearGradient id="gi-cyan-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#a5f3fc" />
        <stop offset="50%" stop-color="#38bdf8" />
        <stop offset="100%" stop-color="#0284c7" />
      </linearGradient>

      <!-- 靛青巫师 -->
      <linearGradient id="gi-indigo-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#c7d2fe" />
        <stop offset="50%" stop-color="#6366f1" />
        <stop offset="100%" stop-color="#4338ca" />
      </linearGradient>

      <!-- 玫瑰绯红 -->
      <linearGradient id="gi-rose-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#fecdd3" />
        <stop offset="50%" stop-color="#f43f5e" />
        <stop offset="100%" stop-color="#be123c" />
      </linearGradient>
    </defs>
  </svg>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  name: {
    type: String,
    required: true
  },
  size: {
    type: [Number, String],
    default: 18
  },
  color: {
    type: String,
    default: ''
  },
  customClass: {
    type: String,
    default: ''
  }
})

const actualSize = computed(() => {
  return typeof props.size === 'number' ? `${props.size}px` : props.size
})

const customStyle = computed(() => {
  const s = {}
  if (props.color) {
    s.color = props.color
  }
  return s
})
</script>

<style scoped>
.game-icon {
  display: inline-block;
  vertical-align: middle;
  flex-shrink: 0;
  transition: transform 0.18s ease, filter 0.18s ease;
  user-select: none;
}
</style>
