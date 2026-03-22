import { GoogleGenAI, Modality } from "@google/genai";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { useAIConfigStore, AIChannel, AIModel } from "../store/useAIConfigStore";

// Helper to get channel and model
function getModelAndChannel(taskId: keyof ReturnType<typeof useAIConfigStore.getState>['routing']) {
  const state = useAIConfigStore.getState();
  const modelId = state.routing[taskId];
  const model = state.models.find(m => m.id === modelId);
  if (!model) return null;
  const channel = state.channels.find(c => c.id === model.channelId);
  if (!channel) return null;
  return { model, channel };
}

export async function generateAIImage(options: {
  prompt: string;
  aspectRatio?: "1:1" | "3:4" | "4:3" | "9:16" | "16:9";
  referenceImages?: string[];
}): Promise<string> {
  const config = getModelAndChannel('imageGen');
  if (!config) throw new Error(`No model configured for task: imageGen`);
  const { model, channel } = config;
  const apiKey = model.apiKeyOverride || channel.apiKey || process.env.GEMINI_API_KEY || '';

  if (channel.type === 'gemini') {
    const gemini = new GoogleGenAI({ apiKey: apiKey });
    const parts: any[] = [{ text: options.prompt }];

    if (options.referenceImages && options.referenceImages.length > 0) {
      options.referenceImages.forEach((imgUrl) => {
        const match = imgUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
        if (match) {
          parts.push({ inlineData: { mimeType: match[1], data: match[2] } });
        }
      });
    }

    const response = await gemini.models.generateContent({
      model: model.modelId,
      contents: { parts: parts },
      config: {
        imageConfig: { aspectRatio: options.aspectRatio || "16:9" }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image generated");
  } else if (channel.type === 'openai') {
    const openai = new OpenAI({
      baseURL: channel.baseUrl || "https://api.openai.com/v1",
      apiKey: apiKey,
      dangerouslyAllowBrowser: true,
    });
    const response = await openai.images.generate({
      model: model.modelId,
      prompt: options.prompt,
      n: 1,
      size: "1024x1024",
      response_format: "b64_json",
    });
    if (response.data[0]?.b64_json) {
      return `data:image/png;base64,${response.data[0].b64_json}`;
    }
    throw new Error("No image generated");
  } else if (channel.type === 'comfyui') {
    // ComfyUI implementation
    const state = useAIConfigStore.getState();
    // For simplicity, we just find the first comfy workflow
    const workflow = state.comfyWorkflows[0];
    if (!workflow) throw new Error("No ComfyUI workflow configured");

    const promptJson = JSON.parse(JSON.stringify(workflow.workflowJson));
    workflow.mappings.forEach(mapping => {
      if (mapping.systemParam === 'prompt' && promptJson[mapping.nodeId]) {
        promptJson[mapping.nodeId].inputs[mapping.nodeInput] = options.prompt;
      }
      if (mapping.systemParam === 'seed' && promptJson[mapping.nodeId]) {
        promptJson[mapping.nodeId].inputs[mapping.nodeInput] = Math.floor(Math.random() * 1000000000);
      }
    });

    const baseUrl = channel.baseUrl.replace(/\/$/, '');
    const submitRes = await fetch(`${baseUrl}/prompt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: promptJson })
    });
    const submitData = await submitRes.json();
    const promptId = submitData.prompt_id;

    // Poll for history
    while (true) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const historyRes = await fetch(`${baseUrl}/history/${promptId}`);
      const historyData = await historyRes.json();
      if (historyData[promptId]) {
        const outputs = historyData[promptId].outputs;
        for (const nodeId in outputs) {
          if (outputs[nodeId].images && outputs[nodeId].images.length > 0) {
            const image = outputs[nodeId].images[0];
            // Fetch the actual image
            const imgRes = await fetch(`${baseUrl}/view?filename=${image.filename}&subfolder=${image.subfolder}&type=${image.type}`);
            const imgBlob = await imgRes.blob();
            return new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(imgBlob);
            });
          }
        }
        throw new Error("No image in ComfyUI output");
      }
    }
  } else {
    throw new Error(`Unsupported channel type for image generation: ${channel.type}`);
  }
}

export async function generateAIVideo(options: {
  prompt: string;
  imageUrl: string;
  aspectRatio?: "16:9" | "9:16";
}): Promise<string> {
  const config = getModelAndChannel('videoGen');
  if (!config) throw new Error(`No model configured for task: videoGen`);
  const { model, channel } = config;
  const apiKey = model.apiKeyOverride || channel.apiKey || process.env.GEMINI_API_KEY || '';

  if (channel.type === 'gemini') {
    const gemini = new GoogleGenAI({ apiKey: apiKey });
    const base64Data = options.imageUrl.split(',')[1];
    const mimeType = options.imageUrl.split(';')[0].split(':')[1];

    let operation = await gemini.models.generateVideos({
      model: model.modelId,
      prompt: options.prompt,
      image: { imageBytes: base64Data, mimeType: mimeType },
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: options.aspectRatio || '16:9'
      }
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await gemini.operations.getVideosOperation({operation: operation});
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) throw new Error("No video generated");

    const response = await fetch(downloadLink, {
      method: 'GET',
      headers: { 'x-goog-api-key': apiKey },
    });
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } else {
    throw new Error(`Unsupported channel type for video generation: ${channel.type}`);
  }
}

export async function generateAIVoice(options: {
  text: string;
  voiceName: string;
}): Promise<string> {
  const config = getModelAndChannel('audioGen');
  if (!config) throw new Error(`No model configured for task: audioGen`);
  const { model, channel } = config;
  const apiKey = model.apiKeyOverride || channel.apiKey || process.env.GEMINI_API_KEY || '';

  if (channel.type === 'gemini') {
    const gemini = new GoogleGenAI({ apiKey: apiKey });
    const response = await gemini.models.generateContent({
      model: model.modelId,
      contents: [{ parts: [{ text: options.text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: options.voiceName } },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio generated");
    return `data:audio/wav;base64,${base64Audio}`;
  } else {
    throw new Error(`Unsupported channel type for audio generation: ${channel.type}`);
  }
}
export async function generateAIContent(options: {
  prompt: string;
  systemInstruction?: string;
  requireJson?: boolean;
  schema?: any;
  taskType?: keyof ReturnType<typeof useAIConfigStore.getState>['routing'];
}): Promise<string> {
  const userLang = navigator.language || 'zh-CN';
  const langName = userLang.startsWith('zh') ? '中文' : 'English';
  const langInstruction = `\n\n【IMPORTANT/极其重要】Please respond and communicate entirely in the user's system language: ${langName} (${userLang}). 所有的内容、设定、描述、对话、以及 AI 绘图提示词等，都必须严格使用 ${langName} 输出。绝对不要输出其他语言。`;

  const finalSystemInstruction = (options.systemInstruction || "") + langInstruction;
  let finalPrompt = options.prompt;

  const taskType = options.taskType || 'scriptGen';
  const config = getModelAndChannel(taskType);

  if (!config) {
    throw new Error(`No model configured for task: ${taskType}`);
  }

  const { model, channel } = config;
  const apiKey = model.apiKeyOverride || channel.apiKey || process.env.GEMINI_API_KEY || '';

  if (channel.type === 'openai') {
    const openai = new OpenAI({
      baseURL: channel.baseUrl || "https://api.openai.com/v1",
      apiKey: apiKey,
      dangerouslyAllowBrowser: true,
    });

    if (options.requireJson) {
      finalPrompt +=
        "\n\n【极其重要】你必须且只能返回合法的 JSON 格式数据。不要包含任何 Markdown 标记（如 ```json），不要包含任何解释性文字，直接输出纯 JSON 字符串。确保所有的键和字符串值都被双引号 \"\" 正确包裹。";
      if (options.schema) {
        finalPrompt += `\n\n请严格遵循以下 JSON Schema 结构：\n${JSON.stringify(options.schema, null, 2)}`;
      }
    }

    const messages: any[] = [];
    if (finalSystemInstruction) {
      messages.push({ role: "system", content: finalSystemInstruction });
    }
    messages.push({ role: "user", content: finalPrompt });

    const completion = await openai.chat.completions.create({
      messages,
      model: model.modelId,
    });

    let text = completion.choices[0].message.content || "";

    if (options.requireJson) {
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch && jsonMatch[1]) {
        text = jsonMatch[1].trim();
      } else {
        const firstBrace = text.indexOf('{');
        const firstBracket = text.indexOf('[');
        const lastBrace = text.lastIndexOf('}');
        const lastBracket = text.lastIndexOf(']');

        let startIndex = -1;
        let endIndex = -1;

        if (firstBrace !== -1 && firstBracket !== -1) {
          startIndex = Math.min(firstBrace, firstBracket);
        } else {
          startIndex = Math.max(firstBrace, firstBracket);
        }

        if (lastBrace !== -1 && lastBracket !== -1) {
          endIndex = Math.max(lastBrace, lastBracket);
        } else {
          endIndex = Math.max(lastBrace, lastBracket);
        }

        if (startIndex !== -1 && endIndex !== -1 && endIndex >= startIndex) {
          text = text.substring(startIndex, endIndex + 1);
        }
      }
    }

    return text;
  } else if (channel.type === 'gemini') {
    const gemini = new GoogleGenAI({ apiKey: apiKey });
    const genConfig: any = {};
    if (finalSystemInstruction) {
      genConfig.systemInstruction = finalSystemInstruction;
    }
    if (options.requireJson) {
      genConfig.responseMimeType = "application/json";
      if (options.schema) {
        genConfig.responseSchema = options.schema;
      }
    }

    const response = await gemini.models.generateContent({
      model: model.modelId,
      contents: finalPrompt,
      config: genConfig,
    });

    return response.text || "";
  } else if (channel.type === 'minimax') {
    const anthropic = new Anthropic({
      baseURL: channel.baseUrl || "https://api.minimaxi.com/anthropic",
      apiKey: apiKey,
      dangerouslyAllowBrowser: true,
      fetch: async (url, init) => {
        const headers: Record<string, string> = {};
        if (init?.headers) {
          if (init.headers instanceof Headers) {
            init.headers.forEach((value, key) => {
              headers[key] = value;
            });
          } else if (Array.isArray(init.headers)) {
            init.headers.forEach(([key, value]) => {
              headers[key] = value;
            });
          } else {
            Object.assign(headers, init.headers);
          }
        }

        const response = await fetch('/api/proxy/minimax', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: url.toString(),
            method: init?.method,
            headers: headers,
            body: init?.body ? JSON.parse(init.body as string) : undefined
          })
        });
        return response;
      }
    });

    if (options.requireJson) {
      finalPrompt +=
        "\n\n【极其重要】你必须且只能返回合法的 JSON 格式数据。不要包含任何 Markdown 标记（如 ```json），不要包含任何解释性文字，直接输出纯 JSON 字符串。确保所有的键和字符串值都被双引号 \"\" 正确包裹。";
      if (options.schema) {
        finalPrompt += `\n\n请严格遵循以下 JSON Schema 结构：\n${JSON.stringify(options.schema, null, 2)}`;
      }
    }

    const response = await anthropic.messages.create({
      model: model.modelId,
      max_tokens: 8192, // 调高上限，防止长剧本被截断
      system: finalSystemInstruction + (options.requireJson ? "\n请直接开始生成 JSON，如果需要思考，请保持思考过程简洁，确保有足够的空间输出完整的 JSON 结构。" : ""),
      messages: [
        { role: "user", content: finalPrompt }
      ],
    });

    let text = "";
    for (const part of response.content) {
      if (part.type === 'text') {
        text = part.text;
        break;
      }
    }

    if (options.requireJson) {
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch && jsonMatch[1]) {
        text = jsonMatch[1].trim();
      } else {
        const firstBrace = text.indexOf('{');
        const firstBracket = text.indexOf('[');
        const lastBrace = text.lastIndexOf('}');
        const lastBracket = text.lastIndexOf(']');

        let startIndex = -1;
        let endIndex = -1;

        if (firstBrace !== -1 && firstBracket !== -1) {
          startIndex = Math.min(firstBrace, firstBracket);
        } else {
          startIndex = Math.max(firstBrace, firstBracket);
        }

        if (lastBrace !== -1 && lastBracket !== -1) {
          endIndex = Math.max(lastBrace, lastBracket);
        } else {
          endIndex = Math.max(lastBrace, lastBracket);
        }

        if (startIndex !== -1 && endIndex !== -1 && endIndex >= startIndex) {
          text = text.substring(startIndex, endIndex + 1);
        }
      }
    }

    return text;
  } else {
    throw new Error(`Unsupported channel type for text generation: ${channel.type}`);
  }
}
