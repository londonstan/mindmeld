import { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';
import cola from 'cytoscape-cola';
import contextMenus from 'cytoscape-context-menus';
import 'cytoscape-context-menus/cytoscape-context-menus.css';

// Register extensions
cytoscape.use(cola);
cytoscape.use(contextMenus);

export default function MindMap({ elements, onNodeSelect, onNodeAdd, onNodeEdit, onNodeDelete }) {
  const containerRef = useRef(null);
  const cyRef = useRef(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (cyRef.current) {
        cyRef.current.resize();
        cyRef.current.fit(undefined, 50);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const cy = cytoscape({
      container: containerRef.current,
      elements: elements,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': 'data(backgroundColor)',
            'label': 'data(label)',
            'text-valign': 'center',
            'text-halign': 'center',
            'font-size': isMobile ? '12px' : '14px',
            'font-weight': '500',
            'color': '#1f2937',
            'text-wrap': 'wrap',
            'text-max-width': isMobile ? '100px' : '150px',
            'width': isMobile ? '60px' : '80px',
            'height': isMobile ? '60px' : '80px',
            'border-width': 2,
            'border-color': '#e5e7eb',
            'padding': isMobile ? '8px' : '12px',
          }
        },
        {
          selector: 'node[id = "root"]',
          style: {
            'background-color': '#3b82f6',
            'color': '#ffffff',
            'font-weight': '700',
            'font-size': isMobile ? '14px' : '16px',
            'width': isMobile ? '80px' : '100px',
            'height': isMobile ? '80px' : '100px',
            'border-color': '#2563eb',
          }
        },
        {
          selector: 'node:selected',
          style: {
            'border-width': 3,
            'border-color': '#3b82f6',
            'background-color': '#dbeafe',
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 2,
            'line-color': '#9ca3af',
            'target-arrow-color': '#9ca3af',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
          }
        },
      ],
      layout: {
        name: 'cola',
        animate: true,
        randomize: false,
        maxSimulationTime: 2000,
        nodeDimensionsIncludeLabels: true,
        edgeLength: isMobile ? 80 : 120,
        nodeSpacing: isMobile ? 30 : 50,
      },
      minZoom: 0.3,
      maxZoom: 3,
      wheelSensitivity: isMobile ? 0.1 : 0.2,
    });

    cyRef.current = cy;

    // Node selection
    cy.on('tap', 'node', (evt) => {
      const node = evt.target;
      if (onNodeSelect) {
        onNodeSelect({
          id: node.data('id'),
          label: node.data('label'),
          color: node.data('color'),
          backgroundColor: node.data('backgroundColor'),
        });
      }
    });

    // Context menu for desktop
    if (!isMobile) {
      cy.contextMenus({
        menuItems: [
          {
            id: 'add-child',
            content: 'Add Child Node',
            selector: 'node',
            onClickFunction: (event) => {
              const node = event.target;
              if (onNodeAdd) {
                onNodeAdd(node.data('id'));
              }
            }
          },
          {
            id: 'edit',
            content: 'Edit Node',
            selector: 'node',
            onClickFunction: (event) => {
              const node = event.target;
              if (onNodeEdit) {
                onNodeEdit({
                  id: node.data('id'),
                  label: node.data('label'),
                  color: node.data('color'),
                  backgroundColor: node.data('backgroundColor'),
                });
              }
            }
          },
          {
            id: 'delete',
            content: 'Delete Node',
            selector: 'node[id != "root"]',
            onClickFunction: (event) => {
              const node = event.target;
              if (onNodeDelete && confirm(`Delete "${node.data('label')}"?`)) {
                onNodeDelete(node.data('id'));
              }
            }
          },
        ]
      });
    }

    // Fit on load
    setTimeout(() => {
      cy.fit(undefined, 50);
    }, 100);

    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
      }
    };
  }, [elements, onNodeSelect, onNodeAdd, onNodeEdit, onNodeDelete, isMobile]);

  // Public methods
  useEffect(() => {
    if (window) {
      window.mindMapFit = () => {
        if (cyRef.current) {
          cyRef.current.fit(undefined, 50);
        }
      };

      window.mindMapCenter = (nodeId) => {
        if (cyRef.current) {
          const node = cyRef.current.getElementById(nodeId);
          if (node) {
            cyRef.current.center(node);
            cyRef.current.zoom(1.5);
          }
        }
      };
    }
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="cy-container w-full h-full"
      style={{ touchAction: 'none' }}
    />
  );
}
