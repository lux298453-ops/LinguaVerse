package com.example.linguaverse.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.framework.common.Result;
import com.example.framework.util.UserContext;
import com.example.linguaverse.entity.LvNpc;
import com.example.linguaverse.entity.LvPlayer;
import com.example.linguaverse.entity.LvTask;
import com.example.linguaverse.entity.LvTaskProgress;
import com.example.linguaverse.mapper.LvNpcMapper;
import com.example.linguaverse.mapper.LvPlayerMapper;
import com.example.linguaverse.mapper.LvTaskMapper;
import com.example.linguaverse.mapper.LvTaskProgressMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@Slf4j
@RestController
@RequestMapping("/api/linguaverse/tasks")
@RequiredArgsConstructor
public class LvTaskController {

    private final LvTaskMapper taskMapper;
    private final LvNpcMapper npcMapper;
    private final LvTaskProgressMapper progressMapper;
    private final LvPlayerMapper playerMapper;

    /**
     * 获取当前用户所有任务状态与委托书详情
     */
    @GetMapping("/user-quests")
    public Result<List<Map<String, Object>>> getUserQuests() {
        Long userId = UserContext.getUserId();
        if (userId == null) {
            return Result.error(401, "请先登录");
        }

        // 1. 查询所有激活的任务
        List<LvTask> tasks = taskMapper.selectList(
                new LambdaQueryWrapper<LvTask>()
                        .eq(LvTask::getIsActive, 1)
                        .orderByAsc(LvTask::getId)
        );

        // 2. 查询所有 NPC 映射 (npcId -> LvNpc)
        Map<Long, LvNpc> npcMap = new HashMap<>();
        List<LvNpc> npcs = npcMapper.selectList(null);
        for (LvNpc npc : npcs) {
            npcMap.put(npc.getId(), npc);
        }

        // 3. 查询当前用户的所有任务进度 (taskId -> LvTaskProgress)
        Map<Long, LvTaskProgress> progressMap = new HashMap<>();
        List<LvTaskProgress> progressList = progressMapper.selectList(
                new LambdaQueryWrapper<LvTaskProgress>().eq(LvTaskProgress::getUserId, userId)
        );
        for (LvTaskProgress p : progressList) {
            progressMap.put(p.getTaskId(), p);
        }

        // 4. 构建任务视图数据
        List<Map<String, Object>> result = new ArrayList<>();
        for (LvTask task : tasks) {
            Map<String, Object> item = new HashMap<>();
            item.put("taskId", task.getId());
            item.put("taskKey", task.getTaskKey());
            item.put("title", task.getTitle());
            item.put("goalDesc", task.getGoalDesc());
            item.put("rewardCoins", task.getRewardCoins());
            item.put("category", task.getCategory() != null ? task.getCategory() : "MAIN");
            item.put("preTaskId", task.getPreTaskId());

            LvNpc npc = npcMap.get(task.getNpcId());
            if (npc != null) {
                item.put("npcKey", npc.getNpcKey());
                item.put("npcName", npc.getName());
                item.put("npcMapId", npc.getMapId());
                item.put("npcSpriteKey", npc.getSpriteKey());
                item.put("npcPosX", npc.getPosX());
                item.put("npcPosY", npc.getPosY());
            }

            LvTaskProgress p = progressMap.get(task.getId());
            String status = p != null ? p.getStatus() : "NOT_STARTED";
            item.put("status", status);
            item.put("currentNode", p != null ? p.getCurrentNode() : null);

            // 检查前置依赖是否满足
            boolean isLocked = false;
            if (task.getPreTaskId() != null) {
                LvTaskProgress preP = progressMap.get(task.getPreTaskId());
                if (preP == null || !"COMPLETED".equals(preP.getStatus())) {
                    isLocked = true;
                }
            }
            item.put("isLocked", isLocked);

            // 步骤描述
            item.put("currentStepDesc", buildStepDesc(task.getTaskKey(), status, isLocked));

            result.add(item);
        }

        return Result.success(result);
    }

    /**
     * 获取玩家的世界属性（如金币、当前场景等）
     */
    @GetMapping("/player-info")
    public Result<Map<String, Object>> getPlayerInfo() {
        Long userId = UserContext.getUserId();
        if (userId == null) {
            return Result.error(401, "请先登录");
        }

        LvPlayer player = playerMapper.selectOne(
                new LambdaQueryWrapper<LvPlayer>().eq(LvPlayer::getUserId, userId)
        );

        if (player == null) {
            player = new LvPlayer();
            player.setUserId(userId);
            player.setCoins(100);
            player.setMapId("hall");
            player.setPosX(500);
            player.setPosY(350);
            player.setSkin("avatar_blue");
            playerMapper.insert(player);
        } else if (player.getCoins() == null) {
            player.setCoins(100);
            playerMapper.updateById(player);
        }

        Map<String, Object> data = new HashMap<>();
        data.put("userId", userId);
        data.put("coins", player.getCoins());
        data.put("mapId", player.getMapId());
        data.put("posX", player.getPosX());
        data.put("posY", player.getPosY());
        data.put("skin", player.getSkin());

        return Result.success(data);
    }

    private String buildStepDesc(String taskKey, String status, boolean isLocked) {
        if ("COMPLETED".equals(status)) {
            return "已圆满达成！获得该委托的所有经验与金币奖励。";
        }
        if (isLocked) {
            return "前置任务未完成，请先在阳光大厅完成 Mary 的委托。";
        }
        return switch (taskKey) {
            case "mary_message_delivery" -> "前往阳光大厅向 Mary 自我介绍，学习并记住传达给 Luna 的口信。";
            case "luna_receive_message" -> "穿越阳光大厅右侧传送门前往奇幻游戏区，将口信传达给戴紫帽子的 Luna。";
            case "tom_word_alchemy" -> "与阳光大厅炼金学者 Tom 交流，提供一个包含 'tele-' 词根的单词并造句。";
            case "evelyn_lost_codex" -> "穿越阳光大厅左侧传送门进入奥术图书馆，协助馆长 Evelyn 补全星界法典名言并造句。";
            default -> "按照指引寻找对应 NPC 对话交互。";
        };
    }
}
