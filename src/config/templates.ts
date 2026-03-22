export interface BeatTemplate {
  id: string;
  name: string;
  description: string;
  instruction: string;
  fixedCount?: number;
}

export interface FormatTemplates {
  skeletons: BeatTemplate[];
  beats: BeatTemplate[];
  sceneTemplates: BeatTemplate[];
}

export const FORMAT_ROUTING: Record<string, FormatTemplates> = {
  "movie": {
    skeletons: [
      {
        id: 'skel-movie-8seq',
        name: '8段落法 (8-Sequence)',
        description: '最经典的商业片骨架，将电影分为8个10-15分钟的段落。',
        instruction: '请严格按照标准的“8段落法 (8-Sequence Structure)”为骨架来规划这几个段落。每个段落代表一个完整的小叙事单元，包含明确的起点和终点。',
        fixedCount: 8
      },
      {
        id: 'skel-movie-3act',
        name: '经典三幕剧 (3-Act)',
        description: '最基础的戏剧结构，分为建置、对抗、结局三个大块。',
        instruction: '请严格按照经典三幕剧结构（建置、对抗、结局）为骨架来规划段落，确保包含关键情节点（Inciting Incident, Plot Point 1, Midpoint, Plot Point 2, Climax）。',
        fixedCount: 3
      },
      {
        id: 'skel-movie-5act',
        name: '莎翁五幕剧 (5-Act)',
        description: '适合悲剧、史诗或结构复杂的电影。',
        instruction: '请按照古典五幕剧（交代背景、上升动作、高潮、下降动作、结局）为骨架来规划段落。',
        fixedCount: 5
      },
      {
        id: 'skel-movie-4act',
        name: '起承转合 (4-Act)',
        description: '东亚叙事核心，强调内部突变和余韵，适合生活流或文艺片。',
        instruction: '请按照“起承转合 (Kishōtenketsu)”为骨架来规划段落。不强调激烈的外部冲突，而是侧重于“转”的内部突变和“合”的余韵。',
        fixedCount: 4
      }
    ],
    beats: [
      {
        id: 'beat-save-the-cat',
        name: '《救猫咪》15节拍',
        description: '商业片最强节拍器，适合大多数电影。',
        instruction: '请将布莱克·斯奈德的《救猫咪》15个节拍作为内部特征映射到骨架中。例如：开场画面、主题呈现、铺垫、触发事件、辩论、第二幕衔接点、B故事、游戏时间、中点、坏人逼近、失去一切、灵魂黑夜、第三幕衔接点、结局、终场画面。每个段落必须明确标注其包含的救猫咪节拍。'
      },
      {
        id: 'beat-heros-journey',
        name: '英雄之旅 (12步)',
        description: '基于神话学的经典叙事结构，适合奇幻、冒险、成长类故事。',
        instruction: '请将克里斯托弗·沃格勒的《英雄之旅》12个阶段（正常世界、冒险召唤、拒接召唤、遇上导师、跨越第一道边界、考验/盟友/敌人、接近深水区、严峻考验、获得奖赏、回去的路、复活、满载而归）作为内部特征映射到骨架中。'
      },
      {
        id: 'beat-story-circle',
        name: '丹·哈蒙故事圈 (8步)',
        description: '适合角色驱动的故事，强调主角的心理与物理旅程。',
        instruction: '请将丹·哈蒙的故事圈（舒适区、需求、进入陌生世界、适应、得到所需、付出代价、回归、改变）作为内部特征映射到骨架中。'
      },
      {
        id: 'beat-truby-22',
        name: '特鲁比的22个步骤',
        description: '《救猫咪》进阶版，关注角色道德缺陷和对手网络，适合复杂群像。',
        instruction: '请将约翰·特鲁比的22个故事步骤作为内部特征映射到骨架中。极度关注角色的道德缺陷、对手的网络关系以及主题的揭示。'
      },
      {
        id: 'beat-general',
        name: '通用演进 (General)',
        description: '不套用特定节拍，根据骨架自然发展。',
        instruction: '请根据骨架的自然逻辑进行演进，确保每个段落有清晰的因果关系（因为...所以...但是...），稳步完成叙事任务。'
      }
    ],
    sceneTemplates: [
      {
        id: 'seq-general',
        name: '通用叙事演进 (General Progression)',
        description: '最常用的默认模板。根据当前段落的宏观定位（如：开场、中点、高潮），自然地拆解出符合逻辑的场景。',
        instruction: '请根据本段落的宏观定位和梗概，自然地将其拆解为多个场景。不需要生搬硬套特定的动作或悬疑模板，只需确保场景之间有清晰的因果关系（因为...所以...但是...），并稳步完成本段落的叙事任务。'
      },
      {
        id: 'seq-action',
        name: '动作/追逐段落 (Action/Chase)',
        description: '适合高强度的动作戏、追车戏、逃生戏。',
        instruction: '请按照动作段落结构拆解场景：1. 明确目标与障碍 2. 遭遇战/追逐开始 3. 危机升级（障碍变大） 4. 绝境与反击 5. 解决或失败。注意：这只是电影中的一个 10 分钟段落，不要写出大团圆结局。'
      },
      {
        id: 'seq-investigation',
        name: '调查/解谜段落 (Investigation)',
        description: '适合寻找线索、潜入、推理的段落。',
        instruction: '请按照调查段落结构拆解场景：1. 发现线索/制定计划 2. 潜入或询问 3. 遭遇误导或阻力 4. 发现关键真相/新线索 5. 逃脱或进入下一阶段。注意：这只是电影中的一个 10 分钟段落。'
      },
      {
        id: 'seq-dialogue',
        name: '文戏/谈判段落 (Dialogue/Debate)',
        description: '适合高智商博弈、情感冲突、谈判的段落。',
        instruction: '请按照文戏段落结构拆解场景：1. 双方带着不同目的入场 2. 试探与交锋 3. 施压与底牌揭晓 4. 情绪爆发或妥协 5. 关系改变。注意：这只是电影中的一个 10 分钟段落。'
      },
      {
        id: 'seq-montage',
        name: '蒙太奇段落 (Montage)',
        description: '适合时间压缩的训练、准备、相爱过程。',
        instruction: '请按照蒙太奇结构拆解场景：1. 初始状态（差劲/陌生） 2. 连续的尝试与失败 3. 逐渐进步/升温 4. 达到新状态（准备就绪/相爱）。注意：这只是电影中的一个 10 分钟段落。'
      }
    ]
  },
  "tv-series": {
    skeletons: [
      {
        id: 'skel-tv-serialized',
        name: '连续剧主线推进 (Serialized)',
        description: '适合剧情连贯的剧集，每集都在推动一个宏大的季主线。',
        instruction: '请按照连续剧结构规划集数：确保每集都有独立的A故事，同时B故事或C故事稳步推进整季的主线悬念。每集结尾必须有推动主线的钩子。'
      },
      {
        id: 'skel-tv-procedural',
        name: '单元剧结构 (Procedural)',
        description: '适合刑侦、医疗、律政等单元剧，每集解决一个独立案件/问题。',
        instruction: '请按照单元剧结构规划集数：每集包含独立的“引入案件 -> 调查/误导 -> 陷入僵局 -> 顿悟 -> 解决”流程。主线剧情仅作为背景或角色成长线穿插。'
      },
      {
        id: 'skel-tv-anthology',
        name: '独立迷你剧 (Anthology)',
        description: '适合《黑镜》类独立故事，每集是一个完整的微型电影。',
        instruction: '请按照独立迷你剧结构规划集数：每集必须是一个完整的故事，包含建置、高潮和结局，不需要为下一集留悬念。'
      }
    ],
    beats: [
      {
        id: 'beat-tv-4act-teaser',
        name: '美式4幕剧 + 冷开场',
        description: '经典美剧单集结构，适合剧情向剧集。',
        instruction: '请将“冷开场(Teaser) + 4幕剧(Act 1-4)”作为内部特征映射到骨架中。冷开场必须抛出核心悬念或危机；每一幕的结尾必须卡在一个反转或悬念点上，以适应插播广告的节奏。'
      },
      {
        id: 'beat-tv-5act',
        name: '流媒体5幕剧',
        description: '适合Netflix等无广告流媒体，节奏更连贯。',
        instruction: '请将“5幕剧”结构作为内部特征映射到骨架中。不需要像传统电视网那样强行制造广告悬念点，注重人物弧光和单集主题的完整表达，但结尾必须留有钩子（Cliffhanger）引导观众点击“下一集”。'
      },
      {
        id: 'beat-tv-sitcom',
        name: '情景喜剧A/B/C线',
        description: '适合20分钟喜剧，多线交织。',
        instruction: '请将“A/B/C三线交织”作为内部特征映射到骨架中。A故事（主线冲突，占据70%篇幅）与 B故事（副线/情感线，占据30%篇幅），C故事（搞笑点缀），确保各条线在结尾处有主题上的交汇或喜剧性的碰撞。'
      }
    ],
    sceneTemplates: [
      {
        id: 'tv-general',
        name: '通用叙事演进 (General Progression)',
        description: '最常用的默认模板。根据当前集的宏观定位，自然地拆解出符合逻辑的场景。',
        instruction: '请根据本集的宏观定位和梗概，自然地将其拆解为多个场景。不需要生搬硬套特定的模板，只需确保场景之间有清晰的因果关系，并稳步完成本集的叙事任务。'
      },
      {
        id: 'tv-teaser-4act',
        name: '冷开场 + 四幕剧 (Teaser + 4 Acts)',
        description: '经典美剧单集结构，适合剧情向剧集。',
        instruction: '请严格按照单集结构（Teaser/冷开场、Act 1/第一幕建置冲突、Act 2/第二幕危机加深、Act 3/第三幕高潮、Act 4/第四幕结局与悬念）来拆解场景。'
      },
      {
        id: 'tv-ab-story',
        name: 'A/B 双线叙事',
        description: '适合情景喜剧或多主角剧集，主线与副线交织。',
        instruction: '请按照 A/B 双线叙事结构拆解场景：A故事（主线冲突，占据70%篇幅）与 B故事（副线/情感线，占据30%篇幅），确保两条线在结尾处有主题上的交汇。'
      }
    ]
  },
  "short-drama": {
    skeletons: [
      {
        id: 'skel-short-revenge',
        name: '复仇打脸流 (Revenge)',
        description: '最经典的微短剧结构，主角受辱后强势反击。',
        instruction: '请按照复仇打脸流规划集数：前3集必须包含极度受辱和获得金手指/身份曝光；中间集数是不断的小打脸和反派作死；最后几集是终极清算。'
      },
      {
        id: 'skel-short-sweet',
        name: '甜宠误会流 (Sweet Romance)',
        description: '适合霸总、先婚后爱等题材。',
        instruction: '请按照甜宠误会流规划集数：开局强行绑定（契约/意外）；中间集数是不断产生误会又解开误会，感情升温；高潮是绿茶/反派作妖导致大危机；结局是追妻火葬场或甜蜜反转。'
      },
      {
        id: 'skel-short-suspense',
        name: '悬疑反转流 (Suspense)',
        description: '适合无限流、规则怪谈、悬疑惊悚。',
        instruction: '请按照悬疑反转流规划集数：开局陷入生死危机或诡异规则；中间集数是不断试错、死里逃生、发现惊人真相；每集结尾必须有极强的生死悬念。'
      }
    ],
    beats: [
      {
        id: 'beat-short-3s-hook',
        name: '黄金前三秒反转模型',
        description: '开局即高潮，每集结尾必带钩子。',
        instruction: '请将“黄金前三秒反转模型”作为内部特征映射到骨架中。完全抛弃传统的铺垫，要求：1. 开局前三秒必须有极高强度的冲突（如被打脸、被背叛、生死一线）；2. 中间快速反转；3. 结尾必须用“钩子（Cliffhanger）”卡住，逼迫观众充值看下一集。'
      },
      {
        id: 'beat-short-3-4',
        name: '三翻四抖爽文结构',
        description: '情绪拉扯到极致，先抑后扬。',
        instruction: '请将“三翻四抖”作为内部特征映射到骨架中。要求：1. 极强的情绪开场（受辱/危机）；2. 第一次反转（翻）；3. 危机升级；4. 第二次反转（翻）；5. 绝境；6. 终极反转打脸（抖）。冲突极度密集。'
      }
    ],
    sceneTemplates: [
      {
        id: 'short-drama-general',
        name: '通用微短剧演进 (General Progression)',
        description: '最常用的默认模板。根据当前集的宏观定位，自然地拆解出符合逻辑的场景，保持快节奏。',
        instruction: '请根据本集的宏观定位和梗概，自然地将其拆解为多个场景。保持微短剧的快节奏，确保场景之间有清晰的因果关系和情绪起伏，结尾留有悬念。'
      },
      {
        id: 'short-drama-3-4',
        name: '打脸逆袭 (三翻四抖)',
        description: '微短剧经典结构，极快节奏的打脸逆袭，情绪拉满。',
        instruction: '请严格按照微短剧“三翻四抖”结构拆解：1. 极强的情绪开场（受辱/危机） 2. 第一次反转（翻） 3. 危机升级 4. 第二次反转（翻） 5. 绝境 6. 终极反转打脸（抖）。每个场景必须极短，冲突极度密集。'
      },
      {
        id: 'short-drama-hook',
        name: '悬念钩子 (Hook-driven)',
        description: '适合悬疑、复仇类微短剧，结尾必须留有强烈的悬念。',
        instruction: '请按照强悬念结构拆解：1. 悬念开场 2. 抽丝剥茧 3. 意外发现 4. 危机降临 5. 强悬念结尾（Cliffhanger）。必须确保最后一个场景留下巨大的疑问或危机，吸引观众看下一集。'
      },
      {
        id: 'short-drama-misunderstanding',
        name: '误会与澄清',
        description: '适合甜宠、虐恋微短剧。',
        instruction: '请按照误会结构拆解：1. 产生致命误会 2. 冲突爆发/受委屈 3. 发现真相的蛛丝马迹 4. 真相大白 5. 追妻火葬场/甜蜜反转。'
      }
    ]
  }
};
