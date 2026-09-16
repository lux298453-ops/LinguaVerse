package com.example.linguaverse.config;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.linguaverse.entity.*;
import com.example.linguaverse.mapper.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
@Order(2)
@RequiredArgsConstructor
public class LinguaVerseDataInitializer implements ApplicationRunner {

    private final LvNpcMapper npcMapper;
    private final LvTaskMapper taskMapper;
    private final LvDialogueNodeMapper nodeMapper;
    private final LvSemanticRuleMapper ruleMapper;

    @Override
    public void run(ApplicationArguments args) {
        initMaryNpc();
        initLunaNpc();
        initTomNpc();
        initEvelynNpc();
    }

    private void initLunaNpc() {
        LvNpc luna = npcMapper.selectOne(new LambdaQueryWrapper<LvNpc>().eq(LvNpc::getNpcKey, "luna_friend"));
        LvTask task;
        if (luna == null) {
            // 1. NPC Luna
            luna = new LvNpc();
            luna.setNpcKey("luna_friend");
            luna.setName("Luna");
            luna.setMapId("game_zone");
            luna.setPosX(680);
            luna.setPosY(320);
            luna.setSpriteKey("npc_luna");
            luna.setPersonality("Mary's fun-loving friend at the Game Zone who wears a purple hat! Enthusiastic gamer.");
            npcMapper.insert(luna);

            // 2. 任务：接收口信
            task = new LvTask();
            task.setTaskKey("luna_receive_message");
            task.setNpcId(luna.getId());
            task.setTitle("Luna's Message Delivery");
            task.setGoalDesc("Deliver Mary's message to Luna at the Game Zone.");
            task.setRewardCoins(20);
            task.setIsActive(1);
            taskMapper.insert(task);
        } else {
            task = taskMapper.selectOne(new LambdaQueryWrapper<LvTask>().eq(LvTask::getTaskKey, "luna_receive_message"));
        }

        if (task == null) return;
        Long taskId = task.getId();

        // 3. 对话节点（双语）
        List<LvDialogueNode> nodes = List.of(
            node(taskId, "luna_greeting", "NPC_SPEAK",
                "Hi there! 💜 I'm Luna! Welcome to the Game Zone! Did my friend Mary send you with a message for me?",
                "嗨！💜 我是露娜！欢迎来到奇幻游戏区！是我朋友玛丽托你给我带口信了吗？",
                "player_deliver", 0, 0),
            node(taskId, "player_deliver", "PLAYER_INPUT", null, null, "luna_thanks", 0, 1),
            node(taskId, "luna_thanks", "NPC_SPEAK",
                "Aww, thank you so much! 🙏 So Mary is on her way! I was wondering what took her so long. Here is your reward for delivering the message, my friend! 🌟 Enjoy the games!",
                "哇，太感谢你了！🙏 原来玛丽已经在路上了！我刚才还在纳闷她怎么耽搁了呢。朋友，这是送达口信的丰厚报酬！🌟 尽情享受这里的游戏吧！",
                null, 1, 2)
        );
        saveOrUpdateNodes(nodes);

        Long deliverNodeId = getNodeId(taskId, "player_deliver");
        if (ruleMapper.selectCount(new LambdaQueryWrapper<LvSemanticRule>().eq(LvSemanticRule::getNodeId, deliverNodeId)) == 0) {
            insertRule(deliverNodeId,
                "[{\"phrases\":[\"late\",\"delayed\",\"coming\",\"on her way\",\"on the way\",\"heading\",\"she will be\"],\"dimension\":\"MESSAGE\"}]",
                "luna_thanks",
                "Tell Luna that Mary will be late or is on her way! 💬");
        }

        log.info("✅ LinguaVerse 数据校验/更新完成：Luna NPC + 送达任务双语剧本");
    }

    private void initTomNpc() {
        LvNpc tom = npcMapper.selectOne(new LambdaQueryWrapper<LvNpc>().eq(LvNpc::getNpcKey, "tom_alchemist"));
        LvTask task;
        if (tom == null) {
            tom = new LvNpc();
            tom.setNpcKey("tom_alchemist");
            tom.setName("Tom");
            tom.setMapId("hall");
            tom.setPosX(180);
            tom.setPosY(320);
            tom.setSpriteKey("npc_tom");
            tom.setPersonality("A curious lexical alchemist obsessed with word roots and prefixes. Loves teaching Latin & Greek roots.");
            npcMapper.insert(tom);

            task = new LvTask();
            task.setTaskKey("tom_word_alchemy");
            task.setNpcId(tom.getId());
            task.setTitle("The Lexical Crucible");
            task.setGoalDesc("Help Alchemist Tom calibrate his cauldron with a 'tele-' root word and an explanatory sentence.");
            task.setRewardCoins(15);
            task.setCategory("ACADEMIC");
            task.setIsActive(1);
            taskMapper.insert(task);
        } else {
            task = taskMapper.selectOne(new LambdaQueryWrapper<LvTask>().eq(LvTask::getTaskKey, "tom_word_alchemy"));
        }

        if (task == null) return;
        Long taskId = task.getId();

        List<LvDialogueNode> nodes = List.of(
            node(taskId, "tom_greeting", "NPC_SPEAK",
                "Greetings, traveler! ⚗️ I am Tom, the lexical alchemist of Sunshine Hall! My crucible extracts energy from classical roots. Today, I am researching the Greek root 'tele-', which means 'far' or 'distant'. Can you give me an English word that begins with or contains 'tele'?",
                "向你致敬，旅者！⚗️ 我是阳光大厅的词根炼金学者汤姆（Tom）！我的熔炉专门从古典词根中萃取知识能量。今天我正在研究希腊语词根'tele-'（意为'遥远'或'远距离'）。你能给我一个以'tele'开头或包含它的英文单词吗？",
                "player_tele_word", 0, 0),
            node(taskId, "player_tele_word", "PLAYER_INPUT", null, null, "tom_ask_sentence", 0, 1),
            node(taskId, "tom_ask_sentence", "NPC_SPEAK",
                "Astounding! The magical resonance is surging! ✨ Now, can you write a short English sentence telling me how we use this invention or power?",
                "令人惊叹！魔法共鸣正在剧烈涌动！✨ 现在，你能写一句简短的英文句子，告诉我我们平时是如何使用这项发明或力量的吗？",
                "player_sentence", 0, 2),
            node(taskId, "player_sentence", "PLAYER_INPUT", null, null, "tom_success", 0, 3),
            node(taskId, "tom_success", "NPC_SPEAK",
                "By Merlin's quill, it worked! 🌟 The cauldron is glowing with pure lexical ether! Take these 15 gold coins as your research stipend, my esteemed apprentice! Keep exploring the power of words!",
                "以梅林的羽毛笔起誓，它真的成功了！🌟 坩埚正在绽放出纯净的词汇以太光芒！收下这 15 枚金币作为你的研习津贴，我最敬重的学徒！继续探索词汇蕴含的无尽力量吧！",
                null, 1, 4)
        );
        saveOrUpdateNodes(nodes);

        Long wordNodeId = getNodeId(taskId, "player_tele_word");
        Long sentenceNodeId = getNodeId(taskId, "player_sentence");

        if (ruleMapper.selectCount(new LambdaQueryWrapper<LvSemanticRule>().eq(LvSemanticRule::getNodeId, wordNodeId)) == 0) {
            insertRule(wordNodeId,
                "[{\"phrases\":[\"telescope\",\"telephone\",\"television\",\"teleport\",\"telegram\",\"telepathy\",\"telephoto\",\"telecom\"],\"dimension\":\"TELE_ROOT\"}]",
                "tom_ask_sentence",
                "Tom needs a valid word with the root 'tele-' (meaning distant)! Try: 'telescope', 'telephone', 'television', or 'teleport'. ⚗️");
        }

        if (ruleMapper.selectCount(new LambdaQueryWrapper<LvSemanticRule>().eq(LvSemanticRule::getNodeId, sentenceNodeId)) == 0) {
            insertRule(sentenceNodeId,
                "[{\"phrases\":[\"tele\",\"phone\",\"scope\",\"port\",\"vision\",\"use\",\"can\",\"see\",\"talk\",\"call\",\"watch\",\"look\",\"travel\",\"send\",\"far\",\"distance\",\"world\",\"star\"],\"dimension\":\"TELE_USAGE\"}]",
                "tom_success",
                "Write a meaningful sentence about what this word does! For example: 'A telescope helps us see far away stars.' or 'We use a telephone to call someone.' 💬");
        }

        log.info("✅ LinguaVerse 数据校验/更新完成：Tom NPC + 词根炼金双语剧本");
    }

    private void initEvelynNpc() {
        LvNpc evelyn = npcMapper.selectOne(new LambdaQueryWrapper<LvNpc>().eq(LvNpc::getNpcKey, "evelyn_archivist"));
        LvTask task;
        if (evelyn == null) {
            evelyn = new LvNpc();
            evelyn.setNpcKey("evelyn_archivist");
            evelyn.setName("Evelyn");
            evelyn.setMapId("library");
            evelyn.setPosX(600);
            evelyn.setPosY(380);
            evelyn.setSpriteKey("npc_evelyn");
            evelyn.setPersonality("The Grand Archivist of the Arcane Library. Scholar of classical literary maxims, grammar, and starry codices.");
            npcMapper.insert(evelyn);

            task = new LvTask();
            task.setTaskKey("evelyn_lost_codex");
            task.setNpcId(evelyn.getId());
            task.setTitle("The Lost Astral Codex");
            task.setGoalDesc("Help Archivist Evelyn restore the damaged Astral Codex with the philosophical keyword 'exercise' and write a sentence about reading.");
            task.setRewardCoins(20);
            task.setCategory("ACADEMIC");
            task.setIsActive(1);
            taskMapper.insert(task);
        } else {
            task = taskMapper.selectOne(new LambdaQueryWrapper<LvTask>().eq(LvTask::getTaskKey, "evelyn_lost_codex"));
        }

        if (task == null) return;
        Long taskId = task.getId();

        List<LvDialogueNode> nodes = List.of(
            node(taskId, "evelyn_greeting", "NPC_SPEAK",
                "Welcome, seeker of wisdom! 📖 I am Evelyn, Grand Archivist of the Arcane Library. Here, millions of starry grimoires record the wisdom of the cosmos. Right now, I am restoring a torn page of our Astral Codex, which contains a celebrated proverb. Can you help me decipher it?",
                "欢迎你，求知者！📖 我是艾芙琳（Evelyn），奥术图书馆的首席大档案官。在这里，数以百万计的星界古卷记录着全宇宙的深奥智慧。眼下，我正在尝试修复星界法典上一页破损的残卷，上面记载着一句著名的哲学箴言。你能协助我解密它吗？",
                "player_ready", 0, 0),
            node(taskId, "player_ready", "PLAYER_INPUT", null, null, "evelyn_riddle", 0, 1),
            node(taskId, "evelyn_riddle", "NPC_SPEAK",
                "Listen closely to the ancient inscription: 'Reading is to the mind what _______ is to the body.' What physical discipline or activity is compared to reading here?",
                "仔细聆听远古的铭文：'Reading is to the mind what _______ is to the body'（阅读之于心灵，犹如_______之于身体）。这里是将哪种强健体魄的身体运动或锻炼与阅读作对比呢？",
                "player_keyword", 0, 2),
            node(taskId, "player_keyword", "PLAYER_INPUT", null, null, "evelyn_ask_sentence", 0, 3),
            node(taskId, "evelyn_ask_sentence", "NPC_SPEAK",
                "Exquisite! 'Reading is to the mind what exercise is to the body!' The golden runes are illuminating! ✨ Now, to anchor this cosmic truth forever into the codex, write a short English sentence telling me how reading empowers your mind!",
                "精妙绝伦！'阅读之于心灵，犹如锻炼（exercise）之于身体！' 金色的古符文正在重新点亮！✨ 现在，为了将这份宇宙真理永久印刻回法典中，请写一句简短的英文句子，告诉我阅读是如何赋能并启发你的心灵的！",
                "player_sentence", 0, 4),
            node(taskId, "player_sentence", "PLAYER_INPUT", null, null, "evelyn_success", 0, 5),
            node(taskId, "evelyn_success", "NPC_SPEAK",
                "Magnificent! The Astral Codex is fully restored and glowing with starlight! 🌟 As promised, receive 20 gold coins and the eternal honor of a true Codex Keeper! May your pursuit of knowledge never dim!",
                "壮丽非凡！星界法典已经彻底恢复完整，重新绽放出璀璨的星芒！🌟 按照约定，收下这 20 枚星语金币和'典籍守护者'的永恒荣耀！愿你对知识的探索之火永不熄灭！",
                null, 1, 6)
        );
        saveOrUpdateNodes(nodes);

        Long readyNodeId = getNodeId(taskId, "player_ready");
        Long keywordNodeId = getNodeId(taskId, "player_keyword");
        Long sentenceNodeId = getNodeId(taskId, "player_sentence");

        if (ruleMapper.selectCount(new LambdaQueryWrapper<LvSemanticRule>().eq(LvSemanticRule::getNodeId, readyNodeId)) == 0) {
            insertRule(readyNodeId,
                "[{\"phrases\":[\"yes\",\"sure\",\"ok\",\"okay\",\"i can\",\"help\",\"ready\",\"tell me\",\"of course\",\"glad to\",\"happy to\"],\"dimension\":\"AGREE_HELP\"}]",
                "evelyn_riddle",
                "Tell Evelyn you are ready to help decipher the codex! Try: 'Sure, I can help!' or 'I am ready.' 📜");
        }

        if (ruleMapper.selectCount(new LambdaQueryWrapper<LvSemanticRule>().eq(LvSemanticRule::getNodeId, keywordNodeId)) == 0) {
            insertRule(keywordNodeId,
                "[{\"phrases\":[\"exercise\",\"sport\",\"sports\",\"workout\",\"training\",\"gym\",\"running\"],\"dimension\":\"EXERCISE_KEYWORD\"}]",
                "evelyn_ask_sentence",
                "What physical activity strengthens the body like reading strengthens the mind? Hint: The word starts with 'ex' (exercise)! 💡");
        }

        if (ruleMapper.selectCount(new LambdaQueryWrapper<LvSemanticRule>().eq(LvSemanticRule::getNodeId, sentenceNodeId)) == 0) {
            insertRule(sentenceNodeId,
                "[{\"phrases\":[\"read\",\"reading\",\"book\",\"books\",\"mind\",\"brain\",\"knowledge\",\"learn\",\"help\",\"makes\",\"grow\",\"world\",\"think\",\"smart\"],\"dimension\":\"READING_BENEFIT\"}]",
                "evelyn_success",
                "Write a sentence in English about how reading helps your mind! For example: 'Reading books makes my mind strong.' or 'Reading expands our knowledge.' 💬");
        }

        log.info("✅ LinguaVerse 数据校验/更新完成：Evelyn NPC + 失落星界法典双语剧本");
    }

    private void initMaryNpc() {
        LvNpc mary = npcMapper.selectOne(new LambdaQueryWrapper<LvNpc>().eq(LvNpc::getNpcKey, "mary_guide"));
        LvTask task;
        if (mary == null) {
            mary = new LvNpc();
            mary.setNpcKey("mary_guide");
            mary.setName("Mary");
            mary.setMapId("hall");
            mary.setPosX(400);
            mary.setPosY(280);
            mary.setSpriteKey("npc_mary");
            mary.setPersonality("A friendly and enthusiastic guide who loves helping newcomers. Always speaks in English.");
            npcMapper.insert(mary);

            task = new LvTask();
            task.setTaskKey("mary_message_delivery");
            task.setNpcId(mary.getId());
            task.setTitle("The Missing Message");
            task.setGoalDesc("Help Mary deliver a message to her friend Luna at the Game Zone.");
            task.setRewardCoins(10);
            task.setIsActive(1);
            taskMapper.insert(task);
        } else {
            task = taskMapper.selectOne(new LambdaQueryWrapper<LvTask>().eq(LvTask::getTaskKey, "mary_message_delivery"));
        }

        if (task == null) return;
        Long taskId = task.getId();

        List<LvDialogueNode> nodes = List.of(
            node(taskId, "greeting", "NPC_SPEAK",
                "Oh! A newcomer! ✨ Welcome to LinguaVerse, the most talkative place in the universe! I'm Mary, your guide here in Sunshine Hall. What's your name, friend?",
                "噢！新来的冒险家！✨ 欢迎来到灵语星界（LinguaVerse），全宇宙最热闹健谈的地方！我是玛丽（Mary），你在阳光大厅的专属向导。你的名字叫什么呀，新朋友？",
                "player_intro", 0, 0),
            node(taskId, "player_intro", "PLAYER_INPUT", null, null, "task_offer", 0, 1),
            node(taskId, "task_offer", "NPC_SPEAK",
                "What a wonderful name! 🌟 Listen, I'm in a bit of a pickle right now. My dear friend Luna is waiting for me at the Game Zone, but I simply cannot leave my post here. Could you do me a huge favor?",
                "多棒的名字呀！🌟 听我说，我现在有点脱不开身。我亲爱的朋友露娜（Luna）正在奇幻游戏区等我，但我必须坚守迎宾岗位。你能帮我一个大忙吗？",
                "player_agree", 0, 2),
            node(taskId, "player_agree", "PLAYER_INPUT", null, null, "task_detail", 0, 3),
            node(taskId, "task_detail", "NPC_SPEAK",
                "Oh, you're a lifesaver! 🙏 Please find Luna near the game tables — she's the one with the purple hat. Tell her this message: 'Mary will be a little late, but she's on her way.' Can you repeat that message back to me first? Just to make sure I can trust you with it! 😄",
                "噢，你真是救星！🙏 请去游戏桌附近找露娜——她戴着一顶标志性的紫色帽子。把这句口信带给她：'Mary will be a little late, but she's on her way'（玛丽会稍稍迟到，但她已经在路上了）。你能先向我复述一遍这句口信吗？确保万无一失！😄",
                "player_repeat", 0, 4),
            node(taskId, "player_repeat", "PLAYER_INPUT", null, null, "task_complete", 0, 5),
            node(taskId, "task_complete", "NPC_SPEAK",
                "PERFECT! 🎉 That's exactly right! You're a natural communicator! Now go find Luna — she's near the colorful game tables on the right side of the hall. Just look for the purple hat! 💜 Thank you so much, friend. You've earned this! ⭐",
                "太完美了！🎉 一字不差！你简直是天生的沟通大师！现在穿过右侧传送门去找露娜吧——她就在大厅右侧五彩斑斓的游戏桌旁，认准那顶紫帽子就行！💜 万分感谢你，朋友，这是你应得的报酬！⭐",
                null, 1, 6)
        );
        saveOrUpdateNodes(nodes);

        Long introNodeId = getNodeId(taskId, "player_intro");
        Long agreeNodeId = getNodeId(taskId, "player_agree");
        Long repeatNodeId = getNodeId(taskId, "player_repeat");

        if (ruleMapper.selectCount(new LambdaQueryWrapper<LvSemanticRule>().eq(LvSemanticRule::getNodeId, introNodeId)) == 0) {
            insertRule(introNodeId,
                "[{\"phrases\":[\"i'm\",\"i am\",\"my name is\",\"call me\",\"i go by\",\"hi\",\"hello\",\"hey\"],\"dimension\":\"INTRO\"}]",
                "task_offer",
                "Try introducing yourself! For example: 'I'm Alex!' or 'My name is Leo.' 😊");
        }

        if (ruleMapper.selectCount(new LambdaQueryWrapper<LvSemanticRule>().eq(LvSemanticRule::getNodeId, agreeNodeId)) == 0) {
            insertRule(agreeNodeId,
                "[{\"phrases\":[\"yes\",\"sure\",\"okay\",\"ok\",\"of course\",\"no problem\",\"i can\",\"i will\",\"happy to\",\"love to\",\"glad to\",\"absolutely\"],\"dimension\":\"AGREE\"}]",
                "task_detail",
                "Mary needs a 'yes' or 'no'! Try: 'Sure, I can help!' or 'Of course!' 💪");
        }

        if (ruleMapper.selectCount(new LambdaQueryWrapper<LvSemanticRule>().eq(LvSemanticRule::getNodeId, repeatNodeId)) == 0) {
            insertRule(repeatNodeId,
                "[{\"phrases\":[\"late\",\"delayed\",\"a bit late\",\"running late\",\"behind\",\"not on time\"],\"dimension\":\"LATE\"}" +
                ",{\"phrases\":[\"on her way\",\"coming\",\"heading there\",\"will be there\",\"she's coming\",\"on the way\",\"on my way\"],\"dimension\":\"COMING\"}]",
                "task_complete",
                "Make sure you include BOTH: that Mary is late AND that she's coming! 🔑");
        }

        log.info("✅ LinguaVerse 数据校验/更新完成：Mary NPC + 初始引导双语剧本");
    }

    private LvDialogueNode node(Long taskId, String key, String type, String content, String contentZh, String nextKey, int terminal, int order) {
        LvDialogueNode n = new LvDialogueNode();
        n.setTaskId(taskId);
        n.setNodeKey(key);
        n.setNodeType(type);
        n.setContent(content);
        n.setContentZh(contentZh);
        n.setNextNodeKey(nextKey);
        n.setIsTerminal(terminal);
        n.setSortOrder(order);
        return n;
    }

    private void saveOrUpdateNodes(List<LvDialogueNode> nodes) {
        for (LvDialogueNode n : nodes) {
            LvDialogueNode existing = nodeMapper.selectOne(
                new LambdaQueryWrapper<LvDialogueNode>()
                    .eq(LvDialogueNode::getTaskId, n.getTaskId())
                    .eq(LvDialogueNode::getNodeKey, n.getNodeKey())
            );
            if (existing != null) {
                existing.setContent(n.getContent());
                existing.setContentZh(n.getContentZh());
                existing.setNextNodeKey(n.getNextNodeKey());
                existing.setIsTerminal(n.getIsTerminal());
                existing.setSortOrder(n.getSortOrder());
                nodeMapper.updateById(existing);
            } else {
                nodeMapper.insert(n);
            }
        }
    }

    private void insertRule(Long nodeId, String phrases, String matchNext, String failHint) {
        LvSemanticRule rule = new LvSemanticRule();
        rule.setNodeId(nodeId);
        rule.setMatchPhrases(phrases);
        rule.setOnMatchNext(matchNext);
        rule.setOnFailHint(failHint);
        ruleMapper.insert(rule);
    }

    private Long getNodeId(Long taskId, String nodeKey) {
        return nodeMapper.selectOne(
            new LambdaQueryWrapper<LvDialogueNode>()
                .eq(LvDialogueNode::getTaskId, taskId)
                .eq(LvDialogueNode::getNodeKey, nodeKey)
        ).getId();
    }
}
