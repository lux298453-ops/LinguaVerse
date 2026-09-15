package com.example.linguaverse.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("lv_task_progress")
public class LvTaskProgress {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long userId;
    private Long taskId;
    private String status; // IN_PROGRESS / COMPLETED / SKIPPED
    private String currentNode;
    private Integer retryCount;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
    private LocalDateTime completeTime;
}
