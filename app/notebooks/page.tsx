'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useComponentes } from '@/lib/componentes';
import { usePresupuestoStore } from '@/store/presupuestoStore';
import { Componente } from '@/types';
import { formatPrecio } from '@/lib/utils';
import { Laptop, Cpu, HardDrive, Check, ArrowLeft, PlusCircle, Search, Sparkles, Filter, X, Eye } from 'lucide-react';
import BudgetSidebar from '@/components/notebooks/BudgetSidebar';
import FilterSidebar from '@/components/notebooks/FilterSidebar';
import NotebookDetailsModal from '@/components/notebooks/NotebookDetailsModal';
import Image from 'next/image';

function NotebooksContent() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Disable URL sync during initial mount/updates to prevent infinite loops or overwrites?
    // Actually, we just need to initialize FROM url, then sync TO url.

    const componentes = useComponentes();
    const { addItem, items: presupuestoItems } = usePresupuestoStore();

    // Quick View State
    const [selectedNotebook, setSelectedNotebook] = useState<Componente | null>(null);

    // 1. Get all Notebooks
    const notebooks = useMemo(() =>
        componentes.filter(c => c.tipo === 'NOTEBOOK' && c.disponible),
        [componentes]
    );

    // 2. Extract Options & Counts
    const { options: filterOptions, counts } = useMemo(() => {
        const prices = notebooks.map(n => n.precio);
        const minPrice = Math.min(...prices, 0);
        const maxPrice = Math.max(...prices, 2000000);
        const brands = Array.from(new Set(notebooks.map(n => n.marca))).sort();

        // Calculate Counts (Global available counts)
        const brandCounts: Record<string, number> = {};
        notebooks.forEach(n => {
            brandCounts[n.marca] = (brandCounts[n.marca] || 0) + 1;
        });

        const ramOptions = Array.from(new Set(
            notebooks.map(n => n.especificaciones?.ram).filter(Boolean)
        )).sort();
        const ramCounts: Record<string, number> = {};
        notebooks.forEach(n => {
            if (n.especificaciones?.ram) {
                ramCounts[n.especificaciones.ram] = (ramCounts[n.especificaciones.ram] || 0) + 1;
            }
        });

        const storageOptions = Array.from(new Set(
            notebooks.map(n => n.especificaciones?.storage).filter(Boolean)
        )).sort();
        const storageCounts: Record<string, number> = {};
        notebooks.forEach(n => {
            if (n.especificaciones?.storage) {
                storageCounts[n.especificaciones.storage] = (storageCounts[n.especificaciones.storage] || 0) + 1;
            }
        });

        return {
            options: { minPrice, maxPrice, brands, ramOptions, storageOptions },
            counts: { brands: brandCounts, ram: ramCounts, storage: storageCounts }
        };
    }, [notebooks]);

    // 3. Filter State (Initialize from URL if available, else default)
    const [search, setSearch] = useState(searchParams.get('q') || '');
    const [sortOrder, setSortOrder] = useState<'price-asc' | 'price-desc' | 'alpha'>((searchParams.get('sort') as any) || 'price-asc');
    const [isOpenMobile, setIsOpenMobile] = useState(false);

    const [filters, setFilters] = useState(() => {
        const pMin = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : 0;
        const pMax = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : 9999999;
        const b = searchParams.getAll('brand');
        const r = searchParams.getAll('ram');
        const s = searchParams.getAll('storage');

        return {
            priceRange: [pMin, pMax] as [number, number],
            brands: b,
            ram: r,
            storage: s
        };
    });

    // 3.1 Sync TO URL when state changes
    useEffect(() => {
        const params = new URLSearchParams();
        if (search) params.set('q', search);
        if (sortOrder !== 'price-asc') params.set('sort', sortOrder);

        if (filters.priceRange[0] > 0) params.set('minPrice', filters.priceRange[0].toString());
        if (filters.priceRange[1] < 9999999) params.set('maxPrice', filters.priceRange[1].toString());

        filters.brands.forEach(b => params.append('brand', b));
        filters.ram.forEach(r => params.append('ram', r));
        filters.storage.forEach(s => params.append('storage', s));

        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }, [search, sortOrder, filters, pathname, router]);

    // Initialize max price (Legacy check, careful not to overwrite user intent from URL)
    useMemo(() => {
        // Only override if default AND not in URL
        if (filterOptions.maxPrice > 0 && filters.priceRange[1] === 9999999 && !searchParams.has('maxPrice')) {
            setFilters(f => ({ ...f, priceRange: [f.priceRange[0], filterOptions.maxPrice] }));
        }
    }, [filterOptions.maxPrice]);


    // 4. Filtering & Sorting Logic
    const filteredNotebooks = useMemo(() => {
        let result = notebooks.filter(n => {
            // Text Search
            const matchesSearch =
                n.modelo.toLowerCase().includes(search.toLowerCase()) ||
                n.marca.toLowerCase().includes(search.toLowerCase());

            if (!matchesSearch) return false;

            // Price
            if (n.precio > filters.priceRange[1]) return false;

            // Brand
            if (filters.brands.length > 0 && !filters.brands.includes(n.marca)) return false;

            // RAM
            if (filters.ram.length > 0) {
                const nRam = n.especificaciones?.ram;
                if (!nRam || !filters.ram.includes(nRam)) return false;
            }

            // Storage
            if (filters.storage.length > 0) {
                const nStorage = n.especificaciones?.storage;
                if (!nStorage || !filters.storage.includes(nStorage)) return false;
            }

            return true;
        });

        // Sorting
        return result.sort((a, b) => {
            if (sortOrder === 'price-asc') return a.precio - b.precio;
            if (sortOrder === 'price-desc') return b.precio - a.precio;
            if (sortOrder === 'alpha') return a.modelo.localeCompare(b.modelo);
            return 0;
        });
    }, [notebooks, search, filters, sortOrder]);

    const handleAddToBudget = (notebook: Componente) => {
        const specs = notebook.especificaciones || {};
        const specsSummary = [
            specs.cpu || specs.procesador,
            specs.ram && `${specs.ram} RAM`,
            specs.storage && `${specs.storage}`
        ].filter(Boolean).join(' / ');

        addItem({
            tipo: 'NOTEBOOK',
            producto: notebook,
            cantidad: 1,
            precioUnitario: notebook.precio,
            detalles: {
                specs: specsSummary
            }
        });
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <button
                        onClick={() => router.push('/')}
                        className="flex items-center text-slate-500 hover:text-slate-900 font-medium transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 mr-2" /> Volver
                    </button>

                    <h1 className="text-xl font-bold text-slate-900 hidden md:block">Catálogo de Notebooks</h1>

                    <div className="flex-1 md:flex-none max-w-sm mx-4 md:mx-0">
                        {/* Search Mobile/Desktop */}
                        <div className="relative w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Buscar modelo..."
                                className="w-full pl-9 pr-4 py-2 rounded-full border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Layout */}
            <div className="flex-1 container mx-auto px-4 py-8 flex items-start gap-8">

                {/* Left Sidebar (Desktop) */}
                <FilterSidebar
                    minPrice={filterOptions.minPrice}
                    maxPrice={filterOptions.maxPrice}
                    brands={filterOptions.brands}
                    ramOptions={filterOptions.ramOptions}
                    storageOptions={filterOptions.storageOptions}

                    filters={filters}
                    setFilters={setFilters}

                    isOpenMobile={isOpenMobile}
                    setIsOpenMobile={setIsOpenMobile}
                    counts={counts}
                />

                {/* Right Grid */}
                <div className="flex-1 min-w-0">

                    {/* Top Actions */}
                    <div className="flex flex-col gap-4 mb-6">
                        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                            {/* Mobile Filter Button */}
                            <button
                                onClick={() => setIsOpenMobile(true)}
                                className="md:hidden w-full flex items-center justify-center gap-2 bg-white border border-slate-300 py-2 rounded-lg font-bold text-slate-700"
                            >
                                <Filter className="w-4 h-4" /> Filtros
                            </button>

                            {/* Sort Dropdown */}
                            <div className="flex items-center gap-2 w-full md:w-auto">
                                <span className="text-sm text-slate-500 font-medium whitespace-nowrap">Ordenar por:</span>
                                <select
                                    value={sortOrder}
                                    onChange={(e) => setSortOrder(e.target.value as any)}
                                    className="bg-white border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 font-bold"
                                >
                                    <option value="price-asc">Menor Precio</option>
                                    <option value="price-desc">Mayor Precio</option>
                                    <option value="alpha">Nombre (A-Z)</option>
                                </select>
                            </div>

                            <button
                                className="w-full md:w-auto bg-[#E02127] text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-red-500/20 hover:bg-red-700 hover:scale-105 transition-all flex items-center justify-center gap-2 ml-auto"
                                onClick={() => router.push('/notebooks/wizard')}
                            >
                                <Sparkles className="w-5 h-5" />
                                Asistente Mágico
                            </button>
                        </div>

                        {/* Active Filters Chips */}
                        {(filters.brands.length > 0 || filters.ram.length > 0 || filters.storage.length > 0) && (
                            <div className="flex flex-wrap gap-2 items-center">
                                <span className="text-xs text-slate-400 font-medium uppercase tracking-wider mr-2">Filtros activos:</span>

                                {filters.brands.map(brand => (
                                    <button
                                        key={brand}
                                        onClick={() => setFilters({ ...filters, brands: filters.brands.filter(b => b !== brand) })}
                                        className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 hover:bg-blue-100 transition-colors"
                                    >
                                        {brand} <X className="w-3 h-3" />
                                    </button>
                                ))}
                                {filters.ram.map(ram => (
                                    <button
                                        key={ram}
                                        onClick={() => setFilters({ ...filters, ram: filters.ram.filter(r => r !== ram) })}
                                        className="bg-purple-50 text-purple-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 hover:bg-purple-100 transition-colors"
                                    >
                                        {ram} <X className="w-3 h-3" />
                                    </button>
                                ))}
                                {filters.storage.map(storage => (
                                    <button
                                        key={storage}
                                        onClick={() => setFilters({ ...filters, storage: filters.storage.filter(s => s !== storage) })}
                                        className="bg-orange-50 text-orange-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 hover:bg-orange-100 transition-colors"
                                    >
                                        {storage} <X className="w-3 h-3" />
                                    </button>
                                ))}

                                <button
                                    onClick={() => setFilters({ ...filters, brands: [], ram: [], storage: [] })}
                                    className="text-slate-400 text-xs hover:text-red-500 underline ml-2"
                                >
                                    Limpiar todo
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Results Count */}
                    <p className="text-slate-500 mb-4 text-sm">
                        Mostrando <strong className="text-slate-900">{filteredNotebooks.length}</strong> resultados
                    </p>

                    {/* Grid */}
                    {filteredNotebooks.length === 0 ? (
                        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Search className="w-8 h-8 text-slate-400" />
                            </div>
                            <h3 className="font-bold text-slate-900 text-lg mb-2">No se encontraron resultados</h3>
                            <p className="text-slate-500 mb-6">Intenta ajustar los filtros de precio o características.</p>
                            <button
                                onClick={() => setFilters({ priceRange: [filterOptions.minPrice, filterOptions.maxPrice], brands: [], ram: [], storage: [] })}
                                className="text-blue-600 font-bold hover:underline"
                            >
                                Limpiar filtros
                            </button>
                        </div>
                    ) : (
                        <motion.div
                            layout
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                        >
                            <AnimatePresence mode="popLayout">
                                {filteredNotebooks.map((notebook) => {
                                    const isAdded = presupuestoItems.some(i => i.producto.id === notebook.id);

                                    // Brand Badge Logic
                                    const cpu = notebook.especificaciones?.cpu?.toLowerCase() || '';
                                    const isIntel = cpu.includes('intel') || cpu.includes('i3') || cpu.includes('i5') || cpu.includes('i7') || cpu.includes('celeron');
                                    const isAMD = cpu.includes('amd') || cpu.includes('ryzen') || cpu.includes('athlon');

                                    return (
                                        <motion.div
                                            layout
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            whileHover={{ y: -8, scale: 1.02 }}
                                            transition={{ duration: 0.3 }}
                                            key={notebook.id}
                                            className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-2xl transition-shadow duration-300 group flex flex-col relative"
                                        >
                                            <div className="relative aspect-[4/3] bg-slate-50 p-6 flex items-center justify-center overflow-hidden">
                                                {/* Brand Badges */}
                                                {(isIntel || isAMD) && (
                                                    <div className={`
                                                            absolute top-3 right-3 px-3 py-1 rounded-full text-[10px] font-black tracking-widest text-white shadow-lg z-10
                                                            bg-gradient-to-r ${isIntel ? 'from-blue-600 to-cyan-500 shadow-blue-500/30' : 'from-red-600 to-orange-600 shadow-orange-500/30'}
                                                        `}>
                                                        {isIntel ? 'INTEL' : 'AMD'} INSIDE
                                                    </div>
                                                )}

                                                {notebook.imagenUrl ? (
                                                    <Image
                                                        src={notebook.imagenUrl}
                                                        alt={notebook.modelo}
                                                        width={400}
                                                        height={300}
                                                        className="object-contain w-full h-full"
                                                    />
                                                ) : (
                                                    <Laptop className="w-16 h-16 text-slate-300" />
                                                )}
                                            </div>

                                            <div className="p-5 flex-1 flex flex-col">
                                                <div className="mb-4">
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                                                        {notebook.marca}
                                                    </p>
                                                    <h3 className="font-bold text-slate-900 text-lg leading-tight mb-2 line-clamp-2" title={notebook.modelo}>
                                                        {notebook.modelo}
                                                    </h3>

                                                    {/* Specs Tags */}
                                                    <div className="flex flex-wrap gap-2">
                                                        {notebook.especificaciones?.cpu && (
                                                            <span className="bg-slate-50 text-slate-600 px-2 py-1 rounded-md text-xs font-medium border border-slate-100 flex items-center gap-1">
                                                                <Cpu className="w-3 h-3" /> {notebook.especificaciones.cpu}
                                                            </span>
                                                        )}
                                                        {notebook.especificaciones?.ram && (
                                                            <span className="bg-slate-50 text-slate-600 px-2 py-1 rounded-md text-xs font-medium border border-slate-100">
                                                                {notebook.especificaciones.ram}
                                                            </span>
                                                        )}
                                                        {notebook.especificaciones?.storage && (
                                                            <span className="bg-slate-50 text-slate-600 px-2 py-1 rounded-md text-xs font-medium border border-slate-100 flex items-center gap-1">
                                                                <HardDrive className="w-3 h-3" /> {notebook.especificaciones.storage}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                                                    <div className="flex flex-col mr-auto">
                                                        <span className="text-xs text-slate-400 font-medium line-through">
                                                            {formatPrecio(Math.round(notebook.precio * 1.1))}
                                                        </span>
                                                        <span className="text-xl font-black text-slate-900">
                                                            {formatPrecio(notebook.precio)}
                                                        </span>
                                                    </div>

                                                    <button
                                                        onClick={() => setSelectedNotebook(notebook)}
                                                        className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200 transition-colors"
                                                        title="Vista Rápida"
                                                    >
                                                        <Eye className="w-5 h-5" />
                                                    </button>

                                                    <motion.button
                                                        whileTap={{ scale: 0.9 }}
                                                        onClick={() => handleAddToBudget(notebook)}
                                                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isAdded
                                                            ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                                                            : 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 hover:bg-blue-700'
                                                            }`}
                                                        title={isAdded ? "Agregado" : "Agregar al presupuesto"}
                                                    >
                                                        {isAdded ? <Check className="w-5 h-5" /> : <PlusCircle className="w-5 h-5" />}
                                                    </motion.button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </div>
            </div>

            <BudgetSidebar />

            {/* Quick View Modal */}
            <NotebookDetailsModal
                notebook={selectedNotebook}
                isOpen={!!selectedNotebook}
                onClose={() => setSelectedNotebook(null)}
            />
        </div>
    );
}

// Wrapper for Suspense
export default function NotebooksPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div></div>}>
            <NotebooksContent />
        </Suspense>
    );
}
