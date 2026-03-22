# O.M.N.I. Studio 系统架构审计与优化方案 (todolist-22)

作为首席架构师，在审阅了当前系统的代码结构、数据流以及 AI 集成逻辑后，结合电影、电视及短剧的专业制作流程，我整理了以下审计报告及优化建议。

## 1. 核心架构审计 (Architectural Audit)

### 1.1 数据流与上下文一致性 (Contextual Integrity)
*   **现状**: 系统虽然定义了丰富的“项目圣经”（Bible），包括角色的内在渴望、外在目标和致命弱点，但在 `Script.tsx` 的剧本生成逻辑中，这些深度信息并未被完整传递给 AI。
*   **问题**: AI 生成的台词可能流于表面，无法体现角色的性格弧光（Character Arc）。
*   **优化方案**: 
    *   在 `generateAIContent` 中引入“全局上下文注入”机制。
    *   自动将当前场景涉及的角色的“心理档案”注入 Prompt。

### 1.2 角色一致性技术实现 (Character Consistency Bug)
*   **现状**: `Storyboard.tsx` 中尝试通过在 Prompt 后追加 `--cref` 和 `--sref` 来实现角色/场景一致性。
*   **Bug**: 当前使用的 `gemini-2.5-flash-image` 模型并不直接支持 Midjourney 风格的文本参数。
*   **优化方案**: 
    *   修改 `ai.ts` 中的 `generateAIImage`，将 `referenceImages` 作为 `inlineData` 真正传递给 Gemini 的多模态输入。
    *   在 `Storyboard` 界面增加“角色锁定”状态，确保生成的每一帧都引用了 Bible 中的参考图。

### 1.3 剧本拆解与资产联动 (Breakdown & Asset Linking)
*   **现状**: `Breakdown.tsx` 是一个独立的页面，需要手动点击“同步至资产库”。
*   **问题**: 生产流程脱节。在专业流程中，剧本一旦定稿，拆解应该是自动且强制的。
*   **优化方案**: 
    *   实现“剧本自动扫描”功能。在剧本生成后，自动识别新出现的角色/道具，并提示用户在 Bible 中补全设定。
    *   在 `ScriptBlock` 中增强 `linkedAssetId` 的强制校验。

## 2. 电影/短剧专业流程优化 (Industry Workflow Optimization)

### 2.1 短剧（微短剧）节奏控制
*   **现状**: 虽然有 `cliffhanger` 字段，但缺乏对“黄金 3 秒”和“高频冲突点”的量化监控。
*   **优化方案**: 
    *   在 `Script.tsx` 中集成 `EmotionalPacingMonitor`（情感节奏监控器）。
    *   通过 AI 分析剧本的“冲突密度”，并在时间线上可视化标注“钩子”（Hooks）的位置。

### 2.2 镜头语言的专业性 (已完成)
*   **现状**: `Storyboard.tsx` 生成的镜头描述较为通用，之前计划使用静态字典硬匹配。
*   **优化方案 (动态逻辑编译器)**: 
    *   **废除硬匹配**：清空 `cinematography_dict.json` 的硬编码映射，仅作为逻辑推演的参考示例（Logic Sampling）。
    *   **导演思维植入**：在分镜生成的 System Prompt 中加入【导演思维：视听翻译协议】，通过“思维链引导（CoT）”让大模型根据具体语境进行视听转化（如：分析情绪质感，推演光学方案）。
    *   **资产解耦与视觉合成**：重构 `promptBuilder.ts`，停止无脑追加 globalStyle。允许 AI 在特定镜头中**覆写（Override）**全局风格，释放 AI 的想象力，自行决定是否调用极端的机位。

### 2.3 生产力工具增强
*   **场景编号 (Scene Numbering)**: 增加正式的场景编号系统，支持 A/B 场景插入，这是实拍阶段场记单的基础。
*   **版本控制 (Revision Tracking)**: 剧本修改频繁，需增加“修订版本”功能（如：白稿、蓝稿、红稿）。

## 3. 技术优化与 Bug 修复 (Technical & Bug Fixes)

### 3.1 存储压力优化
*   **问题**: `localforage` 存储大量 AI 生成的 Base64 图片/视频会导致浏览器卡顿或存储溢出。
*   **优化方案**: 
    *   引入 `IndexedDB` 的分块存储策略。
    *   对过期的“Take”（拍摄素材）增加自动清理机制。

### 3.2 剧本格式标准化
*   **问题**: `blocksToPlainText` 转换逻辑过于简单，导出的 Fountain 格式在专业软件（如 Final Draft）中可能存在兼容性问题。
*   **优化方案**: 
    *   重构 Fountain 序列化器，严格遵守 Fountain 语法规范（处理双人对白、复杂转场等）。

## 4. 待办清单 (Action Items)

- [x] **Phase 1: 脑干连接 (Context)** - 重构 AI Service，实现项目全局背景的自动注入。
- [x] **Phase 2: 视觉锁定 (Consistency)** - 修复 `cref/sref` 逻辑，实现真正的多模态角色一致性生成。
- [x] **Phase 3: 节奏大师 (Pacing)** - 在剧本编辑器侧边栏启用实时情感/冲突曲线预览。
- [x] **Phase 4: 资产联动 (Breakdown)** - 实现剧本块与资产库的实时双向绑定。
- [x] **Phase 5: 专业导出 (Export)** - 升级 PDF/Fountain 导出引擎，支持标准好莱坞排版。
- [x] **Phase 6: 导演思维 (Director's Mindset)** - 重构分镜生成逻辑，废除硬编码映射，引入 CoT 视听推演。

---
*架构师：[AI Assistant]*
*日期：2026-03-17*
