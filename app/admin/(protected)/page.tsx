'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, Plus, Edit, Trash2, Eye, EyeOff, Package, CheckCircle, DollarSign, ArrowUpDown, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { formatPrecio } from '@/lib/utils';
import ProductModal from '@/components/admin/ProductModal';
import { useToast } from '@/components/ui/Toast';

type SortField = 'modelo' | 'tipo' | 'precio' | 'stock';
type SortDirection = 'asc' | 'desc';

export default function AdminDashboard() {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingPrices, setUpdatingPrices] = useState(false);
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('todos');
    const { toast } = useToast();

    // Sorting & Pagination
    const [sortField, setSortField] = useState<SortField>('modelo');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<any>(null);

    const fetchProducts = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('componentes')
            .select('*')
            .order('created_at', { ascending: false });

        if (data) setProducts(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleUpdatePrices = async () => {
        setUpdatingPrices(true);
        try {
            const res = await fetch('/api/update-prices', { method: 'POST' });
            if (!res.ok) throw new Error('Error en la actualización');
            const data = await res.json();
            
            // Format nice message
            const details = [];
            if (data.componentsUpdated) details.push(`${data.componentsUpdated} componentes`);
            if (data.notebooksUpdated) details.push(`${data.notebooksUpdated} notebooks`);
            const detailStr = details.length > 0 ? `(${details.join(', ')})` : '';

            toast(`Precios actualizados: ${data.updated} productos ${detailStr}`, 'success');
            fetchProducts();
        } catch (error) {
            toast('Error al actualizar precios', 'error');
        } finally {
            setUpdatingPrices(false);
        }
    };

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const toggleActive = async (id: string, currentStatus: boolean) => {
        const { error } = await supabase
            .from('componentes')
            .update({ activo: !currentStatus })
            .eq('id', id);

        if (!error) {
            setProducts(products.map(p => p.id === id ? { ...p, activo: !currentStatus } : p));
            toast(currentStatus ? 'Producto ocultado' : 'Producto visible', 'info');
        } else {
            toast('Error al actualizar estado', 'error');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este producto?')) return;

        const { error } = await supabase
            .from('componentes')
            .delete()
            .eq('id', id);

        if (!error) {
            setProducts(products.filter(p => p.id !== id));
            toast('Producto eliminado correctamente', 'success');
        } else {
            toast('Error al eliminar: ' + error.message, 'error');
        }
    };

    const handleEdit = (product: any) => {
        setEditingProduct(product);
        setIsModalOpen(true);
    };

    const handleNew = () => {
        setEditingProduct(null);
        setIsModalOpen(true);
    };

    const handleSave = () => {
        fetchProducts();
        toast('Producto guardado correctamente', 'success');
    };

    // Filter, Sort & Paginate
    const filteredProducts = products.filter(p => {
        const matchesSearch = p.modelo.toLowerCase().includes(search.toLowerCase()) ||
            p.marca.toLowerCase().includes(search.toLowerCase());
        const matchesType = filterType === 'todos' || p.tipo === filterType;
        return matchesSearch && matchesType;
    });

    const sortedProducts = [...filteredProducts].sort((a, b) => {
        const aValue = a[sortField];
        const bValue = b[sortField];

        if (typeof aValue === 'string') {
            return sortDirection === 'asc'
                ? aValue.localeCompare(bValue)
                : bValue.localeCompare(aValue);
        }
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });

    const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);
    const paginatedProducts = sortedProducts.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Stats Calculation
    const totalProducts = products.length;
    const activeProducts = products.filter(p => p.activo).length;
    const totalValue = products.reduce((sum, p) => sum + (p.activo ? p.precio : 0), 0);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Inventario</h1>
                    <p className="text-slate-600 mt-1">Gestioná el catálogo de componentes de tu tienda.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleUpdatePrices}
                        disabled={updatingPrices}
                        className="bg-white text-slate-700 border border-slate-200 px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 hover:bg-slate-50 transition-all disabled:opacity-50"
                    >
                        <RefreshCw className={`h-5 w-5 ${updatingPrices ? 'animate-spin' : ''}`} />
                        {updatingPrices ? 'Actualizando...' : 'Actualizar Precios'}
                    </button>
                    {products.length > 0 && (
                        <div className="hidden md:block text-right mr-4">
                            <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">Última actualización</p>
                            <p className="text-xs font-medium text-slate-600">
                                {(() => {
                                    const dates = products
                                        .map(p => p.ultima_actualizacion)
                                        .filter(Boolean)
                                        .map(d => {
                                            // Asumimos que la fecha guardada es UTC si no tiene info de zona horaria
                                            const dateStr = d.endsWith('Z') || d.includes('+') ? d : `${d}Z`;
                                            return new Date(dateStr).getTime();
                                        });

                                    if (dates.length === 0) return 'Nunca';

                                    const lastUpdate = new Date(Math.max(...dates));
                                    return lastUpdate.toLocaleString('es-AR', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        timeZone: 'America/Argentina/Buenos_Aires'
                                    });
                                })()}
                            </p>
                        </div>
                    )}
                    <button
                        onClick={handleNew}
                        className="bg-[#E02127] text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 hover:bg-red-700 transition-all shadow-lg shadow-red-900/20 hover:shadow-red-900/30 active:scale-95"
                    >
                        <Plus className="h-5 w-5" />
                        Nuevo Producto
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-5 hover:shadow-md transition-shadow">
                    <div className="p-4 bg-blue-50 text-blue-600 rounded-xl">
                        <Package className="h-7 w-7" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-600 font-medium">Total Productos</p>
                        <p className="text-3xl font-bold text-slate-900">{totalProducts}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-5 hover:shadow-md transition-shadow">
                    <div className="p-4 bg-green-50 text-green-600 rounded-xl">
                        <CheckCircle className="h-7 w-7" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-600 font-medium">Activos</p>
                        <p className="text-3xl font-bold text-slate-900">{activeProducts}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-5 hover:shadow-md transition-shadow">
                    <div className="p-4 bg-purple-50 text-purple-600 rounded-xl">
                        <DollarSign className="h-7 w-7" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-600 font-medium">Valor Inventario</p>
                        <p className="text-3xl font-bold text-slate-900">{formatPrecio(totalValue)}</p>
                    </div>
                </div>
            </div>

            {/* Filters & Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row gap-4 bg-slate-50/50">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Buscar por marca o modelo..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E02127]/20 focus:border-[#E02127] bg-white transition-all text-slate-900 placeholder-slate-500"
                        />
                    </div>
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="px-4 py-2.5 border border-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E02127]/20 focus:border-[#E02127] bg-white cursor-pointer hover:border-slate-500 transition-colors text-slate-900"
                    >
                        <option value="todos">Todos los tipos</option>
                        <option value="CPU">Procesadores</option>
                        <option value="PLACA_MADRE">Placas Madre</option>
                        <option value="RAM">Memorias RAM</option>
                        <option value="ALMACENAMIENTO">Almacenamiento</option>
                        <option value="GPU">Placas de Video</option>
                        <option value="FUENTE">Fuentes</option>
                        <option value="GABINETE">Gabinetes</option>
                        <option value="MONITOR">Monitores</option>
                    </select>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th
                                    className="px-6 py-4 font-semibold text-slate-700 cursor-pointer hover:bg-slate-100 transition-colors group"
                                    onClick={() => handleSort('modelo')}
                                >
                                    <div className="flex items-center gap-2">
                                        Producto
                                        <ArrowUpDown className="h-3 w-3 text-slate-500 group-hover:text-slate-700" />
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-4 font-semibold text-slate-700 cursor-pointer hover:bg-slate-100 transition-colors group"
                                    onClick={() => handleSort('tipo')}
                                >
                                    <div className="flex items-center gap-2">
                                        Tipo
                                        <ArrowUpDown className="h-3 w-3 text-slate-500 group-hover:text-slate-700" />
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-4 font-semibold text-slate-700 cursor-pointer hover:bg-slate-100 transition-colors group"
                                    onClick={() => handleSort('precio')}
                                >
                                    <div className="flex items-center gap-2">
                                        Precio
                                        <ArrowUpDown className="h-3 w-3 text-slate-500 group-hover:text-slate-700" />
                                    </div>
                                </th>
                                <th className="px-6 py-4 font-semibold text-slate-700">Estado</th>
                                <th className="px-6 py-4 font-semibold text-slate-700 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-4"><div className="h-12 w-48 bg-slate-100 rounded-lg"></div></td>
                                        <td className="px-6 py-4"><div className="h-6 w-24 bg-slate-100 rounded-full"></div></td>
                                        <td className="px-6 py-4"><div className="h-6 w-20 bg-slate-100 rounded"></div></td>
                                        <td className="px-6 py-4"><div className="h-6 w-16 bg-slate-100 rounded-full"></div></td>
                                        <td className="px-6 py-4"><div className="h-8 w-16 bg-slate-100 rounded ml-auto"></div></td>
                                    </tr>
                                ))
                            ) : paginatedProducts.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-16 text-center text-slate-600">No se encontraron productos</td></tr>
                            ) : (
                                paginatedProducts.map((product) => (
                                    <tr key={product.id} className="hover:bg-slate-50/80 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                {product.image_url ? (
                                                    <img src={product.image_url} alt="" className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-sm" />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200">
                                                        <Package className="h-6 w-6" />
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-semibold text-slate-900">{product.modelo}</p>
                                                    <p className="text-xs text-slate-600 font-medium">{product.marca}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                                {product.tipo}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-slate-900">
                                            {formatPrecio(product.precio)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => toggleActive(product.id, product.activo)}
                                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${product.activo
                                                    ? 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-200'
                                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                                                    }`}
                                            >
                                                <span className={`w-1.5 h-1.5 rounded-full ${product.activo ? 'bg-green-500' : 'bg-slate-400'}`}></span>
                                                {product.activo ? 'Visible' : 'Oculto'}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleEdit(product)}
                                                    className="p-2 text-slate-500 hover:text-[#0D1A4B] hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(product.id)}
                                                    className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50/50">
                        <p className="text-sm text-slate-600">
                            Mostrando página <span className="font-medium text-slate-900">{currentPage}</span> de <span className="font-medium text-slate-900">{totalPages}</span>
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-2 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <ProductModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                product={editingProduct}
                onSave={handleSave}
            />
        </div>
    );
}
