/**
 * maps.js
 * 类似《洛克王国》风格的独立单场景配置表
 */

export const MAP_CONFIGS = {
  hall: {
    mapId: 'hall',
    name: 'Sunshine Hall · 阳光大厅',
    subtitle: 'Welcome to LinguaVerse!',
    width: 1000,
    height: 600,
    defaultSpawn: { x: 500, y: 350 },
    bgBaseColor: 0xfbf3de,
    carpetColor: 0xe74c3c,
    portals: [
      {
        id: 'portal_to_game_zone',
        x: 920,
        y: 350,
        targetMapId: 'game_zone',
        targetSpawn: { x: 140, y: 350 },
        label: '奇幻游戏区 ➜',
        color: 0x27ae60
      },
      {
        id: 'portal_to_library',
        x: 80,
        y: 350,
        targetMapId: 'library',
        targetSpawn: { x: 500, y: 460 },
        label: '奥术图书馆 ➜',
        color: 0x38bdf8
      }
    ],
    npcs: [
      {
        npcKey: 'mary_guide',
        name: 'Mary',
        posX: 360,
        posY: 320,
        taskId: 1,
        color: 0xe74c3c,
        badge: '✦',
        title: '阳光向导'
      },
      {
        npcKey: 'tom_alchemist',
        name: 'Tom',
        posX: 640,
        posY: 320,
        taskId: 3,
        color: 0x3498db,
        badge: '⬡',
        title: '词根学者'
      }
    ]
  },

  game_zone: {
    mapId: 'game_zone',
    name: 'Game Zone · 奇幻游戏区',
    subtitle: 'Tabletop Games & Arcade Center',
    width: 1000,
    height: 600,
    defaultSpawn: { x: 140, y: 350 },
    bgBaseColor: 0xedf7ed,
    carpetColor: 0x8e44ad,
    portals: [
      {
        id: 'portal_to_hall',
        x: 80,
        y: 350,
        targetMapId: 'hall',
        targetSpawn: { x: 860, y: 350 },
        label: '➜ 阳光大厅',
        color: 0xf39c12
      }
    ],
    npcs: [
      {
        npcKey: 'luna_friend',
        name: 'Luna',
        posX: 680,
        posY: 320,
        taskId: 2,
        color: 0x8e44ad,
        badge: '◈'
      }
    ]
  },

  library: {
    mapId: 'library',
    name: 'Arcane Library · 奥术图书馆',
    subtitle: 'Sanctuary of Starry Tomes & Ancient Grimoires',
    width: 1000,
    height: 600,
    defaultSpawn: { x: 500, y: 460 },
    bgBaseColor: 0x0a0f1d,
    carpetColor: 0x1e1b4b,
    portals: [
      {
        id: 'portal_to_hall',
        x: 500,
        y: 550,
        targetMapId: 'hall',
        targetSpawn: { x: 180, y: 350 },
        label: '➜ 阳光大厅',
        color: 0xf59e0b
      }
    ],
    npcs: [
      {
        npcKey: 'evelyn_archivist',
        name: 'Evelyn',
        posX: 500,
        posY: 330,
        taskId: 4,
        color: 0x38bdf8,
        badge: '✧',
        title: '奥术馆长'
      }
    ]
  }
}
