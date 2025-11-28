'use client';

import { useState, useMemo, useEffect, useRef, useLayoutEffect, useCallback } from 'react';
import { useCotizadorStore } from '@/store/cotizadorStore';
import { useModelosBase } from '@/lib/models';
import { useComponentes } from '@/lib/componentes';
import { formatPrecio } from '@/lib/utils';

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
  const componentes = useComponentes();


  const modelosOrdenados = useMemo(() => {
    const calculated = modelosBase.map(modelo => {
      // Calculate dynamic price summing components
      const compIds = [
        modelo.componentes.procesador,
        modelo.componentes.placaMadre,
        modelo.componentes.ram,
        modelo.componentes.almacenamiento,
        modelo.componentes.gpu,
        modelo.componentes.gabinete,
        modelo.componentes.fuente,
      ].filter(Boolean) as string[];

      const dynamicPrice = compIds.reduce((sum, id) => {
        const comp = componentes.find(c => c.id === id);
        if (!comp) return sum;
        return sum + (comp.precio || 0);
      }, 0);

      // If dynamic price is valid (>0), use it. Otherwise fallback to DB price.
      // We add a small buffer or fixed cost if needed? 
      // Usually models might have a base assembly fee or case/psu included in the static price but not in components list?
      // If the static price is 395k and components sum to 419k, clearly the components are more expensive.
      // If the static price was HIGHER, maybe it included the case.
      // Let's assume the dynamic sum is the truth.

      return {
        ...modelo,
        precioBase: dynamicPrice > 0 ? dynamicPrice : modelo.precioBase
      };
    });

    return calculated.sort((a, b) => a.precioBase - b.precioBase);
  }, [modelosBase, componentes]);
  const gabinetes = useMemo(() => componentes.filter(c => c.tipo === 'GABINETE'), [componentes]);
  const fuentes = useMemo(() => componentes.filter(c => c.tipo === 'FUENTE'), [componentes]);
  const [currentModelIndex, setCurrentModelIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [mejorasExpanded, setMejorasExpanded] = useState(pasoActual === 'mejoras');

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

  // Handle URL query params for pre-selecting model (from Wizard)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const modelSlug = params.get('model');
    const stepParam = params.get('step');
    const gpuParam = params.get('gpu');
    const caseParam = params.get('case');

    if (modelSlug && modelosBase.length > 0) {
      const foundModel = modelosBase.find(m => m.slug === modelSlug);
      if (foundModel) {
        setModeloBase(foundModel);

        // Apply overrides after a tick to ensure model is set
        setTimeout(() => {
          // 1. Case Override
          if (caseParam) {
            const availableCases = componentes.filter(c => c.tipo === 'GABINETE' && c.disponible);
            let targetCaseId = '';
            // Try direct ID match
            const directMatch = availableCases.find(c => c.id === caseParam);
            if (directMatch) targetCaseId = directMatch.id;

            if (targetCaseId) {
              cambiarComponente('GABINETE', targetCaseId);
            }
          }

          // 2. GPU Override
          if (gpuParam === 'dedicated') {
            // Check if we already have a GPU (from model)
            if (!foundModel.componentes.gpu) {
              const availableGpus = componentes.filter(c => c.tipo === 'GPU' && c.disponible);
              // Sort by price ascending
              availableGpus.sort((a, b) => (a.precio || 0) - (b.precio || 0));

              let selectedGpuId = '';
              const budgetLevel = params.get('budget') || 'MID';

              if (availableGpus.length > 0) {
                if (budgetLevel === 'ENTRY') {
                  // Cheapest dedicated
                  selectedGpuId = availableGpus[0].id;
                } else if (budgetLevel === 'MID') {
                  // Mid-range (approx 30-50 percentile of price)
                  const midIndex = Math.floor(availableGpus.length * 0.3);
                  selectedGpuId = availableGpus[Math.min(midIndex, availableGpus.length - 1)].id;
                } else if (budgetLevel === 'HIGH') {
                  // High-end (approx 60-80 percentile)
                  const highIndex = Math.floor(availableGpus.length * 0.7);
                  selectedGpuId = availableGpus[Math.min(highIndex, availableGpus.length - 1)].id;
                } else if (budgetLevel === 'ULTRA') {
                  // Top tier (most expensive)
                  selectedGpuId = availableGpus[availableGpus.length - 1].id;
                } else {
                  selectedGpuId = availableGpus[0].id;
                }
              }

              if (selectedGpuId) {
                cambiarComponente('GPU', selectedGpuId);
              }
            }
          } else if (gpuParam === 'integrated') {
            // Remove dedicated GPU if present
            cambiarComponente('GPU', '');
          }

          // 3. Step Override
          if (stepParam === 'resumen') {
            setPaso('resumen');
          }
        }, 500);
      }
    }
  }, [modelosBase, componentes, setModeloBase, cambiarComponente, setPaso]);

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
      .reduce((sum, comp) => sum + (comp.precio || 0), 0);
  }, [componentesSeleccionados, componentes]);

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
        const logoResp = await fetch('https://wckxhidltmnvpbrswnmz.supabase.co/storage/v1/object/public/componentes/branding/microhouse-logo.png?v=2');
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
        const base = componente?.precio || 0;
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
        <div className="hidden md:flex w-[var(--sidebar-width)] bg-white/95 backdrop-blur-sm shadow-xl md:border-r border-slate-200/50 flex-col md:max-h-full md:overflow-hidden shrink-0">
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
          <div className="flex-1 overflow-y-auto px-[var(--space-sm)] py-[var(--space-xs)] max-h-[42vh] md:max-h-none custom-scrollbar">
            <h3 className="text-[var(--text-xs)] font-semibold text-slate-700 mb-2 uppercase tracking-wider">Tu Configuración</h3>

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
                        {formatPrecio(Math.ceil(((componente?.precio || 0) * 1.10)))}
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
            <div className="flex-1 flex flex-col items-center justify-center px-[var(--space-sm)] py-[var(--space-xs)] overflow-hidden w-full min-h-0">
              <div className="relative w-full max-w-[var(--container-max)] flex-1 min-h-0 flex flex-col">
                <div className="absolute inset-0 overflow-hidden">
                  <div
                    className="flex h-full items-center"
                    style={{
                      '--card-width': 'min(45vh, 85vw)',
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
                            className={`bg-white rounded-2xl text-center w-full relative transition-all duration-500 ease-in-out flex flex-col h-full max-h-full ${isCurrent ? 'shadow-[0_0_0_3px_rgba(224,33,39,0.3),0_20px_60px_-10px_rgba(224,33,39,0.4)]' : 'shadow-2xl scale-80 opacity-60'
                              }`}
                            style={{
                              cursor: 'pointer',
                            }}
                          >
                            <div className="p-[2vh] flex flex-col h-full overflow-hidden">
                              <div className="mb-[1vh] shrink-0">
                                {modelo.imagenUrl && (
                                  <div className="mx-auto mb-[1vh] rounded-xl overflow-hidden shadow-lg w-full h-[20vh] shrink-0">
                                    <img src={modelo.imagenUrl} alt={modelo.nombre} loading="lazy" className="w-full h-full object-cover" />
                                  </div>
                                )}
                              </div>
                              <h2 className="text-[var(--text-lg)] font-bold text-slate-900 mb-1 truncate shrink-0">{modelo.nombre}</h2>
                              <div className="flex-1 overflow-y-auto min-h-0 mb-2 custom-scrollbar">
                                <p className="text-slate-600 text-[var(--text-xs)] leading-relaxed px-2">{modelo.descripcion}</p>
                              </div>
                              <div className="flex flex-wrap justify-center gap-1 mb-2 shrink-0">
                                {modelo.usoRecomendado?.slice(0, 3).map((tag) => (
                                  <span key={tag} className="px-2 py-1 rounded-full bg-slate-100 text-[10px] text-slate-600 border border-slate-200">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-left text-[10px] text-slate-600 mb-2 shrink-0">
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

                              <div className="mb-2 mt-auto px-3 py-2 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200/50 shadow-sm shrink-0">
                                <div className="flex items-center justify-between">
                                  <div className="shrink-0">
                                    <p className="text-[9px] text-slate-500 uppercase font-semibold tracking-wider mb-0.5">Contado / débito</p>
                                    <p className="text-[var(--text-lg)] font-bold text-slate-900">{formatPrecio(modelo.precioBase)}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-[9px] text-slate-500 uppercase font-semibold tracking-wider mb-0.5">1 cuota</p>
                                    <p className="text-[var(--text-lg)] font-bold bg-gradient-to-r from-[#E02127] to-[#0D1A4B] bg-clip-text text-transparent">
                                      {formatPrecio(Math.ceil(modelo.precioBase * 1.10))}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <div className="shrink-0">
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
                      <h2 className="text-[var(--text-sm)] font-bold text-slate-800">Mejoras Opcionales</h2>
                      <p className="text-[var(--text-xs)] text-slate-500">Personalizá componentes individuales</p>
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
                  <div className="h-full overflow-y-auto overflow-x-hidden px-[var(--space-sm)] py-[var(--space-xs)] animate-in fade-in slide-in-from-top-4 duration-500" style={{ maxHeight: 'calc(100vh - 140px)', minHeight: '60vh' }}>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-[var(--space-sm)]">
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
                                    <p className="text-[10px] font-bold text-slate-900 leading-tight mb-0.5">{comp.marca} {comp.modelo}</p>
                                    <p className="text-[9px] text-slate-500 mb-1">{comp.especificaciones?.capacidad}</p>
                                    <p className="text-[10px] font-bold text-purple-600">
                                      {formatPrecio(comp.precio || 0)}
                                    </p>
                                  </button>
                                );
                              })()
                            ))}
                        </div>
                      </div>

                      {/* Categoría: Almacenamiento */}
                      <div className="bg-gradient-to-br from-blue-50/50 to-cyan-50/50 rounded-lg p-3 border border-blue-100 hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
                        <div className="flex items-center gap-1.5 mb-2.5">
                          <HardDrive className="h-4 w-4 text-blue-600" />
                          <h3 className="text-xs font-bold text-slate-800">Almacenamiento</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {componentes
                            .filter((c) => c.tipo === 'ALMACENAMIENTO')
                            .map((comp) => (
                              <button
                                key={comp.id}
                                className={`relative p-2.5 rounded-lg text-left transition-all duration-300 hover:scale-105 active:scale-95 ${componentesSeleccionados?.almacenamiento === comp.id
                                  ? 'bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg ring-2 ring-blue-300 scale-105'
                                  : 'bg-white border border-slate-200 hover:border-blue-300 hover:shadow-md'
                                  }`}
                                onClick={() => cambiarComponente('ALMACENAMIENTO', comp.id)}
                              >
                                {comp.imagenUrl && (
                                  <img src={comp.imagenUrl} alt={`${comp.marca} ${comp.modelo}`} className="w-full h-24 object-cover rounded mb-2 border" loading="lazy" />
                                )}
                                {componentesSeleccionados?.almacenamiento === comp.id && (
                                  <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow animate-in zoom-in duration-300">
                                    <Check className="h-2.5 w-2.5 text-blue-600" />
                                  </div>
                                )}
                                <p className="text-[10px] font-bold text-slate-900 leading-tight mb-0.5">{comp.marca} {comp.modelo}</p>
                                <p className="text-[9px] text-slate-500 mb-1">{comp.especificaciones?.capacidad} {comp.especificaciones?.tipo}</p>
                                <p className="text-[10px] font-bold text-blue-600">
                                  {formatPrecio(comp.precio || 0)}
                                </p>
                              </button>
                            ))}
                        </div>
                      </div>

                      {/* Categoría: Gráfica (GPU) */}
                      <div className="col-span-1 lg:col-span-2 bg-gradient-to-br from-orange-50/50 to-red-50/50 rounded-lg p-3 border border-orange-100 hover:shadow-lg hover:scale-[1.01] transition-all duration-300">
                        <div className="flex items-center gap-1.5 mb-2.5">
                          <MonitorUp className="h-4 w-4 text-orange-600" />
                          <h3 className="text-xs font-bold text-slate-800">Placa de Video (GPU)</h3>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                          {componentes
                            .filter((c) => c.tipo === 'GPU')
                            .map((comp) => (
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
                                <p className="text-[10px] font-bold text-slate-900 leading-tight mb-0.5">{comp.marca} {comp.modelo}</p>
                                <p className="text-[9px] text-slate-500 mb-1">{comp.especificaciones?.vram}</p>
                                <p className="text-[10px] font-bold text-orange-600">
                                  {formatPrecio(comp.precio || 0)}
                                </p>
                              </button>
                            ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Botones de Navegación (Mejoras) */}
              <div className="p-4 bg-white/95 backdrop-blur-sm border-t border-slate-200/50 flex justify-between items-center shadow-lg z-10">
                <button
                  onClick={handleAnterior}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 hover:text-slate-900 transition-all duration-300 flex items-center gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Volver
                </button>
                <button
                  onClick={handleSiguiente}
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-[#E02127] to-[#0D1A4B] text-white font-bold text-xs shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center gap-2"
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
          {/* Paso 3: Gabinete */}
          {pasoActual === 'gabinete' && (
            <div className="flex-1 overflow-hidden flex flex-col">
              <GabineteSelector
                gabinetes={gabinetes}
              />
              <div className="p-4 bg-white/95 backdrop-blur-sm border-t border-slate-200/50 flex justify-between items-center shadow-lg z-10">
                <button
                  onClick={handleAnterior}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 hover:text-slate-900 transition-all duration-300 flex items-center gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Volver
                </button>
                <button
                  onClick={handleSiguiente}
                  disabled={!componentesSeleccionados?.gabinete}
                  className={`px-6 py-2 rounded-xl font-bold text-xs shadow-lg transition-all duration-300 flex items-center gap-2 ${componentesSeleccionados?.gabinete
                    ? 'bg-gradient-to-r from-[#E02127] to-[#0D1A4B] text-white hover:shadow-xl hover:scale-105'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Paso 5: Monitor */}
          {pasoActual === 'monitor' && (
            <div className="flex-1 overflow-hidden flex flex-col">
              <MonitorSelector />
              <div className="p-4 bg-white/95 backdrop-blur-sm border-t border-slate-200/50 flex justify-between items-center shadow-lg z-10">
                <button
                  onClick={handleAnterior}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 hover:text-slate-900 transition-all duration-300 flex items-center gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Volver
                </button>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      cambiarComponente('MONITOR', ''); // Omitir monitor
                      handleSiguiente();
                    }}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-500 font-bold text-xs hover:bg-slate-50 hover:text-slate-800 transition-all duration-300"
                  >
                    Omitir
                  </button>
                  <button
                    onClick={handleSiguiente}
                    className="px-6 py-2 rounded-xl bg-gradient-to-r from-[#E02127] to-[#0D1A4B] text-white font-bold text-xs shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center gap-2"
                  >
                    Finalizar
                    <Check className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Paso 6: Resumen Final */}
          {
            pasoActual === 'resumen' && (
              <div className="flex-1 overflow-y-auto p-4 md:p-8">
                <div className="max-w-4xl mx-auto space-y-8">
                  <div className="text-center space-y-2 animate-in fade-in slide-in-from-bottom duration-700">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg animate-bounce">
                      <Check className="h-8 w-8 text-green-600" />
                    </div>
                    <h2 className="text-[var(--text-3xl)] font-bold text-slate-900">¡Configuración Lista!</h2>
                    <p className="text-slate-500 text-[var(--text-base)]">Revisá tu presupuesto y elegí cómo querés continuar.</p>
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                      <div className="p-[var(--space-md)] bg-slate-50 border-b border-slate-200 flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg shadow-sm text-[#E02127]">
                          <Cpu className="h-6 w-6" />
                        </div>
                        <h3 className="text-[var(--text-xl)] font-bold text-slate-800">Detalle de Componentes</h3>
                      </div>
                      <div className="divide-y divide-slate-100">
                        {componentesDetalle.map(({ tipo, componente }) => (
                          <div key={tipo} className="p-[var(--space-md)] flex items-center justify-between hover:bg-slate-50 transition-colors group">
                            <div className="flex items-center gap-[var(--space-md)]">
                              <div className="p-3 bg-slate-100 rounded-xl text-slate-500 group-hover:bg-white group-hover:text-[#E02127] group-hover:shadow-md transition-all duration-300">
                                {getComponentIcon(tipo)}
                              </div>
                              <div>
                                <p className="text-[var(--text-xs)] font-bold text-slate-500 uppercase tracking-wider mb-1">
                                  {tipo === 'procesador' && 'Procesador'}
                                  {tipo === 'placamadre' && 'Placa Madre'}
                                  {tipo === 'ram' && 'Memoria RAM'}
                                  {tipo === 'almacenamiento' && 'Almacenamiento'}
                                  {tipo === 'gpu' && 'Gráfica'}
                                  {tipo === 'fuente' && 'Fuente'}
                                  {tipo === 'gabinete' && 'Gabinete'}
                                  {tipo === 'monitor' && 'Monitor'}
                                </p>
                                <p className="font-bold text-slate-900 text-[var(--text-base)]">{componente?.marca} {componente?.modelo}</p>
                              </div>
                            </div>
                            <p className="font-bold text-slate-700 text-[var(--text-lg)]">
                              {formatPrecio(Math.ceil(((componente?.precio || 0) * 1.10)))}
                            </p>
                          </div>
                        ))}
                      </div>
                      <div className="p-[var(--space-lg)] bg-slate-50 border-t border-slate-200">
                        <div className="flex justify-between items-end">
                          <div>
                            <p className="text-[var(--text-sm)] text-slate-500 font-medium mb-1">Total Estimado (Lista)</p>
                            <p className="text-[var(--text-xs)] text-slate-400">* Incluye impuestos y descuentos</p>
                          </div>
                          <span className="text-[var(--text-4xl)] font-black bg-gradient-to-r from-[#E02127] to-[#0D1A4B] bg-clip-text text-transparent">
                            {formatPrecio(Math.ceil(total * 1.10))}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom duration-700 delay-200">
                      <button
                        onClick={handleDescargarPDF}
                        className="p-4 bg-white border-2 border-slate-200 rounded-xl hover:border-[#E02127] hover:shadow-lg transition-all duration-300 group text-left"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 bg-red-50 rounded-lg text-[#E02127] group-hover:bg-[#E02127] group-hover:text-white transition-colors">
                            <HardDrive className="h-6 w-6" />
                          </div>
                          <h3 className="font-bold text-slate-900">Descargar PDF</h3>
                        </div>
                        <p className="text-sm text-slate-500">Guardá el presupuesto para verlo después o imprimirlo.</p>
                      </button>

                      <button
                        onClick={handleCompartirWhatsApp}
                        className="p-4 bg-[#25D366] text-white rounded-xl hover:bg-[#128C7E] hover:shadow-lg transition-all duration-300 group text-left shadow-green-200"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 bg-white/20 rounded-lg">
                            <MonitorUp className="h-6 w-6" />
                          </div>
                          <h3 className="font-bold">Consultar por WhatsApp</h3>
                        </div>
                        <p className="text-sm text-white/90">Envianos tu configuración para confirmar stock y comprar.</p>
                      </button>
                    </div>

                    <div className="flex justify-center pt-8 pb-8">
                      <button
                        onClick={() => {
                          resetear();
                          // Optional: redirect to home or just reset
                        }}
                        className="text-slate-400 hover:text-slate-600 text-sm flex items-center gap-2 transition-colors"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Empezar una nueva cotización
                      </button>
                    </div>

                  </div>
                </div>
              </div>
            )
          }
        </div>
      </div>
    </div>
  );
}
