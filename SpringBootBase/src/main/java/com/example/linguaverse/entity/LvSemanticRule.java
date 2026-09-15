package com.example.linguaverse.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

@Data
@TableName("lv_semantic_rule")
public class LvSemanticRule {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long nodeId;
    /**
     * JSON 数组字符串，格式：
     * [{"phrases":["late","delayed"],"dimension":"LATE"},{"phrases":["on her way","coming"],"dimension":"COMING"}]
     * 所有 dimension 都必须命中才算通过（AND 逻辑）
     */
    private String matchPhrases;
    private String onMatchNext;
    private String onFailHint;
}
