# 剧本到分镜 (Script to Storyboard) 模块架构与逻辑分析报告

作为拥有丰富电影行业经验的架构师，我深入审视了当前系统从“剧本”到“分镜”的转化流程（重点关注 `src/pages/Storyboard.tsx`, `src/lib/promptBuilder.ts`, `src/store/usePromptStore.ts`）。

当前生成的图片提示词（Prompt）导致画面像“PPT”、缺乏电影感，根本原因在于**系统对 AI 绘画模型（如 Midjourney, Stable Diffusion, Flux 等）的底层逻辑存在严重误解**，并且在代码实现上存在逻辑覆盖的 Bug。

以下是详细的诊断分析与解决方案：

## 🚨 核心问题诊断 (Why it looks like PPT)

### 1. 致命的语言壁垒：强制使用纯中文 (The Language Barrier)
*   **现象**：在 `usePromptStore.ts` 的 `generateShots` 模板中，明确规定了【视觉翻译铁律】：`纯中文描述与去专业化：imagePrompt 必须全部使用中文`。
*   **分析**：目前业界顶级的 AI 生图模型几乎全部基于海量英文数据集训练。当输入纯中文提示词时，模型通常依赖内部较弱的翻译层，或者只能触发最基础、最泛化的视觉概念。这是导致画面干瘪、像素材库/PPT 的第一大元凶。

### 2. 违背生图原理：强制“去专业化” (De-professionalization)
*   **现象**：模板要求 `绝对不要使用英文专业术语`，用“从下往上仰拍”代替“Low angle”。
*   **分析**：这完全违背了 AI 绘画的 Best Practice。AI 模型对专业的摄影词汇（如 `35mm lens`, `f/1.8`, `volumetric lighting`, `chiaroscuro`, `cinematic lighting`）极其敏感，这些词是赋予画面“电影感（Cinematic look）”的魔法钥匙。剥夺了这些词，画面自然会失去质感和张力。

### 3. 过度的资产解耦 (Extreme Asset Decoupling)
*   **现象**：模板规定 `绝对不要在 imagePrompt 中描述角色的长相、穿着等具体外观特征`，仅描述动作。
*   **分析**：即使后续使用了 `--cref`（角色参考），生图模型依然需要基础的文本描述来构建画面的主体结构。如果提示词仅仅是“一个男人站着”，AI 会随机生成一个极其平庸的男人形象，导致画面缺乏个性和细节。如果用户没有绑定参考图，生成的画面将彻底沦为毫无特征的简笔画。

### 4. 严重的逻辑覆盖 Bug (Bypassing the Cinematography Dict)
*   **现象**：在 `src/lib/promptBuilder.ts` 中，原本设计了精妙的 `cinematographyDict`，试图将情绪（Emotion）自动转化为专业的灯光（Lighting）和构图（Composition）。
*   **Bug 代码**：`const corePrompt = llmImagePrompt || [cameraSetup, lightingSetup, compositionSetup, actionDescription].filter(Boolean).join(', ');`
*   **分析**：由于 LLM 必定会返回 `llmImagePrompt`（JSON Schema 强制要求），导致 `||` 后面的逻辑**永远不会执行**！系统精心准备的摄影机设置、灯光和构图参数被 LLM 生成的干瘪中文提示词彻底覆盖、完全丢弃。

### 5. 指令矛盾 (Contradictory Instructions)
*   **现象**：Prompt 模板中要求 `绝对不要在 imagePrompt 中出现类似 "inspired by 《天气之子》"`。但在 `buildVisualPrompt` 代码中，却又强行拼接了 `inspired by ${project.creativeVision.referenceWorks}`。
*   **分析**：这种系统底层逻辑与 Prompt 设定的割裂，会导致 LLM 产生困惑，同时也说明架构设计上存在脱节。

---

## 🛠️ 专业化重构方案 (Solutions)

为了让系统达到专业影视工业级的水准，我们需要对“剧本 -> 分镜”的转化逻辑进行以下重构：

### 1. 提示词全面英文化与专业化 (English & Professional Prompts)
*   **修改 `generateShots` 模板**：
    *   将 `imagePrompt` 的生成语言强制改为 **English**。
    *   保留 `visualDescription` 为中文（供用户在 UI 界面阅读和修改）。
    *   鼓励 LLM 使用专业的英文摄影术语（Cinematography terms），如 `Extreme Close-Up (ECU)`, `Low Angle`, `Cinematic Lighting`, `Depth of Field`, `Rule of Thirds` 等。

### 2. 修复 Prompt 组装逻辑 Bug (Fix `buildVisualPrompt`)
*   **修改 `src/lib/promptBuilder.ts`**：
    *   不要使用 `||` 覆盖，而是将 LLM 生成的 `imagePrompt` 与系统推演的 `cameraSetup`, `lightingSetup`, `compositionSetup` 进行**有机拼接**。
    *   **新公式**：`[Shot Size & Camera Angle], [LLM Image Prompt (Subject & Action)], [Lighting & Composition from Dict], [Global Style & Quality Tags], --ar 16:9`
    *   这样既保留了 LLM 对剧情画面的理解，又注入了系统级的专业摄影参数。

### 3. 适度的资产描述 (Balanced Asset Description)
*   **修改 Prompt 模板中的资产解耦规则**：
    *   允许 LLM 在 `imagePrompt` 中生成**基础的物理描述**（例如："a young man in a black trench coat", "a cyberpunk city street at night"）。
    *   明确告知 LLM：这些基础描述是为了给 AI 生图模型打底，后续的 `--cref` 和 `--sref` 会负责精准的特征对齐。基础描述越准确，参考图的融合效果越好。

### 4. 强化情绪到视觉的映射 (Enhance Emotion Engine)
*   在 `generateShots` 模板中，要求 LLM 输出当前镜头的核心情绪（`emotion` 字段）。
*   在 `buildVisualPrompt` 中，利用这个 `emotion` 字段去匹配 `cinematography_dict.json`，提取对应的灯光和构图词汇，强制注入到最终的英文 Prompt 中。

### 5. 引入画质增强词缀 (Quality Boosters)
*   在 `buildVisualPrompt` 中，如果用户没有设置强烈的视觉风格，系统应默认注入行业标准的画质增强词缀，如：`masterpiece, highly detailed, 8k resolution, photorealistic, cinematic lighting, volumetric lighting`，彻底告别 PPT 质感。

---

## 📋 下一步行动建议 (Next Steps)

如果您同意上述分析与方案，我将按照以下顺序修改代码：
1. 更新 `src/store/usePromptStore.ts` 中的 `generateShots` 模板。
2. 修复 `src/lib/promptBuilder.ts` 中的逻辑覆盖 Bug，优化 Prompt 拼接公式。
3. 调整 `src/pages/Storyboard.tsx` 中传递给 `buildVisualPrompt` 的参数，确保情绪和专业术语正确流转。

请确认是否可以开始执行代码修改？
