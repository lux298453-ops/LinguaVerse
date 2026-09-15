/**
 * GameManager.js
 * 创建并管理 Phaser.Game 实例
 */
import Phaser from 'phaser'
import { PreloadScene } from './scenes/PreloadScene.js'
import { HallScene }    from './scenes/HallScene.js'

let gameInstance = null

/**
 * @param {HTMLElement} parent - 挂载到的 DOM 元素
 * @param {object} userData - { userId, nickname, token }
 * @param {object} npcDialogBus - Vue 层注入的事件总线
 * @returns {Phaser.Game}
 */
export function createGame(parent, userData, npcDialogBus, loadingCallbacks = {}) {
  if (gameInstance) {
    gameInstance.destroy(true)
    gameInstance = null
  }

  const hallScene = new HallScene()

  gameInstance = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width:  parent.clientWidth  || window.innerWidth,
    height: parent.clientHeight || window.innerHeight,
    backgroundColor: '#0b0f19',
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
      default: 'arcade',
      arcade: { gravity: { y: 0 }, debug: false }
    },
    input: {
      keyboard: {
        target: window,
        capture: false, // 关键：禁止 Phaser preventDefault 拦截空格、方向键等全局输入
      }
    },
    scene: [PreloadScene, hallScene],
    // ✅ preBoot：在任何场景启动之前写入 registry，解决时序竞争
    callbacks: {
      preBoot: (game) => {
        game.registry.set('userData', userData)
        game.registry.set('npcDialogBus', npcDialogBus)
        if (loadingCallbacks.onProgress) game.registry.set('onLoadingProgress', loadingCallbacks.onProgress)
        if (loadingCallbacks.onComplete) game.registry.set('onLoadingComplete', loadingCallbacks.onComplete)
        if (loadingCallbacks.onReady)    game.registry.set('onWorldReady', loadingCallbacks.onReady)
      },
      postBoot: (game) => {
        if (game.input?.keyboard) {
          game.input.keyboard.clearCaptures?.()
        }
      }
    }
  })

  return gameInstance
}


export function destroyGame() {
  if (gameInstance) {
    gameInstance.destroy(true)
    gameInstance = null
  }
}
