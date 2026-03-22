# O.M.N.I. Studio 核心架构升级 Todo List v3.0 (剧本医生结构诊断系统)

## 评估总结
引入“剧本医生（Script Doctor）结构诊断”功能，将工具从“被动生成器”升级为“主动式专家顾问”。通过在生成大纲前加入轻量级的预评估环节，帮助用户根据项目圣经（题材、基调、视点）匹配最完美的“骨架+节拍”组合，并提供动态的优劣势分析（沙盘推演）。

## 待办事项列表

### 1. 核心 Prompt 与数据结构定义 (Store)
- [x] **1.1 新增评估 Prompt**：
  - 在 `usePromptStore.ts` 中新增 `evaluateStructure` 模板。
  - 模板需接收变量：`logline`, `coreConflict`, `creativeVision`, `selectedSkeleton` (可选), `selectedBeats` (可选)。
- [x] **1.2 严格定义返回 Schema**：
  - 确保 AI 返回严格的 JSON 格式，包含：
    - `recommendedSkeleton` (string): 推荐的骨架 ID/名称
    - `recommendedBeats` (string): 推荐的节拍 ID/名称
    - `matchScore` (number): 匹配度得分 (0-100)
    - `reasoning` (string): 推荐或评价理由
    - `pros` (string[]): 优势列表
    - `cons` (string[]): 劣势/风险点列表

### 2. 诊断引擎交互逻辑 (Logic)
- [x] **2.1 初始智能推荐 (Auto-Recommend)**：
  - 在用户点击“生成段落/分集”打开配置弹窗时，立即触发一次无 `selectedSkeleton` 和 `selectedBeats` 的评估请求（让 AI 盲猜最优解）。
  - 拿到结果后，自动将下拉框的默认值设置为 AI 推荐的组合。
- [x] **2.2 动态沙盘评估 (Reactive Evaluation)**：
  - 监听用户在弹窗中对“骨架”和“节拍”的手动修改。
  - 当用户修改选项后，触发防抖 (Debounce，如 800ms) 的评估请求，将当前选中的组合发给 AI 进行重新打分和优劣势分析。

### 3. UI 界面升级 (UI)
- [x] **3.1 剧本医生诊断面板**：
  - 在生成配置弹窗的顶部或右侧，新增一个专属的“AI 结构诊断 (Script Doctor)”卡片。
  - **视觉呈现**：
    - **匹配度得分 (Match Score)**：使用醒目的进度环或颜色标识（如 90+ 绿色，70-90 黄色，70以下红色）。
    - **核心评价 (Reasoning)**：一段精炼的分析文本。
    - **优劣势对比 (Pros & Cons)**：使用清晰的列表（✅ 优势 / ⚠️ 风险）展示。
- [x] **3.2 加载状态处理**：
  - 在请求诊断数据时，展示优雅的骨架屏 (Skeleton Loading) 或呼吸灯效果，不阻塞用户的下拉框选择操作，提示“剧本医生正在诊断中...”。
