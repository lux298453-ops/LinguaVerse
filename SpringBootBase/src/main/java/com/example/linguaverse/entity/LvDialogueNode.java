package com.example.linguaverse.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

@Data
@TableName("lv_dialogue_node")
public class LvDialogueNode {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long taskId;
    private String nodeKey;
    private String nodeType; // NPC_SPEAK / PLAYER_INPUT
    private String content;
    private String contentZh;
    private String nextNodeKey;
    private Integer isTerminal;
    private Integer sortOrder;
}
