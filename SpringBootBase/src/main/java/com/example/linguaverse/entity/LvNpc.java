package com.example.linguaverse.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("lv_npc")
public class LvNpc {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String npcKey;
    private String name;
    private String mapId;
    private Integer posX;
    private Integer posY;
    private String spriteKey;
    private String personality;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
}
