import type { LucideIcon } from 'lucide-react';
import { Button } from '../../atoms/ui/button';
import { cn } from '../../../lib/utils';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
    className?: string;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction, className }: EmptyStateProps) {
    return (
        <div className={cn("flex flex-col items-center justify-center p-12 text-center animate-in fade-in zoom-in-95 duration-500", className)}>
            <div className="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center mb-6">
                <Icon className="w-12 h-12 text-primary/40" strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">{title}</h3>
            <p className="text-text-muted max-w-md mb-8">{description}</p>
            {actionLabel && onAction && (
                <Button 
                    onClick={onAction}
                    className="shadow-lg shadow-primary/20 rounded-xl px-8 font-bold"
                >
                    {actionLabel}
                </Button>
            )}
        </div>
    );
}
