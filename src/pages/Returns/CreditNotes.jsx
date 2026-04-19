import React, { useState, useEffect, useRef, useCallback } from "react";
import Layout from "../../components/Layout";
import Sidebar from "../../components/Sidebar";
import DataTable from "../../components/common/DataTable";
import { X, FileText, Printer, Download, Share2, Trash2, Check } from "lucide-react";
import { useReactToPrint } from "react-to-print";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { getAllReturns, getReturnById, deleteReturnInvoice, approveReturnInvoice } from "../../api/returnService";
import { getUserId, getUserRole } from "../../components/common/Utils/userUtils/userUtils";
import { useToast } from "../../context/ToastContext";
import "../SalesOrder/SalesInvoices.css"; // Reuse styling template

const CreditNotes = () => {
    const { showToast } = useToast();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [selectedReturn, setSelectedReturn] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [userRole, setUserRole] = useState(null);

    const componentRef = useRef();

    const [returns, setReturns] = useState([]);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [pageSize] = useState(8);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        getUserId().then(setCurrentUserId).catch(console.error);
        getUserRole().then(setUserRole).catch(console.error);
    }, []);

    const fetchReturns = useCallback(async (page) => {
        setLoading(true);
        try {
            const res = await getAllReturns(page, pageSize);
            if (res.data) {
                const dataList = res.data.productReturnList || [];
                const mappedData = dataList.map(item => ({
                    ...item,
                    status: item.status || "Pending",
                }));
                setReturns(mappedData);
                setTotalPages(res.data.totalPages || 1);
            }
        } catch (error) {
            console.error("Error fetching returns:", error);
        } finally {
            setLoading(false);
        }
    }, [pageSize]);

    useEffect(() => {
        fetchReturns(currentPage);
    }, [currentPage, fetchReturns]);

    const handleViewDetails = async (ret) => {
        try {
            const returnId = ret.returnNumber || ret.id;
            const res = await getReturnById(returnId);
            if (res.data && res.data.productReturn) {
                const fullReturn = {
                    ...res.data.productReturn,
                    status: ret.status || "Pending",
                };
                setSelectedReturn(fullReturn);
                setIsModalOpen(true);
            } else {
                setSelectedReturn({ ...ret, status: ret.status || "Pending" });
                setIsModalOpen(true);
            }
        } catch (error) {
            console.error("Error fetching full return details:", error);
            showToast("error", "Error loading details. Showing partial data.");
            setSelectedReturn({ ...ret, status: ret.status || "Pending" });
            setIsModalOpen(true);
        }
    };

    const handleApproval = async () => {
        if (!selectedReturn) return;
        const returnInvoiceId = selectedReturn.returnNumber;
        if (!returnInvoiceId) { showToast("error", "Cannot determine return invoice ID"); return; }
        try {
            await approveReturnInvoice(returnInvoiceId, currentUserId);
            showToast("success", `Return invoice ${selectedReturn.returnNumber} approved successfully`);
            setSelectedReturn(prev => ({ ...prev, status: "Approved" }));
            fetchReturns(currentPage);
            setIsModalOpen(false);
        } catch (error) {
            showToast("error", error?.response?.data?.message || "Failed to approve return invoice");
        }
    };

    const handleSoftDelete = async (ret) => {
        if (!window.confirm(`Delete return invoice ${ret.returnNumber}? This action cannot be undone.`)) return;
        const returnInvoiceId = ret.returnNumber;
        if (!returnInvoiceId) { showToast("error", "Cannot determine return invoice ID"); return; }
        try {
            await deleteReturnInvoice(returnInvoiceId, currentUserId);
            showToast("success", `Return invoice ${ret.returnNumber} deleted successfully`);
            fetchReturns(currentPage);
            setIsModalOpen(false);
        } catch (error) {
            showToast("error", error?.response?.data?.message || "Failed to delete return invoice");
        }
    };

    // const handleEditOpen = (ret) => {
    //     showToast("info", "Edit functionality is pending backend support for Returns");
    //     // navigate("/credit-notes/edit", { state: { returnData: ret } });
    // };

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `Credit_Note_${selectedReturn?.returnNumber || 'Detail'}`,
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
            pdf.save(`Credit_Note_${selectedReturn.returnNumber}.pdf`);
        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("Failed to generate PDF. Please try again.");
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    const handleWhatsAppShare = () => {
        if (!selectedReturn) return;

        const message = `*Credit Note from BioGenHoldings*%0A` +
            `*Return No:* ${selectedReturn.returnNumber}%0A` +
            `*Date:* ${selectedReturn.returnDate}%0A` +
            `*Customer:* ${selectedReturn.customerName}%0A` +
            `*Total Credit:* LKR ${parseFloat(selectedReturn.totalReturnAmount).toFixed(2)}%0A%0A` +
            `Thank you for your business!`;

        const whatsappUrl = `https://wa.me/?text=${message}`;
        window.open(whatsappUrl, "_blank");
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
        { header: "Return Number", accessor: "returnNumber" },
        { header: "Original Invoice", accessor: "originalInvoiceNumber" },
        { header: "Customer", accessor: "customerName" },
        {
            header: "Return Date",
            accessor: "returnDate",
            render: (row) => row.returnDate ? row.returnDate.split('T')[0] : '-'
        },
        {
            header: "Total (RS.)",
            accessor: "totalReturnAmount",
            render: (row) => parseFloat(row.totalReturnAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })
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
                                <h2>Credit Notes (Returns)</h2>
                            </div>
                        </header>

                        <div className="sales-invoices-table-section">
                            {loading ? (
                                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "60px 0", gap: "12px", color: "#6b7280" }}>
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 1s linear infinite" }}>
                                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                                    </svg>
                                    <span style={{ fontSize: "14px" }}>Loading credit notes...</span>
                                </div>
                            ) : (
                                <DataTable
                                    columns={columns}
                                    data={returns}
                                    showAddButton={false}
                                    showStatusToggle={false}
                                    showActions={false}
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={(page) => setCurrentPage(page)}
                                    onSearch={() => { /* No search backend ready */ }}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {isModalOpen && selectedReturn && (
                <div className="sales-invoice-modal-overlay">
                    <div className="sales-invoice-modal-content">
                        <div className="modal-header">
                            <h3>Credit Note Details - {selectedReturn.returnNumber}</h3>
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
                                        <h3 className="company-name">BioGenHoldings Pvt Ltd</h3>
                                        <p className="company-subtitle">The Future of Healthcare</p>
                                        <p className="company-web">www.biogenholdings.com</p>
                                        <p>Tangalle Road, Meddawaththa, Matara</p>
                                        <p>Tel: +94 774 088 839 / +94 413 120 337</p>
                                        <p>Email: info@biogenholdings.com</p>
                                    </div>
                                    <div className="invoice-title">
                                        <h3>Credit Note</h3>
                                    </div>
                                </div>

                                <table className="invoice-info-table">
                                    <tbody>
                                        <tr>
                                            <td><strong>Return No. : </strong>{selectedReturn.returnNumber}</td>
                                            <td></td>

                                            <td><strong>Return Date : </strong>{selectedReturn.returnDate ? selectedReturn.returnDate.split('T')[0] : "-"}</td>
                                            <td></td>
                                        </tr>
                                    </tbody>
                                </table>
                                <div className="customer-details-grid">
                                    <div className="details-box">
                                        <h4 className="box-title">Customer Details</h4>
                                        <div className="box-content">
                                            <p className="customer-name">{selectedReturn.customerName}</p>
                                            <p>{selectedReturn.customerAddress || "Address N/A"}</p>
                                            <p>{selectedReturn.customerPhone || "Phone N/A"}</p>

                                        </div>
                                    </div>
                                    <div className="details-box">
                                        <h4 className="box-title">Customer Details</h4>
                                        <div className="box-content">
                                            <span className="info-label">Original Invoice Number : {selectedReturn.originalInvoiceNumber} </span>
                                            <p></p>
                                            <span className="info-label">Sales Rep : {selectedReturn.salesRepName} </span>
                                            <p></p>

                                        </div>
                                    </div>
                                </div>



                                <div className="sales-order-table-container">
                                    <table className="sales-order-table invoice-table">
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>Product Description</th>
                                                <th>Reason</th>
                                                <th>Reusable</th>
                                                <th>Qty</th>
                                                <th>Unit Price (At Return)</th>
                                                <th>Sub Total (LKR)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(selectedReturn.items || []).map((item, index) => (
                                                <tr key={index}>
                                                    <td>{index + 1}</td>
                                                    <td>
                                                        <div className="product-desc-cell">
                                                            <span className="main-desc">{item.productName || "Product N/A"}</span>
                                                        </div>
                                                    </td>
                                                    <td>{item.reason || "-"}</td>
                                                    <td>{item.isReusable ? "Yes" : "No"}</td>
                                                    <td>{item.quantity}</td>
                                                    <td>{parseFloat(item.unitPrice || 0).toFixed(2)}</td>
                                                    <td>{parseFloat(item.subTotal || 0).toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    <div className="invoice-totals-section">
                                        <div className="totals-row total-invoice">
                                            <span className="total-label">Total Credit Note: Rs. </span>
                                            <span className="total-value" style={{ marginLeft: "auto", fontWeight: "bold" }}>
                                                {parseFloat(selectedReturn.totalReturnAmount || 0).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>

                                    <div>
                                        <p>Processed By: {selectedReturn.processedBy || "N/A"}
                                            <span style={{ marginLeft: "30px" }}>Checked By: .........................</span>
                                            <span style={{ marginLeft: "30px" }}>Approved By: ........................</span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <div className="modal-footer-actions">
                                {(userRole === "ADMIN" || userRole === "INVENTORY_MANAGER") && selectedReturn.status === "Pending" && (
                                    <>
                                        <button className="action-btn btn-approve" onClick={() => handleApproval()}>
                                            <Check size={18} /> Approve
                                        </button>
                                        <button className="action-btn btn-reject" onClick={() => handleSoftDelete(selectedReturn)}>
                                            <X size={18} /> Reject
                                        </button>
                                    </>
                                )}
                                {selectedReturn.status !== "Deleted" && (
                                    <button className="action-btn btn-delete" onClick={() => handleSoftDelete(selectedReturn)}>
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
        </Layout>
    );
};

export default CreditNotes;
