package com.example.framework.util;

import org.springframework.web.socket.WebSocketSession;

import java.util.Collection;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * WebSocket 会话管理：userId -> session（单连接，新连接顶掉旧连接）
 */
public class WebSocketSessionManager {

    private static final Map<Long, WebSocketSession> SESSIONS = new ConcurrentHashMap<>();

    public static void add(Long userId, WebSocketSession session) {
        WebSocketSession old = SESSIONS.put(userId, session);
        if (old != null && old.isOpen() && !old.getId().equals(session.getId())) {
            try {
                old.close();
            } catch (Exception ignored) {
            }
        }
    }

    public static void remove(Long userId, WebSocketSession session) {
        SESSIONS.remove(userId, session);
    }

    public static WebSocketSession get(Long userId) {
        return SESSIONS.get(userId);
    }

    public static boolean isOnline(Long userId) {
        WebSocketSession session = SESSIONS.get(userId);
        return session != null && session.isOpen();
    }

    public static Collection<WebSocketSession> getAll() {
        return SESSIONS.values();
    }
}
