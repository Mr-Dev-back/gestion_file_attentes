import { cn } from '../../../lib/utils';
import { Card, CardContent } from './card';

interface AdminSkeletonProps {
    variant: 'table' | 'card';
    count?: number;
    className?: string;
}

export function AdminSkeleton({ variant, count, className }: AdminSkeletonProps) {
    if (variant === 'card') {
        const cardCount = count || 6;
        return (
            <div className={cn("grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-300", className)}>
                {Array.from({ length: cardCount }).map((_, i) => (
                    <Card key={i} className="animate-pulse border-border/50 shadow-sm relative overflow-hidden">
                        <CardContent className="p-5 flex flex-col gap-4">
                             <div className="flex justify-between items-start pt-1">
                                <div className="flex items-center gap-3 w-full">
                                    <div className="w-8 h-8 rounded-lg bg-slate-200/60" />
                                    <div className="space-y-2 flex-1">
                                        <div className="h-4 bg-slate-200/60 rounded-md w-1/2" />
                                        <div className="h-2 bg-slate-200/60 rounded-md w-1/4" />
                                    </div>
                                </div>
                                <div className="w-12 h-5 bg-slate-200/60 rounded-lg" />
                            </div>
                            <div className="space-y-2 mt-4">
                                <div className="h-3 bg-slate-200/60 rounded-md w-full" />
                                <div className="h-3 bg-slate-200/60 rounded-md w-4/5" />
                            </div>
                            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 mt-2">
                                 <div className="w-8 h-8 bg-slate-200/60 rounded-lg" />
                                 <div className="w-8 h-8 bg-slate-200/60 rounded-lg" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    // Table variant
    const tableCount = count || 10;
    return (
        <div className={cn("animate-in fade-in duration-300 bg-white border border-slate-200/60 rounded-2xl overflow-hidden shadow-lg", className)}>
            <div className="w-full">
                <div className="bg-slate-50/50 border-b border-slate-100 p-4 flex gap-4">
                    <div className="w-8 h-4 bg-slate-200/60 rounded animate-pulse" />
                    <div className="flex-1 h-4 bg-slate-200/60 rounded animate-pulse" />
                    <div className="flex-1 h-4 bg-slate-200/60 rounded animate-pulse" />
                    <div className="flex-1 h-4 bg-slate-200/60 rounded animate-pulse" />
                    <div className="w-24 h-4 bg-slate-200/60 rounded animate-pulse" />
                </div>
                <div className="divide-y divide-slate-100">
                    {Array.from({ length: tableCount }).map((_, i) => (
                        <div key={i} className="p-4 flex items-center gap-4 animate-pulse">
                            <div className="w-5 h-5 bg-slate-200/60 rounded" />
                            <div className="flex-1 h-4 bg-slate-200/60 rounded w-3/4" />
                            <div className="flex-1 h-4 bg-slate-200/60 rounded w-1/2" />
                            <div className="flex-1 h-4 bg-slate-200/60 rounded w-2/3" />
                            <div className="w-24 flex justify-end gap-2">
                                <div className="w-8 h-8 bg-slate-200/60 rounded-lg" />
                                <div className="w-8 h-8 bg-slate-200/60 rounded-lg" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
