import request from './request'

export function getUserQuests() {
  return request({
    url: '/linguaverse/tasks/user-quests',
    method: 'get'
  })
}

export function getPlayerInfo() {
  return request({
    url: '/linguaverse/tasks/player-info',
    method: 'get'
  })
}
