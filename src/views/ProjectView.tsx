import React, { useState, useMemo, useEffect } from 'react';
import {
  Upload, FileImage, Euro, LayoutTemplate, Settings as SettingsIcon,
  TrendingUp, AlertCircle, Loader2, Save, Trash2, Printer,
  FileText, Plus, RefreshCcw, Layers, User, Clock, Scissors, Archive
} from 'lucide-react';
import { Project, PageAnalysis } from '../types';
import { getSettings } from '../store/settingsStore';
import { saveProject } from '../store/projectStore';
import { analyzePdf, analyzeImage } from '../utils/pdfProcessor';
import { calculateDetailedCosts, DetailedCosts } from '../utils/calculations';
import { Card, Button, Input, cn } from '../components/ui/BaseComponents';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { generateQuotePDF } from '../utils/pdfGenerator';

interface ProjectViewProps {
  initialProject?: Project | null;
}

const DEFAULT_PROJECT = (settings: any): Project => ({
  id: Math.random().toString(36).substr(2, 9),
  name: 'Nuovo Progetto',
  clientName: '',
  quantity: 1000,
  itemDimensions: { width: 100, height: 100 },
  sheetDimensions: { width: settings.papers[0]?.width || 320, height: settings.papers[0]?.height || 450 },
  pages: [],
  margin: 30,
  productionTimeHours: 0.5,
  finishingTimeHours: 0.5,
  excludeLabor: false,
  includeLamination: false,
  laminationType: 'glossy',
  isArchived: false,
  createdAt: Date.now()
});

export default function ProjectView({ initialProject }: ProjectViewProps) {
  const settings = getSettings();
  const [project, setProject] = useState<Project>(initialProject || DEFAULT_PROJECT(settings));

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedPaperId, setSelectedPaperId] = useState(() => {
    if (initialProject) {
      const paper = settings.papers.find(p => p.width === initialProject.sheetDimensions.width && p.height === initialProject.sheetDimensions.height);
      return paper?.id || settings.papers[0]?.id || '';
    }
    return settings.papers[0]?.id || '';
  });

  const selectedPaper = settings.papers.find(p => p.id === selectedPaperId);
  const paperCostPerSheet = selectedPaper?.costPerSheet || 0;

  useEffect(() => {
    if (initialProject) {
      setProject(initialProject);
      const paper = settings.papers.find(p => p.width === initialProject.sheetDimensions.width && p.height === initialProject.sheetDimensions.height);
      if (paper) setSelectedPaperId(paper.id);
    } else {
      setProject(DEFAULT_PROJECT(settings));
    }
  }, [initialProject]);

  useEffect(() => {
    if (selectedPaper) {
      setProject(prev => ({
        ...prev,
        sheetDimensions: { width: selectedPaper.width, height: selectedPaper.height }
      }));
    }
  }, [selectedPaperId]);

  const costs: DetailedCosts = useMemo(() => {
    return calculateDetailedCosts(project, settings, paperCostPerSheet);
  }, [project, settings, paperCostPerSheet]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      let results: PageAnalysis[] = [];
      if (file.type === 'application/pdf') {
        results = await analyzePdf(file);
      } else if (file.type.startsWith('image/')) {
        results = await analyzeImage(file);
      } else {
        throw new Error("Formato file non supportato. Usa PDF o Immagini.");
      }

      setProject(prev => ({ ...prev, pages: results }));
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Errore durante l'analisi del file.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      saveProject(project);
      // Feedback UI would go here
    } catch (err) {
      setError("Errore durante il salvataggio.");
    } finally {
      setIsSaving(false);
    }
  };

  const chartData = [
    { name: 'Cyan', value: costs.tonerCost.c, color: '#22d3ee' },
    { name: 'Magenta', value: costs.tonerCost.m, color: '#f472b6' },
    { name: 'Yellow', value: costs.tonerCost.y, color: '#fbbf24' },
    { name: 'Black', value: costs.tonerCost.k, color: '#111827' }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">

      {/* Left Column - Inputs */}
      <div className="lg:col-span-8 space-y-8">

        {/* Project Header */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center space-x-4">
              <Input
                value={project.name}
                onChange={e => setProject(prev => ({ ...prev, name: e.target.value }))}
                className="text-2xl font-bold bg-transparent border-none px-0 focus:ring-0 w-full"
                placeholder="Nome del Progetto"
              />
            </div>
            <div className="flex items-center space-x-2 text-gray-500">
              <User className="w-4 h-4" />
              <Input
                value={project.clientName}
                onChange={e => setProject(prev => ({ ...prev, clientName: e.target.value }))}
                className="text-sm bg-transparent border-none px-0 focus:ring-0 w-48"
                placeholder="Nome Cliente"
              />
              <span className="text-gray-300 mx-2">|</span>
              <p className="text-sm">Creato il {new Date(project.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              icon={Archive}
              onClick={() => setProject(prev => ({ ...prev, isArchived: !prev.isArchived }))}
              className={project.isArchived ? 'bg-amber-50 text-amber-600 border-amber-200' : ''}
            >
              {project.isArchived ? 'Archiviato' : 'Archivia'}
            </Button>
            <Button variant="outline" icon={RefreshCcw} onClick={() => window.location.reload()}>Reset</Button>
            <Button variant="primary" icon={Save} onClick={handleSave} loading={isSaving}>Salva Progetto</Button>
          </div>
        </div>

        {/* Configuration Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title="Dettagli Produzione" icon={Layers}>
            <div className="space-y-4">
              <Input
                label="Quantità Totale (Pezzi)"
                type="number"
                value={project.quantity}
                onChange={e => setProject(prev => ({ ...prev, quantity: Number(e.target.value) }))}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Larghezza Pezzo (mm)"
                  type="number"
                  value={project.itemDimensions.width}
                  onChange={e => setProject(prev => ({ ...prev, itemDimensions: { ...prev.itemDimensions, width: Number(e.target.value) } }))}
                />
                <Input
                  label="Altezza Pezzo (mm)"
                  type="number"
                  value={project.itemDimensions.height}
                  onChange={e => setProject(prev => ({ ...prev, itemDimensions: { ...prev.itemDimensions, height: Number(e.target.value) } }))}
                />
              </div>
            </div>
          </Card>

          <Card title="Supporto Stampa" icon={FileText}>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Seleziona Carta</label>
                <select
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  value={selectedPaperId}
                  onChange={e => setSelectedPaperId(e.target.value)}
                >
                  {settings.papers.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.width}x{p.height})</option>
                  ))}
                </select>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 block">Formato Foglio</span>
                  <span className="font-medium">{project.sheetDimensions.width} x {project.sheetDimensions.height} mm</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Costo Foglio</span>
                  <span className="font-medium">€ {paperCostPerSheet.toFixed(3)}</span>
                </div>
              </div>
            </div>
          </Card>
          <Card title="Opzioni Extra & Tempi" icon={Clock}>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium">Escludi Manodopera</span>
                </div>
                <input
                  type="checkbox"
                  checked={project.excludeLabor}
                  onChange={e => setProject(prev => ({ ...prev, excludeLabor: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Tempo Stampa (Auto)"
                  type="text"
                  value={`${costs.laborCost.printTime.toFixed(2)}h`}
                  disabled
                  helper="Calcolato da PPM stampante"
                />
                <Input
                  label="Tempo Finitura (Ore)"
                  type="number" step="0.1"
                  value={project.finishingTimeHours}
                  onChange={e => setProject(prev => ({ ...prev, finishingTimeHours: Number(e.target.value) }))}
                  helper="Taglio, imballo, ecc."
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Scissors className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium">Plastificazione</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={project.includeLamination}
                    onChange={e => setProject(prev => ({ ...prev, includeLamination: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                </div>

                {project.includeLamination && (
                  <select
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm"
                    value={project.laminationType}
                    onChange={e => setProject(prev => ({ ...prev, laminationType: e.target.value as any }))}
                  >
                    <option value="glossy">Lucida</option>
                    <option value="matte">Opaca</option>
                    <option value="soft-touch">Soft Touch</option>
                    <option value="matte-black">Nera Opaca</option>
                  </select>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Analysis Section */}
        <Card title="Analisi Grafica & Copertura CMYK" icon={FileImage}>
          <div className="space-y-6">
            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50 hover:bg-gray-50 transition-colors relative">
              <input
                type="file"
                className="absolute inset-0 opacity-0 cursor-pointer"
                accept="application/pdf,image/*"
                onChange={handleFileUpload}
              />
              <div className="p-4 bg-blue-100 rounded-full text-blue-600 mb-4">
                <Upload className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900">Trascina qui il file o clicca</h4>
              <p className="text-gray-500 text-sm">Supporta PDF multipagina e Immagini (PNG, JPG)</p>
            </div>

            {isAnalyzing && (
              <div className="flex items-center justify-center p-12 space-x-3 text-blue-600">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="font-medium">Analisi pixel in corso (CMYK)...</span>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {project.pages.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-gray-900 flex items-center">
                    <Printer className="w-5 h-5 mr-2 text-blue-500" />
                    Pagine Analizzate ({project.pages.length})
                  </h4>
                  <Button variant="ghost" size="sm" onClick={() => setProject(prev => ({ ...prev, pages: [] }))} className="text-red-500">Rimuovi Tutte</Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {project.pages.map((page, idx) => (
                    <div key={page.id} className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm flex space-x-4">
                      <div className="w-24 h-32 bg-gray-100 rounded-lg overflow-hidden border border-gray-100 shrink-0">
                        {page.preview ? (
                          <img src={page.preview} alt={`P-${idx+1}`} className="w-full h-full object-contain" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">P{idx+1}</div>
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex justify-between items-start">
                          <span className="font-bold text-sm text-gray-900 uppercase">Pagina {idx + 1}</span>
                          <span className="text-xs text-gray-400">Copertura Media</span>
                        </div>
                        <div className="space-y-1.5">
                          {[
                            { label: 'C', value: page.c, color: 'bg-cyan-400' },
                            { label: 'M', value: page.m, color: 'bg-magenta-400' },
                            { label: 'Y', value: page.y, color: 'bg-yellow-400' },
                            { label: 'K', value: page.k, color: 'bg-gray-900' }
                          ].map(c => (
                            <div key={c.label} className="flex items-center space-x-2">
                              <span className="text-[10px] font-bold w-3">{c.label}</span>
                              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className={cn("h-full transition-all duration-1000", c.color)} style={{ width: `${c.value}%` }} />
                              </div>
                              <span className="text-[10px] font-mono w-8 text-right">{c.value.toFixed(1)}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Right Column - Summary & Costs */}
      <div className="lg:col-span-4 space-y-6">
        <div className="sticky top-8 space-y-6">
          <Card className="bg-gray-900 text-white border-none shadow-xl overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 text-white/5 pointer-events-none">
              <Euro className="w-32 h-32" />
            </div>

            <div className="relative space-y-8">
              <div>
                <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Costo Totale Produzione</h3>
                <div className="text-4xl font-black text-white">€ {costs.totalProductionCost.toFixed(2)}</div>
                <div className="text-gray-400 text-sm mt-1">€ {costs.unitProductionCost.toFixed(4)} <span className="text-xs">/ pezzo</span></div>
              </div>

              <div className="space-y-3 pt-6 border-t border-white/10">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Resa: {costs.itemsPerSheet} pz/fg</span>
                  <span className="text-white font-medium">{costs.totalSheets} fogli</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Supporto</span>
                  <span className="text-white">€ {costs.paperCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Toner Totale</span>
                  <span className="text-white">€ {costs.tonerCost.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Usura Macchina</span>
                  <span className="text-white">€ {costs.wearCost.toFixed(2)}</span>
                </div>
                {!project.excludeLabor && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Manodopera ({costs.laborCost.totalTime.toFixed(2)}h)</span>
                      <span className="text-white">€ {costs.laborCost.base.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Spese Generali ({settings.labor.overhead}%)</span>
                      <span className="text-white">€ {costs.laborCost.overhead.toFixed(2)}</span>
                    </div>
                  </>
                )}
                {project.includeLamination && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Plastificazione</span>
                    <span className="text-white">€ {costs.laminationCost.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div className="h-40 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                    <XAxis dataKey="name" stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                    <Tooltip
                      cursor={{fill: 'rgba(255,255,255,0.05)'}}
                      contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                      itemStyle={{ color: '#fff' }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>

          <Card className="bg-emerald-600 text-white border-none shadow-lg">
            <h3 className="text-emerald-100 text-xs font-bold uppercase tracking-widest mb-4 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" /> Preventivo Cliente
            </h3>
            <div className="space-y-6">
              <div className="text-5xl font-black">€ {costs.finalPrice.toFixed(2)}</div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm text-emerald-100">
                  <span>Margine di Ricarico</span>
                  <span className="font-bold">{project.margin}%</span>
                </div>
                <input
                  type="range" min="0" max="300" value={project.margin}
                  onChange={e => setProject(prev => ({ ...prev, margin: Number(e.target.value) }))}
                  className="w-full h-1.5 bg-emerald-700 rounded-lg appearance-none cursor-pointer accent-white"
                />
              </div>

              <div className="pt-4 border-t border-emerald-500 flex justify-between items-center">
                <span className="text-emerald-100 text-sm">Prezzo Unitario</span>
                <span className="text-xl font-bold">€ {costs.unitPrice.toFixed(4)}</span>
              </div>

              <Button
                variant="success"
                className="w-full bg-emerald-500 hover:bg-emerald-400 border-none py-4 text-lg"
                icon={Printer}
                onClick={() => generateQuotePDF(project, costs, settings)}
              >
                Stampa Preventivo PDF
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
