/**
 * HallScene.js
 * 洛克王国风格独立全屏单场景管理器
 * 自动铺满整个页面视口，无缝边界、全屏装潢、发光传送门与 NPC 交互
 */
import Phaser from 'phaser'
import { LocalPlayer }  from '../objects/LocalPlayer.js'
import { RemotePlayer } from '../objects/RemotePlayer.js'
import { NpcSprite }    from '../objects/NpcSprite.js'
import { Portal }       from '../objects/Portal.js'
import { GameTable }    from '../objects/GameTable.js'
import { ChatBubble }   from '../objects/ChatBubble.js'
import { worldSocket }  from '../network/WorldSocket.js'
import { MAP_CONFIGS }  from '../config/maps.js'

export class HallScene extends Phaser.Scene {
  constructor() {
    super({ key: 'HallScene' })
    this._remotePlayers = new Map()   // userId → RemotePlayer
    this._unsubs = []                 // WebSocket 取消订阅函数列表
    this._npcDialogBus = null         // Vue 事件总线
    this._portals = []                // 当前地图的传送门列表
    this._npcs = []                   // 当前地图的 NPC 列表
    this._gameTables = []             // 当前地图的游戏桌/街机列表
    this._mapObjects = []             // 当前地图的背景装饰元素
    this._ySortedProps = []           // 2.5D 切图实体装饰（参与 Y 轴深度遮挡）
    this._bgImage = null              // 当前地图的 2.5D 手绘原画背景
    this._currentMapId = 'hall'       // 当前地图 ID
    this._currentMapConfig = null     // 当前地图配置
    this._isTransitioning = false     // 是否正在过图切换中
    this._mapW = 1200                 // 当前场景宽度（铺满视口）
    this._mapH = 800                  // 当前场景高度（铺满视口）
  }

  /** 从 Phaser registry 获取用户数据（由 GameManager 注入）*/
  init() {
    const userData     = this.registry.get('userData') || {}
    const npcDialogBus = this.registry.get('npcDialogBus')
    this._userId       = userData.userId
    this._nickname     = userData.nickname
    this._token        = userData.token
    this._npcDialogBus = npcDialogBus
  }

  create() {
    // 1. 初始化并铺满全屏加载阳光大厅
    this._loadMap('hall')

    // 2. 在阳光大厅红地毯前庭生成本地玩家
    const startX = Math.round(this._mapW * 0.50)
    const startY = Math.round(this._mapH * 0.72)
    this._createLocalPlayer(startX, startY)

    // 3. 网络与摄像机
    this._connectWebSocket()
    this._setupCamera()
    window.__linguaverse_hall_scene = this

    // 4. 点击游戏画布任意区域，自动让外部输入框失焦，恢复 WASD 控制
    this.input.on('pointerdown', () => {
      const el = document.activeElement
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) {
        el.blur()
      }
    })

    // 5. 窗口大小自适应
    this.scale.on('resize', (gameSize) => {
      this._onResize(gameSize.width, gameSize.height)
    })

    // 6. 通知世界与场景已就绪
    this.registry.get('onWorldReady')?.()
  }

  // ─── 视口尺寸计算 ─────────────────────────────────────────────────────────
  _getMapSize() {
    const W = Math.max(1000, this.scale.width || window.innerWidth)
    const H = Math.max(600, this.scale.height || window.innerHeight)
    return { W, H }
  }

  _onResize(newW, newH) {
    if (newW > 100 && newH > 100 && !this._isTransitioning) {
      this._mapW = newW
      this._mapH = newH
      this.physics.world.setBounds(0, 0, newW, newH)
      this.cameras.main.setBounds(0, 0, newW, newH)
      if (this._bgImage) {
        this._bgImage.setPosition(newW / 2, newH / 2)
        this._bgImage.setDisplaySize(newW, newH)
      }
    }
  }

  // ─── 场景切换核心逻辑（洛克王国式过图淡入淡出）────────────────────────────
  switchMap(targetMapId, spawnX, spawnY) {
    if (this._isTransitioning) return
    const targetConfig = MAP_CONFIGS[targetMapId]
    if (!targetConfig) {
      console.warn(`[HallScene] 地图 ${targetMapId} 未配置`)
      return
    }

    this._isTransitioning = true
    if (this._localPlayer?.body) {
      this._localPlayer.body.setVelocity(0)
    }

    this._showSystemTip(`Entering ${targetConfig.name}... 🚪`)

    // 1. 镜头淡出（300ms）
    this.cameras.main.fadeOut(300, 0, 0, 0)
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      // 2. 清理旧场景对象（NPC、传送门、旧地图装饰、其他玩家）
      this._clearCurrentMap()

      // 3. 渲染新场景与新物件（自动铺满当前全屏视口）
      this._loadMap(targetMapId, spawnX, spawnY)

      // 4. 重置本地角色位置
      const actualX = spawnX !== undefined ? spawnX : Math.round(this._mapW * 0.16)
      const actualY = spawnY !== undefined ? spawnY : Math.round(this._mapH * 0.55)
      if (this._localPlayer) {
        this._localPlayer.setPosition(actualX, actualY)
        this._localPlayer.body.reset(actualX, actualY)
      }

      // 5. 通知后端 WebSocket 切换房间
      worldSocket.sendChangeMap(targetMapId, actualX, actualY)

      // 6. 通知 Vue 层更新当前地图信息
      if (this._npcDialogBus?.onMapChanged) {
        this._npcDialogBus.onMapChanged(targetConfig, this._mapW, this._mapH)
      }

      // 7. 镜头淡入（300ms）
      this.cameras.main.fadeIn(300, 0, 0, 0)
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_IN_COMPLETE, () => {
        this._isTransitioning = false
      })
    })
  }

  // ─── 清除当前地图对象 ──────────────────────────────────────────────────────
  _clearCurrentMap() {
    if (this._bgImage) {
      this._bgImage.destroy()
      this._bgImage = null
    }

    this._portals.forEach(p => p.destroy())
    this._portals = []

    this._npcs.forEach(n => n.destroy())
    this._npcs = []

    this._gameTables.forEach(t => t.destroy())
    this._gameTables = []

    this._mapObjects.forEach(obj => obj.destroy())
    this._mapObjects = []

    this._ySortedProps.forEach(obj => obj.destroy())
    this._ySortedProps = []

    this._remotePlayers.forEach(rp => rp.destroy())
    this._remotePlayers.clear()
  }

  // ─── 加载指定地图（铺满当前屏幕） ─────────────────────────────────────────
  _loadMap(mapId, spawnX, spawnY) {
    const config = MAP_CONFIGS[mapId] || MAP_CONFIGS['hall']
    this._currentMapId = config.mapId
    this._currentMapConfig = config

    // 动态获取当前全屏尺寸
    const { W, H } = this._getMapSize()
    this._mapW = W
    this._mapH = H

    // 设置物理世界边界与摄像机边界
    this.physics.world.setBounds(0, 0, W, H)
    this.cameras.main.setBounds(0, 0, W, H)

    // 绘制铺满全屏的特色背景与装潢
    if (config.mapId === 'hall') {
      this._drawSunshineHall(config, W, H)
      this._createHallPortals(W, H)
      this._createHallNpcs(W, H)
    } else if (config.mapId === 'game_zone') {
      this._drawGameZone(config, W, H)
      this._createGameZonePortals(W, H)
      this._createGameZoneNpcs(W, H)
    }

    if (this._npcDialogBus?.onMapChanged) {
      this._npcDialogBus.onMapChanged(config, W, H)
    }
  }

  // ─── 地图绘制：阳光大厅（2.5D 立体分层切图系统）────────────────────────
  _drawSunshineHall(config, W, H) {
    // 1. 铺底：2.5D 欧式大厅手绘原画大底
    this._bgImage = this.add.image(W / 2, H / 2, 'map_hall').setDepth(0)
    this._bgImage.setDisplaySize(W, H)

    // 2. 晨曦丁达尔神圣斜射光束（God Rays, 柔光漫射）
    const rayLeft = this.add.image(Math.round(W * 0.18), Math.round(H * 0.32), 'prop_ray_sunlight')
      .setDepth(15).setOrigin(0.2, 0).setAlpha(0.25).setBlendMode(Phaser.BlendModes.ADD)
    const rayRight = this.add.image(Math.round(W * 0.82), Math.round(H * 0.32), 'prop_ray_sunlight')
      .setDepth(15).setOrigin(0.8, 0).setAlpha(0.25).setBlendMode(Phaser.BlendModes.ADD).setFlipX(true)
    this._mapObjects.push(rayLeft, rayRight)
    this.tweens.add({ targets: [rayLeft, rayRight], alpha: 0.12, duration: 3200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })

    // 3. 2.5D 深度实体切片（Y-Sorted Props）：罗马立柱、迎宾前台、盆栽与丝绒长椅
    // (1) 左右立柱长廊 (Pillars)
    const pillarPositions = [
      { x: Math.round(W * 0.18), y: Math.round(H * 0.46) },
      { x: Math.round(W * 0.18), y: Math.round(H * 0.70) },
      { x: Math.round(W * 0.18), y: Math.round(H * 0.94) },
      { x: Math.round(W * 0.82), y: Math.round(H * 0.46) },
      { x: Math.round(W * 0.82), y: Math.round(H * 0.70) },
      { x: Math.round(W * 0.82), y: Math.round(H * 0.94) }
    ]
    for (const pos of pillarPositions) {
      const p = this.add.image(pos.x, pos.y, 'prop_pillar_marble').setOrigin(0.5, 0.95).setScale(0.8)
      p.depthY = pos.y
      this._ySortedProps.push(p)
    }

    // (2) 迎宾接待柜台 (Mary 专属柜台，置于 Mary 前方，形成自然的接待台半身遮挡)
    const counterX = Math.round(W * 0.36)
    const counterY = Math.round(H * 0.65)
    const counter = this.add.image(counterX, counterY, 'prop_counter_reception').setOrigin(0.5, 0.88).setScale(0.85)
    counter.depthY = counterY
    this._ySortedProps.push(counter)

    // 4. Layer 3: 顶空悬浮华丽水晶吊灯 (Overhead Foreground, Depth: 2200, 角色从下方穿梭)
    const chandeliers = [
      { x: Math.round(W * 0.36), y: Math.round(H * 0.16), scale: 1.0, swing: 2 },
      { x: Math.round(W * 0.50), y: Math.round(H * 0.12), scale: 1.2, swing: -2 },
      { x: Math.round(W * 0.64), y: Math.round(H * 0.16), scale: 1.0, swing: 2 }
    ]
    for (const ch of chandeliers) {
      const lamp = this.add.image(ch.x, ch.y, 'prop_chandelier_crystal')
        .setDepth(2200).setOrigin(0.5, 0).setScale(ch.scale)
      this._mapObjects.push(lamp)
      this.tweens.add({
        targets: lamp,
        angle: { from: -ch.swing, to: ch.swing },
        duration: Phaser.Math.Between(2600, 3400),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      })
    }

    // 5. 顶部典雅场景招牌（半透明金边微透）
    const signBox = this.add.rectangle(W / 2, 38, 380, 36, 0x1f1610, 0.75).setDepth(2210)
    signBox.setStrokeStyle(1.5, 0xf59e0b, 0.7)
    const sign = this.add.text(W / 2, 38, '☀️ SUNSHINE HALL · 阳光大厅', {
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#fef08a',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5).setDepth(2211)
    this._mapObjects.push(signBox, sign)

    // 6. 空气中漂浮的金色晨曦微尘光点（沉浸式光照氛围粒子）
    for (let i = 0; i < 28; i++) {
      const rx = Phaser.Math.Between(40, W - 40)
      const ry = Phaser.Math.Between(80, H - 40)
      const mote = this.add.circle(rx, ry, Phaser.Math.Between(1.5, 3.5), 0xfef08a, 0.55).setDepth(20)
      this._mapObjects.push(mote)

      this.tweens.add({
        targets: mote,
        y: ry - Phaser.Math.Between(30, 80),
        x: rx + Phaser.Math.Between(-20, 20),
        alpha: 0.1,
        duration: Phaser.Math.Between(2500, 5000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      })
    }
  }

  _createHallPortals(W, H) {
    // 阳光大厅通往奇幻游戏区传送门：精准坐落在红地毯尽头的高台金色太阳法阵上（W * 0.50, H * 0.39）
    const portalData = {
      id: 'portal_to_game_zone',
      x: Math.round(W * 0.50),
      y: Math.round(H * 0.39),
      targetMapId: 'game_zone',
      targetSpawn: { x: Math.round(W * 0.50), y: Math.round(H * 0.78) },
      label: '🎮 奇幻游戏区 ➜',
      color: 0x8b5cf6
    }
    const portal = new Portal(this, portalData, (p) => {
      this.switchMap(p.targetMapId, p.targetSpawn.x, p.targetSpawn.y)
    })
    this._portals.push(portal)
  }

  _createHallNpcs(W, H) {
    // Mary 站在大厅中央迎宾接待柜台正后方（W * 0.36, H * 0.56）
    const mx = Math.round(W * 0.36)
    const my = Math.round(H * 0.56)
    const maryData = {
      npcKey: 'mary_guide',
      name: 'Mary',
      posX: mx,
      posY: my,
      taskId: 1,
      color: 0xe74c3c,
      badge: '⭐'
    }
    const npc = new NpcSprite(this, maryData, (targetNpc) => {
      this._onNpcClick(targetNpc)
    })
    this._npcs.push(npc)
  }

  // ─── 地图绘制：奇幻游戏区（2.5D 切图机台与霓虹街机系统）────────────────────
  _drawGameZone(config, W, H) {
    // 1. 铺底：2.5D 奇幻游戏区手绘原画背景
    this._bgImage = this.add.image(W / 2, H / 2, 'map_game_zone').setDepth(0)
    this._bgImage.setDisplaySize(W, H)

    // 2. 顶部霓虹全息广告招牌（悬浮微透）
    const signBox = this.add.rectangle(W / 2, 38, 420, 36, 0x110926, 0.8).setDepth(2210)
    signBox.setStrokeStyle(1.5, 0xc084fc, 0.8)
    const sign = this.add.text(W / 2, 38, '🎮 FANTASY ARCADE · 奇幻游戏区', {
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#f0abfc',
      stroke: '#3b0764',
      strokeThickness: 2
    }).setOrigin(0.5).setDepth(2211)
    this._mapObjects.push(signBox, sign)

    // 招牌微弱呼吸动效
    this.tweens.add({
      targets: signBox,
      alpha: 0.65,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })

    // 3. 场景原画原生交互点位系统（Spot 模式：全息光圈 + 悬浮徽章，与背景原画桌椅机台完美贴合，无重影）
    const stations = [
      // 左侧魔法卡牌桌（背景原画中左侧圆桌）
      { id: 'station_table_left', type: 'spot', x: Math.round(W * 0.17), y: Math.round(H * 0.61), color: 0x8b5cf6, icon: '🔮', title: 'Word Chain · 灵语牌桌', gameType: 'WORD_CHAIN' },
      // 右侧魔法棋盘桌（背景原画中右侧圆桌）
      { id: 'station_table_right', type: 'spot', x: Math.round(W * 0.85), y: Math.round(H * 0.62), color: 0xa855f7, icon: '⛓️', title: 'Word Chain · 连环棋盘', gameType: 'WORD_CHAIN' },
      // 左侧水晶街机（背景原画中左侧 Astra 街机）
      { id: 'station_arcade_left', type: 'spot', x: Math.round(W * 0.31), y: Math.round(H * 0.40), color: 0x38bdf8, icon: '🕹️', title: 'Type Rush · 幻星街机', gameType: 'TYPE_RUSH' },
      // 右侧星际街机（背景原画中右侧 Cosmic 街机）
      { id: 'station_arcade_right', type: 'spot', x: Math.round(W * 0.68), y: Math.round(H * 0.40), color: 0xf43f5e, icon: '🕹️', title: 'Type Rush · 宇宙街机', gameType: 'TYPE_RUSH' },
      // 中央巨大符文法阵核心挑战台
      { id: 'station_rune_center', type: 'spot', x: Math.round(W * 0.50), y: Math.round(H * 0.68), color: 0xec4899, icon: '🎯', title: 'Type Rush · 符文挑战', gameType: 'TYPE_RUSH' }
    ]

    for (const s of stations) {
      const gameObj = new GameTable(this, s, (info) => this._onGameTableClick(info))
      this._gameTables.push(gameObj)
    }

    // 5. 漂浮在空中的魔法星光与赛博荧光微粒（Starlight & Cyber Sparks）
    for (let i = 0; i < 28; i++) {
      const rx = Phaser.Math.Between(40, W - 40)
      const ry = Phaser.Math.Between(60, H - 40)
      const isCyan = i % 2 === 0
      const sparkColor = isCyan ? 0x22d3ee : 0xc084fc
      const spark = this.add.circle(rx, ry, Phaser.Math.Between(1.5, 3.5), sparkColor, 0.65).setDepth(20)
      this._mapObjects.push(spark)

      this.tweens.add({
        targets: spark,
        y: ry - Phaser.Math.Between(20, 60),
        x: rx + Phaser.Math.Between(-30, 30),
        alpha: 0.15,
        duration: Phaser.Math.Between(2000, 4500),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      })
    }
  }

  _createGameZonePortals(W, H) {
    // 奇幻游戏区返回大厅传送门：精准坐落在底部正中央拱门传送门入口处（W * 0.50, H * 0.93）
    const portalData = {
      id: 'portal_to_hall',
      x: Math.round(W * 0.50),
      y: Math.round(H * 0.93),
      targetMapId: 'hall',
      targetSpawn: { x: Math.round(W * 0.50), y: Math.round(H * 0.56) },
      label: '➜ ☀️ 阳光大厅',
      color: 0xf59e0b
    }
    const portal = new Portal(this, portalData, (p) => {
      this.switchMap(p.targetMapId, p.targetSpawn.x, p.targetSpawn.y)
    })
    this._portals.push(portal)
  }

  _createGameZoneNpcs(W, H) {
    // Luna 精准坐落在中央巨大发光符文法阵中心
    const lx = Math.round(W * 0.50)
    const ly = Math.round(H * 0.56)
    const lunaData = {
      npcKey: 'luna_friend',
      name: 'Luna',
      posX: lx,
      posY: ly,
      taskId: 2,
      color: 0x8e44ad,
      badge: '💜'
    }
    const npc = new NpcSprite(this, lunaData, (targetNpc) => {
      this._onNpcClick(targetNpc)
    })
    this._npcs.push(npc)
  }

  // ─── 本地玩家 ─────────────────────────────────────────────────────────────
  _createLocalPlayer(x, y) {
    this._localPlayer = new LocalPlayer(
      this, x, y, this._userId, this._nickname
    )
  }

  // ─── 摄像机配置 ───────────────────────────────────────────────────────────
  _setupCamera() {
    this.cameras.main.setBounds(0, 0, this._mapW, this._mapH)
    this.cameras.main.startFollow(this._localPlayer, true, 0.1, 0.1)
    this.cameras.main.setZoom(1)
  }

  // ─── NPC 点击交互 ─────────────────────────────────────────────────────────
  _onNpcClick(npc) {
    if (this._isTransitioning) return
    if (!this._localPlayer) return
    const dist = Phaser.Math.Distance.Between(
      this._localPlayer.x, this._localPlayer.y, npc.x, npc.y
    )
    console.log('[HallScene] 点击 NPC:', npc.npcName, '距离:', Math.round(dist), 'taskId:', npc.taskId)
    if (dist > 300) {
      this._showSystemTip(`🚶 Walk closer to ${npc.npcName}!`)
      return
    }
    // 通知 Vue 层打开对话框
    if (this._npcDialogBus) {
      this._npcDialogBus.open({ npcKey: npc.npcKey, npcName: npc.npcName, taskId: npc.taskId })
    }
    worldSocket.sendNpcStart(npc.taskId)
  }

  // ─── 游戏桌 / 街机点击交互 ────────────────────────────────────────────────
  _onGameTableClick(tableInfo) {
    if (this._isTransitioning) return
    console.log('[HallScene] 点击游戏桌/街机:', tableInfo)
    if (this._npcDialogBus?.openMinigame) {
      this._npcDialogBus.openMinigame(tableInfo)
    }
  }

  // ─── WebSocket 事件处理 ───────────────────────────────────────────────────
  _connectWebSocket() {
    worldSocket.connect(this._token)

    this._unsubs = [
      worldSocket.on('PLAYER_UPDATE', (msg) => this._handlePlayerUpdate(msg)),
      worldSocket.on('PLAYER_JOIN',   (msg) => this._handlePlayerUpdate(msg)),
      worldSocket.on('PLAYER_LEAVE',  (msg) => this._handlePlayerLeave(msg)),
      worldSocket.on('SPATIAL_CHAT',  (msg) => this._handleSpatialChat(msg)),
      worldSocket.on('SPATIAL_EMOTE', (msg) => this._handleSpatialEmote(msg)),
      worldSocket.on('PLAYER_INTERACT', (msg) => this._handlePlayerInteract(msg)),
      worldSocket.on('NPC_SPEAK_CHUNK', (msg) => {
        if (this._npcDialogBus) this._npcDialogBus.onChunk(msg)
      }),
      worldSocket.on('TASK_RESULT', (msg) => {
        if (this._npcDialogBus) this._npcDialogBus.onTaskResult(msg)
      }),
    ]
  }

  _handlePlayerUpdate(msg) {
    if (Number(msg.userId) === Number(this._userId)) return
    const uid = Number(msg.userId)

    // 房间隔离：非当前地图的玩家不同步渲染
    if (msg.mapId && msg.mapId !== this._currentMapId) {
      this._handlePlayerLeave(msg)
      return
    }

    if (this._remotePlayers.has(uid)) {
      this._remotePlayers.get(uid).setTarget(msg.x, msg.y)
    } else {
      const rp = new RemotePlayer(this, msg)
      this._remotePlayers.set(uid, rp)
    }
  }

  _handlePlayerLeave(msg) {
    const uid = Number(msg.userId)
    const rp = this._remotePlayers.get(uid)
    if (rp) {
      rp.destroy()
      this._remotePlayers.delete(uid)
    }
  }

  _handleSpatialChat(msg) {
    // 如果是自己发出的聊天回执，本地早已优先展示过，此处直接跳过
    if (Number(msg.userId) === Number(this._userId)) return

    const uid = Number(msg.userId)
    let speaker = this._remotePlayers.get(uid)
    if (!speaker) {
      for (const [k, rp] of this._remotePlayers.entries()) {
        if (Number(k) === uid || Number(rp.userId) === uid) {
          speaker = rp
          break
        }
      }
    }
    if (!speaker && msg.x !== undefined && msg.y !== undefined) {
      speaker = { x: Number(msg.x), y: Number(msg.y) }
    }

    if (speaker) {
      ChatBubble.show(this, speaker, `${msg.nickname || 'Player'}: ${msg.content}`, () => ({
        x: this._localPlayer?.x || 0, y: this._localPlayer?.y || 0
      }))
    }
  }

  _handleSpatialEmote(msg) {
    if (Number(msg.userId) === Number(this._userId)) return

    const uid = Number(msg.userId)
    let speaker = this._remotePlayers.get(uid)
    if (!speaker) {
      for (const [k, rp] of this._remotePlayers.entries()) {
        if (Number(k) === uid || Number(rp.userId) === uid) {
          speaker = rp
          break
        }
      }
    }
    if (!speaker && msg.x !== undefined && msg.y !== undefined) {
      speaker = { x: Number(msg.x), y: Number(msg.y) }
    }

    if (speaker) {
      ChatBubble.showEmote(this, speaker, msg.emote, () => ({
        x: this._localPlayer?.x || 0, y: this._localPlayer?.y || 0
      }))
    }
  }

  // 本地主动发送空间聊天（自身头顶即刻弹出文本气泡，并向服务端广播）
  sendSpatialChat(content) {
    if (this._localPlayer) {
      ChatBubble.show(this, this._localPlayer, `${this._nickname || 'Me'}: ${content}`, null)
    }
    worldSocket.sendSpatialChat(content)
  }

  // 本地主动发送快捷表情动作（自身头顶即刻弹出表情气泡，并向服务端广播）
  sendSpatialEmote(emote) {
    if (this._localPlayer) {
      ChatBubble.showEmote(this, this._localPlayer, emote, null)
    }
    worldSocket.sendEmote(emote)
  }

  // 处理来自其他玩家的定向互动（如打招呼、点赞）
  _handlePlayerInteract(msg) {
    console.log('[HallScene] 收到玩家定向交互广播:', msg)
    const fromUid = Number(msg.userId)
    const toUid   = Number(msg.targetUserId)
    const myUid   = Number(this._userId)

    // 1. 如果自己是被互动目标，通知 Vue 层弹出全局高亮浮窗提醒
    if (toUid === myUid && fromUid !== myUid) {
      if (this._npcDialogBus?.onPlayerInteract) {
        this._npcDialogBus.onPlayerInteract(msg)
      }
    }

    // 2. 找到发起互动的玩家（无论是自己还是其他玩家）
    let sender = (fromUid === myUid)
      ? this._localPlayer
      : this._remotePlayers.get(fromUid)

    // 容错 1：如果根据 Map key 没直接命中，按 userId 遍历 RemotePlayer
    if (!sender && fromUid !== myUid) {
      for (const [k, rp] of this._remotePlayers.entries()) {
        if (Number(k) === fromUid || Number(rp.userId) === fromUid) {
          sender = rp
          break
        }
      }
    }

    // 容错 2：如果 remotePlayer 实例暂未捕获，但消息带空间坐标，提供 fallback
    if (!sender && msg.x !== undefined && msg.y !== undefined) {
      sender = { x: Number(msg.x), y: Number(msg.y) }
    }

    // 3. 在发起互动的玩家头顶展示专属复合交互气泡（大表情徽章 + 专属对白 + 箭头尾巴，停留整整 5 秒，全员清晰可见！）
    if (sender) {
      ChatBubble.showInteract(this, sender, msg)
    }
  }

  // 点击其他玩家：通知 Vue 打开玩家名片
  _onRemotePlayerClick(remotePlayer) {
    if (this._isTransitioning) return
    console.log('[HallScene] 点击其他玩家:', remotePlayer.nickname, remotePlayer.userId)
    if (this._npcDialogBus?.openPlayerCard) {
      this._npcDialogBus.openPlayerCard({
        userId: Number(remotePlayer.userId),
        nickname: remotePlayer.nickname,
        x: remotePlayer.x,
        y: remotePlayer.y
      })
    }
  }

  // ─── 系统提示 ─────────────────────────────────────────────────────────────
  _showSystemTip(text) {
    const tip = this.add.text(
      this.cameras.main.worldView.centerX || this._mapW / 2,
      (this.cameras.main.worldView.centerY || this._mapH / 2) - 80,
      text,
      {
        fontSize: '14px',
        fontStyle: 'bold',
        color: '#ffffff',
        backgroundColor: '#111827dd',
        padding: { x: 14, y: 8 }
      }
    ).setOrigin(0.5).setDepth(50)

    this.tweens.add({
      targets: tip,
      alpha: 0,
      y: tip.y - 25,
      delay: 1500,
      duration: 500,
      onComplete: () => tip.destroy()
    })
  }

  // ─── 主循环 ───────────────────────────────────────────────────────────────
  update(time, delta) {
    if (this._localPlayer && !this._isTransitioning) {
      this._localPlayer.update(time, delta, (x, y, dir) => {
        worldSocket.sendMove(x, y, dir)
      })

      const px = this._localPlayer.x
      const py = this._localPlayer.y

      // 检查 NPC 靠近高亮
      if (this._npcs) {
        this._npcs.forEach(npc => npc.updateProximity(px, py))
      }

      // 检查游戏桌/街机靠近提示
      if (this._gameTables) {
        this._gameTables.forEach(table => table.updateProximity(px, py))
      }

      // 检查传送门碰撞触发
      if (this._portals) {
        for (const portal of this._portals) {
          if (portal.checkOverlap(px, py)) {
            break
          }
        }
      }

      // 启用 2.5D Y-Sort 深度排序（角色与切片实体根据脚底 Y 坐标决定遮挡层级，产生真实站位立体感）
      this._localPlayer.setDepth(Math.round(this._localPlayer.y))
      if (this._npcs) {
        this._npcs.forEach(npc => npc.setDepth(Math.round(npc.y)))
      }
      if (this._gameTables) {
        this._gameTables.forEach(table => table.setDepth(Math.round(table.y + 15)))
      }
      if (this._ySortedProps) {
        this._ySortedProps.forEach(p => p.setDepth(Math.round(p.depthY || p.y)))
      }
      this._remotePlayers.forEach(rp => rp.setDepth(Math.round(rp.y)))
    }

    this._remotePlayers.forEach(rp => rp.update())
  }

  // ─── 销毁 ─────────────────────────────────────────────────────────────────
  shutdown() {
    this._unsubs.forEach(unsub => unsub())
    worldSocket.disconnect()
  }
}
