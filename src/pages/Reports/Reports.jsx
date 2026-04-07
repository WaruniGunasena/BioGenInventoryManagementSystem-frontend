import React, { useState } from "react";
import Layout from "../../components/Layout";
import Sidebar from "../../components/Sidebar";
import ReportDownloader from "../../components/Reports/ReportDownloader";
import {
    BarChart2,
    Package,
    FileText,
    ClipboardList,
    Users,
    Star,
    ChevronDown,
    CalendarDays,
    CalendarRange,
    ShoppingBag,
    UserCheck,
    TrendingUp,
    Receipt,
    CreditCard,
    Clock,
    AlertCircle,
    Layers,
    Timer,
    LayoutList,
} from "lucide-react";
import "./Reports.css";

/* ── Date helpers ── */
const today = new Date().toLocaleDateString("en-CA");
const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toLocaleDateString("en-CA");
const lastOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
    .toLocaleDateString("en-CA");

/* ─────────────────────────────────────────────────────────────────────
   Report definitions
   Each entry maps directly to ReportDownloader props.
   Add new reports here — no JSX changes needed.
───────────────────────────────────────────────────────────────────── */

// ── Section 3: Sales Reports ─────────────────────────────────────────
const SALES_REPORTS = [
    {
        reportType: "SALES_REPORT",
        reportName: "Daily Sales Report",
        description:
            "All approved sales invoices for a specific day.",
        icon: <CalendarDays size={22} />,
        params: [
            {
                key: "reportDate",
                label: "Date",
                type: "date",
                required: true,
                defaultValue: today,
            },
        ],
        // Convert single date → startDate + endDate (same day)
        beforeSubmit: (v) => ({ startDate: v.reportDate, endDate: v.reportDate }),
    },
    {
        reportType: "SALES_REPORT",
        reportName: "Monthly Sales Report",
        description:
            "All approved sales invoices within a selected month range.",
        icon: <CalendarRange size={22} />,
        params: [
            {
                key: "startDate",
                label: "From Date",
                type: "date",
                required: true,
                defaultValue: firstOfMonth,
            },
            {
                key: "endDate",
                label: "To Date",
                type: "date",
                required: true,
                defaultValue: lastOfMonth,
            },
        ],
    },
    {
        reportType: "INVOICE_WISE",
        reportName: "Invoice-wise Sales Report",
        description:
            "List of all approved invoices with customer and total amount, filtered by date range.",
        icon: <Receipt size={22} />,
        params: [
            {
                key: "startDate",
                label: "From Date",
                type: "date",
                required: true,
                defaultValue: firstOfMonth,
            },
            {
                key: "endDate",
                label: "To Date",
                type: "date",
                required: true,
                defaultValue: lastOfMonth,
            },
        ],
    },
    {
        reportType: "PRODUCT_WISE",
        reportName: "Product-wise Sales Report",
        description:
            "Revenue and quantity grouped by product for approved orders in the date range.",
        icon: <ShoppingBag size={22} />,
        params: [
            {
                key: "startDate",
                label: "From Date",
                type: "date",
                required: true,
                defaultValue: firstOfMonth,
            },
            {
                key: "endDate",
                label: "To Date",
                type: "date",
                required: true,
                defaultValue: lastOfMonth,
            },
        ],
    },
    {
        reportType: "CUSTOMER_WISE",
        reportName: "Customer-wise Sales Report",
        description:
            "Order count and total spend grouped by customer for approved orders.",
        icon: <UserCheck size={22} />,
        params: [
            {
                key: "startDate",
                label: "From Date",
                type: "date",
                required: true,
                defaultValue: firstOfMonth,
            },
            {
                key: "endDate",
                label: "To Date",
                type: "date",
                required: true,
                defaultValue: lastOfMonth,
            },
        ],
    },
    {
        reportType: "SALES_REPORT",
        reportName: "Sales Financial Summary",
        description:
            "Gross sales, net sales and total discount for approved orders in the date range.",
        icon: <TrendingUp size={22} />,
        params: [
            {
                key: "startDate",
                label: "From Date",
                type: "date",
                required: true,
                defaultValue: firstOfMonth,
            },
            {
                key: "endDate",
                label: "To Date",
                type: "date",
                required: true,
                defaultValue: lastOfMonth,
            },
        ],
    },
];

// ── Other existing reports ────────────────────────────────────────────
const GENERAL_REPORTS = [
    {
        reportType: "DAILY_SUMMARY",
        reportName: "Daily Activity Summary",
        description: "Full summary of all transactions and activity for a selected date.",
        icon: <BarChart2 size={22} />,
        params: [
            {
                key: "date",
                label: "Report Date",
                type: "date",
                required: true,
                defaultValue: today,
            },
        ],
    },
];

const INVENTORY_REPORTS = [
    {
        reportType: "LOW_STOCK",
        reportName: "Inventory Low Stock Alert",
        description: "Lists all products whose stock falls below the minimum threshold.",
        icon: <Package size={22} />,
        params: [],
    },
    {
        reportType: "STOCK_MOVEMENT",
        reportName: "Stock In/Out Movement Log",
        description: "All stock-in and stock-out movements within a date range.",
        icon: <Layers size={22} />,
        params: [
            {
                key: "startDate",
                label: "From Date",
                type: "date",
                required: true,
                defaultValue: firstOfMonth,
            },
            {
                key: "endDate",
                label: "To Date",
                type: "date",
                required: true,
                defaultValue: lastOfMonth,
            },
        ],
    },
    {
        reportType: "BATCH_STOCK",
        reportName: "Batch-wise Inventory Breakdown",
        description: "Current stock levels broken down by batch for all products.",
        icon: <LayoutList size={22} />,
        params: [],
    },
    {
        reportType: "EXPIRY_REPORT",
        reportName: "Product Expiry / Near-Expiry Report",
        description: "Products that are expired or expiring within the specified number of months. Enter 0 for already-expired only.",
        icon: <Timer size={22} />,
        params: [
            {
                key: "months",
                label: "Expiring within (months)",
                type: "number",
                required: false,
                placeholder: "e.g. 3  (0 = already expired)",
                defaultValue: "3",
            },
        ],
    },
    {
        reportType: "STOCK_STATUS",
        reportName: "Inventory Stock Status Report",
        description: "Full stock status for all products, or filter to out-of-stock items only.",
        icon: <Package size={22} />,
        params: [
            {
                key: "type",
                label: "Filter",
                type: "select",
                required: false,
                defaultValue: "",
                options: [
                    { label: "All Products",      value: "" },
                    { label: "Out of Stock Only", value: "OUT_OF_STOCK" },
                ],
            },
        ],
    },
];

const ORDER_REPORTS = [
    {
        reportType: "ORDER_DETAILS",
        reportName: "Order Item Specification",
        description: "Detailed item-level breakdown for a specific sales order.",
        icon: <FileText size={22} />,
        params: [
            {
                key: "orderId",
                label: "Sales Order ID",
                type: "number",
                required: true,
                placeholder: "e.g. 34",
            },
        ],
    },
    {
        reportType: "ORDER_REPORT",
        reportName: "Order Summary",
        description: "Summary of sales orders, optionally filtered by status.",
        icon: <ClipboardList size={22} />,
        params: [
            {
                key: "status",
                label: "Order Status",
                type: "select",
                required: false,
                defaultValue: "",
                options: [
                    { label: "All Statuses", value: "" },
                    { label: "Pending",   value: "PENDING" },
                    { label: "Approved",  value: "APPROVED" },
                    { label: "Delivered", value: "DELIVERED" },
                    { label: "Cancelled", value: "CANCELLED" },
                ],
            },
        ],
    },
];

const CUSTOMER_REPORTS = [
    {
        reportType: "PHARMACY_LIST",
        reportName: "Registered Pharmacies",
        description: "A full list of all registered pharmacy customers.",
        icon: <Users size={22} />,
        params: [],
    },
    {
        reportType: "TOP_CUSTOMER_LIST",
        reportName: "Top Customers",
        description: "Ranks customers by total purchase value over all time.",
        icon: <Star size={22} />,
        params: [],
    },
    {
        reportType: "PAYMENT_HISTORY",
        reportName: "Customer Payment History",
        description: "Detailed log of all customer payments within a date range.",
        icon: <Clock size={22} />,
        params: [
            {
                key: "startDate",
                label: "From Date",
                type: "date",
                required: true,
                defaultValue: firstOfMonth,
            },
            {
                key: "endDate",
                label: "To Date",
                type: "date",
                required: true,
                defaultValue: lastOfMonth,
            },
        ],
    },
    {
        reportType: "CUSTOMER_BALANCE",
        reportName: "Customer Credit Balance Summary",
        description: "Current credit balance and outstanding amounts for all customers.",
        icon: <CreditCard size={22} />,
        params: [], // no params — returns all customers
    },
    {
        reportType: "OUTSTANDING_REPORT",
        reportName: "Pending Invoice Outstanding Report",
        description: "All pending/unapproved invoices with outstanding balances.",
        icon: <AlertCircle size={22} />,
        params: [], // no params — returns live outstanding data
    },
];

const ALL_REPORTS = [
    ...SALES_REPORTS,
    ...GENERAL_REPORTS,
    ...INVENTORY_REPORTS,
    ...ORDER_REPORTS,
    ...CUSTOMER_REPORTS,
];

/* ── Collapsible section ── */
const Section = ({ title, reports }) => {
    const [open, setOpen] = useState(true);
    return (
        <section className="rp-section">
            <button className="rp-section-toggle" onClick={() => setOpen((o) => !o)}>
                <span>{title}</span>
                <ChevronDown
                    size={18}
                    className={`rp-chevron ${open ? "open" : ""}`}
                />
            </button>
            {open && (
                <div className="rp-grid">
                    {reports.map((r, i) => (
                        <ReportDownloader key={`${r.reportType}-${i}`} {...r} />
                    ))}
                </div>
            )}
        </section>
    );
};

/* ── Page ── */
const Reports = () => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    return (
        <Layout>
            <div
                className={`dashboard-container ${
                    isSidebarCollapsed ? "sidebar-collapsed" : ""
                }`}
            >
                <Sidebar
                    isCollapsed={isSidebarCollapsed}
                    toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    isMobileOpen={isMobileSidebarOpen}
                    toggleMobileSidebar={() =>
                        setIsMobileSidebarOpen(!isMobileSidebarOpen)
                    }
                />

                <div className="dashboard-content">
                    <div className="rp-page">

                        {/* ── Page header ── */}
                        <header className="rp-header">
                            <div className="rp-header-left">
                                <div className="rp-header-icon">
                                    <BarChart2 size={24} />
                                </div>
                                <div>
                                    <h1 className="rp-title">Reports</h1>
                                    <p className="rp-subtitle">
                                        Generate and download business intelligence reports as PDF
                                    </p>
                                </div>
                            </div>
                            <div className="rp-badge">
                                {ALL_REPORTS.length} reports available
                            </div>
                        </header>

                        {/* ── Report sections ── */}
                        <Section title="📈 Sales Reports (Approved Orders)" reports={SALES_REPORTS} />
                        <Section title="📊 General Reports"                 reports={GENERAL_REPORTS} />
                        <Section title="📦 Inventory Reports"               reports={INVENTORY_REPORTS} />
                        <Section title="🗂️ Order Reports"                   reports={ORDER_REPORTS} />
                        <Section title="👥 Customer Reports"                reports={CUSTOMER_REPORTS} />
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Reports;
