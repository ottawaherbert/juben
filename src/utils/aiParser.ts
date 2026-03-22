/**
 * Utility for parsing AI responses, handling common issues like Markdown code blocks.
 */
export const safeParseAIResponse = <T>(responseText: string, defaultValue: T): T => {
  if (!responseText) return defaultValue;

  let cleanText = responseText.trim();

  // Remove Markdown code blocks if present
  if (cleanText.startsWith("```")) {
    const lines = cleanText.split("\n");
    if (lines[0].startsWith("```")) {
      lines.shift(); // Remove the opening ```json or ```
    }
    if (lines[lines.length - 1].startsWith("```")) {
      lines.pop(); // Remove the closing ```
    }
    cleanText = lines.join("\n").trim();
  }

  try {
    return JSON.parse(cleanText) as T;
  } catch (error) {
    console.error("Failed to parse AI response:", error);
    console.debug("Original response:", responseText);
    console.debug("Cleaned response:", cleanText);
    return defaultValue;
  }
};

/**
 * Extracts Midjourney-style parameters from a prompt string.
 */
export const extractVisualParameters = (prompt: string) => {
  const params: Record<string, string> = {};
  const regex = /--([a-z]+)\s+([^\s-]+)/g;
  let match;

  while ((match = regex.exec(prompt)) !== null) {
    params[match[1]] = match[2];
  }

  return params;
};
