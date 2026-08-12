package com.example.framework;

import com.example.framework.config.JwtHandshakeInterceptor;
import com.example.framework.service.ChatService;
import com.example.framework.util.WebSocketSessionManager;
import com.example.framework.websocket.ChatWebSocketHandler;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * 聊天功能集成测试
 */
@SpringBootTest
@AutoConfigureMockMvc
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class ChatTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ChatService chatService;

    @Autowired
    private ChatWebSocketHandler chatWebSocketHandler;

    private String adminToken;
    private long adminId;
    private long otherId;

    @BeforeAll
    void setUp() throws Exception {
        adminToken = login("admin", "admin123");
        adminId = userId(adminToken);
        // 确保存在第二个用户
        long suffix = System.currentTimeMillis() % 100000;
        String username = "chatuser" + suffix;
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"" + username + "\",\"password\":\"123456\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));
        otherId = userId(login(username, "123456"));
    }

    private String login(String username, String password) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"" + username + "\",\"password\":\"" + password + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString(java.nio.charset.StandardCharsets.UTF_8)).path("data").path("token").asText();
    }

    private long userId(String token) throws Exception {
        MvcResult result = mockMvc.perform(get("/api/user/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString(java.nio.charset.StandardCharsets.UTF_8)).path("data").path("id").asLong();
    }

    @Test
    @Order(1)
    void testChatUsersApi() throws Exception {
        mockMvc.perform(get("/api/chat/users").header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data[0].id").isNumber())
                .andExpect(jsonPath("$.data[0].online").isBoolean());
    }

    @Test
    @Order(2)
    void testSendAndHistory() throws Exception {
        var vo = chatService.send(adminId, otherId, "你好，测试消息");
        assertTrue(vo.getId() > 0);
        assertEquals(adminId, vo.getSenderId());

        MvcResult result = mockMvc.perform(get("/api/chat/history")
                        .param("withUserId", String.valueOf(otherId))
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andReturn();
        JsonNode records = objectMapper.readTree(result.getResponse().getContentAsString(java.nio.charset.StandardCharsets.UTF_8)).path("data");
        boolean found = false;
        for (JsonNode r : records) {
            if (r.path("id").asLong() == vo.getId()) {
                found = true;
                assertEquals("你好，测试消息", r.path("content").asText());
                assertEquals("admin", r.path("senderName").asText());
            }
        }
        assertTrue(found, "历史消息应包含刚发送的消息");
    }

    @Test
    @Order(3)
    void testUnreadAndMarkRead() throws Exception {
        // admin 给 other 发消息，other 未读数增加（other 当前离线）
        chatService.send(adminId, otherId, "又一条消息");

        MvcResult unreadResult = mockMvc.perform(get("/api/chat/unread")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode unread = objectMapper.readTree(unreadResult.getResponse().getContentAsString(java.nio.charset.StandardCharsets.UTF_8)).path("data");
        assertTrue(unread.isLong() || unread.isInt(), "未读数应为数字");

        // 标记对方发来的消息为已读
        mockMvc.perform(put("/api/chat/read")
                        .param("fromUserId", String.valueOf(otherId))
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));
    }

    @Test
    @Order(4)
    void testConversations() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/chat/conversations")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andReturn();
        JsonNode list = objectMapper.readTree(result.getResponse().getContentAsString(java.nio.charset.StandardCharsets.UTF_8)).path("data");
        assertTrue(list.isArray());
        boolean found = false;
        for (JsonNode c : list) {
            if (c.path("userId").asLong() == otherId) {
                found = true;
                assertTrue(c.has("lastMessage"));
                assertTrue(c.has("unread"));
                assertTrue(c.has("online"));
            }
        }
        assertTrue(found, "会话列表应包含与测试用户的会话");
    }

    @Test
    @Order(5)
    void testWebSocketHandlerSendsMessage() throws Exception {
        WebSocketSession session = mock(WebSocketSession.class);
        Map<String, Object> attrs = new HashMap<>();
        attrs.put(JwtHandshakeInterceptor.ATTR_USER_ID, adminId);
        when(session.getAttributes()).thenReturn(attrs);
        when(session.isOpen()).thenReturn(true);
        WebSocketSessionManager.add(adminId, session);

        long before = chatService.unreadCount(otherId);
        chatWebSocketHandler.handleChatMessage(adminId,
                "{\"type\":\"chat\",\"to\":" + otherId + ",\"content\":\"ws 消息\"}");
        assertTrue(chatService.unreadCount(otherId) > before, "通过 WebSocket 发送后对方未读数应增加");
        assertFalse(chatService.history(otherId, adminId, 1, 10).isEmpty(), "对方视角应能查到该消息");
    }
}
