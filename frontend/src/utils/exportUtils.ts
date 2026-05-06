import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import type { Ticket } from '../types/ticket';

export const exportToExcel = (tickets: Ticket[], fileName: string = 'rapport_gesparc') => {
  const data = tickets.map(t => ({
    'N° Ticket': t.ticketNumber,
    'Site': t.site?.name || 'N/A',
    'Véhicule': t.licensePlate || '---',
    'Chauffeur': t.driverName || '---',
    'Catégorie': t.category?.name || '---',
    'Arrivée': t.arrivedAt ? format(new Date(t.arrivedAt), 'dd/MM/yyyy HH:mm') : '---',
    'Heure Fin': t.completedAt ? format(new Date(t.completedAt), 'dd/MM/yyyy HH:mm') : '---',
    'Durée (min)': t.completedAt ? Math.floor((new Date(t.completedAt).getTime() - new Date(t.arrivedAt).getTime()) / 60000) : '---'
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Tickets');

  // Auto-size columns
  const maxWidths = data.reduce((acc: any, row: any) => {
    Object.keys(row).forEach((key, i) => {
      const val = String(row[key]);
      acc[i] = Math.max(acc[i] || 0, val.length, key.length);
    });
    return acc;
  }, []);
  worksheet['!cols'] = maxWidths.map((w: number) => ({ wch: w + 2 }));

  XLSX.writeFile(workbook, `${fileName}_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`);
};

export const exportToPDF = async (tickets: Ticket[], title: string = 'Rapport GesParc') => {
  const doc = new jsPDF();
  
  // Add Logo
  try {
    const logoUrl = '/sibm.png';
    const img = new Image();
    img.src = logoUrl;
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });
    doc.addImage(img, 'PNG', 14, 10, 30, 30);
  } catch (error) {
    console.error('Could not load logo', error);
  }

  // Header
  doc.setFontSize(22);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFont('helvetica', 'bold');
  doc.text(title, 50, 25);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(`Généré le ${format(new Date(), 'dd/MM/yyyy à HH:mm')}`, 50, 32);
  
  // Line separator
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.line(14, 45, 196, 45);

  const tableData = tickets.map(t => [
    t.ticketNumber,
    t.licensePlate || '---',
    t.site?.name || '---',
    t.category?.name || '---',
    t.arrivedAt ? format(new Date(t.arrivedAt), 'HH:mm') : '---',
    t.completedAt ? format(new Date(t.completedAt), 'HH:mm') : '---',
    t.completedAt ? `${Math.floor((new Date(t.completedAt).getTime() - new Date(t.arrivedAt).getTime()) / 60000)} min` : '---'
  ]);

  autoTable(doc, {
    startY: 55,
    head: [['N°', 'Véhicule', 'Site', 'Catégorie', 'Arr.', 'Fin', 'Durée']],
    body: tableData,
    headStyles: { 
      fillColor: [15, 23, 42], 
      textColor: [255, 255, 255], 
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 25 },
      6: { halign: 'right' }
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { top: 55 },
    styles: { fontSize: 8, cellPadding: 3, valign: 'middle' },
    didDrawPage: (data) => {
      // Footer
      const str = 'Page ' + doc.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(str, data.settings.margin.left, doc.internal.pageSize.height - 10);
      doc.text('GesParc SIBM - Système de Gestion de Flux Automatisé', doc.internal.pageSize.width - 80, doc.internal.pageSize.height - 10);
    }
  });

  doc.save(`${title.toLowerCase().replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`);
};

/**
 * Rétrocompatibilité pour ArchiveSearch.tsx
 */
export const generateDailyKPIReport = async (tickets: Ticket[] = []) => {
  return exportToPDF(tickets, 'Rapport Journalier KPI');
};
