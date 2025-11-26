'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, Plus, Edit, Trash2, Monitor, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatPrecio } from '@/lib/utils';
import ModelModal from '@/components/admin/ModelModal';
import { useToast } from '@/components/ui/Toast';

type SortField = 'nombre' | 'precio_base';
type SortDirection = 'asc' | 'desc';

export default function ModelsPage() {
  const [models, setModels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { toast } = useToast();

  // Sorting & Pagination
  const [sortField, setSortField] = useState<SortField>('nombre');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<any>(null);

  const fetchModels = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('modelos_base')
      .select('*')
      .order('orden', { ascending: true });

    if (data) setModels(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchModels();
  }, []);

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
      .from('modelos_base')
      .update({ activo: !currentStatus })
      .eq('id', id);

    if (!error) {
      setModels(models.map(m => m.id === id ? { ...m, activo: !currentStatus } : m));
      toast(currentStatus ? 'Modelo ocultado' : 'Modelo visible', 'info');
    } else {
      toast('Error al actualizar estado', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este modelo?')) return;

    const { error } = await supabase
      .from('modelos_base')
      .delete()
      .eq('id', id);

    if (!error) {
      setModels(models.filter(m => m.id !== id));
      toast('Modelo eliminado correctamente', 'success');
    } else {
      toast('Error al eliminar: ' + error.message, 'error');
    }
  };

  const handleEdit = (model: any) => {
    setEditingModel(model);
    setIsModalOpen(true);
  };

  const handleNew = () => {
    setEditingModel(null);
    setIsModalOpen(true);
  };

  const handleSave = () => {
    fetchModels();
    toast('Modelo guardado correctamente', 'success');
  };

  // Filter, Sort & Paginate
  const filteredModels = models.filter(m => {
    return m.nombre.toLowerCase().includes(search.toLowerCase());
  });

  const sortedModels = [...filteredModels].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];

    if (typeof aValue === 'string') {
      return sortDirection === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
  });

  const totalPages = Math.ceil(sortedModels.length / itemsPerPage);
  const paginatedModels = sortedModels.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Modelos de PC</h1>
          <p className="text-slate-600 mt-1">Gestioná las configuraciones pre-armadas.</p>
        </div>
        <button
          onClick={handleNew}
          className="bg-[#E02127] text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 hover:bg-red-700 transition-all shadow-lg shadow-red-900/20 hover:shadow-red-900/30 active:scale-95"
        >
          <Plus className="h-5 w-5" />
          Nuevo Modelo
        </button>
      </div>

      {/* Filters & Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex gap-4 bg-slate-50/50">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar modelo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E02127]/20 focus:border-[#E02127] bg-white transition-all text-slate-900 placeholder-slate-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th
                  className="px-6 py-4 font-semibold text-slate-700 cursor-pointer hover:bg-slate-100 transition-colors group"
                  onClick={() => handleSort('nombre')}
                >
                  <div className="flex items-center gap-2">
                    Modelo
                    <ArrowUpDown className="h-3 w-3 text-slate-500 group-hover:text-slate-700" />
                  </div>
                </th>
                <th
                  className="px-6 py-4 font-semibold text-slate-700 cursor-pointer hover:bg-slate-100 transition-colors group"
                  onClick={() => handleSort('precio_base')}
                >
                  <div className="flex items-center gap-2">
                    Precio Base
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
                    <td className="px-6 py-4"><div className="h-6 w-20 bg-slate-100 rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-6 w-16 bg-slate-100 rounded-full"></div></td>
                    <td className="px-6 py-4"><div className="h-8 w-16 bg-slate-100 rounded ml-auto"></div></td>
                  </tr>
                ))
              ) : paginatedModels.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-16 text-center text-slate-600">No se encontraron modelos</td></tr>
              ) : (
                paginatedModels.map((model) => (
                  <tr key={model.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        {model.imagen_url ? (
                          <img src={model.imagen_url} alt="" className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-sm" />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200">
                            <Monitor className="h-6 w-6" />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-slate-900">{model.nombre}</p>
                          <p className="text-xs text-slate-600 font-medium">/{model.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {formatPrecio(model.precio_base)}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleActive(model.id, model.activo)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${model.activo
                          ? 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-200'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                          }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${model.activo ? 'bg-green-500' : 'bg-slate-400'}`}></span>
                        {model.activo ? 'Visible' : 'Oculto'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(model)}
                          className="p-2 text-slate-500 hover:text-[#0D1A4B] hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(model.id)}
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

      <ModelModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        model={editingModel}
        onSave={handleSave}
      />
    </div>
  );
}
