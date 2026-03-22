# 代码重构与架构优化任务清单 (Todolist-26) - V2

## 1. 目标
通过组件拆分、逻辑提取、配置解耦及 Store 切片化，解决核心页面文件过大（>500行）及耦合度高的问题，建立一套标准化的、可扩展的影视工业化前端架构。

## 2. 核心任务

### 2.1 数据、配置与常量解耦 (第一阶段)
- [x] **类型定义提取**：将 `useProjectStore.ts` 中的所有 `interface` 和 `type` 移动到 `src/types/project.ts`。
- [x] **常量中心化**：建立 `src/constants/index.ts`，统一管理景别 (ShotSize)、运镜 (CameraMovement)、价值转换 (ValueCharge)、资产类型 (AssetType) 等枚举值。
- [x] **Prompt 模板解耦**：将 `usePromptStore.ts` 中的 `defaultTemplates` 移动到 `src/config/prompts.ts`。
- [x] **AI 解析工具提取**：将散落在各处的 AI 返回值正则匹配、JSON 容错解析逻辑提取到 `src/utils/aiParser.ts`。
- [x] **页面逻辑初步优化**：更新 `Script.tsx`, `Episodes.tsx`, `Bible.tsx`, `Studio.tsx`, `Storyboard.tsx` 以使用新的常量、类型和工具函数。

### 2.2 Store 架构升级 (第二阶段)
- [x] **Store 切片化 (Slicing)**：重构 `useProjectStore.ts`，利用 Zustand 的 `slices` 模式将状态按业务逻辑拆分：
  - `projectSlice.ts`: 核心项目元数据、立项逻辑。
  - `episodeSlice.ts`: 分集/段落管理、结构生成逻辑。
- [x] **持久化逻辑优化**：将 `getItemRestored` 和 `setItemNow` 提取到 `src/utils/storage.ts`。

### 2.3 UI 组件化与原子化 (第三阶段)
按优先级对以下页面进行组件提取，目标是使 Page 文件保持在 300 行以内：

#### 基础 UI 原子组件 (Atomic UI)
- [x] 在 `src/components/ui/` 下建立通用组件库：`Button.tsx`, `Input.tsx`, `Badge.tsx`, `Card.tsx`, `Modal.tsx` 等，统一 Tailwind 样式。

#### 业务组件拆分
- [x] **Script 页面**: 提取 `ScriptBlockItem.tsx`, `ScriptEditor.tsx`, `AssetExtractionPanel.tsx`, `ScriptOptionsModal.tsx`, `SceneSidebar.tsx`。
- [x] **Episodes 页面**: 提取 `EpisodeSidebar.tsx`, `EpisodeDetailEditor.tsx`, `GenerateEpisodesModal.tsx`。
- [x] **Bible 页面**: 提取 `CharacterCard.tsx`, `AssetCard.tsx`, `CoreConcept.tsx` (原 ProjectOverview), `CreativeVisionEditor.tsx`, `CharacterList.tsx`, `AssetList.tsx`。
- [x] **Studio 页面**: 提取 `StudioPreview.tsx`, `StudioShotControls.tsx`, `StudioAudioControls.tsx`, `StudioAssetList.tsx`。
- [x] **Storyboard & Structure 页面**: 提取 `ShotCard.tsx`, `SceneCard.tsx` 及相关的 Header 组件。

### 2.4 逻辑提取与 Hooks 封装 (第四阶段)
- [x] **AI 业务逻辑封装**：将复杂的 AI 请求构建和多步处理逻辑提取为自定义 Hooks：
  - [x] `useScriptAI.ts`
  - [x] `useBibleAI.ts`
  - [x] `useStudioAI.ts`
  - [x] `useStoryboardAI.ts`
  - [x] `useStructureAI.ts`
- [x] **通用交互 Hooks**：
  - [x] `useDragAndDrop.ts`
  - [x] `useAudioPlayer.ts`
  - [x] `usePlayback.ts`

## 3. 实施准则
- **渐进式重构**：每次提交仅针对一个模块或一个阶段，确保系统始终处于可运行状态。
- **保持功能对等**：重构过程中不增加新功能，仅改变代码结构。
- **严禁 Mock**：重构必须保留现有的真实 API 集成（如 Gemini, Imagen 等）。
- **验证**：每完成一个组件的拆分，必须进行 `lint` 和 `compile` 检查。

## 4. 架构演进建议
- **样式规范化**：在 `tailwind.config.js` 中定义品牌色和阴影规范，减少硬编码。
- **错误边界细化**：为拆分出的核心组件（如 `ScriptEditor`）添加局部的 `ErrorBoundary`。
