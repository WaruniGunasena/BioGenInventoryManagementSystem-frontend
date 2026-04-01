import React, { useState, useEffect, useRef } from "react";
import Layout from "../../components/Layout";
import Sidebar from "../../components/Sidebar";
import DataTable from "../../components/common/DataTable";
import { X, FileText, Printer, Download, Share2, Trash2, Check, Edit } from "lucide-react";
import { useReactToPrint } from "react-to-print";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { getPaginatedSalesOrders, searchSalesOrder, softDeleteSalesOrder, approveSalesOrder, submitSalesOrderPayment } from "../../api/salesOrderService";
import { getUserId, getUserRole } from "../../components/common/Utils/userUtils/userUtils";
import { useToast } from "../../context/ToastContext";
import { useNavigate } from "react-router-dom";
import "./SalesInvoices.css";

const SalesInvoices = () => {
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [userRole, setUserRole] = useState(null);

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

    const componentRef = useRef();

    const [invoices, setInvoices] = useState([]);
    // eslint-disable-next-line no-unused-vars
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [pageSize] = useState(8);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        getUserId().then(setCurrentUserId).catch(console.error);
        getUserRole().then(setUserRole).catch(console.error);
    }, []);

    useEffect(() => {
        if (searchQuery) {
            handleSearch(searchQuery);
        } else {
            fetchInvoices(currentPage);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
                    invoiceNumber: item.invoiceNumber || "N/A",
                    creditTerm: item.creditTerm || "N/A"
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
                invoiceNumber: item.invoiceNumber || "N/A",
                creditTerm: item.creditTerm || "N/A"
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

    const handleSoftDelete = async (invoice) => {
        const invoiceId = invoice.salesOrderId || invoice.id;
        if (!invoiceId) { showToast("error", "Cannot identify invoice ID"); return; }
        if (!currentUserId) { showToast("error", "User not identified"); return; }
        if (!window.confirm(`Delete invoice ${invoice.invoiceNumber}? This action cannot be undone.`)) return;

        try {
            await softDeleteSalesOrder(invoiceId, currentUserId);
            showToast("success", `Invoice ${invoice.invoiceNumber} deleted`);
            setIsModalOpen(false); 
            fetchInvoices(currentPage);
        } catch (error) {
            showToast("error", error?.response?.data?.message || "Failed to delete invoice");
        }
    };

    const handleApproval = async (status) => {
        if (!selectedInvoice || !currentUserId) return;
        const invoiceId = selectedInvoice.salesOrderId || selectedInvoice.id;

        try {
            await approveSalesOrder(status, currentUserId, invoiceId);
            showToast("success", `Invoice ${status} successfully`);
            window.dispatchEvent(new Event("invoiceStatusChanged"));
            setIsModalOpen(false);
            fetchInvoices(currentPage);
        } catch (error) {
            showToast("error", error?.response?.data?.message || `Failed to ${status} invoice`);
        }
    };

    const handleMarkAsPaid = (invoice) => {
        setSelectedPaymentInvoice(invoice);
        let defaultAmount = invoice.netTotal || "";
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
            const userId = currentUserId || await getUserId();
            const salesOrderId = selectedPaymentInvoice.salesOrderId || selectedPaymentInvoice.id;

            const paymentPayload = {
                amount: parseFloat(paymentFormData.amount),
                paymentMethod: paymentFormData.paymentMethod,
                salesOrderId: salesOrderId,
                grandTotal: selectedPaymentInvoice.netTotal,
                userId: userId,
                bank: paymentFormData.bank ? paymentFormData.bank.trim() : null,
                chequeDueDate: paymentFormData.chequeDueDate ? paymentFormData.chequeDueDate.trim() : null,
                chequeIssueDate: paymentFormData.chequeIssueDate ? paymentFormData.chequeIssueDate.trim() : null,
                chequeNumber: paymentFormData.chequeNumber ? paymentFormData.chequeNumber.trim() : null
            };

            await submitSalesOrderPayment(paymentPayload);
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

    const handleEditOpen = (invoice) => {
        const role = invoice?.user?.role || invoice?.role;
        if (role === "SALES_REP") {
            navigate("/sales-invoices/edit", { state: { invoice } });
        } else {
            navigate("/sales-invoices/edit-so", { state: { invoice } });
        }
    };

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `Invoice_${selectedInvoice?.invoiceNumber || 'Detail'}`,
    });

    const handleDownloadPDF = async () => {
        if (!componentRef.current) return;
        setIsGeneratingPDF(true);
        try {
            const canvas = await html2canvas(componentRef.current, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: "#ffffff",
            });
            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF("p", "mm", "a4");
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Invoice_${selectedInvoice.invoiceNumber}.pdf`);
        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("Failed to generate PDF. Please try again.");
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    const handleWhatsAppShare = () => {
        if (!selectedInvoice) return;

        const message = `*Invoice from BioGenHoldings*%0A` +
            `*Invoice No:* ${selectedInvoice.invoiceNumber}%0A` +
            `*Date:* ${selectedInvoice.date}%0A` +
            `*Customer:* ${selectedInvoice.customerName}%0A` +
            `*Total:* LKR ${parseFloat(selectedInvoice.netTotal).toFixed(2)}%0A%0A` +
            `Thank you for your business!`;

        const whatsappUrl = `https://wa.me/?text=${message}`;
        window.open(whatsappUrl, "_blank");
    };

    const handlePercentageValueCalculation = (value, percentage) => {
        return value * (percentage / 100);
    };

    const getStatusBadge = (status) => {
        const map = {
            Approved: { label: "Approved", cls: "si-badge si-badge--approved" },
            Pending: { label: "Pending", cls: "si-badge si-badge--pending" },
            Rejected: { label: "Rejected", cls: "si-badge si-badge--rejected" },
            Deleted: { label: "Deleted", cls: "si-badge si-badge--deleted" },
        };
        const s = map[status] || { label: status || "Unknown", cls: "si-badge si-badge--default" };
        return <span className={s.cls}>{s.label}</span>;
    };

    const columns = [
        { header: "Invoice Number", accessor: "invoiceNumber" },
        { header: "Customer", accessor: "customerName" },
        { header: "Date", accessor: "date" },
        {
            header: "Grand Total (RS.)",
            accessor: "netTotal",
            render: (row) => parseFloat(row.netTotal).toLocaleString('en-US', { minimumFractionDigits: 2 })
        },
        {
            header: "Due Balance (RS.)",
            accessor: "dueBalance",
            render: (row) => {
                const pStatus = (row.paymentStatus || 'pending').toUpperCase();
                
                if (pStatus === 'PAID') return '0.00';
                
                const due = row.dueBalance !== undefined && row.dueBalance !== null 
                                ? row.dueBalance 
                                : (pStatus === 'PENDING' ? row.netTotal : 0);
                                
                return parseFloat(due || 0).toLocaleString('en-US', { minimumFractionDigits: 2 });
            }
        },
        {
            header: "Payment Status",
            accessor: "paymentStatus",
            render: (row) => {
                const pStatus = (row.paymentStatus || 'pending').toUpperCase();
                let statusLabel = "Pending";
                let statusClass = "status-unpaid";

                if (pStatus === 'PAID') {
                    statusLabel = "Paid";
                    statusClass = "status-paid";
                } else if (pStatus === 'PARTIAL') {
                    statusLabel = "Partial";
                    statusClass = "status-partial";
                }

                return (
                    <div className="status-container">
                        <span className={`status-badge ${statusClass}`}>
                            {statusLabel}
                        </span>
                        {row.status === "Approved" && (pStatus === 'PENDING' || pStatus === 'PARTIAL') && (
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
            header: "Status",
            accessor: "status",
            render: (row) => getStatusBadge(row.status)
        },
        {
            header: "Action",
            accessor: "action",
            render: (row) => (
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <button className="view-link-btn" onClick={() => handleViewDetails(row)}>view</button>
                </div>
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
                            <div className="modal-actions">

                                <button className="action-btn btn-print" onClick={handlePrint}>
                                    <Printer size={18} /> Print
                                </button>
                                <button
                                    className="action-btn btn-download"
                                    onClick={handleDownloadPDF}
                                    disabled={isGeneratingPDF}
                                >
                                    <Download size={18} /> {isGeneratingPDF ? "Generating..." : "Download"}
                                </button>
                                <button className="action-btn btn-whatsapp" onClick={handleWhatsAppShare}>
                                    <Share2 size={18} /> WhatsApp
                                </button>
                                <button className="close-modal-btn" onClick={() => setIsModalOpen(false)}>
                                    <X size={24} />
                                </button>
                            </div>
                        </div>
                        <div className="modal-body-scroll">
                            <div className="sales-order-summary-section" ref={componentRef}>
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
                                                <span className="line-value">{selectedInvoice.additionalDiscountValue > 0 ? (
                                                    selectedInvoice.additionalDiscountType === 'percentage'
                                                        ? `${handlePercentageValueCalculation(selectedInvoice.grandTotal, selectedInvoice.additionalDiscountValue).toFixed(2)} (${selectedInvoice.additionalDiscountValue}%)`
                                                        : `${parseFloat(selectedInvoice.additionalDiscountValue).toFixed(2)}`
                                                ) : "0.00"}</span>
                                            </div>
                                            {selectedInvoice.courierCharges > 0 && (
                                                <div className="totals-line">
                                                    <span className="line-label">Courier Charges (LKR)</span>
                                                    <span className="line-value">{parseFloat(selectedInvoice.courierCharges).toFixed(2)}</span>
                                                </div>
                                            )}
                                            <div className="totals-line grand-due">
                                                <span className="line-label">Due (LKR)</span>
                                                <span className="line-value">{parseFloat(selectedInvoice.netTotal).toFixed(2)}</span>
                                            </div>

                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <div className="modal-footer-actions">
                                {(userRole === "ADMIN" || userRole === "INVENTORY_MANAGER") && selectedInvoice.status === "Pending" && (
                                    <>
                                        <button className="action-btn btn-approve" onClick={() => handleApproval("Approved")}>
                                            <Check size={18} /> Approve
                                        </button>
                                        <button className="action-btn btn-reject" onClick={() => handleApproval("Rejected")}>
                                            <X size={18} /> Reject
                                        </button>
                                    </>
                                )}
                                {selectedInvoice.status === "Pending" && (
                                    <button className="action-btn btn-edit" onClick={() => handleEditOpen(selectedInvoice)}>
                                        <Edit size={18} /> Edit
                                    </button>
                                )}
                                {selectedInvoice.status !== "Deleted" && (
                                    <button className="action-btn btn-delete" onClick={() => handleSoftDelete(selectedInvoice)}>
                                        <Trash2 size={18} /> Delete
                                    </button>
                                )}
                                <button className="action-btn btn-close-footer" onClick={() => setIsModalOpen(false)}>
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {isPaymentModalOpen && selectedPaymentInvoice && (
                <div className="sales-invoice-modal-overlay">
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

export default SalesInvoices;
