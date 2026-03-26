import * as pdfjsLib from 'pdfjs-dist';
import { analyzeCanvas } from './analyzer';
import { PageAnalysis } from '../types';

// PDF.js worker setup
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export async function analyzePdf(file: File): Promise<PageAnalysis[]> {
  const fileArrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: fileArrayBuffer }).promise;
  const numPages = pdf.numPages;
  const results: PageAnalysis[] = [];

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 1 });

    // Scale down for faster analysis if needed
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    // Maintain aspect ratio, but limit max dimension for analysis speed
    const MAX_DIM = 1000;
    let scale = 1;
    if (viewport.width > MAX_DIM || viewport.height > MAX_DIM) {
      scale = MAX_DIM / Math.max(viewport.width, viewport.height);
    }

    const scaledViewport = page.getViewport({ scale });
    canvas.width = scaledViewport.width;
    canvas.height = scaledViewport.height;

    await page.render({
      canvasContext: context!,
      viewport: scaledViewport
    }).promise;

    const analysis = analyzeCanvas(canvas, 10); // Sampling rate of 10 for speed

    results.push({
      id: `page-${i}`,
      c: analysis.c,
      m: analysis.m,
      y: analysis.y,
      k: analysis.k,
      preview: canvas.toDataURL('image/webp', 0.5)
    });
  }

  return results;
}

export async function analyzeImage(file: File): Promise<PageAnalysis[]> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_DIM = 1000;
      let width = img.width;
      let height = img.height;

      if (width > MAX_DIM || height > MAX_DIM) {
        const scale = MAX_DIM / Math.max(width, height);
        width *= scale;
        height *= scale;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);

      const analysis = analyzeCanvas(canvas, 10);

      resolve([{
        id: 'img-1',
        c: analysis.c,
        m: analysis.m,
        y: analysis.y,
        k: analysis.k,
        preview: canvas.toDataURL('image/webp', 0.5)
      }]);

      URL.revokeObjectURL(img.src);
    };
    img.onerror = reject;
  });
}
