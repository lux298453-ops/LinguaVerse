package com.example.framework.websocket;

import com.example.framework.config.JwtHandshakeInterceptor;
import com.example.framework.service.ChatService;
import com.example.framework.util.WebSocketSessionManager;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;

/**
 * 聊天 WebSocket 处理器
 * 客户端 -> 服务端: {"type":"chat","to":123,"content":"你好"}
 * 服务端 -> 客户端:
 *   {"type":"chat","message":{...}}            实时转发消息
 *   {"type":"offline","messages":[...]}        上线推送离线消息
 *   {"type":"error","message":"..."}           错误提示
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ChatWebSocketHandler extends TextWebSocketHandler {

    private final ChatService chatService;
    private final ObjectMapper objectMapper;

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        Long userId = currentUserId(session);
        WebSocketSessionManager.add(userId, session);
        log.info("用户 {} 上线", userId);
        broadcastStatus(userId, true);
        try {
            sendText(session, objectMapper.writeValueAsString(
                    objectMapper.createObjectNode().put("type", "offline")
                            .set("messages", objectMapper.valueToTree(chatService.pullOffline(userId)))));
        } catch (Exception e) {
            log.error("推送离线消息失败 userId={}", userId, e);
        }
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        handleChatMessage(currentUserId(session), message.getPayload());
    }

    /**
     * 处理客户端消息（公开方法便于测试）
     */
    public void handleChatMessage(Long userId, String payload) {
        try {
            JsonNode node = objectMapper.readTree(payload);
            String type = node.path("type").asText("");
            switch (type) {
                case "chat" -> handleChat(userId, node);
                default -> sendError(WebSocketSessionManager.get(userId), "不支持的消息类型: " + type);
            }
        } catch (IOException e) {
            sendError(WebSocketSessionManager.get(userId), "消息格式错误");
        }
    }

    private void handleChat(Long senderId, JsonNode node) {
        Long to = node.path("to").asLong();
        String content = node.path("content").asText();
        var vo = chatService.send(senderId, to, content);
        ObjectNode frame = objectMapper.createObjectNode().put("type", "chat")
                .set("message", objectMapper.valueToTree(vo));
        String json;
        try {
            json = objectMapper.writeValueAsString(frame);
        } catch (IOException e) {
            log.error("序列化消息失败", e);
            return;
        }
        sendText(WebSocketSessionManager.get(senderId), json);
        sendText(WebSocketSessionManager.get(to), json);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        Long userId = currentUserId(session);
        WebSocketSessionManager.remove(userId, session);
        log.info("用户 {} 下线", userId);
        broadcastStatus(userId, false);
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) {
        log.error("WebSocket 传输错误 userId={}", currentUserId(session), exception);
        try {
            session.close();
        } catch (Exception ignored) {
        }
    }

    private Long currentUserId(WebSocketSession session) {
        return (Long) session.getAttributes().get(JwtHandshakeInterceptor.ATTR_USER_ID);
    }

    private void sendText(WebSocketSession session, String text) {
        if (session != null && session.isOpen()) {
            try {
                session.sendMessage(new TextMessage(text));
            } catch (IOException e) {
                log.error("发送消息失败", e);
            }
        }
    }

    /**
     * 向所有在线用户广播用户上下线状态
     */
    private void broadcastStatus(Long userId, boolean online) {
        try {
            String json = objectMapper.writeValueAsString(
                    objectMapper.createObjectNode().put("type", "user_status")
                            .put("userId", userId).put("online", online));
            for (WebSocketSession s : WebSocketSessionManager.getAll()) {
                if (s.isOpen() && !s.equals(WebSocketSessionManager.get(userId))) {
                    sendText(s, json);
                }
            }
        } catch (IOException e) {
            log.error("广播上下线状态失败", e);
        }
    }

    private void sendError(WebSocketSession session, String message) {
        try {
            sendText(session, objectMapper.writeValueAsString(
                    objectMapper.createObjectNode().put("type", "error").put("message", message)));
        } catch (IOException e) {
            log.error("发送错误消息失败", e);
        }
    }
}
