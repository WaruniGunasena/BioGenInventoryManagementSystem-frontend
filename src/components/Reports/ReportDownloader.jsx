import React, { useState } from "react";
import { ExternalLink, Loader2, FileText } from "lucide-react";
import { downloadReport } from "../../api/reportService";
import { useToast } from "../../context/ToastContext";
import "./ReportDownloader.css";

/**
 * ReportDownloader — Reusable component to configure and download a single PDF report.
 *
 * Props:
 *  reportType   {string}   — The backend report identifier (e.g. "DAILY_SUMMARY")
 *  reportName   {string}   — Human-readable report name shown in the card header
 *  description  {string}   — Optional short description shown under the title
 *  icon         {ReactNode} — Optional icon element rendered in the card header
 *  params       {Array}    — Array of param config objects. Each object:
 *    {
 *      key          {string}   — Query param name sent to the API
 *      label        {string}   — Field label displayed to user
 *      type         {string}   — "text" | "date" | "number" | "select"
 *      required     {boolean}  — Marks the field required before download
 *      placeholder  {string}   — Input placeholder text
 *      defaultValue {string}   — Initial value
 *      options      {Array}    — [{ label, value }] for type="select"
 *    }
 */
const ReportDownloader = ({
    reportType,
    reportName,
    description,
    icon,
    params = [],
    /**
     * beforeSubmit(values) — optional transform applied to form values
     * before they are sent as query params.
     *
     * Use this to:
     *  • Inject hidden params (e.g. type: "PRODUCT")
     *  • Derive multiple params from one field
     *    (e.g. { reportDate } → { startDate, endDate })
     *
     * Default: identity function (no transformation).
     */
    beforeSubmit = (v) => v,
}) => {
    const { showToast } = useToast();

    // Initialise state from defaultValues
    const initialValues = Object.fromEntries(
        params.map((p) => [p.key, p.defaultValue ?? ""])
    );
    const [values, setValues] = useState(initialValues);
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (key, value) => {
        setValues((prev) => ({ ...prev, [key]: value }));
    };

    const handleViewReport = async () => {
        // Validate required fields
        for (const p of params) {
            if (p.required && !values[p.key]) {
                showToast("error", `"${p.label}" is required.`);
                return;
            }
        }

        setIsLoading(true);
        try {
            const res = await downloadReport(reportType, beforeSubmit(values));
            const blob = new Blob([res.data], { type: "application/pdf" });
            const url = URL.createObjectURL(blob);

            // Build a sensible filename
            const labelSlug = reportName.replace(/\s+/g, "_");
            const dateSuffix =
                values.reportDate ||
                values.startDate ||
                values.date ||
                new Date().toLocaleDateString("en-CA");
            const filename = `${labelSlug}_${dateSuffix}.pdf`;

            // Open a wrapper page in a new tab so the user can view the PDF
            // and download it with the correct filename via the Download button.
            const newTab = window.open("", "_blank");
            if (!newTab) {
                showToast("error", "Pop-up blocked. Please allow pop-ups for this site.");
                URL.revokeObjectURL(url);
                return;
            }

            newTab.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>${filename}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { display: flex; flex-direction: column; height: 100vh; font-family: Inter, sans-serif; background: #f3f4f6; }
    .bar {
      display: flex; align-items: center; justify-content: space-between;
      padding: 10px 18px;
      background: #4f46e5; color: #fff;
      box-shadow: 0 2px 6px rgba(79,70,229,.35);
      flex-shrink: 0;
    }
    .bar-title { font-size: 14px; font-weight: 600; }
    .dl-btn {
      display: inline-flex; align-items: center; gap: 6px;
      background: #fff; color: #4f46e5;
      padding: 7px 16px; border-radius: 8px;
      font-size: 13px; font-weight: 700;
      text-decoration: none;
      transition: background .15s;
    }
    .dl-btn:hover { background: #e0e7ff; }
    iframe { flex: 1; border: none; width: 100%; }
  </style>
</head>
<body>
  <div class="bar">
    <span class="bar-title">📄 ${filename}</span>
    <a class="dl-btn" href="${url}" download="${filename}">⬇ Download</a>
  </div>
  <iframe src="${url}"></iframe>
</body>
</html>`);
            newTab.document.close();

            showToast("success", `${reportName} opened in a new tab.`);
        } catch (error) {
            const msg =
                error?.response?.data?.message ||
                error?.message ||
                "Failed to download report. Please try again.";
            showToast("error", msg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="rd-card">
            <div className="rd-card-header">
                <div className="rd-header-icon">
                    {icon || <FileText size={22} />}
                </div>
                <div className="rd-header-text">
                    <h3 className="rd-title">{reportName}</h3>
                    {description && <p className="rd-desc">{description}</p>}
                </div>
            </div>

            {params.length > 0 && (
                <div className="rd-params">
                    {params.map((param) => (
                        <div key={param.key} className="rd-field">
                            <label className="rd-label">
                                {param.label}
                                {param.required && <span className="rd-req">*</span>}
                            </label>

                            {param.type === "select" ? (
                                <select
                                    className="rd-input"
                                    value={values[param.key]}
                                    onChange={(e) => handleChange(param.key, e.target.value)}
                                >
                                    {(param.options || []).map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    className="rd-input"
                                    type={param.type || "text"}
                                    placeholder={param.placeholder || ""}
                                    value={values[param.key]}
                                    onChange={(e) => handleChange(param.key, e.target.value)}
                                />
                            )}
                        </div>
                    ))}
                </div>
            )}

            <div className="rd-footer">
                <button
                    className="rd-btn"
                    onClick={handleViewReport}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <>
                            <Loader2 size={16} className="rd-spin" />
                            Generating…
                        </>
                    ) : (
                        <>
                            <ExternalLink size={16} />
                            View PDF
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default ReportDownloader;
