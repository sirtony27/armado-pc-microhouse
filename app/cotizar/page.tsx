'use client';

import { useState, useMemo, useEffect, useRef, useLayoutEffect, useCallback } from 'react';
import { useCotizadorStore } from '@/store/cotizadorStore';
import { useModelosBase } from '@/lib/models';
import { useComponentes } from '@/lib/componentes';
import { formatPrecio } from '@/lib/utils';
import { useRemotePrices } from '@/lib/pricing';
import { ChevronLeft, ChevronRight, Check, Cpu, HardDrive, MemoryStick, MonitorUp, ChevronDown, Sparkles, ArrowRight, ArrowLeft, Box, Zap, RotateCcw } from 'lucide-react';
import Stepper from '@/components/cotizador/Stepper';
import GabineteSelector from '@/components/cotizador/GabineteSelector';
import FuenteSelector from '@/components/cotizador/FuenteSelector';
import MonitorSelector from '@/components/cotizador/MonitorSelector';
import MobileSummary from '@/components/cotizador/MobileSummary';
import './animations.css';
// jsPDF will be dynamically imported
// autoTable will be dynamically imported

export default function CotizarPage() {
  const { pasoActual, setPaso, modeloSeleccionado, componentesSeleccionados, setModeloBase, cambiarComponente, resetear } = useCotizadorStore();
  const modelosBase = useModelosBase();
  const modelosOrdenados = useMemo(() => [...modelosBase].sort((a, b) => a.precioBase - b.precioBase), [modelosBase]);
  const componentes = useComponentes();
  const gabinetes = useMemo(() => componentes.filter(c => c.tipo === 'GABINETE'), [componentes]);
  const fuentes = useMemo(() => componentes.filter(c => c.tipo === 'FUENTE'), [componentes]);
  const [currentModelIndex, setCurrentModelIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [mejorasExpanded, setMejorasExpanded] = useState(pasoActual === 'mejoras');
  const remotePrices = useRemotePrices(componentes);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const [maxCardHeight, setMaxCardHeight] = useState<number | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const placaActual = useMemo(
    () => componentes.find((c) => c.id === componentesSeleccionados?.placaMadre),
    [componentes, componentesSeleccionados]
  );
  const measureAndSetHeight = useCallback(() => {
    let maxHeight = 0;
    cardRefs.current.forEach(card => {
      if (card) {
        card.style.minHeight = 'auto';
        maxHeight = Math.max(maxHeight, card.scrollHeight);
      }
    });
    if (maxHeight > 0) {
      setMaxCardHeight(maxHeight);
    }
  }, []);

  useLayoutEffect(() => {
    if (modelosOrdenados.length > 0) {
      measureAndSetHeight();
    }
    window.addEventListener('resize', measureAndSetHeight);
    return () => window.removeEventListener('resize', measureAndSetHeight);
  }, [modelosOrdenados, measureAndSetHeight]);



  const handleSeleccionarModelo = (modelo: typeof modelosBase[0]) => {
    setModeloBase(modelo); // Esto ya actualiza el paso automáticamente
  };

  const gabineteSeleccionado = useMemo(
    () => componentes.find((c) => c.id === componentesSeleccionados?.gabinete),
    [componentes, componentesSeleccionados]
  );
  const gabineteIncluyeFuente = useMemo(() => {
    const specs = (gabineteSeleccionado as any)?.especificaciones || {};
    return Boolean(
      specs.incluyeFuente ||
      specs.incluye_fuente ||
      specs.fuenteIncluida ||
      specs.psuIncluida ||
      specs.psu_incluida
    );
  }, [gabineteSeleccionado]);

  // Si el gabinete trae fuente incluida, limpiamos selección de fuente para evitar precios duplicados
  useEffect(() => {
    if (gabineteIncluyeFuente && componentesSeleccionados?.fuente) {
      cambiarComponente('FUENTE', '');
    }
  }, [gabineteIncluyeFuente, componentesSeleccionados?.fuente, cambiarComponente]);

  // Validar si puede avanzar de paso
  const puedeAvanzar = useMemo(() => {
    if (pasoActual === 'modelo') return !!modeloSeleccionado;
    if (pasoActual === 'mejoras') return !!modeloSeleccionado;
    if (pasoActual === 'gabinete') {
      return !!componentesSeleccionados?.gabinete;
    }
    return true;
  }, [pasoActual, modeloSeleccionado, componentesSeleccionados]);

  const handleSiguiente = () => {
    if (pasoActual === 'modelo' && puedeAvanzar) setPaso('mejoras');
    else if (pasoActual === 'mejoras' && puedeAvanzar) setPaso('gabinete');
    else if (pasoActual === 'gabinete' && puedeAvanzar) setPaso(gabineteIncluyeFuente ? 'monitor' : 'fuente');
    else if (pasoActual === 'fuente') setPaso('monitor');
    else if (pasoActual === 'monitor') setPaso('resumen');
  };

  const handleAnterior = () => {
    if (pasoActual === 'mejoras') setPaso('modelo');
    else if (pasoActual === 'gabinete') setPaso('mejoras');
    else if (pasoActual === 'fuente') setPaso('gabinete');
    else if (pasoActual === 'monitor') setPaso(gabineteIncluyeFuente ? 'gabinete' : 'fuente');
    else if (pasoActual === 'resumen') setPaso('monitor');
  };

  // Expandir mejoras automáticamente en el paso de mejoras
  useEffect(() => {
    if (pasoActual === 'mejoras') {
      setMejorasExpanded(true);
    }
  }, [pasoActual]);

  // Manejo de swipe para el carrusel
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      nextModel();
    } else if (isRightSwipe) {
      prevModel();
    }
  };

  // Calcular precio total
  const precioTotal = useMemo(() => {
    if (!componentesSeleccionados) return 0;
    const ids = Object.values(componentesSeleccionados).filter(Boolean) as string[];
    return componentes
      .filter((comp) => ids.includes(comp.id))
      .reduce((sum, comp) => sum + (remotePrices[comp.id] ?? comp.precio), 0);
  }, [componentesSeleccionados, componentes, remotePrices]);

  // Obtener componentes seleccionados con detalles
  const componentesDetalle = useMemo(() => {
    if (!componentesSeleccionados) return [];
    return Object.entries(componentesSeleccionados)
      .filter(([, id]) => !!id)
      .map(([tipo, id]) => {
        const comp = componentes.find((c) => c.id === id);
        return { tipo, componente: comp };
      });
  }, [componentesSeleccionados, componentes]);

  // Navegación del carrusel (solo cambia el índice, NO selecciona)
  const nextModel = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    const nextIndex = (currentModelIndex + 1) % modelosOrdenados.length;
    setCurrentModelIndex(nextIndex);
    setTimeout(() => setIsTransitioning(false), 800);
  };

  const prevModel = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    const prevIndex = (currentModelIndex - 1 + modelosOrdenados.length) % modelosOrdenados.length;
    setCurrentModelIndex(prevIndex);
    setTimeout(() => setIsTransitioning(false), 800);
  };


  const total = precioTotal;

  const handleDescargarPDF = async () => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;
      // A5 Format
      const doc = new jsPDF({ unit: 'pt', format: 'a5' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 30; // Smaller margin for A5
      let y = margin;

      // --- Header ---
      // Franja superior roja
      doc.setFillColor(224, 33, 39); // #E02127
      doc.rect(0, 0, pageWidth, 10, 'F');

      y += 25;

      // Logo (Izquierda)
      try {
        const logoResp = await fetch('https://wckxhidltmnvpbrswnmz.supabase.co/storage/v1/object/public/componentes/branding/microhouse-logo.png');
        const logoBlob = await logoResp.blob();
        const logoDataUrl: string = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(logoBlob);
        });
        doc.addImage(logoDataUrl, 'PNG', margin, y, 100, 23); // Smaller logo
      } catch {
        // Fallback text if logo fails
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.setTextColor(224, 33, 39);
        doc.text('MICROHOUSE', margin, y + 18);
      }

      // Info Empresa (Derecha)
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8); // Smaller font
      doc.setTextColor(80);
      const companyInfo = [
        'www.microhouse.com.ar',
        'administracion@microhouse.com.ar',
        'Tel: 291 576-4388'
      ];
      const infoX = pageWidth - margin;
      let infoY = y + 5;
      companyInfo.forEach(line => {
        doc.text(line, infoX, infoY, { align: 'right' });
        infoY += 10;
      });

      y += 45;

      // Título y Fecha
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(30);
      doc.text('PRESUPUESTO', margin, y);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100);
      const fecha = new Date();
      doc.text(`Fecha: ${fecha.toLocaleDateString()}`, margin, y + 12);
      doc.text(`Hora: ${fecha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, margin, y + 22);

      // Info Cliente / Modelo (Derecha alineado con título)
      if (modeloSeleccionado?.nombre) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(30);
        doc.text(`Modelo Base: ${modeloSeleccionado.nombre}`, pageWidth - margin, y, { align: 'right' });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text('Configuración Personalizada', pageWidth - margin, y + 12, { align: 'right' });
      }

      y += 35;

      // --- Tabla de Componentes ---
      const tipoMap: Record<string, string> = {
        procesador: 'Procesador', placamadre: 'Placa Madre', placaMadre: 'Placa Madre',
        ram: 'Memoria RAM', almacenamiento: 'Almacenamiento', gpu: 'Gráfica',
        fuente: 'Fuente', gabinete: 'Gabinete', monitor: 'Monitor'
      };

      const rows = componentesDetalle.map(({ tipo, componente }) => {
        const base = componente ? (remotePrices[componente.id] ?? componente.precio) : 0;
        const precio3 = Math.ceil((base || 0) * 1.10);
        const e: any = componente?.especificaciones || {};

        // Construir detalle técnico
        let detalle = '';
        if (tipo === 'ram') detalle = e.capacidad || '';
        else if (tipo === 'almacenamiento') detalle = `${e.capacidad || ''} ${e.tipo || ''}`;
        else if (tipo === 'gpu') detalle = e.vram || '';
        else if (tipo === 'fuente') detalle = `${e.potencia || ''} ${e.certificacion || ''}`;
        else if (tipo === 'gabinete') detalle = e.formato || '';
        else if (tipo === 'monitor') detalle = `${e.resolucion || ''} ${e.tamano_pulgadas ? `${e.tamano_pulgadas}"` : ''}`;

        // SKU / Código
        const sku = componente?.sku || (componente as any)?.codigo || `MH-${componente?.id?.substring(0, 6).toUpperCase() || '000'}`;

        return [
          sku,
          tipoMap[tipo] || tipo,
          `${componente?.marca || ''} ${componente?.modelo || ''}`.trim(),
          detalle.trim(),
          formatPrecio(precio3)
        ];
      });

      autoTable(doc, {
        head: [['Código', 'Tipo', 'Componente', 'Detalle', 'Precio (3 Cuotas)']],
        body: rows,
        startY: y,
        theme: 'grid',
        headStyles: {
          fillColor: [224, 33, 39],
          textColor: 255,
          fontStyle: 'bold',
          halign: 'left',
          cellPadding: 4,
          fontSize: 8
        },
        bodyStyles: {
          textColor: 50,
          fontSize: 7, // Smaller font for table body
          cellPadding: 4
        },
        columnStyles: {
          0: { cellWidth: '12%' as any, fontStyle: 'bold', textColor: 80 }, // Código
          1: { cellWidth: '15%' as any }, // Tipo
          2: { cellWidth: '35%' as any }, // Componente (Más espacio)
          3: { cellWidth: '20%' as any }, // Detalle
          4: { cellWidth: '18%' as any, halign: 'right', fontStyle: 'bold' } // Precio
        },
        alternateRowStyles: {
          fillColor: [249, 250, 251]
        },
        margin: { left: margin, right: margin }
      });

      const finalY = (doc as any).lastAutoTable.finalY + 20;

      // --- Totales y Pagos ---
      // Contenedor gris claro para los totales
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(margin, finalY, pageWidth - (margin * 2), 110, 6, 6, 'F');

      let py = finalY + 20;
      const leftColX = margin + 15;
      const rightColX = pageWidth - margin - 15;

      // Cálculos
      const contado = Math.ceil(total);
      const unoCuota = Math.ceil(total * 1.10);
      const tresTotal = Math.ceil(total * 1.10);
      const seisTotal = Math.ceil(contado * 1.2603);
      const doceTotal = Math.ceil(contado * 1.51);

      // Título Pagos
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(30);
      doc.text('Opciones de Pago', leftColX, py);
      py += 20;

      // Lista de precios
      doc.setFontSize(8);

      // Contado (Destacado)
      doc.setTextColor(224, 33, 39); // Rojo
      doc.setFont('helvetica', 'bold');
      doc.text('Contado / Débito / Transferencia:', leftColX, py);
      doc.text(formatPrecio(contado), rightColX, py, { align: 'right' });
      py += 14;

      // Cuotas
      doc.setTextColor(60);
      doc.setFont('helvetica', 'normal');

      doc.text('1 Cuota (Lista):', leftColX, py);
      doc.text(formatPrecio(unoCuota), rightColX, py, { align: 'right' });
      py += 12;

      doc.text('3 Cuotas s/interés:', leftColX, py);
      doc.text(formatPrecio(tresTotal), rightColX, py, { align: 'right' });
      py += 12;

      doc.text('6 Cuotas Fijas:', leftColX, py);
      doc.text(`${formatPrecio(seisTotal)}  (${formatPrecio(Math.ceil(seisTotal / 6))}/mes)`, rightColX, py, { align: 'right' });
      py += 12;

      doc.text('12 Cuotas Fijas:', leftColX, py);
      doc.text(`${formatPrecio(doceTotal)}  (${formatPrecio(Math.ceil(doceTotal / 12))}/mes)`, rightColX, py, { align: 'right' });


      // --- Footer y Contacto ---
      const footerY = pageHeight - 80; // Adjusted for A5

      // Línea separadora
      doc.setDrawColor(220);
      doc.line(margin, footerY, pageWidth - margin, footerY);

      // QR Code (WhatsApp)
      const qrSize = 50; // Smaller QR
      const qrY = footerY + 10;
      try {
        // QR apuntando al WhatsApp de MicroHouse
        const mensaje = `Hola MicroHouse, quiero consultar por el presupuesto de ${modeloSeleccionado?.nombre || 'PC'}`;
        const whatsappUrl = `https://wa.me/5492915764388?text=${encodeURIComponent(mensaje)}`;
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(whatsappUrl)}`;

        const qrResp = await fetch(qrUrl);
        const qrBlob = await qrResp.blob();
        const qrDataUrl: string = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(qrBlob);
        });
        doc.addImage(qrDataUrl, 'PNG', margin, qrY, qrSize, qrSize);
      } catch (e) {
        console.error('Error QR', e);
      }

      // Info Sucursales y Contacto
      const textX = margin + qrSize + 15;
      let textY = qrY + 8;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(30);
      doc.text('Nuestras Sucursales', textX, textY);

      textY += 10;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6); // Smaller font for address
      doc.setTextColor(80);
      doc.text('• Alvarado 38', textX, textY); textY += 8;
      doc.text('• Belgrano 118', textX, textY); textY += 8;
      doc.text('• Maipú 1599', textX, textY);

      // Contacto a la derecha del footer
      const contactX = pageWidth - margin;
      let contactY = qrY + 8;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(30);
      doc.text('Contactanos', contactX, contactY, { align: 'right' });

      contactY += 10;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(80);
      doc.text('WhatsApp: 291 576-4388', contactX, contactY, { align: 'right' }); contactY += 8;
      doc.text('administracion@microhouse.com.ar', contactX, contactY, { align: 'right' }); contactY += 8;
      doc.text('www.microhouse.com.ar', contactX, contactY, { align: 'right' });

      // Disclaimer final
      doc.setFontSize(5);
      doc.setTextColor(150);
      doc.text('Presupuesto válido por 48hs. Sujeto a disponibilidad de stock.', pageWidth / 2, pageHeight - 10, { align: 'center' });

      // Guardar PDF
      const pad = (n: number) => n.toString().padStart(2, '0');
      const name = `Presupuesto-MicroHouse-${fecha.getFullYear()}${pad(fecha.getMonth() + 1)}${pad(fecha.getDate())}.pdf`;
      doc.save(name);

    } catch (e) {
      console.error(e);
      alert('No se pudo generar el PDF. Por favor intentá nuevamente.');
    }
  };

  const handleCompartirWhatsApp = () => {
    const mensaje = `🖥️ *Cotización PC - MicroHouse*\n\n*Modelo:* ${modeloSeleccionado?.nombre}\n*Total:* ${formatPrecio(total)}\n\n¡Consultá disponibilidad!`;
    const url = `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  };

  // Helper function needs to be available for MobileSummary too if we pass it, 
  // or we can just pass the function itself if it's inside the component scope (which it is).

  const getComponentIcon = (tipo: string) => {
    switch (tipo) {
      case 'procesador': return <Cpu className="h-3 w-3" />;
      case 'placamadre': return <Cpu className="h-3 w-3" />;
      case 'ram': return <MemoryStick className="h-3 w-3" />;
      case 'almacenamiento': return <HardDrive className="h-3 w-3" />;
      case 'gpu': return <MonitorUp className="h-3 w-3" />;
      case 'fuente': return <Zap className="h-3 w-3" />;
      case 'gabinete': return <Box className="h-3 w-3" />;
      case 'monitor': return <MonitorUp className="h-3 w-3" />;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      {/* Stepper */}
      <Stepper pasoActual={pasoActual} />

      <div className="flex flex-1 overflow-hidden flex-col md:flex-row pb-16 md:pb-0">
        {/* Panel Lateral Izquierdo - Resumen (Desktop Only) */}
        <div className="hidden md:flex w-full md:w-80 bg-white/95 backdrop-blur-sm shadow-xl md:border-r border-slate-200/50 flex-col md:max-h-full md:overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-[#E02127] to-[#0D1A4B]">
            <img src="https://wckxhidltmnvpbrswnmz.supabase.co/storage/v1/object/public/componentes/branding/microhouse-logo.png" alt="MicroHouse" className="h-8 w-auto object-contain" loading="eager" />
            <p className="text-[9px] text-white/90 mt-0.5">
              {pasoActual === 'modelo' && 'Paso 1: Elegí tu modelo base'}
              {pasoActual === 'mejoras' && 'Paso 2: Personalizá tu PC'}
              {pasoActual === 'gabinete' && 'Paso 3: Elegí tu Gabinete'}
              {pasoActual === 'fuente' && 'Paso 4: Seleccioná Fuente'}
              {pasoActual === 'monitor' && 'Paso 5: Sumá un Monitor (opcional)'}
              {pasoActual === 'resumen' && 'Resumen Final'}
            </p>
          </div>

          {/* Resumen de Componentes */}
          <div className="flex-1 overflow-y-auto px-4 py-3 max-h-[42vh] md:max-h-none">
            <h3 className="text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">Tu Configuración</h3>

            {modeloSeleccionado ? (
              <>
                <div className="mb-3 px-3 py-2 bg-gradient-to-r from-[#E02127] to-[#0D1A4B] rounded-lg shadow-sm animate-in slide-in-from-left duration-500">
                  <p className="text-[11px] font-semibold text-white">{modeloSeleccionado.nombre}</p>
                </div>

                <div className="space-y-1.5">
                  {componentesDetalle.map(({ tipo, componente }, index) => (
                    <div
                      key={tipo}
                      className="bg-slate-50/70 rounded-md px-2.5 py-1.5 border border-slate-200/50 hover:bg-slate-100 hover:scale-[1.02] transition-all duration-300 animate-in slide-in-from-left"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <div className="text-[#E02127]">
                          {getComponentIcon(tipo)}
                        </div>
                        <p className="text-[9px] text-slate-500 uppercase font-medium tracking-wide">
                          {tipo === 'procesador' && 'Procesador'}
                          {tipo === 'placamadre' && 'Placa Madre'}
                          {tipo === 'ram' && 'Memoria RAM'}
                          {tipo === 'almacenamiento' && 'Almacenamiento'}
                          {tipo === 'gpu' && 'GPU'}
                          {tipo === 'fuente' && 'Fuente'}
                          {tipo === 'gabinete' && 'Gabinete'}
                          {tipo === 'monitor' && 'Monitor'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {componente?.imagenUrl ? (
                          <img
                            src={componente.imagenUrl}
                            alt={`${componente?.marca || ''} ${componente?.modelo || ''}`}
                            loading="lazy"
                            className="w-6 h-6 rounded object-cover border border-slate-200"
                          />
                        ) : null}
                        <p className="font-medium text-slate-800 text-[11px] truncate leading-tight">
                          {componente?.marca} {componente?.modelo}
                        </p>
                      </div>
                      <p className="text-[#E02127] font-semibold text-[11px] mt-0.5">
                        {formatPrecio(Math.ceil((((componente ? (remotePrices[componente.id] ?? componente.precio) : 0) || 0) * 1.10)))}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-6">
                <div className="w-12 h-12 bg-slate-100 rounded-full mx-auto mb-2 flex items-center justify-center">
                  <Cpu className="h-6 w-6 text-slate-400" />
                </div>
                <p className="text-slate-500 text-[10px]">Seleccioná un modelo para comenzar</p>
              </div>
            )}
          </div>

          {/* Resumen de Precios */}
          {modeloSeleccionado && (
            <div className="px-5 py-4 border-t border-slate-200/50 bg-gradient-to-br from-slate-50 to-blue-50/30 animate-in slide-in-from-bottom duration-700">
              <div className="space-y-2.5">
                <div className="flex justify-between items-center hover:scale-105 transition-transform duration-200">
                  <span className="text-sm font-bold text-slate-900">TOTAL</span>
                  <span className="text-2xl font-bold bg-gradient-to-r from-[#E02127] to-[#0D1A4B] bg-clip-text text-transparent animate-pulse">
                    {formatPrecio(Math.ceil(total * 1.10))}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col overflow-hidden relative z-0">
          {/* Paso 1: Carrusel de Modelos */}
          {pasoActual === 'modelo' && (
            <div className="flex-1 flex flex-col items-center justify-center px-4 md:px-6 py-6 overflow-visible w-full">
              <div className="relative w-full max-w-7xl" style={{ minHeight: maxCardHeight ? `${maxCardHeight + 40}px` : '550px' }}>
                <div className="absolute inset-0 overflow-hidden">
                  <div
                    className="flex h-full items-center"
                    style={{
                      '--card-width': 'min(380px, 85vw)',
                      transform: `translateX(calc(50% - (${currentModelIndex} + 0.5) * var(--card-width)))`,
                      transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                    } as React.CSSProperties}
                    onTouchStart={onTouchStart}
                    onTouchMove={onTouchMove}
                    onTouchEnd={onTouchEnd}
                  >
                    {modelosOrdenados.map((modelo, index) => {
                      const isCurrent = index === currentModelIndex;
                      return (
                        <div
                          key={modelo.id}
                          className="flex-shrink-0 px-4"
                          style={{ width: 'var(--card-width)' }}
                          onClick={() => {
                            if (!isCurrent) {
                              setCurrentModelIndex(index);
                            }
                          }}
                        >
                          <div
                            ref={el => { cardRefs.current[index] = el }}
                            className={`bg-white rounded-2xl text-center w-full relative transition-all duration-500 ease-in-out flex flex-col ${isCurrent ? 'shadow-[0_0_0_3px_rgba(224,33,39,0.3),0_20px_60px_-10px_rgba(224,33,39,0.4)]' : 'shadow-2xl scale-80 opacity-60'
                              }`}
                            style={{
                              cursor: 'pointer',
                              minHeight: maxCardHeight ? `${maxCardHeight}px` : undefined
                            }}
                          >
                            <div className="p-6 flex flex-col flex-grow">
                              <div className="mb-3">
                                {modelo.imagenUrl && (
                                  <div className="mx-auto mb-3 rounded-xl overflow-hidden shadow-lg w-full h-40">
                                    <img src={modelo.imagenUrl} alt={modelo.nombre} loading="lazy" className="w-full h-full object-cover" />
                                  </div>
                                )}
                              </div>
                              <h2 className="text-lg font-bold text-slate-900 mb-2 truncate">{modelo.nombre}</h2>
                              <p className="text-slate-600 mb-3 text-xs leading-relaxed px-2 flex-grow">{modelo.descripcion}</p>
                              <div className="flex flex-wrap justify-center gap-1 mb-3">
                                {modelo.usoRecomendado?.slice(0, 3).map((tag) => (
                                  <span key={tag} className="px-2 py-1 rounded-full bg-slate-100 text-[10px] text-slate-600 border border-slate-200">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-left text-[10px] text-slate-600 mb-3">
                                <div className="flex items-center gap-1">
                                  <Cpu className="h-3 w-3 text-slate-500" />
                                  <span className="font-semibold text-slate-800 truncate">
                                    {modelo.componentes.procesador ? (componentes.find(c => c.id === modelo.componentes.procesador)?.modelo || 'CPU') : 'CPU'}
                                  </span>
                                </div>
                                {modelo.componentes.gpu && (
                                  <div className="flex items-center gap-1">
                                    <MonitorUp className="h-3 w-3 text-slate-500" />
                                    <span className="font-semibold text-slate-800 truncate">
                                      {componentes.find(c => c.id === modelo.componentes.gpu)?.modelo || 'GPU dedicada'}
                                    </span>
                                  </div>
                                )}
                                <div className="flex items-center gap-1">
                                  <MemoryStick className="h-3 w-3 text-slate-500" />
                                  <span className="truncate">
                                    {(() => {
                                      const ram = componentes.find(c => c.id === modelo.componentes.ram);
                                      return ram ? `${ram.marca} ${ram.modelo}` : 'RAM';
                                    })()}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <HardDrive className="h-3 w-3 text-slate-500" />
                                  <span className="truncate">
                                    {(() => {
                                      const storage = componentes.find(c => c.id === modelo.componentes.almacenamiento);
                                      return storage ? `${storage.marca} ${storage.modelo}` : 'Almacenamiento';
                                    })()}
                                  </span>
                                </div>
                              </div>

                              <div className="mb-4 mt-auto px-3 py-2 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200/50 shadow-sm">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-[9px] text-slate-500 uppercase font-semibold tracking-wider mb-0.5">Contado / débito</p>
                                    <p className="text-lg font-bold text-slate-900">{formatPrecio(modelo.precioBase)}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-[9px] text-slate-500 uppercase font-semibold tracking-wider mb-0.5">1 cuota</p>
                                    <p className="text-lg font-bold bg-gradient-to-r from-[#E02127] to-[#0D1A4B] bg-clip-text text-transparent">
                                      {formatPrecio(Math.ceil(modelo.precioBase * 1.10))}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <div>
                                <button
                                  onClick={() => handleSeleccionarModelo(modelo)}
                                  className={`w-full px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg transition-opacity duration-300 ${isCurrent ? 'opacity-100 bg-gradient-to-r from-[#E02127] to-[#0D1A4B] text-white' : 'opacity-0 pointer-events-none'
                                    }`}
                                >
                                  <span className="flex items-center justify-center gap-2">
                                    Seleccionar este Modelo
                                    <ArrowRight className="h-3.5 w-3.5" />
                                  </span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={prevModel}
                  disabled={isTransitioning}
                  className="absolute left-8 top-1/2 -translate-y-1/2 z-30 bg-white/95 backdrop-blur-md rounded-full p-3 shadow-xl border-2 border-[#E02127]/30"
                >
                  <ChevronLeft className="h-5 w-5 text-[#E02127]" />
                </button>
                <button
                  onClick={nextModel}
                  disabled={isTransitioning}
                  className="absolute right-8 top-1/2 -translate-y-1/2 z-30 bg-white/95 backdrop-blur-md rounded-full p-3 shadow-xl border-2 border-[#E02127]/30"
                >
                  <ChevronRight className="h-5 w-5 text-[#E02127]" />
                </button>

                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex gap-2">
                  {modelosOrdenados.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentModelIndex(index)}
                      disabled={isTransitioning}
                      className={`h-2 rounded-full transition-all duration-500 ease-out ${index === currentModelIndex ? 'w-10 bg-gradient-to-r from-[#E02127] to-[#0D1A4B] shadow-lg' : 'w-2 bg-slate-300'
                        }`}
                      aria-label={`Ver modelo ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Paso 2: Mejoras Opcionales */}
          {pasoActual === 'mejoras' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Mejoras Opcionales - Colapsable */}
              <div className={`bg-white/95 backdrop-blur-sm border-t border-slate-200/50 shadow-xl transition-all duration-300 overflow-hidden ${mejorasExpanded ? 'flex-1' : 'flex-none'
                }`}>
                {/* Header Colapsable */}
                <button
                  onClick={() => setMejorasExpanded(!mejorasExpanded)}
                  className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-slate-50/50 transition-all duration-300 group flex-shrink-0 hover:scale-[1.01]"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg shadow-sm group-hover:shadow-lg group-hover:scale-110 transition-all duration-300">
                      <Sparkles className="h-3.5 w-3.5 text-white group-hover:rotate-12 transition-transform duration-300" />
                    </div>
                    <div className="text-left">
                      <h2 className="text-sm font-bold text-slate-800">Mejoras Opcionales</h2>
                      <p className="text-[10px] text-slate-500">Personalizá componentes individuales</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!mejorasExpanded && modeloSeleccionado && (
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[9px] font-semibold rounded-full border border-amber-200">
                        Toca para personalizar
                      </span>
                    )}
                    <ChevronDown
                      className={`h-4 w-4 text-slate-500 transition-transform duration-300 ${mejorasExpanded ? 'rotate-180' : ''
                        }`}
                    />
                  </div>
                </button>

                {/* Contenido Expandible */}
                {mejorasExpanded && modeloSeleccionado && (
                  <div className="h-full overflow-y-auto overflow-x-hidden px-4 py-3 animate-in fade-in slide-in-from-top-4 duration-500" style={{ maxHeight: 'calc(100vh - 140px)', minHeight: '60vh' }}>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Categoría: RAM */}
                      <div className="bg-gradient-to-br from-purple-50/50 to-pink-50/50 rounded-lg p-3 border border-purple-100 hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
                        <div className="flex items-center gap-1.5 mb-2.5">
                          <MemoryStick className="h-4 w-4 text-purple-600" />
                          <h3 className="text-xs font-bold text-slate-800">Memoria RAM</h3>
                          {placaActual?.especificaciones?.ram_tipo && (
                            <span className="px-2 py-0.5 bg-white text-purple-700 text-[9px] font-semibold rounded-full border border-purple-200">
                              Compatible: {placaActual.especificaciones.ram_tipo}
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {componentes
                            .filter((c) => c.tipo === 'RAM')
                            .map((comp) => (
                              (() => {
                                const ramTipoActual = placaActual?.especificaciones?.ram_tipo;
                                const compatible = !ramTipoActual || comp.especificaciones?.tipo === ramTipoActual;
                                return (
                                  <button
                                    key={comp.id}
                                    className={`relative p-2.5 rounded-lg text-left transition-all duration-300 hover:scale-105 active:scale-95 ${componentesSeleccionados?.ram === comp.id
                                      ? 'bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg ring-2 ring-purple-300 scale-105'
                                      : `bg-white border ${compatible ? 'border-slate-200 hover:border-purple-300 hover:shadow-md' : 'border-red-200'}`
                                      }`}
                                    onClick={() => {
                                      if (!compatible) return;
                                      cambiarComponente('RAM', comp.id);
                                    }}
                                    disabled={!compatible}
                                  >
                                    {comp.imagenUrl && (
                                      <img src={comp.imagenUrl} alt={`${comp.marca} ${comp.modelo}`} className="w-full h-24 object-cover rounded mb-2 border" loading="lazy" />
                                    )}
                                    {componentesSeleccionados?.ram === comp.id && (
                                      <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow animate-in zoom-in duration-300">
                                        <Check className="h-2.5 w-2.5 text-purple-600" />
                                      </div>
                                    )}
                                    {!compatible && (
                                      <div className="absolute -top-1 -left-1 bg-red-500 text-white text-[8px] font-semibold px-1.5 py-0.5 rounded-full shadow">
                                        No {ramTipoActual}
                                      </div>
                                    )}
                                    <p className={`font-semibold text-[10px] truncate ${componentesSeleccionados?.ram === comp.id ? 'text-white' : 'text-slate-800'
                                      }`}>
                                      {comp.marca}
                                    </p>
                                    <p className={`text-[11px] truncate font-medium ${componentesSeleccionados?.ram === comp.id ? 'text-white' : 'text-slate-900'
                                      }`}>
                                      {comp.modelo}
                                    </p>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {comp.especificaciones.capacidad && (
                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold ${componentesSeleccionados?.ram === comp.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'}`}>
                                          {comp.especificaciones.capacidad}
                                        </span>
                                      )}
                                      {comp.especificaciones.tipo && (
                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold ${componentesSeleccionados?.ram === comp.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'}`}>
                                          {comp.especificaciones.tipo}
                                        </span>
                                      )}
                                      {comp.especificaciones.velocidad_mhz && (
                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold ${componentesSeleccionados?.ram === comp.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'}`}>
                                          {comp.especificaciones.velocidad_mhz} MHz
                                        </span>
                                      )}
                                    </div>
                                    <p className={`font-bold text-[11px] mt-1.5 ${componentesSeleccionados?.ram === comp.id ? 'text-white' : 'text-purple-600'
                                      }`}>
                                      {componentesSeleccionados?.ram === comp.id ? 'Seleccionado' : (
                                        (() => {
                                          const selectedComp = componentes.find(c => c.id === componentesSeleccionados?.ram);
                                          const currentCompPrice = selectedComp ? (remotePrices[selectedComp.id] ?? selectedComp.precio) : 0;
                                          const diff = (remotePrices[comp.id] ?? comp.precio) - currentCompPrice;
                                          if (componentesSeleccionados?.ram === comp.id) return 'Seleccionado';
                                          if (diff === 0) return '$0';
                                          return (diff > 0 ? '+' : '-') + formatPrecio(Math.abs(diff));
                                        })()
                                      )}
                                    </p>
                                  </button>
                                );
                              })()
                            ))}
                        </div>
                      </div>

                      {/* Categoría: Almacenamiento */}
                      <div className="bg-gradient-to-br from-emerald-50/50 to-teal-50/50 rounded-lg p-3 border border-emerald-100 hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
                        <div className="flex items-center gap-1.5 mb-2.5">
                          <HardDrive className="h-4 w-4 text-emerald-600" />
                          <h3 className="text-xs font-bold text-slate-800">Almacenamiento</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {componentes
                            .filter((c) => c.tipo === 'ALMACENAMIENTO')
                            .map((comp) => {
                              const interfazPlaca = placaActual?.especificaciones?.interfaz || placaActual?.especificaciones?.almacenamiento_interfaz;
                              const compatible = !interfazPlaca || comp.especificaciones?.interfaz === interfazPlaca || comp.especificaciones?.tipo === interfazPlaca;
                              return (
                                <button
                                  key={comp.id}
                                  className={`relative p-2.5 rounded-lg text-left transition-all duration-300 hover:scale-105 active:scale-95 ${componentesSeleccionados?.almacenamiento === comp.id
                                    ? 'bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg ring-2 ring-emerald-300 scale-105'
                                    : `bg-white border ${compatible ? 'border-slate-200 hover:border-emerald-300 hover:shadow-md' : 'border-red-200'}`
                                    }`}
                                  onClick={() => {
                                    if (!compatible) return;
                                    cambiarComponente('ALMACENAMIENTO', comp.id);
                                  }}
                                  disabled={!compatible}
                                >
                                  {comp.imagenUrl && (
                                    <img src={comp.imagenUrl} alt={`${comp.marca} ${comp.modelo}`} className="w-full h-24 object-cover rounded mb-2 border" loading="lazy" />
                                  )}
                                  {componentesSeleccionados?.almacenamiento === comp.id && (
                                    <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow animate-in zoom-in duration-300">
                                      <Check className="h-2.5 w-2.5 text-emerald-600" />
                                    </div>
                                  )}
                                  <p className={`font-semibold text-[10px] truncate ${componentesSeleccionados?.almacenamiento === comp.id ? 'text-white' : 'text-slate-800'
                                    }`}>
                                    {comp.marca}
                                  </p>
                                  <p className={`text-[11px] truncate font-medium ${componentesSeleccionados?.almacenamiento === comp.id ? 'text-white' : 'text-slate-900'
                                    }`}>
                                    {comp.modelo}
                                  </p>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {comp.especificaciones.tipo && (
                                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold ${componentesSeleccionados?.almacenamiento === comp.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'}`}>
                                        {comp.especificaciones.tipo}
                                      </span>
                                    )}
                                    {comp.especificaciones.capacidad && (
                                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold ${componentesSeleccionados?.almacenamiento === comp.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'}`}>
                                        {comp.especificaciones.capacidad}
                                      </span>
                                    )}
                                    {comp.especificaciones.interfaz && (
                                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold ${componentesSeleccionados?.almacenamiento === comp.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'}`}>
                                        {comp.especificaciones.interfaz}
                                      </span>
                                    )}
                                    {!compatible && interfazPlaca && (
                                      <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-red-500 text-white">
                                        No {interfazPlaca}
                                      </span>
                                    )}
                                  </div>
                                  <p className={`font-bold text-[11px] mt-1.5 ${componentesSeleccionados?.almacenamiento === comp.id ? 'text-white' : 'text-emerald-600'
                                    }`}>
                                    {componentesSeleccionados?.almacenamiento === comp.id ? 'Seleccionado' : (
                                      (() => {
                                        const selectedComp = componentes.find(c => c.id === componentesSeleccionados?.almacenamiento);
                                        const currentCompPrice = selectedComp ? (remotePrices[selectedComp.id] ?? selectedComp.precio) : 0;
                                        const diff = (remotePrices[comp.id] ?? comp.precio) - currentCompPrice;
                                        if (diff === 0) return '$0';
                                        return (diff > 0 ? '+' : '-') + formatPrecio(Math.abs(diff));
                                      })()
                                    )}
                                  </p>
                                </button>
                              );
                            })}
                        </div>
                      </div>

                      {/* Categoría: GPU - Opcional */}
                      <div className="bg-gradient-to-br from-orange-50/50 to-red-50/50 rounded-lg p-3 border border-orange-100 xl:col-span-2 hover:shadow-lg hover:scale-[1.01] transition-all duration-300">
                        <div className="flex items-center gap-1.5 mb-2.5">
                          <MonitorUp className="h-4 w-4 text-orange-600" />
                          <h3 className="text-xs font-bold text-slate-800">Tarjeta Gráfica</h3>
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[9px] font-semibold rounded-full border border-amber-200">
                            Opcional - Mejora el rendimiento gráfico
                          </span>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                          {componentes
                            .filter((c) => c.tipo === 'GPU')
                            .map((comp) => {
                              const esRecomendada = modeloSeleccionado?.componentes?.gpu === comp.id;
                              return (
                                <button
                                  key={comp.id}
                                  className={`relative p-2.5 rounded-lg text-left transition-all duration-300 hover:scale-105 active:scale-95 ${componentesSeleccionados?.gpu === comp.id
                                    ? 'bg-gradient-to-br from-orange-500 to-red-500 shadow-lg ring-2 ring-orange-300 scale-105'
                                    : 'bg-white border border-slate-200 hover:border-orange-300 hover:shadow-md'
                                    }`}
                                  onClick={() => cambiarComponente('GPU', comp.id)}
                                >
                                  {comp.imagenUrl && (
                                    <img src={comp.imagenUrl} alt={`${comp.marca} ${comp.modelo}`} className="w-full h-24 object-cover rounded mb-2 border" loading="lazy" />
                                  )}
                                  {componentesSeleccionados?.gpu === comp.id && (
                                    <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow animate-in zoom-in duration-300">
                                      <Check className="h-2.5 w-2.5 text-orange-600" />
                                    </div>
                                  )}
                                  {modeloSeleccionado?.componentes?.gpu === comp.id && (
                                    <div className="absolute -top-1 -left-1 bg-amber-500 text-white text-[8px] font-semibold px-1.5 py-0.5 rounded-full shadow">
                                      Recomendada
                                    </div>
                                  )}
                                  {esRecomendada && (
                                    <div className="absolute -top-1 -left-1 bg-amber-500 text-white text-[8px] font-semibold px-1.5 py-0.5 rounded-full shadow">
                                      Recomendada
                                    </div>
                                  )}
                                  <p className={`font-semibold text-[10px] truncate ${componentesSeleccionados?.gpu === comp.id ? 'text-white' : 'text-slate-800'
                                    }`}>
                                    {comp.marca}
                                  </p>
                                  <p className={`text-[11px] truncate font-medium ${componentesSeleccionados?.gpu === comp.id ? 'text-white' : 'text-slate-900'
                                    }`}>
                                    {comp.modelo}
                                  </p>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {comp.especificaciones.vram_gb && (
                                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold ${componentesSeleccionados?.gpu === comp.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'}`}>
                                        {comp.especificaciones.vram_gb} GB
                                      </span>
                                    )}
                                    {comp.especificaciones.tdp_w && (
                                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold ${componentesSeleccionados?.gpu === comp.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'}`}>
                                        {comp.especificaciones.tdp_w} W
                                      </span>
                                    )}
                                    {comp.especificaciones.min_psu_w && (
                                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold ${componentesSeleccionados?.gpu === comp.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'}`}>
                                        PSU {comp.especificaciones.min_psu_w} W
                                      </span>
                                    )}
                                    {comp.especificaciones.boost_clock_mhz && (
                                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold ${componentesSeleccionados?.gpu === comp.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'}`}>
                                        {comp.especificaciones.boost_clock_mhz} MHz
                                      </span>
                                    )}
                                    {comp.especificaciones.tipo_memoria && (
                                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold ${componentesSeleccionados?.gpu === comp.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'}`}>
                                        {comp.especificaciones.tipo_memoria}
                                      </span>
                                    )}
                                  </div>
                                  <p className={`font-bold text-[11px] mt-1.5 ${componentesSeleccionados?.gpu === comp.id ? 'text-white' : 'text-orange-600'
                                    }`}>
                                    {componentesSeleccionados?.gpu === comp.id ? 'Seleccionado' : (
                                      (() => {
                                        const selectedComp = componentes.find(c => c.id === componentesSeleccionados?.gpu);
                                        const currentCompPrice = selectedComp ? (remotePrices[selectedComp.id] ?? selectedComp.precio) : 0;
                                        const diff = (remotePrices[comp.id] ?? comp.precio) - currentCompPrice;
                                        if (diff === 0) return '$0';
                                        return (diff > 0 ? '+' : '-') + formatPrecio(Math.abs(diff));
                                      })()
                                    )}
                                  </p>
                                </button>
                              );
                            })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Mensaje cuando no hay modelo seleccionado */}
                {mejorasExpanded && !modeloSeleccionado && (
                  <div className="flex flex-col items-center justify-center py-8 px-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-xl mb-2 flex items-center justify-center">
                      <Cpu className="h-6 w-6 text-slate-400" />
                    </div>
                    <p className="text-slate-500 text-[10px] text-center">Primero seleccioná un modelo base para poder personalizarlo</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Paso 3: Gabinete */}
          {pasoActual === 'gabinete' && <GabineteSelector gabinetes={gabinetes} />}

          {/* Paso 4: Fuente */}
          {pasoActual === 'fuente' && <FuenteSelector fuentes={fuentes} />}

          {/* Paso 5: Monitor (opcional) */}
          {pasoActual === 'monitor' && <MonitorSelector />}

          {/* Paso 6: Resumen */}
          {pasoActual === 'resumen' && (
            <div className="flex-1 overflow-y-auto px-6 py-6 bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
              <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-6 animate-in fade-in slide-in-from-top duration-700">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full mb-3 shadow-lg">
                    <Check className="h-8 w-8 text-white" />
                  </div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-[#E02127] to-[#0D1A4B] bg-clip-text text-transparent mb-2">
                    ¡Configuración Lista!
                  </h1>
                  <p className="text-slate-600 text-sm">Tu PC personalizada está lista para ser armada</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Columna Izquierda - Configuración */}
                  <div className="lg:col-span-2 space-y-4">
                    {/* Modelo Base */}
                    <div className="bg-white rounded-xl shadow-lg p-6 animate-in fade-in slide-in-from-left duration-500">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                          <span className="text-2xl">🖥️</span>
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-slate-900">{modeloSeleccionado?.nombre}</h2>
                          <p className="text-xs text-slate-500">Modelo base seleccionado</p>
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed">{modeloSeleccionado?.descripcion}</p>
                    </div>

                    {/* Componentes */}
                    <div className="bg-white rounded-xl shadow-lg p-6 animate-in fade-in slide-in-from-left duration-500 delay-100">
                      <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Cpu className="h-5 w-5 text-[#E02127]" />
                        Componentes de tu PC
                      </h3>

                      <div className="space-y-3">
                        {componentesDetalle.map(({ tipo, componente }, index) => (
                          <div
                            key={tipo}
                            className="group flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-all duration-300 border border-slate-100 hover:border-blue-200 hover:shadow-sm"
                            style={{ animationDelay: `${index * 50}ms` }}
                          >
                            <div className="flex items-center gap-3 flex-1">
                              {componente?.imagenUrl ? (
                                <img
                                  src={componente.imagenUrl}
                                  alt={`${componente.marca} ${componente.modelo}`}
                                  loading="lazy"
                                  className="flex-shrink-0 w-10 h-10 rounded object-cover border border-slate-200"
                                />
                              ) : (
                                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                  {getComponentIcon(tipo)}
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-wide">
                                  {tipo === 'procesador' && 'Procesador'}
                                  {tipo === 'placaMadre' && 'Placa Madre'}
                                  {tipo === 'ram' && 'Memoria RAM'}
                                  {tipo === 'almacenamiento' && 'Almacenamiento'}
                                  {tipo === 'gpu' && 'Tarjeta Gráfica'}
                                  {tipo === 'fuente' && 'Fuente de Poder'}
                                  {tipo === 'gabinete' && 'Gabinete'}
                                  {tipo === 'monitor' && 'Monitor'}
                                </p>
                                <p className="font-semibold text-slate-900 text-sm truncate">
                                  {componente?.marca} {componente?.modelo}
                                </p>
                                {componente?.especificaciones && (
                                  <p className="text-xs text-slate-500 truncate">
                                    {tipo === 'ram' && componente.especificaciones.capacidad}
                                    {tipo === 'almacenamiento' && `${componente.especificaciones.capacidad} ${componente.especificaciones.tipo}`}
                                    {tipo === 'gpu' && componente.especificaciones.vram}
                                    {tipo === 'fuente' && `${componente.especificaciones.potencia} ${componente.especificaciones.certificacion}`}
                                    {tipo === 'gabinete' && componente.especificaciones.formato}
                                    {tipo === 'monitor' && (componente.especificaciones.resolucion || componente.especificaciones.tamano || componente.especificaciones.tamaño)}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-[#E02127] text-sm">
                                {formatPrecio(Math.ceil((((componente ? (remotePrices[componente.id] ?? componente.precio) : 0) || 0) * 1.10)))}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Info Adicional */}
                    <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-left duration-500 delay-200">
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Check className="h-5 w-5 text-green-600" />
                          <h4 className="font-bold text-green-900 text-sm">Garantía Incluida</h4>
                        </div>
                        <p className="text-xs text-green-700">12 meses de garantía en todos los componentes</p>
                      </div>
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Box className="h-5 w-5 text-[#E02127]" />
                          <h4 className="font-bold text-blue-900 text-sm">Armado Profesional</h4>
                        </div>
                        <p className="text-xs text-blue-700">Probado y optimizado antes de entrega</p>
                      </div>
                    </div>
                  </div>

                  {/* Columna Derecha - Resumen y Acciones */}
                  <div className="space-y-4">
                    {/* Resumen de Precios */}
                    <div className="bg-white rounded-xl shadow-lg p-6 sticky top-4 animate-in fade-in slide-in-from-right duration-500">
                      <h3 className="text-lg font-bold text-slate-900 mb-4">Resumen de Compra</h3>

                      <div className="space-y-3 mb-4">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-bold text-slate-900">Total</span>
                          <div className="text-right">
                            <p className="text-2xl font-bold bg-gradient-to-r from-[#E02127] to-[#0D1A4B] bg-clip-text text-transparent">
                              {formatPrecio(Math.ceil(total * 1.10))}
                            </p>
                            <p className="text-xs text-slate-500">Precio final</p>
                          </div>
                        </div>
                      </div>

                      {/* Opciones de pago */}
                      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 mb-4 border border-purple-200">
                        <p className="text-xs font-bold text-purple-900 mb-3 flex items-center gap-2">
                          💳 Opciones de pago
                        </p>
                        <div className="space-y-2">
                          {/* Contado / Débito / Transferencia - 25% OFF */}
                          <div className="bg-white rounded-lg p-2.5 border border-emerald-200">
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-emerald-700 font-semibold">Contado / Débito / Transferencia</span>
                              <span className="inline-flex items-center px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[9px] font-bold">Mejor precio</span>
                            </div>
                            <p className="text-base font-bold text-emerald-900 mt-1">
                              {formatPrecio(Math.ceil(total))} <span className="text-[10px] font-normal">final</span>
                            </p>
                          </div>

                          {/* 1 cuota (sin interés) */}
                          <div className="bg-white/70 rounded-lg p-2.5 border border-purple-200/50">
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-purple-700 font-semibold">1 cuota</span>
                              <span className="inline-flex items-center px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[9px] font-bold">SIN INTERÉS</span>
                            </div>
                            <p className="text-base font-bold text-purple-900 mt-1">
                              {formatPrecio(Math.ceil(total * 1.10))} <span className="text-xs font-normal">/única</span>
                            </p>
                            <p className="text-[10px] text-slate-500">Total: {formatPrecio(Math.ceil(total * 1.10))}</p>
                          </div>

                          {/* 3 cuotas (sin interés) */}
                          <div className="bg-white/70 rounded-lg p-2.5 border border-purple-200/50">
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-purple-700 font-semibold">3 cuotas</span>
                              <span className="inline-flex items-center px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[9px] font-bold">SIN INTERÉS</span>
                            </div>
                            <p className="text-base font-bold text-purple-900 mt-1">
                              {formatPrecio(Math.ceil(total * 1.10 / 3))} <span className="text-xs font-normal">/mes</span>
                            </p>
                            <p className="text-[10px] text-slate-500">Total: {formatPrecio(Math.ceil(total * 1.10))}</p>
                          </div>

                          {/* 6 cuotas */}
                          <div className="bg-white/70 rounded-lg p-2.5 border border-purple-200/50">
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-purple-700 font-semibold">6 cuotas</span>
                            </div>
                            <p className="text-base font-bold text-purple-900 mt-1">
                              {formatPrecio(Math.ceil(total * 1.2603 / 6))} <span className="text-xs font-normal">/mes</span>
                            </p>
                            <p className="text-[10px] text-slate-500">Total: {formatPrecio(Math.ceil(total * 1.2603))}</p>
                          </div>

                          {/* 9 cuotas */}
                          <div className="bg-white/70 rounded-lg p-2.5 border border-purple-200/50">
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-purple-700 font-semibold">9 cuotas</span>
                            </div>
                            <p className="text-base font-bold text-purple-900 mt-1">
                              {formatPrecio(Math.ceil(total * 1.3805 / 9))} <span className="text-xs font-normal">/mes</span>
                            </p>
                            <p className="text-[10px] text-slate-500">Total: {formatPrecio(Math.ceil(total * 1.3805))}</p>
                          </div>

                          {/* 12 cuotas */}
                          <div className="bg-white/70 rounded-lg p-2.5 border border-purple-200/50">
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-purple-700 font-semibold">12 cuotas</span>
                            </div>
                            <p className="text-base font-bold text-purple-900 mt-1">
                              {formatPrecio(Math.ceil(total * 1.51 / 12))} <span className="text-xs font-normal">/mes</span>
                            </p>
                            <p className="text-[10px] text-slate-500">Total: {formatPrecio(Math.ceil(total * 1.51))}</p>
                          </div>
                        </div>

                        <p className="text-[9px] text-purple-600 mt-2 text-center">
                          Precios de cuotas sin interés provistos por el proveedor. Descuento aplicable solo en contado/débito/transferencia.
                        </p>
                      </div>

                      {/* Botones de Acción */}
                      <div className="space-y-2">
                        <button
                          onClick={handleCompartirWhatsApp}
                          className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all text-sm font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transform duration-200 flex items-center justify-center gap-2"
                        >
                          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                          </svg>
                          Consultar por WhatsApp
                        </button>

                        <button
                          onClick={handleDescargarPDF}
                          className="w-full px-4 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-lg hover:from-red-600 hover:to-pink-700 transition-all text-sm font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transform duration-200 flex items-center justify-center gap-2"
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Descargar Cotización PDF
                        </button>

                        <button
                          onClick={() => {
                            if (confirm('¿Estás seguro de que querés empezar un nuevo presupuesto? Se perderán los cambios actuales.')) {
                              resetear();
                            }
                          }}
                          className="w-full px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-red-50 hover:text-red-600 transition-all text-sm font-semibold flex items-center justify-center gap-2"
                        >
                          <RotateCcw className="h-4 w-4" />
                          Nuevo Presupuesto
                        </button>
                      </div>

                      {/* Nota legal */}
                      <p className="text-[10px] text-slate-500 mt-4 text-center">
                        Los precios están sujetos a disponibilidad de stock y pueden variar sin previo aviso.
                      </p>
                    </div>

                    {/* Banner de soporte */}
                    <div className="bg-gradient-to-br from-[#E02127] to-[#0D1A4B] rounded-xl p-6 text-white animate-in fade-in slide-in-from-right duration-500 delay-100">
                      <h4 className="font-bold text-lg mb-2">¿Necesitás ayuda?</h4>
                      <p className="text-sm text-white/90 mb-4">
                        Nuestro equipo está disponible para asesorarte
                      </p>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                          </svg>
                          <span>Lun a Vie 9:00 - 18:00</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                          </svg>
                          <span>info@microhouse.com</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Botones de Navegación */}
        {pasoActual !== 'resumen' && (
          <div className="border-t border-slate-200 bg-white px-4 md:px-6 py-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="max-w-6xl mx-auto flex justify-between items-center">
              <button
                onClick={handleAnterior}
                disabled={pasoActual === 'modelo'}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${pasoActual === 'modelo'
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300 hover:scale-105 active:scale-95 hover:-translate-x-1'
                  }`}
              >
                <ArrowLeft className="h-4 w-4" />
                Anterior
              </button>

              <button
                onClick={handleSiguiente}
                disabled={!puedeAvanzar}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${puedeAvanzar
                  ? 'bg-gradient-to-r from-[#E02127] to-[#0D1A4B] text-white hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-2xl hover:scale-110 active:scale-95 hover:translate-x-1'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
              >
                {pasoActual === 'gabinete'
                  ? (gabineteIncluyeFuente ? 'Elegir Monitor' : 'Elegir Fuente')
                  : pasoActual === 'fuente'
                    ? 'Elegir Monitor'
                    : pasoActual === 'monitor'
                      ? 'Ver Resumen'
                      : 'Continuar'}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
      <MobileSummary
        modeloSeleccionado={modeloSeleccionado}
        componentesDetalle={componentesDetalle}
        total={total}
        remotePrices={remotePrices}
        getComponentIcon={getComponentIcon}
      />
    </div>
  );
}

