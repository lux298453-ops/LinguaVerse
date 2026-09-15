/**
 * slangData.js
 * 灵语茶歇馆 · 地道俚语与情景实战数据库 (Slang Lounge & Scenario Database)
 * 收录经典高频俚语、典故由来、字面误区、地道含义及专属 NPC 沉浸实战剧场
 */

export const SLANG_CATEGORIES = [
  { id: 'ALL', name: '全部俚语', icon: '✨' },
  { id: 'DAILY', name: '日常闲聊', icon: '☕' },
  { id: 'WORK', name: '职场与学业', icon: '💼' },
  { id: 'MOOD', name: '情绪与状态', icon: '🎭' },
  { id: 'SOCIAL', name: '社交与八卦', icon: '🍿' }
]

export const SLANG_DATABASE = [
  {
    id: 'piece_of_cake',
    phrase: 'A piece of cake',
    keywords: ['piece of cake', 'a piece of cake'],
    category: 'DAILY',
    literal_mean: '一块蛋糕 🍰',
    actual_mean: '小菜一碟，轻而易举',
    phonetic: '/ə piːs əv keɪk/',
    origin_story: '源于 19 世纪美国南部，当时一些社区举行蛋糕舞蹈赛（Cake Walk），胜者可以获得美味蛋糕作为奖品，由于规则简单轻松，后来人们便用“一块蛋糕”来形容事情轻而易举。',
    example_en: "Don't worry about the English test; it's going to be a piece of cake!",
    example_cn: "别担心英语考试，那绝对是小菜一碟！",
    scenario: {
      npcName: 'Leo (新手法师)',
      npcAvatar: '🧙‍♂️',
      context: 'Leo 面对初级打字测验紧张不已，满头大汗地向你求助：',
      promptDialog: "Oh no, they want me to type 40 words in one minute! Is that even possible for a beginner like me?!",
      expectedHint: "告诉他这非常简单，就像小菜一碟一样：'Don't worry, it's a piece of cake!'",
      requiredPhrases: ['piece of cake'],
      npcSuccessReply: "Really?! If you say so, I feel way more confident now! Let me give it my best shot! 🎉"
    }
  },
  {
    id: 'break_a_leg',
    phrase: 'Break a leg',
    keywords: ['break a leg'],
    category: 'WORK',
    literal_mean: '摔断一条腿 🦵',
    actual_mean: '祝你演出成功！大显身手！',
    phonetic: '/breɪk ə leɡ/',
    origin_story: '源于西方古老演艺圈迷信，演员们相信如果在登台前直接祝对方“Good Luck”，精灵或魔鬼会反过来带来厄运；因此必须说反话“祝你摔断腿”，来反向祈求演出顺遂无虞。',
    example_en: "I know you're nervous about the magic show tonight, but go break a leg!",
    example_cn: "我知道你对今晚的魔术表演很紧张，但放手去干，大显身手吧！",
    scenario: {
      npcName: 'Sophia (竖琴乐师)',
      npcAvatar: '🧝‍♀️',
      context: 'Sophia 即将走上阳光大厅的金色舞台弹奏竖琴，双手紧张得有些发抖：',
      promptDialog: "My performance starts in three minutes and my hands won't stop shaking... Can you wish me luck?",
      expectedHint: "用舞台专属暗号给她加油打气：'You're gonna do great, break a leg!'",
      requiredPhrases: ['break a leg'],
      npcSuccessReply: "Haha! 'Break a leg!' I love that old theatre saying. Thank you so much, I'm ready to shine on stage! ✨"
    }
  },
  {
    id: 'under_the_weather',
    phrase: 'Under the weather',
    keywords: ['under the weather'],
    category: 'MOOD',
    literal_mean: '在恶劣天气下方 🌧️',
    actual_mean: '身体微恙，有点不舒服 / 情绪低落',
    phonetic: '/ˈʌndər ðə ˈweðər/',
    origin_story: '源于古代航海时代。当暴风雨来临时，晕船生病的水手会被送往甲板下方（避风处），处于天气影响之下（under the weather），后来演变成身体不适的代名词。',
    example_en: "I won't be able to come to the party tonight; I'm feeling a bit under the weather.",
    example_cn: "我今晚去不了聚会了，我感觉身体有点不大舒服。",
    scenario: {
      npcName: 'David (药剂师学徒)',
      npcAvatar: '🧪',
      context: 'David 脸色苍白、无精打采地靠在柜台旁，你关切地问起他：',
      promptDialog: "Hey... I've got a terrible headache and chills today. I don't think I can finish brewing these potions.",
      expectedHint: "理解并同情他的状态：'Take care! It sounds like you are feeling under the weather.'",
      requiredPhrases: ['under the weather'],
      npcSuccessReply: "Yeah, definitely under the weather today... Thanks for understanding, I'll go take a nap in the infirmary. 🛌"
    }
  },
  {
    id: 'spill_the_beans',
    phrase: 'Spill the beans',
    keywords: ['spill the beans', 'spilled the beans', 'spilling the beans'],
    category: 'SOCIAL',
    literal_mean: '打翻豆子 🫘',
    actual_mean: '走漏风声，泄露秘密，剧透',
    phonetic: '/spɪl ðə biːnz/',
    origin_story: '相传在古希腊投票时，人们把黑豆和白豆扔进罐子里秘密计票。若有人不小心撞倒罐子把豆子洒了一地，投票结果就被提前泄密曝光了。',
    example_en: "We were planning a surprise party for Mary, but Jack spilled the beans!",
    example_cn: "我们本来给玛丽准备了惊喜派对，结果杰克把秘密给走漏了！",
    scenario: {
      npcName: 'Luna (街机少女)',
      npcAvatar: '🎮',
      context: 'Luna 凑近你的耳边，神神秘秘地打听刚刚 Mary 偷偷交待给你的任务：',
      promptDialog: "Hey! I saw you talking with Mary at the counter for so long! Come on, what secret task did she give you?",
      expectedHint: "调侃她想刺探秘密，或者请她别剧透：'Come on, don't make me spill the beans!'",
      requiredPhrases: ['spill the beans', 'spilled the beans'],
      npcSuccessReply: "Ooh! So it really is top secret! Fine, keep your lips sealed, but I'll figure it out sooner or later! 🤫"
    }
  },
  {
    id: 'cost_an_arm_and_a_leg',
    phrase: 'Cost an arm and a leg',
    keywords: ['cost an arm and a leg', 'costs an arm and a leg', 'cost me an arm and a leg'],
    category: 'DAILY',
    literal_mean: '花费一条胳膊和一条腿 🦾',
    actual_mean: '极其昂贵，贵得离谱，花了大价钱',
    phonetic: '/kɔːst ən ɑːrm ənd ə leɡ/',
    origin_story: '可能流行于二战之后，士兵负伤失去手臂或腿是极度沉痛惨烈的代价；人们以此极度夸张地形容某种商品价格贵到难以承受。',
    example_en: "That legendary glowing sword looks awesome, but it costs an arm and a leg!",
    example_cn: "那把传说中的发光宝剑太帅了，但是价格贵得离谱！",
    scenario: {
      npcName: 'Merchant Tom (旅行商人)',
      npcAvatar: '💰',
      context: '商人 Tom 正在向你推销一瓶标价 9999 金币的至尊飞天药水：',
      promptDialog: "Only 9,999 gold coins for this bottle of Phoenix Tears! Isn't that the bargain of the century, adventurer?",
      expectedHint: "吐槽这东西简直太贵了：'Are you crazy? That potion costs an arm and a leg!'",
      requiredPhrases: ['cost an arm and a leg', 'costs an arm and a leg'],
      npcSuccessReply: "Haha, alright, alright! An arm and a leg is a bit steep. How about I give you a 10% discount? 😉"
    }
  },
  {
    id: 'call_it_a_day',
    phrase: 'Call it a day',
    keywords: ['call it a day'],
    category: 'WORK',
    literal_mean: '把它叫做一天 🌅',
    actual_mean: '收工，到此为止，今天就到这吧',
    phonetic: '/kɔːl ɪt ə deɪ/',
    origin_story: '最早出现在 19 世纪雇工中。当工作完成或者天色已晚时，工人们会互相对视说“Let\'s call it a day\'s work”，意为今天的工作量已经完成，可以心安理得回家了。',
    example_en: "We've practiced 500 English words today; let's call it a day and relax.",
    example_cn: "我们今天已经练了 500 个单词了，今天就到此为止，休息一下吧。",
    scenario: {
      npcName: 'Mary (向导)',
      npcAvatar: '👩‍🏫',
      context: '时钟已过深夜，你和 Mary 已经连续核对了数小时的公会迎宾名册：',
      promptDialog: "Whew! Look at the clock, it's almost midnight and my eyes are getting so tired. What do you think?",
      expectedHint: "建议她赶紧收工休息：'You worked so hard, let's call it a day!'",
      requiredPhrases: ['call it a day'],
      npcSuccessReply: "You said it! Let's call it a day. Have a sweet dream and see you tomorrow morning! 🌙"
    }
  },
  {
    id: 'hit_the_hay',
    phrase: 'Hit the hay',
    keywords: ['hit the hay', 'hit the sack'],
    category: 'DAILY',
    literal_mean: '击打干草堆 🌾',
    actual_mean: '上床睡觉，去歇息',
    phonetic: '/hɪt ðə heɪ/',
    origin_story: '在现代弹簧床垫发明之前，早期欧美的许多平民床垫其实是把干草（hay）塞进粗布袋子里做成的。上床睡觉前要拍打几下干草使之松软平整，故称“hit the hay”。',
    example_en: "I have an early raid tomorrow morning, so I'm going to hit the hay now.",
    example_cn: "我明早有个早场副本，所以我现在得去睡觉了。",
    scenario: {
      npcName: 'Knight Roy (皇家侍卫)',
      npcAvatar: '🛡️',
      context: '侍卫 Roy 打着大大的哈欠，铠甲都快从肩膀滑落下来了：',
      promptDialog: "I've been on patrol duty for 16 straight hours... My eyelids feel like they weigh 50 pounds each.",
      expectedHint: "劝他赶紧去睡大觉：'You must be exhausted! Go hit the hay!'",
      requiredPhrases: ['hit the hay', 'hit the sack'],
      npcSuccessReply: "Good advice, friend... I'm hitting the hay right this second. Don't wake me up before noon! 😴"
    }
  },
  {
    id: 'bite_the_bullet',
    phrase: 'Bite the bullet',
    keywords: ['bite the bullet'],
    category: 'WORK',
    literal_mean: '咬住子弹 💥',
    actual_mean: '硬着头皮上，咬牙忍受痛苦，当机立断直面困难',
    phonetic: '/baɪt ðə ˈbʊlɪt/',
    origin_story: '在麻醉药普及前的战争年代，军医在野战医院为负伤士兵手术时，会让伤员嘴里咬住一颗铅制子弹，以防止他们在剧痛中咬断舌头或惨叫。',
    example_en: "I hate dentists, but my tooth hurts so badly that I have to bite the bullet.",
    example_cn: "我讨厌看牙医，但牙痛得不行，我只能咬紧牙关硬着头皮去了。",
    scenario: {
      npcName: 'Emily (魔法学员)',
      npcAvatar: '🔮',
      context: 'Emily 必须去向严苛的魔药学导师道歉承认打破了水晶瓶，在门外徘徊不前：',
      promptDialog: "Professor Severus will be so furious with me! Should I run away, or should I just walk in and confess?",
      expectedHint: "鼓励她勇敢直面现实：'Running away won't help, you just have to bite the bullet!'",
      requiredPhrases: ['bite the bullet'],
      npcSuccessReply: "You're right. No use running away. I will bite the bullet and take full responsibility! Wish me luck! 🚪"
    }
  },
  {
    id: 'once_in_a_blue_moon',
    phrase: 'Once in a blue moon',
    keywords: ['once in a blue moon'],
    category: 'DAILY',
    literal_mean: '蓝月亮出现一次 🌕',
    actual_mean: '极其罕见，千载难逢，稀罕得不得了',
    phonetic: '/wʌns ɪn ə bluː muːn/',
    origin_story: '天文学中，一个季度若出现 4 次满月，第 3 次便称为“蓝月”（并不真代表月亮变蓝），这种情况大约每 2.7 年才出现一次，因此引申为极罕见的事物。',
    example_en: "He rarely eats desserts; he only has chocolate once in a blue moon.",
    example_cn: "他极少吃甜食，千载难逢才吃一次巧克力。",
    scenario: {
      npcName: 'Chef Pierre (大厅主厨)',
      npcAvatar: '👨‍🍳',
      context: '主厨 Pierre 罕见地把一份金色松露烤馅饼端到了公共餐桌上：',
      promptDialog: "Behold! Golden Truffle Pie! I only bake this dish once every three years. You want a slice?",
      expectedHint: "感叹这太罕见了：'Wow, a dish like this only appears once in a blue moon!'",
      requiredPhrases: ['once in a blue moon'],
      npcSuccessReply: "Indeed! A true blue moon delicacy! Here is a generous slice for a traveler of fine taste! 🥧"
    }
  },
  {
    id: 'cold_feet',
    phrase: 'Get cold feet',
    keywords: ['cold feet', 'get cold feet', 'got cold feet'],
    category: 'MOOD',
    literal_mean: '双脚冰冷 🥶',
    actual_mean: '临阵退缩，打退堂鼓，临场胆怯',
    phonetic: '/ɡet koʊld fiːt/',
    origin_story: '早年源于德语俗语，指双脚冰凉血液不畅走不动路；19 世纪进入英语小说，专门用来形容人在重大事件（如决斗、婚礼、决战）前夕突然心生畏惧想要逃跑。',
    example_en: "He was supposed to give a speech today, but he got cold feet at the last minute.",
    example_cn: "他本该今天上台演讲的，但他在最后一刻临阵退缩了。",
    scenario: {
      npcName: 'Archer Robin (游侠)',
      npcAvatar: '🏹',
      context: 'Robin 本来报了名挑战恶龙巢穴，临出发前却把长弓收进了储物箱：',
      promptDialog: "The dragon's roar gave me nightmares all night... Maybe I should stay home and tend the garden instead?",
      expectedHint: "指出他打退堂鼓了，但给予鼓励：'Don't tell me you are getting cold feet now!'",
      requiredPhrases: ['cold feet'],
      npcSuccessReply: "Ugh, you caught me! Yes, I got cold feet for a second. But a real ranger never backs down! Let's ride! 🐎"
    }
  },
  {
    id: 'see_eye_to_eye',
    phrase: 'See eye to eye',
    keywords: ['see eye to eye', 'saw eye to eye'],
    category: 'SOCIAL',
    literal_mean: '眼睛看着眼睛 👀',
    actual_mean: '看法一致，所见略同，达成共识',
    phonetic: '/siː aɪ tu aɪ/',
    origin_story: '出自《圣经·以赛亚书》52:8：“他们必亲眼看见（see eye to eye）耶和华归回锡安”。原意为面面相对清晰可见，后演变成双方观点高度契合、目光一致。',
    example_en: "My roommate and I don't always see eye to eye on how to clean the kitchen.",
    example_cn: "我和室友在厨房清洁问题上并不总能达成共识。",
    scenario: {
      npcName: 'Councilor Brian (议员)',
      npcAvatar: '📜',
      context: 'Brian 正与你在商议大厅该放水晶吊灯还是荧光火把，双方最终都赞同保留水晶灯：',
      promptDialog: "After reviewing all the architectural sketches, I agree that crystal chandeliers look much more royal.",
      expectedHint: "表示赞同与所见略同：'I completely agree, it seems we see eye to eye on this!'",
      requiredPhrases: ['see eye to eye'],
      npcSuccessReply: "Splendid! It is always a pleasure to see eye to eye with someone who has great taste! 🥂"
    }
  },
  {
    id: 'burn_the_midnight_oil',
    phrase: 'Burn the midnight oil',
    keywords: ['burn the midnight oil', 'burning the midnight oil'],
    category: 'WORK',
    literal_mean: '燃烧午夜的灯油 🪔',
    actual_mean: '开夜车，挑灯夜战，通宵奋战',
    phonetic: '/bɜːrn ðə ˈmɪdnaɪt ɔɪl/',
    origin_story: '在电灯出现以前，夜间读书或工作必须点燃昂贵的油灯。为了赶考或撰写巨著而彻夜点灯的人，就被称为“燃烧午夜之油”，流传至今形容勤勉刻苦。',
    example_en: "She has been burning the midnight oil all week to prepare for the final exams.",
    example_cn: "为了准备期末考，她这整整一周都在挑灯夜战开夜车。",
    scenario: {
      npcName: 'Scholar Henry (博学学者)',
      npcAvatar: '📚',
      context: 'Henry 的书桌上堆满了厚重的古代魔法羊皮纸卷轴，周围点着三盏大油灯：',
      promptDialog: "There are only two days left before the Grand Symposium! I still have 300 pages of ancient runes to decipher!",
      expectedHint: "形容他正在挑灯夜战：'You are really burning the midnight oil tonight!'",
      requiredPhrases: ['burn the midnight oil', 'burning the midnight oil'],
      npcSuccessReply: "Haha, indeed I am! The midnight oil burns bright, but the pursuit of knowledge never sleeps! 📖"
    }
  }
]
