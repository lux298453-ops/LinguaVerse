package com.example.linguaverse.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.linguaverse.entity.LvSemanticRule;
import com.example.linguaverse.mapper.LvSemanticRuleMapper;
import com.example.linguaverse.service.SemanticJudgeService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class RuleBasedJudgeImpl implements SemanticJudgeService {

    private final LvSemanticRuleMapper ruleMapper;
    private final ObjectMapper objectMapper;

    @Override
    public JudgeResult judge(Long nodeId, String playerInput) {
        String input = playerInput.toLowerCase().trim();

        // 检测中文字符
        if (input.matches(".*[\\u4e00-\\u9fa5]+.*")) {
            return new JudgeResult(false, "LANGUAGE", "Oops! Luna only understands English here. Give it another try! 🌍");
        }

        List<LvSemanticRule> rules = ruleMapper.selectList(
                new LambdaQueryWrapper<LvSemanticRule>().eq(LvSemanticRule::getNodeId, nodeId)
        );

        if (rules.isEmpty()) {
            // 无规则配置时，非空即通过（用于自我介绍等节点）
            return new JudgeResult(!input.isBlank(), "EMPTY", "Please type something in English! 😊");
        }

        for (LvSemanticRule rule : rules) {
            try {
                // matchPhrases 格式：[{"phrases":[...],"dimension":"LATE"},{"phrases":[...],"dimension":"COMING"}]
                List<Map<String, Object>> dimensions = objectMapper.readValue(
                        rule.getMatchPhrases(), new TypeReference<>() {});

                for (Map<String, Object> dim : dimensions) {
                    String dimension = (String) dim.get("dimension");
                    @SuppressWarnings("unchecked")
                    List<String> phrases = (List<String>) dim.get("phrases");
                    boolean dimMatched = phrases.stream().anyMatch(p -> input.contains(p.toLowerCase()));
                    if (!dimMatched) {
                        return new JudgeResult(false, dimension, rule.getOnFailHint());
                    }
                }
                // 所有 dimension 都通过
                return new JudgeResult(true, null, null);
            } catch (Exception e) {
                log.error("解析语义规则失败 nodeId={}", nodeId, e);
            }
        }
        return new JudgeResult(false, "UNKNOWN", "Please try again in English! 💬");
    }
}
