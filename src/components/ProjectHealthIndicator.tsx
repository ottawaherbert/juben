import React, { useMemo } from 'react';
import { useProjectStore } from '../store/useProjectStore';
import { AlertCircle, CheckCircle2, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';

export default function ProjectHealthIndicator() {
  const { currentProject } = useProjectStore();
  const [isOpen, setIsOpen] = React.useState(false);

  const healthData = useMemo(() => {
    if (!currentProject) return null;

    const issues: { type: string; message: string; link: string }[] = [];

    // Check characters without reference images
    const chars = Array.isArray(currentProject.characters) ? currentProject.characters : [];
    const charsWithoutImages = chars.filter(c => !c.referenceImageUrl);
    if (charsWithoutImages.length > 0) {
      issues.push({
        type: 'warning',
        message: `有 ${charsWithoutImages.length} 个角色尚未生成参考图`,
        link: '/bible'
      });
    }

    // Check assets without images
    const assets = Array.isArray(currentProject.assets) ? currentProject.assets : [];
    const assetsWithoutImages = assets.filter(a => !a.imageUrl);
    if (assetsWithoutImages.length > 0) {
      issues.push({
        type: 'warning',
        message: `有 ${assetsWithoutImages.length} 个资产尚未生成概念图`,
        link: '/assets'
      });
    }

    return {
      issues,
      isHealthy: issues.length === 0,
      totalIssues: issues.length
    };
  }, [currentProject]);

  if (!healthData) return null;

  return (
    <div className="relative ml-auto">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
          healthData.isHealthy 
            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20' 
            : 'bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20'
        }`}
      >
        {healthData.isHealthy ? (
          <CheckCircle2 className="w-4 h-4" />
        ) : (
          <AlertCircle className="w-4 h-4" />
        )}
        <span className="hidden sm:inline">
          {healthData.isHealthy ? '项目健康' : `${healthData.totalIssues} 个待办事项`}
        </span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="dropdown"
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 top-full mt-2 w-72 bg-neutral-900 border border-neutral-800 rounded-xl shadow-xl z-50 overflow-hidden"
          >
            <div className="p-3 border-b border-neutral-800 bg-neutral-950">
              <h3 className="text-sm font-bold text-white">项目健康度指示</h3>
            </div>
            <div className="max-h-64 overflow-y-auto custom-scrollbar p-2">
              {healthData.isHealthy ? (
                <div className="p-4 text-center text-sm text-neutral-400">
                  太棒了！当前项目没有待办事项。
                </div>
              ) : (
                <div className="space-y-1">
                  {healthData.issues.map((issue, idx) => (
                    <Link
                      key={idx}
                      to={issue.link}
                      onClick={() => setIsOpen(false)}
                      className="flex items-start gap-3 p-2 rounded-lg hover:bg-neutral-800 transition-colors group"
                    >
                      <AlertCircle className={`w-4 h-4 mt-0.5 shrink-0 ${issue.type === 'warning' ? 'text-amber-500' : 'text-blue-500'}`} />
                      <span className="text-sm text-neutral-300 group-hover:text-white transition-colors">
                        {issue.message}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
