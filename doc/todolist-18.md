# O.M.N.I. 视觉化引擎优化方案：剧本到分镜提示词 (Text-to-Image Prompt)

## 1. 总体评价 (Overall Assessment)

这位业内人士的意见**非常专业且切中要害**。他指出的“逻辑冲突”、“视觉污染”以及“非视听化语言”正是目前所有基于 LLM 生成分镜/视频的系统都会遇到的核心痛点。生图模型（如 Midjourney, Flux）是“物理视觉驱动”的，而剧本是“文学/情绪驱动”的，两者之间存在巨大的语义鸿沟。

不过，结合我们 O.M.N.I. 系统的现有架构（基于 `@google/genai` 的结构化 JSON 输出），他的部分建议（如“分层调用”）在实际工程落地时会导致 API 延迟翻倍和成本上升。因此，我作为架构师，在吸收其核心思想的基础上，对方案进行了**工程化和性能向的优化**。

---

## 2. 深度解析与优化方案 (Deep Analysis & Optimization Plan)

### 模块一：图像提示词“物理净化” (Prompt Sanitization)
*   **专家意见**：过滤声音、心理活动等文学描写；屏蔽未出场角色（尤其是环境定场镜头）；禁止影视黑话。
*   **我们的优化解法**：**完全赞同**。在目前的 `Storyboard.tsx` 中，我们确实容易让 LLM 把剧本原话直接塞进 `imagePrompt`。
    *   **落地策略**：在 System Prompt 中加入**【视觉翻译铁律】**。明确规定 `imagePrompt` 必须是纯视觉的英文 Tags 组合。特别强调：当 `shotSize` 为 `EWS` (大远景/环境定场) 时，**强制要求 LLM 不要将角色资产的 prompt 混入**，防止 AI 在大远景中强行画出人脸导致画面崩坏。

### 模块二：全局风格的“动态覆写” (Dynamic Style Override)
*   **专家意见**：防止全局视点（如“清新”）污染局部场景（如“惊悚”）。
*   **我们的优化解法**：**非常合理**。目前我们是把 `creativeVision` 粗暴地拼接到 Prompt 中。
    *   **落地策略**：不写死 if-else 逻辑，而是通过 Prompt 引导。我们会要求 LLM 先输出一个 `sceneMood`（当前场景情绪），然后指示 LLM：“当 `sceneMood` 与全局 `creativeVision` 冲突时，以 `sceneMood` 为主进行光影和色调的覆写，但保持基础的画质和渲染风格”。

### 模块三 & 四：视听翻译器与动态分镜策略 (Shot Strategy)
*   **专家意见**：利用 LLM 推演情绪到机位；根据对话/动作戏自动分配景别比例（如对话多用 OTS/MCU，动作多用 FS/Tracking）。
*   **我们的优化解法**：**完全赞同**。这是提升分镜专业度的关键。
    *   **落地策略**：在 Prompt 中引入 **Few-Shot（少样本）模板路由**。明确告诉 LLM：“如果是对话密集的 Block，请交替使用 OTS (过肩) 和 MCU (中近景)；如果是动作戏，请使用 Dutch Angle (倾斜角) 或 Tracking (跟随)”。

### 架构级优化：关于“分层调用”的改良 (The "Two-Step" vs "CoT" Optimization)
*   **专家意见**：建议先让 LLM 生成“镜头描述”，再由一个专门的“翻译层”将其转化为生图提示词。
*   **架构师视点**：在实际生产环境中，为每个场景调用两次大模型会导致严重的**延迟 (Latency)**。
*   **我们的终极解法：思维链 (Chain of Thought, CoT) 单次生成**。
    我们将修改 `Storyboard.tsx` 中请求的 JSON Schema，强制 LLM 在输出 `imagePrompt` 之前，先输出 `visualMotivation` (镜头动机) 和 `visualDescription` (画面物理描述)。
    通过这种方式，**迫使 LLM 在单次 API 调用中先进行“自我翻译和思考”，然后再输出最终的 Tags**。这既达到了专家所说的“翻译层”效果，又保证了系统的响应速度。

---

## 3. 具体落地 Action Items (已完成)

我们已在 `src/pages/Storyboard.tsx` 和 `src/store/usePromptStore.ts` 中对 `generateAIContent` 的 Prompt 和 Schema 进行了重构，具体包括：

### [x] Action 1: 升级 JSON Schema
在原有的 `shotSize`, `cameraMovement`, `duration` 基础上，增加：
1.  `visualMotivation` (string): 镜头动机分析（例如示例：“为了展现角色的压抑感，使用高角度俯拍”）。
2.  `visualDescription` (string): 纯物理的画面描述（例如示例：“一个男人站在阴暗的巷子里，雨水打在脸上”）。
3.  `imagePrompt` (string): **严格遵守公式的英文 Tags**。

### [x] Action 2: 重构 Prompt 构造公式
在传递给大模型的 Prompt 中，强制要求 `imagePrompt` 必须按照以下权重递减的公式拼接：
`[运镜/景别/角度], [光影/色调参数], [构图/空间布局], [物理环境实体及动作], [项目视点中的全局画质参数]`

### [x] Action 3: 注入【视觉翻译铁律】(System Prompt 增强)
在 `usePromptStore.ts` 的 `generateShots` 模板中加入了以下规则：
1.  **物理净化**：`imagePrompt` 严禁出现声音、心理活动、时间流逝等非视觉词汇。
2.  **定场规避**：如果 `shotSize` 是 `EWS` (大远景) 且主要为了交代环境，`imagePrompt` 中**严禁**包含角色的详细外貌特征。
3.  **动态分镜**：禁止连续 3 个镜头使用相同的景别。对话戏必须包含 OTS (过肩镜头) 和 Reaction Shot (反应镜头)。
4.  **风格覆写**：根据当前剧本的情绪，动态调整光影参数。压抑用 Low key/Top light，神圣用 Volumetric light 等。

### [x] Action 4: 全局 Prompt 优化 (防思维定势)
检查并更新了系统中所有的 Prompt 模板（如 `usePromptStore.ts` 中的所有模板），确保在举例时明确使用“例如示例：”或“示例：”字眼。这防止了大模型将示例当成硬性限制，从而能够举一反三，根据具体情况灵活处理。

---
**结论**：该业内人士的建议极具价值，我们采用了 **CoT (思维链) + 严格 Schema + 视觉翻译铁律** 的方式，在不增加系统延迟的前提下，完美吸收了他的优化建议，将 O.M.N.I. 的分镜生成质量提升到专业影视级别。同时，引入了“示例明确化”的 Prompt 工程最佳实践，提升了 AI 的泛化能力。
