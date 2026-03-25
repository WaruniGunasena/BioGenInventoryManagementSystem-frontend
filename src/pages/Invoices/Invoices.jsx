import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import Sidebar from "../../components/Sidebar";
import DataTable from "../../components/common/DataTable";
import { X, FileText, Edit, Trash2 } from "lucide-react";
import { getPaginatedGRNs, searchGRN, softDeleteGRN, submitGRNPayment } from "../../api/grnService";
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

    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedPaymentInvoice, setSelectedPaymentInvoice] = useState(null);
    const [paymentFormData, setPaymentFormData] = useState({
        paymentMethod: "cash",
        amount: "",
        chequeIssueDate: "",
        chequeDueDate: "",
        bank: "",
        chequeNumber: ""
    });

    const { showToast } = useToast();
    const { canEdit, canDelete } = usePermissions("grn");

    const [invoices, setInvoices] = useState([]);

    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [pageSize] = useState(8);
    const [searchQuery, setSearchQuery] = useState("");

    const fetchInvoices = useCallback(async (page) => {
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
    }, [pageSize]);

    const handleSearch = useCallback(async (query) => {
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
    }, [fetchInvoices]);

    useEffect(() => {
        if (searchQuery) {
            handleSearch(searchQuery);
        } else {
            fetchInvoices(currentPage);
        }
    }, [currentPage, searchQuery, fetchInvoices, handleSearch]);

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


    const handleMarkAsPaid = (invoice) => {
        setSelectedPaymentInvoice(invoice);
        let defaultAmount = invoice.grandTotal || "";
        if (invoice.dueBalance !== undefined && invoice.dueBalance !== null) {
            defaultAmount = invoice.dueBalance;
        }

        setPaymentFormData(prev => ({
            ...prev,
            amount: defaultAmount
        }));
        setIsPaymentModalOpen(true);
    };

    const handlePaymentInputChange = (e) => {
        const { name, value } = e.target;
        setPaymentFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmitPayment = async (e) => {
        e.preventDefault();

        if (!paymentFormData.amount || isNaN(parseFloat(paymentFormData.amount)) || parseFloat(paymentFormData.amount) <= 0) {
            showToast("error", "Please enter a valid payment amount.");
            return;
        }

        if (paymentFormData.paymentMethod === 'cheque') {
            if (!paymentFormData.chequeIssueDate || !paymentFormData.chequeDueDate || !paymentFormData.bank || !paymentFormData.chequeNumber) {
                showToast("error", "Please fill all cheque details.");
                return;
            }
        }

        try {
            const userId = await getUserId();

            const paymentPayload = {
                amount: parseFloat(paymentFormData.amount),
                paymentMethod: paymentFormData.paymentMethod,
                grnId: selectedPaymentInvoice.id || selectedPaymentInvoice._id,
                grandTotal: selectedPaymentInvoice.grandTotal,
                userId: userId,
                bank: paymentFormData.bank ? paymentFormData.bank.trim() : null,
                chequeDueDate: paymentFormData.chequeDueDate ? paymentFormData.chequeDueDate.trim() : null,
                chequeIssueDate: paymentFormData.chequeIssueDate ? paymentFormData.chequeIssueDate.trim() : null,
                chequeNumber: paymentFormData.chequeNumber ? paymentFormData.chequeNumber.trim() : null
            };

            await submitGRNPayment(paymentPayload);
            showToast("success", `Payment submitted for Invoice ${selectedPaymentInvoice.invoiceNumber}`);

            setIsPaymentModalOpen(false);
            setPaymentFormData({
                paymentMethod: "cash",
                amount: "",
                chequeIssueDate: "",
                chequeDueDate: "",
                bank: "",
                chequeNumber: ""
            });
            fetchInvoices(currentPage);

        } catch (error) {
            console.error("Error submitting payment:", error);
            showToast("error", "Failed to submit payment");
        }
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
            header: "Due Balance (RS.)",
            accessor: "dueBalance",
            render: (row) => {
                const status = (row.paymentStatus || 'unpaid').toUpperCase();
                
                if (status === 'PAID') return '0.00';
                
                const due = row.dueBalance !== undefined && row.dueBalance !== null 
                                ? row.dueBalance 
                                : (status === 'UNPAID' ? row.grandTotal : 0);
                                
                return parseFloat(due || 0).toLocaleString('en-US', { minimumFractionDigits: 2 });
            }
        },
        {
            header: "Payment Status",
            accessor: "paymentStatus",
            render: (row) => {
                const status = (row.paymentStatus || 'unpaid').toUpperCase();
                let statusLabel = "Unpaid";
                let statusClass = "status-unpaid";

                if (status === 'PAID') {
                    statusLabel = "Paid";
                    statusClass = "status-paid";
                } else if (status === 'PARTIAL') {
                    statusLabel = "Pending";
                    statusClass = "status-partial";
                }

                return (
                    <div className="status-container">
                        <span className={`status-badge ${statusClass}`}>
                            {statusLabel}
                        </span>
                        {(status === 'UNPAID' || status === 'PARTIAL') && (
                            <button
                                className="mark-paid-btn"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleMarkAsPaid(row);
                                }}
                                title="Pay"
                            >
                                Pay
                            </button>
                        )}
                    </div>
                );
            }
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

                        {loading && <div className="loading-overlay">Loading...</div>}

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
                                {canEdit && selectedInvoice.paymentStatus?.toUpperCase() !== 'PAID' && (
                                    <button className="edit-action-btn" onClick={() => handleEditClick(selectedInvoice)}>
                                        <Edit size={20} />
                                        <span>Edit</span>
                                    </button>
                                )}
                                {canDelete && selectedInvoice.paymentStatus?.toUpperCase() !== 'PAID' && (
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

            {isPaymentModalOpen && selectedPaymentInvoice && (
                <div className="invoice-modal-overlay">
                    <div className="payment-modal-content">
                        <div className="modal-header">
                            <h3>Record Payment - {selectedPaymentInvoice.invoiceNumber}</h3>
                            <button className="close-modal-btn" onClick={() => setIsPaymentModalOpen(false)}>
                                <X size={24} />
                            </button>
                        </div>
                        <div className="modal-body-scroll">
                            <form onSubmit={handleSubmitPayment} className="payment-form">
                                <div className="payment-form-group">
                                    <label>Payment Method <span className="text-red-500">*</span></label>
                                    <select
                                        name="paymentMethod"
                                        value={paymentFormData.paymentMethod}
                                        onChange={handlePaymentInputChange}
                                        className="payment-input"
                                    >
                                        <option value="cash">Cash</option>
                                        <option value="cheque">Cheque</option>
                                    </select>
                                </div>

                                <div className="payment-form-group">
                                    <label>Amount (RS.) <span className="text-red-500">*</span></label>
                                    <input
                                        type="number"
                                        name="amount"
                                        value={paymentFormData.amount}
                                        onChange={handlePaymentInputChange}
                                        placeholder="0.00"
                                        className="payment-input"
                                        step="0.01"
                                        min="0"
                                    />
                                </div>

                                {paymentFormData.paymentMethod === 'cheque' && (
                                    <div className="cheque-details-container">
                                        <h4>Cheque Details</h4>
                                        <div className="payment-grid">
                                            <div className="payment-form-group">
                                                <label>Bank <span className="text-red-500">*</span></label>
                                                <input
                                                    type="text"
                                                    name="bank"
                                                    value={paymentFormData.bank}
                                                    onChange={handlePaymentInputChange}
                                                    placeholder="Enter Bank Name"
                                                    className="payment-input"
                                                />
                                            </div>
                                            <div className="payment-form-group">
                                                <label>Cheque Number <span className="text-red-500">*</span></label>
                                                <input
                                                    type="text"
                                                    name="chequeNumber"
                                                    value={paymentFormData.chequeNumber}
                                                    onChange={handlePaymentInputChange}
                                                    placeholder="Enter Cheque Number"
                                                    className="payment-input"
                                                />
                                            </div>
                                            <div className="payment-form-group">
                                                <label>Issue Date <span className="text-red-500">*</span></label>
                                                <input
                                                    type="date"
                                                    name="chequeIssueDate"
                                                    value={paymentFormData.chequeIssueDate}
                                                    onChange={handlePaymentInputChange}
                                                    className="payment-input"
                                                />
                                            </div>
                                            <div className="payment-form-group">
                                                <label>Due Date <span className="text-red-500">*</span></label>
                                                <input
                                                    type="date"
                                                    name="chequeDueDate"
                                                    value={paymentFormData.chequeDueDate}
                                                    onChange={handlePaymentInputChange}
                                                    className="payment-input"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="payment-form-actions">
                                    <button type="button" className="btn-secondary" onClick={() => setIsPaymentModalOpen(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn-primary">
                                        Submit Payment
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default Invoices;
