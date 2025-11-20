import React, { useRef } from 'react';

const Toolbar = ({
  onNew,
  onOpen,
  onSave,
  onExport,
  onAddNode,
  hasSelection,
  fileName,
}) => {
  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        onOpen(e.target.result, file.name);
      };
      reader.readAsText(file);
    }
    // Reset input so same file can be selected again
    event.target.value = '';
  };

  const handleOpenClick = () => {
    fileInputRef.current?.click();
  };

  const handleExport = (format) => {
    onExport(format);
  };

  return (
    <div className="toolbar">
      <div className="toolbar-group">
        <button className="toolbar-btn" onClick={onNew} title="New Mind Map">
          <span className="icon">📄</span>
          <span className="label">New</span>
        </button>
        
        <button className="toolbar-btn" onClick={handleOpenClick} title="Open .mm File">
          <span className="icon">📂</span>
          <span className="label">Open</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".mm"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        
        <button className="toolbar-btn" onClick={onSave} title="Save as .mm">
          <span className="icon">💾</span>
          <span className="label">Save</span>
        </button>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <button
          className="toolbar-btn"
          onClick={() => onAddNode('right')}
          disabled={!hasSelection}
          title="Add Child Node (Right)"
        >
          <span className="icon">➕</span>
          <span className="label">Add Right</span>
        </button>
        
        <button
          className="toolbar-btn"
          onClick={() => onAddNode('left')}
          disabled={!hasSelection}
          title="Add Child Node (Left)"
        >
          <span className="icon">⬅️</span>
          <span className="label">Add Left</span>
        </button>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <div className="dropdown">
          <button className="toolbar-btn" title="Export">
            <span className="icon">📤</span>
            <span className="label">Export</span>
          </button>
          <div className="dropdown-content">
            <button onClick={() => handleExport('mm')}>FreeMind (.mm)</button>
            <button onClick={() => handleExport('json')}>JSON</button>
            <button onClick={() => handleExport('markdown')}>Markdown</button>
          </div>
        </div>
      </div>

      {fileName && (
        <div className="toolbar-filename">
          <span className="icon">📋</span>
          <span>{fileName}</span>
        </div>
      )}
    </div>
  );
};

export default Toolbar;
