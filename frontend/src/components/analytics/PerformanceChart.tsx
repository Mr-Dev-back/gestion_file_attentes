import { Card, CardContent, CardHeader, CardTitle } from '../molecules/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface Props {
    flowByHour: { hour: string; count: number }[];
    bySite: { siteName: string; count: number }[];
    byCategory: { category: string; count: number }[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function PerformanceChart({ flowByHour, bySite, byCategory }: Props) {
    return (
        <div className="grid gap-4 md:grid-cols-2">
            <Card className="rounded-2xl shadow-sm border-0 bg-white">
                <CardHeader><CardTitle>Flux Horaire</CardTitle></CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={flowByHour}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="hour" />
                            <YAxis />
                            <Tooltip />
                            <Area type="monotone" dataKey="count" stroke="#8884d8" fill="#8884d8" />
                        </AreaChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-sm border-0 bg-white">
                <CardHeader><CardTitle>Répartition par Site</CardTitle></CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={bySite}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="siteName" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="count" fill="#82ca9d" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}
