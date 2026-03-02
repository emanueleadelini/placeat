'use client';
import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
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


const TableContents = ({ width, height, type, number, capienza, selected }: any) => {
  const isRound = type === 'rotondo';
  
  return (
    <>
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
            <rect x={width/2 - 5} y={height/2 - 5} width="10" height="10" className="fill-primary stroke-primary-foreground stroke-2 resize-handle" cursor="nwse-resize" />
            {/* Rotate handle */}
            <g transform={`translate(0, ${-height/2 - 20})`}>
                <line x1="0" y1="0" x2="0" y2="15" className="stroke-primary pointer-events-none" />
                <circle cx="0" cy="0" r="5" className="fill-primary rotate-handle" cursor="grab" />
            </g>
        </>
      )}
    </>
  );
};

const PropertiesPanel = ({ selectedTable, selectedZone, onUpdateTable, onDeleteTable, onUpdateZone, onDeleteZone, zones }: any) => {
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
                } else if (value === '') {
                    onUpdateTable(selectedTable.id, { numero: '' });
                }
            } else {
                onUpdateTable(selectedTable.id, { [name]: value });
            }
        };
        
        const handleSelectChange = (name: string) => (value: string) => {
            onUpdateTable(selectedTable.id, { [name]: value });
        };
        
        const uniqueZoneNames = [...new Set(zones.map((z: any) => z.nome).filter(Boolean))];

        return (
            <div className="absolute top-0 right-0 z-10 bg-card h-full w-64 p-4 border-l shadow-lg">
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
                         <Select value={selectedTable.tipo} onValueChange={handleSelectChange('tipo')}>
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
                         <Select value={selectedTable.zona} onValueChange={handleSelectChange('zona')}>
                            <SelectTrigger id="table-zone">
                                <SelectValue placeholder="Nessuna zona" />
                            </SelectTrigger>
                            <SelectContent>
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
                            placeholder="Es. Sala principale, Terrazza..."
                        />
                        <p className="text-xs text-muted-foreground mt-1">Dai lo stesso nome a più aree per fonderle in un'unica zona.</p>
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
                Usa i tasti <kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">Canc</kbd> o <kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">Backspace</kbd> per eliminare.
            </p>
        </div>
    )
};


export const FloorPlanEditor = forwardRef(function FloorPlanEditor(
    { ristoranteId }: { ristoranteId: string },
    ref
) {
    const [tool, setTool] = useState('select');
    const [tables, setTables] = useState<any[]>([]);
    const [walls, setWalls] = useState<any[]>([]);
    const [zones, setZones] = useState<any[]>([]);
    const [isDrawingWall, setIsDrawingWall] = useState(false);
    const [newWall, setNewWall] = useState<{x: number, y:number}[] | null>(null);
    const [isDrawingZone, setIsDrawingZone] = useState(false);
    const [newZonePoints, setNewZonePoints] = useState<{x: number, y:number}[]>([]);
    const [selectedElement, setSelectedElement] = useState<string | null>(null);
    const svgRef = useRef<SVGSVGElement>(null);
    const [drawing, setDrawing] = useState<{shape: 'rectangle' | 'circle', start: {x: number, y: number}} | null>(null);
    const [previewShape, setPreviewShape] = useState<React.ReactNode | null>(null);

    const [interaction, setInteraction] = useState({
        type: 'none',
        id: null as string | null,
        offsetX: 0,
        offsetY: 0,
        initialAngle: 0,
        initialRotation: 0,
    });
    
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();

    useEffect(() => {
        if (!ristoranteId || !firestore) return;

        const fetchData = async () => {
            try {
                // Fetch Tavoli
                const tavoliSnapshot = await getDocs(collection(firestore, 'ristoranti', ristoranteId, 'tavoli'));
                const tavoliData = tavoliSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                setTables(tavoliData);

                // Fetch Muri
                const muriSnapshot = await getDocs(collection(firestore, 'ristoranti', ristoranteId, 'muri'));
                const muriData = muriSnapshot.docs.map(d => {
                    const data = d.data();
                    const points = (data.pointsX || []).map((x: number, i: number) => ({ x, y: data.pointsY[i] }));
                    return { id: d.id, points, spessore: data.spessore };
                });
                setWalls(muriData);
                
                // Fetch Zone
                const zoneSnapshot = await getDocs(collection(firestore, 'ristoranti', ristoranteId, 'zone'));
                const zoneData = zoneSnapshot.docs.map(d => {
                    const data = d.data();
                    const path = (data.pathX || []).map((x: number, i: number) => ({ x, y: data.pathY[i] }));
                    return { id: d.id, path, nome: data.nome, colore: data.colore };
                });
                setZones(zoneData);

            } catch (error) {
                console.error("Error fetching floor plan data: ", error);
                toast({ title: 'Errore nel caricamento', description: 'Impossibile caricare la piantina esistente.', variant: 'destructive' });
            }
        };

        fetchData();
    }, [ristoranteId, firestore, toast]);

    useImperativeHandle(ref, () => ({
        publish: async () => {
          if (!firestore || !user || !ristoranteId) {
            throw new Error("Component not ready or user not logged in.");
          }
    
          const batch = writeBatch(firestore);
          const proprietarioUid = user.uid;
    
          // Define collections
          const tavoliCol = collection(firestore, 'ristoranti', ristoranteId, 'tavoli');
          const zoneCol = collection(firestore, 'ristoranti', ristoranteId, 'zone');
          const muriCol = collection(firestore, 'ristoranti', ristoranteId, 'muri');
    
          // Clear existing data for simplicity. A more complex diff algorithm could be used for performance.
          const oldTavoli = await getDocs(tavoliCol);
          oldTavoli.forEach(doc => batch.delete(doc.ref));
          const oldZone = await getDocs(zoneCol);
          oldZone.forEach(doc => batch.delete(doc.ref));
          const oldMuri = await getDocs(muriCol);
          oldMuri.forEach(doc => batch.delete(doc.ref));
    
          // Add current tables
          tables.forEach(table => {
            const { id, ...data } = table;
            const tableDocRef = doc(tavoliCol, id);
            batch.set(tableDocRef, { ...data, ristoranteId, proprietarioUid });
          });
    
          // Add current zones
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
    
          // Add current walls
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

    const getPolygonCentroid = (points: {x: number, y: number}[]) => {
        let centroid = { x: 0, y: 0 };
        if (!points || points.length === 0) return centroid;

        let signedArea = 0.0;
        let x0 = 0.0; // Current vertex
        let y0 = 0.0; // Current vertex
        let x1 = 0.0; // Next vertex
        let y1 = 0.0; // Next vertex
        let a = 0.0;  // Partial signed area

        let i = 0;
        for (i = 0; i < points.length - 1; ++i) {
            x0 = points[i].x;
            y0 = points[i].y;
            x1 = points[i+1].x;
            y1 = points[i+1].y;
            a = x0 * y1 - x1 * y0;
            signedArea += a;
            centroid.x += (x0 + x1) * a;
            centroid.y += (y0 + y1) * a;
        }

        x0 = points[i].x;
        y0 = points[i].y;
        x1 = points[0].x;
        y1 = points[0].y;
        a = x0 * y1 - x1 * y0;
        signedArea += a;
        centroid.x += (x0 + x1) * a;
        centroid.y += (y0 + y1) * a;
        
        if (Math.abs(signedArea) < 1e-7) return {x: points[0].x, y: points[0].y};

        signedArea *= 0.5;
        centroid.x /= (6.0 * signedArea);
        centroid.y /= (6.0 * signedArea);

        return centroid;
    };
    
    const isPointInPolygon = (point: {x: number, y: number}, polygon: {x: number, y: number}[]) => {
        const x = point.x, y = point.y;
        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const xi = polygon[i].x, yi = polygon[i].y;
            const xj = polygon[j].x, yj = polygon[j].y;
            
            const intersect = ((yi > y) != (yj > y))
                && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
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
    
    const updateTable = (id: string, updatedProps: any) => {
        setTables(currentTables => 
            currentTables.map(t => t.id === id ? { ...t, ...updatedProps } : t)
        );
    };

    const deleteTable = (id: string) => {
        setTables(currentTables => currentTables.filter(t => t.id !== id));
        if (selectedElement === id) {
            setSelectedElement(null);
        }
    }

    const updateZone = (id: string, updatedProps: any) => {
        setZones(currentZones => 
            currentZones.map(z => z.id === id ? { ...z, ...updatedProps } : z)
        );
    };

    const deleteZone = (id: string) => {
        setZones(currentZones => currentZones.filter(z => z.id !== id));
        if (selectedElement === id) {
            setSelectedElement(null);
        }
    }

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (selectedElement && (e.key === 'Delete' || e.key === 'Backspace')) {
                if (tables.some(t => t.id === selectedElement)) {
                    deleteTable(selectedElement);
                } else if (zones.some(z => z.id === selectedElement)) {
                    deleteZone(selectedElement);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedElement, tables, zones]);


    const handleMouseDown = (e: React.MouseEvent) => {
        const pos = getMousePosition(e);
        const target = e.target as SVGElement;
        
        if (tool === 'table') {
            let zoneName: string | undefined = undefined;
            for (const zone of zones) {
                if (isPointInPolygon(pos, zone.path)) {
                    zoneName = zone.nome;
                    break;
                }
            }
            const newTable = {
                id: `tavolo-${Date.now()}`,
                x: pos.x,
                y: pos.y,
                width: 80,
                height: 80,
                rotation: 0,
                type: 'rettangolare',
                numero: tables.length + 1,
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

        if (tool === 'rectangle' || tool === 'circle') {
            setDrawing({ shape: tool, start: pos });
            return;
        }

        if (tool === 'select') {
            const targetClass = target.getAttribute('class') || '';
            const tableGroup = target.closest('.table-group');

            if (targetClass.includes('rotate-handle')) {
                const id = tableGroup?.id;
                if (!id) return;
                const table = tables.find(t => t.id === id);
                if (!table) return;

                const dx = pos.x - table.x;
                const dy = pos.y - table.y;
                const initialAngle = Math.atan2(dy, dx);
                
                setInteraction({ type: 'rotate-table', id, initialAngle, initialRotation: table.rotation, offsetX: 0, offsetY: 0, });
                e.stopPropagation();
                return;
            }

            if (targetClass.includes('resize-handle')) {
                const id = tableGroup?.id;
                if (!id) return;
                 setInteraction({ type: 'resize-table', id, initialAngle: 0, initialRotation: 0, offsetX: 0, offsetY: 0, });
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

            const zoneGroup = target.closest('.zone-group');
            if (zoneGroup) {
                setSelectedElement(zoneGroup.id);
                return;
            }

            setSelectedElement(null);
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        const pos = getMousePosition(e);
        
        if (drawing) {
            const { start, shape } = drawing;
            if (shape === 'rectangle') {
                const x = Math.min(start.x, pos.x);
                const y = Math.min(start.y, pos.y);
                const width = Math.abs(start.x - pos.x);
                const height = Math.abs(start.y - pos.y);
                setPreviewShape(<rect x={x} y={y} width={width} height={height} className="fill-primary/20 stroke-primary stroke-2" />);
            } else if (shape === 'circle') {
                const dx = pos.x - start.x;
                const dy = pos.y - start.y;
                const radius = Math.sqrt(dx * dx + dy * dy);
                setPreviewShape(<circle cx={start.x} cy={start.y} r={radius} className="fill-primary/20 stroke-primary stroke-2" />);
            }
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
        if (drawing) {
            const endPos = getMousePosition(e);
            const dx = Math.abs(endPos.x - drawing.start.x);
            const dy = Math.abs(endPos.y - drawing.start.y);

            if (dx > 5 || dy > 5) {
                let path;
                
                if (drawing.shape === 'rectangle') {
                    path = [ { x: drawing.start.x, y: drawing.start.y }, { x: endPos.x, y: drawing.start.y }, { x: endPos.x, y: endPos.y }, { x: drawing.start.x, y: endPos.y }, ];
                } else if (drawing.shape === 'circle') {
                    const radius = Math.sqrt(dx * dx + dy * dy);
                    path = Array.from({ length: 32 }, (_, i) => {
                        const angle = (i / 32) * 2 * Math.PI;
                        return { x: drawing.start.x + radius * Math.cos(angle), y: drawing.start.y + radius * Math.sin(angle) };
                    });
                }

                if (path) {
                    const newZone = { id: `zona-${Date.now()}`, path: path, nome: `Zona ${zones.length + 1}`, colore: '#80b3ff4D' };
                    setZones(prev => [...prev, newZone]);
                    setSelectedElement(newZone.id);
                }
            }
            
            setDrawing(null);
            setPreviewShape(null);
            setTool('select');
            return;
        }

        if (interaction.type !== 'none') {
            setInteraction({ type: 'none', id: null, offsetX: 0, offsetY: 0, initialAngle: 0, initialRotation: 0 });
        }

        if (isDrawingWall && tool === 'wall' && newWall) {
            setIsDrawingWall(false);
            const dx = newWall[1].x - newWall[0].x;
            const dy = newWall[1].y - newWall[0].y;
            if (Math.sqrt(dx*dx + dy*dy) > 5) {
                const newWallWithId = { id: `muro-${Date.now()}`, points: newWall, spessore: 10 };
                setWalls(prevWalls => [...prevWalls, newWallWithId]);
            }
            setNewWall(null);
        }
    };

    const handleDoubleClick = (e: React.MouseEvent) => {
        if (tool === 'zone' && isDrawingZone && newZonePoints.length > 2) {
            setIsDrawingZone(false);
            const newZone = { id: `zona-${Date.now()}`, path: newZonePoints, nome: `Zona ${zones.length + 1}`, colore: '#80b3ff4D' };
            setZones(prev => [...prev, newZone]);
            setNewZonePoints([]);
            setSelectedElement(newZone.id);
            setTool('select');
        }
    }
    
    const selectedTable = tables.find(t => t.id === selectedElement);
    const selectedZone = zones.find(z => z.id === selectedElement);
  
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

      <svg ref={svgRef} className="flex-1 cursor-default" viewBox="0 0 2000 2000" onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onDoubleClick={handleDoubleClick}>
        <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="hsl(var(--border))" strokeWidth="0.5"/>
            </pattern>
        </defs>
        <rect width="2000" height="2000" fill="url(#grid)" />
        <rect width="2000" height="2000" fill="transparent" />
        
        {/* Zones */}
        {zones.map(zone => {
          const centroid = getPolygonCentroid(zone.path);
          return (
            <g key={zone.id} id={zone.id} className="zone-group cursor-pointer">
              <polygon
                  points={zone.path.map((p: any) => `${p.x},${p.y}`).join(' ')}
                  fill={zone.colore}
                  stroke={selectedElement === zone.id ? 'hsl(var(--primary))' : zone.colore.replace(/[\d\.]+\)$/, '1)')}
                  strokeWidth={selectedElement === zone.id ? 3 : 2}
                  className="zone-polygon"
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
        {walls.map((wall) => (
            <line key={wall.id} x1={wall.points[0].x} y1={wall.points[0].y} x2={wall.points[1].x} y2={wall.points[1].y} strokeWidth={wall.spessore} className="stroke-foreground" strokeLinecap="round" />
        ))}

        {newWall && (
             <line x1={newWall[0].x} y1={newWall[0].y} x2={newWall[1].x} y2={newWall[1].y} strokeWidth="10" className="stroke-primary" strokeLinecap="round" />
        )}
        
        {previewShape}

        {/* Tables */}
        {tables.map(table => (
            <g 
                id={table.id} 
                key={table.id} 
                className="table-group"
                transform={`translate(${table.x}, ${table.y}) rotate(${table.rotation})`}
            >
                <TableContents 
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
        zones={zones}
       />
    </div>
    </TooltipProvider>
  );
});

    