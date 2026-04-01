export function exportData() {
  const data = {
    settings: localStorage.getItem('printcost_pro_settings'),
    projects: localStorage.getItem('printcost_pro_projects'),
    timestamp: Date.now(),
    version: '2.3'
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `PrintCostPro_Backup_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importData(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString);
    if (data.settings) localStorage.setItem('printcost_pro_settings', data.settings);
    if (data.projects) localStorage.setItem('printcost_pro_projects', data.projects);
    return true;
  } catch (e) {
    console.error('Failed to import data', e);
    return false;
  }
}

export function resetApp() {
  if (confirm("Sei sicuro di voler resettare l'intera applicazione? Tutti i progetti e le impostazioni verranno eliminati permanentemente.")) {
    localStorage.removeItem('printcost_pro_settings');
    localStorage.removeItem('printcost_pro_projects');
    window.location.reload();
  }
}
