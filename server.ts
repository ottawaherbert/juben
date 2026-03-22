import express from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OMNI_BRAINS_DIR = path.join(__dirname, "OMNI_Brains");
const MOVIES_DATA_DIR = path.join(__dirname, "Movies_Data_State");

async function ensureDirs() {
  try {
    await fs.mkdir(OMNI_BRAINS_DIR, { recursive: true });
    await fs.mkdir(MOVIES_DATA_DIR, { recursive: true });
    
    // Create initial prompt if not exists
    const systemPromptPath = path.join(OMNI_BRAINS_DIR, "00_omni_system.md");
    try {
      await fs.access(systemPromptPath);
    } catch {
      await fs.writeFile(
        systemPromptPath,
        `你是 O.M.N.I. 全知制片系统的主脑。你的任务是根据用户的指令，修改当前电影项目的 JSON 状态。请返回修改后的完整项目 JSON 数据，不要包含任何其他文本或 Markdown 标记。如果用户指令不涉及修改项目，请返回原始的 JSON 数据。在创意和节拍大纲阶段，请自动提取角色、场景、道具，并加入到 assets 数组中，为每个资产提供详细的描述和 AI 绘图提示词。`
      );
    }

    const showrunnerPromptPath = path.join(OMNI_BRAINS_DIR, "01_showrunner.md");
    try {
      await fs.access(showrunnerPromptPath);
    } catch {
      await fs.writeFile(
        showrunnerPromptPath,
        `# O.M.N.I. Showrunner Persona
You are the ultimate Hollywood Showrunner. You are ruthless about quality, deeply understand story structure, character arcs, and audience psychology.
Your goal is to guide the user to create a blockbuster movie or a viral short drama.
Always prioritize "Show, Don't Tell" and Subtext.
IMPORTANT: When developing the project bible, automatically extract key characters, locations (scenes), and important props into the project's "assets" array. Provide a detailed description and an AI image generation prompt for each asset.
`
      );
    }

    const structurePromptPath = path.join(OMNI_BRAINS_DIR, "02_structure_architect.md");
    try {
      await fs.access(structurePromptPath);
    } catch {
      await fs.writeFile(
        structurePromptPath,
        `## Activate Agent 2: The Structure Architect

**Profile**:
你是深谙经典三幕剧结构、布莱克·斯奈德《救猫咪》以及麦基“价值转换”理论的世界级结构大师。你对无聊的过场戏零容忍。

**Task**:
基于 Agent 1 输出的“创意（项目圣经）”，将当前的故事段落拆解为**具体的电影场景节拍表（Beat Sheet）**。

**Specific Instructions**:
1. **自然切分**：按“时间/空间的跳跃”来切分场景，不限制场景数量，只要逻辑合理。
2. **场景价值转换（极度重要）**：每个场景必须有明确的“情节点（Plot Point）”。场景结束时，角色的处境、情绪或信息必须发生正负转换（如：+ 变 -，或 - 变 +）。
3. **如果是微短剧/短片**：强化“钩子（Hook）”，每 2 分钟必须出现一次高能反转或强烈冲突。

**Output Format (严禁废话，只列大纲)**:
**Sequence Name**: [序列名称]
- **Scene [编号]**: [INT/EXT] [地点] - [DAY/NIGHT]
  - **Action Beat**: [一两句话概括发生了什么动作]
  - **Value Shift**: [例如：从“胸有成竹(+)” 转向 “陷入陷阱(-)”]
  - **Subtext/Conflict**: [这场戏的表面冲突是什么？水下暗流是什么？]`
      );
    }

    const writerPromptPath = path.join(OMNI_BRAINS_DIR, "03_writer_director.md");
    try {
      await fs.access(writerPromptPath);
    } catch {
      await fs.writeFile(
        writerPromptPath,
        `## Activate Agent 3: The Writer-Director

**Profile**:
你是像大卫·芬奇或克里斯托弗·诺兰一样，拥有极强画面控制力兼顾剧本深度的“作者导演”。你奉行"Show, Don't Tell"。你极度厌恶说教式台词。

**Task**:
请根据 Agent 2 提供的节拍大纲，为 **[指定场景 X]** 撰写**全格式拍摄台本 (Shooting Script)**。

**Strict Guidelines (违背任何一条将终止运行)**:
1. **Format**: 严格使用标准剧本格式（Slugline, Action, Character, Dialogue）。
2. **Subtext First (潜台词优先)**：禁止角色用嘴说出真实感受（如“我爱你”、“我好害怕”、“我要复仇”）。用环境互动、尴尬的停顿、顾左右而言他来体现内心情感。对白要锋利、留白。
3. **Visual Directing**: 在 Action 描写中，必须嵌入导演视角的镜头语言。使用大写字母标出关键画面元素（如：A REVOLVER on the table），并适当加入镜头运动提示（如 \`PUSH IN:\`, \`MATCH CUT TO:\`）和音效提示（\`SFX:\`）。
4. **Pacing**: 删去所有不必要的寒暄（进场要晚，出场要早 / Enter late, leave early）。`
      );
    }
  } catch (err) {
    console.error("Error ensuring directories:", err);
  }
}

async function startServer() {
  await ensureDirs();

  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // MiniMax Proxy to solve CORS issues
  app.post("/api/proxy/minimax", async (req, res) => {
    console.log("MiniMax Proxy Call:", req.body.url);
    try {
      const { url, method, headers, body } = req.body;
      
      const filteredHeaders: any = {};
      // Copy headers and handle potential case sensitivity
      for (const [key, value] of Object.entries(headers || {})) {
        const lowerKey = key.toLowerCase();
        if (!['host', 'origin', 'referer', 'connection', 'content-length'].includes(lowerKey)) {
          filteredHeaders[key] = value;
        }
      }

      // MiniMax Anthropic-compatible endpoint often requires Authorization header instead of x-api-key
      if (filteredHeaders['x-api-key'] && !filteredHeaders['Authorization']) {
        filteredHeaders['Authorization'] = `Bearer ${filteredHeaders['x-api-key']}`;
      }

      const response = await fetch(url, {
        method: method || 'POST',
        headers: filteredHeaders,
        body: body ? JSON.stringify(body) : undefined
      });

      const data = await response.json();
      res.status(response.status).json(data);
    } catch (err: any) {
      console.error("MiniMax Proxy Error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // API Routes
  app.get("/api/projects", async (req, res) => {
    try {
      const files = await fs.readdir(MOVIES_DATA_DIR);
      const projects = [];
      for (const file of files) {
        if (file.endsWith(".json")) {
          const content = await fs.readFile(path.join(MOVIES_DATA_DIR, file), "utf-8");
          projects.push(JSON.parse(content));
        }
      }
      res.json(projects);
    } catch (err) {
      res.status(500).json({ error: "Failed to read projects" });
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      const project = req.body;
      const id = project.id || Date.now().toString();
      project.id = id;
      await fs.writeFile(
        path.join(MOVIES_DATA_DIR, `${id}.json`),
        JSON.stringify(project, null, 2)
      );
      res.json(project);
    } catch (err) {
      res.status(500).json({ error: "Failed to save project" });
    }
  });

  app.get("/api/projects/:id", async (req, res) => {
    try {
      const content = await fs.readFile(
        path.join(MOVIES_DATA_DIR, `${req.params.id}.json`),
        "utf-8"
      );
      res.json(JSON.parse(content));
    } catch (err) {
      res.status(404).json({ error: "Project not found" });
    }
  });

  app.put("/api/projects/:id", async (req, res) => {
    try {
      const project = req.body;
      await fs.writeFile(
        path.join(MOVIES_DATA_DIR, `${req.params.id}.json`),
        JSON.stringify(project, null, 2)
      );
      res.json(project);
    } catch (err) {
      res.status(500).json({ error: "Failed to update project" });
    }
  });

  app.delete("/api/projects/:id", async (req, res) => {
    try {
      await fs.unlink(path.join(MOVIES_DATA_DIR, `${req.params.id}.json`));
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete project" });
    }
  });

  app.get("/api/prompts/:name", async (req, res) => {
    try {
      const content = await fs.readFile(
        path.join(OMNI_BRAINS_DIR, `${req.params.name}.md`),
        "utf-8"
      );
      res.json({ content });
    } catch (err) {
      res.status(404).json({ error: "Prompt not found" });
    }
  });

  app.put("/api/prompts/:name", async (req, res) => {
    try {
      const { content } = req.body;
      const filePath = path.join(OMNI_BRAINS_DIR, `${req.params.name}.md`);
      
      // Backup old prompt
      try {
        const oldContent = await fs.readFile(filePath, "utf-8");
        await fs.writeFile(`${filePath}.bak`, oldContent);
      } catch (e) {
        // Ignore if no old file
      }

      await fs.writeFile(filePath, content);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to update prompt" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
