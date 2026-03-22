import React, { useEffect, useState } from "react";
import { useProjectStore } from "../store/useProjectStore";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Film, Tv, Smartphone, Trash2, AlertTriangle, X } from "lucide-react";

export default function Projects() {
  const { projects, fetchProjects, loadProject, deleteProject } =
    useProjectStore();
  const navigate = useNavigate();
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleLoadProject = async (id: string) => {
    await loadProject(id);
    navigate("/bible");
  };

  const handleDeleteProject = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setProjectToDelete(id);
  };

  const confirmDelete = async () => {
    if (projectToDelete) {
      await deleteProject(projectToDelete);
      setProjectToDelete(null);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "movie":
        return <Film className="w-6 h-6 text-emerald-500" />;
      case "tv-series":
        return <Tv className="w-6 h-6 text-emerald-500" />;
      case "short-drama":
        return <Smartphone className="w-6 h-6 text-emerald-500" />;
      default:
        return <Film className="w-6 h-6 text-emerald-500" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "movie":
        return "电影长片";
      case "tv-series":
        return "电视剧/网剧";
      case "short-drama":
        return "微短剧";
      default:
        return "未知类型";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 md:p-12 h-full flex flex-col"
    >
      <div className="mb-8 md:mb-12 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-2 font-serif">
            项目广场 (Project Hub)
          </h1>
          <p className="text-neutral-400">查看和管理已创建的项目</p>
        </div>
        <button
          onClick={() => navigate("/new-project")}
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-colors w-full sm:w-auto"
        >
          新建项目
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-8 custom-scrollbar">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
          {projects.map((project) => (
            <div
              key={project.id}
              onClick={() => handleLoadProject(project.id)}
              className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl cursor-pointer hover:border-emerald-500/50 transition-colors group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-3 bg-neutral-950 rounded-xl group-hover:bg-emerald-500/10 transition-colors">
                    {getIcon(project.type)}
                  </div>
                  <span className="text-xs font-mono text-neutral-500 bg-neutral-950 px-2 py-1 rounded-md">
                    {project.aspectRatio || "16:9"}
                  </span>
                </div>
                <button
                  onClick={(e) => handleDeleteProject(e, project.id)}
                  className="p-2 text-neutral-500 hover:text-red-500 hover:bg-neutral-950 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <h3 className="text-xl font-bold text-white mb-2 truncate group-hover:text-emerald-400 transition-colors">
                {project.title}
              </h3>
              <p className="text-sm text-neutral-400 mb-4 line-clamp-2">
                {project.logline || "暂无梗概"}
              </p>
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-neutral-500 mt-auto pt-4">
                <span className="uppercase tracking-wider shrink-0 bg-neutral-950 px-2 py-1 rounded-md">
                  {getTypeLabel(project.type)}
                </span>
                <span className="shrink-0 bg-neutral-950 px-2 py-1 rounded-md">{project.episodes?.length || 0} Chapters</span>
              </div>
            </div>
          ))}
          {projects.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-24 border-2 border-dashed border-neutral-800 rounded-3xl text-neutral-500">
              <p className="mb-4">暂无项目</p>
              <button
                onClick={() => navigate("/new-project")}
                className="px-6 py-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl font-bold transition-colors"
              >
                去创建第一个项目
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {projectToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setProjectToDelete(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">删除项目</h3>
                  <p className="text-sm text-neutral-400">此操作无法撤销</p>
                </div>
              </div>
              <p className="text-neutral-300 mb-8">
                确定要永久删除这个项目及其所有相关数据吗？
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setProjectToDelete(null)}
                  className="flex-1 py-3 px-4 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl font-bold transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold transition-colors"
                >
                  确认删除
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
