package com.example.framework.service;

import com.example.framework.dto.ChatMessageVO;
import com.example.framework.dto.ConversationVO;
import com.example.framework.entity.ChatMessage;

import java.util.List;

/**
 * 聊天服务
 */
public interface ChatService {

    /**
     * 保存并返回消息（发送方调用）
     */
    ChatMessageVO send(Long senderId, Long receiverId, String content);

    /**
     * 分页查询与某个用户的历史消息（倒序，最新在前）
     */
    List<ChatMessageVO> history(Long userId, Long withUserId, long pageNum, long pageSize);

    /**
     * 将对方发来的消息标记为已读
     */
    void markRead(Long userId, Long fromUserId);

    /**
     * 会话列表（含最近消息与未读数）
     */
    List<ConversationVO> conversations(Long userId);

    /**
     * 总未读数
     */
    long unreadCount(Long userId);

    /**
     * 离线消息（未读），推送后应标记为已读
     */
    List<ChatMessageVO> pullOffline(Long userId);
}
