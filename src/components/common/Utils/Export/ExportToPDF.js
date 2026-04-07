import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Reusable PDF Export Utility
 *
 * Usage:
 *   import { exportToPDF } from '../../components/common/Export/ExportToPDF';
 *
 *   await exportToPDF({
 *     fetchData    : async () => { const res = await getAllCategory(); return res.data; },
 *     extractRows  : (data) => Array.isArray(data) ? data : (data?.categories ?? []),
 *     columnMap    : [
 *       { key: 'id',          label: 'Category ID'   },
 *       { key: 'name',        label: 'Category Name' },
 *       { key: 'description', label: 'Description'   },
 *     ],
 *     title          : 'Category Report',   // heading printed at the top of the PDF
 *     filenamePrefix : 'categories',        // produces: categories_2025-02-21.pdf
 *     onStart : () => setIsExporting(true),
 *     onEnd   : () => setIsExporting(false),
 *   });
 *
 * Optional styling (all have defaults):
 *   orientation      : 'portrait' | 'landscape'   (default: 'portrait')
 *   pageSize         : any jsPDF page-size string  (default: 'a4')
 *   tableStyles      : autoTable styles object      (default: see below)
 *   headStyles       : autoTable head styles        (default: purple header)
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Safely convert any cell value to a printable string.
 * @param {*} value
 * @returns {string}
 */
const cellToString = (value) => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
};

/**
 * Build the head row and body rows for jspdf-autotable.
 *
 * @param {Array<Object>}                         rows
 * @param {Array<{ key: string, label: string }>} columnMap
 * @returns {{ head: string[][], body: string[][] }}
 */
const buildTableData = (rows, columnMap) => {
    const head = [columnMap.map((col) => col.label)];
    const body = rows.map((row) =>
        columnMap.map((col) => cellToString(row[col.key]))
    );
    const columnStyles = {};
    columnMap.forEach((col, index) => {
        columnStyles[index] = {};
        if (col.align) {
            columnStyles[index].halign = col.align;
        }
        if (col.width) {
            columnStyles[index].cellWidth = col.width;
        }
    });
    return { head, body, columnStyles };
};

// ---------------------------------------------------------------------------
// Main export function
// ---------------------------------------------------------------------------

/**
 * Fetch data from any source and download it as a PDF file.
 *
 * @param {Object}   options
 * @param {Function} options.fetchData        - async function that returns the raw API response / data object
 * @param {Function} options.extractRows      - function(rawData) => Array — extract the row array from the raw response
 * @param {Array<{ key: string, label: string }>} options.columnMap
 *                                            - defines which fields map to which PDF column headers
 * @param {string}   [options.title]          - heading text printed at the top of the PDF (default: filenamePrefix)
 * @param {string}   [options.filenamePrefix='export'] - prefix for the downloaded file (date is appended automatically)
 * @param {string}   [options.orientation='portrait']  - 'portrait' | 'landscape'
 * @param {string}   [options.pageSize='a4']           - any jsPDF-supported page size string
 * @param {Object}   [options.tableStyles]             - jspdf-autotable `styles` overrides
 * @param {Object}   [options.headStyles]              - jspdf-autotable `headStyles` overrides
 * @param {Function} [options.onStart]        - called before fetching begins (e.g. show spinner)
 * @param {Function} [options.onEnd]          - called after download completes or on error
 */
export const exportToPDF = async ({
    fetchData,
    extractRows,
    columnMap,
    title,
    subTitle,
    filenamePrefix = 'export',
    orientation = 'portrait',
    pageSize = 'a4',
    tableStyles = {},
    headStyles = {},
    onStart,
    onEnd,
} = {}) => {
    try {
        onStart?.();

        // 1. Fetch & extract rows
        const rawData = await fetchData();
        const rows = extractRows(rawData);

        if (!Array.isArray(rows) || rows.length === 0) {
            console.warn('ExportToPDF: no rows found, skipping download.');
            return;
        }

        // 2. Build table data
        const { head, body, columnStyles } = buildTableData(rows, columnMap);

        // 3. Create PDF document
        const doc = new jsPDF({ orientation, unit: 'mm', format: pageSize });

        const pageWidth = doc.internal.pageSize.getWidth();
        const dateStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
        const reportTitle = title || filenamePrefix;

        let currentY = 18;

        // --- Header: title ---
        doc.setFontSize(16);
        doc.setTextColor(40, 40, 40);
        doc.text(reportTitle, pageWidth / 2, currentY, { align: 'center' });

        // --- Sub-header ---
        if (subTitle) {
            currentY += 7;
            doc.setFontSize(14);
            doc.setTextColor(60, 60, 60);
            doc.text(subTitle, pageWidth / 2, currentY, { align: 'center' });
        }

        // --- Date ---
        currentY += 7;
        doc.setFontSize(9);
        doc.setTextColor(130, 130, 130);
        doc.text(`Date: ${dateStr}`, pageWidth / 2, currentY, { align: 'center' });

        // --- Table ---
        autoTable(doc, {
            head,
            body,
            startY: currentY + 7,
            styles: {
                fontSize: 9,
                cellPadding: 3,
                overflow: 'linebreak',
                ...tableStyles,
            },
            columnStyles,
            headStyles: {
                fillColor: [99, 102, 241],
                textColor: 255,
                fontStyle: 'bold',
                ...headStyles,
            },
            alternateRowStyles: {
                fillColor: [245, 245, 255],
            },
            margin: { left: 14, right: 14 },
        });

        // --- Footer: page numbers ---
        const totalPages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(
                `Page ${i} of ${totalPages}`,
                pageWidth / 2,
                doc.internal.pageSize.getHeight() - 8,
                { align: 'center' }
            );
        }

        // 4. Open in new tab for preview/download
        const pdfBlob = doc.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);
        window.open(pdfUrl, '_blank');
    } catch (error) {
        console.error('ExportToPDF: export failed:', error);
    } finally {
        onEnd?.();
    }
};
