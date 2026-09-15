/**
 * GameTable.js
 * 奇幻游戏区交互游戏桌/街机物件
 * - 鼠标悬浮显示手型光标
 * - 玩家靠近 (< 95px) 自动浮现悬浮提示气泡
 * - 点击触发小游戏总线 (openMinigame)
 */
import Phaser from 'phaser'

const PROXIMITY_RADIUS = 95 // 靠近触发提示的气泡半径

export class GameTable extends Phaser.GameObjects.Container {
  constructor(scene, tableData, onInteractCallback) {
    super(scene, tableData.x, tableData.y)

    this.tableId     = tableData.id
    this.tableType   = tableData.type || 'table' // 'table' or 'arcade'
    this.title       = tableData.title || 'Type Rush'
    this.gameType    = tableData.gameType || 'TYPE_RUSH'
    this.tableColor  = tableData.color || 0x3498db
    this.icon        = tableData.icon || '🎲'
    this._onInteract = onInteractCallback
    this._scene      = scene
    this._isNearby   = false
    this._tableData  = tableData

    this._buildGraphics(scene)
    scene.add.existing(this)
    this.setDepth(6)

    // 交互区域设置
    const hitW = this.tableType === 'arcade' ? 64 : 96
    const hitH = this.tableType === 'arcade' ? 96 : 96
    this.setSize(hitW, hitH)
    this.setInteractive({ useHandCursor: true })

    this.on('pointerdown', (pointer, localX, localY, event) => {
      event?.stopPropagation?.()
      this._triggerInteract()
    })

    // 全局点击命中判定（优化微小偏移点击体验）
    this._pointerDownHandler = (pointer) => {
      const dist = Phaser.Math.Distance.Between(pointer.worldX, pointer.worldY, this.x, this.y)
      if (dist <= 55) {
        this._triggerInteract()
      }
    }
    scene.input.on('pointerdown', this._pointerDownHandler)

    this.on('destroy', () => {
      scene.input.off('pointerdown', this._pointerDownHandler)
    })
  }

  _buildGraphics(scene) {
    if (this._tableData.spriteKey) {
      // 2.5D 切图实体模式（高品质独立切图机台/桌子，带底座光晕与悬浮指示徽章）
      this.groundGlow = scene.add.ellipse(0, 24, 76, 26, this.tableColor, 0.35)
      this.tableSprite = scene.add.image(0, 0, this._tableData.spriteKey).setScale(0.85)

      this.badgeBg = scene.add.circle(0, -68, 15, 0x0f172a, 0.88)
      this.badgeBg.setStrokeStyle(1.5, this.tableColor, 0.95)
      this.centerIcon = scene.add.text(0, -68, this.icon, { fontSize: '15px' }).setOrigin(0.5)

      this.add([this.groundGlow, this.tableSprite, this.badgeBg, this.centerIcon])

      // 底盘光晕呼吸
      scene.tweens.add({
        targets: this.groundGlow,
        scaleX: 1.2,
        scaleY: 1.2,
        alpha: 0.15,
        duration: 1100,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      })

      // 顶部徽章悬浮上下微动
      scene.tweens.add({
        targets: [this.badgeBg, this.centerIcon],
        y: -74,
        duration: 900,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      })
    } else if (this.tableType === 'spot') {
      // 场景原画交互点（地面全息多层发光法阵 + 悬浮霓虹能量微标，与背景原画桌椅机台完美贴合）
      this.groundGlow = scene.add.ellipse(0, 12, 74, 28, this.tableColor, 0.4)
      this.groundRing = scene.add.ellipse(0, 12, 86, 34)
      this.groundRing.setStrokeStyle(2, this.tableColor, 0.85)
      this.innerRing = scene.add.ellipse(0, 12, 50, 20)
      this.innerRing.setStrokeStyle(1.5, 0xffffff, 0.6)

      // 悬浮交互徽章
      this.badgeBg = scene.add.circle(0, -32, 18, 0x090d16, 0.9)
      this.badgeBg.setStrokeStyle(2, this.tableColor, 0.95)
      this.centerIcon = scene.add.text(0, -32, this.icon, { fontSize: '18px' }).setOrigin(0.5)

      this.add([this.groundGlow, this.groundRing, this.innerRing, this.badgeBg, this.centerIcon])

      // 光圈呼吸与微旋转动效
      scene.tweens.add({
        targets: [this.groundGlow, this.groundRing],
        scaleX: 1.15,
        scaleY: 1.15,
        alpha: 0.25,
        duration: 1200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      })

      scene.tweens.add({
        targets: this.innerRing,
        scaleX: 0.85,
        scaleY: 0.85,
        alpha: 0.3,
        duration: 900,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      })

      scene.tweens.add({
        targets: [this.badgeBg, this.centerIcon],
        y: -40,
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      })
    } else if (this.tableType === 'arcade') {
      // 1. 机台脚底投影
      this.shadow = scene.add.ellipse(0, 44, 66, 18, 0x000000, 0.35).setDepth(1)

      // 2. 街机机台多层立体外壳
      this.baseOuter = scene.add.rectangle(0, 0, 62, 98, 0x0f172a).setDepth(2)
      this.base = scene.add.rectangle(0, 0, 56, 92, 0x1e293b).setDepth(3)
      this.screenGlow = scene.add.rectangle(0, -18, 48, 44, 0x10b981, 0.25).setDepth(4)
      this.screen = scene.add.rectangle(0, -18, 44, 40, 0x064e3b, 0.95).setDepth(5)
      this.screenLine = scene.add.rectangle(0, -18, 42, 2, 0x34d399, 0.8).setDepth(6) // 扫描线

      // 扫描线上下滚动动画
      scene.tweens.add({
        targets: this.screenLine,
        y: -36,
        duration: 1600,
        yoyo: true,
        repeat: -1,
        ease: 'Linear'
      })

      this.controlPanel = scene.add.rectangle(0, 16, 50, 18, 0x334155).setDepth(6)
      this.joystick = scene.add.circle(-12, 14, 4, 0xef4444).setDepth(7)
      this.btnA = scene.add.circle(6, 12, 3, 0xfbbf24).setDepth(7)
      this.btnB = scene.add.circle(16, 16, 3, 0x38bdf8).setDepth(7)
      this.header = scene.add.text(0, -38, '⚡ ARCADE ⚡', {
        fontSize: '8px', fontStyle: 'bold', color: '#fef08a'
      }).setOrigin(0.5).setDepth(7)

      this.add([this.shadow, this.baseOuter, this.base, this.screenGlow, this.screen, this.screenLine, this.controlPanel, this.joystick, this.btnA, this.btnB, this.header])
    } else {
      // 科技感圆形游戏桌造型
      this.shadow = scene.add.ellipse(0, 16, 88, 30, 0x000000, 0.35).setDepth(1)
      this.outerGlow = scene.add.circle(0, 0, 50, this.tableColor, 0.25).setDepth(2)
      this.tableBodyOuter = scene.add.circle(0, 0, 45, 0xffffff, 0.85).setDepth(3)
      this.tableBody = scene.add.circle(0, 0, 42, this.tableColor, 0.95).setDepth(4)
      this.tableCenter = scene.add.circle(0, 0, 26, 0x0f172a, 0.8).setDepth(5)
      this.rim = scene.add.circle(0, 0, 42).setStrokeStyle(3, 0xffffff, 0.7).setDepth(6)

      // 全息悬浮旋转骰子/图标
      this.centerIcon = scene.add.text(0, -4, this.icon, { fontSize: '26px' }).setOrigin(0.5).setDepth(7)

      this.add([this.shadow, this.outerGlow, this.tableBodyOuter, this.tableBody, this.tableCenter, this.rim, this.centerIcon])

      // 呼吸发光动画
      scene.tweens.add({
        targets: this.outerGlow,
        scaleX: 1.15,
        scaleY: 1.15,
        alpha: 0.45,
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      })

      // 图标全息轻微悬浮
      scene.tweens.add({
        targets: this.centerIcon,
        y: -10,
        duration: 900,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      })
    }

    // 靠近提示标签（初始隐藏）
    const promptY = this._tableData?.spriteKey ? -90 : -62
    this.promptBubble = scene.add.container(0, promptY)
    const bubbleBg = scene.add.rectangle(0, 0, 160, 28, 0x0f172a, 0.92)
    bubbleBg.setStrokeStyle(1.5, 0x38bdf8, 0.9)
    const bubbleText = scene.add.text(0, 0, `${this.icon} 点击开始挑战`, {
      fontSize: '11px',
      color: '#38bdf8',
      fontStyle: 'bold'
    }).setOrigin(0.5)
    this.promptBubble.add([bubbleBg, bubbleText])
    this.promptBubble.setAlpha(0)
    this.promptBubble.setDepth(15)
    this.add(this.promptBubble)
  }

  updateProximity(px, py) {
    const dist = Phaser.Math.Distance.Between(px, py, this.x, this.y)
    const nearby = dist <= PROXIMITY_RADIUS

    if (nearby !== this._isNearby) {
      this._isNearby = nearby
      const basePromptY = this._tableData?.spriteKey ? -90 : -62
      const activePromptY = this._tableData?.spriteKey ? -96 : -68
      this._scene.tweens.killTweensOf(this.promptBubble)
      this._scene.tweens.add({
        targets: this.promptBubble,
        alpha: nearby ? 1 : 0,
        y: nearby ? activePromptY : basePromptY,
        duration: 250,
        ease: 'Power2'
      })
    }
  }

  _triggerInteract() {
    if (this._onInteract) {
      this._onInteract({
        id: this.tableId,
        gameType: this.gameType,
        title: this.title
      })
    }
  }
}
