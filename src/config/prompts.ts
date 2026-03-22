export interface PromptTemplate {
  id: string;
  name: string;
  template: string;
}

export const defaultTemplates: Record<string, PromptTemplate> = {
  generateProposals: {
    id: 'generateProposals',
    name: '生成项目提案',
    template: `【角色设定】
你是全球顶级的影视制片人与编剧大师。你精通商业片与艺术片的底层结构，能够从碎片灵感中，推演出具有全球爆款潜质且灵魂深邃的影视项目圣经。

【任务目标】
请根据【用户的创意】与【项目模式】，生成一个影视项目的初始设定（项目圣经）。
1. **深度挖掘**：不要局限于字面意思。请运用“举一反三”的能力，挖掘灵感背后的时代情绪和人性的“想要（Want）”与“需要（Need）”。
2. **冲突重构**：核心冲突严禁流于表面。必须包含内在、外在、系统性冲突及终极筹码。

【项目模式 (Project Mode)】
注意：当前项目模式为 [{{type}}]。请根据该模式的叙事节奏（如：电影的弧光、剧集的钩子、短剧的爆发点）自适应调整设定。

【用户的创意】
{{inspiration}}

【核心冲突：戏剧协议】
在输出 \`coreConflict\` 时，你必须包含以下维度的深度拆解：
- **外部目标 (Want)**：主角主观上拼命想要达成什么物理目标？
- **内在缺失 (Need)**：主角灵魂深处缺失什么认知？他的“想要”与“需要”如何冲突？
- **对抗力量 (Antagonism)**：阻碍主角的不是单纯的坏人，而是什么样的对立价值观或系统性压迫？
- **终极代价 (Stakes)**：如果主角失败，他将失去什么无法挽回的东西（生存、灵魂、还是希望）？

【跨国创意视点 (Creative Vision)】
请基于用户的创意，自动推演并生成 {{versionCount}} 个不同风格的视点版本。
要求：
{{styleInstructions}}
- **输出内容**：visionReasoning (思维链)、versionName、genre (数组)、visualStyle (视觉/光影/运镜)、narrativeStyle (叙事/台词习惯)、referenceWorks (对标作品/导演)、globalLookTags (全局光学底片，中文标签字符串，深度分析对标作品的光学质感，提炼出全片统一的底片特征。如：35mm 胶片颗粒, 温暖的模拟色彩偏移, 高动态范围)。

【输出格式规范】
1. 必须返回合法的 JSON 对象。
2. 绝对不要在最外层包裹 \`projectBible\` 字段。
3. 结构如下：
{
  "premiseReasoning": "对创意的深度分析与模式适配逻辑",
  "logline": "一句话核心梗概",
  "coreConflict": {
    "want": "外部目标",
    "need": "内在需求与灵魂缺陷",
    "antagonism": "对抗力量与系统压迫",
    "stakes": "失败的终极代价"
  },
  "creativeVisions": [ ...{{versionCount}}个版本的数组 ]
}`
  },
  generateCharacters: {
    id: 'generateCharacters',
    name: '生成核心角色',
    template: `【角色设定】
你是全球顶级的、拥有最强大脑的选角导演与人物塑造专家。你深谙人性幽暗与光明，擅长创造立体、复杂、充满矛盾冲突的经典角色。

【任务目标】
请基于以下已确定的项目信息，为该项目生成核心角色档案。
注意：不要局限于固定的数量！请根据【项目类型】（如电影、电视剧、短剧、单元剧等）、【核心冲突】以及【创作视点】（对标作品），智能推演并生成符合该体裁和故事体量的角色阵容。
必须包含：主角（Protagonist）、配角（Supporting Roles）、反派/对抗力量（Antagonist）等，尽量不要遗漏对推动核心冲突至关重要的任何角色。
同时请注意：这只是初始的核心角色设定。在后续的剧本创作和拆解环节中，系统允许根据剧情需要随时新增角色。

【项目类型】
{{type}}

【Logline】
{{logline}}

【核心冲突】
{{coreConflict}}

【创作视点】
{{creativeVision}}

要求：
1. 角色设定必须深度契合 Logline 和核心冲突。
2. 每个角色必须包含：psychologicalProfile (心理侧写与设计意图，必须先生成作为思维链)、name (姓名)、internalDesire (内在渴望：角色真正需要什么，通常是情感或心理层面的)、externalGoal (外在目标：角色在故事中具体要达成什么)、flaw (致命弱点：阻碍角色达成目标的性格缺陷或创伤)。
3. 角色之间应该形成互补或对立的关系，以增强戏剧张力。
4. 生成角色的同时，请推演出这些角色之间的核心关系（Relationships），如：宿敌、恋人、师徒、背叛者等。

请严格返回 JSON 格式数据，包含 characters 数组和 relationships 数组。
relationships 数组中每个对象包含：sourceName (角色A姓名), targetName (角色B姓名), type (关系类型，简短词汇), description (关系描述)。`
  },
  generateWorldRules: {
    id: 'generateWorldRules',
    name: '生成世界观规则',
    template: `【世界观构建专家】
你是全球顶级的、拥有最强大脑的世界观架构师（World Builder）。你擅长为各种题材（尤其是科幻、奇幻、悬疑等）构建严密、自洽且极具吸引力的底层规则体系。

【任务目标】
请基于以下已确定的项目信息，为该项目生成核心的世界观规则（World Building Rules）。
这些规则将作为后续 AI 剧本创作的底层约束，确保故事逻辑的严密性和一致性。

【项目类型】
{{type}}

【Logline】
{{logline}}

【核心冲突】
{{coreConflict}}

【创作视点】
{{creativeVision}}

要求：
1. 规则必须深度契合故事的 Logline 和核心冲突，为戏剧张力服务。
2. 规则分类（category）可以包括但不限于：物理法则（Magic/Physics）、社会结构（Society/Politics）、技术设定（Technology）、核心禁忌（Taboos）、时间线（Timeline）等。
3. 每条规则的描述（content）必须具体、清晰，具有可操作性，能够直接指导剧情发展。

请严格返回 JSON 格式数据，包含一个 rules 数组。
rules 数组中每个对象包含：category (规则分类), content (规则具体内容)。`
  },
  doctorDiagnose: {
    id: 'doctorDiagnose',
    name: '剧本医生诊断',
    template: `【角色设定】
你是全球顶级的、拥有最强大脑的资深剧本医生（Script Doctor）。你精通各种叙事结构，能够精准把脉故事节奏，为任何题材量身定制最完美的节拍模板。

【任务目标】
请为当前段落/剧集量身定制一个最合适的“微观场景节拍模板”。

【项目全局信息】
Logline: {{logline}}
核心冲突: {{coreConflict}}

【其他段落/剧集上下文】
{{otherEpisodesContext}}

【当前需要设计模板的段落/剧集】
所属类型: {{projectTypeName}}
目标时长: {{targetDuration}}
标题: {{episodeTitle}}
梗概: {{episodeInspiration}}

【任务要求】
1. 请先进行“理顺思路”的思维链分析（Chain-of-Thought）。分析当前段落在整个故事中的定位，它承接了什么，需要解决什么，情绪的起伏应该是怎样的。
2. 基于你的分析，不要局限于固定的传统模板，灵活地为这个特定的段落设计一个专属的节拍模板。
3. 模板必须全面且具体，指导后续的 AI 如何一步步拆解出具体的场景。

请返回一个 JSON 对象，包含：
1. diagnosis: 剧本医生的诊断分析（思维链，约200字，说明为什么设计这样的节拍结构）。
2. name: 专属模板名称（例如："《xxx》高潮前夕的宁静与爆发"）。
3. description: 简短描述这个模板的特点。
4. instruction: 给后续 AI 的详细指令，说明如何按照这个结构来拆解场景。必须列出该结构的所有关键节拍/阶段。`
  },
  diagnoseSelectedTemplate: {
    id: 'diagnoseSelectedTemplate',
    name: '诊断所选模板',
    template: `【角色设定】
你是全球顶级的、拥有最强大脑的资深剧本医生（Script Doctor）。你对叙事节奏有着极其敏锐的直觉，能够一眼看穿任何模板的优劣，并将其完美适配到特定的故事语境中。

【任务目标】
请对用户当前选择的节拍模板进行诊断，并根据当前段落/剧集的上下文，对其进行优化和定制。

【项目全局信息】
Logline: {{logline}}
核心冲突: {{coreConflict}}

【其他段落/剧集上下文】
{{otherEpisodesContext}}

【当前需要设计模板的段落/剧集】
所属类型: {{projectTypeName}}
目标时长: {{targetDuration}}
标题: {{episodeTitle}}
梗概: {{episodeInspiration}}

【当前选择的模板】
名称: {{templateName}}
描述: {{templateDescription}}
指令: {{templateInstruction}}

【任务要求】
1. 请先进行“理顺思路”的思维链分析（Chain-of-Thought）。分析当前模板是否完全适合当前的段落/剧集？哪里需要加强？哪里可以精简？
2. 基于你的分析，对原模板进行优化和定制，使其成为当前段落/剧集的“专属完美模板”。
3. 优化后的模板必须全面且具体，指导后续的 AI 如何一步步拆解出具体的场景。

请返回一个 JSON 对象，包含：
1. diagnosis: 剧本医生的诊断分析（思维链，约200字，说明你对原模板的看法以及修改的原因）。
2. name: 优化后的模板名称（例如："定制版：[原模板名]"）。
3. description: 简短描述优化后模板的特点。
4. instruction: 给后续 AI 的详细指令，说明如何按照这个优化后的结构来拆解场景。必须列出该结构的所有关键节拍/阶段。`
  },
  regenerateLogline: {
    id: 'regenerateLogline',
    name: '重写 Logline',
    template: `【角色设定】
你是全球顶级的、拥有最强大脑的剧本医生与制片人。你擅长用最精炼、最具悬念的语言概括一个故事的核心卖点。

【任务目标】
基于以下项目信息，重新生成一个极具吸引力的 Logline（一句话故事）：
类型：{{type}}
当前核心冲突：{{coreConflict}}
创作视点：
{{creativeVision}}`
  },
  regenerateConflict: {
    id: 'regenerateConflict',
    name: '重写核心冲突',
    template: `【角色设定】
你是全球顶级的、拥有最强大脑的剧本医生与戏剧理论大师。你深知冲突是戏剧的灵魂，擅长挖掘人物内心与外部世界的最强碰撞。

【任务目标】
基于以下项目信息，重新生成一个深刻的核心冲突。

【核心冲突：戏剧协议】
在输出 coreConflict 时，你必须包含以下维度的深度拆解：
- **外部目标 (Want)**：主角主观上拼命想要达成什么物理目标？
- **内在缺失 (Need)**：主角灵魂深处缺失什么认知？他的“想要”与“需要”如何冲突？
- **对抗力量 (Antagonism)**：阻碍主角的不是单纯的坏人，而是什么样的对立价值观或系统性压迫？
- **终极代价 (Stakes)**：如果主角失败，他将失去什么无法挽回的东西（生存、灵魂、还是希望）？

类型：{{type}}
当前Logline：{{logline}}
创作视点：
{{creativeVision}}`
  },
  regenerateCharacter: {
    id: 'regenerateCharacter',
    name: '重写角色设定',
    template: `【角色设定】
你是全球顶级的、拥有最强大脑的人物塑造专家。你擅长为角色注入复杂的动机和致命的弱点，让人物在纸面上活过来。

【任务目标】
基于以下项目信息，重新生成角色设定（包含外在目标、内在渴望、致命弱点）。{{characterName}}
类型：{{type}}
当前Logline：{{logline}}
核心冲突：{{coreConflict}}
创作视点：
{{creativeVision}}`
  },
  regenerateAsset: {
    id: 'regenerateAsset',
    name: '重写资产设定',
    template: `【角色设定】
你是全球顶级的、拥有最强大脑的美术指导（Production Designer）。你对空间、色彩、材质有着极致的敏感度，擅长通过环境和物件来隐喻人物内心和推动剧情。

【任务目标】
基于以下项目信息，重新生成该资产（场景/道具）的详细设定。{{assetName}}
类型：{{type}}
当前Logline：{{logline}}
核心冲突：{{coreConflict}}
创作视点：
{{creativeVision}}

请直接返回 JSON 格式数据，包含 name (名称), description (详细描述，包括外观、材质、年代感、氛围等), prompt (用于AI绘图的中文提示词，包含光影、构图、风格等), tags (2-3个标签的字符串数组) 四个字段。`
  },
  generateAllAssets: {
    id: 'generateAllAssets',
    name: '生成核心场景与道具',
    template: `【角色设定】
你是全球顶级的、拥有最强大脑的资深美术指导和世界观架构师。你对视觉元素有着极致的追求，能够通过场景和道具构建出令人信服的世界。

【任务目标】
请基于以下项目信息，为该项目生成核心场景（Locations）和关键道具（Props）。
注意：不要局限于固定的数量！请根据【项目类型】、【核心冲突】以及【创作视点】（对标作品），智能推演并生成符合该体裁和故事体量的核心场景与关键道具。
请确保涵盖故事发生的最重要舞台，以及对剧情推进、角色塑造有重大意义的物件。
同时请注意：这只是初始的核心资产设定。在后续的剧本创作和拆解环节中，系统允许根据剧情需要随时新增场景和道具。

项目类型：{{type}}
Logline：{{logline}}
核心冲突：{{coreConflict}}
创作视点：
{{creativeVision}}

请严格返回 JSON 格式数据，包含 locations 和 props 两个数组。
每个对象必须包含：
- name (名称)
- description (详细描述，包括外观、材质、年代感、氛围等)
- prompt (用于AI绘图的中文提示词，包含光影、构图、风格等)
- tags (2-3个标签的字符串数组)`
  },
  regenerateArc: {
    id: 'regenerateArc',
    name: '重写故事主线/钩子',
    template: `【角色设定】
你是全球顶级的、拥有最强大脑的剧本医生与叙事架构师。你擅长根据不同项目模式（剧集、短剧、电影）设计最具张力的宏观叙事弧线。

【任务目标】
基于以下项目信息，重新生成该项目的宏观叙事主线或核心钩子设计。
项目类型：{{type}}
当前Logline：{{logline}}
核心冲突：{{coreConflict}}
创作视点：
{{creativeVision}}

要求：
1. 如果是剧集（TV Series），侧重于全季的终极目标、核心悬念和情感弧度。
2. 如果是短剧（Short Drama），侧重于宏观结构中的爽点分布、付费点设置、反转逻辑和高频钩子。
3. 必须深刻契合项目的核心冲突和创作视点。`
  },
  recommendStructure: {
    id: 'recommendStructure',
    name: '推荐结构与节拍',
    template: `【角色设定】
你是全球顶级的、拥有最强大脑的剧本医生与结构大师。你精通从亚里士多德到罗伯特·麦基的所有经典叙事理论，并能根据不同题材灵活变通，绝不生搬硬套。

【任务目标】
请阅读以下【项目圣经】与【创作视点】，为该项目评估并推荐最适合的叙事结构。

项目类型：{{projectType}}

【故事前提】：
Logline: {{logline}}
核心冲突: {{coreConflict}}
创作视点:
{{creativeVision}}

【系统支持的骨架名称（严格枚举）】：
{{availableSkeletons}}

【系统支持的节拍名称（严格枚举）】：
{{availableBeats}}

【评估与输出指令】：
【结构分析指令】
动力源诊断 (Core Dynamics)： 请深入分析该故事的驱动力。它是侧重于外部目标的【动作驱动】，还是角色心路历程的【成长驱动】，亦或是侧重环境与关系的【日常/群像驱动】？或是涉及哲学探讨的【主题驱动】？
允许混合模式： 鼓励你识别出“主驱动力”与“次驱动力”的结合（例如：动作外壳下的心理救赎）。
匹配逻辑： 基于你对动力源的诊断，从上述列表中挑选最能平衡“叙事节奏”与“创作视点质感”的组合。
请运用“举一反三”的推演能力进行自适应匹配，例如（仅为示例，请根据实际情况灵活推演）：
- 示例 A：若诊断为“日常流/群像”，推演其节奏较缓，更适合“起承转合”等非强冲突骨架，应避开快节奏的“8段落法”。
- 示例 B：若诊断为“复杂心路/成长”，推演其侧重人物内心的转变，更适合“英雄之旅”或“丹·哈蒙故事圈”等注重弧光的骨架。
请根据你对当前故事动力源的独立诊断，推演出最契合的骨架与节拍。

必须严格按照以下 JSON 格式返回，绝对不能在 JSON 外输出任何多余的 Markdown 标记或文本。
recommendedSkeleton 和 recommendedBeats 字段的值，必须一字不差地复制上述【严格枚举】中的字符串，不可简写或翻译。

{
  "reasoning": "作为思维链，请先用约100字详细分析为什么这个故事需要这套骨架和节拍（例如示例：该视点偏向东亚日常，所以推荐起承转合...）",
  "matchScore": 95,
  "recommendedSkeleton": "严格复制骨架名称",
  "recommendedBeats": "严格复制节拍名称",
  "pros": ["优势1：...", "优势2：..."],
  "cons": ["劣势或风险提示1：...", "劣势或风险提示2：..."]
}`
  },
  diagnoseStructure: {
    id: 'diagnoseStructure',
    name: '诊断当前结构',
    template: `【角色设定】
你是全球顶级的、拥有最强大脑的剧本医生与结构大师。你目光如炬，能够一眼看穿任何叙事结构与故事内核之间的错位与契合点。

【任务目标】
请阅读以下【项目圣经】与【创作视点】，并对用户选择的叙事结构进行诊断。

项目类型：{{projectType}}

【故事前提】：
Logline: {{logline}}
核心冲突: {{coreConflict}}
创作视点:
{{creativeVision}}

用户选择的组合是：【骨架：{{selectedSkeleton}}】 + 【节拍：{{selectedBeats}}】。

请严格针对【用户选择的这个组合】在【{{projectType}}】类型下的适用性进行打分和优劣势分析，绝对不要分析其他未选择的结构。请严格按照以下 JSON 格式返回结果（必须先生成 reasoning 作为思维链）：
{
  "reasoning": "针对该组合的整体评价和分析（作为思维链先生成，约50字）",
  "matchScore": 85,
  "pros": ["优势1：...", "优势2：..."],
  "cons": ["劣势1（风险点）：...", "劣势2：..."]
}`
  },
  generateEpisodes: {
    id: 'generateEpisodes',
    name: '生成分集/段落大纲',
    template: `【角色设定】
你是全球顶级的、拥有最强大脑的剧集统筹（Showrunner）与总编剧。你拥有极强的宏观把控能力，擅长将一个庞大的故事概念拆解为扣人心弦、节奏紧凑的分集或段落大纲。

【任务目标】
请基于当前的故事背景和用户选择的体裁，为本作品规划完整的叙事大纲。请发挥你的创造力，确保每一集/段落都有明确的戏剧目标和钩子（Hook）。

【项目圣经】
Logline: {{logline}}
核心冲突: {{coreConflict}}

【创作视点】
{{creativeVision}}

【核心角色】
{{characters}}
（注意：以上是项目的核心角色。在规划大纲时，你可以根据剧情的自然发展，引入新的配角、反派或关键人物，以丰富故事的层次。）

{{structureInstruction}}

【创作者的具体想法/指令】
{{userIntent}}

请严格按照 JSON 格式返回，提供 2 个不同走向的方案供选择。每个方案包含 optionId, optionDescription (方案描述)，以及具体的 episodes 列表。
为确保思维链的连贯性，在每个 episode 中，必须先生成 inspiration (详细的梗概和内部节拍分析)，再生成 title (标题)。请顺应创作者的想法进行扩展和细化。`
  },
  regenerateEpisode: {
    id: 'regenerateEpisode',
    name: '重新生成单个分集/段落',
    template: `【角色设定】
你是全球顶级的、拥有最强大脑的剧集统筹（Showrunner）。你擅长在既定的故事框架内，巧妙地修补或重构单个叙事节点，确保其与前后文完美咬合。

【任务目标】
基于当前的故事背景和用户选择的体裁，重新生成这个特定的叙事段落/分集大纲。

【项目圣经】
Logline: {{logline}}
核心冲突: {{coreConflict}}

【创作视点】
{{creativeVision}}

【核心角色】
{{characters}}
（注意：以上是项目的核心角色。在规划大纲时，你可以根据剧情的自然发展，引入新的配角、反派或关键人物，以丰富故事的层次。）

【当前需要重写的段落/分集信息】
原标题: {{episodeTitle}}
原梗概: {{episodeInspiration}}

【前文上下文】
{{previousContext}}

【后文上下文】
{{nextContext}}

你正在重写中间的节点。请严格基于前文上下文的结尾进行承接，并确保你的输出能够与后文上下文的开头无缝咬合，绝对不要改变前后节点的既定事实。

【创作者的具体想法/指令】
{{userIntent}}

请严格按照 JSON 格式返回，包含该{{unitName}}的新梗概 (inspiration) 和新标题 (title)。请务必先生成 inspiration 作为思维链，再生成 title。`
  },
  generateScenes: {
    id: 'generateScenes',
    name: '生成节拍大纲',
    template: `【角色设定】
你是全球顶级的、拥有最强大脑的导演与分镜师。你擅长将宏观的段落大纲，拆解为一个个充满视觉张力和情绪爆发点的微观场景（节拍）。

【任务目标】
分析当前段落的上下文，将这个{{unitName}}拆解为具体的场景（节拍）。请发挥你的专业素养，不要生搬硬套模板，而是根据戏剧逻辑自然推演。

【项目圣经】
所属类型: {{projectTypeName}}
Logline: {{logline}}
核心冲突: {{coreConflict}}

【本{{unitName}}宏观定位】
标题: {{episodeTitle}}
梗概: {{episodeInspiration}}

【微观场景模板参考】
{{templateInstruction}}
注意：上述节拍是本段落必须经过的叙事里程碑。你可以将一个节拍独立为一个场景，也可以将相邻节拍合并为一个场景，但必须确保场景描述中完整体现了这些节拍的演进。

{{shortDramaInstruction}}

【参考上下文】
{{selectedContext}}

【创作者的具体想法/指令】
{{userIntent}}

请顺应创作者的意图，自适应地选择最合适的场景推进逻辑，确保逻辑自然连贯。

请严格按照 JSON 格式返回，提供 2 个不同走向的方案供选择。每个方案包含 optionId, optionDescription (方案描述)，以及具体的 scenes 列表。
为了保证思维链的连贯性，每个场景必须严格按照以下顺序生成字段：
1. sceneGoal: 场景目标与情绪动机（作为思维链先生成）
2. sceneAssets: 场景资产拆解（作为思维链，先罗列出该场景的核心实体资产。在影视制作中，资产(Assets)特指：核心场景(如废弃工厂、主角卧室)、关键道具(如带血的匕首、神秘日记本)、特殊服装或化妆(如破损的警服、僵尸妆)。【绝对不要】包含：动作(如急促的呼吸声、愤怒的嘶吼)、短暂的视觉/听觉效果(如闪烁的红光、飞溅的石块)、抽象的氛围(如刺骨的阴风)。注意：你可以使用已有的核心角色和资产，也可以根据剧情需要，自然地引入新的配角、新场景或新道具。请将所有涉及的实体资产都罗列在 sceneAssets 中。例如示例：废弃工厂、带血的匕首、破损的警服）
3. title: 场景标题（例如示例：雨夜追击）
4. description: 场景描述（发生什么事，谁在场。请务必将 sceneAssets 中罗列的元素自然地融入到描述中，提升画面感和细节丰富度）
5. valueCharge: 价值转换（positive, negative, neutral）
6. targetDuration: 该场景的预计时长（分钟），请根据总时长合理分配。参考标准：通常剧本中一页纸对应一分钟，约 400-500 字的详细描述支撑 1 分钟时长。
7. hook: 如果是微短剧，请提供 hook。
8. storyLine: 如果是剧集（TV Series），请标注该场景属于哪条故事线（A-Story, B-Story, C-Story），如果不是剧集则留空。`
  },
  expandScene: {
    id: 'expandScene',
    name: '扩写场景描述',
    template: `【角色设定】
你是全球顶级的、拥有最强大脑的编剧与视觉叙事大师。你擅长用极具画面感的文字，将干瘪的大纲扩写为充满细节、动作和情绪张力的场景描述。

【任务目标】
根据以下信息，扩写这个场景的描述，使其更加生动、具体，包含动作和情绪。
所属类型: {{projectTypeName}}
项目 Logline: {{logline}}
当前场景标题: {{sceneTitle}}
当前场景描述: {{sceneDescription}}
当前价值转换: {{valueCharge}}

【创作者的具体想法/指令】
{{userIntent}}

请直接输出扩写后的场景描述（不要包含任何其他内容或前缀）。`
  },
  regenerateScene: {
    id: 'regenerateScene',
    name: '重新生成单个场景(节拍)',
    template: `【角色设定】
你是全球顶级的、拥有最强大脑的导演与分镜师。你擅长在复杂的上下文中，精准地重构单个场景的内部逻辑和视觉呈现。

【任务目标】
重新生成这个特定的场景（节拍）。

【项目圣经】
所属类型: {{projectTypeName}}
Logline: {{logline}}
核心冲突: {{coreConflict}}

【本{{unitName}}宏观定位】
标题: {{episodeTitle}}
梗概: {{episodeInspiration}}

【当前需要重写的场景信息】
原标题: {{sceneTitle}}
原描述: {{sceneDescription}}

【前文上下文】
{{previousContext}}

【后文上下文】
{{nextContext}}

你正在重写中间的节点。请严格基于前文上下文的结尾进行承接，并确保你的输出能够与后文上下文的开头无缝咬合，绝对不要改变前后节点的既定事实。

【创作者的具体想法/指令】
{{userIntent}}

请严格按照 JSON 格式返回，包含该场景的场景目标与情绪动机 (sceneGoal)、场景资产拆解 (sceneAssets)、新标题 (title)、新描述 (description)、价值转换 (valueCharge: positive/negative/neutral)、预计时长 (targetDuration: 分钟数) 以及 hook (如果是微短剧)。请务必先生成 sceneGoal 和 sceneAssets 作为思维链（sceneAssets 必须是核心实体资产，如核心场景、关键道具、特殊服装等，绝对不要包含动作、短暂视觉/听觉效果或抽象氛围。注意：你可以使用已有的核心角色和资产，也可以根据剧情需要，自然地引入新的配角、新场景或新道具），再生成其他字段。`
  },
  rewriteScriptBlock: {
    id: 'rewriteScriptBlock',
    name: '重写剧本片段',
    template: `【角色设定】
你是全球顶级的、拥有最强大脑的剧本医生（Script Doctor）。你拥有极其敏锐的戏剧直觉和文字打磨能力，擅长化腐朽为神奇，通过精准的修改让平庸的剧本焕发光彩。

【任务目标】
请根据用户的修改意图，重写以下剧本片段。
要求：
1. 保持原有的类型（{{blockType}}）。
2. 如果是台词，请使其更符合人物性格，增加潜台词（Subtext），避免直白的宣泄。
3. 如果是动作描写，请使其更具画面感和镜头感。
4. 返回 JSON 格式，包含 reasoning (重写思路), content, emotion (如果是台词), camera (如果是动作)。

原内容：
"{{blockContent}}"

【创作者的具体想法/指令】
{{userIntent}}

请直接返回 JSON 数据，格式如下：
{
  "reasoning": "重写思路和分析",
  "content": "重写后的内容",
  "emotion": "情绪标注（可选）",
  "camera": "镜头标注（可选）"
}`
  },
  polishScriptText: {
    id: 'polishScriptText',
    name: '润色剧本内容',
    template: `【角色设定】
你是全球顶级的、拥有最强大脑的剧本医生（Script Doctor）。你对文字的韵律、潜台词和画面感有着极致的追求。

【任务目标】
请润色以下选中的剧本内容。
如果是台词，请使其更符合人物性格，增加潜台词（Subtext），避免直白的宣泄。
如果是动作描写，请使其更具画面感和镜头感。

选中的内容：
"{{selectedText}}"

【创作者的具体想法/指令】
{{userIntent}}

请直接返回润色后的内容，不要包含任何其他解释或前缀。`
  },
  showDontTell: {
    id: 'showDontTell',
    name: 'Show, Don\'t Tell 转换',
    template: `【角色设定】
你是全球顶级的、拥有最强大脑的金牌编剧，深谙 "Show, Don't Tell"（展现，而不是告知）的创作黄金法则。

【任务目标】
请将以下剧本片段进行 "Show, Don't Tell" (用画面讲故事) 的转换。要求：
1. 消除直接的心理描写或旁白解释
2. 将角色的内心活动转化为具体的动作、微表情或与环境的互动
3. 增强视觉和听觉细节

【原片段】
{{selectedText}}

请直接返回转换后的剧本片段，不要包含任何其他解释。`
  },
  subtextAnalysis: {
    id: 'subtextAnalysis',
    name: '潜台词分析',
    template: `【角色设定】
你是全球顶级的、拥有最强大脑的戏剧分析师和表演指导。你擅长像心理学家一样剖析人物内心深处的动机、恐惧和潜台词。

【任务目标】
请分析以下台词或动作的潜台词 (Subtext)。

【原片段】
{{selectedText}}

请提供以下分析：
1. 表层含义 (Text)：角色表面上在说什么/做什么。
2. 深层动机 (Subtext)：角色内心真正的渴望、恐惧或隐藏的意图。
3. 修改建议：如何通过更微妙的台词或动作让潜台词更丰富？

请简明扼要地输出分析结果。`
  },
  generateScript: {
    id: 'generateScript',
    name: '生成剧本',
    template: `【角色设定】
你是全球顶级的、拥有最强大脑的金牌编剧。你拥有极其丰富的想象力和深厚的文字功底，擅长通过生动的动作描写、潜台词和极具张力的对话来塑造人物和推动剧情。

【任务目标】
请根据场景大纲撰写剧本，并提取场景的结构化资产（Script Breakdown）。请充分发挥你的创造力，不要仅仅是翻译大纲，而是要加入丰富的视觉细节，让剧本充满画面感。请严格按照 JSON 格式返回。

【剧本结构规范】
剧本内容必须是一个由多个 Block 组成的数组，每个 Block 包含：
- type: 块类型，必须是以下之一：'scene_heading', 'action', 'character', 'dialogue', 'parenthetical', 'transition'
- content: 块的具体内容
- camera: 镜头语言（仅对 action 类型的 Block 有效，可选）

【视听语言强制规范 (Show, Don't Tell)】
1. 禁止连续出现超过 {{dialogueActionRatio}} 个 dialogue 类型的 Block。
2. 每 {{dialogueActionRatio}} 个 dialogue 之间，必须强制插入至少 1 个 action 类型的 Block。
3. 动作描写必须包含具体的视觉细节（例如示例：角色的微表情、肢体动作、环境互动）。
4. 镜头化描写要求：每个 action 块必须聚焦于一个具体的视觉落点（如：特写某个零件、远景观察环境、角色的一个微小眼神），严禁在一个块内总结式地写完一整组连续动作。
5. 空镜与反应逻辑：在 blocks 中强制要求插入至少 2-3 个不含角色、纯描述环境或氛围的 action 块，以拉长叙事呼吸。
6. 镜头语言（camera）应当极度克制且精准。仅在发生关键的情绪转折、视线引导或物理空间变化时使用。常规对话和动作请交由 action 描写，不要滥用 camera。

【创意（项目圣经）】
Logline: {{logline}}
核心冲突: {{coreConflict}}
{{stylePrompt}}{{shortDramaInstruction}}{{tvSeriesInstruction}}{{durationInstruction}}

【所属段落/分集宏观定位】
标题: {{sequenceTitle}}
描述: {{sequenceDescription}}

【参考上下文】
{{selectedContext}}

【当前节拍大纲（第 {{sceneNumber}} 场）】
标题: {{sceneTitle}}
描述: {{sceneDescription}}

【当前剧本内容】
{{currentScript}}

【创作者的具体想法/指令】
{{userIntent}}

请提供多个不同风格或走向的剧本方案供选择（通常 2-3 个）。每个方案必须包含完整的 Script Breakdown（场景拆解）和剧本内容 (blocks)。
返回的 JSON 结构必须包含一个 options 数组，每个元素包含：
- optionId: 方案编号
- optionDescription: 方案的简短描述
- sceneOutline: 场景梳理（在生成具体剧本前，先对场景的丰富度、动作细节、时间流逝进行梳理和规划，确保内容足以支撑预计时长）
- breakdown: 场景拆解（必须在 blocks 之前生成，作为思维链理顺场景元素），包含 setting (INT./EXT./INT./EXT.), location (场景名), time (DAY/NIGHT/DAWN/DUSK/CONTINUOUS), characters (角色名数组), props (道具名数组), vfx (特效说明数组，可选), sfx (音效说明数组，可选)。注意：声音（如手机铃声、脚步声、风声等）绝对不能作为角色（character）或道具（prop），必须归类为音效（sfx）。剧本中的资产只有人物、场景、道具。
- blocks: 剧本内容块数组

【资产参考与动态扩展 (Asset Reference & Expansion)】
以下是项目目前已注册的核心资产（角色、场景、道具）。
在生成剧本时，请优先使用这些已有资产以保持故事连贯性。
但是，如果剧情发展自然需要引入新的角色、场景或道具，你有权直接创造并使用它们！
请将所有使用到的资产（无论是已有的还是你新创造的）都准确地提取到 breakdown 的 characters, location, props 数组中。
已注册资产列表：
{{registeredAssets}}

【JSON 输出格式体示例】
{
  "options": [
    {
      "optionId": "A",
      "optionDescription": "方案A的简短描述",
      "sceneOutline": "本场戏预计时长3分钟。首先通过长镜头展现环境的压抑，接着角色A入场进行一系列繁琐的准备动作（耗时约1分钟）。随后角色B打破平静，两人进行试探性对话，伴随倒水的动作细节（约1分钟）。最后情绪爆发，以一个摔杯子的动作结束本场（约1分钟）。",
      "breakdown": {
        "setting": "INT.",
        "location": "场景名",
        "time": "NIGHT",
        "characters": ["角色A"],
        "props": ["道具A"],
        "vfx": ["特效A"],
        "sfx": ["音效A"]
      },
      "blocks": [
        { "type": "scene_heading", "content": "INT. 场景名 - NIGHT" },
        { "type": "action", "content": "动作描写...", "camera": "特写" }
      ]
    }
  ]
}`
  },
  generateShots: {
    id: 'generateShots',
    name: '生成分镜',
    template: `【角色设定】
你是一位全球顶级的导演。你精通视听语言，擅长通过镜头调度、景别切换和物理空间设计来讲述故事。你的任务是将文学剧本拆解为一份专业的、可执行的**分镜脚本清单**。

【任务目标】
请根据以下剧本内容，将场景拆解为具体的拍摄镜头 (Shots)。
1. **物理性 (Physicality)**：仅描述画面中发生的物理动作、物体状态和空间关系。严禁使用任何抽象的情感词汇。
2. **专业性 (Professionalism)**：使用标准的电影摄影术语（景别、角度、运镜）来定义镜头。
3. **时长控制**：通常每个镜头在 2-15 秒之间，必须完整覆盖提供的剧本，总时长需接近目标时长。

【创作视点 (Creative Vision)】
{{stylePrompt}}
(注：请基于此风格推演镜头的景别偏好和叙事节奏，例如：若风格是“海街日记”，请多用中远景长镜头和自然环境音。)

【角色与资产管理】
你必须根据剧情判断每个镜头中出现的资产，并填入对应 ID。
{{characterPrompt}}
{{locationPrompt}}
{{propPrompt}}
注意：在此阶段，你只需要关注角色在画面中的位置和动作（例如：“男人坐在窗边”），不需要描述外观。

【输出字段规范 (JSON Schema)】
你必须返回一个 JSON 数组，每个对象包含以下字段：
1. shotNumber: 镜号 (1, 2, 3...)
2. motivation: 导演动机（思维链）。解释你为何选择该镜头（景别、角度、动作）来体现“创作视点”的要求。
3. visualAction: 纯物理画面描述。描述角色动作、物体状态、空间布局。（例如：“周墨的手指悬停在屏幕上方，指尖微微颤抖”。）
4. shotSize: 景别 (严格枚举: EWS, WS, FS, MS, MCU, CU, ECU)
5. cameraAngle: 摄影机角度 (严格枚举: Eye-Level, High, Low, Bird, Worm, Dutch)
6. cameraMovement: 摄影机运动 (严格枚举: Static, Pan, Tilt, Track, Zoom, Push-in, Pull-out, Handheld)
7. lightingAtmo: 光影意图。描述导演期望的光影氛围（例如：“夕阳侧光，温暖的暖色调，高反差阴影”。）
8. voiceover: 该镜头对应的角色台词或旁白（如果没有则为空）
9. characterId: 如果 voiceover 是某个角色说的，请填入该角色的 ID。如果是旁白或无人说话，请留空。
10. characterIdsInShot: 画面中出现的角色 ID 数组
11. locationId: 当前画面所属的场地 ID
12. propIds: 画面中出现的道具 ID 数组
13. duration: 预计时长（秒）

【场景剧本】
{{scriptContent}}

【时长与构图要求】
{{durationInstruction}}
{{framingInstruction}}`
  },
  generatePrompts: {
    id: 'generatePrompts',
    name: '生成视觉提示词',
    template: `【角色设定】
你是一位全球顶级的电影摄影指导（Cinematographer/DP）。你精通如何将导演的物理调度转化为精准的光学语言。

【任务目标】
请根据导演提供的【分镜脚本全量数据】，结合【全局创作视点】，编译出一套物理逻辑严密、视觉风格统一的画面提示词。

【视觉编译协议】

1. **物理真实原则**：仅描述画面中真实存在的物体、位置与动作，不描述长相。
2. **构图优先**：必须首先定义构图方式与视角。
3. **镜头光学编译 (核心执行)**：
   你必须根据当前镜头的【景别】和【光影意图】，专注于“镜头语言”的推演。请基于但不限于以下维度进行举一反三：
   - **维度 A：镜头物理特性** [如：镜头光晕、广角畸变、边缘失焦、色散、动态模糊]
   - **维度 B：光学空间与焦点** [如：浅景深、全焦、焦外滚边、柔光滤镜]

注意：严禁在 imagePrompt 中包含任何关于底片质感、胶片颗粒或全局色调的描述，这些将由系统自动追加。你只需产出最纯净的镜头参数。严禁使用“8k、电影级、大师级”等无意义画质词。

【imagePrompt 拼接公式】
[镜头视角与构图], [主体动作与空间位置], [具体光影效果], [由以上维度推演出的镜头光学 Tags]。

示例（仅参考格式，严禁参考内容）：
低角度仰拍，主角在路灯下逆光伫立，冷蓝色调，高反差阴影，边缘失焦，广角畸变。

【全局创作视点 (风格滤镜)】
{{creativeVision}}

【资产视觉描述 (角色/场景/道具)】
{{assetDescriptions}}

【导演分镜脚本（全量数据）】
{{shotsData}}

【输出字段规范 (JSON)】
请返回 JSON 数组，包含：
1. id: 对应的分镜ID。
2. visualSummary: 中文视觉摘要。
3. imagePrompt: 纯中文视觉标签（严格遵守拼接公式）。
4. videoPrompt: 纯中文动态描述（侧重描述镜头运动轨迹与物理元素的位移变化）。`
  },
  extractCharacters: {
    id: 'extractCharacters',
    name: '提取角色',
    template: `【角色设定】
你是全球顶级的、拥有最强大脑的选角导演。你拥有一双毒辣的眼睛，能够从剧本的只言片语中，精准地勾勒出角色的外貌特征、气质和性格底色。

【任务目标】
请从以下剧本中提取所有出现的人物角色，并为每个角色生成一段外貌和性格的描述（用于后续AI绘图的Prompt）。
如果该角色已经在项目圣经中存在，请尽量保持一致。
剧本内容：
{{scriptContent}}

请返回JSON数组，格式如下：
[{"reasoning": "提取理由和分析", "name": "角色名", "description": "外貌和性格描述"}]`
  },
  extractLocations: {
    id: 'extractLocations',
    name: '提取场景',
    template: `【角色设定】
你是全球顶级的、拥有最强大脑的场景勘景师（Location Scout）与美术指导。你对空间、建筑风格和环境光影有着极其敏锐的感知力。

【任务目标】
请从以下剧本中提取所有出现的物理场景（Location），并为每个场景生成一段环境和光影的描述（用于后续AI绘图的Prompt）。
剧本内容：
{{scriptContent}}

请返回JSON数组，格式如下：
[{"reasoning": "提取理由和分析", "name": "场景名", "description": "环境和光影描述"}]`
  },
  extractProps: {
    id: 'extractProps',
    name: '提取道具',
    template: `【角色设定】
你是全球顶级的、拥有最强大脑的道具师（Prop Master）。你深知每一个出现在镜头前的物件都承载着叙事功能和人物性格。

【任务目标】
请从以下剧本中提取所有出现的关键道具（Prop），并为每个道具生成一段外观和细节的描述（用于后续AI绘图的Prompt）。
剧本内容：
{{scriptContent}}

请返回JSON数组，格式如下：
[{"reasoning": "提取理由和分析", "name": "道具名", "description": "外观 and 细节描述"}]`
  },
  breakdown: {
    id: 'breakdown',
    name: '剧本拆解',
    template: `【角色设定】
你是全球顶级的、拥有最强大脑的影视制片统筹与剧本拆解专家。你不仅精通剧本结构，还能极其敏锐地洞察出字里行间隐藏的拍摄需求（包括场地、时间、角色、服化道、视效、音效等）。

【任务目标】
请对以下剧本场景进行深度的剧本拆解（Script Breakdown）。不要局限于字面意思，请发挥你的专业经验，举一反三，推断出拍摄该场景所必需的隐含元素。

【剧本内容】
{{scriptContent}}

【输出要求】
请提取出以下维度的元素，并以 JSON 格式返回。注意：请提取出剧本中出现的所有角色、场景和道具。如果提取出的元素不在已有的核心资产列表中，这完全正常，说明剧情引入了新元素。请如实提取。
- setting: 室内/室外 (INT. / EXT. / INT./EXT.)
- location: 场景/地点
- time: 时间 (DAY / NIGHT / DAWN / DUSK / CONTINUOUS)
- characters: 角色列表（包含群演）。注意：声音（如手机铃声、画外音）绝对不能作为角色。
- props: 道具（包括关键物件、车辆、动物等）。注意：声音绝对不能作为道具。
- vfx: 特效需求（如：爆炸、绿幕、CGI扩展）
- sfx: 音效/音乐需求（如：环境音、特定动作音效、情绪配乐、手机铃声等）

【示例】
剧本："夜。废弃工厂。雨下得很大。杰克拔出手枪，走向阴影中的神秘人。"
JSON: {
  "setting": "EXT.",
  "location": "废弃工厂",
  "time": "NIGHT",
  "characters": ["杰克", "神秘人"],
  "props": ["手枪", "雨具（隐含）"],
  "vfx": ["人造雨（如果实拍困难）", "环境光影增强"],
  "sfx": ["暴雨声", "沉重的脚步声", "拔枪的机械声", "悬疑紧张的背景音乐"]
}`
  },
  analyzePacing: {
    id: 'analyzePacing',
    name: '分析剧本节奏与冲突',
    template: `【角色设定】
你是全球顶级的、拥有最强大脑的剧本医生和节奏大师。你擅长像心电图一样精准地分析剧本的冲突密度、情绪起伏和悬念钩子（Hooks）。

【任务目标】
请分析以下剧本场景的冲突密度和情绪走向，并识别出其中的“钩子”（Hooks）。

【剧本内容】
{{scriptContent}}

【输出要求】
请严格按照 JSON 格式返回分析结果。
- valueCharge: 场景结束时的价值转换（positive: 偏向积极/胜利/希望, negative: 偏向消极/失败/绝望, neutral: 平缓过渡）。
- hook: 场景中出现的悬念钩子或高频冲突点（如果没有则留空）。
- reasoning: 你的分析过程（简短说明为什么给出这样的 valueCharge 和 hook）。

【JSON 输出示例】
{
  "valueCharge": "negative",
  "hook": "主角发现门后有一滩血迹",
  "reasoning": "场景以主角陷入危险的未知境地结束，情绪急转直下，血迹作为强烈的视觉钩子吸引观众看下一场。"
}`
  },
  generateImage: {
    id: 'generateImage',
    name: '生成图像提示词',
    template: `{{imagePrompt}}
{{assetDescriptions}}
{{globalParams}}`
  },
  generateVideo: {
    id: 'generateVideo',
    name: '生成视频提示词',
    template: `{{videoPrompt}}
{{assetDescriptions}}`
  },
  generateMultiGridPrompt: {
    id: 'generateMultiGridPrompt',
    name: '生成多宫格提示词',
    template: `【角色设定】
你是全球顶级的电影分镜师与视觉提示词专家。你擅长将剧本分镜转化为极具视觉冲击力且逻辑连贯的多宫格画面描述。

【任务目标】
请根据以下提供的【分镜描述】、【包含的资产】以及【视觉风格】，生成一个多宫格的画面提示词（Image Prompt）以及对应的视频生成提示词（Video Prompt）。

【输出要求】
1. 提示词必须是中文。
2. 必须以 JSON 格式返回，包含两个字段：imagePrompt 和 videoPrompt。
3. imagePrompt 要求：
   - 明确指出是 {N}-panel film storyboard sheet, {Cols}x{Rows} grid layout.
   - 风格 (Style) 必须使用提供的【视觉风格】。
   - 必须包含 Setting (场景设置), Characters (角色信息), 以及 The {N} panels show: 1. ... 2. ...
   - **强调一致性**：这些分镜属于同一个场景，必须明确要求 AI 保持角色设计、环境细节和光影风格在所有面板中高度统一。
   - **关键要求**：在描述每个分镜时，请务必使用【包含的资产】中提供的具体资产名称（角色名、场景名、道具名），不要使用模糊的称呼。
4. videoPrompt 要求：
   - 描述如何将这个宫格图转化为一段连贯的视频。
   - 强调在不同面板描述的动作之间进行平滑过渡。
   - 保持叙事的连贯性。
5. **格式要求**：生成的提示词应包含适当的换行符，使内容易于阅读，不要将所有文字挤在一起。
6. 不要包含任何多余的解释，直接输出最终的 JSON。
7. 绝对不要包含任何技术参数（如 8k, resolution, --ar, --v 等）。

【视觉风格】
{{visualStyle}}

【包含的资产】
{{assetsInfo}}

【分镜描述】
{{shotDescriptions}}

{{userIntent}}`
  },
};
