package com.example.framework.dto;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 会话摘要（最近一条消息 + 未读数）
 */
@Data
public class ConversationVO {

    private Long userId;
    private String username;
    private String nickname;
    /** 该用户当前是否在线 */
    private Boolean online;
    /** 最近一条消息内容 */
    private String lastMessage;
    /** 最近消息时间 */
    private LocalDateTime lastTime;
    /** 对方发来的未读消息数 */
    private Long unread;
}
