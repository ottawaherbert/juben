# O.M.N.I. Studio 核心架构审查与优化方案 (专业影视工业化全流程升级)

## 1. 专业影视制作流程梳理 (Professional Film Production Workflow)

作为一名拥有丰富经验的影视架构师，我首先将好莱坞及现代流媒体（Netflix, TikTok 短剧等）的专业制作流程进行拆解，以此作为审查我们系统的“金标准”：

1. **开发期 (Development)**
   - **概念与一句话故事 (Logline)**：确立核心冲突与卖点。
   - **世界观与人物圣经 (Bible)**：角色内在渴望、外在目标、致命弱点，以及核心场景的美术设定。
   - **故事大纲与节拍表 (Synopsis & Beat Sheet)**：确立三幕剧结构、美剧的季/集弧光 (Season/Episode Arc)，或短剧的极速反转结构。
2. **前期筹备 (Pre-Production)**
   - **分场大纲与剧本创作 (Scene-by-Scene & Screenwriting)**：动作描写 (Action)、对白 (Dialogue)、潜台词设计。
   - **剧本拆解 (Script Breakdown)**：按场景提取角色、道具、场景、特效 (VFX)、音效 (SFX)，为制片和拍摄做准备。
   - **分镜脚本与镜头列表 (Storyboard & Shot List)**：将文字转化为视觉语言，确定景别 (Shot Size)、机位角度 (Camera Angle)、运动轨迹 (Camera Movement)。
   - **动态预演 (Animatics / Pre-viz)**：将静态分镜配上粗略的配音和音效，在正式拍摄前验证剪辑节奏。
3. **拍摄/生成期 (Production / AI Generation)**
   - **主体拍摄 (Principal Photography)**：在 AI 工作流中，即为基于资产库 (Assets) 锁定角色和场景特征，进行 Image/Video 的批量生成。
   - **每日回看 (Dailies Review)**：筛选合格的素材 (Takes)。
4. **后期制作 (Post-Production)**
   - **粗剪与精剪 (Rough Cut & Fine Cut)**：画面拼接，验证叙事流畅度。
   - **声音设计与配乐 (Sound Design & BGM)**：铺设环境音、动效、情绪配乐。
   - **调色与特效合成 (Color Grading & VFX)**：统一视觉风格。
   - **最终混音与导出 (Final Mix & Export)**：输出成片或工程文件 (EDL/XML) 交由专业软件精修。

---

## 2. 当前系统审查与诊断 (System Review & Diagnosis)

仔细审阅了 O.M.N.I. Studio 的代码架构（如 `useProjectStore.ts` 及各页面流转逻辑）和之前的 Todo Lists，我得出以下诊断：

### 🌟 优势 (Strengths)
1. **全链路雏形已具备**：从 Bible (世界观) -> Structure (结构) -> Script (剧本) -> Storyboard (分镜) -> Studio (后期)，完整覆盖了影视制作的生命周期。
2. **专业概念落地**：引入了 `Value Charge` (价值电荷)、`Script Breakdown` (剧本拆解)、`Shot Size/Camera Angle` (镜头语言) 等极具专业深度的字段，远超普通的“一键生成视频”玩具。
3. **非线性与结构诊断**：支持拖拽重排、上下文感知的局部重写，以及刚引入的“剧本医生结构诊断”，这些都是极具前瞻性的架构设计。

### ⚠️ 痛点与缺失 (Weaknesses & Gaps)
1. **断层问题：剧本到分镜的“翻译”不够自动化**
   - **现状**：Script 页面生成了详细的 Action 和 Dialogue，但 Storyboard 页面似乎需要用户手动去构思每一个 Shot。
   - **问题**：缺乏一个将“文字动作”自动翻译为“视听语言（镜头列表）”的 AI 引擎。专业导演在看剧本时脑海中会自动切分镜头，系统目前缺少这一环。
2. **一致性危机：资产与生成的弱绑定**
   - **现状**：虽然有 Assets 库，但在生成 Shot 的 Image/Video 时，如何确保“张三”在第 1 场和第 10 场长得一样？
   - **问题**：底层缺乏对 `characterIdsInShot` 和 `locationId` 的强制 Prompt 注入和垫图 (Reference Image) 机制，极易导致 AI 生成的视频“不接戏”。
3. **体裁差异化不足：电影 vs 美剧 vs 短剧**
   - **现状**：Project 虽然区分了 `type`，但底层的数据结构和工作流差异不大。
   - **问题**：
     - **短剧 (Short Drama)**：生命线在于“钩子 (Hook)”和极高频的情绪反转。目前的 `Scene` 虽有 `hook`，但缺乏针对短剧“每 30 秒一个爆点”的全局心电图式监控。
     - **剧集 (TV Series)**：缺乏 A线/B线/C线 多线叙事的交叉追踪 (Story Grid)。
4. **工业化接口缺失：孤岛效应**
   - **现状**：系统是一个闭环，但专业影视制作往往需要多软件协作。
   - **问题**：无法导出标准剧本格式 (Final Draft/Fountain)，也无法将 Studio 的时间线导出为 Premiere/DaVinci 可读的 XML/EDL。
5. **动态预演 (Animatics) 的缺失**
   - **现状**：直接从静态分镜跳到昂贵的视频生成。
   - **问题**：在好莱坞，正式拍摄前一定会做 Animatics。系统应该允许用户在 Storyboard 阶段“播放”带 TTS 配音的静态分镜PPT，以极低成本验证节奏。

---

## 3. 深度优化方案与 Todo List v4.0 (专业影视工业化全流程升级)

基于上述诊断，我制定了以下优化方案，旨在将 O.M.N.I. Studio 彻底打造成专业级的 AI 影视工业引擎：

### 🎬 优化项一：AI 镜头拆解引擎 (Automated Shot Listing)
*目标：打通 Script 与 Storyboard 的断层，实现“文字到视听”的智能翻译。*
- [x] **1.1 镜头拆解算法**：在 Storyboard 页面新增“一键生成镜头列表 (Generate Shot List)”功能。
- [x] **1.2 视听语言映射**：AI 读取 Scene 的 `scriptBlocks` 和 `breakdown`，自动将长段的 Action 拆分为多个 `Shot`。
- [x] **1.3 智能参数填充**：AI 自动为每个 Shot 分配 `shotSize` (如对话多用 MCU/CU，环境交代用 EWS)、`cameraAngle`、`cameraMovement`，并自动提取该镜头中出现的 `characterIdsInShot`。

### 🎭 优化项二：视觉连贯性强制约束 (Continuity & Consistency Enforcement)
*目标：彻底解决 AI 视频生成的“不接戏”痛点，实现角色/场景的强绑定。*
- [x] **2.1 底层 Prompt 拦截与注入**：在调用 ImageGen/VideoGen 时，系统底层拦截请求。
- [x] **2.2 资产特征融合**：遍历当前 Shot 的 `characterIdsInShot` 和 `locationId`，自动将对应 Asset 的 `prompt` (外貌特征/服装) 和 `imageUrl` (作为 ControlNet/Reference Image) 隐式注入到生成请求中。
- [x] **2.3 资产锁定提示**：在 UI 上，当一个 Shot 绑定了特定角色时，显示“🔒 资产已锁定”的视觉标识。

### ⏱️ 优化项三：动态预演系统 (Animatics & Pre-viz)
*目标：在消耗大量 Token 生成视频前，提供极低成本的节奏验证手段。*
- [x] **3.1 动态分镜播放器**：在 Storyboard 页面新增“播放预演 (Play Animatics)”模式。
- [x] **3.2 自动 TTS 轨道铺设**：读取该场景的 Dialogue blocks，自动生成临时 TTS 语音。
- [x] **3.3 节奏粗剪**：按照设定的 `duration` 轮播分镜草图，同步播放 TTS，允许用户在播放时实时调整每个镜头的时长，提前锁定剪辑节奏。

### 📈 优化项四：针对“短剧”与“剧集”的专属工作流强化 (Format-Specific Workflows)
*目标：尊重不同体裁的创作规律，提供专属的分析工具。*
- [x] **4.1 短剧：情绪心电图 (Emotional Pacing Monitor)**：
  - 在 Structure 页面顶部新增一个折线图。
  - 提取每个 Scene 的 `valueCharge` (正/负/中立) 和 `hook` 强度，绘制出整集的情绪起伏曲线。
  - **诊断警告**：如果连续 3 个场景没有出现负向转折或高强度 Hook，系统标红警告“节奏过平，存在流失风险”。
- [x] **4.2 剧集：多线叙事网格 (Story Grid)**：
  - 允许为 Scene 打上 `A-Story`, `B-Story`, `C-Story` 的标签。
  - 提供一个矩阵视图，直观展示各条故事线在不同集数中的交织与推进情况。

### 🔌 优化项五：好莱坞工业标准导出 (Industry Standard Export)
*目标：打破系统孤岛，与传统影视工业软件无缝对接。*
- [x] **5.1 剧本导出**：支持将 Script 导出为 `.fdx` (Final Draft 格式) 或 `.fountain` (纯文本标记语言)，供专业编剧修改。
- [x] **5.2 剪辑工程导出**：在 Studio 页面新增“导出 XML/EDL”功能。将时间线上的视频片段、音频轨道的时间码 (Timecode) 导出，用户可直接导入 Premiere Pro 或 DaVinci Resolve 进行最终精修。

### 🩺 优化项六：剧本医生 2.0 (微观台词与动作诊断)
*目标：从宏观结构深入到微观的文本质量把控。*
- [x] **6.1 Show, Don't Tell 检测**：在 Script 页面，AI 扫描当前场景，如果发现角色在用大段台词解释背景设定 (Exposition)，高亮提示并建议修改为动作展示。
- [x] **6.2 潜台词分析 (Subtext Analysis)**：选中一段对白，AI 分析其“表面意思 (Text)”与“真实意图 (Subtext)”，帮助创作者写出更具张力、不那么“直白”的高级台词。

---
**请确认以上审查结果与优化方案。确认后，我们可以按照此 Todo List 逐步实施架构升级。**
