package com.example.framework;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * 登录注册 + 权限集成测试（使用真实 MySQL 数据库）
 */
@SpringBootTest
@AutoConfigureMockMvc
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class AuthPermissionTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String adminToken;
    private String userToken;

    private String postJson(String url, String body) throws Exception {
        return mockMvc.perform(post(url).contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andReturn().getResponse().getContentAsString();
    }

    private String login(String username, String password) throws Exception {
        ObjectNode body = objectMapper.createObjectNode();
        body.put("username", username);
        body.put("password", password);
        String resp = postJson("/api/auth/login", body.toString());
        return objectMapper.readTree(resp).path("data").path("token").asText();
    }

    @BeforeEach
    void setUp() throws Exception {
        if (adminToken == null) {
            adminToken = tryLogin("admin", "admin123");
        }
        if (userToken == null) {
            userToken = tryLogin("zhangsan", "123456");
        }
    }

    private String tryLogin(String username, String password) throws Exception {
        try {
            return login(username, password);
        } catch (Throwable t) {
            if ("zhangsan".equals(username)) {
                ObjectNode body = objectMapper.createObjectNode();
                body.put("username", "zhangsan");
                body.put("password", "123456");
                body.put("nickname", "张三");
                postJson("/api/auth/register", body.toString());
                return login(username, password);
            }
            return null;
        }
    }

    @Test
    @Order(1)
    void testAdminLogin() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"admin\",\"password\":\"admin123\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.token").isNotEmpty())
                .andExpect(jsonPath("$.data.role").value("ADMIN"))
                .andReturn();
        System.out.println("admin login response: " + result.getResponse().getContentAsString());
    }

    @Test
    @Order(2)
    void testRegister() throws Exception {
        long suffix = System.currentTimeMillis() % 100000;
        ObjectNode body = objectMapper.createObjectNode();
        body.put("username", "testuser" + suffix);
        body.put("password", "123456");
        body.put("nickname", "测试用户");
        String resp = postJson("/api/auth/register", body.toString());
        System.out.println("register response: " + resp);
    }

    @Test
    @Order(3)
    void testRegisterDuplicateUsername() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"zhangsan\",\"password\":\"123456\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1001));
    }

    @Test
    @Order(4)
    void testLoginWrongPassword() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"admin\",\"password\":\"wrong\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1002));
    }

    @Test
    @Order(5)
    void testLoginValidation() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"\",\"password\":\"\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(400));
    }

    @Test
    @Order(6)
    void testAccessWithoutToken() throws Exception {
        mockMvc.perform(get("/api/user/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(401));
    }

    @Test
    @Order(7)
    void testMeWithAdminToken() throws Exception {
        mockMvc.perform(get("/api/user/me").header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.username").value("admin"))
                .andExpect(jsonPath("$.data.role").value("ADMIN"));
    }

    @Test
    @Order(8)
    void testAdminListUsers() throws Exception {
        mockMvc.perform(get("/api/user/list").header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.records").isArray());
    }

    @Test
    @Order(9)
    void testUserForbiddenToListUsers() throws Exception {
        mockMvc.perform(get("/api/user/list").header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(403));
    }

    @Test
    @Order(10)
    void testAdminUpdateRole() throws Exception {
        JsonNode tree = objectMapper.readTree(mockMvc.perform(get("/api/user/list")
                        .header("Authorization", "Bearer " + adminToken))
                .andReturn().getResponse().getContentAsString());
        long zhangsanId = -1;
        for (JsonNode record : tree.path("data").path("records")) {
            if ("zhangsan".equals(record.path("username").asText())) {
                zhangsanId = record.path("id").asLong();
                break;
            }
        }
        org.junit.jupiter.api.Assertions.assertTrue(zhangsanId > 0, "zhangsan 用户应存在");
        mockMvc.perform(put("/api/user/" + zhangsanId + "/role?role=ADMIN")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));
        System.out.println("zhangsan role updated to ADMIN, id=" + zhangsanId);
        mockMvc.perform(put("/api/user/" + zhangsanId + "/role?role=USER")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));
        System.out.println("zhangsan role restored to USER, id=" + zhangsanId);
    }

    @Test
    @Order(11)
    void testUserCannotUpdateRole() throws Exception {
        mockMvc.perform(put("/api/user/1/role?role=ADMIN")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(403));
    }

    @Test
    @Order(12)
    void testInvalidToken() throws Exception {
        mockMvc.perform(get("/api/user/me").header("Authorization", "Bearer invalid.token.here"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1004));
    }
}
