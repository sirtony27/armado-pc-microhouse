'use client';
import { useState, useEffect, useRef } from 'react';
import { X, Save, Loader2, Upload, Trash2, Laptop } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface NotebookModalProps {
    isOpen: boolean;
    onClose: () => void;
    notebook?: any; // If null, creating new
    onSave: () => void;
}

export default function NotebookModal({ isOpen, onClose, notebook, onSave }: NotebookModalProps) {
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Core data
    const [formData, setFormData] = useState({
        marca: '',
        modelo: '',
        sku: '',
        precio: 0,
        descripcion: '',
        image_url: '',
        activo: true
    });

    // Specific specs for Notebooks
    const [specs, setSpecs] = useState({
        cpu: '',
        ram: '',
        storage: '',
        screen: '',
        gpu: '', // Dedicated GPU provided?
        battery: '',
        weight: '',
        os: '', // Operating System
        usage: 'Hogar/Oficina' as 'Hogar/Oficina' | 'Estudiantes' | 'Diseño' | 'Gamer' | 'Empresarial'
    });

    useEffect(() => {
        if (notebook) {
            setFormData({
                marca: notebook.marca,
                modelo: notebook.modelo,
                sku: notebook.sku || '',
                precio: notebook.precio,
                descripcion: notebook.descripcion || '',
                image_url: notebook.image_url || '',
                activo: notebook.activo
            });
            // Parse existing specs or default to empty
            const existingSpecs = notebook.especificaciones || {};
            setSpecs({
                cpu: existingSpecs.cpu || existingSpecs.procesador || '',
                ram: existingSpecs.ram || '',
                storage: existingSpecs.storage || existingSpecs.almacenamiento || '',
                screen: existingSpecs.screen || existingSpecs.pantalla || '',
                gpu: existingSpecs.gpu || '',
                battery: existingSpecs.battery || existingSpecs.bateria || '',
                weight: existingSpecs.weight || existingSpecs.peso || '',
                os: existingSpecs.os || existingSpecs.sistema || '',
                usage: existingSpecs.usage || existingSpecs.uso || 'Hogar/Oficina'
            });
        } else {
            // Reset
            setFormData({
                marca: '',
                modelo: '',
                sku: '',
                precio: 0,
                descripcion: '',
                image_url: '',
                activo: true
            });
            setSpecs({
                cpu: '',
                ram: '',
                storage: '',
                screen: '',
                gpu: '',
                battery: '',
                weight: '',
                os: '',
                usage: 'Hogar/Oficina'
            });
        }
    }, [notebook, isOpen]);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop() || 'jpg';
            const fileName = `nb-${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from('componentes').upload(fileName, file);
            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from('componentes').getPublicUrl(fileName);
            setFormData({ ...formData, image_url: publicUrl });
        } catch (error: any) {
            alert('Error al subir imagen: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                tipo: 'NOTEBOOK',
                ...formData,
                especificaciones: specs
            };

            if (notebook) {
                const { error } = await supabase.from('componentes').update(payload).eq('id', notebook.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('componentes').insert([payload]);
                if (error) throw error;
            }
            onSave();
            onClose();
        } catch (error: any) {
            alert('Error: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col md:flex-row overflow-hidden">

                {/* Visual Side */}
                <div className="hidden md:flex w-1/3 bg-slate-50 items-center justify-center p-8 border-r border-slate-100 flex-col gap-4">
                    {formData.image_url ? (
                        <div className="relative w-full aspect-video bg-white rounded-xl shadow-sm border border-slate-200 p-2 flex items-center justify-center">
                            <img src={formData.image_url} className="max-w-full max-h-full object-contain" alt="Preview" />
                            <button onClick={() => setFormData({ ...formData, image_url: '' })} className="absolute top-2 right-2 p-1 bg-red-100 text-red-600 rounded hover:bg-red-200">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <div onClick={() => fileInputRef.current?.click()} className="w-full aspect-video border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-400 cursor-pointer hover:bg-slate-100 hover:border-blue-400 transition-all">
                            {uploading ? <Loader2 className="w-8 h-8 animate-spin" /> : <Upload className="w-8 h-8 mb-2" />}
                            <span className="text-xs font-bold">Subir Foto</span>
                        </div>
                    )}
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />

                    <div className="w-full bg-white p-4 rounded-xl border border-slate-200 text-xs text-slate-500">
                        <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                            <Laptop className="w-3 h-3" /> Preview Ficha
                        </h4>
                        <div className="space-y-1">
                            <p><span className="font-bold">CPU:</span> {specs.cpu || '...'}</p>
                            <p><span className="font-bold">RAM:</span> {specs.ram || '...'}</p>
                            <p><span className="font-bold">Disco:</span> {specs.storage || '...'}</p>
                        </div>
                    </div>
                </div>

                {/* Form Side */}
                <div className="flex-1 flex flex-col bg-white overflow-hidden">
                    <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            {notebook ? 'Editar Notebook' : 'Nueva Notebook'}
                        </h2>
                        <button onClick={onClose}><X className="w-6 h-6 text-slate-400 hover:text-slate-900" /></button>
                    </div>

                    <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">

                        {/* Basic Info */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Información Básica</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-900 mb-1">Marca</label>
                                    <input value={formData.marca} onChange={e => setFormData({ ...formData, marca: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none placeholder-slate-400" placeholder="Ej: Dell, HP" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-900 mb-1">Modelo</label>
                                    <input value={formData.modelo} onChange={e => setFormData({ ...formData, modelo: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none placeholder-slate-400" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-900 mb-1">SKU (Dux)</label>
                                    <input value={formData.sku} onChange={e => setFormData({ ...formData, sku: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm text-slate-900 bg-slate-50 placeholder-slate-400" placeholder="Opcional" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-900 mb-1">Precio</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2 text-slate-500">$</span>
                                        <input type="number" value={formData.precio} onChange={e => setFormData({ ...formData, precio: Number(e.target.value) })} className="w-full border rounded-lg pl-6 pr-3 py-2 text-sm text-slate-900 font-mono" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Specs */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Especificaciones Técnicas</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-900 mb-1">Procesador (CPU)</label>
                                    <input value={specs.cpu} onChange={e => setSpecs({ ...specs, cpu: e.target.value })} className="w-full border rounded px-3 py-2 text-sm text-slate-900 placeholder-slate-400" placeholder="Ej: Intel Core i5 1135G7" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-900 mb-1">Memoria RAM</label>
                                    <select value={specs.ram} onChange={e => setSpecs({ ...specs, ram: e.target.value })} className="w-full border rounded px-3 py-2 text-sm text-slate-900">
                                        <option value="">Seleccionar...</option>
                                        <option value="4GB">4GB</option>
                                        <option value="8GB">8GB</option>
                                        <option value="12GB">12GB</option>
                                        <option value="16GB">16GB</option>
                                        <option value="20GB">20GB</option>
                                        <option value="24GB">24GB</option>
                                        <option value="32GB">32GB</option>
                                        <option value="64GB">64GB</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-900 mb-1">Almacenamiento</label>
                                    <select value={specs.storage} onChange={e => setSpecs({ ...specs, storage: e.target.value })} className="w-full border rounded px-3 py-2 text-sm text-slate-900">
                                        <option value="">Seleccionar...</option>
                                        <option value="128GB SSD">128GB SSD</option>
                                        <option value="256GB SSD">256GB SSD</option>
                                        <option value="512GB SSD">512GB SSD</option>
                                        <option value="1TB SSD">1TB SSD</option>
                                        <option value="2TB SSD">2TB SSD</option>
                                        <option value="1TB HDD">1TB HDD</option>
                                        <option value="256GB SSD + 1TB HDD">256GB SSD + 1TB HDD</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-900 mb-1">Pantalla</label>
                                    <input value={specs.screen} onChange={e => setSpecs({ ...specs, screen: e.target.value })} className="w-full border rounded px-3 py-2 text-sm text-slate-900 placeholder-slate-400" placeholder="Ej: 15.6'' FHD IPS" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-900 mb-1">Gráficos (GPU)</label>
                                    <input value={specs.gpu} onChange={e => setSpecs({ ...specs, gpu: e.target.value })} className="w-full border rounded px-3 py-2 text-sm text-slate-900 placeholder-slate-400" placeholder="Ej: Integrada o RTX 3050" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-900 mb-1">Sistema Operativo</label>
                                    <input value={specs.os} onChange={e => setSpecs({ ...specs, os: e.target.value })} className="w-full border rounded px-3 py-2 text-sm text-slate-900 placeholder-slate-400" placeholder="Ej: Windows 11 Home" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-900 mb-1">Uso Recomendado</label>
                                    <select value={specs.usage} onChange={e => setSpecs({ ...specs, usage: e.target.value as any })} className="w-full border rounded px-3 py-2 text-sm text-slate-900">
                                        <option value="Hogar/Oficina">Hogar/Oficina</option>
                                        <option value="Estudiantes">Estudiantes</option>
                                        <option value="Diseño">Diseño/Creatividad</option>
                                        <option value="Gamer">Gamer</option>
                                        <option value="Empresarial">Empresarial</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                    </form>

                    <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
                        <button onClick={onClose} className="px-5 py-2 text-slate-600 font-medium hover:bg-white hover:shadow-sm rounded-lg transition-all">Cancelar</button>
                        <button onClick={handleSubmit} disabled={loading} className="px-8 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Guardar Notebook
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
