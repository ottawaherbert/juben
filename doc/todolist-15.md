# O.M.N.I. Studio 专业影视制作全流程架构审查与深度优化方案 (v5.0)

## 1. 总体评价 (Overall Assessment)

经过对当前系统核心架构（如 `useProjectStore.ts`、各页面流转逻辑及之前 Todo Lists）的深度审查，我认为 O.M.N.I. Studio 已经具备了**极高的专业影视工业化水准**。系统成功将好莱坞标准的制作流程（世界观设定 -> 节拍表 -> 剧本拆解 -> 分镜 -> 动态预演）与现代 AI 生成技术（TTS、ImageGen、VideoGen）进行了深度融合。

然而，以**顶级架构师和资深电影制片人**的视角来看，系统在“多体裁精细化适配”、“音画同步的物理约束”、“资产绝对一致性”以及部分底层状态管理上，仍存在需要优化和修补的环节。

---

## 2. 专业影视制作流程梳理 (Professional Film Production Workflow)

一个成熟的影视工业化流程必须是**环环相扣且可逆向迭代**的。以下是标准流程与我们系统的映射及审查：

1. **开发期 (Development)**
   - **核心**：Logline (一句话故事) -> Bible (人物/世界观) -> Structure (三幕剧/节拍表)。
   - **系统现状**：已实现 `Bible` 和 `Structure` 页面。
   - **审查结果**：**优秀**。引入了 `Value Charge` (价值电荷) 和 `Hook`，非常符合罗伯特·麦基《故事》的理论。
2. **前期筹备 (Pre-Production)**
   - **核心**：Script (剧本) -> Script Breakdown (剧本拆解) -> Storyboard (分镜) -> Animatics (动态预演)。
   - **系统现状**：已实现 `Script` (带场景拆解) 和 `Storyboard` (镜头列表)。
   - **审查结果**：**良好，但有断层**。剧本的“动作/对白”到分镜的“镜头语言”转化虽然有 AI 辅助，但缺乏严格的**时长估算 (Duration Estimation)**。
3. **拍摄/生成期 (Production / AI Generation)**
   - **核心**：Principal Photography (主体拍摄) -> Dailies (每日回看)。
   - **系统现状**：`ImageGen` / `VideoGen` 页面，支持多 Take。
   - **审查结果**：**存在隐患**。AI 生成的随机性极大，目前依赖 `referenceImageUrl` 垫图，但在复杂动作和多角色同框时，一致性极易崩溃。
4. **后期制作 (Post-Production)**
   - **核心**：Rough Cut (粗剪) -> Sound Design (声音设计) -> Final Mix (终混)。
   - **系统现状**：`Studio` 页面提供时间线。
   - **审查结果**：**亟待加强**。音画同步 (Lip-sync & Action-sync) 是 AI 影视的阿喀琉斯之踵，目前的时间线缺乏对齐微调工具。

---

## 3. 不同体裁的精细化制作流程审查 (Format-Specific Workflows)

电影、电视剧、短剧的底层逻辑完全不同，系统目前的 `type` 区分还不够深入。

### 🎬 电影 (Movie)
*   **专业特征**：经典的 120 页剧本，三幕剧结构（建置、冲突、解决），注重人物的深层弧光 (Character Arc)。
*   **系统现状**：目前的 `Episode` 结构对电影来说略显冗余（电影通常只有一个 Episode 或按 Act 划分）。
*   **优化方案**：当 `type === 'movie'` 时，UI 上的 "Episodes" 应自动更名为 "Acts" (幕)，并提供经典的“救猫咪 (Save the Cat)” 15 个节拍模板。

### 📺 电视剧 (TV Series)
*   **专业特征**：多集连载，拥有季线 (Season Arc)，单集内通常有 A线 (主线)、B线 (副线)、C线 (情感线) 交织。
*   **系统现状**：已支持 `storyLine` 标签。
*   **优化方案**：在 `Structure` 页面增加 **Story Grid (故事网格视图)**，横轴为集数/场景，纵轴为 A/B/C 线，直观展示多线叙事的交叉频率，防止某条线被长时间遗忘。

### 📱 短剧 (Short Drama / TikTok Series)
*   **专业特征**：竖屏 (9:16)，极速节奏（每集 1-2 分钟），**前 3 秒必须有强 Hook**，每集结尾必须有**付费卡点 (Cliffhanger)**，情绪大起大落（打脸、反转）。
*   **系统现状**：有 `Hook` 和 `Value Charge`，但缺乏针对短剧的硬性约束。
*   **优化方案**：
    1.  **全局画幅强制约束**：当 `type === 'short-drama'` 时，底层强行锁定生成画幅为 9:16，并在 UI 上提供竖屏预览框。
    2.  **付费卡点 (Paywall/Cliffhanger) 标识**：在 `Episode` 的最后一个 `Scene` 强制要求标记卡点类型（如：生死悬念、身份暴露、惊天反转）。
    3.  **高频情绪心电图**：短剧的 `Value Charge` 波动必须极其剧烈，系统应自动检测并警告“连续 2 分钟情绪无反转”的平庸剧本。

---

## 4. 系统 Bug 与不合理之处审查 (Bugs & Unreasonable Implementations)

在深入审查代码（特别是 `useProjectStore.ts` 等核心逻辑）后，发现以下问题：

### 🐛 潜在 Bug
1.  **资产删除的级联遗留 (Orphaned Assets)**：
    *   **问题**：在 `updateProject` 中，如果用户在 `Bible` 页面删除了一个 `Character`，代码并没有在 `assets` 数组中同步清理对应的 `char-${c.id}` 资产。这会导致垃圾数据堆积，甚至在生成时引用到已删除的角色。
    *   **修复方案**：在更新 characters 时，对比新旧列表，找出被删除的 character ID，并从 `assets` 数组中同步 `filter` 掉。
2.  **并发更新导致的脏写 (Race Conditions in State)**：
    *   **问题**：`updateScene` 中，如果用户快速连续修改多个字段，`localforage.setItem` 的异步写入可能导致状态被旧数据覆盖。
    *   **修复方案**：引入防抖 (Debounce) 机制，或在 Zustand 中使用更严格的不可变状态更新队列。

### ⚠️ 不合理之处 (Unreasonable Parts)
1.  **镜头时长估算缺失 (Missing Duration Estimation)**：
    *   **问题**：目前 `Shot` 的 `duration` 是手动填写的。但在实际工业中，一个包含 30 个字的对白镜头，其时长是物理固定的（约 10 秒）。如果用户给这个镜头分配了 3 秒的视频生成，会导致严重的不匹配。
    *   **优化**：引入基于文本长度的**自动时长估算算法**（中文约 4 字/秒，英文约 3 词/秒）。在生成视频前，提示用户“视频时长(3s)短于对白时长(10s)”。
2.  **生成成本失控 (Token/Credit Blindness)**：
    *   **问题**：AI 视频生成极其昂贵。用户在 `Studio` 中可能一键生成整个场景的视频，导致 API 额度瞬间耗尽。
    *   **优化**：在批量生成前，增加一个 **“制片预算评估 (Production Budget Estimate)”** 弹窗，计算总秒数和预估消耗，让用户确认。
3.  **剧本导出格式不标准 (Non-standard Export)**：
    *   **问题**：专业的编剧、导演、演员需要看标准格式的剧本，而不是 JSON 或 Markdown。
    *   **优化**：引入 `.fdx` (Final Draft) 或 `.fountain` 格式的导出功能，这是打通传统影视工业的唯一桥梁。

---

## 5. 深度优化方案与 Todo List v5.0 (执行计划)

为了将 O.M.N.I. Studio 提升至无懈可击的专业级，建议按以下步骤实施优化：

### 🛠️ 阶段一：底层逻辑与 Bug 修复 (Foundation & Bug Fixes)
- [x] **1.1 修复资产级联删除 Bug**：修改 `useProjectStore.ts`，确保删除 Character 时同步清理对应的 Asset。
- [x] **1.2 状态更新防抖**：优化 `updateScene` 和 `updateEpisode` 的高频触发逻辑，防止异步脏写。
- [x] **1.3 画幅全局锁定**：根据 Project 的 `aspectRatio`，在 ImageGen/VideoGen 的 API 调用层强制注入宽高比参数（如 `--ar 16:9` 或 `--ar 9:16`）。

### 🎬 阶段二：体裁精细化适配 (Format-Specific UI/UX)
- [x] **2.1 短剧专属工作流 (Short Drama Mode)**：
    - 新增“付费卡点 (Cliffhanger)” 标签。
    - 强化“情绪心电图”，针对短剧提供更严苛的节奏警告（如：前 3 场戏必须出现核心冲突）。
- [x] **2.2 电影/剧集术语动态切换**：当类型为 Movie 时，将 UI 上的 Episode 替换为 Act；当类型为 TV Series 时，启用 Story Grid (A/B/C线交叉视图)。

### ⏱️ 阶段三：工业化视听同步引擎 (Industrial Audio-Visual Sync)
- [x] **3.1 智能时长估算 (Smart Duration)**：在 Storyboard 中，根据绑定的 ScriptBlock (对白/动作) 自动计算并推荐 Shot 的最小 `duration`。
- [x] **3.2 预演对齐警告 (Animatics Warning)**：在 Studio 时间线中，如果视频片段的长度小于其绑定的音频轨道长度，标红显示“音画失步 (Out of Sync)”。

### 🔌 阶段四：专业格式导出 (Industry Standard Export)
- [x] **4.1 Fountain 格式导出**：编写一个转换器，将 `ScriptBlock` 数组转换为标准的 Fountain 纯文本剧本格式，支持一键下载。
- [x] ~**4.2 预算评估系统 (Budget Estimator)**：在点击“生成场景视频”前，弹窗显示预估的 Token/时长消耗。（用户取消）~

---
**请确认以上审查结果与优化方案。确认后，我们可以开始逐一修复 Bug 并实施这些专业级的架构升级。**
