import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import Sidebar from "../../components/Sidebar";
import DataTable from "../../components/common/DataTable";
import { X, FileText, Edit, Trash2 } from "lucide-react";
import { getPaginatedGRNs, searchGRN, softDeleteGRN } from "../../api/grnService";
import { getUserId } from "../../components/common/Utils/userUtils/userUtils";
import { useToast } from "../../context/ToastContext";
import ConfirmationModal from "../../components/common/ConfirmationModal";
import usePermissions from "../../hooks/usePermissions";
import "./Invoices.css";

const Invoices = () => {
    const navigate = useNavigate();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, data: null, message: "" });
    const { showToast } = useToast();
    const { canEdit, canDelete } = usePermissions("grn");

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

    const handleDeleteClick = (invoice) => {
        setConfirmModal({
            isOpen: true,
            data: invoice,
            message: `Are you sure you want to delete invoice ${invoice.invoiceNumber}? This action cannot be undone.`
        });
        setIsModalOpen(false);
    };

    const handleConfirmDelete = async () => {
        try {
            const userId = await getUserId();
            const invoiceId = confirmModal.data.id || confirmModal.data._id;
            await softDeleteGRN(invoiceId, userId);
            showToast("success", "Invoice deleted successfully");
            fetchInvoices(currentPage);
        } catch (error) {
            console.error("Error deleting invoice:", error);
            showToast("error", "Failed to delete invoice");
        } finally {
            setConfirmModal({ isOpen: false, data: null, message: "" });
            setIsModalOpen(false);
        }
    };

    const handleEditClick = (invoice) => {
        navigate("/grn-window", { state: { editInvoice: invoice } });
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

            {isModalOpen && selectedInvoice && (
                <div className="invoice-modal-overlay">
                    <div className="invoice-modal-content">
                        <div className="modal-header">
                            <h3>Invoice Details - {selectedInvoice.invoiceNumber}</h3>
                            <div className="modal-header-actions" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                {canEdit && (
                                    <button className="edit-action-btn" onClick={() => handleEditClick(selectedInvoice)}>
                                        <Edit size={20} />
                                        <span>Edit</span>
                                    </button>
                                )}
                                {canDelete && (
                                    <button className="delete-action-btn" onClick={() => handleDeleteClick(selectedInvoice)}>
                                        <Trash2 size={20} />
                                        <span>Delete</span>
                                    </button>
                                )}
                                <button className="close-modal-btn" onClick={() => setIsModalOpen(false)}>
                                    <X size={24} />
                                </button>
                            </div>
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
                                                <th>Pack Size</th>
                                                <th className="text-right">Purchase Price</th>
                                                <th className="text-right">MRP Value</th>
                                                <th className="text-center">Quantity</th>
                                                <th className="text-right">Discount %</th>
                                                <th className="text-right">Discounted Price</th>
                                                <th className="text-right">Total Amount (LKR)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(selectedInvoice.items || []).map((item, idx) => (
                                                <React.Fragment key={idx}>
                                                    <tr>
                                                        <td>{item.productName || item.product?.name || "Product N/A"}</td>
                                                        <td>{item.packSize || "-"}</td>
                                                        <td className="text-right">{parseFloat(item.purchasePrice).toFixed(2)}</td>
                                                        <td className="text-right">{parseFloat(item.mrpValue || 0).toFixed(2)}</td>
                                                        <td className="text-center">{item.quantity}</td>
                                                        <td className="text-right">{parseFloat(item.discountPercentage || 0).toFixed(2)}%</td>
                                                        <td className="text-right">{parseFloat(item.discountValue || item.discountedPrice || item.purchasePrice).toFixed(2)}</td>
                                                        <td className="text-right">{parseFloat(item.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                    </tr>
                                                    {parseFloat(item.bonus || 0) > 0 && (
                                                        <tr className="bonus-row">
                                                            <td>{item.productName || item.product?.name || "Product N/A"}</td>
                                                            <td>{item.packSize || "-"}</td>
                                                            <td className="text-right">0.00</td>
                                                            <td className="text-right">0.00</td>
                                                            <td className="text-center">{item.bonus}</td>
                                                            <td className="text-right">0.00%</td>
                                                            <td className="text-right">0.00</td>
                                                            <td className="text-right">0.00</td>
                                                        </tr>
                                                    )}
                                                </React.Fragment>
                                            ))}
                                            <tr className="total-row">
                                                <td>Total</td>
                                                <td></td>
                                                <td></td>
                                                <td></td>
                                                <td></td>
                                                <td></td>
                                                <td className="text-right">{parseFloat(selectedInvoice.grandTotal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={handleConfirmDelete}
                message={confirmModal.message}
                confirmLabel="Yes, Delete"
            />
        </Layout>
    );
};

export default Invoices;
