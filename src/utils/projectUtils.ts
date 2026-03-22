export const getProjectTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    'movie': '电影',
    'tv-series': '电视剧',
    'short-drama': '短剧'
  };
  return labels[type] || type;
};

export const formatCreativeVision = (vision: any): string => {
  if (!vision) return '无';
  let formatted = `- 类型：${vision.genre?.join('、') || '无'}
- 视觉风格：${vision.visualStyle || '无'}
- 叙事风格：${vision.narrativeStyle || '无'}
- 参考作品：${vision.referenceWorks || '无'}`;
  
  if (vision.globalLookTags) {
    formatted += `\n- 全局光学底片：${vision.globalLookTags}`;
  }
  
  return formatted;
};
