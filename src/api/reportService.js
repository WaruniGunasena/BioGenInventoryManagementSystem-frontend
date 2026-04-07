import api from "./axios";

/**
 * Download a PDF report from the backend.
 *
 * Endpoint: GET /{reportType}/download?param1=val1&param2=val2
 *
 * @param {string} reportType - The report identifier (e.g. "DAILY_SUMMARY")
 * @param {Object} params     - Key-value pairs sent as query params
 */
export const downloadReport = (reportType, params = {}) => {
    const query = new URLSearchParams(
        Object.fromEntries(
            Object.entries(params).filter(([, v]) => v !== "" && v !== null && v !== undefined)
        )
    ).toString();

    const url = `reports/${reportType}/download${query ? `?${query}` : ""}`;

    return api.get(url, { responseType: "blob" });
};
