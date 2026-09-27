import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Search, RotateCcw, ZoomIn, ZoomOut, Maximize2,
  GitFork, X, Network
} from 'lucide-react';

// Entity type color/icon map
const ENTITY_STYLES = {
  PERSON:            { color: '#00e5ff', label: 'Person'       },
  PHONE_NUMBER:      { color: '#fbbf24', label: 'Phone'        },
  ORGANIZATION:      { color: '#c084fc', label: 'Org'          },
  LOCATION:          { color: '#34d399', label: 'Location'     },
  ACCOUNT_NUMBER:    { color: '#fb7185', label: 'Account'      },
  DEVICE_IDENTIFIER: { color: '#60a5fa', label: 'Device'       },
  VEHICLE:           { color: '#fb923c', label: 'Vehicle'      },
  TRANSACTION:       { color: '#a3e635', label: 'Transaction'  },
  EVENT:             { color: '#f87171', label: 'Event'        },
  DEFAULT:           { color: '#94a3b8', label: 'Unknown'      }
};

function getEntityStyle(type) {
  return ENTITY_STYLES[type] || ENTITY_STYLES.DEFAULT;
}

function getNodeRadius(node) {
  const influence = node.influence_score || 20;
  return Math.max(18, Math.min(40, 16 + (influence / 100) * 24));
}

export function InvestigationGraphView({ investigationId, onNodeClick }) {
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const stateRef = useRef({
    nodes: [], edges: [], zoom: 1, panX: 0, panY: 0,
    dragging: null, dragOffX: 0, dragOffY: 0,
    panning: false, lastPanX: 0, lastPanY: 0,
    hoveredNode: null, selectedNode: null, shortestPath: []
  });

  const [graphData, setGraphData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [selectedNodeInfo, setSelectedNodeInfo] = useState(null);
  const [shortestPathMode, setShortestPathMode] = useState(false);
  const [pathEndpoints, setPathEndpoints] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!investigationId) return;
    setLoading(true);
    fetch(`/api/investigations/${investigationId}/graph`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('netra_auth_token')}` }
    })
      .then(r => r.json())
      .then(data => {
        setGraphData(data);
        setStats(data.summary);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [investigationId]);

  const initGraph = useCallback((data, canvas) => {
    const W = canvas.width;
    const H = canvas.height;
    const state = stateRef.current;
    const searchLower = searchQuery.toLowerCase();

    const nodeMap = new Map();
    state.nodes = (data.nodes || [])
      .filter(n => {
        const matchType = !typeFilter || n.entity_type === typeFilter;
        const matchSearch = !searchQuery || n.canonical_name.toLowerCase().includes(searchLower);
        return matchType || matchSearch;
      })
      .map((n, i, arr) => {
        const angle = (i / Math.max(arr.length, 1)) * 2 * Math.PI;
        const radius = Math.min(W, H) * 0.32;
        const node = {
          ...n,
          x: W / 2 + radius * Math.cos(angle) + (Math.random() - 0.5) * 60,
          y: H / 2 + radius * Math.sin(angle) + (Math.random() - 0.5) * 60,
          vx: 0, vy: 0,
          radius: getNodeRadius(n)
        };
        nodeMap.set(n.id, node);
        return node;
      });

    state.edges = (data.edges || [])
      .filter(e => nodeMap.has(e.source_entity_id) && nodeMap.has(e.target_entity_id))
      .map(e => ({
        ...e,
        source: nodeMap.get(e.source_entity_id),
        target: nodeMap.get(e.target_entity_id)
      }));

    state.zoom = 1; state.panX = 0; state.panY = 0;
    state.selectedNode = null; state.hoveredNode = null; state.shortestPath = [];
  }, [typeFilter, searchQuery]);

  const tick = useCallback(() => {
    const state = stateRef.current;
    const nodes = state.nodes;
    const edges = state.edges;
    const N = nodes.length;
    if (N === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = canvas.width;
    const H = canvas.height;

    for (let i = 0; i < N; i++) {
      for (let j = i + 1; j < N; j++) {
        const ni = nodes[i], nj = nodes[j];
        let dx = nj.x - ni.x, dy = nj.y - ni.y;
        const d2 = dx * dx + dy * dy || 1;
        const d = Math.sqrt(d2);
        const force = 4000 / d2;
        const fx = (dx / d) * force, fy = (dy / d) * force;
        ni.vx -= fx; ni.vy -= fy;
        nj.vx += fx; nj.vy += fy;
      }
    }

    for (const e of edges) {
      const dx = e.target.x - e.source.x;
      const dy = e.target.y - e.source.y;
      const d = Math.sqrt(dx * dx + dy * dy) || 1;
      const ideal = 120 + e.source.radius + e.target.radius;
      const force = (d - ideal) * 0.04;
      const fx = (dx / d) * force, fy = (dy / d) * force;
      e.source.vx += fx; e.source.vy += fy;
      e.target.vx -= fx; e.target.vy -= fy;
    }

    for (const n of nodes) {
      if (state.dragging === n) continue;
      n.vx += (W / 2 - n.x) * 0.008;
      n.vy += (H / 2 - n.y) * 0.008;
      n.vx *= 0.82; n.vy *= 0.82;
      n.x = Math.max(n.radius + 4, Math.min(W - n.radius - 4, n.x + n.vx));
      n.y = Math.max(n.radius + 4, Math.min(H - n.radius - 4, n.y + n.vy));
    }
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const state = stateRef.current;
    const { nodes, edges, zoom, panX, panY, hoveredNode, selectedNode, shortestPath } = state;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke(); }
    for (let y = 0; y < canvas.height; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke(); }
    ctx.restore();

    ctx.save();
    ctx.translate(panX, panY);
    ctx.scale(zoom, zoom);

    const pathEdgeSet = new Set(shortestPath.map(e => e.id));

    for (const e of edges) {
      const isInPath = pathEdgeSet.has(e.id);
      const isConnected = selectedNode && (e.source_entity_id === selectedNode.id || e.target_entity_id === selectedNode.id);
      const dimmed = selectedNode && !isConnected && !isInPath;

      ctx.beginPath();
      ctx.moveTo(e.source.x, e.source.y);
      ctx.lineTo(e.target.x, e.target.y);

      if (isInPath) { ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 3; ctx.setLineDash([]); }
      else if (isConnected) { ctx.strokeStyle = 'rgba(0,229,255,0.6)'; ctx.lineWidth = 2; ctx.setLineDash([]); }
      else { ctx.strokeStyle = dimmed ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1; ctx.setLineDash(e.classification === 'DERIVED' ? [4, 4] : []); }
      ctx.stroke();
      ctx.setLineDash([]);

      if (isConnected) {
        const mx = (e.source.x + e.target.x) / 2;
        const my = (e.source.y + e.target.y) / 2;
        ctx.font = '9px Inter,sans-serif';
        ctx.fillStyle = 'rgba(148,163,184,0.85)';
        ctx.textAlign = 'center';
        ctx.fillText((e.relationship_type || '').replace(/_/g,' ').substring(0, 22), mx, my - 4);
      }
    }

    for (const n of nodes) {
      const style = getEntityStyle(n.entity_type);
      const r = n.radius;
      const isSelected = selectedNode && selectedNode.id === n.id;
      const isHovered = hoveredNode && hoveredNode.id === n.id;
      const isInPath = shortestPath.some(e => e.source_entity_id === n.id || e.target_entity_id === n.id);
      const dimmed = selectedNode && !isSelected &&
        !edges.some(e => (e.source_entity_id === n.id && e.target_entity_id === selectedNode.id) ||
                         (e.target_entity_id === n.id && e.source_entity_id === selectedNode.id));

      if (isSelected || isHovered || isInPath) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, r + 8, 0, Math.PI * 2);
        const g = ctx.createRadialGradient(n.x, n.y, r, n.x, n.y, r + 12);
        g.addColorStop(0, isInPath ? 'rgba(251,191,36,0.35)' : `${style.color}55`);
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g; ctx.fill();
      }

      ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
      ctx.fillStyle = dimmed ? 'rgba(14,21,38,0.5)' : '#0e1526'; ctx.fill();
      ctx.strokeStyle = isSelected ? '#fff' : isInPath ? '#fbbf24' : (dimmed ? 'rgba(100,116,139,0.3)' : style.color);
      ctx.lineWidth = isSelected ? 3 : isHovered ? 2.5 : 2; ctx.stroke();

      ctx.beginPath(); ctx.arc(n.x, n.y, r - 3, 0, Math.PI * 2);
      ctx.fillStyle = dimmed ? 'rgba(30,41,59,0.4)' : `${style.color}22`; ctx.fill();

      ctx.font = `bold ${Math.max(10, r * 0.55)}px Inter,sans-serif`;
      ctx.fillStyle = dimmed ? 'rgba(100,116,139,0.5)' : style.color;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText((n.canonical_name || '?').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase().substring(0, 2), n.x, n.y);

      ctx.font = `${Math.max(9, Math.min(11, r * 0.4))}px Inter,sans-serif`;
      ctx.fillStyle = dimmed ? 'rgba(100,116,139,0.4)' : (isSelected || isHovered ? '#f0f4fc' : 'rgba(148,163,184,0.85)');
      ctx.textBaseline = 'top';
      const lbl = n.canonical_name.length > 16 ? n.canonical_name.substring(0, 16) + '…' : n.canonical_name;
      ctx.fillText(lbl, n.x, n.y + r + 12);
    }

    ctx.restore();
    ctx.font = '11px JetBrains Mono,monospace';
    ctx.fillStyle = 'rgba(100,116,139,0.7)';
    ctx.textAlign = 'right';
    ctx.fillText(`${Math.round(zoom * 100)}%  ${nodes.length} nodes  ${edges.length} edges`, canvas.width - 12, canvas.height - 12);

    animFrameRef.current = requestAnimationFrame(() => { tick(); draw(); });
  }, [tick]);

  useEffect(() => {
    if (!graphData) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = canvas.parentElement?.clientWidth || 900;
    canvas.height = 560;
    initGraph(graphData, canvas);
    animFrameRef.current = requestAnimationFrame(() => { tick(); draw(); });
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, [graphData, typeFilter, searchQuery, initGraph, tick, draw]);

  const canvasToWorld = (cx, cy) => {
    const s = stateRef.current;
    return { x: (cx - s.panX) / s.zoom, y: (cy - s.panY) / s.zoom };
  };
  const hitTest = (wx, wy) => {
    for (const n of stateRef.current.nodes) {
      const dx = n.x - wx, dy = n.y - wy;
      if (dx*dx + dy*dy <= (n.radius+4)*(n.radius+4)) return n;
    }
    return null;
  };
  const getCanvasPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return { cx: e.clientX - rect.left, cy: e.clientY - rect.top };
  };

  const onMouseDown = (e) => {
    const { cx, cy } = getCanvasPos(e);
    const { x, y } = canvasToWorld(cx, cy);
    const hit = hitTest(x, y);
    const s = stateRef.current;
    if (hit) { s.dragging = hit; s.dragOffX = hit.x - x; s.dragOffY = hit.y - y; }
    else { s.panning = true; s.lastPanX = cx; s.lastPanY = cy; }
  };

  const onMouseMove = (e) => {
    const { cx, cy } = getCanvasPos(e);
    const { x, y } = canvasToWorld(cx, cy);
    const s = stateRef.current;
    if (s.dragging) { s.dragging.x = x + s.dragOffX; s.dragging.y = y + s.dragOffY; s.dragging.vx = 0; s.dragging.vy = 0; }
    else if (s.panning) { s.panX += cx - s.lastPanX; s.panY += cy - s.lastPanY; s.lastPanX = cx; s.lastPanY = cy; }
    else { s.hoveredNode = hitTest(x, y); canvasRef.current.style.cursor = s.hoveredNode ? 'pointer' : 'grab'; }
  };

  const onMouseUp = (e) => {
    const { cx, cy } = getCanvasPos(e);
    const { x, y } = canvasToWorld(cx, cy);
    const s = stateRef.current;
    const wasDragging = s.dragging;
    s.dragging = null; s.panning = false;
    if (!wasDragging) {
      const hit = hitTest(x, y);
      if (hit) {
        if (shortestPathMode) {
          const newEp = [...pathEndpoints, hit];
          if (newEp.length === 2) {
            computeShortestPath(newEp[0], newEp[1]);
            setPathEndpoints([]); setShortestPathMode(false);
          } else { setPathEndpoints(newEp); }
        } else { s.selectedNode = hit; setSelectedNodeInfo(hit); }
      } else if (!shortestPathMode) { s.selectedNode = null; setSelectedNodeInfo(null); }
    }
  };

  const onWheel = (e) => {
    e.preventDefault();
    const s = stateRef.current;
    const { cx, cy } = getCanvasPos(e);
    const factor = e.deltaY < 0 ? 1.12 : 0.9;
    const nz = Math.max(0.2, Math.min(4, s.zoom * factor));
    s.panX = cx - (cx - s.panX) * (nz / s.zoom);
    s.panY = cy - (cy - s.panY) * (nz / s.zoom);
    s.zoom = nz;
  };

  const resetView = () => {
    const s = stateRef.current;
    s.zoom = 1; s.panX = 0; s.panY = 0; s.selectedNode = null; s.shortestPath = [];
    setSelectedNodeInfo(null); setPathEndpoints([]);
  };

  const computeShortestPath = (from, to) => {
    const { nodes, edges } = stateRef.current;
    const adj = new Map();
    nodes.forEach(n => adj.set(n.id, []));
    edges.forEach(e => {
      adj.get(e.source_entity_id)?.push({ node: e.target_entity_id, edge: e });
      adj.get(e.target_entity_id)?.push({ node: e.source_entity_id, edge: e });
    });
    const visited = new Map();
    const queue = [from.id];
    visited.set(from.id, null);
    while (queue.length > 0) {
      const curr = queue.shift();
      if (curr === to.id) break;
      for (const { node, edge } of (adj.get(curr) || [])) {
        if (!visited.has(node)) { visited.set(node, { from: curr, edge }); queue.push(node); }
      }
    }
    const pathEdges = [];
    let curr = to.id;
    while (visited.get(curr)?.from != null) {
      const info = visited.get(curr);
      pathEdges.push(info.edge);
      curr = info.from;
    }
    stateRef.current.shortestPath = pathEdges;
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px', flexDirection: 'column', gap: '1rem', color: 'var(--text-secondary)' }}>
      <div className="pulse-indicator" style={{ width: '20px', height: '20px' }} />
      <span style={{ fontFamily: 'var(--font-heading)', fontSize: '0.9rem', letterSpacing: '0.05em' }}>LOADING KNOWLEDGE GRAPH...</span>
    </div>
  );

  if (error) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', color: 'var(--crimson-critical)' }}>
      <Network size={32} style={{ marginRight: '1rem' }} />
      <span>{error}</span>
    </div>
  );

  const entityTypes = [...new Set((graphData?.nodes || []).map(n => n.entity_type))];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <input type="text" className="form-input" placeholder="Search entity..." value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2rem', fontSize: '0.8rem', width: '200px' }} />
            <Search size={13} color="var(--text-dim)" style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)' }} />
          </div>
          <select className="form-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ fontSize: '0.8rem', width: '160px' }}>
            <option value="">All Entity Types</option>
            {entityTypes.map(t => <option key={t} value={t}>{ENTITY_STYLES[t]?.label || t}</option>)}
          </select>
          <button className={`btn btn-sm ${shortestPathMode ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => { setShortestPathMode(m => !m); setPathEndpoints([]); stateRef.current.shortestPath = []; }}>
            <GitFork size={13} />
            <span>{shortestPathMode ? `Pick ${2 - pathEndpoints.length} node(s)` : 'Shortest Path'}</span>
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {stats && (
            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-secondary)', marginRight: '0.5rem' }}>
              <span><strong style={{ color: 'var(--cyan-primary)' }}>{stats.total_nodes}</strong> nodes</span>
              <span><strong style={{ color: 'var(--text-primary)' }}>{stats.total_edges}</strong> edges</span>
            </div>
          )}
          <button className="btn btn-ghost btn-sm" onClick={() => { stateRef.current.zoom = Math.min(4, stateRef.current.zoom * 1.25); }}><ZoomIn size={14} /></button>
          <button className="btn btn-ghost btn-sm" onClick={() => { stateRef.current.zoom = Math.max(0.2, stateRef.current.zoom * 0.8); }}><ZoomOut size={14} /></button>
          <button className="btn btn-ghost btn-sm" onClick={resetView}><RotateCcw size={14} /></button>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        {Object.entries(ENTITY_STYLES).filter(([k]) => k !== 'DEFAULT').map(([type, style]) => (
          <div key={type} onClick={() => setTypeFilter(f => f === type ? '' : type)} style={{
            display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem',
            cursor: 'pointer', color: typeFilter === type ? style.color : 'var(--text-muted)',
            padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-sm)',
            backgroundColor: typeFilter === type ? `${style.color}15` : 'transparent',
            border: `1px solid ${typeFilter === type ? style.color + '50' : 'transparent'}`,
            transition: 'all 0.15s ease'
          }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: style.color }} />
            {style.label}
          </div>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '1rem', fontSize: '0.72rem', color: 'var(--text-dim)', alignItems: 'center' }}>
          <span>── Direct</span><span style={{ letterSpacing: '2px' }}>-- Derived</span>
        </div>
      </div>

      {/* Canvas */}
      <div style={{ position: 'relative', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border-medium)', backgroundColor: '#050810' }}>
        <canvas ref={canvasRef} style={{ display: 'block', width: '100%' }}
          onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp}
          onMouseLeave={() => { stateRef.current.panning = false; stateRef.current.dragging = null; }}
          onWheel={onWheel} />
        {shortestPathMode && (
          <div style={{ position: 'absolute', top: '1rem', left: '50%', transform: 'translateX(-50%)', padding: '0.5rem 1rem', backgroundColor: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.4)', borderRadius: 'var(--radius-full)', color: '#fbbf24', fontSize: '0.8rem', fontWeight: 600 }}>
            {pathEndpoints.length === 0 ? '🎯 Click first node' : `🎯 Click second node (from: ${pathEndpoints[0].canonical_name})`}
          </div>
        )}
        {(!graphData?.nodes?.length) && !loading && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', color: 'var(--text-muted)' }}>
            <Network size={48} style={{ opacity: 0.3 }} />
            <p style={{ fontSize: '0.9rem' }}>No graph data. Run the Analysis Pipeline first.</p>
          </div>
        )}
      </div>

      {/* Selected node info panel */}
      {selectedNodeInfo && (
        <div style={{ padding: '1.25rem', backgroundColor: 'var(--bg-input)', border: `1px solid ${getEntityStyle(selectedNodeInfo.entity_type).color}40`, borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: `${getEntityStyle(selectedNodeInfo.entity_type).color}20`, border: `2px solid ${getEntityStyle(selectedNodeInfo.entity_type).color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 800, color: getEntityStyle(selectedNodeInfo.entity_type).color }}>
                {selectedNodeInfo.canonical_name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 700, color: '#fff', fontSize: '1rem' }}>{selectedNodeInfo.canonical_name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{selectedNodeInfo.entity_type?.replace(/_/g,' ')} · {selectedNodeInfo.entity_id}</div>
              </div>
              <span style={{ padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)', backgroundColor: getEntityStyle(selectedNodeInfo.entity_type).color + '20', border: `1px solid ${getEntityStyle(selectedNodeInfo.entity_type).color}50`, color: getEntityStyle(selectedNodeInfo.entity_type).color, fontSize: '0.7rem', fontWeight: 700 }}>
                {selectedNodeInfo.network_role || 'Peripheral'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8rem' }}>
              <div><span style={{ color: 'var(--text-muted)' }}>Influence </span><strong style={{ color: '#fbbf24' }}>{selectedNodeInfo.influence_score || 0}/100</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Connections </span><strong style={{ color: 'var(--cyan-primary)' }}>{selectedNodeInfo.connections || 0}</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Confidence </span><strong style={{ color: '#34d399' }}>{Math.round((selectedNodeInfo.confidence_score || 0) * 100)}%</strong></div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-primary btn-sm" onClick={() => onNodeClick && onNodeClick(selectedNodeInfo.entity_id)}>View Dossier</button>
            <button className="btn btn-ghost btn-sm" onClick={() => { stateRef.current.selectedNode = null; setSelectedNodeInfo(null); }}><X size={13} /></button>
          </div>
        </div>
      )}
    </div>
  );
}

export default InvestigationGraphView;
