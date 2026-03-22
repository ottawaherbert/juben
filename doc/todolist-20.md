# 影视短剧制作系统架构与代码审查报告 (Code Review & Optimization)

作为拥有丰富电影行业经验的架构师，我从专业影视制作流程（特别是短剧的快节奏、高密度工作流）出发，对当前系统代码进行了深入审查。系统整体架构清晰，Zustand 状态管理和 AI 赋能的思路非常符合未来制作趋势。但在逻辑严密性、专业工作流适配以及代码细节上，仍存在一些 Bug 和优化空间。

以下是我的审查发现与解决方案，在您确认前，我不会修改任何代码。

## 一、 严重 Bug (Critical Bugs)

### 1. 剧本编辑模式的数据同步断层 (Script.tsx)
*   **问题描述：** 在 `Script.tsx` 中，当用户使用 AI 重写某个剧本块 (`handleRewriteBlock`) 时，系统只更新了 `scriptBlocks` 数组，而**没有同步更新**纯文本的 `script` 字段。如果用户随后点击“编辑文本”切换到纯文本模式，系统会直接读取旧的 `script`，导致用户之前所有的 AI 重写修改全部丢失。
*   **解决方案：** 每次 `scriptBlocks` 发生改变时（无论是生成还是重写），都应该提供一个机制（或自动）将 `scriptBlocks` 的内容拼接并覆盖回 `script` 字段，确保双向数据同步。

### 2. 分镜图像提示词构建逻辑失效 (Storyboard.tsx)
*   **问题描述：** 在 `handleGenerateShots` 中，系统调用了 `buildVisualPrompt` 来生成 `videoPrompt`，但对于 `imagePrompt`，却**直接使用了 LLM 返回的原始提示词**，完全忽略了 `buildVisualPrompt` 生成的包含全局视觉风格 (Global Style) 和摄影机运镜规则的 `imagePrompt`。这导致项目设置的视觉风格无法应用到生成的图片上。
*   **解决方案：** 应该使用 `buildVisualPrompt` 返回的 `imagePrompt`，或者将 LLM 生成的画面描述作为参数传入 `buildVisualPrompt`，统一由该函数生成最终的图像提示词。

### 3. 场景资产 (Location) 引用逻辑错误 (Storyboard.tsx)
*   **问题描述：** 在为图像提示词追加 `--sref` (风格参考) 时，代码粗暴地使用了 `linkedLocationAssets[0].imageUrl` 应用于**所有**镜头。如果一个场景中有多个地点资产，AI 为不同镜头分配了不同的 `locationId`，这个逻辑会导致所有镜头都使用了第一个地点的风格。
*   **解决方案：** 应该根据当前镜头 `s.locationId` 去 `linkedLocationAssets` 中精确查找对应的地点资产，然后再提取其 `imageUrl`。

## 二、 专业工作流与体验优化 (Workflow & UX Optimizations)

### 1. 剧本块的直接内联编辑 (Direct Block Editing)
*   **问题描述：** 目前用户无法直接手动修改 `scriptBlock` 的文字。如果发现 AI 生成的台词有一个错别字，用户必须切换到“编辑文本”模式（这会销毁所有块结构和资产链接！），或者使用 AI 重写（不可控）。
*   **解决方案：** 在 `Script.tsx` 的渲染逻辑中，将剧本块的 `div` 替换为 `contenteditable` 元素或 `textarea`，允许用户直接在块结构下进行文本微调，并在 `onBlur` 时更新 Zustand 状态。这是专业编剧软件（如 Final Draft）的基础体验。

### 2. 时间线修剪逻辑 (Timeline Trimming) 优化 (Timeline.tsx)
*   **问题描述：** 
    *   **视频修剪：** 目前拖拽镜头左边缘（`trimEdge === 'left'`）执行的是“滚动编辑 (Roll Edit)”，即同时改变前一个镜头的长度和当前镜头的长度。虽然这是专业的 NLE 功能，但如果用户只是想缩短当前镜头（留下空隙或整体左移），目前的逻辑不支持。且如果修剪的是第一个镜头，代码会直接失效。
    *   **音频修剪：** 音频轨道目前只能拖拽移动位置，**完全没有提供修剪边缘 (Trim Handles)** 的功能，这在实际制作中是不可接受的。
*   **解决方案：** 
    *   为音频轨道补充左右边缘的修剪把手。
    *   重构修剪逻辑，区分“波纹编辑 (Ripple Edit)”和“滚动编辑 (Roll Edit)”，或者默认采用波纹编辑（修剪当前镜头，后续镜头自动对齐）。

### 3. 视频合成的真实落地 (Studio.tsx)
*   **问题描述：** `handleSynthesize` 目前只是一个 UI 动画，最后下载了一个硬编码的测试视频 (`mov_bbb.mp4`)。
*   **解决方案：** 既然项目中已经安装了 `@ffmpeg/ffmpeg`，应该在 `handleSynthesize` 中真正调用 FFmpeg WASM，根据 Timeline 的数据（视频片段、音频片段、开始时间、持续时间），在浏览器端将它们拼接、混音并导出为最终的 MP4 文件。

### 4. AI 提示词的集中化管理 (Prompt Management)
*   **问题描述：** 剧本拆解 (`Breakdown.tsx`)、剧本重写 (`Script.tsx`) 等核心 AI 提示词被硬编码在组件内部。随着模型的迭代和专业化需求的增加，这种方式极难维护。
*   **解决方案：** 建立一个独立的 `PromptService` 或配置文件，将所有系统级 Prompt 集中管理。未来甚至可以开放给高级用户，允许他们自定义“剧本拆解规则”或“分镜生成偏好”。

### 5. 音频轨道的生命周期管理
*   **问题描述：** 在 `Storyboard.tsx` 生成分镜时，系统会同步生成对应的音频轨道（台词）。但如果用户后续在 Studio 中删除了某个镜头，或者重新生成了某个镜头，对应的音频轨道并不会自动更新或删除，容易造成时间线混乱。
*   **解决方案：** 在数据结构上，考虑将对话类型的 `AudioTrack` 与 `Shot` 建立更强的关联（例如在 AudioTrack 中记录 `shotId`），在镜头增删改时，提供联动更新的选项。

---

**下一步建议：**
请您审阅上述发现。如果您同意，我们可以按照优先级（建议先修复 Critical Bugs，再实现 FFmpeg 真实合成，最后优化时间线和剧本编辑体验）逐步进行代码修改。
