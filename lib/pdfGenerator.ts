import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ItemPresupuesto } from '@/types';
import { formatPrecio } from '@/lib/utils';

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
    // Logo (Simulated text for now, assuming image handling is complex without direct URL access or base64)
    // If we had the logo base64, we'd add it here.
    // doc.addImage("/logo.png", "PNG", margin, y, 30, 10);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(224, 33, 39); // MicroHouse Red
    doc.text('MICROHOUSE', margin, y + 8);

    // Company Info
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(80);
    const companyInfo = [
        'www.microhouse.com.ar',
        'administracion@microhouse.com.ar',
        'Tel: 291 576-4388'
    ];
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

        // Price Calculation (Following existing logic: Base + Margin approx)
        // Note: The store price SHOULD be the final price already?
        // Let's assume store price is "Contado". Existing PDF implies "Precio 3 Cuotas" in the table.
        // Let's stick to showing the Unit Price stored in the budget (Contado) and then breakdown the totals.
        // OR follow the previous pattern: Table shows "Lista/3 Cuotas" generally? 
        // Reading previous code: "precio3 = Math.ceil((base || 0) * 1.10);"
        // I will display the stored price (Unitario) for clarity, and clarify totals below.

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
    const unoCuota = Math.ceil(totalContado * 1.10);
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
