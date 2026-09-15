package com.example.linguaverse.service;

public interface SemanticJudgeService {
    /**
     * 判断玩家输入是否满足该节点的语义要求
     * @param nodeId 对话节点 ID
     * @param playerInput 玩家输入的原始文本
     * @return JudgeResult
     */
    JudgeResult judge(Long nodeId, String playerInput);

    record JudgeResult(boolean passed, String failedDimension, String hint) {}
}
