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
    printTime: number;
    finishingTime: number;
    totalTime: number;
  };
  laminationCost: number;
  packagingCost: number;
  shrinkWrapCost: number;
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

  const totalSheets = itemsPerSheet > 0 ? Math.ceil((project.quantity || 0) / itemsPerSheet) : 0;

  // Paper Cost
  const paperCost = totalSheets * (paperCostPerSheet || 0);

  // Wear Cost (drums, fuser, etc. per sheet)
  const wearSettings = settings.wear || { drum: 0, fuser: 0, belt: 0, other: 0 };
  const perSheetWear = (wearSettings.drum || 0) + (wearSettings.fuser || 0) + (wearSettings.belt || 0) + (wearSettings.other || 0);
  const wearCost = totalSheets * perSheetWear;

  // Lamination Cost
  let laminationCost = 0;
  if (project.includeLamination && settings.lamination) {
    const laminationPricePerSheet = {
      'glossy': settings.lamination.glossy || 0,
      'matte': settings.lamination.matte || 0,
      'soft-touch': settings.lamination.softTouch || 0,
      'matte-black': settings.lamination.matteBlack || 0
    }[project.laminationType || 'glossy'] || 0;
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

  // Automatic Print Time Calculation
  // We check if there's any color on any page
  const pages = project.pages || [];
  const isColor = pages.some(p => (p.c || 0) > 0.1 || (p.m || 0) > 0.1 || (p.y || 0) > 0.1);
  const printerSettings = settings.printer || { colorPpm: 1, bwPpm: 1 };
  const printerSpeed = isColor ? (printerSettings.colorPpm || 1) : (printerSettings.bwPpm || 1);

  const totalImpressions = totalSheets * pages.length;
  const printTimeHours = printerSpeed > 0 ? (totalImpressions / printerSpeed) / 60 : 0;

  // Labor Cost Breakdown
  const finishingTime = project.finishingTimeHours || 0;
  const totalTime = printTimeHours + finishingTime;

  const laborSettings = settings.labor || { hourlyRate: 0, overhead: 0 };
  const baseLabor = totalTime * (laborSettings.hourlyRate || 0);
  const overheadLabor = baseLabor * ((laborSettings.overhead || 0) / 100);
  const totalLabor = project.excludeLabor ? 0 : baseLabor + overheadLabor;

  const laborCostDetails = {
    base: project.excludeLabor ? 0 : baseLabor,
    overhead: project.excludeLabor ? 0 : overheadLabor,
    total: totalLabor,
    printTime: printTimeHours,
    finishingTime: finishingTime,
    totalTime: totalTime
  };

  const packagingSettings = settings.packaging || { unitCost: 0, shrinkWrapUnitCost: 0 };
  const packagingCost = project.includePackaging ? (project.quantity || 0) * (packagingSettings.unitCost || 0) : 0;
  const shrinkWrapCost = project.includeShrinkWrap ? (project.quantity || 0) * (packagingSettings.shrinkWrapUnitCost || 0) : 0;

  const totalProductionCost = paperCost + wearCost + totalTonerCost + totalLabor + laminationCost + packagingCost + shrinkWrapCost;
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
    packagingCost,
    shrinkWrapCost,
    totalProductionCost,
    unitProductionCost,
    finalPrice,
    unitPrice,
    totalSheets,
    itemsPerSheet
  };
}
