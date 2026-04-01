import React, { useState } from 'react';
import { Settings as SettingsIcon, Euro, Calculator, Printer, User, HelpCircle, Save, Trash2, Plus, Layers, Zap, Package } from 'lucide-react';
import { Settings, TonerCost, PaperType } from '../types';
import { getSettings, saveSettings } from '../store/settingsStore';
import { Card, Button, Input } from '../components/ui/BaseComponents';

export default function SettingsView() {
  const [settings, setSettings] = useState<Settings>(getSettings());
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    saveSettings(settings);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const updateToner = (color: keyof Settings['toner'], field: keyof TonerCost, value: number) => {
    setSettings(prev => ({
      ...prev,
      toner: {
        ...prev.toner,
        [color]: { ...prev.toner[color], [field]: value }
      }
    }));
  };

  const updateWear = (field: keyof Settings['wear'], value: number) => {
    setSettings(prev => ({
      ...prev,
      wear: { ...prev.wear, [field]: value }
    }));
  };

  const updateLabor = (field: keyof Settings['labor'], value: number) => {
    setSettings(prev => ({
      ...prev,
      labor: { ...prev.labor, [field]: value }
    }));
  };

  const updateLamination = (type: keyof Settings['lamination'], value: number) => {
    setSettings(prev => ({
      ...prev,
      lamination: { ...prev.lamination, [type]: value }
    }));
  };

  const updatePrinter = (type: keyof Settings['printer'], value: number) => {
    setSettings(prev => ({
      ...prev,
      printer: { ...prev.printer, [type]: value }
    }));
  };

  const updatePackaging = (type: keyof Settings['packaging'], value: number) => {
    setSettings(prev => ({
      ...prev,
      packaging: { ...prev.packaging, [type]: value }
    }));
  };

  const addPaper = () => {
    const newPaper: PaperType = {
      id: Math.random().toString(36).substr(2, 9),
      name: 'Nuovo Supporto',
      costPerSheet: 0,
      width: 320,
      height: 450,
      weight: 0
    };
    setSettings(prev => ({ ...prev, papers: [...prev.papers, newPaper] }));
  };

  const removePaper = (id: string) => {
    setSettings(prev => ({ ...prev, papers: prev.papers.filter(p => p.id !== id) }));
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Impostazioni</h2>
          <p className="text-gray-500 mt-1">Configura i costi base per i calcoli automatici</p>
        </div>
        <Button onClick={handleSave} icon={Save} variant={isSaved ? 'success' : 'primary'} size="lg">
          {isSaved ? 'Salvato!' : 'Salva Configurazione'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Toner Costs */}
        <Card title="Costi Toner & Inchiostri" icon={Printer}>
          <div className="grid grid-cols-2 gap-4">
            {(['c', 'm', 'y', 'k'] as const).map(color => (
              <div key={color} className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 space-y-4">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${
                    color === 'c' ? 'bg-cyan-400' :
                    color === 'm' ? 'bg-magenta-400' :
                    color === 'y' ? 'bg-yellow-400' : 'bg-gray-900'
                  }`} />
                  <span className="font-bold uppercase text-gray-700">{color === 'k' ? 'Nero (K)' : color}</span>
                </div>
                <Input
                  label="Prezzo (€)"
                  type="number"
                  step="0.01"
                  value={settings.toner[color].price}
                  onChange={e => updateToner(color, 'price', Number(e.target.value))}
                />
                <Input
                  label="Resa (pag @5%)"
                  type="number"
                  value={settings.toner[color].yield}
                  onChange={e => updateToner(color, 'yield', Number(e.target.value))}
                />
              </div>
            ))}
          </div>
        </Card>

        {/* Machine Wear */}
        <Card title="Usura Macchina & Click" icon={Calculator}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Costo Tamburi (€/fg)"
                type="number" step="0.001"
                value={settings.wear.drum}
                onChange={e => updateWear('drum', Number(e.target.value))}
              />
              <Input
                label="Costo Fusore (€/fg)"
                type="number" step="0.001"
                value={settings.wear.fuser}
                onChange={e => updateWear('fuser', Number(e.target.value))}
              />
              <Input
                label="Costo Cinghia (€/fg)"
                type="number" step="0.001"
                value={settings.wear.belt}
                onChange={e => updateWear('belt', Number(e.target.value))}
              />
              <Input
                label="Altri Consumabili (€/fg)"
                type="number" step="0.001"
                value={settings.wear.other}
                onChange={e => updateWear('other', Number(e.target.value))}
              />
            </div>
            <div className="p-4 bg-blue-50 rounded-lg text-blue-700 text-sm flex items-start space-x-2">
              <HelpCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <p>Questi costi vengono sommati per ogni foglio di stampa utilizzato nel progetto.</p>
            </div>
          </div>
        </Card>

        {/* Labor */}
        <Card title="Manodopera & Costi Orari" icon={User}>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Costo Orario (€/h)"
              type="number"
              value={settings.labor.hourlyRate}
              onChange={e => updateLabor('hourlyRate', Number(e.target.value))}
            />
            <Input
              label="Spese Generali (%)"
              type="number"
              value={settings.labor.overhead}
              onChange={e => updateLabor('overhead', Number(e.target.value))}
            />
          </div>
        </Card>

        {/* Printer Speed */}
        <Card title="Velocità di Stampa (PPM)" icon={Zap}>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Biano e Nero (BW)"
              type="number"
              value={settings.printer.bwPpm}
              onChange={e => updatePrinter('bwPpm', Number(e.target.value))}
              helper="Pagine per minuto"
            />
            <Input
              label="Colori"
              type="number"
              value={settings.printer.colorPpm}
              onChange={e => updatePrinter('colorPpm', Number(e.target.value))}
              helper="Pagine per minuto"
            />
          </div>
        </Card>

        {/* Additional Services Costs */}
        <Card title="Costi Servizi Aggiuntivi (€/pz)" icon={Package}>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Confezionamento"
              type="number" step="0.01"
              value={settings.packaging.unitCost}
              onChange={e => updatePackaging('unitCost', Number(e.target.value))}
            />
            <Input
              label="Cellofanatura"
              type="number" step="0.01"
              value={settings.packaging.shrinkWrapUnitCost}
              onChange={e => updatePackaging('shrinkWrapUnitCost', Number(e.target.value))}
            />
          </div>
        </Card>

        {/* Lamination Costs */}
        <Card title="Costi Plastificazione (€/fg)" icon={Layers}>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Lucida"
              type="number" step="0.01"
              value={settings.lamination.glossy}
              onChange={e => updateLamination('glossy', Number(e.target.value))}
            />
            <Input
              label="Opaca"
              type="number" step="0.01"
              value={settings.lamination.matte}
              onChange={e => updateLamination('matte', Number(e.target.value))}
            />
            <Input
              label="Soft Touch"
              type="number" step="0.01"
              value={settings.lamination.softTouch}
              onChange={e => updateLamination('softTouch', Number(e.target.value))}
            />
            <Input
              label="Nera Opaca"
              type="number" step="0.01"
              value={settings.lamination.matteBlack}
              onChange={e => updateLamination('matteBlack', Number(e.target.value))}
            />
          </div>
        </Card>

        {/* Papers Catalog */}
        <Card title="Catalogo Supporti & Carte" icon={Plus}>
          <div className="space-y-4">
            {settings.papers.map((paper, index) => (
              <div key={paper.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
                  <Input
                    label="Nome Supporto"
                    value={paper.name}
                    onChange={e => {
                      const newPapers = [...settings.papers];
                      newPapers[index].name = e.target.value;
                      setSettings({ ...settings, papers: newPapers });
                    }}
                  />
                </div>
                <div className="w-24">
                  <Input
                    label="Costo (€/fg)"
                    type="number" step="0.01"
                    value={paper.costPerSheet}
                    onChange={e => {
                      const newPapers = [...settings.papers];
                      newPapers[index].costPerSheet = Number(e.target.value);
                      setSettings({ ...settings, papers: newPapers });
                    }}
                  />
                </div>
                <div className="w-20">
                  <Input
                    label="Gram."
                    type="number"
                    value={paper.weight}
                    onChange={e => {
                      const newPapers = [...settings.papers];
                      newPapers[index].weight = Number(e.target.value);
                      setSettings({ ...settings, papers: newPapers });
                    }}
                  />
                </div>
                <Button variant="ghost" onClick={() => removePaper(paper.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline" onClick={addPaper} icon={Plus} className="w-full border-dashed">
              Aggiungi Supporto
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
