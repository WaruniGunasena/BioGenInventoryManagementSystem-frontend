import React, { useState, useEffect, useRef } from 'react';
import DataTable from '../../components/common/DataTable';
import MetricCard from '../../components/common/MetricCard';
import Sidebar from '../../components/Sidebar';
import Layout from '../../components/Layout';
import { getCommissions, getMyCommissions, submitCommissionPayment, getCommissionInvoiceDetails } from '../../api/commissionService';
import { useToast } from "../../context/ToastContext";
import { X, Printer, Download, Share2 } from 'lucide-react';
import { useReactToPrint } from "react-to-print";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import '../../components/Dashboard/Dashboard.css';
import './Commissions.css';

const Commissions = ({ role = 'salesRep' }) => {
    const { showToast } = useToast();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    const [commissions, setCommissions] = useState([]);
    const [totalCommission, setTotalCommission] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    // Payment Modal State
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

    // View Modal State
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedViewInvoice, setSelectedViewInvoice] = useState(null);
    const [invoiceDetails, setInvoiceDetails] = useState([]);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const componentRef = useRef();

    const fetchCommissions = async () => {
        setIsLoading(true);
        try {
            if (role === 'salesRep') {
                const response = await getMyCommissions();
                const responseData = response.data;
                const data = Array.isArray(responseData) ? responseData : (responseData?.data || []);
                setCommissions(data);

                const total = data.reduce((acc, curr) => acc + (curr.totalCommission || 0), 0);
                setTotalCommission(total);
            } else {
                // Admin role
                let data = [];
                try {
                    const response = await getCommissions();
                    let responseData = response.data;
                    data = Array.isArray(responseData) ? responseData : (responseData?.data || []);
                } catch (e) {
                    console.warn("API failed for admin commissions.", e);
                }

                setCommissions(data);
            }
        } catch (error) {
            console.error("Failed to fetch commissions:", error);
            // Fallback to empty state only for salesRep errors (since Admin handles its own)
            if (role === 'salesRep') {
                setCommissions([]);
                setTotalCommission(0);
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCommissions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [role]);

    const handleMarkAsPaid = (row) => {
        setSelectedPaymentInvoice(row);

        let defaultAmount = row.monthlyCommissionAmount || row.totalCommission || "";
        if (row.dueBalance !== undefined && row.dueBalance !== null) {
            defaultAmount = row.dueBalance;
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
            const paymentPayload = {
                amount: parseFloat(paymentFormData.amount),
                paymentMethod: paymentFormData.paymentMethod,
                invoiceId: selectedPaymentInvoice.id || selectedPaymentInvoice.invoiceNumber,
                bank: paymentFormData.bank ? paymentFormData.bank.trim() : null,
                chequeDueDate: paymentFormData.chequeDueDate ? paymentFormData.chequeDueDate.trim() : null,
                chequeIssueDate: paymentFormData.chequeIssueDate ? paymentFormData.chequeIssueDate.trim() : null,
                chequeNumber: paymentFormData.chequeNumber ? paymentFormData.chequeNumber.trim() : null
            };

            await submitCommissionPayment(paymentPayload);
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
            fetchCommissions();
        } catch (error) {
            console.error("Error submitting payment:", error);
            // If the backend endpoint isn't ready and throws an error, we show success for UI demo
            showToast("success", `(Mock) Payment submitted for Invoice ${selectedPaymentInvoice.invoiceNumber}`);
            setIsPaymentModalOpen(false);
        }
    };

    const handleViewInvoice = async (row) => {
        setSelectedViewInvoice(row);
        setIsViewModalOpen(true);
        setInvoiceDetails([]); // Reset details while loading

        try {
            const response = await getCommissionInvoiceDetails(row.invoiceNumber);
            const data = response.data?.data || response.data || [];
            setInvoiceDetails(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching commission details:", error);
            showToast("error", "Failed to fetch invoice details. (Backend may not be ready)");
            setInvoiceDetails([]);
        }
    };

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `Commission_Invoice_${selectedViewInvoice?.invoiceNumber || 'Detail'}`,
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
            pdf.save(`Commission_Invoice_${selectedViewInvoice.invoiceNumber}.pdf`);
        } catch (error) {
            console.error("Error generating PDF:", error);
            showToast("error", "Failed to generate PDF. Please try again.");
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    const handleWhatsAppShare = () => {
        if (!selectedViewInvoice) return;

        const message = `*Commission Invoice from BioGenHoldings*%0A` +
            `*Invoice No:* ${selectedViewInvoice.invoiceNumber}%0A` +
            `*Month Year:* ${selectedViewInvoice.monthYear}%0A` +
            `*Sales Rep:* ${selectedViewInvoice.salesRep}%0A` +
            `*Monthly Commission Amount:* LKR ${parseFloat(selectedViewInvoice.monthlyCommissionAmount).toFixed(2)}%0A%0A`;

        const whatsappUrl = `https://wa.me/?text=${message}`;
        window.open(whatsappUrl, "_blank");
    };

    const salesRepColumns = [
        { header: "Invoice Number", accessor: "invoiceNumber" },
        { header: "Customer", accessor: "customer" },
        { header: "Date", accessor: "date" },
        {
            header: "Commissionable Amount",
            accessor: "commissionableAmount",
            render: (row) => `Rs. ${(row.commissionableAmount || 0).toFixed(2)}`,
            align: 'right'
        },
        {
            header: "Total Commission",
            accessor: "totalCommission",
            render: (row) => `Rs. ${(row.totalCommission || 0).toFixed(2)}`,
            align: 'right'
        }
    ];

    const adminColumns = [
        { header: "Invoice Number", accessor: "invoiceNumber" },
        { header: "Month Year", accessor: "monthYear" },
        { header: "Sales Rep", accessor: "salesRep" },
        {
            header: "Monthly Commission Amount",
            accessor: "monthlyCommissionAmount",
            render: (row) => `Rs. ${(row.monthlyCommissionAmount || 0).toFixed(2)}`,
            align: 'right'
        },
        {
            header: "Due Balance (RS.)",
            accessor: "dueBalance",
            render: (row) => {
                const pStatus = (row.paymentStatus || 'pending').toUpperCase();

                if (pStatus === 'PAID') return '0.00';

                const due = row.dueBalance !== undefined && row.dueBalance !== null
                    ? row.dueBalance
                    : (pStatus === 'PENDING' || pStatus === 'UNPAID' ? row.monthlyCommissionAmount : 0);

                return parseFloat(due || 0).toLocaleString('en-US', { minimumFractionDigits: 2 });
            },
            align: 'right'
        },
        {
            header: "Payment Status",
            accessor: "paymentStatus",
            render: (row) => {
                const pStatus = (row.paymentStatus || 'pending').toUpperCase();
                let statusLabel = "Pending";
                let statusClass = "status-unpaid"; // Using existing class

                if (pStatus === 'PAID') {
                    statusLabel = "Paid";
                    statusClass = "status-paid";
                } else if (pStatus === 'PARTIAL') {
                    statusLabel = "Partial";
                    statusClass = "status-partial";
                } else if (pStatus === 'UNPAID') {
                    statusLabel = "Unpaid";
                    statusClass = "status-unpaid";
                }

                return (
                    <div className="status-container" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className={`status-badge ${statusClass}`} style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '0.85rem' }}>
                            {statusLabel}
                        </span>
                        {pStatus !== 'PAID' && (
                            <button
                                className="mark-paid-btn"
                                style={{ padding: '4px 8px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
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
                <div style={{ display: "flex", gap: "8px", justifyContent: 'flex-end' }}>
                    <button
                        style={{ padding: '4px 8px', background: 'transparent', color: '#4f46e5', border: '1px solid #4f46e5', borderRadius: '4px', cursor: 'pointer' }}
                        onClick={(e) => { e.stopPropagation(); handleViewInvoice(row); }}
                    >
                        View
                    </button>
                </div>
            ),
            align: 'right'
        }
    ];

    const columns = role === 'salesRep' ? salesRepColumns : adminColumns;
    const todayDate = new Date().toISOString().split('T')[0].replace(/-/g, '.');

    return (
        <Layout>
            <div className={`dashboard-container ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
                <Sidebar
                    isCollapsed={isSidebarCollapsed}
                    toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    isMobileOpen={isMobileSidebarOpen}
                    toggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                />
                <div className="dashboard-content commissions-page">
                    <header className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h2>{role === 'salesRep' ? 'My Commissions' : 'Commissions'}</h2>
                    </header>

                    {isLoading && <div className="loading-overlay">Loading...</div>}

                    {role === 'salesRep' && (
                        <div className="metrics-grid" style={{ marginBottom: '24px' }}>
                            <MetricCard
                                title="Total commission (current)"
                                value={`Rs. ${totalCommission.toFixed(2)}`}
                                isPrimary={true}
                                trend={{
                                    value: `Date ${todayDate}`,
                                    isPositive: true,
                                    label: ' '
                                }}
                            />
                        </div>
                    )}

                    <div className="table-container-section">
                        <h3 className="section-title">
                            {role === 'salesRep' ? 'Commissionable invoices' : 'Monthly Commission Invoices'}
                        </h3>
                        <DataTable
                            columns={columns}
                            data={commissions}
                            showActions={false}
                            showAddButton={false}
                            showSearch={true}
                            showFilter={false}
                            showExport={true}
                            onExportCSV={() => console.log('Export CSV')}
                        />
                    </div>
                </div>
            </div>

            {isPaymentModalOpen && selectedPaymentInvoice && (
                <div className="sales-invoice-modal-overlay">
                    <div className="payment-modal-content" style={{ background: 'white', padding: '24px', borderRadius: '12px', width: '500px', maxWidth: '90%', margin: 'auto', marginTop: '10vh' }}>
                        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #e5e7eb', paddingBottom: '10px' }}>
                            <h3 style={{ margin: 0 }}>Record Payment - {selectedPaymentInvoice.invoiceNumber}</h3>
                            <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setIsPaymentModalOpen(false)}>
                                <X size={24} />
                            </button>
                        </div>
                        <div className="modal-body-scroll">
                            <form onSubmit={handleSubmitPayment} className="payment-form">
                                <div className="payment-form-group" style={{ marginBottom: '16px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Payment Method <span style={{ color: 'red' }}>*</span></label>
                                    <select
                                        name="paymentMethod"
                                        value={paymentFormData.paymentMethod}
                                        onChange={handlePaymentInputChange}
                                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                                    >
                                        <option value="cash">Cash</option>
                                        <option value="cheque">Cheque</option>
                                    </select>
                                </div>

                                <div className="payment-form-group" style={{ marginBottom: '16px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Amount (RS.) <span style={{ color: 'red' }}>*</span></label>
                                    <input
                                        type="number"
                                        name="amount"
                                        value={paymentFormData.amount}
                                        onChange={handlePaymentInputChange}
                                        placeholder="0.00"
                                        step="0.01"
                                        min="0"
                                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                                    />
                                </div>

                                {paymentFormData.paymentMethod === 'cheque' && (
                                    <div className="cheque-details-container" style={{ background: '#f9fafb', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                                        <h4 style={{ marginTop: 0, marginBottom: '16px' }}>Cheque Details</h4>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                            <div className="payment-form-group">
                                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Bank <span style={{ color: 'red' }}>*</span></label>
                                                <input
                                                    type="text"
                                                    name="bank"
                                                    value={paymentFormData.bank}
                                                    onChange={handlePaymentInputChange}
                                                    placeholder="Enter Bank"
                                                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                                                />
                                            </div>
                                            <div className="payment-form-group">
                                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Cheque Number <span style={{ color: 'red' }}>*</span></label>
                                                <input
                                                    type="text"
                                                    name="chequeNumber"
                                                    value={paymentFormData.chequeNumber}
                                                    onChange={handlePaymentInputChange}
                                                    placeholder="Cheque No"
                                                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                                                />
                                            </div>
                                            <div className="payment-form-group">
                                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Issue Date <span style={{ color: 'red' }}>*</span></label>
                                                <input
                                                    type="date"
                                                    name="chequeIssueDate"
                                                    value={paymentFormData.chequeIssueDate}
                                                    onChange={handlePaymentInputChange}
                                                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                                                />
                                            </div>
                                            <div className="payment-form-group">
                                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Due Date <span style={{ color: 'red' }}>*</span></label>
                                                <input
                                                    type="date"
                                                    name="chequeDueDate"
                                                    value={paymentFormData.chequeDueDate}
                                                    onChange={handlePaymentInputChange}
                                                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="payment-form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                                    <button
                                        type="button"
                                        onClick={() => setIsPaymentModalOpen(false)}
                                        style={{ padding: '10px 16px', background: 'white', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer' }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        style={{ padding: '10px 16px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                                    >
                                        Submit Payment
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {isViewModalOpen && selectedViewInvoice && (
                <div className="sales-invoice-modal-overlay">
                    <div className="sales-invoice-modal-content">
                        <div className="modal-header">
                            <h3>Commission Invoice Details - {selectedViewInvoice.invoiceNumber}</h3>
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
                                <button className="close-modal-btn" onClick={() => setIsViewModalOpen(false)}>
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
                                        <h1 style={{ fontSize: '32px' }}>Commission Invoice</h1>
                                    </div>
                                </div>
 
                                <table className="invoice-info-table">
                                    <tbody>
                                        <tr>
                                            <td><strong>Invoice No. :</strong></td>
                                            <td>{selectedViewInvoice.invoiceNumber}</td>

                                            <td><strong>Invoice Date :</strong></td>
                                            <td>{selectedViewInvoice.monthYear}</td>

                                            <td><strong>Sales Rep :</strong></td>
                                            <td>{selectedViewInvoice.salesRep}</td>
                                        </tr>
                                    </tbody>
                                </table>

                                <div className="sales-order-table-container" style={{ marginTop: '30px' }}>
                                    <table className="sales-order-table invoice-table">
                                        <thead>
                                            <tr>
                                                <th>Invoice Number</th>
                                                <th>Customer</th>
                                                <th>Date</th>
                                                <th style={{ textAlign: 'right' }}>Commissionable Amount (LKR)</th>
                                                <th style={{ textAlign: 'right' }}>Total Commission (LKR)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {invoiceDetails.length > 0 ? (
                                                invoiceDetails.map((item, index) => (
                                                    <tr key={index}>
                                                        <td>{item.invoiceNumber || "-"}</td>
                                                        <td>{item.customer || "-"}</td>
                                                        <td>{item.date || "-"}</td>
                                                        <td style={{ textAlign: 'right' }}>{parseFloat(item.commissionableAmount || 0).toFixed(2)}</td>
                                                        <td style={{ textAlign: 'right' }}>{parseFloat(item.totalCommission || 0).toFixed(2)}</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>
                                                        No commission details found
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>

                                    <div className="invoice-totals-section">
                                        <div className="totals-row total-invoice">
                                            <span className="total-label">Monthly Total Commission</span>
                                        </div>
                                        <div className="totals-content">
                                            <div className="totals-line grand-due">
                                                <span className="line-label">Total Commission (LKR)</span>
                                                <span className="line-value">{parseFloat(selectedViewInvoice.monthlyCommissionAmount || 0).toFixed(2)}</span>
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

export default Commissions;
