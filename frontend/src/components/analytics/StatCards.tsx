import { Card, CardContent, CardHeader, CardTitle } from '../molecules/ui/card';
import { Truck, Clock, BarChart3, AlertCircle } from 'lucide-react';

interface StatsProps {
    summary: {
        ticketsToday: number;
        avgWaitingTime: string;
        avgProcessingTime: string;
        avgTotalTime: string;
        trucksInQueue: number;
        trucksInLoading: number;
        quaiOccupationRate: string;
    };
}

export default function StatCards({ summary }: StatsProps) {
    const cards = [
        { title: "Tickets Jour", value: summary.ticketsToday, icon: Truck, color: "text-primary" },
        { title: "Temps Attente", value: `${summary.avgWaitingTime} min`, icon: Clock, color: "text-orange-500" },
        { title: "Temps Traitement", value: `${summary.avgProcessingTime} min`, icon: BarChart3, color: "text-blue-500" },
        { title: "Occ. Quais", value: `${summary.quaiOccupationRate}%`, icon: AlertCircle, color: "text-purple-500" },
    ];

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {cards.map((card, i) => (
                <Card key={i} className="rounded-2xl shadow-sm border-0 bg-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
                        <card.icon className={`h-4 w-4 ${card.color}`} />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{card.value}</div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
