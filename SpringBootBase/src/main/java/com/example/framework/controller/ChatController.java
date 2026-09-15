package com.example.framework.controller;

import com.example.framework.common.Result;
import com.example.framework.dto.ChatMessageVO;
import com.example.framework.dto.ConversationVO;
import com.example.framework.entity.User;
import com.example.framework.service.ChatService;
import com.example.framework.service.UserService;
import com.example.framework.util.UserContext;
import com.example.framework.util.WebSocketSessionManager;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 聊天接口（历史消息 / 会话列表等）
 */
@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;
    private final UserService userService;

    /**
     * 与指定用户的历史消息（倒序分页，最新在前）
     */
    @GetMapping("/history")
    public Result<List<ChatMessageVO>> history(@RequestParam Long withUserId,
                                               @RequestParam(defaultValue = "1") long pageNum,
                                               @RequestParam(defaultValue = "20") long pageSize) {
        return Result.success(chatService.history(UserContext.getUserId(), withUserId, pageNum, pageSize));
    }

    /**
     * 会话列表（最近消息 + 未读数 + 在线状态）
     */
    @GetMapping("/conversations")
    public Result<List<ConversationVO>> conversations() {
        return Result.success(chatService.conversations(UserContext.getUserId()));
    }

    /**
     * 可聊天用户列表（排除自己，含在线状态）
     */
    @GetMapping("/users")
    public Result<List<Map<String, Object>>> users() {
        Long me = UserContext.getUserId();
        List<Map<String, Object>> result = new ArrayList<>();
        for (User user : userService.listAll()) {
            if (user.getId().equals(me)) {
                continue;
            }
            Map<String, Object> item = new HashMap<>();
            item.put("id", user.getId());
            item.put("username", user.getUsername());
            item.put("nickname", user.getNickname());
            item.put("avatar", user.getAvatar());
            item.put("online", WebSocketSessionManager.isOnline(user.getId()));
            result.add(item);
        }
        return Result.success(result);
    }

    /**
     * 将对方发来的消息标记为已读
     */
    @PutMapping("/read")
    public Result<Void> markRead(@RequestParam Long fromUserId) {
        chatService.markRead(UserContext.getUserId(), fromUserId);
        return Result.success();
    }

    /**
     * 总未读数（用于导航角标）
     */
    @GetMapping("/unread")
    public Result<Long> unread() {
        return Result.success(chatService.unreadCount(UserContext.getUserId()));
    }
}
