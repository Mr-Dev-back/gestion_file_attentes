import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../molecules/ui/table';

export default function TicketLogTable({ logs }) {
  const [searchTerm, setSearchTerm] = useState('');

  // Mapping des clés selon la structure du backend (JSON brut renvoyé par Sequelize)
  const filteredLogs = logs.filter(log => 
    (log.ticketNumber || log.ticket_number)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (log.licensePlate || log.license_plate)?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDurationColor = (duration) => {
    const val = parseFloat(duration) || 0;
    if (val > 120) return "bg-red-100 text-red-800";
    if (val > 60) return "bg-orange-100 text-orange-800";
    return "bg-emerald-100 text-emerald-800";
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
      <input 
        type="text" 
        placeholder="Rechercher ticket ou plaque..." 
        className="mb-4 w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ticket/Plaque</TableHead>
            <TableHead>Quai</TableHead>
            <TableHead>Entrée</TableHead>
            <TableHead>Sortie</TableHead>
            <TableHead>Durée</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredLogs.map((log, i) => (
            <TableRow key={i}>
              <TableCell className="font-medium">
                {log.ticketNumber || log.ticket_number} / {log.licensePlate || log.license_plate}
              </TableCell>
              <TableCell>{log.quai?.name || log.quaiName || '-'}</TableCell>
              <TableCell>{log.entryTime ? new Date(log.entryTime).toLocaleTimeString() : '-'}</TableCell>
              <TableCell>{log.exitTime ? new Date(log.exitTime).toLocaleTimeString() : '-'}</TableCell>
              <TableCell>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getDurationColor(log.duration)}`}>
                  {parseFloat(log.duration || 0).toFixed(0)} min
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
