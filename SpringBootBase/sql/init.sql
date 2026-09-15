-- 通用框架数据库初始化脚本（MySQL 8.x）
CREATE DATABASE IF NOT EXISTS framework_db DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE framework_db;

DROP TABLE IF EXISTS sys_user;

CREATE TABLE sys_user (
    id          BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键',
    username    VARCHAR(50)  NOT NULL COMMENT '用户名',
    password    VARCHAR(100) NOT NULL COMMENT '密码(BCrypt加密)',
    nickname    VARCHAR(50)  DEFAULT NULL COMMENT '昵称',
    avatar      VARCHAR(500) DEFAULT NULL COMMENT '用户头像',
    role        VARCHAR(20)  NOT NULL DEFAULT 'USER' COMMENT '角色: ADMIN-管理员 USER-普通用户',
    status      TINYINT      NOT NULL DEFAULT 1 COMMENT '状态: 1-启用 0-禁用',
    create_time DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    UNIQUE KEY uk_username (username)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = '用户表';

-- 默认管理员账号 admin / admin123 由应用启动时自动创建（见 DataInitializer），无需手动插入

DROP TABLE IF EXISTS chat_message;

CREATE TABLE chat_message (
    id          BIGINT      NOT NULL AUTO_INCREMENT COMMENT '主键',
    sender_id   BIGINT      NOT NULL COMMENT '发送人ID',
    receiver_id BIGINT      NOT NULL COMMENT '接收人ID',
    content     TEXT        NOT NULL COMMENT '消息内容',
    is_read     TINYINT     NOT NULL DEFAULT 0 COMMENT '是否已读: 0-未读 1-已读',
    create_time DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '发送时间',
    PRIMARY KEY (id),
    KEY idx_sender (sender_id, create_time),
    KEY idx_receiver (receiver_id, is_read, create_time)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = '聊天消息表';
