package com.example.linguaverse.websocket;

import com.example.framework.entity.User;
import com.example.framework.mapper.UserMapper;
import com.example.linguaverse.dto.PlayerState;
import com.example.linguaverse.dto.WorldMessage;
import com.example.linguaverse.entity.LvDialogueNode;
import com.example.linguaverse.service.TaskService;
import com.example.linguaverse.service.TaskService.HandleResult;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
@RequiredArgsConstructor
public class WorldWebSocketHandler extends TextWebSocketHandler {

    private final ObjectMapper objectMapper;
    private final TaskService taskService;
    private final UserMapper userMapper;

    // roomId → (userId → session)
    private static final Map<String, Map<Long, WebSocketSession>> rooms = new ConcurrentHashMap<>();
    // sessionId → playerState
    private static final Map<String, PlayerState> sessionPlayerMap = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        Long userId = getUserId(session);
        if (userId == null) { session.close(); return; }

        User user = userMapper.selectById(userId);
        String nickname = (user != null && StringUtils.hasText(user.getNickname()))
                ? user.getNickname()
                : (user != null ? user.getUsername() : "Player " + userId);

        PlayerState state = new PlayerState();
        state.setUserId(userId);
        state.setNickname(nickname);
        state.setSkin("avatar_blue");
        state.setX(400);
        state.setY(300);
        state.setDirection("down");
        state.setMapId("hall");
        sessionPlayerMap.put(session.getId(), state);

        rooms.computeIfAbsent("hall", k -> new ConcurrentHashMap<>()).put(userId, session);

        // 发送当前房间所有玩家列表给新玩家
        Map<Long, WebSocketSession> room = rooms.get("hall");
        for (Map.Entry<Long, WebSocketSession> entry : room.entrySet()) {
            if (!entry.getKey().equals(userId)) {
                PlayerState ps = sessionPlayerMap.get(entry.getValue().getId());
                if (ps != null) sendTo(session, buildPlayerUpdate(ps));
            }
        }

        // 广播新玩家加入
        WorldMessage join = new WorldMessage();
        join.setType("PLAYER_JOIN");
        join.setUserId(userId);
        join.setNickname(nickname);
        join.setSkin(state.getSkin());
        join.setX(state.getX());
        join.setY(state.getY());
        broadcastToRoom("hall", join, userId);

        log.info("玩家加入世界: userId={} nickname={}", userId, nickname);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        Long userId = getUserId(session);
        if (userId == null) return;

        WorldMessage msg = objectMapper.readValue(message.getPayload(), WorldMessage.class);
        PlayerState state = sessionPlayerMap.get(session.getId());
        if (state == null) return;

        switch (msg.getType()) {
            case "MOVE" -> handleMove(session, userId, state, msg);
            case "SPATIAL_CHAT" -> handleSpatialChat(session, userId, state, msg);
            case "SPATIAL_EMOTE" -> handleSpatialEmote(session, userId, state, msg);
            case "PLAYER_INTERACT" -> handlePlayerInteract(session, userId, state, msg);
            case "NPC_REPLY" -> handleNpcReply(session, userId, msg);
            case "NPC_START" -> handleNpcStart(session, userId, msg);
            case "CHANGE_MAP" -> handleChangeMap(session, userId, state, msg);
        }
    }

    private void handleMove(WebSocketSession session, Long userId, PlayerState state, WorldMessage msg) throws IOException {
        state.setX(msg.getX());
        state.setY(msg.getY());
        state.setDirection(msg.getDirection());
        WorldMessage update = buildPlayerUpdate(state);
        broadcastToRoom(state.getMapId(), update, null); // 广播给所有人含自己
    }

    private void handleSpatialChat(WebSocketSession session, Long userId, PlayerState state, WorldMessage msg) throws IOException {
        log.info("空间聊天: userId={} nickname={} content={}", userId, state.getNickname(), msg.getContent());
        WorldMessage chat = new WorldMessage();
        chat.setType("SPATIAL_CHAT");
        chat.setUserId(userId);
        chat.setNickname(state.getNickname());
        chat.setX(state.getX());
        chat.setY(state.getY());
        chat.setContent(msg.getContent());
        broadcastToRoom(state.getMapId(), chat, null);
    }

    private void handleSpatialEmote(WebSocketSession session, Long userId, PlayerState state, WorldMessage msg) throws IOException {
        log.info("空间表情: userId={} nickname={} emote={}", userId, state.getNickname(), msg.getEmote());
        WorldMessage emote = new WorldMessage();
        emote.setType("SPATIAL_EMOTE");
        emote.setUserId(userId);
        emote.setNickname(state.getNickname());
        emote.setX(state.getX());
        emote.setY(state.getY());
        emote.setEmote(msg.getEmote());
        broadcastToRoom(state.getMapId(), emote, null);
    }

    private void handlePlayerInteract(WebSocketSession session, Long userId, PlayerState state, WorldMessage msg) throws IOException {
        log.info("玩家定向互动: fromUserId={} toUserId={} action={} emote={}", userId, msg.getTargetUserId(), msg.getAction(), msg.getEmote());
        WorldMessage interact = new WorldMessage();
        interact.setType("PLAYER_INTERACT");
        interact.setUserId(userId);
        interact.setNickname(state.getNickname());
        interact.setTargetUserId(msg.getTargetUserId());
        interact.setAction(msg.getAction());
        interact.setContent(msg.getContent());
        interact.setEmote(msg.getEmote());
        interact.setX(state.getX());
        interact.setY(state.getY());
        broadcastToRoom(state.getMapId(), interact, null);
    }

    private void handleNpcStart(WebSocketSession session, Long userId, WorldMessage msg) throws IOException {
        log.info("收到 NPC_START 请求: userId={} taskId={}", userId, msg.getTaskId());
        // 玩家点击 NPC，启动任务，流式发送第一段对话
        LvDialogueNode firstNode = taskService.startTask(userId, msg.getTaskId());
        if (firstNode == null) {
            log.warn("startTask 未找到对话节点或已完成: userId={} taskId={}", userId, msg.getTaskId());
            return;
        }
        log.info("开始向玩家流式发送 NPC 对话: nodeKey={} content={}", firstNode.getNodeKey(), firstNode.getContent());
        String nextInputKey;
        if (firstNode.getIsTerminal() != null && firstNode.getIsTerminal() == 1) {
            nextInputKey = "COMPLETE";
        } else {
            nextInputKey = firstNode.getNextNodeKey() != null ? firstNode.getNextNodeKey() : firstNode.getNodeKey();
        }
        streamNpcSpeak(session, firstNode.getContent(), nextInputKey);
    }

    private void handleNpcReply(WebSocketSession session, Long userId, WorldMessage msg) throws IOException {
        HandleResult result = taskService.handlePlayerInput(userId, msg.getTaskId(), msg.getNodeKey(), msg.getContent());
        WorldMessage taskResult = new WorldMessage();
        taskResult.setType("TASK_RESULT");
        taskResult.setSuccess(result.passed());
        taskResult.setHint(result.hint());

        if (result.passed() && result.taskComplete()) {
            taskResult.setNextNode("COMPLETE");
            sendTo(session, taskResult);
            if (result.nextNode() != null && "NPC_SPEAK".equals(result.nextNode().getNodeType())) {
                streamNpcSpeak(session, result.nextNode().getContent(), "COMPLETE");
            }
        } else if (result.passed() && result.nextNode() != null) {
            String nextInputKey = result.nextInputNodeKey();
            taskResult.setNextNode(nextInputKey != null ? nextInputKey : result.nextNode().getNodeKey());
            sendTo(session, taskResult);
            // 流式发送下一段 NPC 对话
            if ("NPC_SPEAK".equals(result.nextNode().getNodeType())) {
                streamNpcSpeak(session, result.nextNode().getContent(), nextInputKey);
            }
        } else {
            sendTo(session, taskResult);
        }
    }

    /**
     * 模拟流式打字机输出：按词分片，每片延迟 80ms 发送
     */
    private void streamNpcSpeak(WebSocketSession session, String content, String nextNodeKey) {
        if (content == null || content.isBlank()) {
            content = "Hello there! How can I help you today?";
        }
        final String textToSend = content;
        new Thread(() -> {
            String[] words = textToSend.split("\\s+");
            for (int i = 0; i < words.length; i++) {
                if (!session.isOpen()) {
                    break;
                }
                boolean isEnd = (i == words.length - 1);
                WorldMessage chunk = new WorldMessage();
                chunk.setType("NPC_SPEAK_CHUNK");
                chunk.setChunk((i == 0 ? "" : " ") + words[i]);
                chunk.setIsEnd(isEnd);
                chunk.setNodeKey(nextNodeKey);
                try {
                    sendTo(session, chunk);
                    if (!isEnd) Thread.sleep(80);
                } catch (Exception e) {
                    log.error("流式发送失败", e);
                    break;
                }
            }
        }).start();
    }


    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        Long userId = getUserId(session);
        PlayerState state = sessionPlayerMap.remove(session.getId());
        if (userId != null && state != null) {
            rooms.getOrDefault(state.getMapId(), Map.of()).remove(userId);
            WorldMessage leave = new WorldMessage();
            leave.setType("PLAYER_LEAVE");
            leave.setUserId(userId);
            broadcastToRoom(state.getMapId(), leave, null);
            log.info("玩家离开世界: userId={}", userId);
        }
    }

    private void broadcastToRoom(String roomId, WorldMessage msg, Long excludeUserId) {
        Map<Long, WebSocketSession> room = rooms.getOrDefault(roomId, Map.of());
        String json;
        try { json = objectMapper.writeValueAsString(msg); } catch (Exception e) { return; }
        for (Map.Entry<Long, WebSocketSession> entry : room.entrySet()) {
            if (excludeUserId != null && entry.getKey().equals(excludeUserId)) continue;
            try {
                WebSocketSession s = entry.getValue();
                if (s.isOpen()) {
                    synchronized (s) {
                        if (s.isOpen()) s.sendMessage(new TextMessage(json));
                    }
                }
            } catch (IOException e) {
                log.warn("广播失败 userId={}", entry.getKey());
            }
        }
    }

    private void sendTo(WebSocketSession session, WorldMessage msg) throws IOException {
        synchronized (session) {
            if (session.isOpen()) {
                session.sendMessage(new TextMessage(objectMapper.writeValueAsString(msg)));
            }
        }
    }

    private void handleChangeMap(WebSocketSession session, Long userId, PlayerState state, WorldMessage msg) throws IOException {
        String oldMapId = state.getMapId();
        String newMapId = msg.getMapId() != null ? msg.getMapId() : "hall";

        if (newMapId.equals(oldMapId)) {
            return;
        }

        log.info("玩家切换地图: userId={} from={} to={}", userId, oldMapId, newMapId);

        // 1. 从旧房间移除并广播离开
        if (oldMapId != null) {
            Map<Long, WebSocketSession> oldRoom = rooms.get(oldMapId);
            if (oldRoom != null) {
                oldRoom.remove(userId);
            }
            WorldMessage leave = new WorldMessage();
            leave.setType("PLAYER_LEAVE");
            leave.setUserId(userId);
            broadcastToRoom(oldMapId, leave, userId);
        }

        // 2. 更新玩家内存状态
        state.setMapId(newMapId);
        if (msg.getX() != null) state.setX(msg.getX());
        if (msg.getY() != null) state.setY(msg.getY());

        // 3. 加入新房间
        rooms.computeIfAbsent(newMapId, k -> new ConcurrentHashMap<>()).put(userId, session);

        // 4. 发送新房间内其他玩家列表给当前玩家
        Map<Long, WebSocketSession> newRoom = rooms.get(newMapId);
        for (Map.Entry<Long, WebSocketSession> entry : newRoom.entrySet()) {
            if (!entry.getKey().equals(userId)) {
                PlayerState ps = sessionPlayerMap.get(entry.getValue().getId());
                if (ps != null) {
                    sendTo(session, buildPlayerUpdate(ps));
                }
            }
        }

        // 5. 向新房间广播该玩家进入
        WorldMessage join = new WorldMessage();
        join.setType("PLAYER_JOIN");
        join.setUserId(userId);
        join.setNickname(state.getNickname());
        join.setSkin(state.getSkin());
        join.setX(state.getX());
        join.setY(state.getY());
        join.setMapId(newMapId);
        broadcastToRoom(newMapId, join, userId);
    }

    private WorldMessage buildPlayerUpdate(PlayerState ps) {
        WorldMessage m = new WorldMessage();
        m.setType("PLAYER_UPDATE");
        m.setUserId(ps.getUserId());
        m.setNickname(ps.getNickname());
        m.setSkin(ps.getSkin());
        m.setX(ps.getX());
        m.setY(ps.getY());
        m.setDirection(ps.getDirection());
        m.setMapId(ps.getMapId());
        return m;
    }

    private Long getUserId(WebSocketSession session) {
        Object uid = session.getAttributes().get("userId");
        return uid instanceof Long l ? l : (uid instanceof Integer i ? i.longValue() : null);
    }

    private String getNickname(WebSocketSession session) {
        Object n = session.getAttributes().get("nickname");
        return n != null ? n.toString() : "Anonymous";
    }
}
