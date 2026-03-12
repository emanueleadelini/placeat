'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  MousePointer,
  PenLine,
  RectangleHorizontal,
  Layers,
  ZoomIn,
  ZoomOut,
  Undo2,
  Redo2,
  MonitorPlay,
  Grid3x3,
  Plus,
  Minus,
  Trash2,
  Maximize2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Dimensioni canvas
const CANVAS_WIDTH = 2000;
const CANVAS_HEIGHT = 2000;

interface Table {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  type: 'rettangolare' | 'rotondo';
  number: number;
  capienza: number;
}

interface Zone {
  id: string;
  path: { x: number; y: number }[];
  nome: string;
  colore: string;
}

const TableComponent = ({ 
  x, y, width, height, rotation, type, number, capienza, selected 
}: Table & { selected: boolean }) => {
  const isRound = type === 'rotondo';
  
  return (
    <g transform={`translate(${x}, ${y}) rotate(${rotation})`} className="cursor-pointer table-group">
      <rect 
        x={-width/2} 
        y={-height/2}
        width={width}
        height={height}
        rx={isRound ? width/2 : 8}
        ry={isRound ? height/2 : 8}
        className="fill-card hover:stroke-primary transition-colors"
        stroke={selected ? 'hsl(var(--primary))' : 'hsl(var(--border))'}
        strokeWidth={selected ? 3 : 2}
      />
      <text textAnchor="middle" dy=".3em" className="fill-foreground font-bold text-base select-none pointer-events-none">
        {number}
      </text>
      <text textAnchor="middle" dy="1.5em" className="fill-muted-foreground font-medium text-xs select-none pointer-events-none">
        {capienza}p
      </text>
      {selected && (
        <>
          <rect x={width/2 - 5} y={height/2 - 5} width="10" height="10" className="fill-primary stroke-primary-foreground stroke-2 resize-handle" cursor="nwse-resize" />
          <g transform={`translate(0, ${-height/2 - 20})`}>
            <line x1="0" y1="0" x2="0" y2="15" className="stroke-primary pointer-events-none" />
            <circle cx="0" cy="0" r="5" className="fill-primary rotate-handle" cursor="grab" />
          </g>
        </>
      )}
    </g>
  );
};

const PropertiesPanel = ({ selectedTable, selectedZone, onUpdateTable, onDeleteTable, onUpdateZone, onDeleteZone }: any) => {
  if (selectedTable) {
    const handleCapacityChange = (amount: number) => {
      const newCapacity = Math.max(1, selectedTable.capienza + amount);
      onUpdateTable(selectedTable.id, { capienza: newCapacity });
    };

    return (
      <div className="absolute top-0 right-0 z-10 bg-card h-full w-64 p-4 border-l shadow-lg">
        <h3 className="font-semibold text-lg mb-6">Proprietà Tavolo</h3>
        <div className="grid gap-4">
          <div>
            <Label htmlFor="table-number">Numero Tavolo</Label>
            <Input 
              id="table-number" 
              type="number" 
              value={selectedTable.number} 
              onChange={(e) => onUpdateTable(selectedTable.id, { number: parseInt(e.target.value) || 1 })} 
            />
          </div>
          <div>
            <Label>Capienza</Label>
            <div className="flex items-center gap-2 mt-1">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleCapacityChange(-1)}>
                <Minus className="h-4 w-4" />
              </Button>
              <span className="font-bold text-lg w-8 text-center">{selectedTable.capienza}</span>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleCapacityChange(1)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div>
            <Label htmlFor="table-type">Forma</Label>
            <Select value={selectedTable.type} onValueChange={(value) => onUpdateTable(selectedTable.id, { type: value })}>
              <SelectTrigger id="table-type">
                <SelectValue placeholder="Seleziona tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rettangolare">Rettangolare</SelectItem>
                <SelectItem value="rotondo">Rotondo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" className="mt-6" onClick={() => onDeleteTable(selectedTable.id)}>
            <Trash2 className="mr-2 h-4 w-4 text-destructive"/>
            <span className="text-destructive">Elimina Tavolo</span>
          </Button>
        </div>
      </div>
    );
  }
  
  if (selectedZone) {
    return (
      <div className="absolute top-0 right-0 z-10 bg-card h-full w-64 p-4 border-l shadow-lg">
        <h3 className="font-semibold text-lg mb-6">Proprietà Zona</h3>
        <div className="grid gap-4">
          <div>
            <Label htmlFor="zone-name">Nome Zona</Label>
            <Input 
              id="zone-name" 
              value={selectedZone.nome} 
              onChange={(e) => onUpdateZone(selectedZone.id, { nome: e.target.value })} 
            />
          </div>
          <div>
            <Label htmlFor="zone-color">Colore</Label>
            <Input 
              id="zone-color" 
              type="color" 
              value={selectedZone.colore.substring(0, 7)} 
              onChange={(e) => onUpdateZone(selectedZone.id, { colore: `${e.target.value}4D` })} 
            />
          </div>
          <Button variant="outline" className="mt-6" onClick={() => onDeleteZone(selectedZone.id)}>
            <Trash2 className="mr-2 h-4 w-4 text-destructive"/>
            <span className="text-destructive">Elimina Zona</span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute top-0 right-0 z-10 bg-card h-full w-64 p-4 border-l flex flex-col items-center justify-center text-center">
      <MousePointer className="w-10 h-10 text-muted-foreground mb-4"/>
      <p className="text-sm text-muted-foreground">Seleziona un elemento per vederne le proprietà.</p>
    </div>
  );
};

export function FloorPlanEditor() {
  const [tool, setTool] = useState('select');
  const [tables, setTables] = useState<Table[]>([]);
  const [walls, setWalls] = useState<{x: number, y:number}[][]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [isDrawingWall, setIsDrawingWall] = useState(false);
  const [newWall, setNewWall] = useState<{x: number, y:number}[] | null>(null);
  const [isDrawingZone, setIsDrawingZone] = useState(false);
  const [newZonePoints, setNewZonePoints] = useState<{x: number, y:number}[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  
  // 🎯 STATO ZOOM E PAN
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 🎯 AUTO-CENTRAGGIO quando ci sono tavoli
  useEffect(() => {
    if (tables.length > 0 && containerRef.current) {
      fitToContent();
    }
  }, [tables.length]);

  // 🎯 FUNZIONE FIT TO CONTENT
  const fitToContent = () => {
    if (tables.length === 0 || !containerRef.current) return;
    
    const padding = 100;
    const xs = tables.map(t => t.x);
    const ys = tables.map(t => t.y);
    const minX = Math.min(...xs) - padding;
    const maxX = Math.max(...xs) + padding;
    const minY = Math.min(...ys) - padding;
    const maxY = Math.max(...ys) + padding;
    
    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;
    
    const containerWidth = containerRef.current.clientWidth - 256; // meno sidebar
    const containerHeight = containerRef.current.clientHeight;
    
    const scaleX = containerWidth / contentWidth;
    const scaleY = containerHeight / contentHeight;
    const newZoom = Math.min(scaleX, scaleY, 1.5);
    
    setZoom(Math.max(0.3, newZoom));
    setPan({
      x: (containerWidth - contentWidth * newZoom) / 2 - minX * newZoom,
      y: (containerHeight - contentHeight * newZoom) / 2 - minY * newZoom
    });
  };

  // 🎯 CONTROLLI ZOOM
  const handleZoomIn = () => setZoom(z => Math.min(z * 1.2, 4));
  const handleZoomOut = () => setZoom(z => Math.max(z / 1.2, 0.3));
  const handleReset = () => { 
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };
  const handleFit = () => fitToContent();

  // 🎯 MOUSE HANDLERS per PAN
  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as SVGElement;
    const isBackground = !target.closest('.table-group') && 
                         !target.closest('.zone-polygon') &&
                         (target.tagName === 'svg' || target.tagName === 'rect');
    
    // Se tool è select e clicco sullo sfondo, inizia il pan
    if (tool === 'select' && isBackground) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      setSelectedElement(null);
      return;
    }
    
    // Altrimenti gestisci il tool normale...
    const pos = getMousePosition(e);
    // ... resto della logica esistente
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // Gestisci pan
    if (isDragging && tool === 'select') {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
      return;
    }
    // ... resto della logica
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    // ... resto
  };

  // 🎯 WHEEL ZOOM
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(z => Math.max(0.3, Math.min(4, z * delta)));
  }, []);

  const getMousePosition = (evt: React.MouseEvent) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const CTM = svg.getScreenCTM();
    if (CTM) {
      return {
        x: (evt.clientX - CTM.e) / CTM.a,
        y: (evt.clientY - CTM.f) / CTM.d
      };
    }
    return { x: 0, y: 0 };
  };

  // ... resto delle funzioni (handleMouseDown extended, updateTable, etc)
  
  const selectedTable = tables.find(t => t.id === selectedElement);
  const selectedZone = zones.find(z => z.id === selectedElement);

  const updateTable = (id: string, updatedProps: Partial<Table>) => {
    setTables(current => current.map(t => t.id === id ? { ...t, ...updatedProps } : t));
  };

  const deleteTable = (id: string) => {
    setTables(current => current.filter(t => t.id !== id));
    setSelectedElement(null);
  };

  const updateZone = (id: string, updatedProps: Partial<Zone>) => {
    setZones(current => current.map(z => z.id === id ? { ...z, ...updatedProps } : z));
  };

  const deleteZone = (id: string) => {
    setZones(current => current.filter(z => z.id !== id));
    setSelectedElement(null);
  };

  return (
    <TooltipProvider>
      <div ref={containerRef} className="w-full h-full bg-muted/30 flex relative overflow-hidden">
        {/* Toolbar Top */}
        <div className="absolute top-2 left-2 z-10 bg-card p-2 rounded-lg shadow-md border flex gap-1">
          <ToggleGroup type="single" value={tool} onValueChange={(value) => value && setTool(value)} size="sm">
            <Tooltip>
              <TooltipTrigger asChild>
                <ToggleGroupItem value="select" aria-label="Select"><MousePointer className="w-4 h-4"/></ToggleGroupItem>
              </TooltipTrigger>
              <TooltipContent>Seleziona (V)</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <ToggleGroupItem value="wall" aria-label="Draw Wall"><PenLine className="w-4 h-4"/></ToggleGroupItem>
              </TooltipTrigger>
              <TooltipContent>Disegna Muro (W)</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <ToggleGroupItem value="table" aria-label="Add Table"><RectangleHorizontal className="w-4 h-4"/></ToggleGroupItem>
              </TooltipTrigger>
              <TooltipContent>Aggiungi Tavolo (T)</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <ToggleGroupItem value="zone" aria-label="Draw Zone"><Layers className="w-4 h-4"/></ToggleGroupItem>
              </TooltipTrigger>
              <TooltipContent>Disegna Zona (Z)</TooltipContent>
            </Tooltip>
          </ToggleGroup>
        </div>

        {/* Toolbar Right */}
        <div className="absolute top-2 right-72 z-10 bg-card p-2 rounded-lg shadow-md border flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8"><Undo2 className="w-4 h-4"/></Button>
            </TooltipTrigger>
            <TooltipContent>Annulla (Ctrl+Z)</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8"><Redo2 className="w-4 h-4"/></Button>
            </TooltipTrigger>
            <TooltipContent>Ripristina (Ctrl+Y)</TooltipContent>
          </Tooltip>
          <div className="w-px h-6 bg-border mx-1"></div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8"><MonitorPlay className="w-4 h-4"/></Button>
            </TooltipTrigger>
            <TooltipContent>Anteprima</TooltipContent>
          </Tooltip>
        </div>

        {/* 🎯 TOOLBAR ZOOM FUNZIONANTE */}
        <div className="absolute bottom-2 left-2 z-10 bg-card p-2 rounded-lg shadow-md border flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomOut}>
                <ZoomOut className="h-4 w-4"/>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoom Out</TooltipContent>
          </Tooltip>
          <span className="text-sm font-medium text-muted-foreground w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomIn}>
                <ZoomIn className="h-4 w-4"/>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoom In</TooltipContent>
          </Tooltip>
          <div className="w-px h-6 bg-border mx-1"></div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleFit}>
                <Maximize2 className="h-4 w-4"/>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Adatta allo schermo</TooltipContent>
          </Tooltip>
        </div>

        <div className="absolute bottom-2 right-72 z-10 bg-card p-2 rounded-lg shadow-md border flex items-center gap-1">
          <ToggleGroup type="multiple" size="sm">
            <Tooltip>
              <TooltipTrigger asChild>
                <ToggleGroupItem value="grid" aria-label="Snap to grid"><Grid3x3 className="w-4 h-4"/></ToggleGroupItem>
              </TooltipTrigger>
              <TooltipContent>Snap to Grid</TooltipContent>
            </Tooltip>
          </ToggleGroup>
        </div>

        {/* 🎯 SVG CON TRANSFORM */}
        <div 
          className="flex-1 overflow-hidden cursor-grab active:cursor-grabbing"
          onWheel={handleWheel}
        >
          <svg 
            ref={svgRef} 
            className="w-full h-full"
            viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
              transition: isDragging ? 'none' : 'transform 0.1s ease-out'
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="hsl(var(--border))" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width={CANVAS_WIDTH} height={CANVAS_HEIGHT} fill="url(#grid)" />
            
            {/* Zones */}
            {zones.map(zone => (
              <polygon
                id={zone.id}
                key={zone.id}
                points={zone.path.map((p: any) => `${p.x},${p.y}`).join(' ')}
                fill={zone.colore}
                stroke={selectedElement === zone.id ? 'hsl(var(--primary))' : zone.colore.replace(/[\d\.]+\)$/, '1)')}
                strokeWidth={selectedElement === zone.id ? 3 : 2}
                className="cursor-pointer zone-polygon"
              />
            ))}

            {/* Preview zone */}
            {isDrawingZone && newZonePoints.length > 0 && (
              <>
                <polyline
                  points={newZonePoints.map(p => `${p.x},${p.y}`).join(' ')}
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />
                {newZonePoints.map((p, i) => (
                  <circle key={i} cx={p.x} cy={p.y} r="4" fill={i === 0 ? "hsl(var(--primary))" : "white"} stroke="hsl(var(--primary))" strokeWidth="2" />
                ))}
              </>
            )}

            {/* Walls */}
            {walls.map((wall, index) => (
              <line key={index} x1={wall[0].x} y1={wall[0].y} x2={wall[1].x} y2={wall[1].y} strokeWidth="10" className="stroke-foreground" strokeLinecap="round" />
            ))}

            {newWall && (
              <line x1={newWall[0].x} y1={newWall[0].y} x2={newWall[1].x} y2={newWall[1].y} strokeWidth="10" className="stroke-primary" strokeLinecap="round" />
            )}

            {/* Tables */}
            {tables.map(table => (
              <g key={table.id} onClick={() => setSelectedElement(table.id)}>
                <TableComponent 
                  {...table}
                  selected={selectedElement === table.id}
                />
              </g>
            ))}
          </svg>
        </div>
        
        <PropertiesPanel 
          selectedTable={selectedTable}
          selectedZone={selectedZone}
          onUpdateTable={updateTable}
          onDeleteTable={deleteTable}
          onUpdateZone={updateZone}
          onDeleteZone={deleteZone}
        />
      </div>
    </TooltipProvider>
  );
}
