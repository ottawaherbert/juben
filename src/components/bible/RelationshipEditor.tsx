import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Character, Relationship } from '../../types/project';
import { Plus, Trash2, Link as LinkIcon } from 'lucide-react';

interface RelationshipEditorProps {
  characters: Character[];
  relationships: Relationship[];
  onChange: (relationships: Relationship[]) => void;
}

export function RelationshipEditor({ characters, relationships, onChange }: RelationshipEditorProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [newRel, setNewRel] = useState<Partial<Relationship>>({ sourceId: '', targetId: '', type: '', description: '' });

  useEffect(() => {
    if (!svgRef.current || characters.length === 0) return;

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous render

    // Add arrow marker
    svg.append('defs').append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '-0 -5 10 10')
      .attr('refX', 20)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('xoverflow', 'visible')
      .append('svg:path')
      .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
      .attr('fill', '#9ca3af')
      .style('stroke', 'none');

    const nodes = characters.map(c => ({ id: c.id, name: c.name, ...c }));
    const links = relationships.map(r => ({ source: r.sourceId, target: r.targetId, type: r.type, id: r.id }));

    const simulation = d3.forceSimulation(nodes as any)
      .force('link', d3.forceLink(links).id((d: any) => d.id).distance(150))
      .force('charge', d3.forceManyBody().strength(-400))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(40));

    const link = svg.append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', '#4b5563')
      .attr('stroke-width', 2)
      .attr('marker-end', 'url(#arrowhead)');

    const linkText = svg.append('g')
      .selectAll('text')
      .data(links)
      .join('text')
      .attr('fill', '#9ca3af')
      .attr('font-size', '10px')
      .attr('text-anchor', 'middle')
      .attr('dy', -5)
      .text(d => d.type);

    const node = svg.append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .call(d3.drag<any, any>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended) as any);

    node.append('circle')
      .attr('r', 20)
      .attr('fill', '#8b5cf6')
      .attr('stroke', '#c4b5fd')
      .attr('stroke-width', 2);

    node.append('text')
      .text(d => d.name)
      .attr('x', 0)
      .attr('y', 30)
      .attr('text-anchor', 'middle')
      .attr('fill', '#e5e7eb')
      .attr('font-size', '12px');

    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      linkText
        .attr('x', (d: any) => (d.source.x + d.target.x) / 2)
        .attr('y', (d: any) => (d.source.y + d.target.y) / 2);

      node
        .attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [characters, relationships]);

  const handleAdd = () => {
    if (newRel.sourceId && newRel.targetId && newRel.type) {
      onChange([...relationships, { ...newRel, id: Date.now().toString() } as Relationship]);
      setNewRel({ sourceId: '', targetId: '', type: '', description: '' });
    }
  };

  const handleDelete = (id: string) => {
    onChange(relationships.filter(r => r.id !== id));
  };

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex-1 bg-neutral-950 rounded-2xl border border-neutral-800 overflow-hidden relative min-h-[300px]">
        {characters.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-neutral-500">
            请先添加角色
          </div>
        ) : (
          <svg ref={svgRef} className="w-full h-full" />
        )}
      </div>

      <div className="bg-neutral-900/50 rounded-2xl border border-neutral-800 p-4">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <LinkIcon className="w-4 h-4 text-purple-400" />
          添加关系
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 mb-4">
          <select
            value={newRel.sourceId}
            onChange={e => setNewRel({ ...newRel, sourceId: e.target.value })}
            className="bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
          >
            <option value="">选择角色 A</option>
            {characters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          
          <input
            type="text"
            placeholder="关系类型 (如: 宿敌, 恋人)"
            value={newRel.type}
            onChange={e => setNewRel({ ...newRel, type: e.target.value })}
            className="bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
          />

          <select
            value={newRel.targetId}
            onChange={e => setNewRel({ ...newRel, targetId: e.target.value })}
            className="bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
          >
            <option value="">选择角色 B</option>
            {characters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <input
            type="text"
            placeholder="关系描述 (可选)"
            value={newRel.description}
            onChange={e => setNewRel({ ...newRel, description: e.target.value })}
            className="bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500 sm:col-span-2"
          />
        </div>
        <button
          onClick={handleAdd}
          disabled={!newRel.sourceId || !newRel.targetId || !newRel.type}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-neutral-800 disabled:text-neutral-500 text-white rounded-lg text-sm font-bold transition-colors"
        >
          <Plus className="w-4 h-4" />
          添加关系
        </button>
      </div>

      <div className="space-y-2 overflow-y-auto max-h-[300px] custom-scrollbar">
        {relationships.map(rel => {
          const source = characters.find(c => c.id === rel.sourceId)?.name || '未知';
          const target = characters.find(c => c.id === rel.targetId)?.name || '未知';
          return (
            <div key={rel.id} className="flex items-center justify-between bg-neutral-900/50 p-3 rounded-xl border border-neutral-800">
              <div className="flex items-center gap-3">
                <span className="text-purple-400 font-bold text-sm">{source}</span>
                <span className="text-neutral-500 text-xs px-2 py-1 bg-neutral-950 rounded-full border border-neutral-800">{rel.type}</span>
                <span className="text-emerald-400 font-bold text-sm">{target}</span>
                {rel.description && <span className="text-neutral-400 text-xs ml-2">- {rel.description}</span>}
              </div>
              <button
                onClick={() => handleDelete(rel.id)}
                className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
