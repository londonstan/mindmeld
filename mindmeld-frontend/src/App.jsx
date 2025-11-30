import { useState, useEffect } from 'react';
import MindMap from './components/MindMap';
import Toolbar from './components/Toolbar';
import Sidebar from './components/Sidebar';
import NodeEditor from './components/NodeEditor';
import { parseFreeMindXML, buildFreeMindXML, createEmptyMindMap } from './utils/freemindParser';

function App() {
  const [elements, setElements] = useState({ nodes: [], edges: [] });
  const [selectedNode, setSelectedNode] = useState(null);
  const [editingNode, setEditingNode] = useState(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [fileName, setFileName] = useState('untitled.mm');

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initialize with empty mind map
  useEffect(() => {
    const empty = createEmptyMindMap('My Mind Map');
    setElements(empty);
  }, []);

  // File operations
  const handleNew = () => {
    if (confirm('Create a new mind map? Unsaved changes will be lost.')) {
      const title = prompt('Enter mind map title:', 'New Mind Map');
      if (title) {
        const empty = createEmptyMindMap(title);
        setElements(empty);
        setFileName('untitled.mm');
      }
    }
  };

  const handleOpen = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.mm';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const parsed = parseFreeMindXML(event.target.result);
            setElements(parsed);
            setFileName(file.name);
          } catch (error) {
            alert('Error parsing file: ' + error.message);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleSave = () => {
    try {
      const xml = buildFreeMindXML(elements.nodes, elements.edges);
      const blob = new Blob([xml], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('Error saving file: ' + error.message);
    }
  };

  const handleExport = () => {
    const format = prompt('Export as:\n1. XML (.mm)\n2. JSON\n\nEnter 1 or 2:', '1');
    
    try {
      if (format === '1') {
        handleSave();
      } else if (format === '2') {
        const json = JSON.stringify(elements, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName.replace('.mm', '.json');
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      alert('Error exporting: ' + error.message);
    }
  };

  // Node operations
  const handleAddNode = () => {
    const parentId = selectedNode?.id || 'root';
    const text = prompt('Enter node text:', 'New Node');
    
    if (text) {
      const newNodeId = `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const newNode = {
        data: {
          id: newNodeId,
          label: text,
          color: null,
          backgroundColor: '#e0f2fe',
          position: 'right',
        }
      };
      
      const newEdge = {
        data: {
          id: `${parentId}-${newNodeId}`,
          source: parentId,
          target: newNodeId,
        }
      };
      
      setElements({
        nodes: [...elements.nodes, newNode],
        edges: [...elements.edges, newEdge],
      });
    }
  };

  const handleNodeEdit = (node) => {
    setEditingNode(node);
    setIsEditorOpen(true);
  };

  const handleNodeSave = (updatedNode) => {
    setElements({
      nodes: elements.nodes.map(n => 
        n.data.id === updatedNode.id 
          ? { data: { ...n.data, ...updatedNode } }
          : n
      ),
      edges: elements.edges,
    });
  };

  const handleNodeDelete = (nodeId) => {
    // Find all descendant nodes
    const nodesToDelete = new Set([nodeId]);
    let changed = true;
    
    while (changed) {
      changed = false;
      elements.edges.forEach(edge => {
        if (nodesToDelete.has(edge.data.source) && !nodesToDelete.has(edge.data.target)) {
          nodesToDelete.add(edge.data.target);
          changed = true;
        }
      });
    }
    
    setElements({
      nodes: elements.nodes.filter(n => !nodesToDelete.has(n.data.id)),
      edges: elements.edges.filter(e => 
        !nodesToDelete.has(e.data.source) && !nodesToDelete.has(e.data.target)
      ),
    });
  };

  // View operations
  const handleZoomIn = () => {
    if (window.cyInstance) {
      window.cyInstance.zoom(window.cyInstance.zoom() * 1.2);
    }
  };

  const handleZoomOut = () => {
    if (window.cyInstance) {
      window.cyInstance.zoom(window.cyInstance.zoom() / 1.2);
    }
  };

  const handleFit = () => {
    if (window.mindMapFit) {
      window.mindMapFit();
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Toolbar */}
      <Toolbar
        onNew={handleNew}
        onOpen={handleOpen}
        onSave={handleSave}
        onExport={handleExport}
        onAddNode={handleAddNode}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onFit={handleFit}
        onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        isMobileMenuOpen={isSidebarOpen}
        isMobile={isMobile}
      />

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {(!isMobile || isSidebarOpen) && (
          <Sidebar
            elements={elements}
            onNodeSelect={(node) => {
              setSelectedNode(node);
              if (window.mindMapCenter) {
                window.mindMapCenter(node.id);
              }
              if (isMobile) {
                setIsSidebarOpen(false);
              }
            }}
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            isMobile={isMobile}
          />
        )}

        {/* Mind map */}
        <div className="flex-1 relative">
          <MindMap
            elements={elements}
            onNodeSelect={setSelectedNode}
            onNodeAdd={handleAddNode}
            onNodeEdit={handleNodeEdit}
            onNodeDelete={handleNodeDelete}
          />
          
          {/* Floating action button for mobile */}
          {isMobile && (
            <button
              onClick={handleAddNode}
              className="fixed bottom-6 right-6 w-14 h-14 bg-primary-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-primary-700 transition-colors z-20"
              aria-label="Add Node"
            >
              <span className="text-2xl leading-none">+</span>
            </button>
          )}
        </div>
      </div>

      {/* Node editor modal */}
      <NodeEditor
        node={editingNode}
        onSave={handleNodeSave}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingNode(null);
        }}
        isOpen={isEditorOpen}
      />
    </div>
  );
}

export default App;
