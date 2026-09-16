/**
 * NpcSprite.js
 * NPC 精灵：显示在地图上，靠近时高亮提示，点击触发对话
 */
import Phaser from 'phaser'

const CLICK_RADIUS = 60 // 点击命中半径（像素）

export class NpcSprite extends Phaser.GameObjects.Container {
  constructor(scene, npcData, onClickCallback) {
    super(scene, npcData.posX, npcData.posY)
    this.npcKey   = npcData.npcKey
    this.npcName  = npcData.name
    this.taskId   = npcData.taskId
    this.npcColor = npcData.color || 0xe74c3c
    this.npcBadge = npcData.badge || '✦'
    this._onClick = onClickCallback
    this._scene   = scene

    this._buildGraphics(scene)
    scene.add.existing(this)
    this.setDepth(8)

    // 交互区域设置，鼠标悬浮显示手型
    this.setSize(70, 70)
    this.setInteractive({ useHandCursor: true })
    this.on('pointerdown', (pointer, localX, localY, event) => {
      event?.stopPropagation?.()
      if (this._onClick) {
        this._onClick(this)
      }
    })

    // 全局兜底点击检测
    this._pointerDownHandler = (pointer) => {
      const worldX = pointer.worldX
      const worldY = pointer.worldY
      const dist = Phaser.Math.Distance.Between(worldX, worldY, this.x, this.y)
      if (dist <= CLICK_RADIUS && this._onClick) {
        this._onClick(this)
      }
    }
    scene.input.on('pointerdown', this._pointerDownHandler)

    // 销毁时解绑全局监听
    this.on('destroy', () => {
      scene.input.off('pointerdown', this._pointerDownHandler)
    })

    // 浮动动画
    scene.tweens.add({
      targets: this._innerGroup,
      y: -6,
      duration: 1200,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    })
  }

  _buildGraphics(scene) {
    // 1. 脚底半透明透视投影
    this.shadow = scene.add.ellipse(0, 22, 40, 14, 0x000000, 0.3)

    // 2. 外围神圣金色光环（呼吸脉冲）
    this.outerHalo = scene.add.circle(0, 0, 32, this.npcColor, 0.22)
    scene.tweens.add({
      targets: this.outerHalo,
      scaleX: 1.25,
      scaleY: 1.25,
      alpha: 0.1,
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })

    // 3. 悬浮动画容器组
    this._innerGroup = scene.add.container(0, 0)

    // NPC 头部/身体外框
    this.circleOuter = scene.add.circle(0, 0, 26, 0xffffff, 0.95)
    this.circle = scene.add.circle(0, 0, 23, this.npcColor)
    this.circleHighlight = scene.add.circle(-6, -6, 6, 0xffffff, 0.4) // 高光面

    // 4. 徽章造型
    this.badge = scene.add.text(0, 0, this.npcBadge, {
      fontSize: '18px'
    }).setOrigin(0.5, 0.5)

    // 5. NPC 身份标识牌
    this.label = scene.add.text(0, 34, this.npcName, {
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#ffffff',
      backgroundColor: '#1e1b4bcc',
      padding: { x: 8, y: 3 }
    }).setOrigin(0.5, 0)

    this._innerGroup.add([this.circleOuter, this.circle, this.circleHighlight, this.badge, this.label])
    this.add([this.shadow, this.outerHalo, this._innerGroup])
  }

  /** 由 HallScene 每帧调用，靠近时高亮 + 显示提示 */
  updateProximity(playerX, playerY) {
    const dist = Phaser.Math.Distance.Between(playerX, playerY, this.x, this.y)
    const near = dist < 160

    // 靠近时圆形微放大、badge 显示气泡对话提示
    this.circle.setScale(near ? 1.15 : 1)
    this.badge.setText(near ? '···' : this.npcBadge)
  }
}
