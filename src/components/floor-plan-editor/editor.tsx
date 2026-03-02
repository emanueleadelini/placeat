'use client';
import { useState } from 'react';
import {
  MousePointer,
  PenLine,
  RectangleHorizontal,
  Pentagon,
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


const Table = ({ x, y, width, height, rotation, type, number, capienza, selected, onClick }: any) => {
  const isRound = type === 'rotondo';
  
  return (
    <g transform={`translate(${x}, ${y}) rotate(${rotation})`} onClick={onClick} className="cursor-pointer">
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
      <text textAnchor="middle" dy=".3em" className="fill-foreground font-bold text-base select-none">
        {number}
      </text>
       <text textAnchor="middle" dy="1.5em" className="fill-muted-foreground font-medium text-xs select-none">
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

const PropertiesPanel = ({ selectedTable, onUpdate, onDelete }: any) => {
    if (!selectedTable) {
        return (
             <div className="absolute top-0 right-0 z-10 bg-card h-full w-64 p-4 border-l flex flex-col items-center justify-center text-center">
                <MousePointer className="w-10 h-10 text-muted-foreground mb-4"/>
                <p className="text-sm text-muted-foreground">Seleziona un elemento per vederne le proprietà.</p>
            </div>
        )
    };

    const handleCapacityChange = (amount: number) => {
        const newCapacity = Math.max(1, selectedTable.capienza + amount);
        onUpdate(selectedTable.id, { capienza: newCapacity });
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        onUpdate(selectedTable.id, { [name]: name === 'numero' ? parseInt(value) || '' : value });
    };
    
    const handleSelectChange = (value: string) => {
        onUpdate(selectedTable.id, { tipo: value });
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
                <Button variant="outline" className="mt-6" onClick={() => onDelete(selectedTable.id)}>
                    <Trash2 className="mr-2 h-4 w-4 text-destructive"/>
                    <span className="text-destructive">Elimina Tavolo</span>
                </Button>
            </div>
        </div>
    );
};


export function FloorPlanEditor() {
    const [tool, setTool] = useState('select');
    const [tables, setTables] = useState<any[]>([]);
    const [walls, setWalls] = useState<{x: number, y:number}[][]>([]);
    const [isDrawing, setIsDrawing] = useState(false);
    const [newWall, setNewWall] = useState<{x: number, y:number}[] | null>(null);
    const [selectedElement, setSelectedElement] = useState<string | null>(null);

    const getMousePosition = (evt: React.MouseEvent) => {
        const svg = evt.currentTarget as SVGSVGElement;
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

        if (tool === 'wall') {
            setIsDrawing(true);
            setNewWall([{ ...pos }, { ...pos }]);
        } else if (tool === 'table') {
            const newTable = {
                id: `table-${tables.length + 1}`,
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
        } else if (tool === 'select') {
            if (e.target === e.currentTarget) {
                 setSelectedElement(null);
            }
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDrawing || tool !== 'wall' || !newWall) return;
        const pos = getMousePosition(e);
        setNewWall([newWall[0], { ...pos }]);
    };

    const handleMouseUp = (e: React.MouseEvent) => {
        if (!isDrawing || tool !== 'wall' || !newWall) return;
        setIsDrawing(false);
        const dx = newWall[1].x - newWall[0].x;
        const dy = newWall[1].y - newWall[0].y;
        if (Math.sqrt(dx*dx + dy*dy) > 5) {
            setWalls(prevWalls => [...prevWalls, newWall]);
        }
        setNewWall(null);
    };

    const handleTableClick = (id: string) => {
        if (tool === 'select') {
            setSelectedElement(id);
        }
    }
    
    const selectedTable = tables.find(t => t.id === selectedElement);

    const updateTable = (id: string, updatedProps: any) => {
        setTables(currentTables => 
            currentTables.map(t => t.id === id ? { ...t, ...updatedProps } : t)
        );
    };

    const deleteTable = (id: string) => {
        setTables(currentTables => currentTables.filter(t => t.id !== id));
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
                    <ToggleGroupItem value="zone" aria-label="Draw Zone"><Pentagon className="w-4 h-4"/></ToggleGroupItem>
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

      <svg className="flex-1" viewBox="0 0 2000 2000" onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
        <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="hsl(var(--border))" strokeWidth="0.5"/>
            </pattern>
        </defs>
        <rect width="2000" height="2000" fill="url(#grid)" />
        <rect width="2000" height="2000" fill="transparent" />

        {/* Walls */}
        {walls.map((wall, index) => (
            <line key={index} x1={wall[0].x} y1={wall[0].y} x2={wall[1].x} y2={wall[1].y} strokeWidth="10" className="stroke-foreground" strokeLinecap="round" />
        ))}

        {newWall && (
             <line x1={newWall[0].x} y1={newWall[0].y} x2={newWall[1].x} y2={newWall[1].y} strokeWidth="10" className="stroke-primary" strokeLinecap="round" />
        )}

        {/* Tables */}
        {tables.map(table => (
            <Table 
                key={table.id}
                {...table}
                selected={selectedElement === table.id}
                onClick={() => handleTableClick(table.id)}
            />
        ))}

      </svg>
      
      <PropertiesPanel selectedTable={selectedTable} onUpdate={updateTable} onDelete={deleteTable} />
    </div>
    </TooltipProvider>
  );
}
