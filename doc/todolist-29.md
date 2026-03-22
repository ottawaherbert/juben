# 资产流动与逻辑深度梳理报告 (Asset Flow & Logic Deep Dive) - doc/todolist-29.md

## 1. 核心问题诊断 (Core Issues Diagnosis)

经过对系统全流程（Bible -> Script -> Breakdown -> Studio -> Assets）的深度代码审查，发现当前资产（角色、场景、道具）的流转存在严重的**数据结构割裂**和**引用错位**问题。这导致了剧本无法正确关联角色、拆解数据无法联动、摄影棚无法获取资产特征等一系列连锁反应。

### 1.1 数据源的“双重标准”与冲突
*   **现象**：`Bible.tsx` 维护了一个富文本的 `characters` 数组（包含心理侧写、渴望等）；而 `Assets.tsx`（资产扫描页）在扫描剧本时，会将角色同时作为通用 `Asset` 存入 `assets` 数组，并试图同步到 `characters` 数组。
*   **后果**：系统中存在两套角色数据。`LinkAssetModal`（手动关联弹窗）**只搜索 `assets` 数组**，完全无视了 `Bible` 中精心创建的 `characters`。这导致用户在剧本页无法手动关联到 Bible 中的核心角色。

### 1.2 自动关联逻辑的错位 (useStoryboardAI.ts)
*   **现象**：在生成分镜（Shot）时，系统试图将剧本中已关联的角色传递给 AI。代码逻辑是：从剧本块中提取 `linkedAssetId`，然后**去 `assets` 数组中查找这些 ID**。
*   **后果**：因为剧本的自动解析（`useScriptAI.ts`）是将角色关联到 `characters` 数组的 ID，所以在 `assets` 数组中永远找不到这些角色。导致传递给摄影棚 AI 的 `characterPrompt` 永远为空，Studio 完全不知道镜头里有谁。

### 1.3 剧本拆解（Breakdown）的“死数据”
*   **现象**：`ScriptBreakdown` 接口中，`characters`、`props`、`location` 存储的是**纯字符串数组**（如 `["张三", "李四"]`），而不是资产 ID。
*   **后果**：这破坏了“数据联动性”。如果 Bible 中角色改名，拆解表不会更新；同时，Studio 也无法通过拆解表反查角色的参考图或详细设定。

### 1.4 视觉一致性（Visual Consistency）的断层
*   **现象**：即使 Studio 成功获取了 `characterIdsInShot`，在调用 `generateAIImage` 生成镜头画面时，并没有将这些角色的 `referenceImageUrl`（参考图）或详细外貌描述传递给生图大模型。
*   **后果**：角色在不同镜头中必然“变脸”，完全依赖 AI 对名字的随机想象。

---

## 2. 彻底重构方案 (Comprehensive Solution Plan)

为了实现真正的工业化数据联动，必须确立**“Single Source of Truth（单一数据源）”**原则，并贯穿全流程。

### 阶段一：统一数据源与关联入口 (Data & Linking Unification)
1.  **明确职责边界**：
    *   `currentProject.characters` 专属存储所有角色（Character）。
    *   `currentProject.assets` 专属存储场景（Location）和道具（Prop）。**严禁**将角色混入 `assets` 数组。
2.  **修复 Assets.tsx 扫描逻辑**：
    *   解析剧本后，如果是 `character`，只存入 `characters` 数组；如果是 `location/prop`，只存入 `assets` 数组。
3.  **重构 LinkAssetModal.tsx**：
    *   修改搜索逻辑，使其同时在 `characters` 和 `assets` 数组中进行联合搜索。
    *   UI 上区分显示“角色”、“场景”、“道具”的图标和标签。

### 阶段二：打通剧本到摄影棚的血脉 (Script to Studio Pipeline)
1.  **修复 useStoryboardAI.ts**：
    *   在构建 `characterPrompt` 时，必须去 `currentProject.characters` 中根据 ID 查找角色，而不是去 `assets` 中查找。
    *   保留从 `assets` 中查找场景和道具的逻辑。
2.  **升级 ScriptBreakdown 数据结构**：
    *   将 `ScriptBreakdown` 的类型从 `string[]` 升级为 `string[]` (存储 ID)。
    *   修改 `useScriptAI.ts` 中的拆解 Prompt，要求 AI 在返回拆解数据时，尽量匹配现有资产的名称，并在前端解析时将其转换为对应的 ID。

### 阶段三：视觉一致性增强 (Visual Consistency Enforcement)
1.  **丰富 Shot 数据结构**：
    *   确保 `Shot` 接口正确保存 `characterIdsInShot`、`locationId`、`propIds`。
2.  **强化生图 Prompt (StudioPreview.tsx / useStudioAI)**：
    *   在生成镜头图像/视频时，拦截生图请求。
    *   根据 `shot.characterIdsInShot`，提取对应角色的外貌描述（或参考图 URL，如果底层生图 API 支持 Image Prompt/LoRA）。
    *   将这些特征强制拼接到 `imagePrompt` 的前缀中，例如：“[Character: 张三, wearing red jacket, short hair] + [原始镜头描述]”。

---

## 3. 任务执行清单 (Execution Checklist)

| 任务 ID | 任务名称 | 影响文件 | 状态 |
| :--- | :--- | :--- | :--- |
| 29.1 | 修复 LinkAssetModal 联合搜索 | `LinkAssetModal.tsx` | 已完成 |
| 29.2 | 修复 Assets.tsx 资产分类存储 | `Assets.tsx` | 已完成 |
| 29.3 | 修复 useStoryboardAI 角色查找逻辑 | `useStoryboardAI.ts` | 已完成 |
| 29.4 | 升级 ScriptBreakdown 存储 ID | `project.ts`, `useScriptAI.ts`, `Breakdown.tsx` | 已完成 |
| 29.5 | 强化 Studio 生图 Prompt 拼接 | `useStudioAI.ts`, `StudioMultiGridControls.tsx`, `Studio.tsx`, `StudioShotControls.tsx` | 已完成 |

**请确认以上分析与方案。确认后，我将严格按照此清单逐一修改代码，彻底修复资产流动的断层问题。**
