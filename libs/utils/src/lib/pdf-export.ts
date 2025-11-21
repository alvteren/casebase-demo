import html2pdf from 'html2pdf.js';

// Extract the Html2PdfOptions type from the html2pdf module
// We use the Worker constructor to get the Html2PdfWorker type, then extract the set method's parameter type
type Html2PdfWorkerInstance = InstanceType<typeof html2pdf.Worker>;
type Html2PdfOptions = Parameters<Html2PdfWorkerInstance['set']>[0];

/**
 * Export a DOM element to PDF
 */
export async function exporElementToPdf(element: HTMLElement): Promise<void> {
  const opt: Html2PdfOptions = {
    margin: 10,
    filename: `message-${new Date().toISOString().split('T')[0]}.pdf`,
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
  };

  await html2pdf().set(opt).from(element).save();
}

