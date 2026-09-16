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
        if (npcMapper.selectCount(new LambdaQueryWrapper<LvNpc>().eq(LvNpc::getNpcKey, "luna_friend")) > 0) {
            return;
        }

        // 1. NPC Luna
        LvNpc luna = new LvNpc();
        luna.setNpcKey("luna_friend");
        luna.setName("Luna");
        luna.setMapId("game_zone");
        luna.setPosX(680);
        luna.setPosY(320);
        luna.setSpriteKey("npc_luna");
        luna.setPersonality("Mary's fun-loving friend at the Game Zone who wears a purple hat! Enthusiastic gamer.");
        npcMapper.insert(luna);

        // 2. 任务：接收口信
        LvTask task = new LvTask();
        task.setTaskKey("luna_receive_message");
        task.setNpcId(luna.getId());
        task.setTitle("Luna's Message Delivery");
        task.setGoalDesc("Deliver Mary's message to Luna at the Game Zone.");
        task.setRewardCoins(20);
        task.setIsActive(1);
        taskMapper.insert(task);
        Long taskId = task.getId();

        // 3. 对话节点
        List<LvDialogueNode> nodes = List.of(
            node(taskId, "luna_greeting", "NPC_SPEAK",
                "Hi there! 💜 I'm Luna! Welcome to the Game Zone! Did my friend Mary send you with a message for me?",
                "player_deliver", 0, 0),
            node(taskId, "player_deliver", "PLAYER_INPUT", null, "luna_thanks", 0, 1),
            node(taskId, "luna_thanks", "NPC_SPEAK",
                "Aww, thank you so much! 🙏 So Mary is on her way! I was wondering what took her so long. Here is your reward for delivering the message, my friend! 🌟 Enjoy the games!",
                null, 1, 2)
        );
        nodes.forEach(n -> nodeMapper.insert(n));

        Long deliverNodeId = getNodeId(taskId, "player_deliver");

        // 4. 语义规则：必须传达 Mary 迟到或在途
        insertRule(deliverNodeId,
            "[{\"phrases\":[\"late\",\"delayed\",\"coming\",\"on her way\",\"on the way\",\"heading\",\"she will be\"],\"dimension\":\"MESSAGE\"}]",
            "luna_thanks",
            "Tell Luna that Mary will be late or is on her way! 💬");

        log.info("✅ LinguaVerse 初始数据写入完成：Luna NPC + 送达任务剧本");
    }

    private void initTomNpc() {
        if (npcMapper.selectCount(new LambdaQueryWrapper<LvNpc>().eq(LvNpc::getNpcKey, "tom_alchemist")) > 0) {
            return;
        }

        // 1. NPC Tom
        LvNpc tom = new LvNpc();
        tom.setNpcKey("tom_alchemist");
        tom.setName("Tom");
        tom.setMapId("hall");
        tom.setPosX(180);
        tom.setPosY(320);
        tom.setSpriteKey("npc_tom");
        tom.setPersonality("A curious lexical alchemist obsessed with word roots and prefixes. Loves teaching Latin & Greek roots.");
        npcMapper.insert(tom);

        // 2. 任务：词根炼金
        LvTask task = new LvTask();
        task.setTaskKey("tom_word_alchemy");
        task.setNpcId(tom.getId());
        task.setTitle("The Lexical Crucible");
        task.setGoalDesc("Help Alchemist Tom calibrate his cauldron with a 'tele-' root word and an explanatory sentence.");
        task.setRewardCoins(15);
        task.setCategory("ACADEMIC");
        task.setIsActive(1);
        taskMapper.insert(task);
        Long taskId = task.getId();

        // 3. 对话节点
        List<LvDialogueNode> nodes = List.of(
            node(taskId, "tom_greeting", "NPC_SPEAK",
                "Greetings, traveler! ⚗️ I am Tom, the lexical alchemist of Sunshine Hall! My crucible extracts energy from classical roots. Today, I am researching the Greek root 'tele-', which means 'far' or 'distant'. Can you give me an English word that begins with or contains 'tele'?",
                "player_tele_word", 0, 0),
            node(taskId, "player_tele_word", "PLAYER_INPUT", null, "tom_ask_sentence", 0, 1),
            node(taskId, "tom_ask_sentence", "NPC_SPEAK",
                "Astounding! The magical resonance is surging! ✨ Now, can you write a short English sentence telling me how we use this invention or power?",
                "player_sentence", 0, 2),
            node(taskId, "player_sentence", "PLAYER_INPUT", null, "tom_success", 0, 3),
            node(taskId, "tom_success", "NPC_SPEAK",
                "By Merlin's quill, it worked! 🌟 The cauldron is glowing with pure lexical ether! Take these 15 gold coins as your research stipend, my esteemed apprentice! Keep exploring the power of words!",
                null, 1, 4)
        );
        nodes.forEach(n -> nodeMapper.insert(n));

        Long wordNodeId = getNodeId(taskId, "player_tele_word");
        Long sentenceNodeId = getNodeId(taskId, "player_sentence");

        // 4. 语义规则
        insertRule(wordNodeId,
            "[{\"phrases\":[\"telescope\",\"telephone\",\"television\",\"teleport\",\"telegram\",\"telepathy\",\"telephoto\",\"telecom\"],\"dimension\":\"TELE_ROOT\"}]",
            "tom_ask_sentence",
            "Tom needs a valid word with the root 'tele-' (meaning distant)! Try: 'telescope', 'telephone', 'television', or 'teleport'. ⚗️");

        insertRule(sentenceNodeId,
            "[{\"phrases\":[\"tele\",\"phone\",\"scope\",\"port\",\"vision\",\"use\",\"can\",\"see\",\"talk\",\"call\",\"watch\",\"look\",\"travel\",\"send\",\"far\",\"distance\",\"world\",\"star\"],\"dimension\":\"TELE_USAGE\"}]",
            "tom_success",
            "Write a meaningful sentence about what this word does! For example: 'A telescope helps us see far away stars.' or 'We use a telephone to call someone.' 💬");

        log.info("✅ LinguaVerse 初始数据写入完成：Tom NPC + 词根炼金任务剧本");
    }

    private void initEvelynNpc() {
        if (npcMapper.selectCount(new LambdaQueryWrapper<LvNpc>().eq(LvNpc::getNpcKey, "evelyn_archivist")) > 0) {
            return;
        }

        // 1. NPC Evelyn
        LvNpc evelyn = new LvNpc();
        evelyn.setNpcKey("evelyn_archivist");
        evelyn.setName("Evelyn");
        evelyn.setMapId("library");
        evelyn.setPosX(600);
        evelyn.setPosY(380);
        evelyn.setSpriteKey("npc_evelyn");
        evelyn.setPersonality("The Grand Archivist of the Arcane Library. Scholar of classical literary maxims, grammar, and starry codices.");
        npcMapper.insert(evelyn);

        // 2. 任务：失落的星界法典
        LvTask task = new LvTask();
        task.setTaskKey("evelyn_lost_codex");
        task.setNpcId(evelyn.getId());
        task.setTitle("The Lost Astral Codex");
        task.setGoalDesc("Help Archivist Evelyn restore the damaged Astral Codex with the philosophical keyword 'exercise' and write a sentence about reading.");
        task.setRewardCoins(20);
        task.setCategory("ACADEMIC");
        task.setIsActive(1);
        taskMapper.insert(task);
        Long taskId = task.getId();

        // 3. 对话节点
        List<LvDialogueNode> nodes = List.of(
            node(taskId, "evelyn_greeting", "NPC_SPEAK",
                "Welcome, seeker of wisdom! 📖 I am Evelyn, Grand Archivist of the Arcane Library. Here, millions of starry grimoires record the wisdom of the cosmos. Right now, I am restoring a torn page of our Astral Codex, which contains a celebrated proverb. Can you help me decipher it?",
                "player_ready", 0, 0),
            node(taskId, "player_ready", "PLAYER_INPUT", null, "evelyn_riddle", 0, 1),
            node(taskId, "evelyn_riddle", "NPC_SPEAK",
                "Listen closely to the ancient inscription: 'Reading is to the mind what _______ is to the body.' What physical discipline or activity is compared to reading here?",
                "player_keyword", 0, 2),
            node(taskId, "player_keyword", "PLAYER_INPUT", null, "evelyn_ask_sentence", 0, 3),
            node(taskId, "evelyn_ask_sentence", "NPC_SPEAK",
                "Exquisite! 'Reading is to the mind what exercise is to the body!' The golden runes are illuminating! ✨ Now, to anchor this cosmic truth forever into the codex, write a short English sentence telling me how reading empowers your mind!",
                "player_sentence", 0, 4),
            node(taskId, "player_sentence", "PLAYER_INPUT", null, "evelyn_success", 0, 5),
            node(taskId, "evelyn_success", "NPC_SPEAK",
                "Magnificent! The Astral Codex is fully restored and glowing with starlight! 🌟 As promised, receive 20 gold coins and the eternal honor of a true Codex Keeper! May your pursuit of knowledge never dim!",
                null, 1, 6)
        );
        nodes.forEach(n -> nodeMapper.insert(n));

        Long readyNodeId = getNodeId(taskId, "player_ready");
        Long keywordNodeId = getNodeId(taskId, "player_keyword");
        Long sentenceNodeId = getNodeId(taskId, "player_sentence");

        // 4. 语义规则
        insertRule(readyNodeId,
            "[{\"phrases\":[\"yes\",\"sure\",\"ok\",\"okay\",\"i can\",\"help\",\"ready\",\"tell me\",\"of course\",\"glad to\",\"happy to\"],\"dimension\":\"AGREE_HELP\"}]",
            "evelyn_riddle",
            "Tell Evelyn you are ready to help decipher the codex! Try: 'Sure, I can help!' or 'I am ready.' 📜");

        insertRule(keywordNodeId,
            "[{\"phrases\":[\"exercise\",\"sport\",\"sports\",\"workout\",\"training\",\"gym\",\"running\"],\"dimension\":\"EXERCISE_KEYWORD\"}]",
            "evelyn_ask_sentence",
            "What physical activity strengthens the body like reading strengthens the mind? Hint: The word starts with 'ex' (exercise)! 💡");

        insertRule(sentenceNodeId,
            "[{\"phrases\":[\"read\",\"reading\",\"book\",\"books\",\"mind\",\"brain\",\"knowledge\",\"learn\",\"help\",\"makes\",\"grow\",\"world\",\"think\",\"smart\"],\"dimension\":\"READING_BENEFIT\"}]",
            "evelyn_success",
            "Write a sentence in English about how reading helps your mind! For example: 'Reading books makes my mind strong.' or 'Reading expands our knowledge.' 💬");

        log.info("✅ LinguaVerse 初始数据写入完成：Evelyn NPC + 失落星界法典任务剧本");
    }

    private void initMaryNpc() {
        if (npcMapper.selectCount(new LambdaQueryWrapper<LvNpc>().eq(LvNpc::getNpcKey, "mary_guide")) > 0) {
            log.info("LinguaVerse 初始数据已存在，跳过");
            return;
        }

        // 1. NPC
        LvNpc mary = new LvNpc();
        mary.setNpcKey("mary_guide");
        mary.setName("Mary");
        mary.setMapId("hall");
        mary.setPosX(400);
        mary.setPosY(280);
        mary.setSpriteKey("npc_mary");
        mary.setPersonality("A friendly and enthusiastic guide who loves helping newcomers. Always speaks in English.");
        npcMapper.insert(mary);

        // 2. 任务
        LvTask task = new LvTask();
        task.setTaskKey("mary_message_delivery");
        task.setNpcId(mary.getId());
        task.setTitle("The Missing Message");
        task.setGoalDesc("Help Mary deliver a message to her friend Luna at the Game Zone.");
        task.setRewardCoins(10);
        task.setIsActive(1);
        taskMapper.insert(task);
        Long taskId = task.getId();

        // 3. 对话节点
        List<LvDialogueNode> nodes = List.of(
            node(taskId, "greeting", "NPC_SPEAK",
                "Oh! A newcomer! ✨ Welcome to LinguaVerse, the most talkative place in the universe! I'm Mary, your guide here in Sunshine Hall. What's your name, friend?",
                "player_intro", 0, 0),
            node(taskId, "player_intro", "PLAYER_INPUT", null, "task_offer", 0, 1),
            node(taskId, "task_offer", "NPC_SPEAK",
                "What a wonderful name! 🌟 Listen, I'm in a bit of a pickle right now. My dear friend Luna is waiting for me at the Game Zone, but I simply cannot leave my post here. Could you do me a huge favor?",
                "player_agree", 0, 2),
            node(taskId, "player_agree", "PLAYER_INPUT", null, "task_detail", 0, 3),
            node(taskId, "task_detail", "NPC_SPEAK",
                "Oh, you're a lifesaver! 🙏 Please find Luna near the game tables — she's the one with the purple hat. Tell her this message: 'Mary will be a little late, but she's on her way.' Can you repeat that message back to me first? Just to make sure I can trust you with it! 😄",
                "player_repeat", 0, 4),
            node(taskId, "player_repeat", "PLAYER_INPUT", null, "task_complete", 0, 5),
            node(taskId, "task_complete", "NPC_SPEAK",
                "PERFECT! 🎉 That's exactly right! You're a natural communicator! Now go find Luna — she's near the colorful game tables on the right side of the hall. Just look for the purple hat! 💜 Thank you so much, friend. You've earned this! ⭐",
                null, 1, 6)
        );
        nodes.forEach(n -> nodeMapper.insert(n));

        // 获取 player_intro 节点 ID（用于绑定规则）
        Long introNodeId = getNodeId(taskId, "player_intro");
        Long agreeNodeId = getNodeId(taskId, "player_agree");
        Long repeatNodeId = getNodeId(taskId, "player_repeat");

        // 4. 语义规则
        // Node: player_intro — 任意自我介绍短语
        insertRule(introNodeId,
            "[{\"phrases\":[\"i'm\",\"i am\",\"my name is\",\"call me\",\"i go by\",\"hi\",\"hello\",\"hey\"],\"dimension\":\"INTRO\"}]",
            "task_offer",
            "Try introducing yourself! For example: 'I'm Alex!' or 'My name is Leo.' 😊");

        // Node: player_agree — 同意帮助
        insertRule(agreeNodeId,
            "[{\"phrases\":[\"yes\",\"sure\",\"okay\",\"ok\",\"of course\",\"no problem\",\"i can\",\"i will\",\"happy to\",\"love to\",\"glad to\",\"absolutely\"],\"dimension\":\"AGREE\"}]",
            "task_detail",
            "Mary needs a 'yes' or 'no'! Try: 'Sure, I can help!' or 'Of course!' 💪");

        // Node: player_repeat — 双语义 AND 匹配（迟到 + 在途）
        insertRule(repeatNodeId,
            "[{\"phrases\":[\"late\",\"delayed\",\"a bit late\",\"running late\",\"behind\",\"not on time\"],\"dimension\":\"LATE\"}" +
            ",{\"phrases\":[\"on her way\",\"coming\",\"heading there\",\"will be there\",\"she's coming\",\"on the way\",\"on my way\"],\"dimension\":\"COMING\"}]",
            "task_complete",
            "Make sure you include BOTH: that Mary is late AND that she's coming! 🔑");

        log.info("✅ LinguaVerse 初始数据写入完成：Mary NPC + 任务剧本");
    }

    private LvDialogueNode node(Long taskId, String key, String type, String content, String nextKey, int terminal, int order) {
        LvDialogueNode n = new LvDialogueNode();
        n.setTaskId(taskId);
        n.setNodeKey(key);
        n.setNodeType(type);
        n.setContent(content);
        n.setNextNodeKey(nextKey);
        n.setIsTerminal(terminal);
        n.setSortOrder(order);
        return n;
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
