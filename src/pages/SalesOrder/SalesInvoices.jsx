import React, { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import Sidebar from "../../components/Sidebar";
import DataTable from "../../components/common/DataTable";
import { X, FileText } from "lucide-react";
import { getPaginatedSalesOrders, searchSalesOrder } from "../../api/salesOrderService";
import "./SalesInvoices.css";

const SalesInvoices = () => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [pageSize] = useState(8);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        if (searchQuery) {
            handleSearch(searchQuery);
        } else {
            fetchInvoices(currentPage);
        }
    }, [currentPage, searchQuery]);

    const fetchInvoices = async (page) => {
        setLoading(true);
        try {
            const res = await getPaginatedSalesOrders(page, pageSize);
            if (res.data) {
                const data = res.data.salesOrderList || res.data.content || [];
                const total = res.data.totalPages || 1;

                const mappedData = data.map(item => ({
                    ...item,
                    customerName: item.customer?.name || item.customerName || "N/A",
                    address: item.customer?.address || "Address N/A",
                    phone: item.customer?.contact_No || "Phone N/A",
                    email: item.customer?.email || "Email N/A",
                    date: item.invoiceDate || item.date || "N/A",
                    invoiceNumber: item.invoiceNumber || "N/A"
                }));

                setInvoices(mappedData);
                setTotalPages(total);
            }
        } catch (error) {
            console.error("Error fetching sales invoices:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (query) => {
        if (!query) {
            fetchInvoices(0);
            return;
        }
        setLoading(true);
        try {
            const res = await searchSalesOrder(query);
            const rawData = res.data.salesOrderList || res.data.content || res.data;
            const dataToMap = Array.isArray(rawData) ? rawData : [];

            const mappedData = dataToMap.map(item => ({
                ...item,
                customerName: item.customer?.name || item.customerName || "N/A",
                address: item.customer?.address || "Address N/A",
                phone: item.customer?.contact_No || "Phone N/A",
                email: item.customer?.email || "Email N/A",
                date: item.invoiceDate || item.date || "N/A",
                invoiceNumber: item.invoiceNumber || "N/A"
            }));
            setInvoices(mappedData);
            setTotalPages(1);
        } catch (error) {
            console.error("Error searching sales invoices:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = (invoice) => {
        setSelectedInvoice(invoice);
        setIsModalOpen(true);
    };

    const columns = [
        { header: "Invoice Number", accessor: "invoiceNumber" },
        { header: "Customer", accessor: "customerName" },
        { header: "Date", accessor: "date" },
        {
            header: "Grand Total (RS.)",
            accessor: "grandTotal",
            render: (row) => parseFloat(row.grandTotal).toLocaleString('en-US', { minimumFractionDigits: 2 })
        },
        {
            header: "Action",
            accessor: "action",
            render: (row) => (
                <button className="view-link-btn" onClick={() => handleViewDetails(row)}>
                    view
                </button>
            )
        }
    ];

    return (
        <Layout>
            <div className={`dashboard-container ${isSidebarCollapsed ? "sidebar-collapsed" : ""}`}>
                <Sidebar
                    isCollapsed={isSidebarCollapsed}
                    toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    isMobileOpen={isMobileSidebarOpen}
                    toggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                />
                <div className="dashboard-content">
                    <div className="sales-invoices-page-container">
                        <header className="sales-invoices-header">
                            <div className="header-title">
                                <FileText size={28} className="header-icon" />
                                <h2>Sales Invoices</h2>
                            </div>
                        </header>

                        <div className="sales-invoices-table-section">
                            <DataTable
                                columns={columns}
                                data={invoices}
                                showAddButton={false}
                                showStatusToggle={false}
                                showActions={false}
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={(page) => setCurrentPage(page)}
                                onSearch={(val) => setSearchQuery(val)}
                            />
                        </div>
                    </div>
                </div>
            </div>
            {isModalOpen && selectedInvoice && (
                <div className="sales-invoice-modal-overlay">
                    <div className="sales-invoice-modal-content">
                        <div className="modal-header">
                            <h3>Sales Invoice Details - {selectedInvoice.invoiceNumber}</h3>
                            <button className="close-modal-btn" onClick={() => setIsModalOpen(false)}>
                                <X size={24} />
                            </button>
                        </div>
                        <div className="modal-body-scroll">
                            <div className="sales-order-summary-section">
                                <div className="invoice-header">
                                    <div className="company-info">
                                        <h1 className="company-name">BioGenHoldings Pvt Ltd</h1>
                                        <p className="company-subtitle">The Future of Healthcare</p>
                                        <p className="company-web">www.biogenholdings.com</p>
                                        <p>Tangalle Road, Meddawaththa, Matara</p>
                                        <p>Tel: +94 774 088 839 / +94 413 120 337</p>
                                        <p>Email: biogenholdings.com</p>
                                    </div>
                                    <div className="invoice-title">
                                        <h1>Sales Invoice</h1>
                                    </div>
                                </div>

                                <div className="invoice-info-bar">
                                    <div className="info-col">
                                        <span className="info-label">Invoice No. : </span>
                                        <span className="info-value">
                                            {selectedInvoice.invoiceNumber}
                                        </span>
                                    </div>
                                    <div className="info-col">
                                        <span className="info-label">Invoice Date : </span>
                                        <span className="info-value">{selectedInvoice.date}</span>
                                    </div>
                                    <div className="info-col">
                                        <span className="info-label">Credit Terms : </span>
                                        <span className="info-value">{selectedInvoice.creditTerm ? `${selectedInvoice.creditTerm} Days` : "COD"}</span>
                                    </div>
                                    <div className="info-col">
                                        <span className="info-label">Sales Rep : </span>
                                        <span className="info-value">{selectedInvoice.userName || selectedInvoice.user?.name || "Not Assigned"}</span>
                                    </div>
                                </div>

                                <div className="customer-details-grid">
                                    <div className="details-box">
                                        <h4 className="box-title">Customer Details</h4>
                                        <div className="box-content">
                                            <p className="customer-name">{selectedInvoice.customerName}</p>
                                            <p>{selectedInvoice.customer?.address || selectedInvoice.address}</p>
                                            <p>{selectedInvoice.customer?.contact_No || selectedInvoice.phone}</p>
                                        </div>
                                    </div>
                                    <div className="details-box">
                                        <h4 className="box-title">Delivery Address</h4>
                                        <div className="box-content">
                                            <p>{selectedInvoice.customer?.address || selectedInvoice.address}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="sales-order-table-container">
                                    <table className="sales-order-table invoice-table">
                                        <thead>
                                            <tr>
                                                <th>Item code</th>
                                                <th>Product Description</th>
                                                <th>Unit</th>
                                                <th>Qty</th>
                                                <th>Whole Sale Price</th>
                                                <th>Discount %</th>
                                                <th>Discounted Price</th>
                                                <th>Amount (LKR)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(selectedInvoice.items || []).map((item, index) => (
                                                <tr key={index}>
                                                    <td>{index + 1}</td>
                                                    <td>
                                                        <div className="product-desc-cell">
                                                            <span className="main-desc">{item.productName || item.product?.name || "Product N/A"}</span>
                                                            <span className="sub-desc">* B/N & (Exp Date): Default (30/11/2027)</span>
                                                        </div>
                                                    </td>
                                                    <td>{item.unit || "-"}</td>
                                                    <td>{item.quantity}</td>
                                                    <td>{parseFloat(item.sellingPrice).toFixed(2)}</td>
                                                    <td>{parseFloat(item.discountPercent || 0).toFixed(2)}%</td>
                                                    <td>{parseFloat(item.discountedPrice || 0).toFixed(2)}</td>
                                                    <td>{parseFloat(item.totalAmount).toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    <div className="invoice-totals-section">
                                        <div className="totals-row total-invoice">
                                            <span className="total-label">Total Invoice</span>
                                        </div>
                                        <div className="totals-content">
                                            <div className="totals-line">
                                                <span className="line-label">Total (LKR)</span>
                                                <span className="line-value">{parseFloat(selectedInvoice.grandTotal).toFixed(2)}</span>
                                            </div>
                                            <div className="totals-line">
                                                <span className="line-label">Additional Discount (LKR)</span>
                                                <span className="line-value">0.00</span>
                                            </div>
                                            <div className="totals-line">
                                                <span className="line-label">Payment Total (LKR)</span>
                                                <span className="line-value">0.00</span>
                                            </div>
                                            <div className="totals-line grand-due">
                                                <span className="line-label">Due (LKR)</span>
                                                <span className="line-value">{parseFloat(selectedInvoice.grandTotal).toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default SalesInvoices;
