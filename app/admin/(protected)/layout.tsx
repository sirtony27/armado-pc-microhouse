'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2, Package, LogOut, Menu, X, User, ChevronDown, Monitor, Laptop } from 'lucide-react';
import { ToastProvider } from '@/components/ui/Toast';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push('/admin/login');
            } else {
                // Show username part of email for cleaner display
                const email = session.user.email || 'Admin';
                const username = email.split('@')[0];
                setUserEmail(username);
                setLoading(false);
            }
        };
        checkAuth();
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="h-8 w-8 animate-spin text-[#E02127]" />
            </div>
        );
    }

    return (
        <ToastProvider>
            <div className="min-h-screen bg-slate-50 flex">
                {/* Mobile Sidebar Overlay */}
                {sidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* Sidebar */}
                <aside className={`
          fixed md:static inset-y-0 left-0 z-50 w-64 bg-[#0D1A4B] text-white flex flex-col shadow-xl transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
                    <div className="p-6 border-b border-white/10 flex justify-between items-center">
                        <div>
                            <h1 className="text-xl font-bold tracking-tight">MicroHouse</h1>
                            <p className="text-xs text-white/50 mt-1">Panel de Control</p>
                        </div>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="md:hidden text-white/70 hover:text-white"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <nav className="flex-1 p-4 space-y-2">
                        <a
                            href="/admin"
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${pathname === '/admin'
                                ? 'bg-[#E02127] text-white shadow-lg shadow-red-900/20'
                                : 'text-white/70 hover:bg-white/10 hover:text-white'
                                }`}
                        >
                            <Package className="h-5 w-5" />
                            Productos
                        </a>
                        <a
                            href="/admin/modelos"
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${pathname === '/admin/modelos'
                                ? 'bg-[#E02127] text-white shadow-lg shadow-red-900/20'
                                : 'text-white/70 hover:bg-white/10 hover:text-white'
                                }`}
                        >
                            <Monitor className="h-5 w-5" />
                            Modelos PC
                        </a>
                        <a
                            href="/admin/notebooks"
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${pathname === '/admin/notebooks'
                                ? 'bg-[#E02127] text-white shadow-lg shadow-red-900/20'
                                : 'text-white/70 hover:bg-white/10 hover:text-white'
                                }`}
                        >
                            <Laptop className="h-5 w-5" />
                            Notebooks
                        </a>
                    </nav>

                    <div className="p-4 border-t border-white/10">
                        <div className="flex items-center gap-3 px-4 py-3 mb-2">
                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white">
                                <User className="h-4 w-4" />
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <p className="text-sm font-medium truncate">{userEmail}</p>
                                <p className="text-xs text-white/50">Administrador</p>
                            </div>
                        </div>
                        <button
                            onClick={async () => {
                                await supabase.auth.signOut();
                                router.push('/admin/login');
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-300 hover:text-red-200 hover:bg-red-500/10 rounded-lg transition-colors text-left"
                        >
                            <LogOut className="h-4 w-4" />
                            Cerrar Sesión
                        </button>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
                    {/* Header */}
                    <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 md:px-8 shrink-0">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
                            >
                                <Menu className="h-6 w-6" />
                            </button>
                            <h2 className="text-lg font-semibold text-slate-800">
                                {pathname === '/admin' ? 'Inventario' :
                                    pathname === '/admin/modelos' ? 'Modelos PC' :
                                        pathname === '/admin/notebooks' ? 'Notebooks' : 'Panel'}
                            </h2>
                        </div>
                    </header>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-auto p-4 md:p-8">
                        <div className="max-w-7xl mx-auto">
                            {children}
                        </div>
                    </div>
                </main>
            </div>
        </ToastProvider>
    );
}
