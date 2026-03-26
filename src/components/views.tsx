import React, { useState, useMemo } from 'react';
import { Upload, Calculator, FileImage, Euro, LayoutTemplate, Settings, TrendingUp, AlertCircle, Loader2 } from 'lucide-react';
import { GoogleGenAI, Type } from '@google/genai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("ATTENZIONE: API Key mancante!");
}

const ai = new GoogleGenAI({ apiKey: apiKey || "MISSING_KEY" });
export default function Views() {
  const [projectName, setProjectName] = useState('Nuovo Progetto');
  const [quantity, setQuantity] = useState(1000);
  
  // Dimensioni (mm)
  const [sheetWidth, setSheetWidth] = useState(320);
  const [sheetHeight, setSheetHeight] = useState(450);
  const [itemWidth, setItemWidth] = useState(100);
  const [itemHeight, setItemHeight] = useState(100);
  
  // Costi (Euro)
  const [sheetCost, setSheetCost] = useState(0.15);
  const [wearCost, setWearCost] = useState(0.05);
  const [baseTonerCost, setBaseTonerCost] = useState(0.20); // Costo a foglio al 100% di copertura
  
  // Analisi
  const [coverage, setCoverage] = useState(50);
  const [margin, setMargin] = useState(30);
  
  // Stato UI
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImagePreview(URL.createObjectURL(file));
    setIsAnalyzing(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64data = (reader.result as string).split(',')[1];
          const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: [
              {
                inlineData: {
                  data: base64data,
                  mimeType: file.type
                }
              },
              "Analizza questa grafica per la stampa. Stima la percentuale media di copertura del toner/inchiostro (da 0 a 100) necessaria per stamparla. Restituisci SOLO un oggetto JSON nel formato: {\"coverage\": 45}."
            ],
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  coverage: { type: Type.NUMBER, description: "Percentuale di copertura da 0 a 100" }
                },
                required: ["coverage"]
              }
            }
          });
          
          if (response.text) {
            const data = JSON.parse(response.text);
            if (typeof data.coverage === 'number') {
              setCoverage(Math.round(data.coverage));
            }
          }
        } catch (err) {
          console.error(err);
          setError("Errore durante l'analisi dell'immagine. Inserisci la copertura manualmente.");
        } finally {
          setIsAnalyzing(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setError("Errore nel caricamento del file.");
      setIsAnalyzing(false);
    }
  };

  // Calcoli
  const calculations = useMemo(() => {
    // Calcolo resa (quanti pezzi entrano in un foglio)
    // Proviamo orientamento normale
    const normalFitX = Math.floor(sheetWidth / itemWidth);
    const normalFitY = Math.floor(sheetHeight / itemHeight);
    const normalTotal = normalFitX * normalFitY;

    // Proviamo orientamento ruotato
    const rotatedFitX = Math.floor(sheetWidth / itemHeight);
    const rotatedFitY = Math.floor(sheetHeight / itemWidth);
    const rotatedTotal = rotatedFitX * rotatedFitY;

    const itemsPerSheet = Math.max(normalTotal, rotatedTotal);
    
    if (itemsPerSheet === 0) {
      return { error: "Le dimensioni del lavoro superano quelle del foglio!" };
    }

    const totalSheets = Math.ceil(quantity / itemsPerSheet);
    
    const totalMaterialCost = totalSheets * sheetCost;
    const totalWearCost = totalSheets * wearCost;
    const totalTonerCost = totalSheets * baseTonerCost * (coverage / 100);
    
    const totalProductionCost = totalMaterialCost + totalWearCost + totalTonerCost;
    const unitProductionCost = totalProductionCost / quantity;
    
    const finalPrice = totalProductionCost * (1 + margin / 100);
    const unitPrice = finalPrice / quantity;

    return {
      itemsPerSheet,
      totalSheets,
      totalMaterialCost,
      totalWearCost,
      totalTonerCost,
      totalProductionCost,
      unitProductionCost,
      finalPrice,
      unitPrice
    };
  }, [quantity, sheetWidth, sheetHeight, itemWidth, itemHeight, sheetCost, wearCost, baseTonerCost, coverage, margin]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans text-gray-800">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <header className="flex items-center space-x-3 mb-8">
          <div className="p-3 bg-blue-600 rounded-lg text-white shadow-md">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">PrintCost Pro</h1>
            <p className="text-gray-500">Sviluppo costi e preventivi per stampa e packaging</p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Colonna Form */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Dettagli Generali */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold mb-4 flex items-center"><Settings className="w-5 h-5 mr-2 text-blue-500"/> Dettagli Progetto</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome Lavoro</label>
                  <input type="text" value={projectName} onChange={e => setProjectName(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantità Richiesta (Pezzi)</label>
                  <input type="number" min="1" value={quantity} onChange={e => setQuantity(Number(e.target.value))} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" />
                </div>
              </div>
            </div>

            {/* Dimensioni */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold mb-4 flex items-center"><LayoutTemplate className="w-5 h-5 mr-2 text-blue-500"/> Dimensioni (mm)</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h3 className="font-medium text-gray-700">Foglio di Stampa</h3>
                  <div className="flex space-x-2">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 mb-1">Base (L)</label>
                      <input type="number" value={sheetWidth} onChange={e => setSheetWidth(Number(e.target.value))} className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 mb-1">Altezza (A)</label>
                      <input type="number" value={sheetHeight} onChange={e => setSheetHeight(Number(e.target.value))} className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                  </div>
                </div>
                <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <h3 className="font-medium text-blue-800">Fustella / Singolo Pezzo</h3>
                  <div className="flex space-x-2">
                    <div className="flex-1">
                      <label className="block text-xs text-blue-600 mb-1">Base (L)</label>
                      <input type="number" value={itemWidth} onChange={e => setItemWidth(Number(e.target.value))} className="w-full p-2 border border-blue-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs text-blue-600 mb-1">Altezza (A)</label>
                      <input type="number" value={itemHeight} onChange={e => setItemHeight(Number(e.target.value))} className="w-full p-2 border border-blue-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Costi Base */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold mb-4 flex items-center"><Euro className="w-5 h-5 mr-2 text-blue-500"/> Costi di Produzione (per foglio)</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Costo Supporto (€)</label>
                  <p className="text-xs text-gray-500 mb-2">Carta, cartoncino, ecc.</p>
                  <input type="number" step="0.01" value={sheetCost} onChange={e => setSheetCost(Number(e.target.value))} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Costo Usura (€)</label>
                  <p className="text-xs text-gray-500 mb-2">Tamburi, fusore, click</p>
                  <input type="number" step="0.01" value={wearCost} onChange={e => setWearCost(Number(e.target.value))} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Toner Base (€)</label>
                  <p className="text-xs text-gray-500 mb-2">Costo al 100% di copertura</p>
                  <input type="number" step="0.01" value={baseTonerCost} onChange={e => setBaseTonerCost(Number(e.target.value))} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
            </div>

            {/* Analisi Grafica */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold mb-4 flex items-center"><FileImage className="w-5 h-5 mr-2 text-blue-500"/> Analisi Copertura Toner</h2>
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="flex-1 w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-2 text-gray-400" />
                      <p className="text-sm text-gray-500"><span className="font-semibold">Clicca per caricare</span> la grafica</p>
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                  </label>
                  {error && <p className="text-red-500 text-sm mt-2 flex items-center"><AlertCircle className="w-4 h-4 mr-1"/> {error}</p>}
                </div>
                
                <div className="flex-1 w-full space-y-4">
                  {imagePreview && (
                    <div className="relative h-20 w-full rounded-md overflow-hidden bg-gray-100 border border-gray-200">
                      <img src={imagePreview} alt="Preview" className="object-contain w-full h-full" />
                      {isAnalyzing && (
                        <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                          <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Copertura Stimata (%)</label>
                    <div className="flex items-center space-x-3">
                      <input type="range" min="0" max="100" value={coverage} onChange={e => setCoverage(Number(e.target.value))} className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                      <span className="font-bold text-lg w-12 text-right">{coverage}%</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Modificabile manualmente se necessario</p>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Colonna Risultati */}
          <div className="space-y-6">
            
            <div className="bg-gray-900 text-white p-6 rounded-xl shadow-lg sticky top-6">
              <h2 className="text-xl font-bold mb-6 border-b border-gray-700 pb-4">Riepilogo Costi</h2>
              
              {calculations.error ? (
                <div className="bg-red-500/20 text-red-200 p-4 rounded-lg flex items-start">
                  <AlertCircle className="w-5 h-5 mr-2 shrink-0 mt-0.5" />
                  <p>{calculations.error}</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Resa */}
                  <div className="grid grid-cols-2 gap-4 bg-gray-800 p-4 rounded-lg">
                    <div>
                      <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Resa per foglio</p>
                      <p className="text-2xl font-semibold">{calculations.itemsPerSheet} <span className="text-sm font-normal text-gray-400">pz</span></p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Fogli Totali</p>
                      <p className="text-2xl font-semibold">{calculations.totalSheets}</p>
                    </div>
                  </div>

                  {/* Dettaglio Costi */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400">Materiale ({calculations.totalSheets} fg)</span>
                      <span>€ {calculations.totalMaterialCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400">Usura Macchina</span>
                      <span>€ {calculations.totalWearCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400">Toner ({coverage}%)</span>
                      <span>€ {calculations.totalTonerCost.toFixed(2)}</span>
                    </div>
                    <div className="pt-3 border-t border-gray-700 flex justify-between items-center">
                      <span className="font-medium">Costo Totale Produzione</span>
                      <span className="font-bold text-lg">€ {calculations.totalProductionCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm text-gray-400">
                      <span>Costo Unitario Produzione</span>
                      <span>€ {calculations.unitProductionCost.toFixed(4)}</span>
                    </div>
                  </div>

                  {/* Preventivo */}
                  <div className="pt-6 border-t border-gray-700">
                    <h3 className="text-lg font-semibold mb-4 flex items-center"><TrendingUp className="w-5 h-5 mr-2 text-green-400"/> Preventivo</h3>
                    
                    <div className="mb-4">
                      <label className="block text-sm text-gray-400 mb-1">Margine di Ricarico (%)</label>
                      <div className="flex items-center space-x-3">
                        <input type="range" min="0" max="300" value={margin} onChange={e => setMargin(Number(e.target.value))} className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer" />
                        <span className="font-bold w-12 text-right">{margin}%</span>
                      </div>
                    </div>

                    <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-lg space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-green-400 font-medium">Prezzo Totale</span>
                        <span className="text-2xl font-bold text-green-400">€ {calculations.finalPrice.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-green-400/70">Prezzo Unitario</span>
                        <span className="text-green-400/90 font-medium">€ {calculations.unitPrice.toFixed(4)}</span>
                      </div>
                    </div>
                  </div>

                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
