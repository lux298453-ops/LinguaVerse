package com.example.framework.dto;

import com.example.framework.entity.ChatMessage;
import com.example.framework.entity.User;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 聊天消息视图（含发送人信息）
 */
@Data
public class ChatMessageVO {

    private Long id;
    private Long senderId;
    private String senderName;
    private String senderNickname;
    private Long receiverId;
    private String content;
    private Integer isRead;
    private LocalDateTime createTime;

    public static ChatMessageVO of(ChatMessage msg, User sender) {
        ChatMessageVO vo = new ChatMessageVO();
        vo.setId(msg.getId());
        vo.setSenderId(msg.getSenderId());
        if (sender != null) {
            vo.setSenderName(sender.getUsername());
            vo.setSenderNickname(sender.getNickname());
        }
        vo.setReceiverId(msg.getReceiverId());
        vo.setContent(msg.getContent());
        vo.setIsRead(msg.getIsRead());
        vo.setCreateTime(msg.getCreateTime());
        return vo;
    }
}
