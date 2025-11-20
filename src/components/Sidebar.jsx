import React from 'react';
import NodeEditor from './NodeEditor';

const Sidebar = ({
  selectedNode,
  elements,
  onNodeUpdate,
  onNodeDelete,
  onNodeSelect,
  onEditCancel,
}) => {
  // Build tree structure from elements
  const buildTree = () => {
    const nodesMap = new Map();
    const childrenMap = new Map();

    elements.nodes.forEach((node) => {
      nodesMap.set(node.data.id, node.data);
      childrenMap.set(node.data.id, []);
    });

    elements.edges.forEach((edge) => {
      const children = childrenMap.get(edge.data.source) || [];
      children.push(edge.data.target);
      childrenMap.set(edge.data.source, children);
    });

    // Find root (node with no incoming edges)
    const targetIds = new Set(elements.edges.map((e) => e.data.target));
    const rootId = elements.nodes.find((n) => !targetIds.has(n.data.id))?.data.id;

    if (!rootId) return null;

    return { rootId, nodesMap, childrenMap };
  };

  const renderTreeNode = (nodeId, nodesMap, childrenMap, depth = 0) => {
    const node = nodesMap.get(nodeId);
    if (!node) return null;

    const children = childrenMap.get(nodeId) || [];
    const isSelected = selectedNode?.id === nodeId;

    return (
      <div key={nodeId} className="tree-node">
        <div
          className={`tree-item ${isSelected ? 'selected' : ''}`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => onNodeSelect(node)}
        >
          <span className="tree-icon">
            {children.length > 0 ? '▸' : '•'}
          </span>
          <span className="tree-label">{node.label}</span>
        </div>
        {children.length > 0 && (
          <div className="tree-children">
            {children.map((childId) =>
              renderTreeNode(childId, nodesMap, childrenMap, depth + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  const tree = buildTree();

  return (
    <div className="sidebar">
      <div className="sidebar-section">
        <h3>Properties</h3>
        {selectedNode ? (
          <NodeEditor
            node={selectedNode}
            onSave={(updates) => onNodeUpdate(selectedNode.id, updates)}
            onCancel={onEditCancel}
            onDelete={onNodeDelete}
          />
        ) : (
          <p className="placeholder">Select a node to edit its properties</p>
        )}
      </div>

      <div className="sidebar-section">
        <h3>Structure</h3>
        <div className="tree-view">
          {tree ? (
            renderTreeNode(tree.rootId, tree.nodesMap, tree.childrenMap)
          ) : (
            <p className="placeholder">No mind map loaded</p>
          )}
        </div>
      </div>

      <div className="sidebar-section">
        <h3>Statistics</h3>
        <div className="stats">
          <div className="stat-item">
            <span className="stat-label">Nodes:</span>
            <span className="stat-value">{elements.nodes.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Connections:</span>
            <span className="stat-value">{elements.edges.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Max Depth:</span>
            <span className="stat-value">
              {Math.max(...elements.nodes.map((n) => n.data.depth || 0), 0)}
            </span>
          </div>
        </div>
      </div>

      <div className="sidebar-section">
        <h3>Keyboard Shortcuts</h3>
        <div className="shortcuts">
          <div className="shortcut">
            <kbd>Tab</kbd> Add child node
          </div>
          <div className="shortcut">
            <kbd>Enter</kbd> Edit node
          </div>
          <div className="shortcut">
            <kbd>Space</kbd> Fold/unfold
          </div>
          <div className="shortcut">
            <kbd>Delete</kbd> Delete node
          </div>
          <div className="shortcut">
            <kbd>Esc</kbd> Deselect
          </div>
          <div className="shortcut">
            <kbd>Right-click</kbd> Toggle fold
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
