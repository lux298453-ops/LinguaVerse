package com.example.framework.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.example.framework.common.BusinessException;
import com.example.framework.common.ResultCode;
import com.example.framework.dto.ChatMessageVO;
import com.example.framework.dto.ConversationVO;
import com.example.framework.entity.ChatMessage;
import com.example.framework.entity.User;
import com.example.framework.mapper.ChatMessageMapper;
import com.example.framework.service.ChatService;
import com.example.framework.service.UserService;
import com.example.framework.util.WebSocketSessionManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * 聊天服务实现
 */
@Service
@RequiredArgsConstructor
public class ChatServiceImpl implements ChatService {

    private final ChatMessageMapper chatMessageMapper;
    private final UserService userService;

    @Override
    public ChatMessageVO send(Long senderId, Long receiverId, String content) {
        if (!StringUtils.hasText(content)) {
            throw new BusinessException(ResultCode.BAD_REQUEST.getCode(), "消息内容不能为空");
        }
        if (receiverId == null || receiverId.equals(senderId)) {
            throw new BusinessException(ResultCode.BAD_REQUEST.getCode(), "接收人无效");
        }
        User receiver = userService.getById(receiverId);
        if (receiver == null || receiver.getStatus() == null || receiver.getStatus() != 1) {
            throw new BusinessException(ResultCode.BAD_REQUEST.getCode(), "接收人不存在或已被禁用");
        }
        ChatMessage msg = new ChatMessage();
        msg.setSenderId(senderId);
        msg.setReceiverId(receiverId);
        msg.setContent(content);
        msg.setIsRead(WebSocketSessionManager.isOnline(receiverId) ? 1 : 0);
        chatMessageMapper.insert(msg);
        return ChatMessageVO.of(msg, userService.getById(senderId));
    }

    @Override
    public List<ChatMessageVO> history(Long userId, Long withUserId, long pageNum, long pageSize) {
        long size = Math.min(pageSize, 100);
        long offset = (pageNum - 1) * size;
        List<ChatMessage> list = chatMessageMapper.selectList(new LambdaQueryWrapper<ChatMessage>()
                .and(w -> w.eq(ChatMessage::getSenderId, userId).eq(ChatMessage::getReceiverId, withUserId)
                        .or().eq(ChatMessage::getSenderId, withUserId).eq(ChatMessage::getReceiverId, userId))
                .orderByDesc(ChatMessage::getCreateTime)
                .orderByDesc(ChatMessage::getId)
                .last("LIMIT " + size + " OFFSET " + offset));
        return toVOs(list);
    }

    @Override
    public void markRead(Long userId, Long fromUserId) {
        chatMessageMapper.update(null, new LambdaUpdateWrapper<ChatMessage>()
                .eq(ChatMessage::getSenderId, fromUserId)
                .eq(ChatMessage::getReceiverId, userId)
                .eq(ChatMessage::getIsRead, 0)
                .set(ChatMessage::getIsRead, 1));
    }

    @Override
    public List<ConversationVO> conversations(Long userId) {
        List<ConversationVO> list = chatMessageMapper.selectConversations(userId);
        if (list == null) {
            return new ArrayList<>();
        }
        list.forEach(c -> c.setOnline(WebSocketSessionManager.isOnline(c.getUserId())));
        return list;
    }

    @Override
    public long unreadCount(Long userId) {
        return chatMessageMapper.selectCount(new LambdaQueryWrapper<ChatMessage>()
                .eq(ChatMessage::getReceiverId, userId)
                .eq(ChatMessage::getIsRead, 0));
    }

    @Override
    public List<ChatMessageVO> pullOffline(Long userId) {
        List<ChatMessage> list = chatMessageMapper.selectList(new LambdaQueryWrapper<ChatMessage>()
                .eq(ChatMessage::getReceiverId, userId)
                .eq(ChatMessage::getIsRead, 0)
                .orderByAsc(ChatMessage::getCreateTime));
        if (list.isEmpty()) {
            return new ArrayList<>();
        }
        chatMessageMapper.update(null, new LambdaUpdateWrapper<ChatMessage>()
                .eq(ChatMessage::getReceiverId, userId)
                .eq(ChatMessage::getIsRead, 0)
                .set(ChatMessage::getIsRead, 1));
        return toVOs(list);
    }

    private List<ChatMessageVO> toVOs(List<ChatMessage> list) {
        if (list == null || list.isEmpty()) {
            return new ArrayList<>();
        }
        List<Long> senderIds = list.stream().map(ChatMessage::getSenderId).distinct().toList();
        Map<Long, User> userMap = senderIds.isEmpty() ? Map.of()
                : userService.listByIds(senderIds).stream()
                        .collect(Collectors.toMap(User::getId, Function.identity()));
        return list.stream().map(m -> ChatMessageVO.of(m, userMap.get(m.getSenderId()))).toList();
    }
}
