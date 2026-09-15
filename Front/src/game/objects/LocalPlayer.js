/**
 * LocalPlayer.js
 * 本地玩家 Avatar：WASD 控制 + 位置广播（节流 100ms）
 */
import Phaser from 'phaser'

const SPEED = 160            // 像素/秒
const BROADCAST_INTERVAL = 100 // ms，广播节流

export class LocalPlayer extends Phaser.GameObjects.Container {
  constructor(scene, x, y, userId, nickname) {
    super(scene, x, y)
    this.userId = userId
    this.nickname = nickname
    this._lastBroadcast = 0
    this._lastDirection = 'down'
    this._moving = false

    this._buildGraphics(scene)
    scene.add.existing(this)
    scene.physics.add.existing(this)
    this.body.setCollideWorldBounds(true)
    this.body.setSize(28, 28)

    // 仅监听方向键与 WASD，传入 false 明确禁用 Phaser 全局 capture（防止 preventDefault 拦截空格键等）
    this.cursors = scene.input.keyboard.addKeys({
      up:    Phaser.Input.Keyboard.KeyCodes.UP,
      down:  Phaser.Input.Keyboard.KeyCodes.DOWN,
      left:  Phaser.Input.Keyboard.KeyCodes.LEFT,
      right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
    }, false)

    this.wasd = scene.input.keyboard.addKeys({
      up:    Phaser.Input.Keyboard.KeyCodes.W,
      down:  Phaser.Input.Keyboard.KeyCodes.S,
      left:  Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    }, false)

    if (scene.input?.keyboard) {
      scene.input.keyboard.clearCaptures?.()
      scene.input.keyboard.disableGlobalCapture?.()
    }
  }

  _buildGraphics(scene) {
    // 1. 脚底半透明真实透视椭圆投影
    this.shadow = scene.add.ellipse(0, 14, 26, 10, 0x000000, 0.28)

    // 2. 身体 Avatar 主体（外圈高光白边 + 渐变蓝主体）
    this.circleOuter = scene.add.circle(0, 0, 17, 0xffffff, 0.9)
    this.circle = scene.add.circle(0, 0, 15, 0x2563eb)
    this.circleInner = scene.add.circle(-4, -4, 4, 0x93c5fd, 0.8) // 头顶微高光点

    // 3. 方向指示三角（金色光晕）
    this.arrow = scene.add.triangle(0, -22, -6, 0, 6, 0, 0, -13, 0xfbbf24)

    // 4. 角色昵称勋章卡
    this.label = scene.add.text(0, 22, `⭐ ${this.nickname}`, {
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#ffffff',
      backgroundColor: '#0f172acc',
      padding: { x: 6, y: 2 }
    }).setOrigin(0.5, 0)

    this.add([this.shadow, this.circleOuter, this.circle, this.circleInner, this.arrow, this.label])
    this.setDepth(10)
  }

  update(time, delta, onMove) {
    const body = this.body
    body.setVelocity(0)

    // 当用户正在网页输入框中打字时，不响应键盘移动
    const activeTag = document.activeElement?.tagName
    if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') {
      return
    }

    const up    = this.cursors.up.isDown    || this.wasd.up.isDown
    const down  = this.cursors.down.isDown  || this.wasd.down.isDown
    const left  = this.cursors.left.isDown  || this.wasd.left.isDown
    const right = this.cursors.right.isDown || this.wasd.right.isDown

    let direction = this._lastDirection
    let moving = false

    if (left)  { body.setVelocityX(-SPEED); direction = 'left';  moving = true }
    if (right) { body.setVelocityX(SPEED);  direction = 'right'; moving = true }
    if (up)    { body.setVelocityY(-SPEED); direction = 'up';    moving = true }
    if (down)  { body.setVelocityY(SPEED);  direction = 'down';  moving = true }

    // 斜向归一化
    if ((left || right) && (up || down)) {
      body.velocity.normalize().scale(SPEED)
    }

    // 更新箭头朝向
    this._updateArrow(direction)
    this._lastDirection = direction
    this._moving = moving

    // 行走时身体轻微上下起伏微动感（每步微颤）
    if (moving) {
      const bounce = Math.sin(time * 0.018) * 2
      this.circleOuter.y = bounce
      this.circle.y = bounce
      this.circleInner.y = bounce - 4
      this.arrow.y = -22 + bounce
    } else {
      this.circleOuter.y = 0
      this.circle.y = 0
      this.circleInner.y = -4
      this.arrow.y = -22
    }

    // 节流广播
    if (moving && time - this._lastBroadcast > BROADCAST_INTERVAL) {
      this._lastBroadcast = time
      onMove(this.x, this.y, direction)
    }
  }

  _updateArrow(direction) {
    const angles = { up: 0, down: 180, left: -90, right: 90 }
    this.arrow.setAngle(angles[direction] || 0)
  }

  get pos() {
    return { x: this.x, y: this.y }
  }
}
