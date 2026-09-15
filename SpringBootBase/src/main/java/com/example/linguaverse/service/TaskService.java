package com.example.linguaverse.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.linguaverse.dto.WorldMessage;
import com.example.linguaverse.entity.*;
import com.example.linguaverse.mapper.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class TaskService {

    private final LvTaskMapper taskMapper;
    private final LvDialogueNodeMapper nodeMapper;
    private final LvTaskProgressMapper progressMapper;
    private final LvSemanticRuleMapper ruleMapper;
    private final LvPlayerMapper playerMapper;
    private final SemanticJudgeService judgeService;

    private static final int MAX_RETRY = 3;

    /**
     * 玩家点击 NPC，初始化或恢复任务，返回第一个对话节点内容
     */
    public LvDialogueNode startTask(Long userId, Long taskId) {
        LvTask task = taskMapper.selectById(taskId);
        if (task != null && task.getPreTaskId() != null) {
            LvTaskProgress preProgress = progressMapper.selectOne(
                    new LambdaQueryWrapper<LvTaskProgress>()
                            .eq(LvTaskProgress::getUserId, userId)
                            .eq(LvTaskProgress::getTaskId, task.getPreTaskId())
            );
            if (preProgress == null || !"COMPLETED".equals(preProgress.getStatus())) {
                LvTask preTask = taskMapper.selectById(task.getPreTaskId());
                String preTitle = preTask != null ? preTask.getTitle() : "the previous quest";
                LvDialogueNode lockedNode = new LvDialogueNode();
                lockedNode.setTaskId(taskId);
                lockedNode.setNodeKey("QUEST_LOCKED");
                lockedNode.setNodeType("NPC_SPEAK");
                lockedNode.setIsTerminal(1);
                lockedNode.setContent("Hi there! 💜 I'm waiting for news from Mary at Sunshine Hall. Please complete the quest '" + preTitle + "' first before delivering the message!");
                return lockedNode;
            }
        }

        LvTaskProgress progress = getOrCreateProgress(userId, taskId);
        if ("COMPLETED".equals(progress.getStatus())) {
            // 已完成任务，优先返回该任务的终止节点以供重复查看或感谢
            LvDialogueNode terminalNode = nodeMapper.selectOne(
                    new LambdaQueryWrapper<LvDialogueNode>()
                            .eq(LvDialogueNode::getTaskId, taskId)
                            .eq(LvDialogueNode::getIsTerminal, 1)
            );
            if (terminalNode != null) {
                return terminalNode;
            }
            if (progress.getCurrentNode() != null) {
                LvDialogueNode currNode = getNodeByKey(taskId, progress.getCurrentNode());
                if (currNode != null) return currNode;
            }
            return null;
        }

        LvDialogueNode node = getNodeByKey(taskId, progress.getCurrentNode());
        if (node == null) {
            // 如果 progress.getCurrentNode() 无效，重置回初始节点
            List<LvDialogueNode> nodes = nodeMapper.selectList(
                    new LambdaQueryWrapper<LvDialogueNode>()
                            .eq(LvDialogueNode::getTaskId, taskId)
                            .orderByAsc(LvDialogueNode::getSortOrder));
            if (!nodes.isEmpty()) {
                node = nodes.get(0);
                progress.setCurrentNode(node.getNodeKey());
                progressMapper.updateById(progress);
            }
        }

        // 如果当前停留在等待玩家输入节点（例如 player_repeat, player_agree, player_intro），
        // 查找指向该输入节点的 NPC 说话节点，让 Mary 重新播报对应步骤的提示
        if (node != null && "PLAYER_INPUT".equals(node.getNodeType())) {
            LvDialogueNode promptNode = nodeMapper.selectOne(
                    new LambdaQueryWrapper<LvDialogueNode>()
                            .eq(LvDialogueNode::getTaskId, taskId)
                            .eq(LvDialogueNode::getNextNodeKey, node.getNodeKey())
            );
            if (promptNode != null) {
                return promptNode;
            }
        }
        return node;
    }

    /**
     * 处理玩家的对话输入，返回响应结果
     */
    public HandleResult handlePlayerInput(Long userId, Long taskId, String nodeKey, String playerInput) {
        LvTaskProgress progress = progressMapper.selectOne(
                new LambdaQueryWrapper<LvTaskProgress>()
                        .eq(LvTaskProgress::getUserId, userId)
                        .eq(LvTaskProgress::getTaskId, taskId));
        if (progress == null) return HandleResult.error("Task not started");

        // 如果前端未传 nodeKey，或传了空，从 progress.getCurrentNode() 取
        if (nodeKey == null || nodeKey.isBlank()) {
            nodeKey = progress.getCurrentNode();
        }

        LvDialogueNode node = getNodeByKey(taskId, nodeKey);
        if (node == null) return HandleResult.error("Node not found");

        // 如果当前节点是 NPC_SPEAK，自动尝试获取它的下一个 PLAYER_INPUT 节点
        if ("NPC_SPEAK".equals(node.getNodeType()) && node.getNextNodeKey() != null) {
            node = getNodeByKey(taskId, node.getNextNodeKey());
            if (node == null) return HandleResult.error("Node not found");
        }

        if (!"PLAYER_INPUT".equals(node.getNodeType())) {
            return HandleResult.error("Not an input node");
        }

        // 语义判定
        SemanticJudgeService.JudgeResult judgeResult = judgeService.judge(node.getId(), playerInput);

        if (judgeResult.passed()) {
            // 判定通过：推进到下一节点（通常是 NPC_SPEAK）
            LvDialogueNode nextNode = node.getNextNodeKey() != null
                    ? getNodeByKey(taskId, node.getNextNodeKey()) : null;

            if (node.getIsTerminal() == 1 || nextNode == null || nextNode.getIsTerminal() == 1) {
                // 任务完成
                progress.setStatus("COMPLETED");
                progress.setCurrentNode(nextNode != null ? nextNode.getNodeKey() : node.getNodeKey());
                progress.setCompleteTime(LocalDateTime.now());
                progressMapper.updateById(progress);

                LvTask task = taskMapper.selectById(taskId);
                int rewardCoins = (task != null && task.getRewardCoins() != null) ? task.getRewardCoins() : 10;
                String taskTitle = (task != null && task.getTitle() != null) ? task.getTitle() : "Quest";
                int totalCoins = 100;
                LvPlayer player = playerMapper.selectOne(new LambdaQueryWrapper<LvPlayer>().eq(LvPlayer::getUserId, userId));
                if (player != null) {
                    int currentCoins = player.getCoins() != null ? player.getCoins() : 100;
                    totalCoins = currentCoins + rewardCoins;
                    player.setCoins(totalCoins);
                    playerMapper.updateById(player);
                }
                return HandleResult.success(nextNode, true, null, rewardCoins, taskTitle, totalCoins);
            } else {
                // 如果 nextNode 是 NPC_SPEAK，找出其随后的 PLAYER_INPUT 节点作为后续输入节点
                String nextInputNodeKey = nextNode.getNextNodeKey();
                progress.setCurrentNode(nextInputNodeKey != null ? nextInputNodeKey : nextNode.getNodeKey());
                progress.setRetryCount(0);
                progressMapper.updateById(progress);
                return HandleResult.success(nextNode, false, nextInputNodeKey, 0, null, null);
            }
        } else {
            // 判定失败
            int retryCount = progress.getRetryCount() + 1;
            progress.setRetryCount(retryCount);
            progressMapper.updateById(progress);

            String hint = judgeResult.hint();
            // 重试超过 MAX_RETRY 次，给出答案提示
            if (retryCount >= MAX_RETRY) {
                hint = (hint != null ? hint + " " : "") +
                        "💡 Hint: Try something like: \"Mary will be late, but she's on her way.\""; 
                progress.setRetryCount(0); // 重置重试次数，放宽下次判定
                progressMapper.updateById(progress);
            }
            return HandleResult.failed(hint);
        }
    }

    private LvTaskProgress getOrCreateProgress(Long userId, Long taskId) {
        LvTaskProgress progress = progressMapper.selectOne(
                new LambdaQueryWrapper<LvTaskProgress>()
                        .eq(LvTaskProgress::getUserId, userId)
                        .eq(LvTaskProgress::getTaskId, taskId));
        if (progress == null) {
            // 获取第一个节点
            List<LvDialogueNode> nodes = nodeMapper.selectList(
                    new LambdaQueryWrapper<LvDialogueNode>()
                            .eq(LvDialogueNode::getTaskId, taskId)
                            .orderByAsc(LvDialogueNode::getSortOrder));
            progress = new LvTaskProgress();
            progress.setUserId(userId);
            progress.setTaskId(taskId);
            progress.setStatus("IN_PROGRESS");
            progress.setCurrentNode(nodes.isEmpty() ? null : nodes.get(0).getNodeKey());
            progress.setRetryCount(0);
            progressMapper.insert(progress);
        }
        return progress;
    }

    private LvDialogueNode getNodeByKey(Long taskId, String nodeKey) {
        return nodeMapper.selectOne(
                new LambdaQueryWrapper<LvDialogueNode>()
                        .eq(LvDialogueNode::getTaskId, taskId)
                        .eq(LvDialogueNode::getNodeKey, nodeKey));
    }

    public record HandleResult(
            boolean passed,
            LvDialogueNode nextNode,
            boolean taskComplete,
            String nextInputNodeKey,
            String hint,
            Integer rewardCoins,
            String taskTitle,
            Integer totalCoins
    ) {
        static HandleResult success(LvDialogueNode next, boolean complete, String nextInputNodeKey, Integer rewardCoins, String taskTitle, Integer totalCoins) {
            return new HandleResult(true, next, complete, nextInputNodeKey, null, rewardCoins, taskTitle, totalCoins);
        }
        static HandleResult failed(String hint) {
            return new HandleResult(false, null, false, null, hint, 0, null, null);
        }
        static HandleResult error(String msg) {
            return new HandleResult(false, null, false, null, msg, 0, null, null);
        }
    }
}
