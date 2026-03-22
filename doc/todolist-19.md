# Todo List 19: Refining Scene & Asset Logic

## 目标 (Objectives)
解决用户在生成节拍、分镜和资产提取过程中遇到的功能缺失、UI 显示问题以及逻辑定义偏差。

## 发现的问题 (Identified Issues)
1. **删除功能缺失**: 生成的节拍（场景）和导演分镜模块的分镜缺乏删除按钮。
2. **UI 显示不全**: 节拍卡片高度受限，导致内容（特别是生成剧本后的详细描述和拆解）显示不全，被截断。
3. **重新生成逻辑错误**: 重新生成节拍（场景）和段落（剧集）时，新生成的内容被追加（append）到了原有列表后面，而不是替换（replace）原有内容。
4. **资产定义偏差**: AI 提取的“资产”包含了动作（如急促的呼吸声）、短暂视觉/听觉效果（如闪烁的红光）和抽象氛围（如刺骨的阴风）。在影视制作中，资产应严格限定为核心场景、关键道具、特殊服装或化妆等实体元素。

## 解决方案与执行状态 (Solutions & Status)

### 1. 删除功能 (Delete Functionality)
- [x] **节拍（场景）删除**: 在 `Structure.tsx` 的场景卡片头部添加了删除按钮（Trash2 图标），点击后弹出确认框，确认后从当前 episode 中移除该 scene。
- [x] **分镜删除**: 在 `Storyboard.tsx` 的分镜卡片右上角添加了悬浮显示的删除按钮（Trash2 图标），点击后弹出确认框，确认后从当前 scene 中移除该 shot。

### 2. 节拍卡片 UI 优化 (Beat Card UI Improvement)
- [x] **内容区滚动**: 将 `Structure.tsx` 中场景卡片的内容区域（包含目标、资产、描述、拆解等）设置为 `overflow-y-auto custom-scrollbar`，允许在内容过多时内部滚动。
- [x] **防止元素挤压**: 为 `textarea` 设置了 `min-h-[150px]`，并为其他信息块（如目标、资产、预计时长、场景拆解等）添加了 `shrink-0`，确保它们在卡片高度受限时不会被过度挤压变形。

### 3. 重新生成逻辑修正 (Regeneration Logic Fix)
- [x] **节拍（场景）替换**: 修改了 `Structure.tsx` 中的 `handleSelectOption`，当用户选择 AI 生成的节拍方案时，不再将新场景追加到旧场景后面，而是直接替换（覆盖）当前 episode 的 `scenes` 列表。
- [x] **段落（剧集）替换**: 修改了 `Episodes.tsx` 中的 `handleSelectOption`，当用户选择 AI 生成的段落方案时，先从 `localforage` 中移除旧的 episodes，然后用新生成的 episodes 替换整个项目的 `episodes` 列表。

### 4. 资产定义修正 (Asset Definition Refinement)
- [x] **更新 Prompt 模板**: 修改了 `src/store/usePromptStore.ts` 中的 `generateScenes` 和 `regenerateScene` 模板。
- [x] **明确资产范围**: 在 `sceneAssets` 的指令中明确指出：“在影视制作中，资产(Assets)特指：核心场景(如废弃工厂、主角卧室)、关键道具(如带血的匕首、神秘日记本)、特殊服装或化妆(如破损的警服、僵尸妆)。”
- [x] **设置负面约束**: 明确禁止包含：“动作(如急促的呼吸声、愤怒的嘶吼)、短暂的视觉/听觉效果(如闪烁的红光、飞溅的石块)、抽象的氛围(如刺骨的阴风)。”

## 结论 (Conclusion)
已全面修复用户反馈的节拍/分镜删除、卡片显示、重新生成逻辑以及资产定义问题。系统现在能够更准确地提取影视制作所需的实体资产，并且在生成和编辑流程上更加符合用户的直觉和操作习惯。
