import React, { useState, useEffect } from 'react';

const NodeEditor = ({ node, onSave, onCancel, onDelete }) => {
  const [label, setLabel] = useState('');
  const [backgroundColor, setBackgroundColor] = useState('#4a90d9');
  const [textColor, setTextColor] = useState('#ffffff');

  useEffect(() => {
    if (node) {
      setLabel(node.label || '');
      setBackgroundColor(node.backgroundColor || '#4a90d9');
      setTextColor(node.textColor || '#ffffff');
    }
  }, [node]);

  if (!node) return null;

  const handleSave = () => {
    onSave({
      label,
      backgroundColor,
      textColor,
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  const isRoot = node.depth === 0;

  return (
    <div className="node-editor">
      <h3>Edit Node</h3>
      
      <div className="form-group">
        <label htmlFor="node-label">Text</label>
        <textarea
          id="node-label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={3}
          autoFocus
        />
      </div>

      <div className="form-group">
        <label htmlFor="bg-color">Background Color</label>
        <div className="color-input">
          <input
            type="color"
            id="bg-color"
            value={backgroundColor}
            onChange={(e) => setBackgroundColor(e.target.value)}
          />
          <input
            type="text"
            value={backgroundColor}
            onChange={(e) => setBackgroundColor(e.target.value)}
            placeholder="#4a90d9"
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="text-color">Text Color</label>
        <div className="color-input">
          <input
            type="color"
            id="text-color"
            value={textColor}
            onChange={(e) => setTextColor(e.target.value)}
          />
          <input
            type="text"
            value={textColor}
            onChange={(e) => setTextColor(e.target.value)}
            placeholder="#ffffff"
          />
        </div>
      </div>

      <div className="button-group">
        <button className="btn btn-primary" onClick={handleSave}>
          Save
        </button>
        <button className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        {!isRoot && (
          <button className="btn btn-danger" onClick={() => onDelete(node.id)}>
            Delete
          </button>
        )}
      </div>

      <div className="node-info">
        <small>
          ID: {node.id}<br />
          Depth: {node.depth}
          {node.position && <><br />Position: {node.position}</>}
        </small>
      </div>
    </div>
  );
};

export default NodeEditor;
