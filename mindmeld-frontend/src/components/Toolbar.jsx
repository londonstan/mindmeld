import { 
  FileText, 
  FolderOpen, 
  Save, 
  Download, 
  Plus, 
  ZoomIn, 
  ZoomOut, 
  Maximize2,
  Menu,
  X 
} from 'lucide-react';

export default function Toolbar({ 
  onNew, 
  onOpen, 
  onSave, 
  onExport, 
  onAddNode, 
  onZoomIn, 
  onZoomOut, 
  onFit,
  onMenuToggle,
  isMobileMenuOpen,
  isMobile 
}) {
  
  const ToolButton = ({ icon: Icon, label, onClick, primary, className = '' }) => (
    <button
      onClick={onClick}
      className={`
        ${primary ? 'btn btn-primary' : 'btn btn-secondary'}
        ${isMobile ? 'text-xs' : 'text-sm'}
        flex items-center gap-1.5 sm:gap-2
        ${className}
      `}
      title={label}
    >
      <Icon size={isMobile ? 16 : 18} />
      {!isMobile && <span className="hidden sm:inline">{label}</span>}
    </button>
  );

  return (
    <div className="bg-white border-b border-gray-200 px-3 sm:px-4 py-2 sm:py-3">
      <div className="flex items-center justify-between gap-2">
        {/* Mobile menu button */}
        {isMobile && (
          <button
            onClick={onMenuToggle}
            className="btn-icon md:hidden"
            aria-label="Menu"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        )}
        
        {/* File operations */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <ToolButton icon={FileText} label="New" onClick={onNew} />
          <ToolButton icon={FolderOpen} label="Open" onClick={onOpen} />
          <ToolButton icon={Save} label="Save" onClick={onSave} primary />
          <ToolButton icon={Download} label="Export" onClick={onExport} />
        </div>

        {/* Divider */}
        <div className="hidden sm:block h-6 w-px bg-gray-300" />

        {/* Edit operations */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <ToolButton icon={Plus} label="Add Node" onClick={onAddNode} primary />
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* View controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={onZoomIn}
            className="btn-icon"
            title="Zoom In"
            aria-label="Zoom In"
          >
            <ZoomIn size={isMobile ? 18 : 20} />
          </button>
          <button
            onClick={onZoomOut}
            className="btn-icon"
            title="Zoom Out"
            aria-label="Zoom Out"
          >
            <ZoomOut size={isMobile ? 18 : 20} />
          </button>
          <button
            onClick={onFit}
            className="btn-icon"
            title="Fit to Screen"
            aria-label="Fit to Screen"
          >
            <Maximize2 size={isMobile ? 18 : 20} />
          </button>
        </div>
      </div>
    </div>
  );
}
