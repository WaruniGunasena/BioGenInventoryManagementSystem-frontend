import React, { useState, useEffect, useRef } from 'react';
import DataTable from '../../components/common/DataTable';
import MetricCard from '../../components/common/MetricCard';
import Sidebar from '../../components/Sidebar';
import Layout from '../../components/Layout';
import { submitCommissionPayment, getCommissionInvoiceDetails, getPaginatedCommissions, getPaginatedMyCommissions, getPaginatedCommissionsHistory, getPaginatedMyCommissionReversals } from '../../api/commissionService';
import { getUserId } from '../../components/common/Utils/userUtils/userUtils';
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
    const [totalCommissionReversal, setTotalCommissionReversal] = useState(0);
    const [netPayout, setNetPayout] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [activeSubTab, setActiveSubTab] = useState('commissions'); 

    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [pageSize] = useState(5);

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

    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedViewInvoice, setSelectedViewInvoice] = useState(null);
    const [invoiceDetails, setInvoiceDetails] = useState({ commissions: [], reversals: [] });
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const componentRef = useRef();

    const [isViewingHistory, setIsViewingHistory] = useState(false);
    const [commissionHistory, setCommissionHistory] = useState([]);

    const fetchCommissions = async (page = 0) => {
        setIsLoading(true);
        try {
            if (role === 'salesRep') {
                if (isViewingHistory) {
                    try {
                        const userId = await getUserId();
                        const response = await getPaginatedCommissionsHistory(userId, page, pageSize);
                        if (response.data) {
                            const data = response.data.historyList || response.data.content || response.data.data || [];
                            const total = response.data.totalPages || 1;
                            setCommissionHistory(data);
                            setTotalPages(total);
                        }
                    } catch (e) {
                        console.warn("API failed for history commissions.", e);
                        setCommissionHistory([]);
                        setTotalPages(1);
                    }
                } else {
                    try {
                        const summaryResponse = await getPaginatedMyCommissions(0, 1);
                        if (summaryResponse.data) {
                            setTotalCommission(summaryResponse.data.totalAmountCommissionSalesRep || summaryResponse.data.totalCommissionSum || 0);
                            setTotalCommissionReversal(summaryResponse.data.totalAmountCommissionReversal || 0);
                            setNetPayout(summaryResponse.data.netPayout || 0);
                        }

                        let response;
                        if (activeSubTab === 'commissions') {
                            response = await getPaginatedMyCommissions(page, pageSize);
                        } else {
                            response = await getPaginatedMyCommissionReversals(page, pageSize);
                        }

                        if (response.data) {
                            const data = response.data.commissionList || response.data.reversalList || response.data.content || response.data.data || [];
                            const total = response.data.totalPages || 1;
                            setCommissions(data);
                            setTotalPages(total);
                        }
                    } catch (e) {
                        console.warn("API failed for my paginated commissions.", e);
                        setCommissions([]);
                        setTotalPages(1);
                    }
                }
            } else {
                try {
                    const response = await getPaginatedCommissions(page, pageSize);
                    if (response.data) {
                        const data = response.data.commissionList || response.data.content || response.data.data || [];
                        const total = response.data.totalPages || 1;
                        setCommissions(data);
                        setTotalPages(total);
                    }
                } catch (e) {
                    console.warn("API failed for admin commissions.", e);
                    setCommissions([]);
                    setTotalPages(1);
                }
            }
        } catch (error) {
            console.error("Failed to fetch commissions:", error);
            if (role === 'salesRep') {
                setCommissions([]);
                setTotalCommission(0);
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCommissions(currentPage);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [role, isViewingHistory, activeSubTab, currentPage]);

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
            showToast("success", `(Mock) Payment submitted for Invoice ${selectedPaymentInvoice.invoiceNumber}`);
            setIsPaymentModalOpen(false);
        }
    };

    const handleViewInvoice = async (row) => {
        setSelectedViewInvoice(row);
        setIsViewModalOpen(true);
        setInvoiceDetails({ commissions: [], reversals: [] });

        try {
            const response = await getCommissionInvoiceDetails(row.invoiceNumber);
            const resData = response.data;

            if (resData) {
                setInvoiceDetails({
                    commissions: resData.data || [],
                    reversals: resData.reversalData || []
                });
            }
        } catch (error) {
            console.error("Error fetching commission details:", error);
            showToast("error", "Failed to fetch invoice details.");
            setInvoiceDetails({ commissions: [], reversals: [] });
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

    const salesRepReversalColumns = [
        { header: "Invoice Number", accessor: "invoiceNumber" },
        { header: "Customer", accessor: "customerName" },
        {
            header: "Date",
            accessor: "invoiceDate",
            render: (row) => row.invoiceDate ? row.invoiceDate.split('T')[0] : "-"
        },
        {
            header: "Total Return Amount",
            accessor: "totalReturnAmount",
            render: (row) => `Rs. ${(row.totalReturnAmount || 0).toFixed(2)}`,
            align: 'right'
        },
        {
            header: "Total Commission Reversal",
            accessor: "totalCommissionReversal",
            render: (row) => `Rs. ${(row.totalCommissionReversal || 0).toFixed(2)}`,
            align: 'right'
        }
    ];

    const adminColumns = [
        { header: "Invoice Number", accessor: "invoiceNumber" },
        { header: "Month Year", accessor: "monthYear" },
        { header: "Sales Rep", accessor: "salesRep" },
        {
            header: "Monthly Net Payout",
            accessor: "netPayout",
            render: (row) => `Rs. ${(row.netPayout || 0).toFixed(2)}`,
            align: 'right'
        },
        {
            header: "Due Balance",
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
                let statusClass = "status-unpaid";

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

    const salesRepHistoryColumns = [
        { header: "Invoice Number", accessor: "invoiceNumber" },
        { header: "Month Year", accessor: "monthYear" },
        {
            header: "Net Payout",
            accessor: "netPayout",
            render: (row) => `Rs. ${(row.netPayout || 0).toFixed(2)}`,
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
                    : (pStatus === 'PENDING' || pStatus === 'UNPAID' ? row.netPayout : 0);

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
                let statusClass = "status-unpaid";

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

    const columns = role === 'salesRep'
        ? (isViewingHistory ? salesRepHistoryColumns : (activeSubTab === 'commissions' ? salesRepColumns : salesRepReversalColumns))
        : adminColumns;
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
                        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px' }}>
                            <div className="metrics-grid" style={{ width: '100%', margin: 0, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                                <MetricCard
                                    title="Total Commission"
                                    value={`Rs. ${totalCommission.toFixed(2)}`}
                                    isPrimary={false}
                                    trend={{
                                        value: `Date ${todayDate}`,
                                        isPositive: true,
                                        label: ' '
                                    }}
                                />
                                <MetricCard
                                    title="Commission Reversal"
                                    value={`Rs. ${totalCommissionReversal.toFixed(2)}`}
                                    isPrimary={false}
                                    trend={{
                                        value: `Current Month`,
                                        isPositive: false,
                                        label: ' '
                                    }}
                                />
                                <MetricCard
                                    title="Net Commission Payout"
                                    value={`Rs. ${netPayout.toFixed(2)}`}
                                    isPrimary={true}
                                    style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white' }}
                                    trend={{
                                        value: `Ready to Pay`,
                                        isPositive: true,
                                        label: ' '
                                    }}
                                />
                            </div>
                            <button
                                onClick={() => { setIsViewingHistory(!isViewingHistory); setCurrentPage(0); }}
                                style={{
                                    padding: '12px 24px',
                                    backgroundColor: isViewingHistory ? '#f3f4f6' : '#4f46e5',
                                    color: isViewingHistory ? '#4b5563' : 'white',
                                    border: isViewingHistory ? '1px solid #d1d5db' : 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    transition: 'all 0.2s',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                {isViewingHistory ? 'Back to Current Commissions' : 'See My Commission History'}
                            </button>
                        </div>
                    )}

                    <div className="table-container-section">
                        <h3 className="section-title">
                            {role === 'salesRep'
                                ? (isViewingHistory ? 'My Monthly Commission History' : (activeSubTab === 'commissions' ? 'Current Commissionable Invoices' : 'Current Commission Reversal Invoices'))
                                : 'Monthly Commission Invoices'}
                        </h3>

                        {role === 'salesRep' && !isViewingHistory && (
                            <div className="tabs-container" style={{ display: 'flex', gap: '20px', marginBottom: '20px', borderBottom: '1px solid #f3f4f6' }}>
                                <button
                                    onClick={() => { setActiveSubTab('commissions'); setCurrentPage(0); }}
                                    style={{
                                        padding: '10px 5px',
                                        background: 'none',
                                        border: 'none',
                                        borderBottom: activeSubTab === 'commissions' ? '2px solid #4f46e5' : '2px solid transparent',
                                        color: activeSubTab === 'commissions' ? '#4f46e5' : '#6b7280',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        fontSize: '0.95rem'
                                    }}
                                >
                                    Commission Invoices
                                </button>
                                <button
                                    onClick={() => { setActiveSubTab('reversals'); setCurrentPage(0); }}
                                    style={{
                                        padding: '10px 5px',
                                        background: 'none',
                                        border: 'none',
                                        borderBottom: activeSubTab === 'reversals' ? '2px solid #4f46e5' : '2px solid transparent',
                                        color: activeSubTab === 'reversals' ? '#4f46e5' : '#6b7280',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        fontSize: '0.95rem'
                                    }}
                                >
                                    Commission Reversal Invoices
                                </button>
                            </div>
                        )}

                        <DataTable
                            columns={columns}
                            data={role === 'salesRep' && isViewingHistory ? commissionHistory : commissions}
                            showActions={false}
                            showAddButton={false}
                            showSearch={true}
                            showFilter={false}
                            showExport={true}
                            onExportCSV={() => console.log('Export CSV')}
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={(page) => setCurrentPage(page)}
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
                                    <h4 style={{ marginBottom: '10px', color: '#4f46e5', borderBottom: '1px solid #e5e7eb', paddingBottom: '5px' }}>Commission Invoices</h4>
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
                                            {invoiceDetails.commissions && invoiceDetails.commissions.length > 0 ? (
                                                invoiceDetails.commissions.map((item, index) => (
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
                                                    <td colSpan="5" style={{ textAlign: 'center', padding: '15px', color: '#6b7280' }}>
                                                        No commissionable invoices found
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>

                                    <h4 style={{ marginTop: '30px', marginBottom: '10px', color: '#e11d48', borderBottom: '1px solid #e5e7eb', paddingBottom: '5px' }}>Reversal Invoices</h4>
                                    <table className="sales-order-table invoice-table">
                                        <thead>
                                            <tr>
                                                <th>Invoice Number</th>
                                                <th>Customer</th>
                                                <th>Date</th>
                                                <th style={{ textAlign: 'right' }}>Total Return Amount (LKR)</th>
                                                <th style={{ textAlign: 'right' }}>Total Commission Reversal (LKR)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {invoiceDetails.reversals && invoiceDetails.reversals.length > 0 ? (
                                                invoiceDetails.reversals.map((item, index) => (
                                                    <tr key={index}>
                                                        <td>{item.invoiceNumber || "-"}</td>
                                                        <td>{item.customerName || item.customer || "-"}</td>
                                                        <td>{item.invoiceDate ? item.invoiceDate.split('T')[0] : (item.date || "-")}</td>
                                                        <td style={{ textAlign: 'right' }}>{parseFloat(item.totalReturnAmount || 0).toFixed(2)}</td>
                                                        <td style={{ textAlign: 'right' }}>{parseFloat(item.totalCommissionReversal || 0).toFixed(2)}</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="5" style={{ textAlign: 'center', padding: '15px', color: '#6b7280' }}>
                                                        No reversal invoices found
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
                                            <div className="totals-line" style={{ marginTop: '5px' }}>
                                                <span className="line-label">Total Reversal (LKR)</span>
                                                <span className="line-value">-{parseFloat(selectedViewInvoice.totalReversalDeduction || 0).toFixed(2)}</span>
                                            </div>
                                            <div className="totals-line grand-due" style={{ marginTop: '10px', paddingTop: '10px', borderTop: '2px solid #e5e7eb' }}>
                                                <span className="line-label" style={{ fontWeight: '800', color: '#111827' }}>Net Payout (LKR)</span>
                                                <span className="line-value" style={{ fontWeight: '800', color: '#10b981' }}>{parseFloat(selectedViewInvoice.netPayout || 0).toFixed(2)}</span>
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
