# 影视制作流程梳理与系统优化建议 (Production Flow & System Optimization)

## 一、 标准影视/动画制作流程 (Standard Production Flow)

1. **开发阶段 (Development)**
   - **概念与提案 (Concept & Pitch):** 一句话故事 (Logline)、核心冲突、基调。
   - **世界观与人物 (World Building & Character Bible):** 人物小传、人物关系网、场景设定、特殊规则（科幻/奇幻）。
   - **大纲与处理 (Outline & Treatment):** 故事梗概、分集大纲、节拍表 (Beat Sheet)。
   - **剧本创作 (Screenplay):** 场景划分、动作描写、对白设计。

2. **前期筹备 (Pre-production)**
   - **剧本拆解 (Script Breakdown):** 提取每个场景所需的角色、场景 (Location)、道具 (Props)、特效 (VFX)。
   - **视觉开发 (Visual Development):** 概念设计 (Concept Art)、角色定妆、场景设计。
   - **分镜设计 (Storyboarding):** 镜头规划 (Shot List)、机位、景别、运动轨迹、动态分镜 (Animatic)。
   - **声音预演 (Voice Acting/Pre-scoring):** 角色配音录制、参考配乐。

3. **制作阶段 (Production / AI Generation)**
   - **资产生成 (Asset Generation):** 基于视觉开发生成一致性的角色、场景、道具素材。
   - **画面生成 (Shot Generation):** 按照分镜表生成具体的视频/图像片段。
   - **声音生成 (Audio Generation):** 生成最终对白 (TTS)、音效 (SFX)、背景音乐 (BGM)。

4. **后期制作 (Post-production)**
   - **剪辑与合成 (Editing & Compositing):** 将画面、对白、音效、音乐在时间线上对齐组装。
   - **调色与特效 (Color Grading & VFX):** 统一视觉风格。

---

## 二、 当前系统流程诊断与 Bug/断层分析 (System Diagnostics & Disconnects)

通过对当前代码库（Bible, Episodes, Structure, Script, Storyboard, Studio, Assets 等）的审查，发现以下流程断层和需要优化的细节：

### 1. 设定与资产的割裂 (World Building & Asset Disconnect)
- **问题:** `Bible` 页面只有角色和抽象的“创作视点”，缺乏**“世界观/核心场景 (Locations)”**和**“关键道具 (Props)”**的设定。虽然有 `Assets.tsx` 页面，但它更像是一个独立的图库，没有在前期开发阶段与故事深度绑定。
- **后果:** AI 在生成剧本和分镜时，无法保持场景和道具的视觉一致性。比如“赛博朋克酒吧”，每次生成的描述和画面可能都不一样。
- **优化建议:** 在 `Bible` 或新增的 `World` 页面中，强制要求建立核心场景和道具档案，并生成对应的 Prompt/参考图。在 `Assets` 中明确区分 Character, Location, Prop。

### 2. 剧本拆解环节缺失 (Missing Script Breakdown)
- **问题:** 从 `Script` (剧本) 到 `Storyboard` (分镜) 之间，缺少了影视制作中至关重要的**“剧本拆解”**步骤。
- **后果:** 分镜生成时，AI 只是根据一段文字去猜画面，不知道这个镜头里具体有哪些已定义的“资产”（哪个角色、哪个场景）。这导致 AI 视频/图像生成的角色一致性（Character Consistency）极差。
- **优化建议:** 在 `Script` 完成后，增加一个自动/半自动的拆解步骤，将剧本段落与 `Assets`（角色、场景、道具）进行 Tag 绑定。生成分镜 Prompt 时，自动注入这些资产的固定 Prompt。

### 3. 剧情连贯性与上下文丢失 (Context Loss in Scene/Script Generation)
- **问题:** 在 `Structure` 生成场景，或在 `Script` 生成剧本时，通常只传入了“当前集梗概”或“当前场景描述”。
- **后果:** 剧情容易割裂。比如场景 3 生成的剧本，可能完全忘记了场景 2 中角色受伤了，导致动作描写不连贯。
- **优化建议:** 在调用 AI 生成 `Script` 时，必须将**“上一个场景的结尾/摘要”**作为 Context 传入；在生成 `Storyboard` 时，也要考虑上一个镜头的景别和机位（避免越轴或跳切）。

### 4. 声音管线的前置缺失 (Audio Pipeline Disconnect)
- **问题:** `Bible` 中为角色分配了 `voiceName`，但在 `Script` 阶段写对白时，并没有直观地与声音试听结合。直到 `Studio` 阶段才去处理音频。
- **后果:** 创作者在写台词时无法感知节奏和语气，导致生成的 TTS 可能情绪不对（Emotion 字段未被充分利用）。
- **优化建议:** 在 `Script` 页面的 Dialogue 块中，直接集成 TTS 试听按钮，并允许调整该句台词的 `emotion` 或 `speed`，将生成的音频 URL 直接存入 ScriptBlock，而不是等到 Studio 再做。

### 5. 宏观结构到微观场景的跨度过大 (Pacing & Structural Gap)
- **问题:** 对于 Movie 类型，从 `Bible` 的 Logline 直接跳到 `Episodes` (被当作大幕/篇章)，再直接生成数十个 `Scenes`。AI 很难一次性把控这么长的节奏。
- **后果:** 中段剧情容易注水或崩塌（即所谓的“第二幕泥沼”）。
- **优化建议:** 引入 Sequence（段落）概念。Logline -> Act (幕) -> Sequence (段落，如“训练蒙太奇”、“追车戏”) -> Scene (场景)。让 AI 分层生成，先生成 8-12 个 Sequence，再为每个 Sequence 生成 3-5 个 Scene。

### 6. 分镜 (Storyboard) 维度的专业性不足
- **问题:** 当前的 `Shot` 接口包含 `shotSize` (景别) 和 `cameraMovement` (运镜)，但在实际 UI 和 AI 生成中，往往缺乏“焦段 (Lens)”、“光线 (Lighting)”和“构图 (Composition)”的控制。
- **后果:** 生成的画面缺乏电影感，像随机的 AI 跑图。
- **优化建议:** 扩展 `Shot` 数据结构，增加 `lighting` (如: 伦勃朗光, 霓虹背光) 和 `composition` (如: 对称构图, 引导线)。在 AI 生成分镜 Prompt 时，强制按照 `[景别] + [主体及动作] + [场景环境] + [光影/构图] + [摄像机运动]` 的工业标准公式输出。

---

## 三、 总结与下一步行动 (Next Steps)

为了让这个系统真正达到“专业影视工业级”的 AI 制作工具标准，我们需要在数据流转上做“强绑定”：
**灵感 -> 结构 -> 剧本 -> (资产绑定) -> 分镜 -> (TTS预演) -> 最终合成**

**建议的开发优先级 (To-Do List):**
1. **[高] [已完成] 资产强绑定机制:** 修改 `Script` 和 `Storyboard` 的数据结构，允许将 `ScriptBlock` 和 `Shot` 显式关联到 `Assets` 库中的 ID。
2. **[高] [已完成] 优化分镜 Prompt 生成逻辑:** 将 Creative Vision (视觉风格) + 绑定的 Assets Prompt + 专业的镜头语言公式，组合成最终传给 ImageGen/VideoGen 的 Prompt。
3. **[中] [已完成] 剧本上下文记忆:** 修改 `services/ai.ts` 的调用，在生成剧本时引入滑动窗口机制（携带前 2 个场景的摘要）。
4. **[中] [已完成] 剧本页面的 TTS 预演:** 在 `Script` 页面直接打通配音生成，让台词和声音情绪在早期就确定下来。
5. **[低] [已完成] 引入 Sequence (段落) 层级:** 优化长篇电影的结构生成逻辑。
