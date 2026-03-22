import React, { useState } from 'react';
import { WorldBuildingRule } from '../../types/project';
import { Plus, Trash2, Globe } from 'lucide-react';

interface WorldBuildingRuleListProps {
  rules: WorldBuildingRule[];
  onChange: (rules: WorldBuildingRule[]) => void;
}

export function WorldBuildingRuleList({ rules, onChange }: WorldBuildingRuleListProps) {
  const [newRule, setNewRule] = useState<Partial<WorldBuildingRule>>({ category: '', content: '' });

  const handleAdd = () => {
    if (newRule.category && newRule.content) {
      onChange([...rules, { ...newRule, id: Date.now().toString() } as WorldBuildingRule]);
      setNewRule({ category: '', content: '' });
    }
  };

  const handleDelete = (id: string) => {
    onChange(rules.filter(r => r.id !== id));
  };

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="bg-neutral-900/50 rounded-2xl border border-neutral-800 p-4">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <Globe className="w-4 h-4 text-emerald-400" />
          添加世界观规则
        </h3>
        <div className="flex flex-col gap-4 mb-4">
          <input
            type="text"
            placeholder="分类 (如: 物理法则, 社会结构, 魔法体系)"
            value={newRule.category}
            onChange={e => setNewRule({ ...newRule, category: e.target.value })}
            className="bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
          />
          <textarea
            placeholder="规则内容描述..."
            value={newRule.content}
            onChange={e => setNewRule({ ...newRule, content: e.target.value })}
            className="bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 min-h-[100px] resize-none"
          />
        </div>
        <button
          onClick={handleAdd}
          disabled={!newRule.category || !newRule.content}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-neutral-800 disabled:text-neutral-500 text-white rounded-lg text-sm font-bold transition-colors"
        >
          <Plus className="w-4 h-4" />
          添加规则
        </button>
      </div>

      <div className="space-y-4 overflow-y-auto max-h-[500px] custom-scrollbar">
        {rules.map(rule => (
          <div key={rule.id} className="flex flex-col bg-neutral-900/50 p-4 rounded-xl border border-neutral-800 relative group">
            <div className="flex items-center justify-between mb-2">
              <span className="text-emerald-400 font-bold text-sm px-2 py-1 bg-neutral-950 rounded-lg border border-neutral-800">
                {rule.category}
              </span>
              <button
                onClick={() => handleDelete(rule.id)}
                className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <p className="text-neutral-300 text-sm leading-relaxed whitespace-pre-wrap">
              {rule.content}
            </p>
          </div>
        ))}
        {rules.length === 0 && (
          <div className="text-center text-neutral-500 py-8">
            暂无世界观规则，请添加
          </div>
        )}
      </div>
    </div>
  );
}
