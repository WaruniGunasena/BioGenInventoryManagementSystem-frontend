import React, { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import Sidebar from "../../components/Sidebar";
import DataTable from "../../components/common/DataTable";
import { X, FileText } from "lucide-react";
import { getPaginatedGRNs, searchGRN } from "../../api/grnService";
import "./Invoices.css";

const Invoices = () => {
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
            const res = await getPaginatedGRNs(page, pageSize);
            console.log("dtaa", res);
            if (res.data) {
                const data = res.data.grnList || [];
                const total = res.data.totalPages || 1;

                const mappedData = data.map(item => ({
                    ...item,
                    supplierName: item.supplier?.name || "N/A",
                    address: item.supplier?.address || "Address N/A",
                    phone: item.supplier?.phoneNumber || "Phone N/A",
                    email: item.supplier?.email || "Email N/A",
                    date: item.grnDate || item.date || "N/A",
                    invoiceNumber: item.invoiceNumber || item.grnNumber || "N/A"
                }));

                setInvoices(mappedData);
                setTotalPages(total);
            }
        } catch (error) {
            console.error("Error fetching invoices:", error);
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
            const res = await searchGRN(query);
            const rawData = res.data.grnList || res.data.content || res.data;
            const dataToMap = Array.isArray(rawData) ? rawData : [];

            const mappedData = dataToMap.map(item => ({
                ...item,
                supplierName: item.supplier?.name || "N/A",
                address: item.supplier?.address || "Address N/A",
                phone: item.supplier?.phoneNumber || "Phone N/A",
                email: item.supplier?.email || "Email N/A",
                date: item.grnDate || item.date || "N/A",
                invoiceNumber: item.invoiceNumber || item.grnNumber || "N/A"
            }));
            setInvoices(mappedData);
            setTotalPages(1);
        } catch (error) {
            console.error("Error searching invoices:", error);
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
        { header: "Supplier", accessor: "supplierName" },
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
                    <div className="invoices-page-container">
                        <header className="invoices-header">
                            <div className="header-title">
                                <FileText size={28} className="header-icon" />
                                <h2>Stock Invoices</h2>
                            </div>
                        </header>

                        <div className="invoices-table-section">
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

            {/* Invoice Details Modal */}
            {isModalOpen && selectedInvoice && (
                <div className="invoice-modal-overlay">
                    <div className="invoice-modal-content">
                        <div className="modal-header">
                            <h3>Invoice Details - {selectedInvoice.invoiceNumber}</h3>
                            <button className="close-modal-btn" onClick={() => setIsModalOpen(false)}>
                                <X size={24} />
                            </button>
                        </div>
                        <div className="modal-body-scroll">
                            <div className="grn-summary-section">
                                <div className="supplier-info">
                                    <h3>{selectedInvoice.supplierName}</h3>
                                    <p>{selectedInvoice.address}</p>
                                    <p>{selectedInvoice.phone} {selectedInvoice.email}</p>
                                </div>

                                <div className="grn-table-container">
                                    <table className="grn-table">
                                        <thead>
                                            <tr>
                                                <th>Product Description</th>
                                                <th>Purchase Price</th>
                                                <th>Quantity</th>
                                                <th>Total Amount RS.</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(selectedInvoice.items || []).map((item, idx) => (
                                                <tr key={idx}>
                                                    <td>{item.productName || item.product?.name || "Product N/A"}</td>
                                                    <td>{parseFloat(item.purchasePrice).toFixed(2)}</td>
                                                    <td>{item.quantity}</td>
                                                    <td>{parseFloat(item.totalAmount).toFixed(2)}</td>
                                                </tr>
                                            ))}
                                            <tr className="total-row">
                                                <td colSpan="3">Total</td>
                                                <td>{parseFloat(selectedInvoice.grandTotal).toFixed(2)}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default Invoices;
