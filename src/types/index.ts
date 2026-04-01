export interface Project {
  id: string;
  name: string;
  clientName: string;
  quantity: number;
  itemDimensions: { width: number; height: number };
  sheetDimensions: { width: number; height: number };
  pages: PageAnalysis[];
  margin: number;
  productionTimeHours: number;
  finishingTimeHours: number;
  excludeLabor: boolean;
  includeLamination: boolean;
  laminationType: 'glossy' | 'matte' | 'soft-touch' | 'matte-black';
  includePackaging: boolean;
  includeShrinkWrap: boolean;
  isArchived: boolean;
  createdAt: number;
}

export interface PageAnalysis {
  id: string;
  c: number; // Cyan coverage %
  m: number; // Magenta coverage %
  y: number; // Yellow coverage %
  k: number; // Black coverage %
  preview?: string;
}

export interface Settings {
  toner: {
    c: TonerCost;
    m: TonerCost;
    y: TonerCost;
    k: TonerCost;
  };
  wear: {
    drum: number; // cost per click/sheet
    fuser: number;
    belt: number;
    other: number;
  };
  labor: {
    hourlyRate: number;
    overhead: number;
  };
  printer: {
    bwPpm: number;
    colorPpm: number;
  };
  lamination: {
    glossy: number; // cost per sheet
    matte: number;
    softTouch: number;
    matteBlack: number;
  };
  packaging: {
    unitCost: number;
    shrinkWrapUnitCost: number;
  };
  papers: PaperType[];
}

export interface TonerCost {
  price: number;
  yield: number; // pages at 5% coverage
}

export interface PaperType {
  id: string;
  name: string;
  costPerSheet: number;
  width: number;
  height: number;
  weight: number; // gsm
}
