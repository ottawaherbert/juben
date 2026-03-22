# O.M.N.I. Studio 核心架构升级 Todo List v2.0 (好莱坞工业标准版)

## 评估总结
架构师提出的优化建议直击当前 AI 文本生成工具的痛点。为了确保开发落地时具备**绝对的可量化性**和**工程严谨性**，本 Todo List 拒绝使用“等”这类模糊字眼，所有优化项均已细化为具体的数据结构、确切的交互逻辑和强约束的 Prompt 规则。

## 待办事项列表

### 1. 优化项一：实现“非线性节点编辑”与上下文感知重生成
*目标：打破线性生成限制，实现类似非编软件（NLE）的块状操作体验。*

- [x] **1.1 状态管理扩展 (Store)**：
  - 在 `useProjectStore` 中新增 `reorderEpisodes(startIndex: number, endIndex: number)` 方法。
  - 在 `useProjectStore` 中新增 `reorderScenes(episodeId: string, startIndex: number, endIndex: number)` 方法。
- [x] **1.2 拖拽交互 (UI)**：
  - 引入 `@hello-pangea/dnd` 库。
  - 在 `Episodes.tsx` 的左侧边栏实现 Episode 列表的拖拽排序。
  - 在 `Structure.tsx` 的列表中实现 Scene 的拖拽排序。
- [x] **1.3 局部重写逻辑量化 (Prompting)**：
  - 修改 `regenerateEpisode` 和 `regenerateScene` 的 Prompt 模板。
  - **精准上下文提取**：在发起重写请求时，系统必须自动提取目标节点的前 **1** 个节点和后 **1** 个节点的 `title` 与 `inspiration/description`。
  - **注入变量**：将提取的内容作为 `{{previousContext}}` 和 `{{nextContext}}` 注入 Prompt。
  - **强指令**：“你正在重写中间的节点。请严格基于 `previousContext` 的结尾进行承接，并确保你的输出能够与 `nextContext` 的开头无缝咬合，绝对不要改变前后节点的既定事实。”

### 2. 优化项二：重构提示词拼接逻辑（消除数字幻觉）
- [x] **已完成**：已在底层 `BeatTemplate` 接口引入 `fixedCount` 属性，UI 层已实现输入框的自动禁用与变量强绑定，彻底消除了“既要 8 段落，又要生成 10 个”的数学逻辑冲突。

### 3. 优化项三：完善“剧本拆解 (Script Breakdown)”引擎
*目标：为未来的“一键分镜/视频生成”建立结构化的底层资产库。*

- [x] **3.1 数据结构严格定义**：
  - 在 `useProjectStore.ts` 中新增 `ScriptBreakdown` 接口，并在 `Scene` 接口中增加 `breakdown?: ScriptBreakdown` 字段。必须严格包含以下确切字段，不可随意扩展：
    ```typescript
    export interface ScriptBreakdown {
      setting: "INT." | "EXT." | "INT./EXT."; // 内景/外景/内外景
      location: string; // 具体发生地 (如：破旧的廉价公寓)
      time: "DAY" | "NIGHT" | "DAWN" | "DUSK" | "CONTINUOUS"; // 拍摄时间
      characters: string[]; // 出场角色名称的字符串数组
      props: string[]; // 核心关键道具的字符串数组
      vfx?: string[]; // 视觉特效需求 (如：窗外飞过的全息投影)
      sfx?: string[]; // 关键音效需求 (如：沉重的敲门声)
    }
    ```
- [x] **3.2 Schema 强约束生成**：
  - 修改 `generateScript` 的 AI 调用逻辑，在 `@google/genai` 的 `responseSchema` 中，强制要求 AI 在返回剧本 Block 的同时，必须按上述 `ScriptBreakdown` 接口返回一个 `breakdown` 对象。
- [x] **3.3 UI 资产面板**：
  - 在剧本编辑器 (Script Editor) 的侧边栏或顶部，新增“本场资产 (Assets Breakdown)”面板。
  - 以 Tag 或列表的形式，直观、结构化地展示上述 7 个字段的内容，并允许用户手动微调。

### 4. 优化项四：逼迫 AI 践行“视听语言” (Show, Don't Tell)
*目标：消除 AI 默认的“广播剧”式对白泛滥，强制输出具备镜头感的动作描写。*

- [x] **4.1 Prompt 比例硬性约束**：
  - 在 `generateScript` 的模板中加入绝对指令：“你正在撰写电影剧本，而非话剧。**禁止连续出现超过 3 句 dialogue (对白)。在每 3 个 dialogue block 之间，必须强制插入至少 1 个 action block**，用于描写角色的微表情、肢体动作、空间走位或环境变化。”
- [x] **4.2 镜头语言结构化提取**：
  - 针对 `action` 类型的 `ScriptBlock`，Prompt 中需增加指令：“对于关键的动作描写，请务必在 JSON 的 `camera` 字段中填入对应的镜头语言（如：特写、推镜头、全景、手持跟拍）。”
  - 确保生成的 JSON 中，`camera` 字段被高频且准确地填充，这将作为未来调用视频生成模型（如 Veo）时极其关键的 Prompt 抓手。
