# O.M.N.I. 系统底层架构与专业化重构 (To-Do List 7)

基于对当前系统架构（特别是 `useProjectStore.ts` 数据模型）和影视工业化标准制作流程的深度审查，我们发现了几个核心的逻辑冲突和性能隐患。为了支撑未来微短剧（百集规模）和复杂电影的制作，必须进行以下深度重构。

请确认以下优化任务的优先级，确认后我们将逐一实现：

## 第一阶段：核心数据模型重构 (Data Model Refactoring) - 优先级：最高

- [x] **Task 1: 概念解耦 - 修复 Scene 与 Location 的语义混淆**
  - **问题**：目前 `Scene` 代表叙事节拍，而 `Asset` 中的 `type: "scene"` 代表美术场地，导致 AI 无法准确绑定场地资产。
  - **方案**：将 `Asset` 接口中的 `"scene"` 彻底更名为 `"location"` 或 `"environment"`。在剧本数据结构中，`Scene Heading` 必须显式包含 `locationId`，强绑定到资产库。
- [x] **Task 2: 视听解耦 - 重构音视频时间轴数据模型**
  - **问题**：目前 `Shot` 强绑定了 `voiceover`, `bgmUrl`, `sfxUrl`，这违背了真实的非编（NLE）逻辑，无法实现 J-cut/L-cut 等声音跨镜头剪辑。
  - **方案**：`Shot` 只负责视觉（画面、时长、转场）。新增独立的 `AudioTrack` 或 `DialogueClip` 数组，通过全局的 `startTime` 和 `duration` 在 Timeline 上与画面对齐，彻底实现音画分离。
- [x] **Task 3: 视听语言结构化 - 丰富分镜 Prompt 维度**
  - **问题**：`Shot` 只有纯文本的 `imagePrompt` 和 `videoPrompt`，缺乏导演思维，难以系统化管理和修改景别、运镜。
  - **方案**：结构化拆分 `Shot`，新增 `shotSize` (景别: CU, MCU, Wide), `cameraAngle` (机位: High, Low), `cameraMovement` (运镜: Pan, Track)，便于 UI 下拉选择和 AI 视频模型参数映射。

## 第二阶段：工作流逻辑完善 (Workflow Logic) - 优先级：高

- [x] **Task 4: 引入“资产锁定 (Asset Lock)”机制 (Casting & Scouting)**
  - **问题**：目前剧本到分镜缺乏“资产确认”环节，导致 AI 生成的分镜角色和场景前后不一致（Consistency 灾难）。
  - **方案**：在工作流中强制加入“资产锁定”状态。只有当剧本中提取出的所有角色和场地都生成了 Reference Image 并被用户 Confirm 后，才能解锁 Storyboard 的生成。分镜 Prompt 必须强依赖这些锁定的 Reference（如 `--cref`, `--sref`）。
- [x] **Task 5: 引入长篇幅内容的“宏观骨架” (Macro-Structure)**
  - **问题**：微短剧动辄 80-100 集，缺乏宏观骨架会导致 AI 生成到中后期彻底忘记前期伏笔，剧情崩塌。
  - **方案**：在 `Project` 中引入 `SeasonOutline` 或 `Arcs`（篇章/卷宗）数组。微短剧按“卷”管理（如：隐忍篇 1-20集）。AI 生成单集剧本时，必须将“当前篇章的宏观目标”作为 System Prompt 注入。

## 第三阶段：性能与状态管理优化 (Performance & State) - 优先级：高

- [ ] **Task 6: 状态扁平化与按需加载**
  - **问题**：`useProjectStore` 将所有数据（Project Meta, Episodes, Scenes, Shots, Assets）塞在一个巨大的 JSON 树里。百集微短剧会导致严重的 React 重新渲染卡顿和内存溢出。
  - **方案**：状态扁平化拆分。Project Meta、Assets 放在全局 Store；Episodes 和 Shots 应该按需加载（通过 Episode ID 独立获取和更新），避免深层更新引发全局渲染。
- [ ] **Task 7: 彻底迁移至 IndexedDB**
  - **问题**：依赖 `localStorage` 极易触发 5MB 限制，导致包含大量 Base64 图片的资产和分镜数据丢失。
  - **方案**：使用 `localforage` 或 `idb` 替换现有的持久化方案，支持大规模媒体资产的本地缓存。

---
*等待您的确认。如果您对上述重构计划的方向和优先级满意，请告诉我从哪一个 Task 开始动手！*
