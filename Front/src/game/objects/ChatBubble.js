/**
 * ChatBubble.js
 * 玩家头顶聊天气泡与动态动作表情系统
 * - 深度统一为 10000（永远悬浮在角色与建筑最前层，彻底避免深度遮挡）
 * - 动态跟随说话玩家移动
 * - 漫画风格对话框（底框 + 尖角指向箭头 + 弹性弹出动画）
 * - 支持 show() 文本气泡与 showEmote() 动作表情气泡
 */
import Phaser from 'phaser'

const BUBBLE_DURATION = 4200   // 文本气泡显示毫秒数
const EMOTE_DURATION  = 3500   // 表情气泡显示毫秒数
const PROXIMITY_SHOW  = 450    // 完全显示距离（像素）
const PROXIMITY_FADE  = 750    // 开始渐隐距离（像素）

// 预设表情映射表
export const EMOTE_MAP = {
  wave:     { icon: '👋', text: 'Hello!' },
  thumb_up: { icon: '👍', text: 'Awesome!' },
  heart:    { icon: '❤️', text: 'Love it!' },
  party:    { icon: '🎉', text: 'Cheers!' },
  laugh:    { icon: '😂', text: 'Hahaha!' },
  idea:     { icon: '💡', text: 'Idea!' },
  thinking: { icon: '💭', text: 'Hmm...' },
  coffee:   { icon: '☕', text: 'Take a break' }
}

export class ChatBubble {
  /**
   * 显示文字气泡
   * @param {Phaser.Scene} scene
   * @param {Phaser.GameObjects.GameObject|object} targetObj 绑定的目标角色 (具有 x, y 属性)
   * @param {string} text 说话内容
   * @param {function} [getLocalPos] 返回本地玩家 {x, y} 的函数
   */
  static show(scene, targetObj, text, getLocalPos) {
    if (!scene || !targetObj || !text) return

    const initialX = Number(targetObj.x) || 0
    const initialY = Number(targetObj.y) || 0

    // 距离判定（本地玩家距离为 0）
    let baseAlpha = 1
    if (getLocalPos) {
      const localPos = getLocalPos() || { x: initialX, y: initialY }
      const dist = Phaser.Math.Distance.Between(initialX, initialY, localPos.x, localPos.y)
      if (dist > PROXIMITY_FADE) return
      baseAlpha = dist <= PROXIMITY_SHOW ? 1 : Math.max(0.2, 1 - (dist - PROXIMITY_SHOW) / (PROXIMITY_FADE - PROXIMITY_SHOW))
    }

    // 清理该角色头上已有的旧气泡，避免重叠
    if (targetObj._currentBubble?.active) {
      targetObj._currentBubble.destroy()
      targetObj._currentBubble = null
    }

    // 创建气泡容器（置于最顶层深度 10000）
    const container = scene.add.container(initialX, initialY - 42)
    container.setDepth(10000)
    container.setAlpha(0)
    container.setScale(0.3)
    targetObj._currentBubble = container

    // 文字内容
    const maxWidth = 220
    const txt = scene.add.text(0, -8, text, {
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#0f172a',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Segoe UI Emoji", "Noto Color Emoji", sans-serif',
      wordWrap: { width: maxWidth },
      align: 'center',
      padding: { x: 10, y: 6 }
    }).setOrigin(0.5, 1)

    const bounds = txt.getBounds()
    const boxW = Math.max(54, bounds.width + 16)
    const boxH = Math.max(26, bounds.height + 10)
    const centerY = -8 - boxH / 2

    // 气泡底板（圆角矩形）
    const bg = scene.add.rectangle(0, centerY, boxW, boxH, 0xffffff, 0.98)
    bg.setStrokeStyle(1.5, 0x3b82f6, 0.9)

    // 向下指向尖角
    const beak = scene.add.triangle(0, -6, -5, 0, 5, 0, 0, 6, 0xffffff)
    beak.setStrokeStyle(1.5, 0x3b82f6, 0.9)

    container.add([bg, beak, txt])

    // 弹性弹出动画
    scene.tweens.add({
      targets: container,
      scaleX: 1,
      scaleY: 1,
      alpha: baseAlpha,
      duration: 250,
      ease: 'Back.easeOut'
    })

    // 动态位置跟随更新定时器
    const followTimer = scene.time.addEvent({
      delay: 30,
      loop: true,
      callback: () => {
        if (!container.active) return
        if (targetObj.active !== undefined && !targetObj.active) {
          container.destroy()
          return
        }
        if (typeof targetObj.x === 'number' && typeof targetObj.y === 'number') {
          container.setPosition(targetObj.x, targetObj.y - 42)
        }
      }
    })

    container.on('destroy', () => {
      followTimer.remove(false)
      if (targetObj._currentBubble === container) {
        targetObj._currentBubble = null
      }
    })

    // 定时淡出销毁
    scene.time.delayedCall(BUBBLE_DURATION, () => {
      if (!container.active) return
      scene.tweens.add({
        targets: container,
        alpha: 0,
        y: container.y - 15,
        duration: 350,
        ease: 'Quad.easeIn',
        onComplete: () => {
          if (container.active) container.destroy()
        }
      })
    })
  }

  /**
   * 显示快捷动作/表情气泡 (👋, 👍, ❤️ 等)
   */
  static showEmote(scene, targetObj, emoteKey, getLocalPos) {
    if (!scene || !targetObj) return

    const emoteConfig = EMOTE_MAP[emoteKey] || { icon: emoteKey || '✨', text: '' }
    const initialX = Number(targetObj.x) || 0
    const initialY = Number(targetObj.y) || 0

    if (getLocalPos) {
      const localPos = getLocalPos() || { x: initialX, y: initialY }
      const dist = Phaser.Math.Distance.Between(initialX, initialY, localPos.x, localPos.y)
      if (dist > PROXIMITY_FADE) return
    }

    // 清理该角色旧表情
    if (targetObj._currentBubble?.active) {
      targetObj._currentBubble.destroy()
      targetObj._currentBubble = null
    }

    const container = scene.add.container(initialX, initialY - 44)
    container.setDepth(10000)
    container.setAlpha(0)
    container.setScale(0.2)
    targetObj._currentBubble = container

    // 根据表情类型动态定制边框主题色
    const strokeColor = emoteKey === 'heart' ? 0xec4899 : (emoteKey === 'wave' ? 0x3b82f6 : (emoteKey === 'thumb_up' ? 0x10b981 : 0xa855f7))

    // 圆形外框与高亮
    const bgCircle = scene.add.circle(0, 0, 24, 0xffffff, 0.98)
    bgCircle.setStrokeStyle(2.5, strokeColor, 0.95)

    // 大表情图标（配置完备的跨平台 Emoji 字体栈）
    const iconText = scene.add.text(0, 0, emoteConfig.icon, {
      fontSize: '26px',
      fontFamily: '"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif'
    }).setOrigin(0.5)

    // 向下小箭头
    const arrow = scene.add.triangle(0, 26, -4, 0, 4, 0, 0, 5, strokeColor)

    container.add([bgCircle, arrow, iconText])

    // 弹性弹出 + 上下欢快轻跳
    scene.tweens.add({
      targets: container,
      scaleX: 1,
      scaleY: 1,
      alpha: 1,
      duration: 280,
      ease: 'Back.easeOut',
      onComplete: () => {
        if (!container.active) return
        scene.tweens.add({
          targets: iconText,
          y: -5,
          duration: 350,
          yoyo: true,
          repeat: 3,
          ease: 'Sine.easeInOut'
        })
      }
    })

    // 跟随目标移动
    const followTimer = scene.time.addEvent({
      delay: 30,
      loop: true,
      callback: () => {
        if (!container.active) return
        if (targetObj.active !== undefined && !targetObj.active) {
          container.destroy()
          return
        }
        if (typeof targetObj.x === 'number' && typeof targetObj.y === 'number') {
          container.setPosition(targetObj.x, targetObj.y - 44)
        }
      }
    })

    container.on('destroy', () => {
      followTimer.remove(false)
      if (targetObj._currentBubble === container) {
        targetObj._currentBubble = null
      }
    })

    // 定时淡出销毁 (延长至 4.5 秒，足够看清)
    scene.time.delayedCall(4500, () => {
      if (!container.active) return
      scene.tweens.add({
        targets: container,
        alpha: 0,
        y: container.y - 20,
        duration: 350,
        ease: 'Quad.easeIn',
        onComplete: () => {
          if (container.active) container.destroy()
        }
      })
    })
  }

  /**
   * 显示定向互动复合气泡（大表情徽章 + 专属对白 + 漫画尖角指针）
   * 专为打招呼、点赞设计，图文并茂，持续 5 秒，绝不会因为过快或纯小图标被漏看！
   */
  static showInteract(scene, targetObj, { action, emote, content, nickname }) {
    if (!scene || !targetObj) return

    const initialX = Number(targetObj.x) || 0
    const initialY = Number(targetObj.y) || 0

    // 清理该角色头上旧气泡
    if (targetObj._currentBubble?.active) {
      targetObj._currentBubble.destroy()
      targetObj._currentBubble = null
    }

    const isLike = action === 'LIKE' || emote === 'heart'
    const themeColor = isLike ? 0xf43f5e : 0x3b82f6
    const bgFill = isLike ? 0xfff1f2 : 0xf0f9ff
    const icon = isLike ? '❤️' : '👋'
    const defaultText = isLike ? '点赞了你！❤️' : '打了个招呼！👋'
    const displayText = content || (nickname ? `${nickname}: ${defaultText}` : defaultText)

    const container = scene.add.container(initialX, initialY - 46)
    container.setDepth(10000)
    container.setAlpha(0)
    container.setScale(0.2)
    targetObj._currentBubble = container

    // 1. 文本内容计算
    const txt = scene.add.text(12, -10, displayText, {
      fontSize: '13px',
      fontStyle: 'bold',
      color: isLike ? '#9f1239' : '#0369a1',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Segoe UI Emoji", "Noto Color Emoji", sans-serif',
      wordWrap: { width: 240 },
      align: 'left',
      padding: { x: 4, y: 4 }
    }).setOrigin(0, 0.5)

    // 2. 左侧表情大图标
    const iconText = scene.add.text(0, -10, icon, {
      fontSize: '22px',
      fontFamily: '"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif'
    }).setOrigin(0.5)

    // 3. 气泡整体尺寸与对齐
    const boxW = Math.max(96, txt.width + 46)
    const boxH = Math.max(34, txt.height + 12)
    const centerY = -10

    iconText.setPosition(-boxW / 2 + 18, centerY)
    txt.setPosition(-boxW / 2 + 34, centerY)

    // 4. 底板圆角矩形
    const bg = scene.add.rectangle(0, centerY, boxW, boxH, bgFill, 0.98)
    bg.setStrokeStyle(2.5, themeColor, 0.95)

    // 5. 向下指向尖角（准确落在角色头顶中央）
    const beak = scene.add.triangle(0, centerY + boxH / 2 + 2, -5, 0, 5, 0, 0, 6, themeColor)

    container.add([bg, beak, iconText, txt])

    // 6. 弹性弹出 + 图标欢快脉冲
    scene.tweens.add({
      targets: container,
      scaleX: 1,
      scaleY: 1,
      alpha: 1,
      duration: 280,
      ease: 'Back.easeOut',
      onComplete: () => {
        if (!container.active) return
        scene.tweens.add({
          targets: iconText,
          scaleX: 1.3,
          scaleY: 1.3,
          duration: 320,
          yoyo: true,
          repeat: 4,
          ease: 'Sine.easeInOut'
        })
      }
    })

    // 7. 跟随目标移动
    const followTimer = scene.time.addEvent({
      delay: 30,
      loop: true,
      callback: () => {
        if (!container.active) return
        if (targetObj.active !== undefined && !targetObj.active) {
          container.destroy()
          return
        }
        if (typeof targetObj.x === 'number' && typeof targetObj.y === 'number') {
          container.setPosition(targetObj.x, targetObj.y - 46)
        }
      }
    })

    container.on('destroy', () => {
      followTimer.remove(false)
      if (targetObj._currentBubble === container) {
        targetObj._currentBubble = null
      }
    })

    // 8. 停留整整 5 秒（5000ms），绝不会太快闪退
    scene.time.delayedCall(5000, () => {
      if (!container.active) return
      scene.tweens.add({
        targets: container,
        alpha: 0,
        y: container.y - 18,
        duration: 380,
        ease: 'Quad.easeIn',
        onComplete: () => {
          if (container.active) container.destroy()
        }
      })
    })
  }
}
