'use client';
import { useState } from 'react';
import {
  MousePointer,
  PenLine,
  Minus,
  Circle,
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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
        className="fill-card stroke-border hover:stroke-primary"
        strokeWidth={selected ? 2 : 1}
      />
      <text textAnchor="middle" dy=".3em" className="fill-foreground font-bold text-lg select-none">
        {number}
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


export function FloorPlanEditor() {
    const [tables, setTables] = useState([
        { id: 1, x: 300, y: 300, width: 70, height: 70, rotation: 0, type: 'rotondo', number: 1, capienza: 2 },
        { id: 2, x: 500, y: 350, width: 120, height: 80, rotation: 0, type: 'rettangolare', number: 2, capienza: 4 },
        { id: 3, x: 700, y: 300, width: 90, height: 90, rotation: 45, type: 'rotondo', number: 3, capienza: 4 },
        { id: 4, x: 450, y: 600, width: 180, height: 90, rotation: 90, type: 'rettangolare', number: 4, capienza: 6 },
    ]);
    const [walls, setWalls] = useState([
        [{x: 100, y: 100}, {x: 900, y: 100}],
        [{x: 100, y: 100}, {x: 100, y: 800}],
    ]);
    const [selectedTable, setSelectedTable] = useState<number | null>(2);

    const handleTableClick = (id: number) => {
        setSelectedTable(id);
    }
  
  return (
    <TooltipProvider>
    <div className="w-full h-full bg-muted/30 flex relative">
      <div className="absolute top-2 left-2 z-10 bg-card p-2 rounded-lg shadow-md border flex gap-1">
        <ToggleGroup type="single" defaultValue="select" size="sm">
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

       <div className="absolute top-2 right-2 z-10 bg-card p-2 rounded-lg shadow-md border flex items-center gap-1">
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
            <Button size="sm"><Save className="w-4 h-4 mr-2"/>Salva</Button>
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

       <div className="absolute bottom-2 right-2 z-10 bg-card p-2 rounded-lg shadow-md border flex items-center gap-1">
            <ToggleGroup type="multiple" size="sm">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <ToggleGroupItem value="grid" aria-label="Snap to grid"><Grid3x3 className="w-4 h-4"/></ToggleGroupItem>
                    </TooltipTrigger>
                    <TooltipContent>Snap to Grid</TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <ToggleGroupItem value="numbers" aria-label="Show table numbers"><Hash className="w-4 h-4"/></ToggleGroupItem>
                    </TooltipTrigger>
                    <TooltipContent>Mostra Numeri Tavolo</TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <ToggleGroupItem value="capacity" aria-label="Show capacity"><Users className="w-4 h-4"/></ToggleGroupItem>
                    </TooltipTrigger>
                    <TooltipContent>Mostra Capienza</TooltipContent>
                </Tooltip>
            </ToggleGroup>
       </div>

      <svg width="100%" height="100%" viewBox="0 0 2000 2000">
        <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="hsl(var(--border))" strokeWidth="0.5"/>
            </pattern>
        </defs>
        <rect width="2000" height="2000" fill="url(#grid)" />
        <rect width="2000" height="2000" fill="transparent" />

        {/* Zones */}
        <polygon points="120,120 880,120 880,450 600,500 120,500" className="fill-blue-500/20 stroke-blue-500/50" />
        <text x="500" y="300" textAnchor="middle" className="fill-blue-800/50 font-bold text-4xl select-none">SALA</text>


        {/* Walls */}
        {walls.map((wall, index) => (
            <line key={index} x1={wall[0].x} y1={wall[0].y} x2={wall[1].x} y2={wall[1].y} strokeWidth="10" className="stroke-foreground" strokeLinecap="round" />
        ))}

        {/* Tables */}
        {tables.map(table => (
            <Table 
                key={table.id}
                {...table}
                selected={selectedTable === table.id}
                onClick={() => handleTableClick(table.id)}
            />
        ))}

      </svg>
    </div>
    </TooltipProvider>
  );
}
