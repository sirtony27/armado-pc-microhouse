import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ItemPresupuesto } from '@/types';
import { formatPrecio } from '@/lib/utils';

// Helper to getting base64 from url
const getBase64ImageFromURL = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.setAttribute('crossOrigin', 'anonymous');
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0);
            const dataURL = canvas.toDataURL('image/png');
            resolve(dataURL);
        };
        img.onerror = error => reject(error);
        img.src = url;
    });
};

export const generateBudgetPDF = async (items: ItemPresupuesto[]) => {
    const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a5' // Keep the compact A5 format
    });

    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 10;
    let y = margin;

    // --- Header ---
    // Logo
    try {
        const logoUrl = "https://wckxhidltmnvpbrswnmz.supabase.co/storage/v1/object/public/componentes/branding/microhouse-logo.png?v=5";
        const logoBase64 = await getBase64ImageFromURL(logoUrl);
        // Maintain aspect ratio, assuming logo is approx 3:1 width:height or similar.
        // Let's set a fixed width of 40mm and calculate height.
        // Actually for simplicity, let's fix dimensions that look good in A5 header.
        doc.addImage(logoBase64, 'PNG', margin, y, 40, 15); // width 40mm, height 15mm
    } catch (error) {
        // Fallback if image load fails
        console.error("Failed to load PDF logo", error);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.setTextColor(224, 33, 39); // MicroHouse Red
        doc.text('MICROHOUSE', margin, y + 8);
    }

    // Adjust Y if logo was placed (15mm height) or text (text is approx same space)
    // The previous text was at y+8. The image goes from y to y+15.
    // So company info which started at y+5 needs to move down?
    // Previous Code:
    // doc.text('MICROHOUSE', margin, y + 8);
    // let infoY = y + 5; (Starts parallel to logo/text)

    // We want the company info to be on the right, aligned top with logo.

    // Company Info
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(80);
    const companyInfo = [
        'www.microhouse.com.ar',
        'administracion@microhouse.com.ar',
        'Tel: 291 576-4388'
    ];

    // Start info at same Y as logo top + offset
    let infoY = y + 5;
    companyInfo.forEach(line => {
        doc.text(line, pageWidth - margin, infoY, { align: 'right' });
        infoY += 4;
    });

    y += 25;

    // --- Title & Date ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(30);
    doc.text('PRESUPUESTO', margin, y);

    const fecha = new Date();
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(`Fecha: ${fecha.toLocaleDateString()}`, margin, y + 5);

    // Total Items count
    doc.text(`Items: ${items.length}`, pageWidth - margin, y + 5, { align: 'right' });

    y += 15;

    // --- Items Table ---
    // Mapping items to rows
    const rows = items.map(item => {
        const prod = item.producto;
        const nombre = item.tipo === 'NOTEBOOK'
            ? `${prod.marca} ${prod.modelo}`
            : (item.detalles?.modeloNombre || 'PC Armada a Medida');

        const specs = item.detalles?.specs || (item.tipo === 'NOTEBOOK' ? prod.descripcion : 'Ver detalle adjunto');

        return [
            item.cantidad,
            nombre,
            specs,
            formatPrecio(item.precioUnitario),
            formatPrecio(item.precioUnitario * item.cantidad)
        ];
    });

    autoTable(doc, {
        head: [['Cant', 'Producto', 'Detalle', 'Unitario', 'Total']],
        body: rows,
        startY: y,
        theme: 'grid',
        headStyles: {
            fillColor: [224, 33, 39],
            textColor: 255,
            fontStyle: 'bold',
            halign: 'left',
            cellPadding: 3,
            fontSize: 8
        },
        bodyStyles: {
            textColor: 50,
            fontSize: 7,
            cellPadding: 3
        },
        columnStyles: {
            0: { cellWidth: 10, halign: 'center' },
            1: { cellWidth: 40, fontStyle: 'bold' },
            2: { cellWidth: 'auto' }, // Takes remaining space
            3: { cellWidth: 20, halign: 'right' },
            4: { cellWidth: 20, halign: 'right', fontStyle: 'bold' }
        },
        alternateRowStyles: {
            fillColor: [249, 250, 251]
        },
        margin: { left: margin, right: margin }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;

    // --- Totals Section ---
    const totalContado = items.reduce((sum, i) => sum + (i.precioUnitario * i.cantidad), 0);

    // Container
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, finalY, pageWidth - (margin * 2), 60, 3, 3, 'F');

    let py = finalY + 10;
    const leftColX = margin + 10;
    const rightColX = pageWidth - margin - 10;

    // Calculations (Same multipliers as original)
    const tresTotal = Math.ceil(totalContado * 1.10);
    const seisTotal = Math.ceil(totalContado * 1.2603);
    const doceTotal = Math.ceil(totalContado * 1.51);

    doc.setFontSize(9);

    // Contado (Highlighted)
    doc.setTextColor(224, 33, 39);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL CONTADO / TRANSFERENCIA:', leftColX, py);
    doc.text(formatPrecio(totalContado), rightColX, py, { align: 'right' });
    py += 8;

    // Installments
    doc.setTextColor(60);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);

    doc.text('3 Cuotas s/interés (Precio Lista):', leftColX, py);
    doc.text(formatPrecio(tresTotal), rightColX, py, { align: 'right' });
    py += 6;

    doc.text('6 Cuotas Fijas:', leftColX, py);
    doc.text(`${formatPrecio(seisTotal)} (${formatPrecio(Math.ceil(seisTotal / 6))}/mes)`, rightColX, py, { align: 'right' });
    py += 6;

    doc.text('12 Cuotas Fijas:', leftColX, py);
    doc.text(`${formatPrecio(doceTotal)} (${formatPrecio(Math.ceil(doceTotal / 12))}/mes)`, rightColX, py, { align: 'right' });


    // --- Footer ---
    const footerY = pageHeight - 15;
    doc.setDrawColor(220);
    doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

    doc.setFontSize(7);
    doc.setTextColor(100);
    doc.text('MicroHouse - Venta de Hardware y Tecnología', pageWidth / 2, footerY, { align: 'center' });
    doc.text('Precios sujetos a variaciones sin previo aviso.', pageWidth / 2, footerY + 4, { align: 'center' });

    // Save
    doc.save(`Presupuesto_MicroHouse_${Date.now()}.pdf`);
};
