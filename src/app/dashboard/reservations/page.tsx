import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, MoreHorizontal } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const reservations = [
    { id: '1', time: '19:30', name: 'Paolo Bianchi', people: 2, table: 'Tavolo 5', status: 'confermata' },
    { id: '2', time: '19:45', name: 'Giulia Neri', people: 4, table: 'Tavolo 12', status: 'confermata' },
    { id: '3', time: '20:00', name: 'Marco Verdi', people: 3, table: 'Tavolo 2', status: 'completata' },
    { id: '4', time: '20:15', name: 'Famiglia Rossi', people: 5, table: 'Tavolo 8', status: 'cancellata' },
    { id: '5', time: '21:00', name: 'Luca Gialli', people: 2, table: 'Tavolo 3', status: 'no-show' },
    { id: '6', time: '21:30', name: 'Sara Costa', people: 2, table: 'Tavolo 7', status: 'confermata' },
];

const getStatusVariant = (status: string) => {
    switch (status) {
        case 'confermata': return 'default';
        case 'completata': return 'secondary';
        case 'cancellata': return 'destructive';
        case 'no-show': return 'destructive';
        default: return 'outline';
    }
}

const getStatusClass = (status: string) => {
    switch (status) {
        case 'confermata': return 'bg-green-500';
        case 'completata': return 'bg-gray-500';
        case 'cancellata': return 'bg-red-500';
        case 'no-show': return 'bg-yellow-500';
        default: return 'bg-gray-300';
    }
}

export default function ReservationsPage() {
  return (
    <div className="grid gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold">Prenotazioni</h1>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nuova Prenotazione
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Calendario Settimanale</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-16 text-center text-muted-foreground bg-muted rounded-lg">
            [Visualizzazione Calendario qui]
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Prenotazioni di Oggi</CardTitle>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Orario</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead className="text-center">Persone</TableHead>
                        <TableHead>Tavolo</TableHead>
                        <TableHead className="text-right">Stato</TableHead>
                        <TableHead><span className="sr-only">Azioni</span></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {reservations.map(res => (
                        <TableRow key={res.id}>
                            <TableCell className="font-medium">{res.time}</TableCell>
                            <TableCell>{res.name}</TableCell>
                            <TableCell className="text-center">{res.people}</TableCell>
                            <TableCell>{res.table}</TableCell>
                            <TableCell className="text-right">
                                <Badge variant={getStatusVariant(res.status)}>
                                    <span className={`mr-2 h-2 w-2 rounded-full ${getStatusClass(res.status)}`}></span>
                                    {res.status}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                            <span className="sr-only">Apri menu</span>
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem>Modifica</DropdownMenuItem>
                                        <DropdownMenuItem>Assegna tavolo</DropdownMenuItem>
                                        <DropdownMenuItem className="text-destructive">Cancella</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
}
