import React, { useRef, useEffect, useCallback } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';

const MindMap = ({
  elements,
  onNodeSelect,
  onNodeDoubleClick,
  onNodeMoved,
  onNodeToggleFold,
  selectedNodeId,
}) => {
  const cyRef = useRef(null);

  // Get all descendant node IDs for hiding when collapsed
  const getDescendants = useCallback((nodeId, edges) => {
    const descendants = new Set();
    const queue = [nodeId];
    
    while (queue.length > 0) {
      const current = queue.shift();
      edges.forEach(edge => {
        if (edge.data.source === current && !descendants.has(edge.data.target)) {
          descendants.add(edge.data.target);
          queue.push(edge.data.target);
        }
      });
    }
    
    return descendants;
  }, []);

  // Build set of hidden nodes (descendants of folded nodes)
  const hiddenNodes = useCallback(() => {
    const hidden = new Set();
    elements.nodes.forEach(node => {
      if (node.data.folded) {
        const descendants = getDescendants(node.data.id, elements.edges);
        descendants.forEach(id => hidden.add(id));
      }
    });
    return hidden;
  }, [elements, getDescendants]);

  const hidden = hiddenNodes();

  // Cytoscape stylesheet
  const stylesheet = [
    {
      selector: 'node',
      style: {
        'background-color': (ele) => ele.data('backgroundColor') || '#4a90d9',
        'label': 'data(label)',
        'text-valign': 'center',
        'text-halign': 'center',
        'color': (ele) => ele.data('textColor') || '#ffffff',
        'font-size': '12px',
        'font-weight': 'bold',
        'text-wrap': 'wrap',
        'text-max-width': '120px',
        'width': 'label',
        'height': 'label',
        'padding': '12px',
        'shape': 'roundrectangle',
        'border-width': 2,
        'border-color': '#2c5aa0',
        'text-outline-color': '#2c5aa0',
        'text-outline-width': 1,
      },
    },
    {
      selector: 'node[depth = 0]',
      style: {
        'background-color': '#e74c3c',
        'border-color': '#c0392b',
        'text-outline-color': '#c0392b',
        'font-size': '14px',
        'padding': '16px',
      },
    },
    {
      selector: 'node[?folded]',
      style: {
        'border-style': 'dashed',
        'border-width': 3,
        'border-color': '#27ae60',
      },
    },
    {
      selector: 'node:selected',
      style: {
        'border-width': 4,
        'border-color': '#f39c12',
        'background-color': '#f1c40f',
        'color': '#2c3e50',
        'text-outline-color': '#f39c12',
      },
    },
    {
      selector: 'edge',
      style: {
        'width': 2,
        'line-color': '#7f8c8d',
        'target-arrow-color': '#7f8c8d',
        'target-arrow-shape': 'triangle',
        'curve-style': 'bezier',
        'arrow-scale': 0.8,
      },
    },
    {
      selector: 'edge:selected',
      style: {
        'line-color': '#f39c12',
        'target-arrow-color': '#f39c12',
        'width': 3,
      },
    },
  ];

  // Custom mind map layout - positions nodes horizontally
  const applyLayout = useCallback(() => {
    if (!cyRef.current) return;
    
    const cy = cyRef.current;
    const nodes = cy.nodes();
    const edges = cy.edges();
    
    if (nodes.length === 0) return;
    
    // Build tree structure
    const childrenMap = new Map();
    const parentMap = new Map();
    
    nodes.forEach(node => {
      childrenMap.set(node.id(), []);
    });
    
    edges.forEach(edge => {
      const sourceId = edge.source().id();
      const targetId = edge.target().id();
      const children = childrenMap.get(sourceId) || [];
      children.push(targetId);
      childrenMap.set(sourceId, children);
      parentMap.set(targetId, sourceId);
    });
    
    // Find root (node with no parent)
    let rootId = null;
    nodes.forEach(node => {
      if (!parentMap.has(node.id())) {
        rootId = node.id();
      }
    });
    
    if (!rootId) return;
    
    // Calculate positions
    const positions = new Map();
    const horizontalSpacing = 180;
    const verticalSpacing = 60;
    
    // Position root at center
    positions.set(rootId, { x: 400, y: 300 });
    
    // Separate children into left and right based on position data
    const rootChildren = childrenMap.get(rootId) || [];
    const leftChildren = [];
    const rightChildren = [];
    
    rootChildren.forEach(childId => {
      const node = cy.getElementById(childId);
      const position = node.data('position');
      if (position === 'left') {
        leftChildren.push(childId);
      } else {
        rightChildren.push(childId);
      }
    });
    
    // Position subtree recursively
    const positionSubtree = (nodeId, x, y, direction, level) => {
      positions.set(nodeId, { x, y });
      
      const children = childrenMap.get(nodeId) || [];
      if (children.length === 0) return 1;
      
      let totalHeight = 0;
      const childHeights = [];
      
      // First pass: calculate heights
      children.forEach(childId => {
        const height = countDescendants(childId, childrenMap);
        childHeights.push(height);
        totalHeight += height;
      });
      
      // Second pass: position children
      let currentY = y - ((totalHeight - 1) * verticalSpacing) / 2;
      
      children.forEach((childId, index) => {
        const childX = x + (direction * horizontalSpacing);
        const childHeight = childHeights[index];
        const childY = currentY + ((childHeight - 1) * verticalSpacing) / 2;
        
        positionSubtree(childId, childX, childY, direction, level + 1);
        currentY += childHeight * verticalSpacing;
      });
      
      return totalHeight;
    };
    
    // Count descendants for spacing calculation
    const countDescendants = (nodeId, childrenMap) => {
      const children = childrenMap.get(nodeId) || [];
      if (children.length === 0) return 1;
      
      let count = 0;
      children.forEach(childId => {
        count += countDescendants(childId, childrenMap);
      });
      return Math.max(count, 1);
    };
    
    // Position right side
    let rightY = 300;
    if (rightChildren.length > 0) {
      let totalRight = 0;
      rightChildren.forEach(id => {
        totalRight += countDescendants(id, childrenMap);
      });
      
      let currentY = 300 - ((totalRight - 1) * verticalSpacing) / 2;
      rightChildren.forEach(childId => {
        const height = countDescendants(childId, childrenMap);
        const childY = currentY + ((height - 1) * verticalSpacing) / 2;
        positionSubtree(childId, 400 + horizontalSpacing, childY, 1, 1);
        currentY += height * verticalSpacing;
      });
    }
    
    // Position left side
    if (leftChildren.length > 0) {
      let totalLeft = 0;
      leftChildren.forEach(id => {
        totalLeft += countDescendants(id, childrenMap);
      });
      
      let currentY = 300 - ((totalLeft - 1) * verticalSpacing) / 2;
      leftChildren.forEach(childId => {
        const height = countDescendants(childId, childrenMap);
        const childY = currentY + ((height - 1) * verticalSpacing) / 2;
        positionSubtree(childId, 400 - horizontalSpacing, childY, -1, 1);
        currentY += height * verticalSpacing;
      });
    }
    
    // Apply positions with animation
    nodes.forEach(node => {
      const pos = positions.get(node.id());
      if (pos) {
        node.animate({
          position: pos,
          duration: 300,
          easing: 'ease-out'
        });
      }
    });
    
    // Fit to viewport after animation
    setTimeout(() => {
      cy.fit(50);
    }, 350);
  }, []);

  // Set up event handlers
  useEffect(() => {
    if (!cyRef.current) return;

    const cy = cyRef.current;

    // Node selection
    cy.on('tap', 'node', (evt) => {
      const node = evt.target;
      if (onNodeSelect) {
        onNodeSelect(node.data());
      }
    });

    // Double-click for editing
    cy.on('dbltap', 'node', (evt) => {
      const node = evt.target;
      if (onNodeDoubleClick) {
        onNodeDoubleClick(node.data());
      }
    });

    // Right-click for fold/unfold
    cy.on('cxttap', 'node', (evt) => {
      evt.originalEvent.preventDefault();
      const node = evt.target;
      if (onNodeToggleFold) {
        onNodeToggleFold(node.data().id);
      }
    });

    // Node drag end
    cy.on('dragfree', 'node', (evt) => {
      const node = evt.target;
      if (onNodeMoved) {
        onNodeMoved(node.data().id, node.position());
      }
    });

    // Background click to deselect
    cy.on('tap', (evt) => {
      if (evt.target === cy) {
        if (onNodeSelect) {
          onNodeSelect(null);
        }
      }
    });

    // Apply initial layout
    setTimeout(() => {
      applyLayout();
    }, 100);

    return () => {
      cy.removeAllListeners();
    };
  }, [onNodeSelect, onNodeDoubleClick, onNodeMoved, onNodeToggleFold, applyLayout]);

  // Update selection when selectedNodeId changes
  useEffect(() => {
    if (!cyRef.current) return;
    
    const cy = cyRef.current;
    cy.nodes().unselect();
    
    if (selectedNodeId) {
      const node = cy.getElementById(selectedNodeId);
      if (node.length) {
        node.select();
      }
    }
  }, [selectedNodeId]);

  // Re-layout when elements change significantly (nodes added/removed or fold state changes)
  const prevNodeCount = useRef(elements.nodes.length);
  const prevHiddenCount = useRef(hidden.size);
  
  useEffect(() => {
    if (cyRef.current && elements.nodes.length > 0) {
      // Only re-layout if node count or hidden count changed
      if (elements.nodes.length !== prevNodeCount.current || 
          hidden.size !== prevHiddenCount.current) {
        setTimeout(() => {
          applyLayout();
        }, 50);
        prevNodeCount.current = elements.nodes.length;
        prevHiddenCount.current = hidden.size;
      }
    }
  }, [elements.nodes.length, hidden.size, applyLayout]);

  // Convert elements to Cytoscape format, filtering hidden nodes
  const cyElements = [
    ...elements.nodes
      .filter(n => !hidden.has(n.data.id))
      .map((n) => ({ group: 'nodes', ...n })),
    ...elements.edges
      .filter(e => !hidden.has(e.data.source) && !hidden.has(e.data.target))
      .map((e) => ({ group: 'edges', ...e })),
  ];

  return (
    <div className="mindmap-container">
      <CytoscapeComponent
        elements={cyElements}
        stylesheet={stylesheet}
        style={{ width: '100%', height: '100%' }}
        cy={(cy) => {
          cyRef.current = cy;
        }}
        boxSelectionEnabled={false}
        autounselectify={false}
        userZoomingEnabled={true}
        userPanningEnabled={true}
        minZoom={0.3}
        maxZoom={3}
      />
    </div>
  );
};

export default MindMap;
