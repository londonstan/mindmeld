import { X, ChevronRight, ChevronDown } from 'lucide-react';
import { useState } from 'react';

export default function Sidebar({ elements, onNodeSelect, isOpen, onClose, isMobile }) {
  const [expandedNodes, setExpandedNodes] = useState(new Set(['root']));

  // Build tree structure
  const nodeMap = new Map();
  const rootNodes = [];

  elements.nodes?.forEach(node => {
    nodeMap.set(node.data.id, { ...node.data, children: [] });
  });

  elements.edges?.forEach(edge => {
    const parent = nodeMap.get(edge.data.source);
    const child = nodeMap.get(edge.data.target);
    if (parent && child) {
      parent.children.push(child);
    }
  });

  elements.nodes?.forEach(node => {
    const hasParent = elements.edges?.some(e => e.data.target === node.data.id);
    if (!hasParent) {
      const nodeData = nodeMap.get(node.data.id);
      if (nodeData) rootNodes.push(nodeData);
    }
  });

  const toggleExpand = (nodeId) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const TreeNode = ({ node, depth = 0 }) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const isRoot = node.id === 'root';

    return (
      <div>
        <div
          className={`
            flex items-center gap-2 py-2 px-3 rounded cursor-pointer
            hover:bg-gray-100 transition-colors
            ${isRoot ? 'font-semibold text-primary-700' : ''}
          `}
          style={{ paddingLeft: `${depth * 16 + 12}px` }}
          onClick={() => {
            if (hasChildren) toggleExpand(node.id);
            if (onNodeSelect) onNodeSelect(node);
          }}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(node.id);
              }}
              className="p-0.5 hover:bg-gray-200 rounded"
            >
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
          )}
          {!hasChildren && <span className="w-5" />}
          
          <div className="flex-1 min-w-0">
            <div className="truncate text-sm">
              {node.label || '(no text)'}
            </div>
          </div>
        </div>

        {isExpanded && hasChildren && (
          <div>
            {node.children.map(child => (
              <TreeNode key={child.id} node={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  const content = (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Structure</h2>
        {isMobile && (
          <button onClick={onClose} className="btn-icon">
            <X size={20} />
          </button>
        )}
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto p-2">
        {rootNodes.length > 0 ? (
          rootNodes.map(node => (
            <TreeNode key={node.id} node={node} />
          ))
        ) : (
          <div className="text-center text-gray-500 py-8">
            No nodes to display
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-600 space-y-1">
          <div>Nodes: {elements.nodes?.length || 0}</div>
          <div>Connections: {elements.edges?.length || 0}</div>
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <>
        {/* Backdrop */}
        {isOpen && (
          <div 
            className="backdrop"
            onClick={onClose}
          />
        )}
        
        {/* Drawer */}
        <div className={`drawer drawer-left w-64 sm:w-80 ${!isOpen ? 'closed' : ''}`}>
          {content}
        </div>
      </>
    );
  }

  // Desktop sidebar
  return (
    <div className="w-64 lg:w-80 border-r border-gray-200 flex-shrink-0">
      {content}
    </div>
  );
}
