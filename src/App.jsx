import React, { useState, useCallback, useEffect } from 'react';
import MindMap from './components/MindMap';
import Toolbar from './components/Toolbar';
import Sidebar from './components/Sidebar';
import {
  parseMMToElements,
  elementsToMM,
  createNewMindMap,
  addNode,
  deleteNode,
  updateNode,
  exportToJSON,
  exportToMarkdown,
} from './utils/mmParser';
import './App.css';

function App() {
  const [elements, setElements] = useState(() => createNewMindMap('My Mind Map'));
  const [selectedNode, setSelectedNode] = useState(null);
  const [fileName, setFileName] = useState(null);
  const [message, setMessage] = useState(null);

  // Show temporary message
  const showMessage = (text, type = 'info') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  // Handle new mind map
  const handleNew = () => {
    const title = prompt('Enter title for new mind map:', 'New Mind Map');
    if (title) {
      setElements(createNewMindMap(title));
      setSelectedNode(null);
      setFileName(null);
      showMessage('Created new mind map', 'success');
    }
  };

  // Handle open file
  const handleOpen = (content, name) => {
    try {
      const parsed = parseMMToElements(content);
      setElements(parsed);
      setFileName(name);
      setSelectedNode(null);
      showMessage(`Opened ${name}`, 'success');
    } catch (error) {
      showMessage(`Error opening file: ${error.message}`, 'error');
    }
  };

  // Handle save
  const handleSave = () => {
    try {
      const mmContent = elementsToMM(elements);
      const blob = new Blob([mmContent], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || 'mindmap.mm';
      a.click();
      URL.revokeObjectURL(url);
      showMessage('Mind map saved', 'success');
    } catch (error) {
      showMessage(`Error saving: ${error.message}`, 'error');
    }
  };

  // Handle export
  const handleExport = (format) => {
    try {
      let content, mimeType, extension;

      switch (format) {
        case 'mm':
          content = elementsToMM(elements);
          mimeType = 'application/xml';
          extension = 'mm';
          break;
        case 'json':
          content = exportToJSON(elements);
          mimeType = 'application/json';
          extension = 'json';
          break;
        case 'markdown':
          content = exportToMarkdown(elements);
          mimeType = 'text/markdown';
          extension = 'md';
          break;
        default:
          throw new Error(`Unknown format: ${format}`);
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const baseName = fileName?.replace('.mm', '') || 'mindmap';
      a.download = `${baseName}.${extension}`;
      a.click();
      URL.revokeObjectURL(url);
      showMessage(`Exported as ${extension.toUpperCase()}`, 'success');
    } catch (error) {
      showMessage(`Error exporting: ${error.message}`, 'error');
    }
  };

  // Handle add node
  const handleAddNode = (position) => {
    if (!selectedNode) {
      showMessage('Select a node first', 'warning');
      return;
    }

    const text = prompt('Enter node text:', 'New Node');
    if (text) {
      const result = addNode(elements, selectedNode.id, text, position);
      setElements({ nodes: result.nodes, edges: result.edges });
      
      // Select the new node
      const newNode = result.nodes.find((n) => n.data.id === result.newNodeId);
      if (newNode) {
        setSelectedNode(newNode.data);
      }
      showMessage('Node added', 'success');
    }
  };

  // Handle node selection
  const handleNodeSelect = useCallback((nodeData) => {
    setSelectedNode(nodeData);
  }, []);

  // Handle node double-click (edit)
  const handleNodeDoubleClick = useCallback((nodeData) => {
    setSelectedNode(nodeData);
    // Focus will be handled by NodeEditor
  }, []);

  // Handle node update
  const handleNodeUpdate = (nodeId, updates) => {
    const newElements = updateNode(elements, nodeId, updates);
    setElements(newElements);
    
    // Update selected node with new data
    const updatedNode = newElements.nodes.find((n) => n.data.id === nodeId);
    if (updatedNode) {
      setSelectedNode(updatedNode.data);
    }
    showMessage('Node updated', 'success');
  };

  // Handle node delete
  const handleNodeDelete = (nodeId) => {
    if (confirm('Delete this node and all its children?')) {
      const newElements = deleteNode(elements, nodeId);
      setElements(newElements);
      setSelectedNode(null);
      showMessage('Node deleted', 'success');
    }
  };

  // Handle node fold/unfold toggle
  const handleNodeToggleFold = (nodeId) => {
    const node = elements.nodes.find(n => n.data.id === nodeId);
    if (node) {
      const newElements = updateNode(elements, nodeId, { folded: !node.data.folded });
      setElements(newElements);
      
      // Update selected node if it's the one being toggled
      if (selectedNode?.id === nodeId) {
        const updatedNode = newElements.nodes.find(n => n.data.id === nodeId);
        if (updatedNode) {
          setSelectedNode(updatedNode.data);
        }
      }
      showMessage(node.data.folded ? 'Node expanded' : 'Node collapsed', 'info');
    }
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if typing in input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      switch (e.key) {
        case 'Tab':
          e.preventDefault();
          if (selectedNode) {
            handleAddNode('right');
          }
          break;
        case 'Delete':
        case 'Backspace':
          if (selectedNode && selectedNode.depth !== 0) {
            e.preventDefault();
            handleNodeDelete(selectedNode.id);
          }
          break;
        case ' ':
          if (selectedNode) {
            e.preventDefault();
            handleNodeToggleFold(selectedNode.id);
          }
          break;
        case 'Escape':
          setSelectedNode(null);
          break;
        case 's':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleSave();
          }
          break;
        case 'n':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleNew();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNode, elements]);

  return (
    <div className="app">
      <Toolbar
        onNew={handleNew}
        onOpen={handleOpen}
        onSave={handleSave}
        onExport={handleExport}
        onAddNode={handleAddNode}
        hasSelection={!!selectedNode}
        fileName={fileName}
      />
      
      <div className="main-content">
        <div className="mindmap-panel">
          <MindMap
            elements={elements}
            onNodeSelect={handleNodeSelect}
            onNodeDoubleClick={handleNodeDoubleClick}
            onNodeToggleFold={handleNodeToggleFold}
            selectedNodeId={selectedNode?.id}
          />
        </div>
        
        <Sidebar
          selectedNode={selectedNode}
          elements={elements}
          onNodeUpdate={handleNodeUpdate}
          onNodeDelete={handleNodeDelete}
          onNodeSelect={handleNodeSelect}
          onEditCancel={() => setSelectedNode(null)}
        />
      </div>

      {message && (
        <div className={`message message-${message.type}`}>
          {message.text}
        </div>
      )}
    </div>
  );
}

export default App
