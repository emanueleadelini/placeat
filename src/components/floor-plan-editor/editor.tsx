'use client';

import { useState, useRef, useEffect, forwardRef, useImperativeHandle, useCallback } from 'react';
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
  Square,
  Circle,
  Maximize2,
  Loader2,
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
import { useFirestore, useUser } from '@/firebase';
import { doc, collection, getDocs, writeBatch } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

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
  tipo: 'rettangolare' | 'rotondo';
  numero: number;
  capienza: number;
  zona?: string;
}

interface Zone {
  id: string;
  path: { x: number; y: number }[];
  nome: string;
  colore: string;
}

interface Wall {
  id: string;
  points: { x: number; y: number }[];
  spessore: number;
}

const TableComponent = ({ 
  x, y, width, height, rotation, tipo, numero, capienza, selected 
}: Table & { selected: boolean }) => {
  const isRound = tipo === 'rotondo';
  
  return (
    <g transform={`translate(${x}, ${y}) rotate(${rotation})`} className="cursor-pointer table-group">
      <rect 
        x={-width/2} 
        y={-height/2}
        width={width}
        height={height}
        rx={isRound ? width/2 : 8}
        ry={isRound ? height/2 : 8}
        className={cn(
          "transition-all duration-200",
          selected ? "fill-blue-100 stroke-blue-500" : "fill-card stroke-border hover:stroke-primary"
        )}
        strokeWidth={selected ? 3 : 2}
      />
      <text textAnchor="middle" dy=".3em" className="fill-foreground font-bold text-base select-none pointer-events-none">
        {numero}
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

const PropertiesPanel = ({ selectedTable, selectedZone, zones, onUpdateTable, onDeleteTable, onUpdateZone, onDeleteZone }: any) => {
  if (selectedTable) {
    const handleCapacityChange = (amount: number) => {
      const newCapacity = Math.max(1, selectedTable.capienza + amount);
      onUpdateTable(selectedTable.id, { capienza: newCapacity });
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      if (name === "numero") {
        const parsed = parseInt(value, 10);
        if (!isNaN(parsed) && parsed > 0) {
          onUpdateTable(selectedTable.id, { numero: parsed });
        }
      } else {
        onUpdateTable(selectedTable.id, { [name]: value });
      }
    };
    
    const handleSelectChange = (name: string, value: string) => {
      onUpdateTable(selectedTable.id, { [name]: value });
    };
    
    const uniqueZoneNames = [...new Set(zones.map((z: Zone) => z.nome).filter(Boolean))];

    return (
      <div className="absolute top-0 right-0 z-10 bg-card h-full w-64 p-4 border-l shadow-lg overflow-y-auto">
        <h3 className="font-semibold text-lg mb-6">Proprietà Tavolo</h3>
        <div className="grid gap-4">
          <div>
            <Label htmlFor="table-number">Numero Tavolo</Label>
            <Input id="table-number" name="numero" type="number" value={selectedTable.numero ?? ''} onChange={handleInputChange} />
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
            <Select value={selectedTable.tipo} onValueChange={(value) => handleSelectChange('tipo', value)}>
              <SelectTrigger id="table-type">
                <SelectValue placeholder="Seleziona tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rettangolare">Rettangolare</SelectItem>
                <SelectItem value="rotondo">Rotondo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="table-zone">Zona</Label>
            <Select value={selectedTable.zona || ''} onValueChange={(value) => handleSelectChange('zona', value)}>
              <SelectTrigger id="table-zone">
                <SelectValue placeholder="Nessuna zona" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Nessuna zona</SelectItem>
                {uniqueZoneNames.map((name: string) => (
                  <SelectItem key={name} value={name}>{name}</SelectItem>
                ))}
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
              name="nome" 
              value={selectedZone.nome} 
              onChange={(e) => onUpdateZone(selectedZone.id, { nome: e.target.value })}
              placeholder="Es. Sala principale..."
            />
          </div>
          <div>
            <Label htmlFor="zone-color">Colore</Label>
            <Input 
              id="zone-color" 
              name="colore" 
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

export const FloorPlanEditor = forwardRef(function FloorPlanEditor(
  { ristoranteId }: { ristoranteId?: string },
  ref
) {
  const [tool, setTool] = useState('select');
  const [tables, setTables] = useState<Table[]>([]);
  const [walls, setWalls] = useState<Wall[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [isDrawingWall, setIsDrawingWall] = useState(false);
  const [newWall, setNewWall] = useState<{x: number, y:number}[] | null>(null);
  const [isDrawingZone, setIsDrawingZone] = useState(false);
  const [newZonePoints, setNewZonePoints] = useState<{x: number, y:number}[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Zoom e Pan
  const [zoom, setZoom] = useState(0.8);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [interaction, setInteraction] = useState({
    type: 'none' as 'none' | 'move-table' | 'rotate-table' | 'resize-table',
    id: null as string | null,
    offsetX: 0,
    offsetY: 0,
    initialAngle: 0,
    initialRotation: 0,
  });
  
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  // Carica dati esistenti
  useEffect(() => {
    if (!ristoranteId || !firestore) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch Tavoli
        const tavoliSnapshot = await getDocs(collection(firestore, 'ristoranti', ristoranteId, 'tavoli'));
        const tavoliData = tavoliSnapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Table[];
        setTables(tavoliData);

        // Fetch Muri
        const muriSnapshot = await getDocs(collection(firestore, 'ristoranti', ristoranteId, 'muri'));
        const muriData = muriSnapshot.docs.map(d => {
          const data = d.data();
          const points = (data.pointsX || []).map((x: number, i: number) => ({ x, y: data.pointsY[i] }));
          return { id: d.id, points, spessore: data.spessore || 10 } as Wall;
        });
        setWalls(muriData);
        
        // Fetch Zone
        const zoneSnapshot = await getDocs(collection(firestore, 'ristorante' + 's', ristoranteId, 'zone'));
        const zoneData = zoneSnapshot.docs.map(d => {
          const data = d.data();
          const path = (data.pathX || []).map((x: number, i: number) => ({ x, y: data.pathY[i] }));
          return { id: d.id, path, nome: data.nome || 'Zona', colore: data.colore || '#80b3ff4D' } as Zone;
        });
        setZones(zoneData);

        // Auto-centra se ci sono tavoli
        if (tavoliData.length > 0) {
          setTimeout(() => fitToContent(tavoliData), 100);
        }

      } catch (error) {
        console.error("Error fetching floor plan data:", error);
        toast({ title: 'Errore nel caricamento', description: 'Impossibile caricare la piantina.', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [ristoranteId, firestore, toast]);

  // Expose publish method
  useImperativeHandle(ref, () => ({
    publish: async () => {
      if (!firestore || !user || !ristoranteId) {
        throw new Error("Component not ready or user not logged in.");
      }

      const batch = writeBatch(firestore);
      const proprietarioUid = user.uid;

      // Clear existing
      const tavoliCol = collection(firestore, 'ristoranti', ristoranteId, 'tavoli');
      const zoneCol = collection(firestore, 'ristoranti', ristoranteId, 'zone');
      const muriCol = collection(firestore, 'ristoranti', ristoranteId, 'muri');

      const [oldTavoli, oldZone, oldMuri] = await Promise.all([
        getDocs(tavoliCol),
        getDocs(zoneCol),
        getDocs(muriCol)
      ]);
      
      oldTavoli.forEach(doc => batch.delete(doc.ref));
      oldZone.forEach(doc => batch.delete(doc.ref));
      oldMuri.forEach(doc => batch.delete(doc.ref));

      // Add new tables
      tables.forEach(table => {
        const { id, ...data } = table;
        const tableDocRef = doc(tavoliCol, id);
        batch.set(tableDocRef, { ...data, ristoranteId, proprietarioUid });
      });

      // Add new zones
      zones.forEach(zone => {
        const { id, path, ...data } = zone;
        const zoneDocRef = doc(zoneCol, id);
        batch.set(zoneDocRef, {
          ...data,
          ristoranteId,
          proprietarioUid,
          pathX: path.map((p: any) => p.x),
          pathY: path.map((p: any) => p.y),
        });
      });

      // Add new walls
      walls.forEach(wall => {
        const { id, points, ...data } = wall;
        const wallDocRef = doc(muriCol, id);
        batch.set(wallDocRef, {
          ...data,
          ristoranteId,
          proprietarioUid,
          pointsX: points.map((p: any) => p.x),
          pointsY: points.map((p: any) => p.y),
        });
      });

      await batch.commit();
    },
  }));

  // Auto-centra sui tavoli
  const fitToContent = (tableData: Table[] = tables) => {
    if (tableData.length === 0 || !containerRef.current) return;
    
    const padding = 200;
    const xs = tableData.map(t => t.x);
    const ys = tableData.map(t => t.y);
    const minX = Math.min(...xs) - padding;
    const maxX = Math.max(...xs) + padding;
    const minY = Math.min(...ys) - padding;
    const maxY = Math.max(...ys) + padding;
    
    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;
    
    const containerWidth = containerRef.current.clientWidth - 256;
    const containerHeight = containerRef.current.clientHeight;
    
    const scaleX = containerWidth / contentWidth;
    const scaleY = containerHeight / contentHeight;
    const newZoom = Math.min(scaleX, scaleY, 1.5);
    
    setZoom(Math.max(0.3, newZoom));
    setPan({
      x: (containerWidth - contentWidth * newZoom) / 2 - minX * newZoom + 50,
      y: (containerHeight - contentHeight * newZoom) / 2 - minY * newZoom
    });
  };

  // Zoom handlers
  const handleZoomIn = () => setZoom(z => Math.min(z * 1.2, 4));
  const handleZoomOut = () => setZoom(z => Math.max(z / 1.2, 0.3));
  const handleReset = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  // Utility
  const getPolygonCentroid = (points: {x: number, y: number}[]) => {
    if (!points || points.length === 0) return { x: 0, y: 0 };
    let centroid = { x: 0, y: 0 };
    let signedArea = 0.0;
    let x0 = 0.0, y0 = 0.0, x1 = 0.0, y1 = 0.0, a = 0.0;
    let i = 0;
    for (i = 0; i < points.length - 1; ++i) {
      x0 = points[i].x; y0 = points[i].y; x1 = points[i+1].x; y1 = points[i+1].y;
      a = x0 * y1 - x1 * y0; signedArea += a; centroid.x += (x0 + x1) * a; centroid.y += (y0 + y1) * a;
    }
    x0 = points[i].x; y0 = points[i].y; x1 = points[0].x; y1 = points[0].y;
    a = x0 * y1 - x1 * y0; signedArea += a; centroid.x += (x0 + x1) * a; centroid.y += (y0 + y1) * a;
    if (Math.abs(signedArea) < 1e-7) return {x: points[0].x, y: points[0].y};
    signedArea *= 0.5; centroid.x /= (6.0 * signedArea); centroid.y /= (6.0 * signedArea);
    return centroid;
  };

  const isPointInPolygon = (point: {x: number, y: number}, polygon: {x: number, y: number}[]) => {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x, yi = polygon[i].y;
      const xj = polygon[j].x, yj = polygon[j].y;
      if (((yi > point.y) !== (yj > point.y)) && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }
    return inside;
  };

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

  // Update functions
  const updateTable = (id: string, updatedProps: Partial<Table>) => {
    setTables(current => current.map(t => t.id === id ? { ...t, ...updatedProps } : t));
  };

  const deleteTable = (id: string) => {
    setTables(current => current.filter(t => t.id !== id));
    if (selectedElement === id) setSelectedElement(null);
  };

  const updateZone = (id: string, updatedProps: Partial<Zone>) => {
    setZones(current => current.map(z => z.id === id ? { ...z, ...updatedProps } : z));
  };

  const deleteZone = (id: string) => {
    const zoneToDelete = zones.find(z => z.id === id);
    if (!zoneToDelete) return;
    
    const remainingZones = zones.filter(z => z.id !== id);
    const isLastShapeForThisZoneName = !remainingZones.some(z => z.nome === zoneToDelete.nome);

    setZones(remainingZones);
    
    if (isLastShapeForThisZoneName) {
      setTables(current => current.map(t => t.zona === zoneToDelete.nome ? { ...t, zona: undefined } : t));
    }
    
    if (selectedElement === id) setSelectedElement(null);
  };

  // Mouse handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    const pos = getMousePosition(e);
    const target = e.target as SVGElement;
    const targetClass = target.getAttribute('class') || '';
    const tableGroup = target.closest('.table-group');

    if (tool === 'select') {
      if (targetClass.includes('rotate-handle')) {
        const id = tableGroup?.id;
        if (!id) return;
        const table = tables.find(t => t.id === id);
        if (!table) return;
        const dx = pos.x - table.x;
        const dy = pos.y - table.y;
        const initialAngle = Math.atan2(dy, dx);
        setInteraction({ type: 'rotate-table', id, initialAngle, initialRotation: table.rotation, offsetX: 0, offsetY: 0 });
        e.stopPropagation();
        return;
      }

      if (targetClass.includes('resize-handle')) {
        const id = tableGroup?.id;
        if (!id) return;
        setInteraction({ type: 'resize-table', id, initialAngle: 0, initialRotation: 0, offsetX: 0, offsetY: 0 });
        e.stopPropagation();
        return;
      }
      
      if (tableGroup) {
        const id = tableGroup.id;
        setSelectedElement(id);
        const table = tables.find(t => t.id === id);
        if (table) {
          setInteraction({ type: 'move-table', id, offsetX: pos.x - table.x, offsetY: pos.y - table.y, initialAngle: 0, initialRotation: 0 });
        }
        return;
      }

      const zonePolygon = target.closest('.zone-polygon');
      if (zonePolygon) {
        setSelectedElement(zonePolygon.id);
        return;
      }

      // Click on background - start pan
      setSelectedElement(null);
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
    
    // Tool handlers
    if (tool === 'table') {
      let zoneName: string | undefined = undefined;
      for (const zone of zones) {
        if (isPointInPolygon(pos, zone.path)) {
          zoneName = zone.nome;
          break;
        }
      }
      const newTable: Table = {
        id: `tavolo-${Date.now()}`,
        numero: tables.length > 0 ? Math.max(...tables.map(t => t.numero || 0)) + 1 : 1,
        x: pos.x,
        y: pos.y,
        width: 80,
        height: 80,
        rotation: 0,
        tipo: 'rettangolare',
        capienza: 4,
        zona: zoneName,
      };
      setTables(prev => [...prev, newTable]);
      setSelectedElement(newTable.id);
      setTool('select');
      return;
    }

    if (tool === 'wall') {
      setIsDrawingWall(true);
      setNewWall([{ ...pos }, { ...pos }]);
      return;
    }

    if (tool === 'zone') {
      setIsDrawingZone(true);
      setNewZonePoints(prev => [...prev, pos]);
      return;
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const pos = getMousePosition(e);
    
    if (isDragging && tool === 'select') {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
      return;
    }
    
    if (isDrawingWall && tool === 'wall' && newWall) {
      setNewWall([newWall[0], { ...pos }]);
      return;
    } 
    
    if (interaction.id) {
      const table = tables.find(t => t.id === interaction.id);
      if (!table) return;

      if (interaction.type === 'move-table') {
        updateTable(interaction.id, { x: pos.x - interaction.offsetX, y: pos.y - interaction.offsetY });
      } else if (interaction.type === 'rotate-table') {
        const dx = pos.x - table.x;
        const dy = pos.y - table.y;
        const currentAngle = Math.atan2(dy, dx);
        const angleDiff = currentAngle - interaction.initialAngle;
        const newRotation = interaction.initialRotation + (angleDiff * 180 / Math.PI);
        updateTable(interaction.id, { rotation: newRotation });
      } else if (interaction.type === 'resize-table') {
        const angleRad = -table.rotation * Math.PI / 180;
        const cos = Math.cos(angleRad);
        const sin = Math.sin(angleRad);
        const localX = pos.x - table.x;
        const localY = pos.y - table.y;
        const unrotatedX = localX * cos - localY * sin;
        const unrotatedY = localX * sin + localY * cos;
        const newWidth = Math.max(20, Math.abs(unrotatedX) * 2);
        const newHeight = Math.max(20, Math.abs(unrotatedY) * 2);
        updateTable(interaction.id, { width: newWidth, height: newHeight });
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    setIsDragging(false);

    if (interaction.type === 'move-table' && interaction.id) {
      const movedTable = tables.find(t => t.id === interaction.id);
      if (movedTable) {
        let newZoneName: string | undefined = undefined;
        for (const zone of [...zones].reverse()) {
          if (isPointInPolygon({x: movedTable.x, y: movedTable.y}, zone.path)) {
            newZoneName = zone.nome;
            break;
          }
        }
        if (movedTable.zona !== newZoneName) {
          updateTable(interaction.id, { zona: newZoneName });
        }
      }
    }

    if (interaction.type !== 'none') {
      setInteraction({ type: 'none', id: null, offsetX: 0, offsetY: 0, initialAngle: 0, initialRotation: 0 });
    }

    if (isDrawingWall && tool === 'wall' && newWall) {
      setIsDrawingWall(false);
      const dx = newWall[1].x - newWall[0].x;
      const dy = newWall[1].y - newWall[0].y;
      if (Math.sqrt(dx*dx + dy*dy) > 5) {
        setWalls(prev => [...prev, { id: `muro-${Date.now()}`, points: newWall, spessore: 10 }]);
      }
      setNewWall(null);
    }
  };

  const handleDoubleClick = () => {
    if (tool === 'zone' && isDrawingZone && newZonePoints.length > 2) {
      setIsDrawingZone(false);
      const newZone: Zone = {
        id: `zona-${Date.now()}`,
        path: newZonePoints,
        nome: `Zona ${zones.length + 1}`,
        colore: '#80b3ff4D',
      };
      setZones(prev => [...prev, newZone]);
      setNewZonePoints([]);
      setSelectedElement(newZone.id);
      setTool('select');
    }
  };

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(z => Math.max(0.3, Math.min(4, z * delta)));
  }, []);

  const selectedTable = tables.find(t => t.id === selectedElement);
  const selectedZone = zones.find(z => z.id === selectedElement);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

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
                <ToggleGroupItem value="rectangle" aria-label="Draw Rectangle"><Square className="w-4 h-4"/></ToggleGroupItem>
              </TooltipTrigger>
              <TooltipContent>Disegna Rettangolo (R)</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <ToggleGroupItem value="circle" aria-label="Draw Circle"><Circle className="w-4 h-4"/></ToggleGroupItem>
              </TooltipTrigger>
              <TooltipContent>Disegna Cerchio (C)</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <ToggleGroupItem value="zone" aria-label="Draw Zone"><Layers className="w-4 h-4"/></ToggleGroupItem>
              </TooltipTrigger>
              <TooltipContent>Disegna Zona (Z)</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <ToggleGroupItem value="table" aria-label="Add Table"><RectangleHorizontal className="w-4 h-4"/></ToggleGroupItem>
              </TooltipTrigger>
              <TooltipContent>Aggiungi Tavolo (T)</TooltipContent>
            </Tooltip>
          </ToggleGroup>
        </div>

        {/* Toolbar Right */}
        <div className="absolute top-2 right-72 z-10 bg-card p-2 rounded-lg shadow-md border flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8"><Undo2 className="w-4 h-4"/></Button>
            </TooltipTrigger>
            <TooltipContent>Annulla</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8"><Redo2 className="w-4 h-4"/></Button>
            </TooltipTrigger>
            <TooltipContent>Ripristina</TooltipContent>
          </Tooltip>
          <div className="w-px h-6 bg-border mx-1"></div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => fitToContent()}>
                <Maximize2 className="w-4 h-4"/>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Adatta allo schermo</TooltipContent>
          </Tooltip>
        </div>

        {/* Zoom Toolbar */}
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

        {/* SVG Canvas */}
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
            onDoubleClick={handleDoubleClick}
          >
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="hsl(var(--border))" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width={CANVAS_WIDTH} height={CANVAS_HEIGHT} fill="url(#grid)" />
            
            {/* Zones */}
            {zones.map(zone => {
              const centroid = getPolygonCentroid(zone.path);
              return (
                <g key={zone.id} className="zone-group">
                  <polygon
                    id={zone.id}
                    points={zone.path.map(p => `${p.x},${p.y}`).join(' ')}
                    fill={zone.colore}
                    stroke={selectedElement === zone.id ? 'hsl(var(--primary))' : zone.colore.substring(0, 7)}
                    strokeWidth={selectedElement === zone.id ? 3 : 2}
                    className="cursor-pointer zone-polygon"
                  />
                  <text 
                    x={centroid.x} 
                    y={centroid.y} 
                    textAnchor="middle" 
                    dy=".3em" 
                    className="fill-foreground font-bold pointer-events-none select-none"
                    fontSize="16"
                  >
                    {zone.nome}
                  </text>
                </g>
              );
            })}

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
            {walls.map((wall) => (
              <line 
                key={wall.id} 
                x1={wall.points[0].x} 
                y1={wall.points[0].y} 
                x2={wall.points[1].x} 
                y2={wall.points[1].y} 
                strokeWidth={wall.spessore} 
                className="stroke-foreground" 
                strokeLinecap="round" 
              />
            ))}

            {newWall && (
              <line x1={newWall[0].x} y1={newWall[0].y} x2={newWall[1].x} y2={newWall[1].y} strokeWidth="10" className="stroke-primary" strokeLinecap="round" />
            )}

            {/* Tables */}
            {tables.map(table => (
              <g key={table.id} id={table.id}>
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
          zones={zones}
          onUpdateTable={updateTable}
          onDeleteTable={deleteTable}
          onUpdateZone={updateZone}
          onDeleteZone={deleteZone}
        />
      </div>
    </TooltipProvider>
  );
});
