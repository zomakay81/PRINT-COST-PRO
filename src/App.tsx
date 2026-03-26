import React, { useState } from 'react';
import {
  Calculator, Settings as SettingsIcon, LayoutGrid, FileText,
  Menu, X, Printer, Package, User, HelpCircle, LogOut
} from 'lucide-react';
import DashboardView from './views/DashboardView';
import ProjectView from './views/ProjectView';
import SettingsView from './views/SettingsView';
import { Project } from './types';
import { Button } from './components/ui/BaseComponents';

type View = 'dashboard' | 'project' | 'settings';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeProject, setActiveProject] = useState<Project | null>(null);

  const navigateTo = (view: View, project: Project | null = null) => {
    setCurrentView(view);
    setActiveProject(project);
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
    { id: 'project', label: 'Nuovo Calcolo', icon: Calculator },
    { id: 'settings', label: 'Costi & Tariffe', icon: SettingsIcon },
  ];


  return (
    <div className="min-h-screen bg-gray-50 flex text-gray-900 font-sans selection:bg-blue-100 selection:text-blue-900">

      {/* Sidebar Overlay */}
      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg lg:hidden"
        >
          <Menu className="w-6 h-6 text-gray-600" />
        </button>
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-72 bg-white border-r border-gray-100 shadow-2xl lg:shadow-none transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0
      `}>
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="p-8 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-200">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-gray-900">PrintCost<span className="text-blue-600">Pro</span></h1>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">v2.0 Premium</p>
              </div>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-1 hover:bg-gray-100 rounded-md">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 space-y-2 py-4 overflow-y-auto">
            <p className="px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Main Menu</p>
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => navigateTo(item.id as View)}
                className={`
                  w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all duration-200 group
                  ${currentView === item.id
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}
                `}
              >
                <item.icon className={`w-5 h-5 ${currentView === item.id ? 'text-white' : 'group-hover:text-blue-600'}`} />
                <span className="font-semibold">{item.label}</span>
              </button>
            ))}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-gray-50">
            <div className="p-4 bg-gray-50 rounded-2xl flex items-center space-x-3">
              <div className="w-10 h-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center text-gray-400 shadow-sm">
                <User className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">Admin Studio</p>
                <p className="text-[10px] font-medium text-gray-500">Premium Account</p>
              </div>
              <button className="p-2 hover:bg-white rounded-lg text-gray-400 hover:text-red-500 transition-colors">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-gray-50 flex items-center justify-between px-8 sticky top-0 z-30">
          <div className="flex items-center space-x-4">
             <div className="hidden lg:flex items-center space-x-1 text-sm text-gray-400">
               <span>Studio</span>
               <span className="text-gray-300">/</span>
               <span className="text-gray-900 font-medium capitalize">{currentView}</span>
             </div>
          </div>
          <div className="flex items-center space-x-4">
            <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all relative">
              <HelpCircle className="w-5 h-5" />
            </button>
            <div className="h-8 w-px bg-gray-100" />
            <Button variant="outline" size="sm" icon={Printer} className="border-gray-200">Print Log</Button>
          </div>
        </header>

        {/* View Container */}
        <div className="flex-1 overflow-y-auto p-8 lg:p-12">
          <div className="max-w-7xl mx-auto pb-20">
            {currentView === 'dashboard' && (
              <DashboardView
                onNewProject={() => navigateTo('project')}
                onOpenProject={(p) => navigateTo('project', p)}
              />
            )}
            {currentView === 'project' && <ProjectView initialProject={activeProject} />}
            {currentView === 'settings' && <SettingsView />}
          </div>
        </div>
      </main>
    </div>
  );
}
