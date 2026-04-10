import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, X, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '../atoms/ui/button';

interface BulkActionsToolbarProps {
    selectedCount: number;
    onDelete?: () => void;
    onActivate?: () => void;
    onDeactivate?: () => void;
    onClear: () => void;
    isLoading?: boolean;
    label?: string;
}

/**
 * Barre d'actions groupées flottante (Bulk Actions Toolbar)
 * Apparaît avec une animation fluide dès qu'un élément est sélectionné.
 */
export const BulkActionsToolbar: React.FC<BulkActionsToolbarProps> = ({
    selectedCount,
    onDelete,
    onActivate,
    onDeactivate,
    onClear,
    isLoading = false,
    label = "éléments sélectionnés"
}) => {
    return (
        <AnimatePresence>
            {selectedCount > 0 && (
                <motion.div
                    initial={{ y: 100, opacity: 0, x: '-50%' }}
                    animate={{ y: 0, opacity: 1, x: '-50%' }}
                    exit={{ y: 100, opacity: 0, x: '-50%' }}
                    className="fixed bottom-8 left-1/2 z-[100] flex items-center gap-4 px-6 py-3 bg-white/90 backdrop-blur-lg border border-primary/20 shadow-2xl rounded-2xl min-w-[450px] justify-between"
                >
                    <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white text-xs font-black shadow-lg shadow-primary/20">
                            {selectedCount}
                        </div>
                        <span className="text-sm font-bold text-slate-700 tracking-tight">
                            {label}
                        </span>
                    </div>

                    <div className="h-8 w-[1px] bg-slate-200 mx-2" />

                    <div className="flex items-center gap-2">
                        {onActivate && (
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={onActivate}
                                disabled={isLoading}
                                className="h-9 px-3 rounded-xl text-success hover:bg-success/10 font-bold text-xs"
                            >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Activer
                            </Button>
                        )}
                        
                        {onDeactivate && (
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={onDeactivate}
                                disabled={isLoading}
                                className="h-9 px-3 rounded-xl text-warning hover:bg-warning/10 font-bold text-xs"
                            >
                                <XCircle className="mr-2 h-4 w-4" />
                                Désactiver
                            </Button>
                        )}

                        {onDelete && (
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={onDelete}
                                disabled={isLoading}
                                className="h-9 px-3 rounded-xl text-danger hover:bg-danger/10 font-bold text-xs"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Supprimer
                            </Button>
                        )}

                        <div className="h-6 w-[1px] bg-slate-200 mx-1" />

                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={onClear}
                            disabled={isLoading}
                            className="h-9 w-9 p-0 rounded-xl text-slate-400 hover:bg-slate-100"
                            title="Annuler la sélection"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
