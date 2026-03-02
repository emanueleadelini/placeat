'use client';
import { useState, useRef } from 'react';
import {
  MousePointer,
  PenLine,
  RectangleHorizontal,
  Layers,
  ZoomIn,
  ZoomOut,
  Undo2,
  Redo2,
  Save,
  MonitorPlay,
  Grid3x3,
  Users,
  Hash,
  Plus,
  Minus,
  Trash2,
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


const Table = ({ x, y, width, height, rotation, type, number, capienza, selected }: any) => {
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
        className="fill-card hover:stroke-primary"
        stroke={selected ? 'hsl(var(--primary))' : 'hsl(var(--border))'}
        strokeWidth={selected ? 2 : 1}
      />
      <text textAnchor="middle" dy=".3em" className="fill-foreground font-bold text-base select-none pointer-events-none">
        {number}
      </text>
       <text textAnchor="middle" dy="1.5em" className="fill-muted-foreground font-medium text-xs select-none pointer-events-none">
        {capienza} posti
      </text>
      {selected && (
        <>
            {/* Resize handle */}
            <rect x={width/2 - 5} y={height/2 - 5} width="10" height="10" className="fill-primary stroke-primary-foreground stroke-2" cursor="nwse-resize" />
            {/* Rotate handle */}
            <g transform={`translate(0, ${-height/2 - 15})`}>
                <line x1="0" y1="0" x2="0" y2="10" className="stroke-primary" />
                <circle cx="0" cy="0" r="5" className="fill-primary" cursor="grab" />
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

        const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const { name, value } = e.target;
            onUpdateTable(selectedTable.id, { [name]: name === 'numero' ? parseInt(value) || '' : value });
        };
        
        const handleSelectChange = (value: string) => {
            onUpdateTable(selectedTable.id, { tipo: value });
        };
        return (
            <div className="absolute top-0 right-0 z-10 bg-card h-full w-64 p-4 border-l shadow-lg">
                <h3 className="font-semibold text-lg mb-6">Proprietà Tavolo</h3>
                <div className="grid gap-4">
                    <div>
                        <Label htmlFor="table-number">Numero Tavolo</Label>
                        <Input id="table-number" name="numero" type="number" value={selectedTable.numero} onChange={handleInputChange} />
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
                         <Select value={selectedTable.tipo} onValueChange={handleSelectChange}>
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
                        <Input id="zone-name" name="nome" value={selectedZone.nome} onChange={(e) => onUpdateZone(selectedZone.id, { nome: e.target.value })} />
                    </div>
                    <div>
                        <Label htmlFor="zone-color">Colore</Label>
                        <Input id="zone-color" name="colore" type="color" value={selectedZone.colore.substring(0, 7)} onChange={(e) => onUpdateZone(selectedZone.id, { colore: `${e.target.value}4D` })} />
                    </div>
                    <Button variant="outline" className="mt-6" onClick={() => onDeleteZone(selectedZone.id)}>
                        <Trash2 className="mr-2 h-4 w-4 text-destructive"/>
                        <span className="text-destructive">Elimina Zona</span>
                    </Button>
                </div>
            </div>
        )
    }

    return (
         <div className="absolute top-0 right-0 z-10 bg-card h-full w-64 p-4 border-l flex flex-col items-center justify-center text-center">
            <MousePointer className="w-10 h-10 text-muted-foreground mb-4"/>
            <p className="text-sm text-muted-foreground">Seleziona un elemento per vederne le proprietà.</p>
            <p className="text-xs text-muted-foreground mt-4 pt-4 border-t w-full">
                Per creare una zona, seleziona <Layers className="inline w-3 h-3"/>, clicca sulla tela per aggiungere punti e fai doppio click per finire.
            </p>
        </div>
    )
};


export function FloorPlanEditor() {
    const [tool, setTool] = useState('select');
    const [tables, setTables] = useState<any[]>([]);
    const [walls, setWalls] = useState<{x: number, y:number}[][]>([]);
    const [zones, setZones] = useState<any[]>([]);
    const [isDrawingWall, setIsDrawingWall] = useState(false);
    const [newWall, setNewWall] = useState<{x: number, y:number}[] | null>(null);
    const [isDrawingZone, setIsDrawingZone] = useState(false);
    const [newZonePoints, setNewZonePoints] = useState<{x: number, y:number}[]>([]);
    const [selectedElement, setSelectedElement] = useState<string | null>(null);
    const svgRef = useRef<SVGSVGElement>(null);

    const [interaction, setInteraction] = useState({
        type: 'none',
        id: null as string | null,
        offsetX: 0,
        offsetY: 0,
    });

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

    const handleMouseDown = (e: React.MouseEvent) => {
        const pos = getMousePosition(e);
        const target = e.target as SVGElement;

        if (tool === 'select') {
            const tableGroup = target.closest('.table-group');
            if (tableGroup) {
                const id = tableGroup.id;
                setSelectedElement(id);
                const table = tables.find(t => t.id === id);
                if (table) {
                    setInteraction({
                        type: 'move-table',
                        id: id,
                        offsetX: pos.x - table.x,
                        offsetY: pos.y - table.y,
                    });
                }
                return;
            }

            const zonePolygon = target.closest('.zone-polygon');
            if (zonePolygon) {
                setSelectedElement(zonePolygon.id);
                return;
            }
        }
        
        // If clicking on background
        if (target === e.currentTarget) {
            if (tool === 'select') {
                setSelectedElement(null);
            } else if (tool === 'wall') {
                setIsDrawingWall(true);
                setNewWall([{ ...pos }, { ...pos }]);
            } else if (tool === 'table') {
                const newTable = {
                    id: `table-${Date.now()}`,
                    x: pos.x,
                    y: pos.y,
                    width: 80,
                    height: 80,
                    rotation: 0,
                    type: 'rettangolare',
                    number: tables.length + 1,
                    capienza: 4,
                };
                setTables(prev => [...prev, newTable]);
                setSelectedElement(newTable.id);
                setTool('select');
            } else if (tool === 'zone') {
                setIsDrawingZone(true);
                setNewZonePoints(prev => [...prev, pos]);
            }
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        const pos = getMousePosition(e);
        
        if (isDrawingWall && tool === 'wall' && newWall) {
            setNewWall([newWall[0], { ...pos }]);
        } else if (interaction.type === 'move-table' && interaction.id) {
            setTables(currentTables => 
                currentTables.map(t => 
                    t.id === interaction.id 
                        ? { ...t, x: pos.x - interaction.offsetX, y: pos.y - interaction.offsetY } 
                        : t
                )
            );
        }
    };

    const handleMouseUp = (e: React.MouseEvent) => {
        if (interaction.type !== 'none') {
            setInteraction({ type: 'none', id: null, offsetX: 0, offsetY: 0 });
        }

        if (isDrawingWall && tool === 'wall' && newWall) {
            setIsDrawingWall(false);
            const dx = newWall[1].x - newWall[0].x;
            const dy = newWall[1].y - newWall[0].y;
            if (Math.sqrt(dx*dx + dy*dy) > 5) {
                setWalls(prevWalls => [...prevWalls, newWall]);
            }
            setNewWall(null);
        }
    };

    const handleDoubleClick = (e: React.MouseEvent) => {
        if (tool === 'zone' && isDrawingZone && newZonePoints.length > 2) {
            setIsDrawingZone(false);
            const newZone = {
                id: `zone-${Date.now()}`,
                path: newZonePoints,
                nome: `Zona ${zones.length + 1}`,
                colore: '#80b3ff4D',
            };
            setZones(prev => [...prev, newZone]);
            setNewZonePoints([]);
            setSelectedElement(newZone.id);
            setTool('select');
        }
    }
    
    const selectedTable = tables.find(t => t.id === selectedElement);
    const selectedZone = zones.find(z => z.id === selectedElement);

    const updateTable = (id: string, updatedProps: any) => {
        setTables(currentTables => 
            currentTables.map(t => t.id === id ? { ...t, ...updatedProps } : t)
        );
    };

    const deleteTable = (id: string) => {
        setTables(currentTables => currentTables.filter(t => t.id !== id));
        setSelectedElement(null);
    }

    const updateZone = (id: string, updatedProps: any) => {
        setZones(currentZones => 
            currentZones.map(z => z.id === id ? { ...z, ...updatedProps } : z)
        );
    };

    const deleteZone = (id: string) => {
        setZones(currentZones => currentZones.filter(z => z.id !== id));
        setSelectedElement(null);
    }
  
  return (
    <TooltipProvider>
    <div className="w-full h-full bg-muted/30 flex relative overflow-hidden">
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


       <div className="absolute bottom-2 left-2 z-10 bg-card p-2 rounded-lg shadow-md border flex items-center gap-1">
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8"><ZoomOut className="w-4 h-4"/></Button>
                </TooltipTrigger>
                <TooltipContent>Zoom Out</TooltipContent>
            </Tooltip>
            <span className="text-sm font-medium text-muted-foreground">100%</span>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8"><ZoomIn className="w-4 h-4"/></Button>
                </TooltipTrigger>
                <TooltipContent>Zoom In</TooltipContent>
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

      <svg ref={svgRef} className="flex-1" viewBox="0 0 2000 2000" onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onDoubleClick={handleDoubleClick}>
        <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="hsl(var(--border))" strokeWidth="0.5"/>
            </pattern>
        </defs>
        <rect width="2000" height="2000" fill="url(#grid)" />
        <rect width="2000" height="2000" fill="transparent" />
        
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

        {/* Preview of new zone */}
        {isDrawingZone && newZonePoints.length > 0 && (
            <>
                <polyline
                    points={newZonePoints.map(p => `${p.x},${p.y}`).join(' ')}
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                    className="pointer-events-none"
                />
                {newZonePoints.map((p, i) => (
                    <circle key={i} cx={p.x} cy={p.y} r="4" fill={i === 0 ? "hsl(var(--primary))" : "white"} stroke="hsl(var(--primary))" strokeWidth="2" className="pointer-events-none" />
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
            <g id={table.id} key={table.id} className="table-group">
                <Table 
                    {...table}
                    selected={selectedElement === table.id}
                />
            </g>
        ))}

      </svg>
      
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
