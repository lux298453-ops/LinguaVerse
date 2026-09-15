package com.example.linguaverse.dto;

import lombok.Data;

@Data
public class WorldMessage {
    private String type;    // MOVE / SPATIAL_CHAT / NPC_REPLY / PLAYER_UPDATE / NPC_SPEAK_CHUNK / TASK_RESULT / PLAYER_JOIN / PLAYER_LEAVE
    // 移动与地图相关
    private Integer x;
    private Integer y;
    private String direction;
    private String mapId;
    // 聊天相关
    private String content;
    // NPC 任务相关
    private Long taskId;
    private String nodeKey;
    // 服务端广播附加字段
    private Long userId;
    private String nickname;
    private String skin;
    private String chunk;
    private Boolean isEnd;
    private Boolean success;
    private String nextNode;
    private String hint;
    private String npcKey;
    private String emote;
    // 玩家间定向社交交互
    private Long targetUserId;
    private String action; // GREET / LIKE
}
