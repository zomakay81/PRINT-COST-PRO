/**
 * Converts RGB to CMYK.
 * R, G, B should be in the range [0, 255].
 * Returns an object with C, M, Y, K in the range [0, 100].
 */
export function rgbToCmyk(r: number, g: number, b: number) {
  let c = 1 - r / 255;
  let m = 1 - g / 255;
  let y = 1 - b / 255;
  let k = Math.min(c, m, y);

  if (k === 1) {
    return { c: 0, m: 0, y: 0, k: 100 };
  }

  c = ((c - k) / (1 - k)) * 100;
  m = ((m - k) / (1 - k)) * 100;
  y = ((y - k) / (1 - k)) * 100;
  k = k * 100;

  return {
    c: Math.round(c),
    m: Math.round(m),
    y: Math.round(y),
    k: Math.round(k)
  };
}

/**
 * Analyzes the pixel data of a canvas to calculate the average CMYK coverage.
 * It uses sampling to ensure speed.
 */
export function analyzeCanvas(canvas: HTMLCanvasElement, samplingRate: number = 5): { c: number; m: number; y: number; k: number } {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return { c: 0, m: 0, y: 0, k: 0 };

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  let totalC = 0;
  let totalM = 0;
  let totalY = 0;
  let totalK = 0;
  let samples = 0;

  // Each pixel has 4 values (R, G, B, A)
  for (let i = 0; i < data.length; i += 4 * samplingRate) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    // Skip transparent or near-transparent pixels
    if (a < 10) continue;

    const cmyk = rgbToCmyk(r, g, b);

    // Weight coverage by alpha (optional, but good for accuracy)
    const weight = a / 255;
    totalC += cmyk.c * weight;
    totalM += cmyk.m * weight;
    totalY += cmyk.y * weight;
    totalK += cmyk.k * weight;

    samples++;
  }

  if (samples === 0) return { c: 0, m: 0, y: 0, k: 0 };

  return {
    c: totalC / samples,
    m: totalM / samples,
    y: totalY / samples,
    k: totalK / samples
  };
}
