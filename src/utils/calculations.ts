import { Settings, PageAnalysis, Project } from '../types';

export interface DetailedCosts {
  paperCost: number;
  tonerCost: {
    c: number;
    m: number;
    y: number;
    k: number;
    total: number;
  };
  wearCost: number;
  laborCost: {
    base: number;
    overhead: number;
    total: number;
  };
  laminationCost: number;
  totalProductionCost: number;
  unitProductionCost: number;
  finalPrice: number;
  unitPrice: number;
  totalSheets: number;
  itemsPerSheet: number;
}

/**
 * Calculates the number of items that can fit on a single sheet.
 * Considers both normal and rotated orientations.
 */
export function calculateNesting(itemWidth: number, itemHeight: number, sheetWidth: number, sheetHeight: number) {
  const normalFitX = Math.floor(sheetWidth / itemWidth);
  const normalFitY = Math.floor(sheetHeight / itemHeight);
  const normalTotal = normalFitX * normalFitY;

  const rotatedFitX = Math.floor(sheetWidth / itemHeight);
  const rotatedFitY = Math.floor(sheetHeight / itemWidth);
  const rotatedTotal = rotatedFitX * rotatedFitY;

  return Math.max(normalTotal, rotatedTotal);
}

/**
 * Calculates detailed costs for a project based on settings and analysis.
 */
export function calculateDetailedCosts(
  project: Project,
  settings: Settings,
  paperCostPerSheet: number,
  estimatedTimeHours: number = 0.5
): DetailedCosts {
  const itemsPerSheet = calculateNesting(
    project.itemDimensions.width,
    project.itemDimensions.height,
    project.sheetDimensions.width,
    project.sheetDimensions.height
  );

  const totalSheets = itemsPerSheet > 0 ? Math.ceil(project.quantity / itemsPerSheet) : 0;

  // Paper Cost
  const paperCost = totalSheets * paperCostPerSheet;

  // Wear Cost (drums, fuser, etc. per sheet)
  const perSheetWear = settings.wear.drum + settings.wear.fuser + settings.wear.belt + settings.wear.other;
  const wearCost = totalSheets * perSheetWear;

  // Lamination Cost
  let laminationCost = 0;
  if (project.includeLamination) {
    const laminationPricePerSheet = {
      'glossy': settings.lamination.glossy,
      'matte': settings.lamination.matte,
      'soft-touch': settings.lamination.softTouch,
      'matte-black': settings.lamination.matteBlack
    }[project.laminationType];
    laminationCost = totalSheets * laminationPricePerSheet;
  }

  // Toner Cost Calculation
  // Yield is pages at 5% coverage
  // Total cost = (sheets * coverage%) / (yield * 5%) * price
  const calcToner = (coverage: number, tonerCost: { price: number; yield: number }) => {
    if (tonerCost.yield === 0) return 0;
    // Normalized coverage relative to 5% standard
    return (totalSheets * (coverage / 100)) / (tonerCost.yield * 0.05) * tonerCost.price;
  };

  let tonerC = 0, tonerM = 0, tonerY = 0, tonerK = 0;
  project.pages.forEach(page => {
    tonerC += calcToner(page.c, settings.toner.c);
    tonerM += calcToner(page.m, settings.toner.m);
    tonerY += calcToner(page.y, settings.toner.y);
    tonerK += calcToner(page.k, settings.toner.k);
  });

  const totalTonerCost = tonerC + tonerM + tonerY + tonerK;

  // Labor Cost Breakdown
  const productionTime = project.productionTimeHours || estimatedTimeHours;
  const baseLabor = productionTime * settings.labor.hourlyRate;
  const overheadLabor = baseLabor * (settings.labor.overhead / 100);
  const totalLabor = project.excludeLabor ? 0 : baseLabor + overheadLabor;

  const laborCostDetails = {
    base: project.excludeLabor ? 0 : baseLabor,
    overhead: project.excludeLabor ? 0 : overheadLabor,
    total: totalLabor
  };

  const totalProductionCost = paperCost + wearCost + totalTonerCost + totalLabor + laminationCost;
  const unitProductionCost = project.quantity > 0 ? totalProductionCost / project.quantity : 0;

  const finalPrice = totalProductionCost * (1 + project.margin / 100);
  const unitPrice = project.quantity > 0 ? finalPrice / project.quantity : 0;

  return {
    paperCost,
    tonerCost: {
      c: tonerC,
      m: tonerM,
      y: tonerY,
      k: tonerK,
      total: totalTonerCost
    },
    wearCost,
    laborCost: laborCostDetails,
    laminationCost,
    totalProductionCost,
    unitProductionCost,
    finalPrice,
    unitPrice,
    totalSheets,
    itemsPerSheet
  };
}
