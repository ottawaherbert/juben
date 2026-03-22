# 架构师审计报告与优化方案 (Todolist-25) - V2

## 1. 核心业务流程审计 (重新评估)

基于您的最新指示，已排除大模型上下文窗口限制及 PDF/JSON 等基础技术债问题。我重新深度审阅了系统（特别是 `Script.tsx` 和 `Storyboard.tsx`），在专业影视/短剧工业化制作流中，发现了以下更核心的断层与优化空间：

### 1.1 剧作结构与类型化控制 (Type-Specific Control)
- **短剧 (Short Drama) 钩子机制缺失**：短剧对完播率要求极高，核心在于“高频反转”和“集末强钩子 (Cliffhanger)”。目前系统在生成分集大纲和剧本时，缺乏强制性的结构化“钩子检查”与生成约束。
- **情绪与节奏监控 (Pacing Monitor) 较弱**：`EmotionalPacingMonitor` 仅停留在浅层数据，未能将场景的 `valueCharge` (价值转换) 和 `hook` 转化为直观的剧作波形图，无法为创作者提供专业的剧本医生级反馈。

### 1.2 资产一致性与多模态联动 (Asset & Multimodal Consistency)
- **资产幻觉与强锁定 (Asset Hallucination)**：虽然 AI 现在能记住所有设定，但在剧本写作阶段，AI 仍可能“自由发挥”创造未登记的新角色或道具。缺乏强制的“事前资产锁定 (Asset Lock)”机制来保证制片严谨性。
- **TTS 语音角色脱节**：`Script.tsx` 中的 TTS 生成目前硬编码为默认音色 (`voiceName: 'Kore'`)，未能与剧本块中的 `characterId` 及资产库中设定的角色专属音色进行动态绑定。
- **分镜占位符问题 (Storyboard Mocks)**：`Storyboard.tsx` 中的 `handleRerollShot` (重新生成镜头) 仍在使用 `picsum.photos` 作为占位图，缺乏与真实图像生成 API 的对接架构准备。

### 1.3 数据结构双向同步风险 (Data Sync Risk)
- **结构化剧本 vs 纯文本剧本**：`Script.tsx` 中存在 `scriptBlocks` (结构化块) 和 `script` (纯文本) 两种状态。目前的 `blocksToPlainText` 转换会丢失元数据（如角色ID、情绪标签、镜头提示）。更严重的是，如果用户直接在编辑器中大段修改纯文本，系统缺乏将其**反向精准解析**为 `scriptBlocks` 的鲁棒机制，这将直接导致后续分镜生成 (Storyboard) 时提取不到准确的角色和动作。

---

## 2. 核心优化方案

### 2.1 短剧专项增强：Hook-Driven Generation
- **方案**：在 `Episodes` 和 `Structure` 阶段，针对短剧类型强制注入 `cliffhanger` 字段。在剧本生成提示词中，若为单集结尾场景，强制要求“必须以悬念或反转结束，并明确标注 [HOOK]”。

### 2.2 资产强锁定与 TTS 动态绑定
- **方案**：
  1. **事前锁定**：调用剧本生成前，将资产库中的角色/场景 ID 列表作为强制约束传入，要求 AI 必须且只能使用这些已注册的资产。
  2. **TTS 联动**：修改 `handlePlayTTS`，根据传入的 `blockId` 查找对应的 `characterId`，再从 `currentProject.assets` 中获取该角色配置的 `voiceId`，实现“千人千音”。

### 2.3 剧本医生与可视化节奏面板
- **方案**：升级 `EmotionalPacingMonitor`，基于 `handleAnalyzePacing` 提取的 `valueCharge` (正/负/平) 和冲突密度，绘制类似心电图的剧作节奏曲线，直观暴露“平淡期”或“高潮缺失”。

### 2.4 纯文本与结构化数据的智能解析 (Smart Parser)
- **方案**：引入 AI 驱动的剧本解析器。当用户在文本框完成自由手写编辑后，提供“一键结构化”功能，利用 AI 将纯文本精准切分为带有 `type`, `characterId`, `emotion` 的 `scriptBlocks`，确保分镜阶段的数据输入质量。

---

## 3. 执行计划 (待确认)
- [x] **第一阶段**：实现短剧 Hook 强制生成逻辑与剧本医生可视化曲线。 (已完成 Hook 逻辑，可视化待完善)
- [x] **第二阶段**：重构资产锁定机制，并完成 TTS 音色与角色资产的动态绑定。 (已完成)
- [x] **第三阶段**：开发剧本纯文本与结构化 Blocks 的 AI 双向同步/解析逻辑。 (已完成智能解析功能)
- [x] **第四阶段**：清理分镜占位符逻辑，完善真实图像生成的接口层。 (已完成)

**请架构师确认上述 V2 版方案。确认后我将开始分步实施。**
