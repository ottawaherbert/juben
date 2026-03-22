/// <reference types="vite/client" />

export const AI_CONFIG = {
  // 强制使用 deepseek
  provider: "deepseek" as "google" | "deepseek",
  
  // 如果使用 deepseek，请在此处填入您的 API Key，或者在 .env 文件中配置 VITE_DEEPSEEK_API_KEY
  deepseekApiKey: import.meta.env.VITE_DEEPSEEK_API_KEY || "sk-748b93f8d7c9400fae75f0046ec9f582",
};
