import React, { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { MessageSquare, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { useProjectStore } from "../store/useProjectStore";
import { Type } from "@google/genai";
import { generateAIContent } from "../services/ai";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function OmniChat() {
  const { currentProject, activeEpisodeId, updateProject } = useProjectStore();
  const location = useLocation();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "老板，我是您的全栈制片人。请下达指令，我会直接修改项目数据和 UI。",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setIsLoading(true);

    try {
      const userLang = navigator.language || 'zh-CN';
      const langName = userLang.startsWith('zh') ? '中文' : 'English';

      let systemInstruction =
        `【角色设定】\n你是全球顶级的、拥有最强大脑的 O.M.N.I. 全知制片系统主脑。你的任务是协助用户创作影视项目。请始终返回 JSON 格式。JSON 必须包含两个字段：\`reply\`（你对用户说的自然语言回复，可以打招呼、解答问题或说明你修改了什么）和 \`updatedProject\`（完整的项目 JSON 数据）。如果用户指令不涉及修改项目，\`updatedProject\` 请保持与当前状态一致。在创意和节拍大纲阶段，请自动提取角色、场景、道具，并加入到 assets 数组中，为每个资产提供详细的描述和 AI 绘图提示词。注意：项目现在包含多个分集/段落 (episodes)，每个分集/段落有自己的 scenes。\n\n【极其重要】当前用户的系统语言是 ${userLang}。你必须使用 ${langName} 输出所有内容，包括所有的设定、描述、对话、以及 AI 绘图提示词（AI 绘图提示词也必须是 ${langName}）。绝对不要输出其他语言。`;

      if (location.pathname === "/structure") {
        systemInstruction +=
          "\n\n" +
          `## Activate Agent 2: The Structure Architect
**Profile**:
你是全球顶级的、拥有最强大脑的世界级结构大师。你深谙经典三幕剧结构、布莱克·斯奈德《救猫咪》以及麦基“价值转换”理论。你对无聊的过场戏零容忍。
**Task**:
基于 Agent 1 输出的“创意（项目圣经）”和当前分集/段落的灵感，将当前的故事段落拆解为具体的电影场景节拍表（Beat Sheet）。请修改当前 activeEpisode 的 scenes 数组。
**Specific Instructions**:
1. 自然切分：按“时间/空间的跳跃”来切分场景，不限制场景数量，只要逻辑合理。
2. 场景价值转换（极度重要）：每个场景必须有明确的“情节点（Plot Point）”。场景结束时，角色的处境、情绪或信息必须发生正负转换（如：+ 变 -，或 - 变 +）。
3. 如果是微短剧/短片：强化“钩子（Hook）”，每 2 分钟必须出现一次高能反转或强烈冲突。`;
      } else if (location.pathname === "/script") {
        systemInstruction +=
          "\n\n" +
          `## Activate Agent 3: The Writer-Director
**Profile**:
你是全球顶级的、拥有最强大脑的金牌编剧兼“作者导演”。你像大卫·芬奇或克里斯托弗·诺兰一样，拥有极强画面控制力兼顾剧本深度。你奉行"Show, Don't Tell"。你极度厌恶说教式台词。
**Task**:
请根据 Agent 2 提供的节拍大纲，为当前分集/段落的指定场景撰写全格式拍摄台本 (Shooting Script)。请修改当前 activeEpisode 的 scenes 数组中的 script 字段。
**Strict Guidelines (违背任何一条将终止运行)**:
1. Format: 严格使用标准剧本格式（Slugline, Action, Character, Dialogue）。
2. Subtext First (潜台词优先)：禁止角色用嘴说出真实感受（如“我爱你”、“我好害怕”、“我要复仇”）。用环境互动、尴尬的停顿、顾左右而言他来体现内心情感。对白要锋利、留白。
3. Visual Directing: 在 Action 描写中，必须嵌入导演视角的镜头语言。使用大写字母标出关键画面元素（如：A REVOLVER on the table），并适当加入镜头运动提示（如 PUSH IN:, MATCH CUT TO:）和音效提示（SFX:）。
4. Pacing: 删去所有不必要的寒暄（进场要晚，出场要早 / Enter late, leave early）。`;
      }

      const activeEpisode = currentProject?.episodes.find(
        (ep) => ep.id === activeEpisodeId,
      );

      const responseText = await generateAIContent({
        prompt: `用户指令: ${userMsg}\n\n当前项目状态 (JSON):\n${JSON.stringify(
          currentProject,
          null,
          2,
        )}\n\n当前活动分集/段落 ID: ${activeEpisodeId || "无"}\n当前活动分集/段落内容:\n${JSON.stringify(activeEpisode, null, 2)}`,
        systemInstruction,
        requireJson: true,
        schema: {
          type: Type.OBJECT,
          properties: {
            reply: { type: Type.STRING },
            updatedProject: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                title: { type: Type.STRING },
                type: { type: Type.STRING },
                logline: { type: Type.STRING },
                coreConflict: { type: Type.STRING },
                aspectRatio: { type: Type.STRING },
                characters: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      name: { type: Type.STRING },
                      internalDesire: { type: Type.STRING },
                      externalGoal: { type: Type.STRING },
                      flaw: { type: Type.STRING },
                    },
                  },
                },
                scenes: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      title: { type: Type.STRING },
                      description: { type: Type.STRING },
                      valueCharge: { type: Type.STRING },
                      hook: { type: Type.STRING },
                      script: { type: Type.STRING },
                    },
                  },
                },
                episodes: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      title: { type: Type.STRING },
                      inspiration: { type: Type.STRING },
                      scenes: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            id: { type: Type.STRING },
                            title: { type: Type.STRING },
                            description: { type: Type.STRING },
                            valueCharge: { type: Type.STRING },
                            hook: { type: Type.STRING },
                            script: { type: Type.STRING },
                          },
                        },
                      },
                    },
                  },
                },
                assets: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      type: { type: Type.STRING },
                      name: { type: Type.STRING },
                      description: { type: Type.STRING },
                      prompt: { type: Type.STRING },
                      imageUrl: { type: Type.STRING },
                    },
                  },
                },
              },
            },
          },
          required: ["reply"]
        },
      });

      const jsonStr = responseText;
      if (jsonStr) {
        const result = JSON.parse(jsonStr);
        if (result.updatedProject) {
          updateProject(result.updatedProject);
        }
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: result.reply || "已执行您的指令。" },
        ]);
      } else {
        throw new Error("No JSON returned");
      }
    } catch (error) {
      console.error("OmniChat Error:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "抱歉，执行指令时出现错误。请重试。" },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`absolute bottom-6 right-6 w-96 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col z-50 transition-all duration-300 ${isMinimized ? "h-12" : ""}`}
    >
      <div
        className="p-3 border-b border-neutral-800 bg-neutral-900/50 backdrop-blur-sm flex items-center justify-between cursor-pointer hover:bg-neutral-800/50 transition-colors"
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-sm font-medium text-neutral-200">
            O.M.N.I. 主脑视窗
          </span>
        </div>
        <div className="flex items-center gap-2 text-neutral-500">
          {isMinimized ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </div>
      </div>

      {!isMinimized && (
        <>
          <div className="h-80 p-4 overflow-y-auto space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <span className="text-emerald-500 text-xs font-bold">
                      O
                    </span>
                  </div>
                )}
                <p
                  className={`text-sm p-3 rounded-2xl ${
                    msg.role === "user"
                      ? "bg-emerald-600 text-white rounded-tr-none"
                      : "bg-neutral-800 text-neutral-300 rounded-tl-none"
                  }`}
                >
                  {msg.content}
                </p>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <span className="text-emerald-500 text-xs font-bold">O</span>
                </div>
                <div className="bg-neutral-800 p-3 rounded-2xl rounded-tl-none flex items-center">
                  <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form
            onSubmit={handleSubmit}
            className="p-3 border-t border-neutral-800 bg-neutral-900"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading || !currentProject}
              placeholder={currentProject ? "输入指令..." : "请先立项..."}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/50 transition-colors disabled:opacity-50"
            />
          </form>
        </>
      )}
    </div>
  );
}
