/**
 * RemotePlayer.js
 * 其他玩家的 Avatar，接收位置广播 + 线性插值平滑移动
 */
import Phaser from 'phaser'

const LERP = 0.18 // 插值速度，越大越"追得快"

export class RemotePlayer extends Phaser.GameObjects.Container {
  constructor(scene, data) {
    super(scene, data.x, data.y)
    this.userId = data.userId
    this.nickname = data.nickname
    this.targetX = data.x
    this.targetY = data.y

    this._buildGraphics(scene)
    scene.add.existing(this)
    this.setDepth(9)

    // 交互区域设置：鼠标悬停手型光标，点击弹出玩家名片
    this.setSize(38, 52)
    this.setInteractive({ useHandCursor: true })
    this.on('pointerdown', (pointer, localX, localY, event) => {
      event?.stopPropagation?.()
      scene._onRemotePlayerClick(this)
    })
  }

  _buildGraphics(scene) {
    // 1. 脚底阴影
    this.shadow = scene.add.ellipse(0, 14, 26, 10, 0x000000, 0.28)

    // 2. 身体 Avatar 主体（外圈橙金边 + 渐变橙主体）
    this.circleOuter = scene.add.circle(0, 0, 17, 0xffedd5, 0.9)
    this.circle = scene.add.circle(0, 0, 15, 0xe27c4a)
    this.circleInner = scene.add.circle(-4, -4, 4, 0xfed7aa, 0.8)

    this.label = scene.add.text(0, 22, this.nickname, {
      fontSize: '11px',
      color: '#fff',
      backgroundColor: '#00000088',
      padding: { x: 5, y: 2 }
    }).setOrigin(0.5, 0)

    this.add([this.shadow, this.circleOuter, this.circle, this.circleInner, this.label])
  }

  setTarget(x, y) {
    this.targetX = x
    this.targetY = y
  }

  update() {
    // 线性插值平滑移动
    this.x = Phaser.Math.Linear(this.x, this.targetX, LERP)
    this.y = Phaser.Math.Linear(this.y, this.targetY, LERP)
  }

  destroy(fromScene) {
    super.destroy(fromScene)
  }
}
