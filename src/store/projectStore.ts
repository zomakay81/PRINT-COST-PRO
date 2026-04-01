import { Project } from '../types';

const STORAGE_KEY = 'printcost_pro_projects';

export function getProjects(): Project[] {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const projects = JSON.parse(saved);
      // Normalize each project to ensure new properties exist
      return projects.map((p: any) => ({
        ...p,
        clientName: p.clientName || '',
        itemDimensions: p.itemDimensions || { width: 100, height: 100 },
        sheetDimensions: p.sheetDimensions || { width: 320, height: 450 },
        pages: p.pages || [],
        margin: p.margin ?? 30,
        productionTimeHours: p.productionTimeHours ?? 0.5,
        finishingTimeHours: p.finishingTimeHours ?? 0.5,
        excludeLabor: !!p.excludeLabor,
        includeLamination: !!p.includeLamination,
        laminationType: p.laminationType || 'glossy',
        includePackaging: !!p.includePackaging,
        includeShrinkWrap: !!p.includeShrinkWrap,
        isArchived: !!p.isArchived,
        createdAt: p.createdAt || Date.now()
      }));
    } catch (e) {
      console.error('Failed to parse projects', e);
    }
  }
  return [];
}

export function saveProject(project: Project): void {
  const projects = getProjects();
  const index = projects.findIndex(p => p.id === project.id);
  if (index >= 0) {
    projects[index] = project;
  } else {
    projects.push(project);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

export function deleteProject(id: string): void {
  const projects = getProjects();
  const filtered = projects.filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}
