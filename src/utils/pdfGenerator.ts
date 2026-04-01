import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { Project, Settings } from '../types';
import { DetailedCosts } from '../utils/calculations';

// Extend jsPDF with autoTable type
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export function generateQuotePDF(project: Project, costs: DetailedCosts, settings: Settings) {
  const doc = new jsPDF();
  const primaryColor = [34, 108, 234]; // Blue

  // Header
  doc.setFillColor(245, 247, 250);
  doc.rect(0, 0, 210, 40, 'F');

  doc.setFontSize(24);
  doc.setTextColor(31, 41, 55);
  doc.text('PREVENTIVO DI STAMPA', 20, 25);

  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128);
  doc.text(`Progetto: ${project.name}`, 20, 30);
  doc.text(`Cliente: ${project.clientName || 'N/D'}`, 20, 35);
  doc.text(`Data: ${new Date().toLocaleDateString()}`, 160, 30);

  // Client Info Placeholder
  doc.setTextColor(31, 41, 55);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Dettagli Fornitura', 20, 55);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Quantità: ${project.quantity} pezzi`, 20, 62);
  doc.text(`Tempo Totale: ${costs.laborCost.totalTime.toFixed(2)}h`, 100, 62);
  doc.text(`Formato Prodotto: ${project.itemDimensions.width}x${project.itemDimensions.height} mm`, 20, 67);
  doc.text(`Supporto: ${settings.papers.find(p => p.width === project.sheetDimensions.width)?.name || 'Standard'}`, 20, 72);

  // Table
  doc.autoTable({
    startY: 85,
    head: [['Descrizione', 'Dettagli', 'Importo (€)']],
    body: [
      ['Supporto Cartaceo', `${costs.totalSheets} fogli`, costs.paperCost.toFixed(2)],
      ['Toner (CMYK)', `Analisi copertura media per pagina`, costs.tonerCost.total.toFixed(2)],
      ['Usura Macchina', 'Costi tecnici tamburi/fuso', costs.wearCost.toFixed(2)],
      ['Manodopera Base', project.excludeLabor ? 'Esclusa' : `${costs.laborCost.totalTime.toFixed(2)} ore`, costs.laborCost.base.toFixed(2)],
      ['Spese Generali', `Overhead aziendale`, costs.laborCost.overhead.toFixed(2)],
      ['Plastificazione', project.includeLamination ? project.laminationType : 'Nessuna', costs.laminationCost.toFixed(2)],
      ['Confezionamento', project.includePackaging ? 'Incluso' : 'Escluso', costs.packagingCost.toFixed(2)],
      ['Cellofanatura', project.includeShrinkWrap ? 'Inclusa' : 'Esclusa', costs.shrinkWrapCost.toFixed(2)],
      ['Margine & Utile', `${project.margin}% ricarico`, (costs.finalPrice - costs.totalProductionCost).toFixed(2)],
    ],
    headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    margin: { left: 20, right: 20 },
  });

  // Total
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFillColor(236, 253, 245);
  doc.rect(130, finalY, 60, 20, 'F');

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(5, 150, 105);
  doc.text('TOTALE NETTO', 135, finalY + 8);
  doc.text(`€ ${costs.finalPrice.toFixed(2)}`, 135, finalY + 16);

  doc.setFontSize(8);
  doc.setTextColor(156, 163, 175);
  doc.text('Note: Il presente preventivo ha validità 30 giorni.', 20, finalY + 40);

  doc.save(`Preventivo_${project.name.replace(/\s+/g, '_')}.pdf`);
}
