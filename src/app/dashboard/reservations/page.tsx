'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, Timestamp } from 'firebase/firestore';
import type { Ristorante, Prenotazione, Tavolo, Zona, Muro, DailyOpeningHours } from '@/lib/types';
import { format, startOfWeek, addDays, isSameDay, getDay } from 'date-fns';
import { it } from 'date-fns/locale';
import { 
  ChevronLeft, 
  ChevronRight, 
  Loader2, 
  Calendar as CalendarIcon, 
  Clock, 
  Users, 
  Armchair,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Info,
  MapPin,
  Phone,
  Mail,
  User,
  X,
  Layers,
  Eye,
  EyeOff,
  Search,
  Utensils,
  CheckCircle2,
  AlertCircle,
  LayoutGrid,
  List,
  Fullscreen
} from 'lucide-react';

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from '@/lib/utils';
import { ScrollArea } from "@/components/ui/scroll-area";
import { SendReviewButton } from "@/components/reviewflow/send-review-button";

interface ReadOnlyTableProps extends Tavolo {
  status?: 'free' | 'booked';
}

const ReadOnlyTable = ({ 
  x, y, width, height, rotation, tipo, numero, capienza, status,
  isSelected,
  onClick,
  booking
}: ReadOnlyTableProps & { 
  isSelected?: boolean;
  onClick?: () => void;
  booking?: Prenotazione;
}) => {
  const isRound = tipo === 'rotondo';
  const isBooked = status === 'booked';
  
  const tableColors = {
    free: {
      fill: 'fill-emerald-50',
      stroke: 'hsl(var(--emerald-500))',
      text: 'fill-emerald-700',
      glow: 'hsl(var(--emerald-400) / 0.3)'
    },
    booked: {
      fill: 'fill-rose-50',
      stroke: 'hsl(var(--rose-500))',
      text: 'fill-rose-700',
      glow: 'hsl(var(--rose-400) / 0.3)'
    },
    selected: {
      fill: 'fill-blue-50',
      stroke: 'hsl(var(--blue-500))',
      text: 'fill-blue-700',
      glow: 'hsl(var(--blue-400) / 0.5)'
    }
  };
  
  const colors = isSelected ? tableColors.selected : (isBooked ? tableColors.booked : tableColors.free);
  
  return (
    <g 
      transform={`translate(${x}, ${y}) rotate(${rotation})`}
      className="cursor-pointer"
      onClick={onClick}
    >
      {isSelected && (
        <rect 
          x={-width/2 - 8} 
          y={-height/2 - 8}
          width={width + 16}
          height={height + 16}
          rx={isRound ? (width+16)/2 : 12}
          ry={isRound ? (height+16)/2 : 12}
          fill={colors.glow}
          className="animate-pulse"
        />
      )}
      
      <rect 
        x={-width/2} 
        y={-height/2}
        width={width}
        height={height}
        rx={isRound ? width/2 : 8}
        ry={isRound ? height/2 : 8}
        className={cn(
          "transition-all duration-200 hover:brightness-95",
          colors.fill
        )}
        stroke={colors.stroke}
        strokeWidth={isSelected ? 3 : (isBooked ? 2.5 : 1.5)}
      />
      
      <circle
        cx={width/2 - 6}
        cy={-height/2 + 6}
        r={4}
        className={cn(
          isBooked ? "fill-rose-500" : "fill-emerald-500"
        )}
      />
      
      <text 
        textAnchor="middle" 
        dy="-0.2em" 
        className={cn(
          "font-bold text-sm select-none pointer-events-none",
          colors.text
        )}
      >
        {numero}
      </text>
      
      <text 
        textAnchor="middle" 
        dy="1.3em" 
        className="fill-muted-foreground font-medium text-[10px] select-none pointer-events-none"
      >
        {capienza} p
      </text>
      
      {isBooked && booking && (
        <text 
          textAnchor="middle" 
          dy="2.4em" 
          className="fill-rose-500 text-[8px] select-none pointer-events-none font-semibold"
        >
          OCCUPATO
        </text>
      )}
    </g>
  );
};

const getPolygonCentroid = (points: {x: number, y: number}[]) => {
    let centroid = { x: 0, y: 0 };
    if (!points || points.length === 0) return centroid;
    let signedArea = 0.0;
    let x0 = 0.0; let y0 = 0.0; let x1 = 0.0; let y1 = 0.0; let a = 0.0;
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

const Legend = ({ showZones, showWalls, onToggleZones, onToggleWalls }: { 
  showZones?: boolean;
  showWalls?: boolean;
  onToggleZones?: () => void;
  onToggleWalls?: () => void;
}) => (
  <div className="flex flex-col gap-2 bg-card/95 backdrop-blur border rounded-lg shadow-lg p-3">
    <div className="flex items-center gap-3 text-xs">
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm" />
        <span className="text-muted-foreground">Libero</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded-full bg-rose-500 shadow-sm" />
        <span className="text-muted-foreground">Occupato</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded bg-blue-100 border-2 border-blue-500" />
        <span className="text-muted-foreground">Selezionato</span>
      </div>
    </div>
    {(onToggleZones || onToggleWalls) && (
      <>
        <Separator className="my-1" />
        <div className="flex items-center gap-3">
          {onToggleZones && (
            <button 
              onClick={onToggleZones}
              className="flex items-center gap-1.5 text-xs hover:text-primary transition-colors"
            >
              {showZones ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              <span className="text-muted-foreground">Zone</span>
            </button>
          )}
          {onToggleWalls && (
            <button 
              onClick={onToggleWalls}
              className="flex items-center gap-1.5 text-xs hover:text-primary transition-colors"
            >
              {showWalls ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              <span className="text-muted-foreground">Muri</span>
            </button>
          )}
        </div>
      </>
    )}
  </div>
);

const DaySelector = ({ 
  weekDays, 
  selectedDate, 
  onSelectDate,
  currentDate,
  onChangeWeek
}: { 
  weekDays: Date[]; 
  selectedDate: Date; 
  onSelectDate: (date: Date) => void;
  currentDate: Date;
  onChangeWeek: (direction: 'prev' | 'next') => void;
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">
            {format(currentDate, 'MMMM yyyy', { locale: it })}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onChangeWeek('prev')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onChangeWeek('next')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map((day) => (
          <div key={day} className="text-center text-xs font-medium text-muted-foreground py-1">
            {day}
          </div>
        ))}
        {weekDays.map((day) => {
          const isSelected = isSameDay(day, selectedDate);
          const isToday = isSameDay(day, new Date());
          
          return (
            <button
              key={day.toString()}
              onClick={() => onSelectDate(day)}
              className={cn(
                "flex flex-col items-center justify-center p-2 rounded-lg transition-all",
                "hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/20",
                isSelected && "bg-primary text-primary-foreground hover:bg-primary/90",
                !isSelected && isToday && "bg-primary/10 text-primary font-semibold"
              )}
            >
              <span className={cn(
                "text-xs",
                isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
              )}>
                {format(day, 'EEE', { locale: it }).slice(0, 3)}
              </span>
              <span className={cn(
                "text-lg font-bold",
                isToday && !isSelected && "text-primary"
              )}>
                {format(day, 'd')}
              </span>
              {isToday && (
                <span className={cn(
                  "text-[10px] font-medium",
                  isSelected ? "text-primary-foreground/70" : "text-primary"
                )}>
                  Oggi
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const TimeSlotSelector = ({ 
  timeSlots, 
  selectedTime, 
  onSelectTime 
}: { 
  timeSlots: string[]; 
  selectedTime: string | null; 
  onSelectTime: (time: string) => void;
}) => {
  if (timeSlots.length === 0) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground py-4">
        <Info className="h-4 w-4" />
        <span className="text-sm">Nessuna fascia oraria disponibile per questo giorno</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="h-4 w-4" />
        <span>Seleziona l&apos;orario</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {timeSlots.map((slot) => (
          <button
            key={slot}
            onClick={() => onSelectTime(slot)}
            className={cn(
              "px-3 py-2 rounded-md text-sm font-medium transition-all",
              "border focus:outline-none focus:ring-2 focus:ring-primary/20",
              selectedTime === slot 
                ? "bg-primary text-primary-foreground border-primary shadow-sm" 
                : "bg-card hover:bg-muted border-input hover:border-primary/30"
            )}
          >
            {slot}
          </button>
        ))}
      </div>
    </div>
  );
};

const TableInfoCard = ({ 
  table, 
  booking, 
  onClose 
}: { 
  table: Tavolo; 
  booking?: Prenotazione; 
  onClose: () => void;
}) => (
  <div className="absolute top-4 right-4 z-30 w-72 bg-card/95 backdrop-blur border rounded-xl shadow-2xl p-4 animate-in slide-in-from-right-2 fade-in duration-200">
    <div className="flex items-start justify-between mb-3">
      <div className="flex items-center gap-2">
        <div className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center",
          booking ? "bg-rose-100" : "bg-emerald-100"
        )}>
          <Utensils className={cn(
            "w-5 h-5",
            booking ? "text-rose-600" : "text-emerald-600"
          )} />
        </div>
        <div>
          <h3 className="font-semibold text-lg">Tavolo {table.numero}</h3>
          <p className="text-xs text-muted-foreground">{table.capienza} coperti • {table.zona || 'Senza zona'}</p>
        </div>
      </div>
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
        <X className="h-4 w-4" />
      </Button>
    </div>
    
    {booking ? (
      <div className="space-y-3">
        <Badge variant="destructive" className="w-full justify-center py-1">
          <AlertCircle className="w-3 h-3 mr-1" />
          Occupato
        </Badge>
        
        <div className="space-y-2 bg-muted/50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-sm">
            <User className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">{booking.cliente.nome}</span>
          </div>
          {booking.cliente.telefono && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">{booking.cliente.telefono}</span>
            </div>
          )}
          {booking.cliente.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground text-xs truncate">{booking.cliente.email}</span>
            </div>
          )}
          <Separator />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Persone:</span>
            <span className="font-medium">{booking.numeroPersone}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Stato:</span>
            <Badge variant={booking.stato === 'confermata' ? 'default' : 'secondary'} className="text-xs">
              {booking.stato}
            </Badge>
          </div>
          {booking.note && (
            <div className="text-sm">
              <span className="text-muted-foreground">Note:</span>
              <p className="mt-1 text-xs italic">&quot;{booking.note}&quot;</p>
            </div>
          )}
        </div>
      </div>
    ) : (
      <div className="space-y-3">
        <Badge variant="default" className="w-full justify-center py-1 bg-emerald-500 hover:bg-emerald-600">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Disponibile
        </Badge>
        
        <div className="bg-emerald-50 rounded-lg p-3 text-center">
          <p className="text-sm text-emerald-800">
            Questo tavolo è disponibile per la prenotazione
          </p>
        </div>
      </div>
    )}
    
    <div className="mt-3 pt-3 border-t text-xs text-muted-foreground text-center">
      {table.tipo === 'rotondo' ? 'Tavolo rotondo' : 'Tavolo rettangolare'}
    </div>
  </div>
);

const MiniMap = ({ 
  zoom, 
  pan, 
  onReset 
}: { 
  zoom: number; 
  pan: { x: number; y: number }; 
  onReset: () => void;
}) => {
  if (zoom <= 1.1) return null;
  
  const mapWidth = 120;
  const mapHeight = 120;
  const scale = mapWidth / 2000;
  
  const viewportX = -pan.x / zoom * scale;
  const viewportY = -pan.y / zoom * scale;
  const viewportW = (mapWidth / zoom);
  const viewportH = (mapHeight / zoom);
  
  return (
    <div className="absolute bottom-4 right-4 z-20 bg-card/95 backdrop-blur border rounded-lg shadow-lg p-2">
      <div className="text-xs font-medium text-muted-foreground mb-1 text-center">Mappa</div>
      <svg 
        width={mapWidth} 
        height={mapHeight} 
        className="bg-muted/50 rounded cursor-pointer"
        onClick={onReset}
      >
        <rect width={mapWidth} height={mapHeight} fill="hsl(var(--muted))" opacity="0.3" />
        <rect 
          x={Math.max(0, Math.min(viewportX, mapWidth - viewportW))}
          y={Math.max(0, Math.min(viewportY, mapHeight - viewportH))}
          width={Math.min(viewportW, mapWidth)}
          height={Math.min(viewportH, mapHeight)}
          fill="hsl(var(--primary))"
          opacity="0.4"
          rx="2"
        />
      </svg>
    </div>
  );
};

// Componente piantina interattiva con zoom
const FloorPlanViewer = ({ 
  zone, 
  muri, 
  tavoli, 
  reservationsForSelectedSlot,
  isLoading,
  compact = false
}: { 
  zone: Zona[]; 
  muri: Muro[]; 
  tavoli: Tavolo[];
  reservationsForSelectedSlot: Prenotazione[];
  isLoading: boolean;
  compact?: boolean;
}) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [showZones, setShowZones] = useState(true);
  const [showWalls, setShowWalls] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const initialPinchDistanceRef = useRef<number | null>(null);
  const initialZoomRef = useRef<number>(1);

  const handleZoomIn = () => setZoom(z => Math.min(z * 1.2, 4));
  const handleZoomOut = () => setZoom(z => Math.max(z / 1.2, 0.5));
  const handleReset = () => { 
    setZoom(1); 
    setPan({ x: 0, y: 0 }); 
    setSelectedTableId(null);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === svgRef.current || (e.target as HTMLElement).tagName === 'rect') {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      setDragStart({ 
        x: e.touches[0].clientX - pan.x, 
        y: e.touches[0].clientY - pan.y 
      });
    } else if (e.touches.length === 2) {
      setIsDragging(false);
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      initialPinchDistanceRef.current = distance;
      initialZoomRef.current = zoom;
    }
  }, [pan, zoom]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    
    if (e.touches.length === 1 && isDragging && touchStartRef.current) {
      setPan({ 
        x: e.touches[0].clientX - dragStart.x, 
        y: e.touches[0].clientY - dragStart.y 
      });
    } else if (e.touches.length === 2 && initialPinchDistanceRef.current) {
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const scale = distance / initialPinchDistanceRef.current;
      setZoom(Math.max(0.5, Math.min(4, initialZoomRef.current * scale)));
    }
  }, [isDragging, dragStart]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    touchStartRef.current = null;
    initialPinchDistanceRef.current = null;
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(z => Math.max(0.5, Math.min(4, z * delta)));
  }, []);

  const selectedTable = selectedTableId ? tavoli.find(t => t.id === selectedTableId) : null;
  const selectedBooking = selectedTableId 
    ? reservationsForSelectedSlot.find(r => r.tavoloId === selectedTableId) 
    : undefined;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const minHeightClass = compact ? "min-h-[350px]" : "min-h-[500px]";

  return (
    <div ref={containerRef} className={`relative w-full h-full bg-muted/30 rounded-lg overflow-hidden ${minHeightClass}`}>
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
        <div className="bg-card rounded-lg shadow-lg border p-1 flex flex-col gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomIn}>
                <ZoomIn className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoom in</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomOut}>
                <ZoomOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoom out</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleReset}>
                <Maximize2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reset view</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <div className="absolute top-4 left-16 z-20 hidden sm:block">
        <div className="bg-card rounded-lg shadow-lg border p-2 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch 
              id="zones" 
              checked={showZones} 
              onCheckedChange={setShowZones}
              className="scale-75"
            />
            <Label htmlFor="zones" className="text-xs cursor-pointer">Zone</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch 
              id="walls" 
              checked={showWalls} 
              onCheckedChange={setShowWalls}
              className="scale-75"
            />
            <Label htmlFor="walls" className="text-xs cursor-pointer">Muri</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch 
              id="labels" 
              checked={showLabels} 
              onCheckedChange={setShowLabels}
              className="scale-75"
            />
            <Label htmlFor="labels" className="text-xs cursor-pointer">Label</Label>
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 left-4 z-20 max-w-[calc(100%-100px)]">
        <Legend 
          showZones={showZones}
          showWalls={showWalls}
          onToggleZones={() => setShowZones(!showZones)}
          onToggleWalls={() => setShowWalls(!showWalls)}
        />
      </div>

      <div className="absolute top-4 right-4 z-20 bg-card/90 backdrop-blur px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground shadow-lg border">
        {Math.round(zoom * 100)}%
      </div>

      <MiniMap zoom={zoom} pan={pan} onReset={handleReset} />

      {selectedTable && (
        <TableInfoCard 
          table={selectedTable}
          booking={selectedBooking}
          onClose={() => setSelectedTableId(null)}
        />
      )}

      <div 
        ref={containerRef}
        className="w-full h-full overflow-hidden cursor-grab active:cursor-grabbing touch-pan-y"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onWheel={handleWheel}
        style={{ touchAction: 'none' }}
      >
        <svg 
          ref={svgRef}
          className="w-full h-full"
          viewBox="0 0 2000 2000"
          preserveAspectRatio="xMidYMid meet"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.2s ease-out'
          }}
        >
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" strokeOpacity="0.3"/>
            </pattern>
            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.1"/>
            </filter>
          </defs>
          <rect width="2000" height="2000" fill="url(#grid)" />
          <rect width="2000" height="2000" fill="hsl(var(--background))" fillOpacity="0.5" />
          
          {showZones && zone.map(z => {
            const centroid = getPolygonCentroid(z.path);
            return (
              <g key={z.id} className="transition-opacity duration-200">
                <polygon
                  points={z.path.map(p => `${p.x},${p.y}`).join(' ')}
                  fill={z.colore || 'hsl(var(--muted))'}
                  stroke={z.colore ? z.colore.substring(0, 7) : 'hsl(var(--border))'}
                  strokeWidth="2"
                  strokeOpacity="0.5"
                  opacity="0.6"
                />
                {showLabels && (
                  <text 
                    x={centroid.x} 
                    y={centroid.y} 
                    textAnchor="middle" 
                    dy=".3em" 
                    className="fill-muted-foreground font-semibold pointer-events-none select-none"
                    fontSize="14"
                    opacity="0.7"
                  >
                    {z.nome}
                  </text>
                )}
              </g>
            );
          })}

          {showWalls && muri.map((wall) => (
            <line 
              key={wall.id} 
              x1={wall.points[0].x} 
              y1={wall.points[0].y} 
              x2={wall.points[1].x} 
              y2={wall.points[1].y} 
              strokeWidth={wall.spessore} 
              className="stroke-foreground" 
              strokeLinecap="round" 
              opacity="0.5"
            />
          ))}
          
          {tavoli.map(table => {
            const booking = reservationsForSelectedSlot.find(r => r.tavoloId === table.id);
            return (
              <g key={table.id}>
                <ReadOnlyTable 
                  {...table}
                  status={booking ? 'booked' : 'free'}
                  isSelected={selectedTableId === table.id}
                  onClick={() => setSelectedTableId(table.id)}
                  booking={booking}
                />
              </g>
            );
          })}
        </svg>
      </div>
      
      <div className="absolute bottom-4 right-4 mb-16 z-10 pointer-events-none hidden md:block">
        <div className="bg-card/80 backdrop-blur px-3 py-2 rounded-lg text-xs text-muted-foreground shadow border opacity-70">
          <p>🖱️ Drag per spostare • Scroll per zoomare</p>
          <p>👆 Click su tavolo per dettagli</p>
        </div>
      </div>
      <div className="absolute bottom-4 right-4 mb-12 z-10 pointer-events-none md:hidden">
        <div className="bg-card/90 backdrop-blur px-2 py-1.5 rounded-lg text-[10px] text-muted-foreground shadow border opacity-80">
          <p>👆 Tocca e trascina • Pinch per zoomare</p>
        </div>
      </div>
    </div>
  );
};

// Main page component
export default function ReservationsPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<'list' | 'floorplan'>('list');

  const ristoranteQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, 'ristoranti'), where('proprietarioUid', '==', user.uid));
  }, [user, firestore]);
  const { data: ristorantiData, isLoading: isLoadingRistorante } = useCollection<Ristorante>(ristoranteQuery);
  const ristorante = useMemo(() => (ristorantiData && ristorantiData.length > 0 ? ristorantiData[0] : null), [ristorantiData]);
  const ristoranteId = ristorante?.id;

  const tavoliQuery = useMemoFirebase(() => ristoranteId ? collection(firestore, 'ristoranti', ristoranteId, 'tavoli') : null, [firestore, ristoranteId]);
  const { data: tavoliData, isLoading: isLoadingTavoli } = useCollection<Tavolo>(tavoliQuery);
  const tavoli = tavoliData || [];

  const zoneQuery = useMemoFirebase(() => ristoranteId ? collection(firestore, 'ristoranti', ristoranteId, 'zone') : null, [firestore, ristoranteId]);
  const { data: zoneRaw, isLoading: isLoadingZone } = useCollection<any>(zoneQuery);
  
  const muriQuery = useMemoFirebase(() => ristoranteId ? collection(firestore, 'ristoranti', ristoranteId, 'muri') : null, [firestore, ristoranteId]);
  const { data: muriRaw, isLoading: isLoadingMuri } = useCollection<any>(muriQuery);

  const hoursQuery = useMemoFirebase(() => ristoranteId ? collection(firestore, 'ristoranti', ristoranteId, 'dailyOpeningHours') : null, [firestore, ristoranteId]);
  const { data: openingHours, isLoading: isLoadingHours } = useCollection<DailyOpeningHours>(hoursQuery);

  const reservationsQuery = useMemoFirebase(() => ristoranteId ? collection(firestore, 'ristoranti', ristoranteId, 'prenotazioni') : null, [firestore, ristoranteId]);
  const { data: reservationsRaw, isLoading: isLoadingReservations } = useCollection<any>(reservationsQuery);

  const loading = isLoadingRistorante || isLoadingTavoli || isLoadingZone || isLoadingMuri || isLoadingHours || isLoadingReservations;

  const zone = useMemo(() => {
    if (!zoneRaw) return [];
    return zoneRaw.map((d: any) => {
      const path = (d.pathX || []).map((x: number, i: number) => ({ x, y: (d.pathY || [])[i] ?? 0 }));
      return { id: d.id, path, nome: d.nome, colore: d.colore } as Zona;
    });
  }, [zoneRaw]);

  const muri = useMemo(() => {
    if (!muriRaw) return [];
    return muriRaw.map((d: any) => {
      const points = (d.pointsX || []).map((x: number, i: number) => ({ x, y: (d.pointsY || [])[i] ?? 0 }));
      return { id: d.id, points, spessore: d.spessore } as Muro;
    });
  }, [muriRaw]);

  const reservations = useMemo(() => {
    if (!reservationsRaw) return [];
    return reservationsRaw.map((d: any) => {
      return { ...d, data: (d.data as Timestamp).toDate() } as Prenotazione;
    });
  }, [reservationsRaw]);

  const weekStartsOn = 1;
  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn });
    return Array.from({ length: 7 }).map((_, i) => addDays(start, i));
  }, [currentDate]);

  const timeSlots = useMemo(() => {
    if (!openingHours) return [];
    const dayIndex = getDay(selectedDate);
    const dayName = ['domenica', 'lunedi', 'martedi', 'mercoledi', 'giovedi', 'venerdi', 'sabato'][dayIndex];
    
    const daySlots = openingHours
        .filter(h => h.dayOfWeek === dayName && h.aperto)
        .sort((a, b) => a.dalle.localeCompare(b.dalle));

    if (daySlots.length === 0) return [];

    const allSlots: string[] = [];
    const turnDuration = ristorante?.durataTurnoDefault || 60;

    daySlots.forEach(slot => {
        let currentTime = new Date(`1970-01-01T${slot.dalle}:00`);
        const endTime = new Date(`1970-01-01T${slot.alle}:00`);
        
        while (currentTime < endTime) {
            allSlots.push(format(currentTime, 'HH:mm'));
            currentTime.setMinutes(currentTime.getMinutes() + turnDuration);
        }
    });

    return allSlots;
  }, [selectedDate, openingHours, ristorante]);

  useEffect(() => {
    if (timeSlots.length > 0) {
      if (!selectedTime || !timeSlots.includes(selectedTime)) {
        setSelectedTime(timeSlots[0]);
      }
    } else {
      setSelectedTime(null);
    }
  }, [timeSlots, selectedTime]);

  const reservationsForSelectedSlot = useMemo(() => {
    if (!selectedTime || !reservations) return [];
    return reservations.filter(r => isSameDay(r.data as Date, selectedDate) && r.ora === selectedTime);
  }, [reservations, selectedDate, selectedTime]);

  const getStatusVariant = (status: string) => {
    switch (status) {
        case 'confermata': return 'default';
        case 'completata': return 'secondary';
        case 'cancellata': return 'destructive';
        case 'no-show': return 'destructive';
        default: return 'outline';
    }
  };

  const stats = useMemo(() => {
    const totalTables = tavoli.length;
    const bookedTables = reservationsForSelectedSlot.length;
    const availableTables = totalTables - bookedTables;
    const totalCovers = reservationsForSelectedSlot.reduce((acc, r) => acc + r.numeroPersone, 0);
    
    return { totalTables, bookedTables, availableTables, totalCovers };
  }, [tavoli, reservationsForSelectedSlot]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!ristorante) {
     return (
        <div className="text-center py-12">
            <Armchair className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">Nessun ristorante trovato</p>
            <p className="text-muted-foreground">Completa la configurazione nelle impostazioni.</p>
        </div>
     );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Prenotazioni</h1>
            <p className="text-muted-foreground">
              Gestisci le prenotazioni per {ristorante.nome}
            </p>
          </div>
          
          {selectedTime && (
            <div className="flex flex-wrap items-center gap-3">
              <Card className="px-4 py-2">
                <div className="flex items-center gap-2 text-sm">
                  <Armchair className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Tavoli:</span>
                  <span className="font-semibold">{stats.bookedTables}/{stats.totalTables}</span>
                </div>
              </Card>
              <Card className="px-4 py-2">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Coperti:</span>
                  <span className="font-semibold">{stats.totalCovers}</span>
                </div>
              </Card>
            </div>
          )}
        </div>

        <div className="lg:hidden mb-4">
          <div className="bg-muted rounded-lg p-1 flex gap-1">
            <button
              onClick={() => setMobileView('list')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all",
                mobileView === 'list' 
                  ? "bg-card text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <List className="w-4 h-4" />
              Lista
            </button>
            <button
              onClick={() => setMobileView('floorplan')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all",
                mobileView === 'floorplan' 
                  ? "bg-card text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutGrid className="w-4 h-4" />
              Piantina
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          <div className={cn(
            "lg:col-span-4 space-y-4",
            mobileView !== 'list' && "hidden lg:block"
          )}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  Seleziona Data
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DaySelector 
                  weekDays={weekDays}
                  selectedDate={selectedDate}
                  onSelectDate={setSelectedDate}
                  currentDate={currentDate}
                  onChangeWeek={(direction) => setCurrentDate(d => addDays(d, direction === 'prev' ? -7 : 7))}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Orari Disponibili
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TimeSlotSelector 
                  timeSlots={timeSlots}
                  selectedTime={selectedTime}
                  onSelectTime={setSelectedTime}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Prenotazioni
                  {selectedTime && (
                    <Badge variant="secondary" className="ml-auto">
                      {format(selectedDate, 'dd/MM')} alle {selectedTime}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px] pr-4">
                  {reservationsForSelectedSlot.length > 0 ? (
                    <div className="space-y-3">
                      {reservationsForSelectedSlot.map((res) => {
                        const table = tavoli.find(t => t.id === res.tavoloId);
                        return (
                          <div 
                            key={res.id} 
                            className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="font-semibold text-primary">
                                  {res.cliente.nome.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-sm">{res.cliente.nome}</p>
                                <p className="text-xs text-muted-foreground">
                                  {res.numeroPersone} persone • Tavolo {table?.numero || 'N/A'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {(res.stato === 'completata' || res.stato === 'confermata') && res.cliente?.email && (
                                <SendReviewButton
                                  prenotazione={res}
                                  ristoranteId={ristoranteId || ''}
                                  restaurantName={ristorante?.nome}
                                  variant="ghost"
                                  size="icon"
                                />
                              )}
                              <Badge variant={getStatusVariant(res.stato)} className="text-xs">
                                {res.stato}
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Nessuna prenotazione per questa fascia oraria</p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          <div className={cn(
            "lg:col-span-8",
            mobileView !== 'floorplan' && "hidden lg:block"
          )}>
            <Card className="h-full min-h-[400px] lg:min-h-[600px] flex flex-col">
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Armchair className="h-4 w-4" />
                      Piantina del Locale
                    </CardTitle>
                    {selectedTime && (
                      <CardDescription className="hidden sm:block">
                        Visualizzazione per {format(selectedDate, 'EEEE d MMMM', { locale: it })} alle {selectedTime}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {stats.availableTables} lib
                    </Badge>
                    <Badge variant="destructive" className="text-xs">
                      {stats.bookedTables} occ
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-0">
                <FloorPlanViewer 
                  zone={zone}
                  muri={muri}
                  tavoli={tavoli}
                  reservationsForSelectedSlot={reservationsForSelectedSlot}
                  isLoading={isLoadingTavoli || isLoadingZone || isLoadingMuri}
                  compact={mobileView === 'floorplan'}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
