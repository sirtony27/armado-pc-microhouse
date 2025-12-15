'use client';
import { useState, useEffect } from 'react';
import { formatPrecio } from '@/lib/utils';
import { Filter, X } from 'lucide-react';

interface FilterState {
    priceRange: [number, number];
    brands: string[];
    ram: string[];
    storage: string[];
}

interface FilterSidebarProps {
    minPrice: number;
    maxPrice: number;
    brands: string[];
    ramOptions: string[];
    storageOptions: string[];
    filters: FilterState;
    setFilters: (f: FilterState) => void;
    isOpenMobile: boolean;
    setIsOpenMobile: (v: boolean) => void;
    counts: {
        brands: Record<string, number>;
        ram: Record<string, number>;
        storage: Record<string, number>;
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
    minPrice, maxPrice, brands, ramOptions, storageOptions,
    filters, setFilters, isOpenMobile, setIsOpenMobile, counts
}: FilterSidebarProps) {

    // 1. Local state for smooth slider
    const [localPrice, setLocalPrice] = useState(filters.priceRange[1]);

    // 2. Sync local state when filters change externally (e.g. Reset or Init)
    useEffect(() => {
        setLocalPrice(filters.priceRange[1]);
    }, [filters.priceRange]);

    // 3. Handlers
    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLocalPrice(Number(e.target.value));
    };

    const handleSliderCommit = () => {
        // Only trigger global state update on release
        setFilters({ ...filters, priceRange: [filters.priceRange[0], localPrice] });
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

    const classes = `
        fixed inset-y-0 left-0 z-40 w-72 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0 md:shadow-none md:w-64 md:block md:bg-transparent
        ${isOpenMobile ? 'translate-x-0' : '-translate-x-full'}
    `;

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
                        <div className="px-1">
                            <input
                                type="range"
                                min={minPrice}
                                max={maxPrice}
                                value={localPrice}
                                onChange={handleSliderChange}
                                onMouseUp={handleSliderCommit}
                                onTouchEnd={handleSliderCommit}
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#E02127]"
                            />
                            <div className="flex justify-between text-xs text-slate-500 font-medium mt-2">
                                <span>{formatPrecio(minPrice)}</span>
                                <span className="text-slate-900 font-bold">{formatPrecio(localPrice)}</span>
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

                    {/* Clear Filters */}
                    <button
                        onClick={() => setFilters({ priceRange: [minPrice, maxPrice], brands: [], ram: [], storage: [] })}
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
