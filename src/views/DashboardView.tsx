import React, { useState } from 'react';
import {
  Plus, Settings as SettingsIcon, LayoutGrid, FileText,
  ChevronRight, Calculator, PieChart, TrendingUp, Search, Trash2,
  Archive, User, CheckCircle2, Circle
} from 'lucide-react';
import { getProjects, deleteProject } from '../store/projectStore';
import { Project } from '../types';
import { Card, Button, Input, cn } from '../components/ui/BaseComponents';

interface DashboardProps {
  onNewProject: () => void;
  onOpenProject: (p: Project) => void;
}

export default function DashboardView({ onNewProject, onOpenProject }: DashboardProps) {
  const [projects, setProjects] = useState<Project[]>(getProjects());
  const [searchTerm, setSearchTerm] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  const filteredProjects = projects.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.clientName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesArchive = p.isArchived === showArchived;
    return matchesSearch && matchesArchive;
  }).sort((a, b) => b.createdAt - a.createdAt);

  const stats = [
    { label: 'Progetti Totali', value: projects.length, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Pezzi Stimati', value: projects.reduce((acc, p) => acc + p.quantity, 0).toLocaleString(), icon: LayoutGrid, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Copertura Media', value: '24%', icon: PieChart, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Fatturato Stimato', value: '€ ' + projects.reduce((acc, p) => acc + 1500, 0).toLocaleString(), icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Bentornato!</h2>
          <p className="text-gray-500 mt-1">Gestisci i tuoi preventivi di stampa e packaging</p>
        </div>
        <Button onClick={onNewProject} icon={Plus} size="lg" className="shadow-lg">
          Nuovo Progetto
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
            <div className={cn("p-3 rounded-lg", stat.bg)}>
              <stat.icon className={cn("w-6 h-6", stat.color)} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-xl font-black text-gray-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Project List */}
      <Card title={showArchived ? "Archivio Progetti" : "Progetti Attivi"} icon={showArchived ? Archive : FileText}>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-end">
            <div className="flex items-center relative w-full max-w-md">
              <Search className="absolute left-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Cerca per progetto o cliente..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setShowArchived(false)}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-md transition-all",
                  !showArchived ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                )}
              >
                Attivi
              </button>
              <button
                onClick={() => setShowArchived(true)}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-md transition-all",
                  showArchived ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                )}
              >
                Archivio
              </button>
            </div>
          </div>

          <div className="overflow-hidden border border-gray-100 rounded-xl divide-y divide-gray-50">
            {filteredProjects.length === 0 ? (
              <div className="p-12 text-center space-y-4">
                <div className="inline-flex p-4 bg-gray-50 rounded-full text-gray-400">
                  <Calculator className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Nessun progetto trovato</h4>
                  <p className="text-sm text-gray-500">Inizia creando il tuo primo preventivo di stampa.</p>
                </div>
                <Button variant="outline" onClick={onNewProject}>Crea Nuovo Progetto</Button>
              </div>
            ) : (
              filteredProjects.map(project => (
                <div
                  key={project.id}
                  className="group p-4 flex items-center justify-between hover:bg-blue-50/50 transition-colors cursor-pointer"
                  onClick={() => onOpenProject(project)}
                >
                  <div className="flex items-center space-x-4">
                    <div className={cn(
                      "w-12 h-12 border rounded-lg flex items-center justify-center shadow-sm group-hover:text-white transition-colors",
                      project.isArchived
                        ? "bg-amber-50 border-amber-100 text-amber-600 group-hover:bg-amber-600"
                        : "bg-white border-gray-100 text-blue-600 group-hover:bg-blue-600"
                    )}>
                      {project.isArchived ? <Archive className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{project.name}</h4>
                      <div className="flex items-center space-x-3 text-xs text-gray-500">
                        <span className="flex items-center"><User className="w-3 h-3 mr-1" /> {project.clientName || 'Privato'}</span>
                        <span className="w-1 h-1 bg-gray-300 rounded-full" />
                        <span className="font-medium">{project.quantity} pz</span>
                        <span className="w-1 h-1 bg-gray-300 rounded-full" />
                        <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="sm" onClick={(e) => {
                      e.stopPropagation();
                      deleteProject(project.id);
                      setProjects(getProjects());
                    }} className="text-red-500 hover:bg-red-50">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <ChevronRight className="w-5 h-5 text-gray-300" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
