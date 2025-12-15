'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Laptop, Search, PlusCircle, PenSquare, Trash2 } from 'lucide-react';
import NotebookModal from '@/components/admin/NotebookModal';
import { formatPrecio } from '@/lib/utils';
import Image from 'next/image';

export default function AdminNotebooksPage() {
    const [notebooks, setNotebooks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingNotebook, setEditingNotebook] = useState<any>(null);

    const fetchNotebooks = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('componentes')
            .select('*')
            .eq('tipo', 'NOTEBOOK')
            .order('created_at', { ascending: false });

        if (error) {
            console.error(error);
        } else {
            setNotebooks(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchNotebooks();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de que querés eliminar esta notebook?')) return;

        const { error } = await supabase
            .from('componentes')
            .delete()
            .eq('id', id);

        if (error) {
            alert('Error al eliminar');
        } else {
            fetchNotebooks();
        }
    };

    const handleEdit = (notebook: any) => {
        setEditingNotebook(notebook);
        setIsModalOpen(true);
    };

    const handleCreate = () => {
        setEditingNotebook(null);
        setIsModalOpen(true);
    };

    const filteredNotebooks = notebooks.filter(n =>
        n.modelo.toLowerCase().includes(search.toLowerCase()) ||
        n.marca.toLowerCase().includes(search.toLowerCase()) ||
        (n.sku && n.sku.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Buscar por marca, modelo o SKU..."
                        className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#E02127] outline-none text-sm transition-shadow"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <button
                    onClick={handleCreate}
                    className="bg-[#E02127] text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-red-700 transition-colors shadow-lg shadow-red-500/20 active:scale-95"
                >
                    <PlusCircle className="w-5 h-5" />
                    Nueva Notebook
                </button>
            </div>

            {/* List */}
            {loading ? (
                <div className="text-center py-20 text-slate-400">Cargando notebooks...</div>
            ) : filteredNotebooks.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                    <Laptop className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">No se encontraron notebooks.</p>
                </div>
            ) : (
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                            <tr>
                                <th className="p-4 w-20">Imagen</th>
                                <th className="p-4">Equipo</th>
                                <th className="p-4 hidden md:table-cell">Especificaciones Clave</th>
                                <th className="p-4">Precio</th>
                                <th className="p-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredNotebooks.map(notebook => (
                                <tr key={notebook.id} className="hover:bg-slate-50 group transition-colors">
                                    <td className="p-4">
                                        <div className="w-12 h-12 bg-white border border-slate-100 rounded-lg p-1 flex items-center justify-center">
                                            {notebook.image_url ? (
                                                <Image src={notebook.image_url} alt={notebook.modelo} width={48} height={48} className="object-contain w-full h-full" />
                                            ) : <Laptop className="text-slate-200 w-6 h-6" />}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="font-bold text-slate-900">{notebook.marca} {notebook.modelo}</div>
                                        <div className="text-xs text-slate-500 font-mono">{notebook.sku || 'Sin SKU'}</div>
                                    </td>
                                    <td className="p-4 hidden md:table-cell text-slate-600">
                                        <div className="flex flex-wrap gap-2">
                                            {notebook.especificaciones?.cpu && <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-medium border border-slate-200">{notebook.especificaciones.cpu}</span>}
                                            {notebook.especificaciones?.ram && <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-medium border border-slate-200">{notebook.especificaciones.ram}</span>}
                                            {notebook.especificaciones?.storage && <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-medium border border-slate-200">{notebook.especificaciones.storage}</span>}
                                        </div>
                                    </td>
                                    <td className="p-4 font-bold text-slate-900">
                                        {formatPrecio(notebook.precio)}
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleEdit(notebook)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Editar"
                                            >
                                                <PenSquare className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(notebook.id)}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Eliminar"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <NotebookModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                notebook={editingNotebook}
                onSave={fetchNotebooks}
            />

        </div>
    );
}
