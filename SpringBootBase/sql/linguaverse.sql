-- LinguaVerse 扩展表（在 framework_db 库中执行）
USE framework_db;

DROP TABLE IF EXISTS lv_task_progress;
DROP TABLE IF EXISTS lv_semantic_rule;
DROP TABLE IF EXISTS lv_dialogue_node;
DROP TABLE IF EXISTS lv_task;
DROP TABLE IF EXISTS lv_npc;
DROP TABLE IF EXISTS lv_player;

CREATE TABLE lv_player (
    id          BIGINT      NOT NULL AUTO_INCREMENT,
    user_id     BIGINT      NOT NULL,
    map_id      VARCHAR(50) NOT NULL DEFAULT 'hall',
    pos_x       INT         NOT NULL DEFAULT 400,
    pos_y       INT         NOT NULL DEFAULT 300,
    skin        VARCHAR(50) NOT NULL DEFAULT 'avatar_blue',
    create_time DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='玩家Avatar状态';

CREATE TABLE lv_npc (
    id          BIGINT      NOT NULL AUTO_INCREMENT,
    npc_key     VARCHAR(50) NOT NULL,
    name        VARCHAR(50) NOT NULL,
    map_id      VARCHAR(50) NOT NULL,
    pos_x       INT         NOT NULL,
    pos_y       INT         NOT NULL,
    sprite_key  VARCHAR(50) NOT NULL,
    personality TEXT,
    create_time DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_npc_key (npc_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='NPC配置';

CREATE TABLE lv_task (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    task_key    VARCHAR(100) NOT NULL,
    npc_id      BIGINT       NOT NULL,
    title       VARCHAR(200) NOT NULL,
    goal_desc   TEXT         NOT NULL,
    reward_coins INT         NOT NULL DEFAULT 10,
    is_active   TINYINT      NOT NULL DEFAULT 1,
    create_time DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_task_key (task_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='任务模板';

CREATE TABLE lv_dialogue_node (
    id            BIGINT       NOT NULL AUTO_INCREMENT,
    task_id       BIGINT       NOT NULL,
    node_key      VARCHAR(100) NOT NULL,
    node_type     VARCHAR(20)  NOT NULL,
    content       TEXT,
    content_zh    TEXT,
    next_node_key VARCHAR(100),
    is_terminal   TINYINT      NOT NULL DEFAULT 0,
    sort_order    INT          NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    KEY idx_task_node (task_id, node_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='对话节点';

CREATE TABLE lv_semantic_rule (
    id             BIGINT NOT NULL AUTO_INCREMENT,
    node_id        BIGINT NOT NULL,
    match_phrases  TEXT   NOT NULL,
    on_match_next  VARCHAR(100),
    on_fail_hint   TEXT,
    PRIMARY KEY (id),
    KEY idx_node_id (node_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='语义规则';

CREATE TABLE lv_task_progress (
    id            BIGINT       NOT NULL AUTO_INCREMENT,
    user_id       BIGINT       NOT NULL,
    task_id       BIGINT       NOT NULL,
    status        VARCHAR(20)  NOT NULL DEFAULT 'IN_PROGRESS',
    current_node  VARCHAR(100),
    retry_count   INT          NOT NULL DEFAULT 0,
    create_time   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    complete_time DATETIME,
    PRIMARY KEY (id),
    UNIQUE KEY uk_user_task (user_id, task_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='玩家任务进度';
