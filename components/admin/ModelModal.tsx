'use client';
import { useState, useEffect, useRef } from 'react';
import { X, Save, Loader2, Upload, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface ModelModalProps {
    isOpen: boolean;
    onClose: () => void;
    model?: any; // If null, creating new
    onSave: () => void;
}

export default function ModelModal({ isOpen, onClose, model, onSave }: ModelModalProps) {
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Form State
    const [formData, setFormData] = useState({
        nombre: '',
        slug: '',
        descripcion: '',
        precio_base: 0,
        imagen_url: '',
        activo: true,
        uso_recomendado: [] as string[],
        numero_comprobante: ''
    });

    // Components Selection State
    const [selectedComponents, setSelectedComponents] = useState({
        procesador_id: '',
        placa_madre_id: '',
        ram_id: '',
        almacenamiento_id: '',
        gpu_id: '',
        fuente_id: '',
        gabinete_id: '',
        monitor_id: ''
    });

    // Available Components for Dropdowns
    const [availableComponents, setAvailableComponents] = useState<Record<string, any[]>>({});

    useEffect(() => {
        if (isOpen) {
            fetchComponents();
            if (model) {
                setFormData({
                    nombre: model.nombre,
                    slug: model.slug,
                    descripcion: model.descripcion || '',
                    precio_base: model.precio_base,
                    imagen_url: model.imagen_url || '',
                    activo: model.activo,
                    uso_recomendado: model.uso_recomendado || [],
                    numero_comprobante: model.numero_comprobante || ''
                });
                fetchModelConfig(model.id);
            } else {
                resetForm();
            }
        }
    }, [isOpen, model]);

    const resetForm = () => {
        setFormData({
            nombre: '',
            slug: '',
            descripcion: '',
            precio_base: 0,
            imagen_url: '',
            activo: true,
            uso_recomendado: [],
            numero_comprobante: ''
        });
        setSelectedComponents({
            procesador_id: '',
            placa_madre_id: '',
            ram_id: '',
            almacenamiento_id: '',
            gpu_id: '',
            fuente_id: '',
            gabinete_id: '',
            monitor_id: ''
        });
    };

    const fetchComponents = async () => {
        const { data } = await supabase
            .from('componentes')
            .select('id, tipo, marca, modelo, precio')
            .eq('activo', true);

        if (data) {
            const grouped = data.reduce((acc: any, curr) => {
                if (!acc[curr.tipo]) acc[curr.tipo] = [];
                acc[curr.tipo].push(curr);
                return acc;
            }, {});
            setAvailableComponents(grouped);
        }
    };

    // Calculate total price whenever selected components change
    useEffect(() => {
        let total = 0;
        Object.entries(selectedComponents).forEach(([key, id]) => {
            if (!id) return;
            // Find component in available lists
            for (const type in availableComponents) {
                const component = availableComponents[type].find(c => c.id === id);
                if (component) {
                    total += component.precio || 0;
                    break;
                }
            }
        });
        setFormData(prev => ({ ...prev, precio_base: total }));
    }, [selectedComponents, availableComponents]);

    const fetchModelConfig = async (modelId: string) => {
        const { data } = await supabase
            .from('configuracion_modelo')
            .select('*')
            .eq('modelo_id', modelId)
            .single();

        if (data) {
            setSelectedComponents({
                procesador_id: data.procesador_id || '',
                placa_madre_id: data.placa_madre_id || '',
                ram_id: data.ram_id || '',
                almacenamiento_id: data.almacenamiento_id || '',
                gpu_id: data.gpu_id || '',
                fuente_id: data.fuente_id || '',
                gabinete_id: data.gabinete_id || '',
                monitor_id: '' // Not usually part of base model config but good to have if needed
            });
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];
        setUploading(true);

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `modelos/${Math.random().toString(36).substring(2)}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('productos')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('productos')
                .getPublicUrl(fileName);

            setFormData({ ...formData, imagen_url: publicUrl });
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
            let modelId = model?.id;

            // 1. Upsert Model Base
            const modelData = {
                ...formData,
                slug: formData.slug || formData.nombre.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '')
            };

            if (model) {
                const { error } = await supabase
                    .from('modelos_base')
                    .update(modelData)
                    .eq('id', modelId);
                if (error) throw error;
            } else {
                const { data, error } = await supabase
                    .from('modelos_base')
                    .insert([modelData])
                    .select()
                    .single();
                if (error) throw error;
                modelId = data.id;
            }

            // 2. Upsert Configuration
            const configData = {
                modelo_id: modelId,
                procesador_id: selectedComponents.procesador_id || null,
                placa_madre_id: selectedComponents.placa_madre_id || null,
                ram_id: selectedComponents.ram_id || null,
                almacenamiento_id: selectedComponents.almacenamiento_id || null,
                gpu_id: selectedComponents.gpu_id || null,
                fuente_id: selectedComponents.fuente_id || null,
                gabinete_id: selectedComponents.gabinete_id || null
            };

            const { error: configError } = await supabase
                .from('configuracion_modelo')
                .upsert(configData, { onConflict: 'modelo_id' });

            if (configError) throw configError;

            onSave();
            onClose();
        } catch (error: any) {
            alert('Error al guardar: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col md:flex-row overflow-hidden">

                {/* Image Side */}
                <div className="hidden md:flex w-1/3 bg-slate-50 items-center justify-center p-8 border-r border-slate-100 flex-col gap-4">
                    {formData.imagen_url ? (
                        <div className="relative w-full aspect-square bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex items-center justify-center group">
                            <img
                                src={formData.imagen_url}
                                alt="Preview"
                                className="max-w-full max-h-full object-contain"
                            />
                            <button
                                onClick={() => setFormData({ ...formData, imagen_url: '' })}
                                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    ) : (
                        <div className="text-center text-slate-500 border-2 border-dashed border-slate-300 rounded-xl p-8 w-full aspect-square flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100" onClick={() => fileInputRef.current?.click()}>
                            {uploading ? <Loader2 className="h-10 w-10 animate-spin" /> : <Upload className="h-10 w-10 mb-2" />}
                            <p className="text-sm">Subir Imagen</p>
                        </div>
                    )}
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                </div>

                {/* Form Side */}
                <div className="flex-1 flex flex-col max-h-[90vh] overflow-y-auto">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
                        <h2 className="text-xl font-bold text-slate-900">{model ? 'Editar Modelo' : 'Nuevo Modelo'}</h2>
                        <button onClick={onClose}><X className="h-6 w-6 text-slate-500 hover:text-slate-700" /></button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-sm font-bold text-slate-900 mb-1">Nombre del Modelo</label>
                                <input
                                    type="text"
                                    value={formData.nombre}
                                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-400 rounded-lg text-slate-900 placeholder-slate-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-900 mb-1">Slug (URL)</label>
                                <input
                                    type="text"
                                    value={formData.slug}
                                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-400 rounded-lg text-slate-900 placeholder-slate-500"
                                    placeholder="Auto-generado si está vacío"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-900 mb-1">Precio Base</label>
                                <input
                                    type="number"
                                    value={formData.precio_base}
                                    onChange={(e) => setFormData({ ...formData, precio_base: Number(e.target.value) })}
                                    className="w-full px-3 py-2 border border-slate-400 rounded-lg text-slate-900 placeholder-slate-500 bg-slate-100 cursor-not-allowed"
                                    min="0"
                                    readOnly
                                />
                            </div>

                            <div className="col-span-2">
                                <label className="block text-sm font-bold text-slate-900 mb-1">Descripción</label>
                                <textarea
                                    value={formData.descripcion}
                                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-400 rounded-lg h-24 text-slate-900 placeholder-slate-500"
                                />
                            </div>

                            {/* Component Selectors */}
                            <div className="col-span-2 border-t pt-4 mt-2">
                                <h3 className="font-semibold text-slate-900 mb-4">Configuración de Componentes</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {[
                                        { label: 'Procesador', key: 'procesador_id', type: 'CPU' },
                                        { label: 'Placa Madre', key: 'placa_madre_id', type: 'PLACA_MADRE' },
                                        { label: 'Memoria RAM', key: 'ram_id', type: 'RAM' },
                                        { label: 'Almacenamiento', key: 'almacenamiento_id', type: 'ALMACENAMIENTO' },
                                        { label: 'Placa de Video', key: 'gpu_id', type: 'GPU' },
                                        { label: 'Fuente', key: 'fuente_id', type: 'FUENTE' },
                                        { label: 'Gabinete', key: 'gabinete_id', type: 'GABINETE' },
                                    ].map((field) => (
                                        <div key={field.key}>
                                            <label className="block text-sm font-bold text-slate-900 mb-1">{field.label}</label>
                                            <select
                                                value={selectedComponents[field.key as keyof typeof selectedComponents]}
                                                onChange={(e) => setSelectedComponents({ ...selectedComponents, [field.key]: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-400 rounded-lg text-sm text-slate-900"
                                            >
                                                <option value="">Seleccionar...</option>
                                                {availableComponents[field.type]?.map((c) => (
                                                    <option key={c.id} value={c.id}>
                                                        {c.marca} {c.modelo}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg">Cancelar</button>
                            <button type="submit" disabled={loading} className="px-6 py-2 bg-[#E02127] text-white rounded-lg flex items-center gap-2">
                                {loading ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />}
                                Guardar
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
