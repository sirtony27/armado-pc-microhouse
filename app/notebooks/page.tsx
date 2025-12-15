'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useComponentes } from '@/lib/componentes';
import { usePresupuestoStore } from '@/store/presupuestoStore';
import { useComparisonStore } from '@/store/comparisonStore';
import { Componente } from '@/types';
import { formatPrecio } from '@/lib/utils';
import { Laptop, Cpu, HardDrive, Check, ArrowLeft, PlusCircle, Search, Sparkles, Filter, X, Eye, Scale } from 'lucide-react';
import BudgetSidebar from '@/components/notebooks/BudgetSidebar';
import FilterSidebar, { FilterState } from '@/components/notebooks/FilterSidebar';
import NotebookDetailsModal from '@/components/notebooks/NotebookDetailsModal';
import CompareFloatingBar from '@/components/notebooks/CompareFloatingBar';
import CompareModal from '@/components/notebooks/CompareModal';
import Image from 'next/image';

function NotebooksContent() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const componentes = useComponentes();
    const { addItem, items: presupuestoItems } = usePresupuestoStore();
    const { addItem: addToCompare, items: compareItems, removeItem: removeFromCompare } = useComparisonStore();

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

        // Screen Options
        const screenOptions = Array.from(new Set(
            notebooks.map(n => n.especificaciones?.screen).filter(Boolean)
        )).sort();
        const screenCounts: Record<string, number> = {};
        notebooks.forEach(n => {
            if (n.especificaciones?.screen) {
                screenCounts[n.especificaciones.screen] = (screenCounts[n.especificaciones.screen] || 0) + 1;
            }
        });

        // OS Options
        const osOptions = Array.from(new Set(
            notebooks.map(n => n.especificaciones?.os).filter(Boolean)
        )).sort();
        const osCounts: Record<string, number> = {};
        notebooks.forEach(n => {
            if (n.especificaciones?.os) {
                osCounts[n.especificaciones.os] = (osCounts[n.especificaciones.os] || 0) + 1;
            }
        });

        // Processor Options (Raw for now, sidebar does grouping)
        // Wait, sidebar grouping relies on passing raw options to count correctly? 
        // Sidebar reduces counts based on raw strings mapping to family.
        // So we pass raw strings and counts of raw strings.
        const processorOptions = Array.from(new Set(
            notebooks.map(n => n.especificaciones?.cpu || n.especificaciones?.procesador).filter(Boolean) as string[]
        )).sort();
        const processorCounts: Record<string, number> = {};
        notebooks.forEach(n => {
            const cpu = n.especificaciones?.cpu || n.especificaciones?.procesador;
            if (cpu) {
                processorCounts[cpu] = (processorCounts[cpu] || 0) + 1;
            }
        });

        return {
            options: { minPrice, maxPrice, brands, ramOptions, storageOptions, screenOptions, osOptions, processorOptions },
            counts: { brands: brandCounts, ram: ramCounts, storage: storageCounts, screen: screenCounts, os: osCounts, processor: processorCounts }
        };
    }, [notebooks]);

    // 3. Filter State (Initialize from URL if available, else default)
    const [search, setSearch] = useState(searchParams.get('q') || '');
    const [sortOrder, setSortOrder] = useState<'price-asc' | 'price-desc' | 'alpha'>((searchParams.get('sort') as 'price-asc' | 'price-desc' | 'alpha') || 'price-asc');
    const [isOpenMobile, setIsOpenMobile] = useState(false);

    // Initialize complex filters
    const [filters, setFilters] = useState<FilterState>(() => ({
        minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : 0,
        maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : 2000000,
        brands: searchParams.get('brands')?.split(',') || [],
        ram: searchParams.get('ram')?.split(',') || [],
        storage: searchParams.get('storage')?.split(',') || [],
        screen: searchParams.get('screen')?.split(',') || [],
        os: searchParams.get('os')?.split(',') || [],
        processor: searchParams.get('processor')?.split(',') || [],
    }));

    // Sync URL with Filters
    useEffect(() => {
        const params = new URLSearchParams();
        if (search) params.set('q', search);
        if (sortOrder) params.set('sort', sortOrder);

        if (filters.minPrice > 0) params.set('minPrice', filters.minPrice.toString());
        if (filters.maxPrice < 2000000) params.set('maxPrice', filters.maxPrice.toString());
        if (filters.brands.length) params.set('brands', filters.brands.join(','));
        if (filters.ram.length) params.set('ram', filters.ram.join(','));
        if (filters.storage.length) params.set('storage', filters.storage.join(','));
        if (filters.screen.length) params.set('screen', filters.screen.join(','));
        if (filters.os.length) params.set('os', filters.os.join(','));
        if (filters.processor.length) params.set('processor', filters.processor.join(','));

        const newUrl = `${pathname}?${params.toString()}`;
        // Only trigger update if the query string has effectively changed.
        // window.location.search includes the '?', while params.toString() does not.
        const currentSearch = window.location.search.replace(/^\?/, '');
        if (params.toString() !== currentSearch) {
            router.replace(newUrl, { scroll: false });
        }
    }, [filters, search, sortOrder, pathname, router]);

    // Initialize max price (Legacy check, careful not to overwrite user intent from URL)
    // This logic is now handled by the initial state of filters, which reads from URL.
    // If maxPrice is not in URL, it defaults to 2000000.
    // If filterOptions.maxPrice is lower than the default 2M, we should update it.
    useEffect(() => {
        if (filterOptions.maxPrice > 0 && filters.maxPrice === 2000000 && !searchParams.has('maxPrice')) {
            setFilters(f => ({ ...f, maxPrice: filterOptions.maxPrice }));
        }
    }, [filterOptions.maxPrice, filters.maxPrice, searchParams]);


    // 4. Filtering Logic
    const filteredNotebooks = useMemo(() => {
        return notebooks.filter(notebook => {
            // Price
            if (notebook.precio < filters.minPrice || notebook.precio > filters.maxPrice) return false;

            // Search
            if (search) {
                const q = search.toLowerCase();
                const match =
                    notebook.modelo.toLowerCase().includes(q) ||
                    notebook.marca.toLowerCase().includes(q) ||
                    notebook.sku?.toLowerCase().includes(q) || // Search by SKU
                    notebook.id.toLowerCase().includes(q) ||   // Search by ID
                    notebook.descripcion?.toLowerCase().includes(q);
                if (!match) return false;
            }

            // Brands
            if (filters.brands.length > 0 && !filters.brands.includes(notebook.marca)) return false;

            // RAM
            if (filters.ram.length > 0) {
                const nbRam = notebook.especificaciones?.ram;
                if (!nbRam || !filters.ram.includes(nbRam)) return false;
            }

            // Storage
            if (filters.storage.length > 0) {
                const nbStorage = notebook.especificaciones?.storage;
                if (!nbStorage || !filters.storage.includes(nbStorage)) return false;
            }

            // Screen
            if (filters.screen.length > 0) {
                const nbScreen = notebook.especificaciones?.screen;
                if (!nbScreen || !filters.screen.includes(nbScreen)) return false;
            }

            // OS
            if (filters.os.length > 0) {
                const nbOs = notebook.especificaciones?.os;
                if (!nbOs || !filters.os.includes(nbOs)) return false;
            }

            // Processor (Family match)
            if (filters.processor.length > 0) {
                const nbCpu = (notebook.especificaciones?.cpu || notebook.especificaciones?.procesador || '').toLowerCase();
                // Filter value is e.g. "Ryzen 5". We check if cpu includes "ryzen 5".
                // We perform an OR match (if any selected processor family matches)
                const match = filters.processor.some(family => {
                    const f = family.toLowerCase();
                    // Handle special cases
                    if (f === 'celeron/pentium') return nbCpu.includes('celeron') || nbCpu.includes('pentium') || nbCpu.includes('n4020') || nbCpu.includes('n4500');
                    if (f === 'otros') {
                        // "Otros" matches if it DOESN'T match any standard known family
                        const isStandard =
                            nbCpu.includes('ryzen') ||
                            nbCpu.includes('athlon') ||
                            nbCpu.includes('core i') ||
                            nbCpu.includes(' i9') || nbCpu.includes(' i7') || nbCpu.includes(' i5') || nbCpu.includes(' i3') || // Space to avoid matching inside other words if needed, though 'i7' is risky. Better relying on standard cues.
                            (nbCpu.includes('intel') && (nbCpu.includes('i3') || nbCpu.includes('i5') || nbCpu.includes('i7') || nbCpu.includes('i9'))) ||
                            nbCpu.includes('m1') || nbCpu.includes('m2') || nbCpu.includes('m3') ||
                            nbCpu.includes('celeron') || nbCpu.includes('pentium') ||
                            nbCpu.includes('n4020') || nbCpu.includes('n4500');
                        return !isStandard;
                    }
                    // Generic
                    return nbCpu.includes(f);
                });
                if (!match) return false;
            }

            return true;
        });
    }, [notebooks, filters, search]);

    // 5. Sorting
    const sortedNotebooks = useMemo(() => {
        return [...filteredNotebooks].sort((a, b) => {
            if (sortOrder === 'price-asc') return a.precio - b.precio;
            if (sortOrder === 'price-desc') return b.precio - a.precio;
            if (sortOrder === 'alpha') return a.modelo.localeCompare(b.modelo);
            return 0;
        });
    }, [filteredNotebooks, sortOrder]);

    const resultsCount = sortedNotebooks.length;

    // Destructure Props for Sidebar
    const {
        minPrice, maxPrice, brands, ramOptions, storageOptions, screenOptions, osOptions, processorOptions
    } = filterOptions;

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
        <div className="min-h-screen bg-slate-50 pb-24">
            {/* Header / Search (Simplified for example) */}
            {/* Header / Search (Simplified for example) */}
            <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 shadow-sm transition-all duration-300">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <button
                        onClick={() => router.push('/')}
                        className="flex items-center text-slate-500 hover:text-slate-900 font-medium transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 mr-2" /> Volver
                    </button>

                    <div className="flex items-center gap-3 hidden md:flex">
                        <img
                            src="https://wckxhidltmnvpbrswnmz.supabase.co/storage/v1/object/public/componentes/branding/microhouse-logo.png?v=5"
                            alt="MicroHouse"
                            className="w-auto object-contain"
                            style={{ height: '48px' }}
                        />
                        <span className="h-4 border-r border-slate-300"></span>
                        <h1 className="text-lg font-bold text-slate-700 tracking-tight">Notebooks</h1>
                    </div>

                    <div className="flex-1 md:flex-none max-w-sm mx-4 md:mx-0">
                        {/* Search Mobile/Desktop */}
                        <div className="relative w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Buscar por modelo, marca o código..."
                                className="w-full pl-9 pr-4 py-2 rounded-full border border-slate-200 bg-slate-100 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-900 placeholder:text-slate-500 font-medium transition-all"
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
                    screenOptions={filterOptions.screenOptions}
                    osOptions={filterOptions.osOptions}
                    processorOptions={filterOptions.processorOptions}

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
                        {(filters.brands.length > 0 || filters.ram.length > 0 || filters.storage.length > 0 || filters.screen.length > 0 || filters.os.length > 0 || filters.processor.length > 0 || filters.minPrice > filterOptions.minPrice || filters.maxPrice < filterOptions.maxPrice) && (
                            <div className="flex flex-wrap gap-2 items-center">
                                <span className="text-xs text-slate-400 font-medium uppercase tracking-wider mr-2">Filtros activos:</span>

                                {/* Processors */}
                                {filters.processor.map(proc => (
                                    <button
                                        key={proc}
                                        onClick={() => setFilters({ ...filters, processor: filters.processor.filter(p => p !== proc) })}
                                        className="bg-indigo-50 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 hover:bg-indigo-100 transition-colors"
                                    >
                                        CPU: {proc} <X className="w-3 h-3" />
                                    </button>
                                ))}

                                {/* Brands */}
                                {filters.brands.map(brand => (
                                    <button
                                        key={brand}
                                        onClick={() => setFilters({ ...filters, brands: filters.brands.filter(b => b !== brand) })}
                                        className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 hover:bg-blue-100 transition-colors"
                                    >
                                        {brand} <X className="w-3 h-3" />
                                    </button>
                                ))}

                                {/* RAM */}
                                {filters.ram.map(ram => (
                                    <button
                                        key={ram}
                                        onClick={() => setFilters({ ...filters, ram: filters.ram.filter(r => r !== ram) })}
                                        className="bg-purple-50 text-purple-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 hover:bg-purple-100 transition-colors"
                                    >
                                        {ram} <X className="w-3 h-3" />
                                    </button>
                                ))}

                                {/* Storage */}
                                {filters.storage.map(storage => (
                                    <button
                                        key={storage}
                                        onClick={() => setFilters({ ...filters, storage: filters.storage.filter(s => s !== storage) })}
                                        className="bg-orange-50 text-orange-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 hover:bg-orange-100 transition-colors"
                                    >
                                        {storage} <X className="w-3 h-3" />
                                    </button>
                                ))}

                                {/* Screen */}
                                {filters.screen.map(scr => (
                                    <button
                                        key={scr}
                                        onClick={() => setFilters({ ...filters, screen: filters.screen.filter(s => s !== scr) })}
                                        className="bg-teal-50 text-teal-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 hover:bg-teal-100 transition-colors"
                                    >
                                        {scr} <X className="w-3 h-3" />
                                    </button>
                                ))}

                                {/* OS */}
                                {filters.os.map(os => (
                                    <button
                                        key={os}
                                        onClick={() => setFilters({ ...filters, os: filters.os.filter(o => o !== os) })}
                                        className="bg-cyan-50 text-cyan-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 hover:bg-cyan-100 transition-colors"
                                    >
                                        {os} <X className="w-3 h-3" />
                                    </button>
                                ))}

                                {/* Price Chips */}
                                {(filters.minPrice > filterOptions.minPrice) && (
                                    <button
                                        onClick={() => setFilters({ ...filters, minPrice: filterOptions.minPrice })}
                                        className="bg-pink-50 text-pink-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 hover:bg-pink-100 transition-colors"
                                    >
                                        Min: {filters.minPrice} <X className="w-3 h-3" />
                                    </button>
                                )}
                                {(filters.maxPrice < filterOptions.maxPrice) && (
                                    <button
                                        onClick={() => setFilters({ ...filters, maxPrice: filterOptions.maxPrice })}
                                        className="bg-pink-50 text-pink-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 hover:bg-pink-100 transition-colors"
                                    >
                                        Max: {filters.maxPrice} <X className="w-3 h-3" />
                                    </button>
                                )}

                                <button
                                    onClick={() => setFilters({ minPrice: filterOptions.minPrice, maxPrice: filterOptions.maxPrice, brands: [], ram: [], storage: [], screen: [], os: [], processor: [] })}
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
                                onClick={() => setFilters({ minPrice: filterOptions.minPrice, maxPrice: filterOptions.maxPrice, brands: [], ram: [], storage: [], screen: [], os: [], processor: [] })}
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

                                    // New: Comparator State
                                    const isComparing = compareItems.some(i => i.id === notebook.id);

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
                                                {/* Smart Badge */}
                                                {(() => {
                                                    const usage = notebook.especificaciones?.usage || notebook.especificaciones?.uso;
                                                    if (usage) {
                                                        return (
                                                            <div className={`absolute top-3 left-3 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm z-10 ${usage === 'Gamer' ? 'bg-[#E02127] text-white' :
                                                                usage === 'Diseño' ? 'bg-purple-500 text-white' :
                                                                    usage === 'Empresarial' ? 'bg-blue-600 text-white' :
                                                                        usage === 'Estudiantes' ? 'bg-emerald-500 text-white' :
                                                                            'bg-slate-500 text-white' // Hogar/Oficina default
                                                                }`}>
                                                                {usage}
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                })()}

                                                <div className="flex items-center justify-between gap-4 pt-4 border-t border-slate-100">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs text-slate-400 font-medium line-through">
                                                            {formatPrecio(Math.round(notebook.precio * 1.1))}
                                                        </span>
                                                        <span className="text-xl font-black text-slate-900">
                                                            {formatPrecio(notebook.precio)}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => isComparing ? removeFromCompare(notebook.id) : addToCompare(notebook)}
                                                            className={`p-2 rounded-full border transition-all ${isComparing
                                                                ? 'bg-purple-100 text-purple-600 border-purple-200'
                                                                : 'bg-white text-slate-400 border-slate-200 hover:text-slate-600 hover:border-slate-300'
                                                                }`}
                                                            title={isComparing ? 'Quitar de comparación' : 'Comparar'}
                                                        >
                                                            <Scale className="w-4 h-4" />
                                                        </button>

                                                        <button
                                                            onClick={() => setSelectedNotebook(notebook)}
                                                            className="p-2 rounded-full border bg-white text-slate-400 border-slate-200 hover:text-blue-600 hover:border-blue-200 transition-all"
                                                            title="Ver detalles"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>

                                                        <motion.button
                                                            whileTap={{ scale: 0.95 }}
                                                            onClick={() => handleAddToBudget(notebook)}
                                                            className={`h-10 px-4 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-lg ${isAdded
                                                                ? 'bg-green-500 text-white shadow-green-500/20'
                                                                : 'bg-[#E02127] text-white shadow-red-500/20 hover:bg-red-700'
                                                                }`}
                                                        >
                                                            {isAdded ? <Check className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
                                                            {isAdded ? 'Agregado' : 'Agregar'}
                                                        </motion.button>
                                                    </div>
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
            <CompareFloatingBar />
            <CompareModal />

            {/* Quick View Modal */}
            <NotebookDetailsModal
                notebook={selectedNotebook}
                isOpen={!!selectedNotebook}
                onClose={() => setSelectedNotebook(null)}
                allNotebooks={notebooks}
                onSelect={setSelectedNotebook}
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
