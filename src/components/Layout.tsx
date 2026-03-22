import { Outlet, Link, useLocation } from "react-router-dom";
import {
  Clapperboard,
  LayoutDashboard,
  Type,
  Image as ImageIcon,
  Settings,
  Video,
  Mic,
  Library,
  FolderOpen,
  Menu,
  X,
  Globe,
  ListVideo,
  ListChecks,
  ChevronLeft,
  ChevronRight,
  MonitorPlay,
  Cpu,
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import OmniChat from "./OmniChat";
import ProjectHealthIndicator from "./ProjectHealthIndicator";
import { useProjectStore } from "../store/useProjectStore";
import { useSettingsStore } from "../store/useSettingsStore";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Layout() {
  const location = useLocation();
  const { currentProject } = useProjectStore();
  const { isOmniWindowEnabled, isFastMode } = useSettingsStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === "zh" ? "en" : "zh");
  };

  const mainNavItems = [
    { name: t("nav.projects"), path: "/projects", icon: FolderOpen },
    { name: t("nav.imageGen"), path: "/image-gen", icon: ImageIcon },
    { name: t("nav.videoGen"), path: "/video-gen", icon: Video },
    { name: t("nav.audioGen"), path: "/audio-gen", icon: Mic },
    { name: t("nav.assets"), path: "/assets", icon: Library },
  ];

  const projectNavItems = isFastMode ? [
    { name: t("projectNav.bible"), path: "/bible", icon: Clapperboard },
    { name: "大纲板", path: "/beatboard", icon: LayoutDashboard },
    { name: t("projectNav.script"), path: "/script", icon: Type },
    { name: "剧本拆解", path: "/breakdown", icon: ListChecks },
    { name: t("projectNav.storyboard"), path: "/storyboard", icon: ImageIcon },
    { name: "摄影棚", path: "/studio", icon: MonitorPlay },
  ] : [
    { name: t("projectNav.bible"), path: "/bible", icon: Clapperboard },
    { 
      name: currentProject?.type === "movie" ? "段落" : t("projectNav.episodes"), 
      path: "/episodes", 
      icon: ListVideo 
    },
    {
      name: t("projectNav.structure"),
      path: "/structure",
      icon: LayoutDashboard,
    },
    { name: t("projectNav.script"), path: "/script", icon: Type },
    { name: "剧本拆解", path: "/breakdown", icon: ListChecks },
    { name: t("projectNav.storyboard"), path: "/storyboard", icon: ImageIcon },
    { name: "摄影棚", path: "/studio", icon: MonitorPlay },
  ];

  const isProjectRoute = [
    "/bible",
    "/episodes",
    "/structure",
    "/beatboard",
    "/script",
    "/breakdown",
    "/storyboard",
    "/studio",
  ].includes(location.pathname);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className="flex h-screen bg-neutral-950 text-neutral-100 font-sans overflow-hidden">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-neutral-800 bg-neutral-900 absolute top-0 left-0 right-0 z-40">
        <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
          <span className="text-emerald-500">O.M.N.I.</span>
        </h1>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="text-neutral-400 hover:text-white"
        >
          {isMobileMenuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          "border-r border-neutral-800 bg-neutral-900 flex flex-col absolute md:relative z-30 h-full transition-all duration-300 ease-in-out",
          isSidebarCollapsed ? "w-20" : "w-64",
          isMobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full md:translate-x-0",
        )}
      >
        <div className="p-6 hidden md:flex items-center justify-between">
          {!isSidebarCollapsed && (
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                <span className="text-emerald-500">
                  {t("common.omniStudio")}
                </span>
              </h1>
              <p className="text-xs text-neutral-500 mt-1">
                {t("common.omniDesc")}
              </p>
            </div>
          )}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white rounded-lg transition-colors ml-auto"
          >
            {isSidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-6 mt-16 md:mt-4 overflow-y-auto custom-scrollbar">
          <div>
            <div className="space-y-1">
              {mainNavItems.map((item) => {
                const isActive =
                  location.pathname === item.path ||
                  (item.path === "/projects" && location.pathname === "/");
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={closeMobileMenu}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-neutral-800 text-white"
                        : "text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200",
                      isSidebarCollapsed ? "justify-center" : "",
                    )}
                    title={isSidebarCollapsed ? item.name : undefined}
                  >
                    <item.icon className="w-5 h-5 shrink-0" />
                    {!isSidebarCollapsed && <span>{item.name}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>

        <div className="p-4 border-t border-neutral-800 flex flex-col gap-2">
          <Link
            to="/settings"
            onClick={closeMobileMenu}
            className={cn(
              "flex items-center gap-3 text-sm transition-colors w-full px-3 py-2 rounded-lg",
              location.pathname === "/settings"
                ? "bg-neutral-800 text-white"
                : "text-neutral-400 hover:bg-neutral-800/50 hover:text-white",
              isSidebarCollapsed ? "justify-center" : "text-left",
            )}
            title={isSidebarCollapsed ? t("nav.settings", "设置") : undefined}
          >
            <Settings className="w-5 h-5 shrink-0" />
            {!isSidebarCollapsed && <span>{t("nav.settings", "设置")}</span>}
          </Link>
          <button
            onClick={toggleLanguage}
            className={cn(
              "flex items-center gap-3 text-sm text-neutral-400 hover:text-white transition-colors w-full px-3 py-2 rounded-lg hover:bg-neutral-800/50",
              isSidebarCollapsed ? "justify-center" : "text-left",
            )}
            title={
              isSidebarCollapsed
                ? i18n.language === "zh"
                  ? "English"
                  : "中文"
                : undefined
            }
          >
            <Globe className="w-5 h-5 shrink-0" />
            {!isSidebarCollapsed && (
              <span>{i18n.language === "zh" ? "English" : "中文"}</span>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden flex flex-col relative pt-16 md:pt-0">
        {/* Project Tabs (Top) */}
        {currentProject && isProjectRoute && (
          <div className="bg-neutral-900 border-b border-neutral-800 px-4 py-2 flex items-center justify-between shrink-0 relative z-40">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar flex-1">
              <div className="text-xs font-bold text-emerald-500 uppercase tracking-wider mr-4 shrink-0 hidden sm:block">
                {t("common.currentProject")}: {currentProject.title}
              </div>
              <div className="flex gap-1">
                {projectNavItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
                        isActive
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200",
                      )}
                    >
                      <item.icon className="w-4 h-4 hidden sm:block" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
            <div className="ml-4 shrink-0">
              <ProjectHealthIndicator />
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>

        {/* O.M.N.I. 主脑视窗 (Floating Chat) */}
        {isOmniWindowEnabled && <OmniChat />}
      </main>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={closeMobileMenu}
        />
      )}
    </div>
  );
}
