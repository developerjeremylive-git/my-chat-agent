import { Button } from '@/components/button/Button';
import { Card } from '@/components/card/Card';
import { Warning } from '@phosphor-icons/react';

interface ClearHistoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function ClearHistoryDialog({ isOpen, onClose, onConfirm }: ClearHistoryDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white dark:bg-neutral-900 p-6 rounded-2xl shadow-xl transform transition-all duration-300 scale-100">
        <div className="text-center space-y-4">
          <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
            <Warning className="w-6 h-6 text-red-600 dark:text-red-400" weight="duotone" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              Limpiar historial del chat
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400">
              ¿Estás seguro de que deseas eliminar todo el historial de la conversación? Esta acción no se puede deshacer.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-8 px-4">
            <Button
              variant="ghost"
              onClick={onClose}
              className="w-full py-2.5 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors duration-200 font-medium rounded-xl border border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white transition-colors duration-200 font-medium rounded-xl shadow-sm hover:shadow-md"
            >
              Eliminar
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}