/**
 * Reusable CSV Export Utility
 *
 * Usage:
 *   import { exportToCSV } from '../../components/common/Export/ExportToCSV';
 *
 *   await exportToCSV({
 *     fetchData  : async () => { const res = await getAllCategory(); return res.data; },
 *     extractRows: (data) => Array.isArray(data) ? data : data.categories ?? [],
 *     columnMap  : [
 *       { key: 'id',          label: 'Category ID'   },
 *       { key: 'name',        label: 'Category Name' },
 *       { key: 'description', label: 'Description'   },
 *     ],
 *     filenamePrefix: 'categories',   // produces: categories_2025-02-21.csv
 *     onStart: () => setIsExporting(true),
 *     onEnd  : () => setIsExporting(false),
 *   });
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Escape a single CSV cell value.
 * Wraps in double-quotes and escapes internal quotes when needed.
 *
 * @param {*} value
 * @returns {string}
 */
const escapeCell = (value) => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('\n') || str.includes('"')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
};

/**
 * Convert an array of row objects into a CSV string using the provided column map.
 *
 * @param {Array<Object>}                         rows
 * @param {Array<{ key: string, label: string }>} columnMap
 * @returns {string}
 */
const buildCSV = (rows, columnMap) => {
    const headers = columnMap.map((col) => col.label).join(',');
    const body = rows.map((row) =>
        columnMap.map((col) => escapeCell(row[col.key])).join(',')
    );
    return [headers, ...body].join('\n');
};

/**
 * Trigger a browser download for the given CSV content.
 *
 * @param {string} csvContent
 * @param {string} filename
 */
const downloadCSV = (csvContent, filename) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

// ---------------------------------------------------------------------------
// Main export function
// ---------------------------------------------------------------------------

/**
 * Fetch data from any source and download it as a CSV file.
 *
 * @param {Object}   options
 * @param {Function} options.fetchData       - async function that returns the raw API response / data object
 * @param {Function} options.extractRows     - function(rawData) => Array — extract the row array from the raw response
 * @param {Array<{ key: string, label: string }>} options.columnMap - defines which fields map to which CSV headers
 * @param {string}   [options.filenamePrefix='export'] - prefix for the downloaded file (date is appended automatically)
 * @param {Function} [options.onStart]       - called before fetching begins (e.g. show spinner)
 * @param {Function} [options.onEnd]         - called after download completes or on error (e.g. hide spinner)
 */
export const exportToCSV = async ({
    fetchData,
    extractRows,
    columnMap,
    filenamePrefix = 'export',
    onStart,
    onEnd,
} = {}) => {
    try {
        onStart?.();

        const rawData = await fetchData();
        const rows = extractRows(rawData);

        if (!Array.isArray(rows) || rows.length === 0) {
            console.warn('ExportToCSV: no rows found, skipping download.');
            return;
        }

        const csv = buildCSV(rows, columnMap);
        const dateStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
        downloadCSV(csv, `${filenamePrefix}_${dateStr}.csv`);
    } catch (error) {
        console.error('ExportToCSV: export failed:', error);
    } finally {
        onEnd?.();
    }
};
