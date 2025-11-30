# MindMeld Frontend

Responsive web interface for MindMeld mind mapping application.

## Features

✨ **Responsive Design**
- Mobile-first approach
- Works on phones, tablets, and desktops
- Touch-friendly controls
- Adaptive layouts

🎨 **Modern UI**
- Built with React 18 + Vite
- Styled with Tailwind CSS
- Smooth animations and transitions
- Dark mode ready

📊 **Mind Mapping**
- Interactive graph visualization with Cytoscape.js
- Drag and drop nodes
- Expand/collapse branches
- Context menus (desktop)
- Touch gestures (mobile)

💾 **File Operations**
- Open FreeMind .mm files
- Save as .mm format
- Export to JSON
- Auto-save (coming soon)

## Quick Start

### Development Mode

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

Visit `http://localhost:3000`

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

### Docker Deployment

```bash
# Build Docker image
docker build -t mindmeld-frontend .

# Run container
docker run -p 8080:80 mindmeld-frontend
```

Visit `http://localhost:8080`

## Project Structure

```
mindmeld-frontend/
├── src/
│   ├── components/
│   │   ├── MindMap.jsx       # Cytoscape graph component
│   │   ├── Toolbar.jsx       # Top toolbar with actions
│   │   ├── Sidebar.jsx       # Tree view (responsive drawer)
│   │   └── NodeEditor.jsx    # Node editing modal
│   ├── utils/
│   │   └── freemindParser.js # FreeMind XML parser
│   ├── App.jsx               # Main app component
│   ├── main.jsx              # Entry point
│   └── index.css             # Global styles
├── public/                   # Static assets
├── index.html                # HTML template
├── vite.config.js            # Vite configuration
├── tailwind.config.js        # Tailwind CSS config
└── package.json              # Dependencies
```

## Responsive Breakpoints

- **Mobile:** < 768px (xs, sm)
- **Tablet:** 768px - 1024px (md)
- **Desktop:** > 1024px (lg, xl, 2xl)

### Mobile Features

- Hamburger menu for sidebar
- Floating action button for adding nodes
- Touch-optimized node sizes
- Swipe gestures
- Bottom sheet modals

### Desktop Features

- Persistent sidebar
- Context menus (right-click)
- Keyboard shortcuts
- Larger interactive areas

## Usage

### Creating a Mind Map

1. Click "New" to create a blank mind map
2. Enter a title
3. Click "Add Node" or use the (+) button
4. Select parent node and add children

### Editing Nodes

**Desktop:**
- Right-click a node → "Edit Node"
- Or double-click a node

**Mobile:**
- Tap a node to select
- Tap again to edit

### Navigation

**Desktop:**
- Mouse wheel to zoom
- Click and drag to pan
- Click "Fit" to center

**Mobile:**
- Pinch to zoom
- Two-finger drag to pan
- Tap "Fit" button

### File Operations

1. **Open:** Click "Open" → Select .mm file
2. **Save:** Click "Save" → Downloads .mm file
3. **Export:** Click "Export" → Choose format

## Keyboard Shortcuts (Desktop)

- `Ctrl+N` - New mind map
- `Ctrl+O` - Open file
- `Ctrl+S` - Save file
- `Ctrl+E` - Export
- `Insert` - Add node
- `Delete` - Delete selected node
- `Ctrl++` - Zoom in
- `Ctrl+-` - Zoom out
- `Ctrl+0` - Fit to screen

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Technologies

- **React 18** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Cytoscape.js** - Graph visualization
- **Lucide React** - Icons
- **fast-xml-parser** - FreeMind XML parsing

## Performance

- Lazy loading for large mind maps
- Virtual scrolling in tree view
- Optimized re-renders
- Efficient graph layouts

## Accessibility

- ARIA labels on interactive elements
- Keyboard navigation
- Screen reader support
- High contrast mode compatible

## Troubleshooting

**Issue:** White screen on load
- Check browser console for errors
- Clear cache and reload
- Try in incognito mode

**Issue:** Can't zoom on mobile
- Make sure touch events aren't blocked
- Try two-finger pinch gesture

**Issue:** File won't open
- Verify it's a valid .mm file
- Check file isn't corrupted
- Try a different file

## Contributing

This is part of the larger MindMeld project. See main project README for contribution guidelines.

## License

MIT
