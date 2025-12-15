'use client';
import { useState, useEffect } from 'react';
import { formatPrecio } from '@/lib/utils';
import { Filter, X } from 'lucide-react';

export interface FilterState {
    minPrice: number;
    maxPrice: number;
    brands: string[];
    ram: string[];
    storage: string[];
    screen: string[];
    os: string[];
    processor: string[];
}

interface FilterSidebarProps {
    minPrice: number;
    maxPrice: number;
    brands: string[];
    ramOptions: string[];
    storageOptions: string[];
    screenOptions: string[];
    osOptions: string[];
    processorOptions: string[];
    filters: FilterState;
    setFilters: (f: FilterState) => void;
    isOpenMobile: boolean;
    setIsOpenMobile: (v: boolean) => void;
    counts: {
        brands: Record<string, number>;
        ram: Record<string, number>;
        storage: Record<string, number>;
        screen: Record<string, number>;
        os: Record<string, number>;
        processor: Record<string, number>;
    };
}

// Helper for sections (Moved outside to prevent re-mounts)
const FilterSection = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="border-b border-slate-200 py-4 last:border-0">
        <h3 className="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wide">{title}</h3>
        <div className="space-y-2">
            {children}
        </div>
    </div>
);

export default function FilterSidebar({
    minPrice, maxPrice, brands, ramOptions, storageOptions, screenOptions, osOptions, processorOptions,
    filters, setFilters, isOpenMobile, setIsOpenMobile, counts
}: FilterSidebarProps) {

    // 1. Local state for smooth slider
    const [localMin, setLocalMin] = useState(filters.minPrice > 0 ? filters.minPrice : minPrice);
    const [localMax, setLocalMax] = useState(filters.maxPrice < 2000000 ? filters.maxPrice : maxPrice);

    // 2. Sync local state when filters change externally
    useEffect(() => {
        setLocalMin(filters.minPrice > 0 ? filters.minPrice : minPrice);
        setLocalMax(filters.maxPrice < 2000000 ? filters.maxPrice : maxPrice);
    }, [filters.minPrice, filters.maxPrice, minPrice, maxPrice]);

    const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = Math.min(Number(e.target.value), localMax - 10000); // Prevent overlap
        setLocalMin(val);
    };

    const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = Math.max(Number(e.target.value), localMin + 10000); // Prevent overlap
        setLocalMax(val);
    };

    const handleSliderCommit = () => {
        setFilters({ ...filters, minPrice: localMin, maxPrice: localMax });
    };

    const toggleBrand = (brand: string) => {
        const newBrands = filters.brands.includes(brand)
            ? filters.brands.filter(b => b !== brand)
            : [...filters.brands, brand];
        setFilters({ ...filters, brands: newBrands });
    };

    const toggleRam = (ram: string) => {
        const newRam = filters.ram.includes(ram)
            ? filters.ram.filter(r => r !== ram)
            : [...filters.ram, ram];
        setFilters({ ...filters, ram: newRam });
    };

    const toggleStorage = (storage: string) => {
        const newStorage = filters.storage.includes(storage)
            ? filters.storage.filter(s => s !== storage)
            : [...filters.storage, storage];
        setFilters({ ...filters, storage: newStorage });
    };

    const toggleScreen = (screen: string) => {
        const newScreen = filters.screen?.includes(screen)
            ? filters.screen.filter(s => s !== screen)
            : [...(filters.screen || []), screen];
        setFilters({ ...filters, screen: newScreen });
    };

    const toggleOs = (os: string) => {
        const newOs = filters.os?.includes(os)
            ? filters.os.filter(o => o !== os)
            : [...(filters.os || []), os];
        setFilters({ ...filters, os: newOs });
    };

    const classes = `
        fixed inset-y-0 left-0 z-40 w-72 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0 md:shadow-none md:w-64 md:block md:bg-transparent
        ${isOpenMobile ? 'translate-x-0' : '-translate-x-full'}
    `;

    const toggleProcessor = (processor: string) => {
        const current = filters.processor || [];
        const newProcessor = current.includes(processor)
            ? current.filter(p => p !== processor)
            : [...current, processor];
        setFilters({ ...filters, processor: newProcessor });
    };

    return (
        <>
            {/* Backdrop Mobile */}
            {isOpenMobile && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden"
                    onClick={() => setIsOpenMobile(false)}
                />
            )}

            <div className={classes}>
                <div className="h-full overflow-y-auto p-5 md:p-0">
                    <div className="flex justify-between items-center md:hidden mb-6">
                        <h2 className="font-bold text-xl text-slate-900 flex items-center gap-2">
                            <Filter className="w-5 h-5" /> Filtros
                        </h2>
                        <button onClick={() => setIsOpenMobile(false)}>
                            <X className="w-6 h-6 text-slate-400" />
                        </button>
                    </div>

                    {/* Price Range */}
                    <FilterSection title="Precio">
                        <div className="px-1 mb-6 mt-2 relative h-6">
                            {/* Track Background */}
                            <div className="absolute top-1/2 left-0 right-0 h-1.5 bg-slate-200 rounded-full -translate-y-1/2"></div>

                            {/* Active Range Track - Calculated based on min/max */}
                            <div
                                className="absolute top-1/2 h-1.5 bg-[#E02127] rounded-full -translate-y-1/2 z-10 pointer-events-none"
                                style={{
                                    left: `${((localMin - minPrice) / (maxPrice - minPrice)) * 100}%`,
                                    right: `${100 - ((localMax - minPrice) / (maxPrice - minPrice)) * 100}%`
                                }}
                            ></div>

                            {/* Dual Sliders */}
                            <input
                                type="range"
                                min={minPrice}
                                max={maxPrice}
                                step={50000}
                                value={localMin}
                                onChange={handleMinChange}
                                onMouseUp={handleSliderCommit}
                                onTouchEnd={handleSliderCommit}
                                className="absolute top-1/2 left-0 w-full -translate-y-1/2 h-6 appearance-none bg-transparent z-20 pointer-events-auto cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#E02127] [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-[#E02127]"
                                style={{ zIndex: localMin > maxPrice - 100000 ? 50 : 20 }} // Bring to front if near end
                            />
                            <input
                                type="range"
                                min={minPrice}
                                max={maxPrice}
                                step={50000}
                                value={localMax}
                                onChange={handleMaxChange}
                                onMouseUp={handleSliderCommit}
                                onTouchEnd={handleSliderCommit}
                                className="absolute top-1/2 left-0 w-full -translate-y-1/2 h-6 appearance-none bg-transparent z-20 pointer-events-auto cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#E02127] [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-[#E02127]"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                                <input
                                    type="number"
                                    min={minPrice}
                                    max={maxPrice}
                                    value={localMin}
                                    onChange={(e) => {
                                        const v = Number(e.target.value);
                                        setLocalMin(v);
                                        setFilters({ ...filters, minPrice: v });
                                    }}
                                    className="w-full pl-6 pr-2 py-1.5 border border-slate-200 rounded text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="Min"
                                />
                            </div>
                            <span className="text-slate-400">-</span>
                            <div className="relative flex-1">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                                <input
                                    type="number"
                                    min={minPrice}
                                    max={maxPrice}
                                    value={localMax}
                                    onChange={(e) => {
                                        const v = Number(e.target.value);
                                        setLocalMax(v);
                                        setFilters({ ...filters, maxPrice: v });
                                    }}
                                    className="w-full pl-6 pr-2 py-1.5 border border-slate-200 rounded text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="Max"
                                />
                            </div>
                        </div>
                    </FilterSection>

                    {/* Brands */}
                    <FilterSection title="Marca">
                        {brands.map(brand => (
                            <label key={brand} className="flex items-center gap-2 cursor-pointer group hover:bg-slate-50 p-1 rounded-md transition-colors" onClick={() => toggleBrand(brand)}>
                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all duration-200 ${filters.brands.includes(brand)
                                    ? 'bg-[#E02127] border-[#E02127]'
                                    : 'border-slate-300 group-hover:border-slate-400 bg-white'
                                    }`}>
                                    {filters.brands.includes(brand) && <X className="w-3 h-3 text-white rotate-45 transform" style={{ transform: 'none' }} />}
                                </div>
                                <span className={`flex-1 text-sm transition-colors ${filters.brands.includes(brand) ? 'font-bold text-slate-900' : 'text-slate-600 group-hover:text-slate-900'}`}>
                                    {brand}
                                </span>
                                <span className="text-xs text-slate-400 font-medium bg-slate-100 px-2 py-0.5 rounded-full">
                                    {counts.brands[brand] || 0}
                                </span>
                            </label>
                        ))}
                    </FilterSection>

                    {/* Processor (Grouped) */}
                    <FilterSection title="Procesador">
                        {(() => {
                            // Helper to group processors
                            const getFamily = (p: string) => {
                                const lower = p.toLowerCase();
                                if (lower.includes('ryzen 9')) return { brand: 'AMD', family: 'Ryzen 9' };
                                if (lower.includes('ryzen 7')) return { brand: 'AMD', family: 'Ryzen 7' };
                                if (lower.includes('ryzen 5')) return { brand: 'AMD', family: 'Ryzen 5' };
                                if (lower.includes('ryzen 3')) return { brand: 'AMD', family: 'Ryzen 3' };
                                if (lower.includes('athlon')) return { brand: 'AMD', family: 'Athlon' };

                                if (lower.includes('i9')) return { brand: 'Intel', family: 'Core i9' };
                                if (lower.includes('i7')) return { brand: 'Intel', family: 'Core i7' };
                                if (lower.includes('i5')) return { brand: 'Intel', family: 'Core i5' };
                                if (lower.includes('i3')) return { brand: 'Intel', family: 'Core i3' };
                                if (lower.includes('celeron') || lower.includes('n4020') || lower.includes('n4500')) return { brand: 'Intel', family: 'Celeron/Pentium' };
                                if (lower.includes('pentium')) return { brand: 'Intel', family: 'Celeron/Pentium' };

                                if (lower.includes('m1')) return { brand: 'Apple', family: 'M1' };
                                if (lower.includes('m2')) return { brand: 'Apple', family: 'M2' };
                                if (lower.includes('m3')) return { brand: 'Apple', family: 'M3' };

                                return { brand: 'Otros', family: 'Otros' };
                            };

                            // Grouping
                            const grouped: Record<string, Record<string, string[]>> = {};
                            processorOptions.forEach((proc: string) => {
                                const { brand, family } = getFamily(proc);
                                if (!grouped[brand]) grouped[brand] = {};
                                if (!grouped[brand][family]) grouped[brand][family] = [];
                                grouped[brand][family].push(proc);
                            });

                            // Render
                            return Object.keys(grouped).sort().map(brand => (
                                <div key={brand} className="mb-4 last:mb-0">
                                    <h4 className="text-xs font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded mb-2 uppercase tracking-wider">{brand}</h4>
                                    <div className="space-y-2 pl-1">
                                        {Object.keys(grouped[brand]).sort().map(family => {
                                            // Check if any option in this family is selected to maybe highlight the family header? 
                                            // Actually we want to filter BY FAMILY generally, or by specific CPU?
                                            // User said "Ryzen 5" -> which implies filter by Family.
                                            // So the checkbox should be for the FAMILY "Ryzen 5", not individual partial strings.
                                            // BUT, the data coming in `processorOptions` is raw strings from DB ("Intel Core i5 1035G1").
                                            // If we want to filter by "Ryzen 5", we need to map the raw strings to this family.
                                            // Let's make the Checkbox represent the FAMILY.

                                            // We need to pass the FAMILY to the filter, not the raw strings?
                                            // Or, if we pass raw strings, we check all of them?
                                            // Simpler: The filter state `processor` will hold keys like "Ryzen 5", "Core i5".
                                            // In page.tsx we will check if the notebook cpu INCLUDES "Ryzen 5".

                                            // Let's verify `processorOptions`. It's likely raw strings.
                                            // If we change the filter logic to be "Family based", we don't need to list every raw CPU here.
                                            // We just list the Families derived from the raw CPUs.

                                            // Yes, let's treat `family` as the filter value.

                                            const count = grouped[brand][family].reduce((acc, raw) => acc + (counts.processor[raw] || 0), 0);

                                            return (
                                                <label key={family} className="flex items-center gap-2 cursor-pointer group hover:bg-slate-50 p-1 rounded-md transition-colors" onClick={() => toggleProcessor(family)}>
                                                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all duration-200 ${filters.processor?.includes(family)
                                                        ? 'bg-[#E02127] border-[#E02127]'
                                                        : 'border-slate-300 group-hover:border-slate-400 bg-white'
                                                        }`}>
                                                        {filters.processor?.includes(family) && <X className="w-3 h-3 text-white rotate-45 transform" style={{ transform: 'none' }} />}
                                                    </div>
                                                    <span className={`flex-1 text-sm transition-colors ${filters.processor?.includes(family) ? 'font-bold text-slate-900' : 'text-slate-600 group-hover:text-slate-900'}`}>
                                                        {family}
                                                    </span>
                                                    <span className="text-xs text-slate-400 font-medium bg-slate-100 px-2 py-0.5 rounded-full">
                                                        {count}
                                                    </span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            ));
                        })()}
                    </FilterSection>

                    {/* RAM */}
                    <FilterSection title="Memoria RAM">
                        {ramOptions.map(ram => (
                            <label key={ram} className="flex items-center gap-2 cursor-pointer group hover:bg-slate-50 p-1 rounded-md transition-colors" onClick={() => toggleRam(ram)}>
                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all duration-200 ${filters.ram.includes(ram)
                                    ? 'bg-[#E02127] border-[#E02127]'
                                    : 'border-slate-300 group-hover:border-slate-400 bg-white'
                                    }`}>
                                    {filters.ram.includes(ram) && <X className="w-3 h-3 text-white rotate-45 transform" style={{ transform: 'none' }} />}
                                </div>
                                <span className={`flex-1 text-sm transition-colors ${filters.ram.includes(ram) ? 'font-bold text-slate-900' : 'text-slate-600 group-hover:text-slate-900'}`}>
                                    {ram}
                                </span>
                                <span className="text-xs text-slate-400 font-medium bg-slate-100 px-2 py-0.5 rounded-full">
                                    {counts.ram[ram] || 0}
                                </span>
                            </label>
                        ))}
                    </FilterSection>

                    {/* Storage */}
                    <FilterSection title="Almacenamiento">
                        {storageOptions.map(storage => (
                            <label key={storage} className="flex items-center gap-2 cursor-pointer group hover:bg-slate-50 p-1 rounded-md transition-colors" onClick={() => toggleStorage(storage)}>
                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all duration-200 ${filters.storage.includes(storage)
                                    ? 'bg-[#E02127] border-[#E02127]'
                                    : 'border-slate-300 group-hover:border-slate-400 bg-white'
                                    }`}>
                                    {filters.storage.includes(storage) && <X className="w-3 h-3 text-white rotate-45 transform" style={{ transform: 'none' }} />}
                                </div>
                                <span className={`flex-1 text-sm transition-colors ${filters.storage.includes(storage) ? 'font-bold text-slate-900' : 'text-slate-600 group-hover:text-slate-900'}`}>
                                    {storage}
                                </span>
                                <span className="text-xs text-slate-400 font-medium bg-slate-100 px-2 py-0.5 rounded-full">
                                    {counts.storage[storage] || 0}
                                </span>
                            </label>
                        ))}
                    </FilterSection>

                    {/* Screen */}
                    <FilterSection title="Tamaño de Pantalla">
                        {(() => {
                            // Helper to extract size
                            const getSize = (s: string) => {
                                const match = s.match(/^[\d.]+"/);
                                return match ? match[0] : 'Otros';
                            };

                            // Group options
                            const groups: Record<string, string[]> = {};
                            screenOptions.forEach(opt => {
                                const size = getSize(opt);
                                if (!groups[size]) groups[size] = [];
                                groups[size].push(opt);
                            });

                            // Sort sizes (descending numeric)
                            const sortedSizes = Object.keys(groups).sort((a, b) => {
                                const valA = parseFloat(a);
                                const valB = parseFloat(b);
                                if (isNaN(valA)) return 1;
                                if (isNaN(valB)) return -1;
                                return valB - valA;
                            });

                            return sortedSizes.map(size => (
                                <div key={size} className="mb-3 last:mb-0">
                                    <h4 className="text-xs font-bold text-slate-500 mb-1.5 uppercase">{size}</h4>
                                    <div className="space-y-1 pl-1">
                                        {groups[size].map(screen => (
                                            <label key={screen} className="flex items-start gap-2 cursor-pointer group hover:bg-slate-50 p-1 rounded-md transition-colors" onClick={() => toggleScreen(screen)}>
                                                <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-all duration-200 shrink-0 ${filters.screen?.includes(screen)
                                                    ? 'bg-[#E02127] border-[#E02127]'
                                                    : 'border-slate-300 group-hover:border-slate-400 bg-white'
                                                    }`}>
                                                    {filters.screen?.includes(screen) && <X className="w-3 h-3 text-white rotate-45 transform" style={{ transform: 'none' }} />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <span className={`block text-sm leading-tight transition-colors ${filters.screen?.includes(screen) ? 'font-bold text-slate-900' : 'text-slate-600 group-hover:text-slate-900'}`}>
                                                        {screen.replace(size, '').trim() || size}
                                                    </span>
                                                </div>
                                                <span className="text-xs text-slate-400 font-medium bg-slate-100 px-2 py-0.5 rounded-full shrink-0">
                                                    {counts.screen[screen] || 0}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ));
                        })()}
                    </FilterSection>

                    {/* OS */}
                    <FilterSection title="Sistema Operativo">
                        {osOptions.map(os => (
                            <label key={os} className="flex items-center gap-2 cursor-pointer group hover:bg-slate-50 p-1 rounded-md transition-colors" onClick={() => toggleOs(os)}>
                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all duration-200 ${filters.os?.includes(os)
                                    ? 'bg-[#E02127] border-[#E02127]'
                                    : 'border-slate-300 group-hover:border-slate-400 bg-white'
                                    }`}>
                                    {filters.os?.includes(os) && <X className="w-3 h-3 text-white rotate-45 transform" style={{ transform: 'none' }} />}
                                </div>
                                <span className={`flex-1 text-sm transition-colors ${filters.os?.includes(os) ? 'font-bold text-slate-900' : 'text-slate-600 group-hover:text-slate-900'}`}>
                                    {os}
                                </span>
                                <span className="text-xs text-slate-400 font-medium bg-slate-100 px-2 py-0.5 rounded-full">
                                    {counts.os[os] || 0}
                                </span>
                            </label>
                        ))}
                    </FilterSection>

                    {/* Clear Filters */}
                    <button
                        onClick={() => setFilters({ minPrice: minPrice, maxPrice: maxPrice, brands: [], ram: [], storage: [], screen: [], os: [], processor: [] })}
                        className="w-full mt-6 py-2.5 text-sm font-bold text-slate-500 hover:text-[#E02127] hover:bg-red-50 rounded-xl transition-all border-2 border-dashed border-slate-200 hover:border-[#E02127]"
                    >
                        Limpiar Todos los Filtros
                    </button>
                    <div className="h-10 md:hidden"></div> {/* Extra space for mobile */}
                </div>
            </div>
        </>
    );
}
