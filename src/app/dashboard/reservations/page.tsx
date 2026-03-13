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
  Utensils,
  CheckCircle2,
  AlertCircle,
  LayoutGrid,
  List,
  Expand,
  Minimize2,
  Map,
} from 'lucide-react';

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from '@/lib/utils';
import { ScrollArea } from "@/components/ui/scroll-area";
import { SendReviewButton } from "@/components/reviewflow/send-review-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

interface ReadOnlyTableProps extends Tavolo {
  status?: 'free' | 'booked';
}

// Componente Tavolo SVG migliorato
const ReadOnlyTable = ({ 
  x, y, width, height, rotation, tipo, numero, capienza, status,
  isSelected,
  onClick,
  booking,
  scale = 1
}: ReadOnlyTableProps & { 
  isSelected?: boolean;
  onClick?: () => void;
  booking?: Prenotazione;
  scale?: number;
}) => {
  const isRound = tipo === 'rotondo';
  const isBooked = status === 'booked';
  
  const tableColors = {
    free: {
      fill: 'fill-emerald-100',
      stroke: '#10b981',
      text: 'fill-emerald-700',
      glow: 'rgba(16, 185, 129, 0.3)'
    },
    booked: {
      fill: 'fill-rose-100',
      stroke: '#f43f5e',
      text: 'fill-rose-700',
      glow: 'rgba(244, 63, 94, 0.3)'
    },
    selected: {
      fill: 'fill-blue-100',
      stroke: '#3b82f6',
      text: 'fill-blue-700',
      glow: 'rgba(59, 130, 246, 0.5)'
    }
  };
  
  const colors = isSelected ? tableColors.selected : (isBooked ? tableColors.booked : tableColors.free);
  
  return (
    <g 
      transform={`translate(${x}, ${y}) rotate(${rotation})`}
      className="cursor-pointer transition-all"
      onClick={onClick}
      style={{ filter: isSelected ? `drop-shadow(0 0 8px ${colors.glow})` : undefined }}
    >
      {isSelected && (
        <rect 
          x={-width/2 - 10} 
          y={-height/2 - 10}
          width={width + 20}
          height={height + 20}
          rx={isRound ? (width+20)/2 : 12}
          ry={isRound ? (height+20)/2 : 12}
          fill={colors.glow}
          className="animate-pulse"
        />
      )}
      
      <rect 
        x={-width/2} 
        y={-height/2}
        width={width}
        height={height}
        rx={isRound ? width/2 : 10}
        ry={isRound ? height/2 : 10}
        className={cn(
          "transition-all duration-200 hover:brightness-95",
          colors.fill
        )}
        stroke={colors.stroke}
        strokeWidth={isSelected ? 3 : 2}
      />
      
      <circle
        cx={width/2 - 8}
        cy={-height/2 + 8}
        r={5}
        className={cn(
          isBooked ? "fill-rose-500" : "fill-emerald-500"
        )}
      />
      
      <text 
        textAnchor="middle" 
        dy="-0.1em" 
        className={cn(
          "font-bold select-none pointer-events-none",
          colors.text
        )}
        style={{ fontSize: `${14 * scale}px` }}
      >
        {numero}
      </text>
      
      <text 
        textAnchor="middle" 
        dy="1.2em" 
        className="fill-muted-foreground font-medium select-none pointer-events-none"
        style={{ fontSize: `${10 * scale}px` }}
      >
        {capienza}p
      </text>
      
      {isBooked && booking && (
        <text 
          textAnchor="middle" 
          dy="2.2em" 
          className="fill-rose-600 select-none pointer-events-none font-bold"
          style={{ fontSize: `${8 * scale}px` }}
        >
          OCC
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
  <div className="flex flex-col gap-2 bg-card/95 backdrop-blur border rounded-xl shadow-lg p-3">
    <div className="flex items-center gap-3 text-xs flex-wrap">
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
          <span className="font-semibold text-sm">
            {format(currentDate, 'MMMM yyyy', { locale: it })}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => onChangeWeek('prev')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => onChangeWeek('next')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map((day) => (
          <div key={day} className="text-center text-[10px] font-semibold text-muted-foreground py-1 uppercase tracking-wider">
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
                "flex flex-col items-center justify-center p-1.5 rounded-xl transition-all",
                "hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/20",
                isSelected && "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md",
                !isSelected && isToday && "bg-primary/10 text-primary font-semibold ring-1 ring-primary/30"
              )}
            >
              <span className={cn(
                "text-[10px] font-medium",
                isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
              )}>
                {format(day, 'EEE', { locale: it }).slice(0, 3)}
              </span>
              <span className={cn(
                "text-base font-bold leading-tight",
                isToday && !isSelected && "text-primary"
              )}>
                {format(day, 'd')}
              </span>
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
      <div className="flex flex-col items-center gap-2 text-muted-foreground py-6 text-center">
        <Info className="h-8 w-8 opacity-40" />
        <span className="text-sm">Nessuna fascia oraria disponibile</span>
        <span className="text-xs text-muted-foreground">Verifica gli orari di apertura nelle impostazioni</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="h-4 w-4" />
        <span className="font-medium">Seleziona orario</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {timeSlots.map((slot) => (
          <button
            key={slot}
            onClick={() => onSelectTime(slot)}
            className={cn(
              "px-3 py-2 rounded-lg text-sm font-semibold transition-all",
              "border-2 focus:outline-none focus:ring-2 focus:ring-primary/20",
              selectedTime === slot 
                ? "bg-primary text-primary-foreground border-primary shadow-md scale-105" 
                : "bg-card hover:bg-muted border-transparent hover:border-primary/30"
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
  <div className="absolute top-4 right-4 z-30 w-72 bg-card/95 backdrop-blur-xl border rounded-2xl shadow-2xl p-4 animate-in slide-in-from-right-2 fade-in duration-200">
    <div className="flex items-start justify-between mb-3">
      <div className="flex items-center gap-3">
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center shadow-inner",
          booking ? "bg-rose-100" : "bg-emerald-100"
        )}>
          <Utensils className={cn(
            "w-6 h-6",
            booking ? "text-rose-600" : "text-emerald-600"
          )} />
        </div>
        <div>
          <h3 className="font-bold text-lg">Tavolo {table.numero}</h3>
          <p className="text-xs text-muted-foreground">{table.capienza} coperti • {table.zona || 'Generale'}</p>
        </div>
      </div>
      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={onClose}>
        <X className="h-4 w-4" />
      </Button>
    </div>
    
    {booking ? (
      <div className="space-y-3">
        <Badge variant="destructive" className="w-full justify-center py-1.5 text-sm">
          <AlertCircle className="w-4 h-4 mr-1.5" />
          Occupato
        </Badge>
        
        <div className="space-y-2.5 bg-muted/50 rounded-xl p-3">
          <div className="flex items-center gap-2.5 text-sm">
            <User className="w-4 h-4 text-muted-foreground" />
            <span className="font-semibold">{booking.cliente.nome}</span>
          </div>
          {booking.cliente.telefono && (
            <div className="flex items-center gap-2.5 text-sm">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">{booking.cliente.telefono}</span>
            </div>
          )}
          {booking.cliente.email && (
            <div className="flex items-center gap-2.5 text-sm">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground text-xs truncate">{booking.cliente.email}</span>
            </div>
          )}
          <Separator />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Persone:</span>
            <span className="font-bold">{booking.numeroPersone}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Stato:</span>
            <Badge variant={booking.stato === 'confermata' ? 'default' : 'secondary'} className="text-xs">
              {booking.stato}
            </Badge>
          </div>
          {booking.note && (
            <div className="text-sm pt-1">
              <span className="text-muted-foreground text-xs">Note:</span>
              <p className="mt-1 text-xs italic bg-white/50 p-2 rounded-lg">&quot;{booking.note}&quot;</p>
            </div>
          )}
        </div>
      </div>
    ) : (
      <div className="space-y-3">
        <Badge className="w-full justify-center py-1.5 text-sm bg-emerald-500 hover:bg-emerald-600">
          <CheckCircle2 className="w-4 h-4 mr-1.5" />
          Disponibile
        </Badge>
        
        <div className="bg-emerald-50 rounded-xl p-4 text-center">
          <p className="text-sm text-emerald-800 font-medium">
            Questo tavolo è disponibile per la prenotazione
          </p>
        </div>
      </div>
    )}
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
  
  const mapWidth = 100;
  const mapHeight = 100;
  const scale = mapWidth / 2000;
  
  const viewportX = -pan.x / zoom * scale;
  const viewportY = -pan.y / zoom * scale;
  const viewportW = (mapWidth / zoom);
  const viewportH = (mapHeight / zoom);
  
  return (
    <div className="absolute bottom-4 right-4 z-20 bg-card/95 backdrop-blur border rounded-xl shadow-lg p-2">
      <div className="text-[10px] font-bold text-muted-foreground mb-1 text-center uppercase tracking-wide">Mappa</div>
      <svg 
        width={mapWidth} 
        height={mapHeight} 
        className="bg-muted/50 rounded-lg cursor-pointer border"
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
          rx="4"
        />
      </svg>
    </div>
  );
};

// Componente piantina interattiva con zoom - VERSIONE RESPONSIVE
const FloorPlanViewer = ({ 
  zone, 
  muri, 
  tavoli, 
  reservationsForSelectedSlot,
  isLoading,
}: { 
  zone: Zona[]; 
  muri: Muro[]; 
  tavoli: Tavolo[];
  reservationsForSelectedSlot: Prenotazione[];
  isLoading: boolean;
}) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [showZones, setShowZones] = useState(true);
  const [showWalls, setShowWalls] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const initialPinchDistanceRef = useRef<number | null>(null);
  const initialZoomRef = useRef<number>(1);

  // Calcola bounds dei tavoli per auto-zoom
  useEffect(() => {
    if (tavoli.length > 0 && containerRef.current) {
      const padding = 200;
      const xs = tavoli.map(t => t.x);
      const ys = tavoli.map(t => t.y);
      const minX = Math.min(...xs) - padding;
      const maxX = Math.max(...xs) + padding;
      const minY = Math.min(...ys) - padding;
      const maxY = Math.max(...ys) + padding;
      
      const contentWidth = maxX - minX;
      const contentHeight = maxY - minY;
      
      const containerWidth = containerRef.current.clientWidth;
      const containerHeight = containerRef.current.clientHeight;
      
      const scaleX = containerWidth / contentWidth;
      const scaleY = containerHeight / contentHeight;
      const initialZoom = Math.min(scaleX, scaleY, 1.2);
      
      setZoom(Math.max(0.3, initialZoom));
      setPan({
        x: (containerWidth - contentWidth * initialZoom) / 2 - minX * initialZoom,
        y: (containerHeight - contentHeight * initialZoom) / 2 - minY * initialZoom
      });
    }
  }, [tavoli, isFullscreen]);

  const handleZoomIn = () => setZoom(z => Math.min(z * 1.2, 4));
  const handleZoomOut = () => setZoom(z => Math.max(z / 1.2, 0.3));
  const handleReset = () => { 
    if (tavoli.length > 0) {
      const padding = 200;
      const xs = tavoli.map(t => t.x);
      const ys = tavoli.map(t => t.y);
      const minX = Math.min(...xs) - padding;
      const maxX = Math.max(...xs) + padding;
      const minY = Math.min(...ys) - padding;
      const maxY = Math.max(...ys) + padding;
      
      const contentWidth = maxX - minX;
      const contentHeight = maxY - minY;
      
      const containerWidth = containerRef.current?.clientWidth || 800;
      const containerHeight = containerRef.current?.clientHeight || 600;
      
      const scaleX = containerWidth / contentWidth;
      const scaleY = containerHeight / contentHeight;
      const initialZoom = Math.min(scaleX, scaleY, 1.2);
      
      setZoom(Math.max(0.3, initialZoom));
      setPan({
        x: (containerWidth - contentWidth * initialZoom) / 2 - minX * initialZoom,
        y: (containerHeight - contentHeight * initialZoom) / 2 - minY * initialZoom
      });
    }
    setSelectedTableId(null);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
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
      setZoom(Math.max(0.3, Math.min(4, initialZoomRef.current * scale)));
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
    setZoom(z => Math.max(0.3, Math.min(4, z * delta)));
  }, []);

  const selectedTable = selectedTableId ? tavoli.find(t => t.id === selectedTableId) : null;
  const selectedBooking = selectedTableId 
    ? reservationsForSelectedSlot.find(r => r.tavoloId === selectedTableId) 
    : undefined;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (tavoli.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center p-8">
        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
          <LayoutGrid className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Nessun tavolo configurato</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Vai nella sezione &quot;Piantina&quot; per aggiungere i tavoli del tuo locale
        </p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[400px] lg:min-h-[500px] bg-gradient-to-br from-muted/20 to-muted/40 rounded-xl overflow-hidden">
      {/* Toolbar verticale a sinistra */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
        <div className="bg-card rounded-xl shadow-lg border p-1.5 flex flex-col gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg" onClick={handleZoomIn}>
                <ZoomIn className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoom in</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg" onClick={handleZoomOut}>
                <ZoomOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoom out</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg" onClick={handleReset}>
                <Maximize2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reset view</TooltipContent>
          </Tooltip>
          <div className="h-px bg-border my-1" />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg" onClick={toggleFullscreen}>
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Expand className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isFullscreen ? 'Esci fullscreen' : 'Fullscreen'}</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Toggle layer */}
      <div className="absolute top-4 left-16 z-20 hidden sm:block">
        <div className="bg-card rounded-xl shadow-lg border p-2 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch 
              id="zones" 
              checked={showZones} 
              onCheckedChange={setShowZones}
              className="scale-75 data-[state=checked]:bg-primary"
            />
            <Label htmlFor="zones" className="text-xs cursor-pointer font-medium">Zone</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch 
              id="walls" 
              checked={showWalls} 
              onCheckedChange={setShowWalls}
              className="scale-75 data-[state=checked]:bg-primary"
            />
            <Label htmlFor="walls" className="text-xs cursor-pointer font-medium">Muri</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch 
              id="labels" 
              checked={showLabels} 
              onCheckedChange={setShowLabels}
              className="scale-75 data-[state=checked]:bg-primary"
            />
            <Label htmlFor="labels" className="text-xs cursor-pointer font-medium">Nomi</Label>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-20 max-w-[calc(100%-120px)]">
        <Legend 
          showZones={showZones}
          showWalls={showWalls}
          onToggleZones={() => setShowZones(!showZones)}
          onToggleWalls={() => setShowWalls(!showWalls)}
        />
      </div>

      {/* Zoom indicator */}
      <div className="absolute top-4 right-4 z-20 bg-card/90 backdrop-blur px-3 py-1.5 rounded-lg text-xs font-bold text-muted-foreground shadow-lg border">
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
            transformOrigin: '0 0',
            transition: isDragging ? 'none' : 'transform 0.2s ease-out'
          }}
        >
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" strokeOpacity="0.3"/>
            </pattern>
            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15"/>
            </filter>
          </defs>
          <rect width="2000" height="2000" fill="url(#grid)" />
          <rect width="2000" height="2000" fill="hsl(var(--background))" fillOpacity="0.3" />
          
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
                  opacity="0.5"
                />
                {showLabels && (
                  <text 
                    x={centroid.x} 
                    y={centroid.y} 
                    textAnchor="middle" 
                    dy=".3em" 
                    className="fill-muted-foreground font-bold pointer-events-none select-none"
                    fontSize="14"
                    opacity="0.8"
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
              opacity="0.6"
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
                  scale={Math.max(0.7, Math.min(1.2, 1 / zoom))}
                />
              </g>
            );
          })}
        </svg>
      </div>
      
      {/* Help text */}
      <div className="absolute bottom-4 right-4 mb-20 z-10 pointer-events-none hidden md:block">
        <div className="bg-card/90 backdrop-blur px-4 py-2 rounded-xl text-xs text-muted-foreground shadow-lg border">
          <p className="font-medium">🖱️ Drag per spostare • Scroll per zoomare</p>
          <p>👆 Click su tavolo per dettagli</p>
        </div>
      </div>
      <div className="absolute bottom-4 right-4 mb-16 z-10 pointer-events-none md:hidden">
        <div className="bg-card/95 backdrop-blur px-3 py-2 rounded-xl text-[10px] text-muted-foreground shadow-lg border">
          <p className="font-medium">👆 Tocca e trascina • Pinch per zoomare</p>
        </div>
      </div>
    </div>
  );
};

// Lista prenotazioni component
const ReservationList = ({ 
  reservations, 
  tavoli, 
  getStatusVariant,
  ristoranteId,
  ristorante
}: { 
  reservations: Prenotazione[];
  tavoli: Tavolo[];
  getStatusVariant: (s: string) => string;
  ristoranteId?: string;
  ristorante?: Ristorante | null;
}) => {
  if (reservations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <Info className="h-8 w-8 text-muted-foreground opacity-50" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">Nessuna prenotazione</p>
        <p className="text-xs text-muted-foreground mt-1">Per questa fascia oraria</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {reservations.map((res) => {
        const table = tavoli.find(t => t.id === res.tavoloId);
        return (
          <div 
            key={res.id} 
            className="flex items-center justify-between p-4 rounded-xl border bg-card hover:bg-muted/50 transition-all hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shadow-inner">
                <span className="font-bold text-primary text-lg">
                  {res.cliente.nome.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-semibold text-sm">{res.cliente.nome}</p>
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
              <Badge variant={getStatusVariant(res.stato)} className="text-xs font-semibold">
                {res.stato}
              </Badge>
            </div>
          </div>
        );
      })}
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
  const [activeTab, setActiveTab] = useState('list');

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
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!ristorante) {
     return (
        <div className="flex flex-col items-center justify-center text-center py-20">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
            <Armchair className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-bold mb-2">Nessun ristorante trovato</h2>
          <p className="text-muted-foreground max-w-sm">Completa la configurazione nelle impostazioni per iniziare.</p>
        </div>
     );
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col flex-1 min-h-0 gap-4 max-w-[1600px] mx-auto w-full">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Prenotazioni</h1>
            <p className="text-muted-foreground text-sm">
              {ristorante.nome}
            </p>
          </div>
          {selectedTime && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-3 py-1 text-xs font-semibold">
                <Armchair className="h-3.5 w-3.5" />
                {stats.availableTables} liberi
              </span>
              <span className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-full px-3 py-1 text-xs font-semibold">
                <LayoutGrid className="h-3.5 w-3.5" />
                {stats.bookedTables} occupati
              </span>
              <span className="inline-flex items-center gap-1.5 bg-muted text-muted-foreground rounded-full px-3 py-1 text-xs font-medium">
                <Users className="h-3.5 w-3.5" />
                {stats.totalCovers} coperti
              </span>
            </div>
          )}
        </div>

        {/* Mobile Tabs */}
        <div className="lg:hidden shrink-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="list" className="flex items-center gap-2">
                <List className="h-4 w-4" />
                Lista
              </TabsTrigger>
              <TabsTrigger value="floorplan" className="flex items-center gap-2">
                <LayoutGrid className="h-4 w-4" />
                Piantina
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-12 gap-6 flex-1 min-h-0">

          {/* Sidebar sinistra — scroll indipendente su desktop */}
          <div className={cn(
            "lg:col-span-4 xl:col-span-3 flex flex-col gap-4 lg:overflow-y-auto lg:min-h-0",
            activeTab !== 'list' && "hidden lg:flex"
          )}>
            <Card className="border-2 shadow-sm shrink-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-primary" />
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

            <Card className="border-2 shadow-sm shrink-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
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

            <Card className="border-2 shadow-sm flex flex-col flex-1 min-h-0">
              <CardHeader className="pb-3 shrink-0">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  Prenotazioni
                  {selectedTime && (
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {format(selectedDate, 'dd/MM')} {selectedTime}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 min-h-0 pt-0">
                <ScrollArea className="h-full min-h-[200px] max-h-[400px] pr-4">
                  <ReservationList
                    reservations={reservationsForSelectedSlot}
                    tavoli={tavoli}
                    getStatusVariant={getStatusVariant}
                    ristoranteId={ristoranteId}
                    ristorante={ristorante}
                  />
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Piantina — colonna destra, riempie tutto lo spazio */}
          <div className={cn(
            "lg:col-span-8 xl:col-span-9 flex flex-col min-h-0",
            activeTab !== 'floorplan' && "hidden lg:flex"
          )}>
            <Card className="flex flex-col flex-1 min-h-[500px] border-2 shadow-sm">
              <CardHeader className="pb-3 border-b bg-muted/20 shrink-0">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Map className="h-4 w-4 text-primary" />
                      Piantina del Locale
                    </CardTitle>
                    {selectedTime && (
                      <CardDescription className="hidden sm:block">
                        {format(selectedDate, 'EEEE d MMMM', { locale: it })} alle {selectedTime}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                      {stats.availableTables} liberi
                    </Badge>
                    <Badge variant="destructive" className="text-xs">
                      {stats.bookedTables} occupati
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-3 min-h-0">
                <FloorPlanViewer
                  zone={zone}
                  muri={muri}
                  tavoli={tavoli}
                  reservationsForSelectedSlot={reservationsForSelectedSlot}
                  isLoading={isLoadingTavoli || isLoadingZone || isLoadingMuri}
                />
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </TooltipProvider>
  );
}
