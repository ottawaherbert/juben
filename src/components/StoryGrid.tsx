import { useProjectStore } from '../store/useProjectStore';

export default function StoryGrid() {
  const { currentProject, activeEpisode } = useProjectStore();

  if (!currentProject || currentProject.type !== 'tv-series' || !activeEpisode) {
    return null;
  }

  // Group scenes by story line for the current episode
  const episodeScenes = activeEpisode.scenes || [];

  const storyLines = ['A-Story', 'B-Story', 'C-Story'];
  
  return (
    <div className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-6 mb-6 overflow-x-auto">
      <h3 className="text-sm font-bold text-purple-500 uppercase tracking-wider mb-6">
        多线叙事网格 (Story Grid) - {activeEpisode.title}
      </h3>
      
      <div className="min-w-[800px]">
        {/* Header */}
        <div className="grid grid-cols-[120px_1fr] gap-4 mb-4">
          <div className="font-bold text-neutral-500 text-xs uppercase tracking-wider">故事线</div>
          <div className="flex gap-2">
            {episodeScenes.map((scene, i) => (
              <div key={scene.id} className="flex-1 text-center text-xs text-neutral-500 font-mono truncate px-1">
                S{i + 1}
              </div>
            ))}
          </div>
        </div>

        {/* Grid Rows */}
        {storyLines.map(line => (
          <div key={line} className="grid grid-cols-[120px_1fr] gap-4 mb-4 items-center">
            <div className={`font-bold text-sm ${
              line === 'A-Story' ? 'text-purple-400' :
              line === 'B-Story' ? 'text-blue-400' :
              'text-emerald-400'
            }`}>
              {line}
            </div>
            <div className="flex gap-2 h-16">
              {episodeScenes.map((scene, i) => {
                const isMatch = scene.storyLine === line;
                return (
                  <div 
                    key={scene.id} 
                    className={`flex-1 rounded-lg border flex items-center justify-center p-2 transition-all ${
                      isMatch 
                        ? line === 'A-Story' ? 'bg-purple-500/20 border-purple-500/50 text-purple-300' :
                          line === 'B-Story' ? 'bg-blue-500/20 border-blue-500/50 text-blue-300' :
                          'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                        : 'bg-neutral-950/50 border-neutral-800/50 text-transparent'
                    }`}
                    title={isMatch ? scene.title : undefined}
                  >
                    {isMatch && (
                      <span className="text-xs font-medium truncate w-full text-center">
                        {scene.title}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
