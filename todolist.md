# Studio O.M.N.I. (全知好莱坞制片系统) - 开发 Todo List

## 第一阶段：基础架构与目录初始化 (Foundation & Structure)
- [ ] 初始化项目基础目录结构 (`/OMNI_Brains`, `/Movies_Data_State`)
- [ ] 配置全栈环境 (Express + Vite + React)
- [ ] 设计并实现底层 JSON 状态机 (State Machine) 用于管理电影项目数据
- [ ] 搭建全局 UI 框架 (侧边栏导航、主脑视窗、四大工作站路由)

## 第二阶段：核心工作站 UI 开发 (Workstations UI)
- [ ] **起点：灵感注入端**
  - [ ] 实现一句话灵感/小说章节输入框
  - [ ] 电影/微短剧类型选择与一键立项功能
- [ ] **工作站 1：开发会议室 (Project Bible)**
  - [ ] 资料卡看板 UI (Logline, 核心冲突, 角色设定)
  - [ ] 支持内容编辑与状态同步
- [ ] **工作站 2：结构白板 (Structure Whiteboard)**
  - [ ] 电影级大纲看板 (Kanban) UI
  - [ ] 场景卡片拖拽与编辑
  - [ ] 价值转换 (Value Charge) 标红警告逻辑
- [ ] **工作站 3：打字机视窗 (Typewriter Window)**
  - [ ] 左侧场景列表，右侧好莱坞剧本格式排版 UI
  - [ ] 局部台词框选与重写交互 UI
- [ ] **工作站 4：视觉分镜室 (Storyboard Gallery)**
  - [ ] 分镜墙 UI 展示
  - [ ] 提示词 (Prompt) 提取与展示 (包含 `--cref`, `--ar` 等参数)

## 第三阶段：O.M.N.I. 主脑引擎集成 (O.M.N.I. Engines)
- [ ] **意图与 UI 穿透引擎**
  - [ ] 右下角“主脑视窗”聊天 UI
  - [ ] 接入 Gemini API 处理自然语言指令
  - [ ] 实现指令解析并直接触发前端 State 更新 (UI 实时刷新)
- [ ] **大脑基因自我进化引擎**
  - [ ] 在 `/OMNI_Brains` 中创建初始 Agent Prompt 文件 (如 `01_showrunner.md`)
  - [ ] 实现读取和应用这些 Prompt 的逻辑
- [ ] **绿灯评估与全自动制片引擎 (基础版)**
  - [ ] 模拟内部试映评估逻辑 (调用 AI 对剧本进行评价)

## 第四阶段：联调与优化 (Integration & Polish)
- [ ] 完善全局状态管理 (React Context)
- [ ] 优化 UI 细节 (Tailwind CSS, 动画效果)
- [ ] 确保前后端数据交互顺畅
- [ ] 最终测试与 Bug 修复
