import type { Ticket } from '../../../types/ticket';
import { Badge } from '../ui/badge';

interface TicketStatusBadgeProps {
    status: Ticket['status'];
    className?: string;
}

export function TicketStatusBadge({ status, className }: TicketStatusBadgeProps) {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'EN_ATTENTE': return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
            case 'APPELE': return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200';
            case 'EN_TRAITEMENT': return 'bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200';
            case 'EN_PAUSE': return 'bg-orange-100 text-orange-800 hover:bg-orange-200 border-orange-200';
            case 'COMPLETE': return 'bg-green-100 text-green-800 hover:bg-green-200 border-green-200';
            case 'TRANSFERE': return 'bg-purple-100 text-purple-800 hover:bg-purple-200 border-purple-200';
            case 'INCIDENT': return 'bg-red-100 text-red-800 hover:bg-red-200 border-red-200';
            case 'ABANDONNE':
            case 'ANNULE': return 'bg-red-50 text-red-600 hover:bg-red-100 border-red-100';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'EN_ATTENTE': return 'EN ATTENTE';
            case 'APPELE': return 'APPELÉ';
            case 'EN_TRAITEMENT': return 'EN COURS';
            case 'EN_PAUSE': return 'EN PAUSE';
            case 'COMPLETE': return 'TERMINÉ';
            case 'TRANSFERE': return 'TRANSFÉRÉ';
            case 'INCIDENT': return 'INCIDENT';
            case 'ABANDONNE': return 'ABANDONNÉ';
            case 'ANNULE': return 'ANNULÉ';
            default: return status;
        }
    };

    return (
        <Badge variant="outline" className={`${getStatusColor(status)} ${className}`}>
            {getStatusLabel(status)}
        </Badge>
    );
}
