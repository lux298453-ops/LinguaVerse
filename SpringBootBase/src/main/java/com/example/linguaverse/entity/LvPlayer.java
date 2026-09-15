package com.example.linguaverse.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("lv_player")
public class LvPlayer {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long userId;
    private String mapId;
    private Integer posX;
    private Integer posY;
    private String skin;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}
