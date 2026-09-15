/**
 * Portal.js
 * 洛克王国风格场景传送门（光圈 + 悬浮标牌 + 动画粒子特效）
 */
import Phaser from 'phaser'

const TRIGGER_RADIUS = 50 // 触发传送的距离判定

export class Portal extends Phaser.GameObjects.Container {
  constructor(scene, portalData, onTeleportCallback) {
    super(scene, portalData.x, portalData.y)

    this.portalId    = portalData.id
    this.targetMapId = portalData.targetMapId
    this.targetSpawn = portalData.targetSpawn
    this.label       = portalData.label
    this.color       = portalData.color || 0x27ae60
    this._onTeleport = onTeleportCallback
    // 刚进入新地图时启动 1.5 秒初始保护冷却，防止玩家生成时立刻再次触发传送
    this._cooldown   = true
    setTimeout(() => {
      this._cooldown = false
    }, 1500)

    this._buildGraphics(scene)
    scene.add.existing(this)
    this.setDepth(5)
  }

  _buildGraphics(scene) {
    // 1. 地面发光传送光圈（椭圆底座）
    this.baseCircle = scene.add.ellipse(0, 12, 84, 46, this.color, 0.35)

    // 2. 外圈呼吸光环
    this.ring = scene.add.ellipse(0, 12, 100, 56)
    this.ring.setStrokeStyle(3, this.color, 0.85)

    // 3. 传送门中心星芒/光斑
    this.core = scene.add.circle(0, 12, 9, 0xffffff, 0.9)

    // 4. 头顶悬浮发光文字标牌（洛克王国式指向牌）
    this.sign = scene.add.text(0, -32, this.label, {
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#ffffff',
      backgroundColor: '#111827dd',
      padding: { x: 10, y: 5 },
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5, 0.5)

    this.add([this.baseCircle, this.ring, this.core, this.sign])

    // 呼吸波动动画
    scene.tweens.add({
      targets: this.ring,
      scaleX: 1.15,
      scaleY: 1.15,
      alpha: 0.3,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })

    // 星芒旋转动画
    scene.tweens.add({
      targets: this.core,
      angle: 360,
      duration: 4000,
      repeat: -1,
      ease: 'Linear'
    })

    // 悬浮标牌上下漂浮
    scene.tweens.add({
      targets: this.sign,
      y: -38,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })
  }

  /**
   * 由 Scene update 循环调用，检查玩家是否走进光圈
   */
  checkOverlap(playerX, playerY) {
    if (this._cooldown) return false
    const dist = Phaser.Math.Distance.Between(playerX, playerY, this.x, this.y + 12)
    if (dist < TRIGGER_RADIUS) {
      this.trigger()
      return true
    }
    return false
  }

  /**
   * 触发传送
   */
  trigger() {
    if (this._cooldown) return
    this._cooldown = true
    if (this._onTeleport) {
      this._onTeleport(this)
    }
    // 冷却 2 秒防止在门边来回反复触发
    setTimeout(() => {
      this._cooldown = false
    }, 2000)
  }
}
