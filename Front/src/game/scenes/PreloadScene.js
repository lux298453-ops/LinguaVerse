/**
 * PreloadScene.js
 * 资源预加载场景，加载完成后切换到 HallScene
 */
import Phaser from 'phaser'

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' })
  }

  preload() {
    this.cameras.main.setBackgroundColor('#0b0f19')

    this.load.on('progress', (v) => {
      const cb = this.game.registry.get('onLoadingProgress')
      if (cb) cb(v)
    })

    this.load.on('complete', () => {
      const cb = this.game.registry.get('onLoadingComplete')
      if (cb) cb()
    })

    // 加载 2.5D 童话魔法场景高品质背景原画大图
    this.load.image('map_hall', '/assets/maps/sunshine_hall.jpg')
    this.load.image('map_game_zone', '/assets/maps/fantasy_arcade.jpg')
    this.load.image('map_library', '/assets/maps/arcane_library.jpg')

    // ─── 2.5D 地表地砖与地毯纹理 ──────────────────────────────────────────
    this.load.image('tile_marble', '/assets/tiles/floor_marble.png')
    this.load.image('tile_cyber', '/assets/tiles/floor_cyber.png')
    this.load.image('tile_carpet_red', '/assets/tiles/carpet_red.png')

    // ─── 2.5D 独立切图与深度装饰实体 (Props) ──────────────────────────────
    this.load.image('prop_pillar_marble', '/assets/props/pillar_marble.png')
    this.load.image('prop_counter_reception', '/assets/props/counter_reception.png')
    this.load.image('prop_plant_potted', '/assets/props/plant_potted.png')
    this.load.image('prop_bench_royal', '/assets/props/bench_royal.png')
    this.load.image('prop_chandelier_crystal', '/assets/props/chandelier_crystal.png')
    this.load.image('prop_ray_sunlight', '/assets/props/ray_sunlight.png')

    this.load.image('prop_arcade_blue', '/assets/props/arcade_blue.png')
    this.load.image('prop_arcade_pink', '/assets/props/arcade_pink.png')
    this.load.image('prop_table_magic', '/assets/props/table_magic.png')
    this.load.image('prop_neon_pole', '/assets/props/neon_pole.png')
    this.load.image('prop_vending_machine', '/assets/props/vending_machine.png')
  }

  create() {
    this.scene.start('HallScene')
  }
}
