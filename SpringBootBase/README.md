# SpringBootBase - 通用 Spring Boot 基础框架

开箱即用的 Java 17 + Spring Boot 3 后端脚手架，内置**登录注册 + JWT 认证 + 角色权限（管理员/普通用户）**，新项目直接复制即可开发业务。

## 技术栈

| 组件 | 版本 |
| --- | --- |
| Java | 17 |
| Spring Boot | 3.2.5 |
| MyBatis-Plus | 3.5.5 |
| MySQL | 8.x |
| JWT (jjwt) | 0.12.5 |
| 密码加密 | BCrypt (spring-security-crypto) |

## 快速开始

1. 初始化数据库（只需执行一次）：
   ```bash
   mysql -uroot -p < sql/init.sql
   ```
2. 修改 `src/main/resources/application.yml` 中的数据库账号密码
3. 启动应用：
   ```bash
   mvn spring-boot:run
   ```
4. 启动后自动创建默认管理员账号：`admin / admin123`（可在 `application.yml` 的 `app.default-admin` 中修改）

## 目录结构

```
src/main/java/com/example/framework/
├── annotation/          # 自定义注解（@Public 免登录、@RequireRole 角色权限）
├── common/              # 统一响应 Result、状态码、业务异常
├── config/              # 拦截器/跨域/分页/密码加密/启动初始化
├── controller/          # 接口层（AuthController 认证、UserController 用户管理）
├── dto/                 # 请求/响应对象
├── entity/              # 数据库实体
├── enums/               # 角色枚举
├── exception/           # 全局异常处理
├── interceptor/         # JWT 登录认证 + 角色校验
├── mapper/              # MyBatis-Plus Mapper
├── service/             # 业务层
└── util/                # JWT 工具、当前用户上下文
```

## 接口说明

| 方法 | 路径 | 权限 | 说明 |
| --- | --- | --- | --- |
| POST | /api/auth/register | 免登录 | 注册（默认 USER 角色） |
| POST | /api/auth/login | 免登录 | 登录，返回 token |
| GET | /api/user/me | 登录用户 | 获取当前用户信息 |
| GET | /api/user/list | ADMIN | 分页查询用户列表 |
| PUT | /api/user/{id}/role | ADMIN | 修改用户角色 |
| PUT | /api/user/{id}/status | ADMIN | 启用/禁用用户 |
| GET | /api/chat/users | 登录用户 | 可聊天用户列表（含在线状态） |
| GET | /api/chat/history | 登录用户 | 与指定用户的历史消息（分页） |
| GET | /api/chat/conversations | 登录用户 | 会话列表（最近消息+未读+在线） |
| GET | /api/chat/unread | 登录用户 | 总未读数 |
| PUT | /api/chat/read | 登录用户 | 将对方消息标记为已读 |

## WebSocket 实时聊天

连接地址：`ws://{host}/ws/chat?token={JWT}`（握手时校验 token，需先登录获取）

### 客户端 -> 服务端

```json
{ "type": "chat", "to": 2, "content": "你好" }
```

### 服务端 -> 客户端

| type | 说明 |
| --- | --- |
| `chat` | 实时转发消息，`message` 含发送人信息 |
| `offline` | 上线时推送离线未读消息（推送后自动标记已读） |
| `user_status` | 用户上下线广播（`userId` + `online`） |
| `error` | 错误提示 |

### 前端示例

```js
const ws = new WebSocket(`ws://${location.host}/ws/chat?token=${token}`)
ws.onmessage = (e) => { /* 处理消息帧 */ }
ws.send(JSON.stringify({ type: 'chat', to: 2, content: '你好' }))
```

### 调用示例

```bash
# 登录获取 token
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# 携带 token 访问受保护接口
curl http://localhost:8080/api/user/me \
  -H "Authorization: Bearer <token>"
```

### 统一响应格式

```json
{ "code": 200, "message": "操作成功", "data": { } }
```

| code | 含义 |
| --- | --- |
| 200 | 成功 |
| 400 | 参数错误 |
| 401 | 未登录或登录过期 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 500 | 系统异常 |
| 1001 / 1002 / 1003 / 1004 | 用户名已存在 / 账号或密码错误 / 账号禁用 / Token 无效 |

## 权限用法（新业务直接套用）

```java
// 1. 免登录接口
@Public
@PostMapping("/xxx")
public Result<Void> xxx() { ... }

// 2. 登录即可访问（默认，无需注解）
@GetMapping("/me")
public Result<Void> me() { ... }

// 3. 仅管理员
@RequireRole(RoleEnum.ADMIN)
@GetMapping("/admin-only")
public Result<Void> adminOnly() { ... }

// 4. 控制器中获取当前登录用户
User current = UserContext.get();
```

## 运行测试

```bash
mvn test
```

`src/test/java/.../AuthPermissionTest.java` 包含 12 个集成测试（登录/注册/权限校验），覆盖全部核心功能。

## 新项目复用步骤

1. 复制本目录，删除 `target/`、`sql/` 和测试类
2. 全局替换包名 `com.example.framework` 和 artifactId
3. 修改 `application.yml` 数据库配置与 JWT 密钥
4. 在 `entity/mapper/service/controller` 中开发业务模块，权限注解直接套用

## 生产环境注意

- 修改 `application.yml` 中 `jwt.secret`（至少 32 字符）
- 修改默认管理员账号密码
- 按需关闭 MyBatis SQL 日志（`mybatis-plus.configuration.log-impl`）
