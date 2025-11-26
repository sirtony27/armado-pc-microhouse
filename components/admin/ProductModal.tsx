'use client';
import { useState, useEffect, useRef } from 'react';
import { X, Save, Loader2, Image as ImageIcon, Upload, Trash2, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface ProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    product?: any; // If null, it's creating a new product
    onSave: () => void;
}

const RECOMMENDED_SPECS: Record<string, object> = {
    CPU: { cores: "6", threads: "12", frequency: "3.5GHz", socket: "AM4" },
    PLACA_MADRE: { socket: "AM4", chipset: "B550", format: "ATX", ram_slots: "4" },
    RAM: { capacity: "16GB", type: "DDR4", speed: "3200MHz", modules: "2x8GB" },
    ALMACENAMIENTO: { type: "SSD M.2", capacity: "1TB", interface: "PCIe 4.0" },
    GPU: { vram: "8GB", type: "GDDR6", interface: "PCIe 4.0" },
    FUENTE: { power: "650W", certification: "80+ Bronze", modular: "No" },
    GABINETE: { type: "Mid Tower", fans_included: "4", color: "Black" },
    MONITOR: { size: "24", resolution: "1920x1080", refresh_rate: "144Hz", panel: "IPS" },
    PC_ARMADA: { processor: "Ryzen 5 5600", gpu: "RTX 4060", ram: "16GB", storage: "1TB SSD" }
};

export default function ProductModal({ isOpen, onClose, product, onSave }: ProductModalProps) {
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [formData, setFormData] = useState({
        tipo: 'CPU',
        marca: '',
        modelo: '',
        sku: '',
        precio: 0,
        image_url: '',
        especificaciones: '{}',
        activo: true
    });

    useEffect(() => {
        if (product) {
            setFormData({
                tipo: product.tipo,
                marca: product.marca,
                modelo: product.modelo,
                sku: product.sku || '',
                precio: product.precio,
                image_url: product.image_url || '',
                especificaciones: JSON.stringify(product.especificaciones || {}, null, 2),
                activo: product.activo
            });
        } else {
            setFormData({
                tipo: 'CPU',
                marca: '',
                modelo: '',
                sku: '',
                precio: 0,
                image_url: '',
                especificaciones: JSON.stringify(RECOMMENDED_SPECS['CPU'], null, 2),
                activo: true
            });
        }
    }, [product, isOpen]);

    const handleTypeChange = (newType: string) => {
        const currentSpecs = formData.especificaciones;
        let newSpecs = currentSpecs;
        if (!product) {
            newSpecs = JSON.stringify(RECOMMENDED_SPECS[newType] || {}, null, 2);
        }

        setFormData({ ...formData, tipo: newType, especificaciones: newSpecs });
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];
        setUploading(true);

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('productos')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('productos')
                .getPublicUrl(filePath);

            setFormData({ ...formData, image_url: publicUrl });
        } catch (error: any) {
            alert('Error al subir imagen: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            let specs = {};
            try {
                specs = JSON.parse(formData.especificaciones);
            } catch (e) {
                alert('El formato JSON de especificaciones es inválido');
                setLoading(false);
                return;
            }

            const dataToSave = {
                ...formData,
                especificaciones: specs
            };

            if (product) {
                const { error } = await supabase
                    .from('componentes')
                    .update(dataToSave)
                    .eq('id', product.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('componentes')
                    .insert([dataToSave]);
                if (error) throw error;
            }

            onSave();
            onClose();
        } catch (error: any) {
            alert('Error al guardar: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col md:flex-row overflow-hidden">

                {/* Image Preview Side (Desktop) */}
                <div className="hidden md:flex w-1/3 bg-slate-50 items-center justify-center p-8 border-r border-slate-100 flex-col gap-4">
                    {formData.image_url ? (
                        <div className="relative w-full aspect-square bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex items-center justify-center group">
                            <img
                                src={formData.image_url}
                                alt="Preview"
                                className="max-w-full max-h-full object-contain"
                                onError={(e) => (e.currentTarget.src = '')}
                            />
                            <button
                                onClick={() => setFormData({ ...formData, image_url: '' })}
                                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                title="Eliminar imagen"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    ) : (
                        <div className="text-center text-slate-500 border-2 border-dashed border-slate-300 rounded-xl p-8 w-full aspect-square flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => fileInputRef.current?.click()}>
                            {uploading ? (
                                <Loader2 className="h-10 w-10 animate-spin text-slate-500" />
                            ) : (
                                <>
                                    <Upload className="h-10 w-10 mb-2 opacity-50" />
                                    <p className="text-sm font-medium">Subir Imagen</p>
                                    <p className="text-xs opacity-70 mt-1">Click para seleccionar</p>
                                </>
                            )}
                        </div>
                    )}
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageUpload}
                    />
                    {formData.image_url && (
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                            Cambiar imagen
                        </button>
                    )}
                </div>

                {/* Form Side */}
                <div className="flex-1 flex flex-col max-h-[90vh] overflow-y-auto">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
                        <h2 className="text-xl font-bold text-slate-900">
                            {product ? 'Editar Producto' : 'Nuevo Producto'}
                        </h2>
                        <button onClick={onClose} className="text-slate-500 hover:text-slate-700">
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-900 mb-1">Tipo</label>
                                <select
                                    value={formData.tipo}
                                    onChange={(e) => handleTypeChange(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-400 rounded-lg focus:ring-2 focus:ring-[#E02127] outline-none text-slate-900"
                                >
                                    <option value="CPU">Procesador</option>
                                    <option value="PLACA_MADRE">Placa Madre</option>
                                    <option value="RAM">Memoria RAM</option>
                                    <option value="ALMACENAMIENTO">Almacenamiento</option>
                                    <option value="GPU">Placa de Video</option>
                                    <option value="FUENTE">Fuente</option>
                                    <option value="GABINETE">Gabinete</option>
                                    <option value="MONITOR">Monitor</option>
                                    <option value="PC_ARMADA">PC Armada</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-900 mb-1">Marca</label>
                                <input
                                    type="text"
                                    value={formData.marca}
                                    onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-400 rounded-lg focus:ring-2 focus:ring-[#E02127] outline-none text-slate-900 placeholder-slate-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-900 mb-1">SKU (Dux)</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={formData.sku}
                                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-400 rounded-lg focus:ring-2 focus:ring-[#E02127] outline-none text-slate-900 placeholder-slate-500"
                                        placeholder="Ej: 12345"
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        {/* Optional: Add a manual fetch button here if needed later */}
                                    </div>
                                </div>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-slate-900 mb-1">Modelo</label>
                                <input
                                    type="text"
                                    value={formData.modelo}
                                    onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-400 rounded-lg focus:ring-2 focus:ring-[#E02127] outline-none text-slate-900 placeholder-slate-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-900 mb-1">Precio</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600">$</span>
                                    <input
                                        type="number"
                                        value={formData.precio}
                                        onChange={(e) => setFormData({ ...formData, precio: Number(e.target.value) })}
                                        className="w-full pl-8 pr-3 py-2 border border-slate-400 rounded-lg focus:ring-2 focus:ring-[#E02127] outline-none text-slate-900 placeholder-slate-500 bg-slate-100 cursor-not-allowed"
                                    />
                                </div>
                            </div>

                            {/* Mobile Image Upload */}
                            <div className="md:hidden">
                                <label className="block text-sm font-bold text-slate-900 mb-1">Imagen</label>
                                <div className="flex gap-2 items-center">
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors flex items-center gap-2"
                                    >
                                        <Upload className="h-4 w-4" />
                                        {uploading ? 'Subiendo...' : 'Subir Imagen'}
                                    </button>
                                    {formData.image_url && <span className="text-xs text-green-600 font-medium">¡Imagen cargada!</span>}
                                </div>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-slate-900 mb-1">
                                    Especificaciones (JSON)
                                    <span className="text-xs text-slate-500 ml-2 font-normal">Se autocompleta según el tipo</span>
                                </label>
                                <textarea
                                    value={formData.especificaciones}
                                    onChange={(e) => setFormData({ ...formData, especificaciones: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-400 rounded-lg focus:ring-2 focus:ring-[#E02127] outline-none font-mono text-sm h-32 text-slate-900 placeholder-slate-500"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={loading || uploading}
                                className="px-6 py-2 bg-[#E02127] text-white rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                Guardar
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
