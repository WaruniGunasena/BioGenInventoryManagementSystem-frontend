import React, { useState, useEffect, useRef } from "react";
import Layout from "../../components/Layout";
import Sidebar from "../../components/Sidebar";
import { getAllCustomers } from "../../api/customerService";
import { getSalesOrdersByCustomer, createProductReturn } from "../../api/returnService";
import { getSalesOrderById } from "../../api/salesOrderService";
import { useToast } from "../../context/ToastContext";
import { getUserId, getUserName } from "../../components/common/Utils/userUtils/userUtils";
import { RotateCcw, ShoppingCart, FileText } from "lucide-react";
import "./ProductReturns.css";

const ProductReturns = () => {
    const { showToast } = useToast();
    const invoicePreviewRef = useRef(null);

    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    const [currentUserId, setCurrentUserId] = useState(null);
    const [currentUserName, setCurrentUserName] = useState("");

    const [customers, setCustomers] = useState([]);
    const [selectedCustomerId, setSelectedCustomerId] = useState("");
    const [selectedCustomerData, setSelectedCustomerData] = useState(null);

    const [customerInvoices, setCustomerInvoices] = useState([]);
    const [selectedInvoiceId, setSelectedInvoiceId] = useState("");
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [invoiceItems, setInvoiceItems] = useState([]);   
    const [loadingInvoices, setLoadingInvoices] = useState(false);
    const [loadingItems, setLoadingItems] = useState(false);

    const [returnItems, setReturnItems] = useState({});
    const [notes, setNotes] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const returnDate = new Date().toLocaleDateString("en-CA");

    useEffect(() => {
        const init = async () => {
            try {
                const [uid, uname] = await Promise.all([getUserId(), getUserName()]);
                setCurrentUserId(uid);
                setCurrentUserName(uname);
            } catch (e) {
                console.error("Error fetching user:", e);
            }

            try {
                const res = await getAllCustomers();
                const data = res.data?.customers || res.data || [];
                setCustomers(Array.isArray(data) ? data : []);
            } catch (e) {
                console.error("Error fetching customers:", e);
            }
        };
        init();
    }, []);

    const handleCustomerChange = async (e) => {
        const id = e.target.value;
        setSelectedCustomerId(id);
        setSelectedInvoiceId("");
        setSelectedInvoice(null);
        setInvoiceItems([]);
        setReturnItems({});

        const customer = customers.find((c) => (c.id || c._id).toString() === id.toString());
        setSelectedCustomerData(customer || null);

        if (!id) return;

        setLoadingInvoices(true);
        try {
            const res = await getSalesOrdersByCustomer(id);
            const data = res.data?.salesOrderList || res.data?.content || res.data || [];
            setCustomerInvoices(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error("Error fetching customer invoices:", e);
            showToast("error", "Failed to load invoices for this customer.");
            setCustomerInvoices([]);
        } finally {
            setLoadingInvoices(false);
        }
    };

    const handleInvoiceChange = async (e) => {
        const id = e.target.value;
        setSelectedInvoiceId(id);
        setReturnItems({});
        setInvoiceItems([]);
        setSelectedInvoice(null);

        if (!id) return;

        setLoadingItems(true);
        try {
            const res = await getSalesOrderById(id);
            console.log("invoice data", res);
            const invoice = res.data?.salesOrder || res.data;
            setSelectedInvoice(invoice);

            const items = (invoice?.items || []).filter(
                (item) => parseFloat(item.sellingPrice) > 0
            );
            setInvoiceItems(items);

            const init = {};
            items.forEach((item) => {
                const key = item.productId || item.id;
                init[key] = { returnQty: "", reusable: true };
            });
            setReturnItems(init);
        } catch (e) {
            console.error("Error fetching invoice details:", e);
            showToast("error", "Failed to load invoice items.");
        } finally {
            setLoadingItems(false);
        }
    };

    const handleReturnQtyChange = (productKey, value, maxQty) => {
        let qty = value;
        if (qty !== "" && parseFloat(qty) > maxQty) qty = maxQty.toString();
        if (qty !== "" && parseFloat(qty) < 0) qty = "0";
        setReturnItems((prev) => ({
            ...prev,
            [productKey]: { ...prev[productKey], returnQty: qty },
        }));
    };

    const handleReusableChange = (productKey, checked) => {
        setReturnItems((prev) => ({
            ...prev,
            [productKey]: { ...prev[productKey], reusable: checked },
        }));
    };

    const returnedItemsForPreview = invoiceItems
        .map((item) => {
            const key = item.productId || item.id;
            const state = returnItems[key];

            const qty = parseFloat(state?.returnQty) || 0;
            if (qty <= 0) return null;
            return {
                ...item,
                productId: item.productId || item.product?.id || item.id,
                productName: item.productName || item.product?.name,
                returnQty: qty,
                reusable: returnItems[key]?.reusable ?? true,
                refundAmount: qty * parseFloat(item.sellingPrice),
            };
        })
        .filter(Boolean);

    const totalRefundAmount = returnedItemsForPreview.reduce(
        (sum, item) => sum + item.refundAmount,
        0
    );

    const handleSubmitReturn = async () => {
        if (!selectedCustomerId) {
            showToast("error", "Please select a customer.");
            return;
        }
        if (!selectedInvoiceId) {
            showToast("error", "Please select an invoice.");
            return;
        }
        if (returnedItemsForPreview.length === 0) {
            showToast("error", "Please enter a return quantity for at least one product.");
            return;
        }

        const payload = {
            customerId: parseInt(selectedCustomerId),
            salesOrderId: parseInt(selectedInvoiceId),
            userId: currentUserId,
            date: returnDate,
            notes: notes.trim() || null,
            totalRefundAmount: parseFloat(totalRefundAmount.toFixed(2)),
            items: returnedItemsForPreview.map((item) => ({
                productId: item.productId,
                productName: item.productName,
                unit: item.unit || "",
                quantity: item.returnQty,
                sellingPrice: parseFloat(item.sellingPrice),
                totalAmount: parseFloat(item.refundAmount.toFixed(2)),
                isReusable: item.reusable,
            })),
        };

        setIsSubmitting(true);
        try {
            await createProductReturn(payload);
            showToast("success", "Product return submitted successfully!");
            setSelectedCustomerId("");
            setSelectedCustomerData(null);
            setCustomerInvoices([]);
            setSelectedInvoiceId("");
            setSelectedInvoice(null);
            setInvoiceItems([]);
            setReturnItems({});
            setNotes("");
        } catch (error) {
            const msg = error?.response?.data?.message || "Failed to submit return.";
            showToast("error", msg);
        } finally {
            setIsSubmitting(false);
        }
    };

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
                    <div className="pr-page">

                        <header className="pr-header">
                            <div className="pr-header-left">
                                <div className="pr-header-icon">
                                    <RotateCcw size={22} />
                                </div>
                                <div>
                                    <h1 className="pr-title">Product Returns</h1>
                                    <p className="pr-subtitle">Process a product return against an existing sales invoice</p>
                                </div>
                            </div>
                        </header>

                        <div className="pr-card">
                            <div className="pr-card-header">
                                <ShoppingCart size={18} className="pr-icon-amber" />
                                <span>Customer &amp; Invoice Selection</span>
                            </div>

                            <div className="pr-selection-grid">
                                <div className="pr-field-group">
                                    <label className="pr-label">Customer <span className="pr-required">*</span></label>
                                    <select
                                        className="pr-select"
                                        value={selectedCustomerId}
                                        onChange={handleCustomerChange}
                                    >
                                        <option value="">— Select Customer —</option>
                                        {customers.map((c) => (
                                            <option key={c.id || c._id} value={c.id || c._id}>
                                                {c.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="pr-field-group">
                                    <label className="pr-label">Invoice <span className="pr-required">*</span></label>
                                    <select
                                        className="pr-select"
                                        value={selectedInvoiceId}
                                        onChange={handleInvoiceChange}
                                        disabled={!selectedCustomerId || loadingInvoices}
                                    >
                                        <option value="">
                                            {loadingInvoices
                                                ? "Loading invoices…"
                                                : customerInvoices.length === 0 && selectedCustomerId
                                                    ? "No invoices found"
                                                    : "— Select Invoice —"}
                                        </option>
                                        {customerInvoices.map((inv) => (
                                            <option key={inv.id} value={inv.id}>
                                                {inv.invoiceNumber} — {inv.invoiceDate || inv.date}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="pr-field-group">
                                    <label className="pr-label">Return Date</label>
                                    <input
                                        type="text"
                                        className="pr-input pr-input-readonly"
                                        value={returnDate}
                                        readOnly
                                    />
                                </div>
                            </div>

                            {selectedCustomerData && (
                                <div className="pr-customer-info">
                                    <span className="pr-info-chip">
                                        <b>Customer:</b> {selectedCustomerData.name}
                                    </span>
                                    <span className="pr-info-chip">
                                        <b>Credit Period:</b>{" "}
                                        {selectedCustomerData.creditPeriod === "cash"
                                            ? "Cash"
                                            : `${selectedCustomerData.creditPeriod} Days`}
                                    </span>
                                    {selectedInvoice && (
                                        <span className="pr-info-chip">
                                            <b>Invoice Total:</b> LKR{" "}
                                            {parseFloat(selectedInvoice.grandTotal || 0).toFixed(2)}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>

                        {selectedInvoiceId && (
                            <div className="pr-card">
                                <div className="pr-card-header">
                                    <FileText size={18} className="pr-icon-amber" />
                                    <span>Invoice Products — Select Return Quantities</span>
                                </div>

                                {loadingItems ? (
                                    <p className="pr-loading">Loading invoice items…</p>
                                ) : invoiceItems.length === 0 ? (
                                    <p className="pr-empty">No returnable items found in this invoice.</p>
                                ) : (
                                    <div className="pr-table-wrap">
                                        <table className="pr-table">
                                            <thead>
                                                <tr>
                                                    <th>#</th>
                                                    <th>Product</th>
                                                    <th>Unit</th>
                                                    <th>Invoice Qty</th>
                                                    <th>Returnable Qty</th>
                                                    <th>Unit Price (LKR)</th>
                                                    <th>Return Qty</th>
                                                    <th>Refund Amount (LKR)</th>
                                                    <th>Reusable</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {invoiceItems.map((item, idx) => {
                                                    const key = item.productId || item.id;
                                                    const returnState = returnItems[key] || { returnQty: "", reusable: true };
                                                    const returnQty = parseFloat(returnState.returnQty) || 0;
                                                    const refund = returnQty * parseFloat(item.sellingPrice);
                                                    const returnableQuantity = item.quantity - (item.returnQty || 0);

                                                    return (
                                                        <tr key={key} className={returnQty > 0 ? "pr-row-selected" : ""}>
                                                            <td>{idx + 1}</td>
                                                            <td>
                                                                <div className="pr-product-name">
                                                                    {item.productName || item.product?.name || "N/A"}
                                                                </div>
                                                            </td>
                                                            <td>{item.unit || "—"}</td>
                                                            <td>{item.quantity}</td>
                                                            <td>{returnableQuantity}</td>
                                                            <td>{parseFloat(item.sellingPrice).toFixed(2)}</td>
                                                            <td>
                                                                <input
                                                                    type="text"
                                                                    className="pr-qty-input"
                                                                    min="0"
                                                                    max={returnableQuantity}
                                                                    step="1"
                                                                    value={returnState.returnQty}
                                                                    placeholder="0"
                                                                    onChange={(e) =>
                                                                        handleReturnQtyChange(key, e.target.value, returnableQuantity)
                                                                    }
                                                                />
                                                            </td>
                                                            <td className="pr-refund-cell">
                                                                {returnQty > 0
                                                                    ? refund.toLocaleString(undefined, { minimumFractionDigits: 2 })
                                                                    : "—"}
                                                            </td>
                                                            <td>
                                                                <label className="pr-checkbox-label">
                                                                    <input
                                                                        type="checkbox"
                                                                        className="pr-checkbox"
                                                                        checked={returnState.reusable}
                                                                        onChange={(e) =>
                                                                            handleReusableChange(key, e.target.checked)
                                                                        }
                                                                    />
                                                                    <span className={`pr-reusable-badge ${returnState.reusable ? "yes" : "no"}`}>
                                                                        {returnState.reusable ? "Yes" : "No"}
                                                                    </span>
                                                                </label>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}

                        {selectedInvoiceId && (
                            <div className="pr-card">
                                <label className="pr-label">Notes (optional)</label>
                                <textarea
                                    className="pr-textarea"
                                    rows={3}
                                    placeholder="Reason for return, condition of goods, etc."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                            </div>
                        )}

                        {returnedItemsForPreview.length > 0 && (
                            <div className="pr-invoice-section" ref={invoicePreviewRef}>
                                <div className="pr-inv-header">
                                    <div className="pr-company-block">
                                        <h2 className="pr-company-name">BioGenHoldings Pvt Ltd</h2>
                                        <p className="pr-company-sub">The Future of Healthcare</p>
                                        <p className="pr-company-web">www.biogenholdings.com</p>
                                        <p>Tangalle Road, Meddawaththa, Matara</p>
                                    </div>
                                    <div className="pr-inv-title-block">
                                        <h2 className="pr-inv-title">Credit Note / Return</h2>
                                    </div>
                                </div>

                                <hr className="pr-divider" />

                                <div className="pr-inv-info-bar">
                                    <div className="pr-inv-info-item">
                                        <span className="pr-inv-info-label">Ref Invoice:</span>
                                        <span className="pr-inv-info-value">
                                            {selectedInvoice?.invoiceNumber || "—"}
                                        </span>
                                    </div>
                                    <div className="pr-inv-info-item">
                                        <span className="pr-inv-info-label">Return Date:</span>
                                        <span className="pr-inv-info-value">{returnDate}</span>
                                    </div>
                                    <div className="pr-inv-info-item">
                                        <span className="pr-inv-info-label">Customer:</span>
                                        <span className="pr-inv-info-value">{selectedCustomerData?.name}</span>
                                    </div>
                                    <div className="pr-inv-info-item">
                                        <span className="pr-inv-info-label">Processed By:</span>
                                        <span className="pr-inv-info-value">{currentUserName}</span>
                                    </div>
                                </div>

                                <div className="pr-inv-table-wrap">
                                    <table className="pr-inv-table">
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>Product</th>
                                                <th>Unit</th>
                                                <th>Return Qty</th>
                                                <th>Unit Price (LKR)</th>
                                                <th>Refund Amount (LKR)</th>
                                                <th>Reusable</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {returnedItemsForPreview.map((item, idx) => (
                                                <tr key={item.productId || idx}>
                                                    <td>{idx + 1}</td>
                                                    <td>{item.productName || item.product?.name}</td>
                                                    <td>{item.unit || "—"}</td>
                                                    <td>{item.returnQty}</td>
                                                    <td>{parseFloat(item.sellingPrice).toFixed(2)}</td>
                                                    <td>{item.refundAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                    <td>
                                                        <span className={`pr-reusable-badge ${item.reusable ? "yes" : "no"}`}>
                                                            {item.reusable ? "Reusable" : "Not Reusable"}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="pr-totals">
                                    <div className="pr-total-row">
                                        <span><b>Total Refund Amount (LKR)</b></span>
                                        <span className="pr-total-value">
                                            {totalRefundAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                </div>

                                <div className="pr-invoice-footer-actions">
                                    <button
                                        className="pr-btn-submit"
                                        onClick={handleSubmitReturn}
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? "Submitting…" : "Submit Return"}
                                    </button>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default ProductReturns;
