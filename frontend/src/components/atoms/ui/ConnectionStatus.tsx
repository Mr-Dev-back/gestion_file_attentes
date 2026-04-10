import React from 'react';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { cn } from '../../../lib/utils';

export type ConnectionState = 'connected' | 'connecting' | 'disconnected' | 'error';

interface ConnectionStatusProps {
    state: ConnectionState;
    className?: string;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ state, className }) => {
    const config = {
        connected: {
            color: 'text-green-500',
            bg: 'bg-green-500/10',
            label: 'Live',
            icon: Wifi,
        },
        connecting: {
            color: 'text-yellow-500',
            bg: 'bg-yellow-500/10',
            label: 'Connexion...',
            icon: Wifi,
            animate: 'animate-pulse'
        },
        disconnected: {
            color: 'text-gray-400',
            bg: 'bg-gray-400/10',
            label: 'Hors ligne',
            icon: WifiOff,
        },
        error: {
            color: 'text-red-500',
            bg: 'bg-red-500/10',
            label: 'Erreur',
            icon: AlertCircle,
        }
    };

    const current = config[state];
    const Icon = current.icon;

    return (
        <div className={cn(
            "flex items-center gap-2 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
            current.bg,
            current.color,
            className
        )}>
            <Icon className={cn("h-3 w-3", 'animate' in current && current.animate)} />
            <span>{current.label}</span>
        </div>
    );
};
