import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Generates a consolidated KPI report as a PDF.
 * Captures the current dashboard view or specific elements and formats them.
 */
export const generateDailyKPIReport = async () => {
  const container = document.querySelector('main') || document.body;
  const doc = new jsPDF('p', 'mm', 'a4');
  const now = new Date();
  const dateStr = now.toLocaleDateString('fr-FR');
  const timeStr = now.toLocaleTimeString('fr-FR');

  // Show a loading state or similar if needed (handled in UI)

  // 1. Header (on every page via a loop or just first page)
  const addHeader = (pdf: jsPDF) => {
    pdf.setFillColor(15, 23, 42); // Slate-900
    pdf.rect(0, 0, 210, 30, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text('SIBM - RAPPORT DÉCISIONNEL LOGISTIQUE', 15, 15);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Document officiel généré le ${dateStr} à ${timeStr}`, 15, 22);
  };

  addHeader(doc);

  // 2. Summary Section (Dynamic Data)
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(14);
  doc.text('Synthèse Opérationnelle', 15, 45);
  doc.setDrawColor(226, 232, 240);
  doc.line(15, 48, 195, 48);

  // 3. Capture Dashboard Elements
  // We'll capture the map and charts specifically
  const elementsToCapture = [
    { selector: '.recharts-responsive-container', title: 'Analyses des Volumes' },
    { selector: 'svg', title: 'État de la Cartographie' }
  ];

  let currentY = 60;

  for (const item of elementsToCapture) {
    const el = document.querySelector(item.selector);
    if (el) {
      try {
        const canvas = await html2canvas(el as HTMLElement, {
          scale: 2,
          backgroundColor: '#ffffff',
          logging: false,
          useCORS: true
        });
        
        const imgData = canvas.toDataURL('image/png');
        const imgProps = doc.getImageProperties(imgData);
        const pdfWidth = 180;
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        if (currentY + pdfHeight > 270) {
          doc.addPage();
          addHeader(doc);
          currentY = 40;
        }

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(item.title, 15, currentY);
        doc.addImage(imgData, 'PNG', 15, currentY + 5, pdfWidth, pdfHeight);
        
        currentY += pdfHeight + 20;
      } catch (err) {
        console.error(`Error capturing ${item.title}:`, err);
      }
    }
  }

  // 4. Footer & Page Numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(`Confidentiel SIBM - Rapport ID: ${now.getTime()} - Page ${i}/${pageCount}`, 105, 290, { align: 'center' });
  }

  doc.save(`SIBM_Manager_Report_${now.toISOString().split('T')[0]}.pdf`);
};
