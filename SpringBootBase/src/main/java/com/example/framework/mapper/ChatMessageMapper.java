package com.example.framework.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.example.framework.entity.ChatMessage;
import com.example.framework.dto.ConversationVO;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * 聊天消息 Mapper
 */
public interface ChatMessageMapper extends BaseMapper<ChatMessage> {

    /**
     * 会话列表：与每个用户最近的聊天记录及未读数
     */
    @Select("""
            SELECT u.id AS userId, u.username, u.nickname,
                   m.content AS lastMessage, m.create_time AS lastTime,
                   (SELECT COUNT(*) FROM chat_message cm2
                     WHERE cm2.sender_id = u.id AND cm2.receiver_id = #{userId} AND cm2.is_read = 0) AS unread
            FROM sys_user u
            JOIN (
                SELECT CASE WHEN sender_id = #{userId} THEN receiver_id ELSE sender_id END AS other_id,
                       MAX(create_time) AS max_time
                FROM chat_message
                WHERE sender_id = #{userId} OR receiver_id = #{userId}
                GROUP BY other_id
            ) t ON u.id = t.other_id
            JOIN chat_message m ON m.create_time = t.max_time
                AND ((m.sender_id = #{userId} AND m.receiver_id = u.id)
                  OR (m.sender_id = u.id AND m.receiver_id = #{userId}))
            WHERE u.status = 1
            ORDER BY m.create_time DESC
            """)
    List<ConversationVO> selectConversations(@Param("userId") Long userId);
}
