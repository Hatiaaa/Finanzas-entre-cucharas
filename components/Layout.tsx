import React, { useState } from 'react';
import {
    LayoutDashboard,
    PlusCircle,
    Settings as SettingsIcon,
    UtensilsCrossed,
    Menu,
    X,
    List,
    LogOut,
    Bell,
    Search,
    Truck,
    Package,
    ChefHat,
    Wallet
} from 'lucide-react';

export type View = 'dashboard' | 'transaction' | 'settings' | 'history' | 'suppliers' | 'inventory' | 'recipes' | 'dailyClosing' | 'salesVolume';

interface LayoutProps {
    children: React.ReactNode;
    currentView: View;
    onNavigate: (view: View) => void;
}

export function Layout({ children, currentView, onNavigate }: LayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const NavItem = ({ target, icon: Icon, label }: { target: View; icon: any; label: string }) => (
        <button
            onClick={() => { onNavigate(target); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 mx-2 rounded-xl transition-all duration-200 ${currentView === target
                ? 'bg-[#19A8C7] text-white shadow-lg shadow-[#19A8C7]/20'
                : 'text-[#A0B0C0] hover:text-white hover:bg-[#1E293B]'
                }`}
        >
            <Icon size={20} className={currentView === target ? 'text-white' : 'text-[#A0B0C0]'} />
            <span className="font-medium text-sm">{label}</span>
        </button>
    );

    return (
        <div className="min-h-screen bg-[#0B131F] text-[#F9F7F4] flex overflow-hidden font-sans">

            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 w-full bg-[#1c1c24]/90 backdrop-blur-md z-20 border-b border-[#2c2c35] px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-white">
                    <img src="/logo.jpg" alt="Logo" className="w-8 h-8 rounded-lg object-cover border border-[#19A8C7]/30" />
                    <span className="font-bold text-lg tracking-tight">Entre Cucharas</span>
                </div>
                <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 text-[#a0a0b0]">
                    {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Sidebar Overlay */}
            {sidebarOpen && <div className="fixed inset-0 bg-black/80 z-30 lg:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />}

            {/* Sidebar */}
            <aside className={`
        fixed lg:static inset-y-0 left-0 z-40 w-72 bg-[#151E2B] border-r border-[#1E293B] transform transition-transform duration-300 ease-in-out lg:transform-none flex flex-col py-6
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
                <div className="px-6 mb-8 flex items-center gap-3">
                    <div className="relative">
                        <div className="absolute -inset-1 bg-gradient-to-r from-[#19A8C7] to-[#FF8A00] rounded-2xl blur opacity-25"></div>
                        <img src="/logo.jpg" alt="Entre Cucharas Logo" className="relative w-12 h-12 rounded-2xl object-cover border border-white/10 shadow-xl" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white tracking-tight leading-none">Entre Cucharas</h1>
                        <p className="text-[10px] text-[#19A8C7] font-bold uppercase tracking-[0.2em] mt-1">Restaurant PRO</p>
                    </div>
                </div>

                <nav className="flex-1 space-y-1 px-4 overflow-y-auto custom-scrollbar">
                    <div className="text-xs font-bold text-[#6f6f7b] uppercase tracking-wider px-4 mb-2 mt-2">Principal</div>
                    <NavItem target="dashboard" icon={LayoutDashboard} label="Dashboard" />
                    <NavItem target="transaction" icon={PlusCircle} label="Registrar Movimiento" />
                    <NavItem target="history" icon={List} label="Historial" />

                    <div className="text-xs font-bold text-[#6f6f7b] uppercase tracking-wider px-4 mb-2 mt-6">Gestión</div>
                    <NavItem target="suppliers" icon={Truck} label="Proveedores" />
                    <NavItem target="dailyClosing" icon={Wallet} label="Cuadre de Caja" />
                    <NavItem target="inventory" icon={Package} label="Inventario" />
                    <NavItem target="recipes" icon={ChefHat} label="Recetas" />

                    <div className="text-xs font-bold text-[#6f6f7b] uppercase tracking-wider px-4 mb-2 mt-6">Sistema</div>
                    <NavItem target="settings" icon={SettingsIcon} label="Configuración" />
                </nav>

                <div className="p-4 mt-4 border-t border-[#2c2c35] mx-4">
                    <button className="flex items-center gap-3 text-[#f44336] hover:text-[#ff7961] transition-colors w-full px-4 py-2 rounded-lg hover:bg-[#f44336]/10">
                        <LogOut size={20} />
                        <span className="font-medium text-sm">Cerrar Sesión</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 lg:h-screen lg:overflow-y-auto pt-20 lg:pt-0 bg-[#0B131F] relative">
                <div className="p-6 lg:p-8 max-w-[1920px] mx-auto min-h-full">

                    {/* Top Header Section (Desktop) */}
                    <header className="hidden lg:flex justify-between items-center mb-10 sticky top-0 z-10 py-4 bg-[#0B131F]/80 backdrop-blur-sm -mx-8 px-8 border-b border-[#1E293B]">
                        <div>
                            <h2 className="text-2xl font-bold text-white">
                                Panel de Control
                            </h2>
                            <p className="text-[#a0a0b0] text-sm mt-1">Resumen financiero y operativo</p>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="relative group">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6f6f7b] group-focus-within:text-[#19A8C7] transition-colors" size={18} />
                                <input
                                    type="text"
                                    placeholder="Buscar..."
                                    className="w-80 bg-[#0B131F] text-white pl-10 pr-4 py-2.5 rounded-xl border border-[#1E293B] focus:border-[#19A8C7] focus:ring-1 focus:ring-[#19A8C7] outline-none text-sm transition-all placeholder-[#6f6f7b]"
                                />
                            </div>
                            <button className="p-2.5 bg-[#151E2B] rounded-xl text-[#A0B0C0] hover:text-white border border-[#1E293B] hover:border-[#19A8C7] relative transition-all">
                                <Bell size={20} />
                                <span className="absolute top-2 right-2.5 w-2 h-2 bg-[#FF8A00] rounded-full shadow-[0_0_8px_rgba(255,138,0,0.5)]"></span>
                            </button>
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-[#19A8C7] to-[#2ac3ff] p-[2px] cursor-pointer hover:shadow-lg hover:shadow-[#19A8C7]/20 transition-all">
                                <img src="https://ui-avatars.com/api/?name=Admin+Restaurante&background=15151a&color=fff" alt="Profile" className="w-full h-full rounded-[10px] object-cover" />
                            </div>
                        </div>
                    </header>

                    {children}

                </div>
            </main>
        </div>
    );
}
