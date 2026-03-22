# 🎬 AI 影视全流程制作系统 - 优化与拓展计划 (v1.0)

## 🎯 一、 系统设计初衷与愿景 (Vision)
打造一个真正懂电影制作的 AI 辅助创作平台。从“一句话灵感”到“最终成片”，将好莱坞工业化标准（如《救猫咪》节拍表、英雄之旅、角色弧光）与最前沿的生成式 AI 技术（LLM, 文生图, 图生视频, TTS）深度融合。它不仅是一个工具，更是创作者的“联合制片人”、“联合编剧”和“副导演”。

## 🏗️ 二、 当前架构评估 (Current State Assessment)
**优势：**
- 核心工作流已初步建立：项目 -> 圣经(Bible) -> 分集(Episodes) -> 节拍/场景(Structure) -> 剧本(Script) -> 分镜(Storyboard) -> 资产(Assets) -> 影棚(Studio)。
- 数据结构（Store）设计合理，层级清晰（Project > Episode > Scene > Shot）。
- 具备了基础的 AI 生成页面（ImageGen, VideoGen, AudioGen）。

**不足（半成品痛点）：**
- **AI 赋能割裂**：目前 AI 生成（图/文/视频）与核心创作流（剧本、分镜）是分离的，没有形成“上下文感知”的无缝辅助。
- **编剧专业度欠缺**：缺少专业的剧本格式支持（如 Fountain 格式），缺少节拍表（Beat Sheet）的模板化引导。
- **资产连贯性（Consistency）不足**：角色和场景资产在分镜生成时缺乏一致性控制（Character/Style Consistency）。
- **时间线与多媒体整合薄弱**：Studio 页面需要一个真正的非编（NLE）时间线，将视频、音频、音效、字幕结合。

## 🚀 三、 核心优化与拓展计划 (Optimization & Expansion Plan)

### 阶段一：工作流深度融合与专业化 (Workflow & Professionalism) - 优先级：高
1. **智能项目圣经 (AI-Powered Bible)**
   - **拓展**：引入“角色弧光 (Character Arc)”和“人物关系图谱”。
   - **AI 辅助**：根据 Logline 自动扩写世界观设定；根据主角设定自动反推反派（Antagonist）和配角设定。
2. **结构与节拍表增强 (Advanced Structure & Beat Sheet)**
   - **拓展**：内置经典剧作结构模板（如布莱克·斯奈德的《救猫咪》15个节拍、英雄之旅12步、三幕剧标准）。
   - **AI 辅助**：一键将 Logline 展开为标准 15 节拍大纲；AI 评估当前场景的“价值电荷 (Value Charge)”翻转是否合理。
3. **专业剧本编辑器 (Professional Script Editor)**
   - **拓展**：支持好莱坞标准剧本格式（Scene Heading, Action, Character, Dialogue, Parenthetical），支持导出 PDF/Fountain。
   - **AI 辅助**：选中某段 Action，AI 自动扩写细节；选中 Dialogue，AI 根据角色性格（Flaw/Desire）重写台词（Subtext 潜台词生成）。

### 阶段二：AI 资产与分镜的工业化 (AI Assets & Storyboarding) - 优先级：高
1. **全局资产库与一致性控制 (Asset Consistency Management)**
   - **拓展**：在 Assets 页面建立“角色参考图 (Character Reference)”和“场景概念图 (Environment Concept)”的统一管理。
   - **AI 辅助**：在 Storyboard 生成分镜时，自动携带当前场景的角色 Reference 和 Style Prompt，调用支持一致性的 AI 模型（如 Midjourney v6 cref/sref，或 Stable Diffusion IP-Adapter）。
2. **智能分镜室 (Smart Storyboard)**
   - **拓展**：支持镜头语言标签（如 极远景 EWS, 特写 CU, 越过肩膀 OTS, 俯拍 High Angle, 移动 Pan/Tilt/Tracking）。
   - **AI 辅助**：一键将剧本（Script）的 Action 拆解为多个 Shot，并自动生成带有镜头语言的 Image Prompt 和 Video Prompt。

### 阶段三：多模态生成与影棚合成 (Multimodal & Studio Assembly) - 优先级：中
1. **音视频生成管线打通 (A/V Pipeline Integration)**
   - **拓展**：在 Storyboard 中直接触发 Image -> Video 的生成，无需跳转到单独的 VideoGen 页面。
   - **AI 辅助**：根据剧本台词自动调用 TTS（如 ElevenLabs）生成配音，并自动对齐时间轴；根据场景描述自动生成环境音效（Foley/SFX）。
2. **非编时间线影棚 (NLE Studio Timeline)**
   - **拓展**：在 Studio 页面实现一个轻量级的 Web 视频编辑器（多轨道：视频轨、音频轨、配音轨、字幕轨）。
   - **功能**：支持片段的拖拽排序、裁剪、转场效果；支持导出最终的 MP4 视频。

### 阶段四：协作与商业化准备 (Collaboration & Export) - 优先级：低
1. **多格式导出 (Export & Pitch)**
   - 导出“制片人 Pitch Deck（融资路演PPT）”。
   - 导出标准格式剧本（PDF）。
   - 导出带水印的动态分镜（Animatic）视频。
2. **版本控制与协作 (Version Control)**
   - 剧本和分镜的历史版本回溯（Snapshot）。

## 📝 四、 近期 Action Items (To-Do List)
*请确认以下优先级，确认后我们将逐一实现：*

- [x] **Task 1**: 升级 `Structure` (节拍大纲) 页面，引入《救猫咪》等经典结构模板，并增加 AI 自动扩写节拍功能。
- [x] **Task 2**: 改造 `Script` (剧本) 页面，实现所见即所得的专业剧本格式排版，并增加“选中台词让 AI 润色”的悬浮菜单。
- [x] **Task 3**: 优化 `Storyboard` (分镜) 页面，实现从剧本一键拆解镜头（Shots），并自动生成带有专业镜头语言的 Prompt。
- [x] **Task 4**: 强化 `Assets` (资产) 页面，增加角色和场景的一致性参考图上传与管理，为后续图生视频做准备。
- [x] **Task 5**: 在 `Studio` 页面引入轻量级的时间线组件（Timeline），实现分镜视频和配音的初步合成。

---
*等待您的确认。如果您对上述计划的方向和优先级满意，请告诉我从哪一个 Task 开始动手！*
