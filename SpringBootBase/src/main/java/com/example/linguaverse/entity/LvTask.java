package com.example.linguaverse.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("lv_task")
public class LvTask {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String taskKey;
    private Long npcId;
    private String title;
    private String goalDesc;
    private Integer rewardCoins;
    private Integer isActive;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
}
