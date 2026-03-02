import { FloorPlanEditor } from '@/components/floor-plan-editor/editor';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';

export default function FloorPlanPage() {
  return (
    <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl md:text-3xl font-bold">Piantina del Locale</h1>
            <Button>
                <Pencil className="mr-2 h-4 w-4" />
                Modalità Modifica
            </Button>
        </div>
        <div className="flex-1 border-2 border-dashed rounded-xl overflow-hidden">
             <FloorPlanEditor />
        </div>
    </div>
  );
}
