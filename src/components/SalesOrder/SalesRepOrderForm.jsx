import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../Layout";
import Sidebar from "../Sidebar";
import { Search, Trash2, AlertCircle, FileText, Edit3, ShoppingCart } from "lucide-react";
import { getAllCustomers } from "../../api/customerService";
import { getPaginatedProductResults, searchProduct } from "../../api/productService";
import { getAllCategory } from "../../api/categoryService";
import { getAllStock } from "../../api/stockService";
import { createSalesOrder, updateSalesOrder } from "../../api/salesOrderService";
import { useToast } from "../../context/ToastContext";
import { getUserId, getUserName } from "../common/Utils/userUtils/userUtils";
import { DiscountTypeEnum } from "../../enums/DiscountTypeEnum";
import { AdditionalDiscountPopup } from "../../pages/SalesOrder/AdditionalDiscountPopup";
import "../../pages/SalesOrder/SalesRepOrder.css";

/**
 * Shared Sales Rep Order form component.
 *
 * Props:
 *  - mode          : "create" | "edit"
 *  - initialInvoice: existing invoice object (required when mode="edit")
 */
const SalesRepOrderForm = ({ mode = "create", initialInvoice = null }) => {
    const { showToast } = useToast();
    const navigate = useNavigate();

    const isEdit = mode === "edit";
    const invoiceId = isEdit ? (initialInvoice?.salesOrderId || initialInvoice?.id) : null;

    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const customerDropdownRef = useRef(null);
    const topSelectionRef = useRef(null);

    const [customers, setCustomers] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [customerSearch, setCustomerSearch] = useState("");
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [productSearch, setProductSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(0);
    // eslint-disable-next-line no-unused-vars
    const [totalPages, setTotalPages] = useState(0);
    const [pageSize] = useState(5);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [showProductSearch, setShowProductSearch] = useState(false);

    const [addedItems, setAddedItems] = useState([]);
    const addedItemsRef = useRef([]);
    useEffect(() => { addedItemsRef.current = addedItems; }, [addedItems]);

    const [stockData, setStockData] = useState([]);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [currentUserName, setCurrentUserName] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [additionalDiscount, setAdditionalDiscount] = useState({ type: DiscountTypeEnum.cash, value: "" });
    const [showDiscountPopup, setShowDiscountPopup] = useState(false);

    // ── Data fetching ────────────────────────────────────────────────────────

    const fetchUserId = useCallback(async () => {
        try {
            setCurrentUserId(await getUserId());
            setCurrentUserName(await getUserName());
        } catch (e) { console.error(e); }
    }, []);

    const fetchCustomers = useCallback(async () => {
        try {
            const res = await getAllCustomers();
            const data = res.data?.customers || res.data || [];
            setCustomers(Array.isArray(data) && data.length > 0 ? data : []);
        } catch { setCustomers([]); }
    }, []);

    const fetchCategories = useCallback(async () => {
        try {
            const res = await getAllCategory();
            const data = res.data?.categories || res.data?.content || res.data || [];
            setCategories(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Failed to fetch categories:", error);
            setCategories([]);
        }
    }, []);

    const fetchProducts = useCallback(async (page, categoryId, search, append = false, resolvedStock = null) => {
        if (!append) setLoadingProducts(true);
        try {
            let data = [], total = 0, res;

            if (search) {
                res = await searchProduct(search);
                data = res.data?.products || res.data || [];
                total = 1;
            } else {
                const catIdParam = categoryId !== "all" ? categoryId : null;
                res = await getPaginatedProductResults(page, pageSize, "ASC", catIdParam);
                data = res.data?.products || res.data?.content || [];
                total = res.data?.totalPages || 1;
            }

            const stock = resolvedStock !== null ? resolvedStock : stockData;

            const getInitialQtyBonus = (pid) => {
                const fromAdded = addedItemsRef.current.find((a) => String(a.productId) === String(pid));
                if (fromAdded) return { q: fromAdded.quantity, b: fromAdded.bonus };

                if (isEdit && addedItemsRef.current.length === 0 && initialInvoice?.items) {
                    const saleLine = initialInvoice.items.find(
                        (i) => String(i.productId || i.product?.id) === String(pid) && parseFloat(i.sellingPrice) > 0
                    );
                    const bonusLine = initialInvoice.items.find(
                        (i) => String(i.productId || i.product?.id) === String(pid) && parseFloat(i.sellingPrice) === 0
                    );
                    if (saleLine || bonusLine) {
                        return { q: saleLine?.quantity || 0, b: bonusLine?.quantity || 0 };
                    }
                }
                return { q: "", b: "" };
            };

            const productsWithInputs = data.map((p) => {
                const pid = (p.id || p._id)?.toString();
                const stockItem = stock.find((s) => s.productId?.toString() === pid);
                const resolvedPrice = stockItem?.sellingPrice ?? p.sellingPrice ?? 0;
                const { q, b } = getInitialQtyBonus(pid);
                return { ...p, sellingPrice: resolvedPrice, inputQty: q, inputBonus: b };
            });

            setProducts((prev) => (append ? [...prev, ...productsWithInputs] : productsWithInputs));
            setTotalPages(total);
            setHasMore(page < total - 1);
        } catch (error) {
            console.error("Failed to fetch products:", error);
        } finally {
            setLoadingProducts(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pageSize, stockData, isEdit, initialInvoice]);

    useEffect(() => {
        if (isEdit && !initialInvoice) {
            showToast("error", "No Order data found. Redirecting back.");
            navigate("/sales-invoices");
            return;
        }
        const init = async () => {
            await Promise.all([fetchCustomers(), fetchCategories(), fetchUserId()]);
            let resolvedStock = [];
            try {
                const res = await getAllStock();
                if (Array.isArray(res.data)) resolvedStock = res.data;
                else if (Array.isArray(res.data?.productStocks)) resolvedStock = res.data.productStocks;
                setStockData(resolvedStock);
            } catch (e) { console.error("Stock fetch failed:", e); }
            fetchProducts(0, "all", "", false, resolvedStock);
        };
        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Pre-populate when editing ────────────────────────────────────────────

    useEffect(() => {
        if (!isEdit || !initialInvoice) return;

        const customerId = initialInvoice.customer?.id || initialInvoice.customer?._id || initialInvoice.customerId;
        const fullCustomer = customers.find((c) => (c.id || c._id) === customerId);

        if (fullCustomer) {
            setSelectedCustomer(fullCustomer);
            setCustomerSearch(fullCustomer.name);
        } else if (initialInvoice.customer) {
            setSelectedCustomer(initialInvoice.customer);
            setCustomerSearch(initialInvoice.customer.name || initialInvoice.customerName || "");
        } else if (initialInvoice.customerName) {
            setCustomerSearch(initialInvoice.customerName);
        }

        const salelines = (initialInvoice.items || []).filter((i) => parseFloat(i.sellingPrice) > 0);
        const preloadedItems = salelines.map((item) => {
            const bonusLine = (initialInvoice.items || []).find(
                (b) =>
                    (b.productId === item.productId || b.product?.id === item.productId) &&
                    parseFloat(b.sellingPrice) === 0
            );
            return {
                productId: item.productId || item.product?.id,
                productName: item.productName || item.product?.name || "",
                sellingPrice: parseFloat(item.sellingPrice),
                mrp: parseFloat(item.mrp || 0),
                quantity: item.quantity,
                bonus: bonusLine ? bonusLine.quantity : 0,
                unit: item.unit || "",
                totalAmount: parseFloat(item.totalAmount),
            };
        });
        setAddedItems(preloadedItems);

        setAdditionalDiscount({
            type: initialInvoice.additionalDiscountType || DiscountTypeEnum.cash,
            value: initialInvoice.additionalDiscountValue ?? "",
        });
    }, [isEdit, initialInvoice, customers]);

    useEffect(() => {
        fetchProducts(0, selectedCategory, productSearch);
    }, [selectedCategory, productSearch, fetchProducts]);

    useEffect(() => {
        const handler = (e) => {
            if (customerDropdownRef.current && !customerDropdownRef.current.contains(e.target))
                setShowCustomerDropdown(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // ── Handlers ─────────────────────────────────────────────────────────────

    const handleProductSearch = (val) => { setProductSearch(val); setCurrentPage(0); };
    const handleCustomerSearch = (e) => { setCustomerSearch(e.target.value); setShowCustomerDropdown(true); };
    const selectCustomer = (c) => { setSelectedCustomer(c); setCustomerSearch(c.name); setShowCustomerDropdown(false); };

    const handleScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        if (scrollHeight - scrollTop <= clientHeight * 1.5 && hasMore && !loadingProducts && !productSearch) {
            const next = currentPage + 1;
            setCurrentPage(next);
            fetchProducts(next, selectedCategory, productSearch, true);
        }
    };

    const addToOrder = useCallback((product, qty, bonus) => {
        setAddedItems((prev) => {
            const existingIndex = prev.findIndex((i) => i.productId === (product.id || product._id));
            const newItem = {
                productId: product.id || product._id,
                productName: product.name,
                sellingPrice: product.sellingPrice || 0,
                mrp: product.mrp || 0,
                quantity: qty,
                bonus,
                unit: product.unit || "Unit",
                totalAmount: (product.sellingPrice || 0) * qty,
            };
            if (existingIndex > -1) {
                const updated = [...prev];
                updated[existingIndex] = newItem;
                return updated;
            }
            return [...prev, newItem];
        });
    }, []);

    const handleProductInputChange = (productId, field, value) => {
        setProducts((prev) => prev.map((p) => (p.id || p._id) === productId ? { ...p, [field]: value } : p));
    };

    const handleAddClick = (product) => {
        const qty = parseFloat(product.inputQty) || 0;
        const bonus = parseFloat(product.inputBonus) || 0;
        if (qty <= 0 && bonus <= 0) { showToast("warning", "Please enter a valid quantity or bonus"); return; }
        addToOrder(product, qty, bonus);
        showToast("success", `Added ${product.name} to Order`);
    };

    const handleEditItem = () => {
        if (topSelectionRef.current) {
            topSelectionRef.current.scrollIntoView({ behavior: "smooth" });
            showToast("info", "Update qty and click Add again to edit");
        }
    };

    const removeItem = (productId) => {
        setAddedItems((prev) => prev.filter((i) => i.productId !== productId));
        setProducts((prev) => prev.map((p) => (p.id || p._id) === productId ? { ...p, inputQty: "", inputBonus: "" } : p));
    };

    // ── Totals ────────────────────────────────────────────────────────────────

    const getAdditionalDiscountValue = () => {
        const total = addedItems.reduce((sum, item) => sum + (item.totalAmount || 0), 0);
        const value = parseFloat(additionalDiscount.value) || 0;
        return additionalDiscount.type === DiscountTypeEnum.percentage ? (total * value) / 100 : value;
    };

    const totalBeforeExtras = addedItems.reduce((sum, item) => sum + (item.totalAmount || 0), 0);
    const discountAmount = getAdditionalDiscountValue();
    const grandTotal = totalBeforeExtras - discountAmount;
    const availableCredit = selectedCustomer
        ? (selectedCustomer.creditLimit || 0) - (selectedCustomer.dueBalance || 0)
        : 0;
    const isOverCredit = selectedCustomer && grandTotal > availableCredit;

    // ── Submit ────────────────────────────────────────────────────────────────

    const handleSubmit = async () => {
        if (!selectedCustomer) { showToast("error", "Please select a customer"); return; }
        if (addedItems.length === 0) { showToast("error", "Please add at least one product"); return; }

        const mappedItems = [];
        addedItems.forEach((item) => {
            mappedItems.push({
                productId: item.productId,
                productName: item.productName,
                unit: item.unit || "",
                quantity: item.quantity,
                sellingPrice: item.sellingPrice,
                totalAmount: item.totalAmount,
                discountPercent: item.discountPercent ?? 0,
                discountedPrice: item.discountedPrice ?? 0,
            });
            if (item.bonus > 0) {
                mappedItems.push({
                    productId: item.productId,
                    productName: item.productName,
                    unit: item.unit || "",
                    quantity: item.bonus,
                    sellingPrice: 0,
                    totalAmount: 0,
                    discountPercent: 0,
                    discountedPrice: 0,
                });
            }
        });

        const payload = {
            customerId: selectedCustomer.id || selectedCustomer._id,
            userId: currentUserId,
            date: initialInvoice?.date || new Date().toLocaleDateString("en-CA"),
            grandTotal: totalBeforeExtras,
            additionalDiscountType: additionalDiscount.type,
            additionalDiscountValue: parseFloat(additionalDiscount.value) || 0,
            items: mappedItems,
        };

        setIsSubmitting(true);
        try {
            if (isEdit) {
                await updateSalesOrder(invoiceId, currentUserId, payload);
                showToast("success", `Order ${initialInvoice?.invoiceNumber} updated successfully!`);
                navigate("/sales-invoices");
            } else {
                const res = await createSalesOrder(payload);
                const invoiceNo = res.data?.invoiceNumber || res.data?.data?.invoiceNumber;
                showToast("success", `Sales Order created!${invoiceNo ? ` Order No: ${invoiceNo}` : ""}`);
                setAddedItems([]);
                setSelectedCustomer(null);
                setCustomerSearch("");
                setProducts((prev) => prev.map((p) => ({ ...p, inputQty: "", inputBonus: "" })));
            }
        } catch (error) {
            showToast("error", error?.response?.data?.message || `Failed to ${isEdit ? "update" : "create"} Sales Order`);
        } finally {
            setIsSubmitting(false);
        }
    };

    // ── Derived display values ───────────────────────────────────────────────

    const filteredCustomers = customers.filter((c) =>
        c.name.toLowerCase().includes(customerSearch.toLowerCase())
    );

    const today = new Date();
    const formattedDate = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;
    const displayDate = isEdit ? (initialInvoice?.date || formattedDate) : formattedDate;

    const headerTitle = isEdit
        ? `Edit Order — ${initialInvoice?.invoiceNumber || ""}`
        : "Create Sales Order";
    const headerSub = isEdit
        ? "Modify items and quantities for this order"
        : "Generate new orders for customers";
    const backLabel = isEdit ? "Cancel" : "Back";
    const confirmLabel = isEdit
        ? isSubmitting ? "Saving…" : "Save Changes"
        : "Confirm Order";
    const onBack = isEdit ? () => navigate("/sales-invoices") : () => window.history.back();

    // ── Render ───────────────────────────────────────────────────────────────

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
                    <div className="asi-page">

                        <header className="asi-header">
                            <div className="asi-header-left">
                                <div className="asi-header-icon">
                                    <FileText size={22} />
                                </div>
                                <div>
                                    <h1 className="asi-header-title">{headerTitle}</h1>
                                    <p className="asi-header-sub">{headerSub}</p>
                                </div>
                            </div>
                            <div className="asi-header-actions">
                                <button className="asi-btn-back" onClick={onBack}>{backLabel}</button>
                                <button
                                    className="asi-btn-confirm"
                                    onClick={handleSubmit}
                                    disabled={isSubmitting || isOverCredit}
                                >
                                    {confirmLabel}
                                </button>
                            </div>
                        </header>

                        {/* ── Customer + Product selection ── */}
                        <div className="asi-top-section" ref={topSelectionRef}>
                            <div className="asi-card asi-combined-card">

                                <div className="asi-combined-section">
                                    <div className="asi-card-header">
                                        <ShoppingCart size={18} className="asi-icon-purple" />
                                        <h3>Customer Information</h3>
                                    </div>

                                    <div className="asi-search-wrap" ref={customerDropdownRef}>
                                        <div className="asi-search-field">
                                            <Search size={16} className="asi-search-icon" />
                                            <input
                                                type="text"
                                                placeholder="Search Customer..."
                                                value={customerSearch}
                                                onChange={handleCustomerSearch}
                                                onFocus={() => setShowCustomerDropdown(true)}
                                            />
                                        </div>
                                        {showCustomerDropdown && customerSearch && (
                                            <div className="asi-dropdown">
                                                {filteredCustomers.length > 0 ? (
                                                    filteredCustomers.map((c) => (
                                                        <div
                                                            key={c.id || c._id}
                                                            className="asi-dropdown-item"
                                                            onClick={() => selectCustomer(c)}
                                                        >
                                                            <span className="asi-drop-name">{c.name}</span>
                                                            <span className="asi-drop-sub">{c.contact_No}</span>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="asi-dropdown-empty">No customers found</div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {selectedCustomer && (
                                        <div className="asi-credit-info">
                                            <div className="asi-credit-row">
                                                <span>Credit Limit</span>
                                                <strong>LKR {selectedCustomer.creditLimit?.toLocaleString()}</strong>
                                            </div>
                                            <div className="asi-credit-row">
                                                <span>Due Amount</span>
                                                <strong className="asi-text-warning">
                                                    LKR {(selectedCustomer.dueBalance || selectedCustomer.totalDue || 0).toLocaleString()}
                                                </strong>
                                            </div>
                                            <div className={`asi-credit-row asi-credit-available ${isOverCredit ? "over" : "ok"}`}>
                                                <span>Available Credit</span>
                                                <strong>LKR {availableCredit.toLocaleString()}</strong>
                                            </div>
                                            {isOverCredit && (
                                                <div className="asi-over-limit">
                                                    <AlertCircle size={14} /> Order exceeds credit limit!
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <hr className="asi-section-divider" />

                                <div className="asi-combined-section">
                                    <div className="asi-card-header">
                                        <ShoppingCart size={18} className="asi-icon-purple" />
                                        <h3>Product Selection</h3>
                                        <div className="asi-product-controls">
                                            <select
                                                value={selectedCategory}
                                                onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(0); }}
                                                className="asi-category-select"
                                            >
                                                <option value="all">All Categories</option>
                                                {categories.map((cat) => (
                                                    <option key={cat.id || cat._id} value={cat.id || cat._id}>
                                                        {cat.name}
                                                    </option>
                                                ))}
                                            </select>
                                            <button className="asi-search-toggle" onClick={() => setShowProductSearch((s) => !s)}>
                                                <Search size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    {showProductSearch && (
                                        <div className="asi-product-search-bar">
                                            <Search size={15} className="asi-search-icon" />
                                            <input
                                                type="text"
                                                placeholder="Search product..."
                                                value={productSearch}
                                                onChange={(e) => handleProductSearch(e.target.value)}
                                                autoFocus
                                            />
                                        </div>
                                    )}

                                    <div className="asi-product-table-wrap" onScroll={handleScroll}>
                                        <table className="asi-product-table">
                                            <thead>
                                                <tr>
                                                    <th>PRODUCT</th>
                                                    <th>PRICE</th>
                                                    <th>QTY</th>
                                                    <th>BONUS</th>
                                                    <th></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {products.map((p) => (
                                                    <tr key={p.id || p._id}>
                                                        <td className="asi-product-name-cell" data-label="Product">
                                                            <div className="asi-prod-name">{p.name}</div>
                                                            <div className="asi-prod-unit">{p.unit}</div>
                                                        </td>
                                                        <td className="asi-price-cell" data-label="Price">
                                                            {p.sellingPrice?.toFixed(2)}
                                                        </td>
                                                        <td data-label="Qty">
                                                            <input
                                                                type="number" min="0"
                                                                className="asi-num-input"
                                                                value={p.inputQty}
                                                                placeholder="0"
                                                                onChange={(e) => handleProductInputChange(p.id || p._id, "inputQty", e.target.value)}
                                                            />
                                                        </td>
                                                        <td data-label="Bonus">
                                                            <input
                                                                type="number" min="0"
                                                                className="asi-num-input"
                                                                value={p.inputBonus}
                                                                placeholder="0"
                                                                onChange={(e) => handleProductInputChange(p.id || p._id, "inputBonus", e.target.value)}
                                                            />
                                                        </td>
                                                        <td data-label="Action">
                                                            <button
                                                                className={`asi-add-btn ${addedItems.some((i) => i.productId === (p.id || p._id)) ? "asi-added" : ""}`}
                                                                onClick={() => handleAddClick(p)}
                                                            >
                                                                {addedItems.some((i) => i.productId === (p.id || p._id)) ? "✓" : "+"}
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {loadingProducts && (
                                                    <tr><td colSpan="5" className="asi-loading">Loading more...</td></tr>
                                                )}
                                                {!loadingProducts && products.length === 0 && (
                                                    <tr><td colSpan="5" className="asi-loading">No products found</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Invoice preview ── */}
                        <div className="asi-invoice-section">
                            <div className="asi-inv-header">
                                <div className="asi-company-block">
                                    <h2 className="asi-company-name">BioGenHoldings Pvt Ltd</h2>
                                    <p className="asi-company-tag"><strong>The Future of Healthcare</strong></p>
                                    <p className="asi-company-link">www.biogenholdings.com</p>
                                    <p>Tangalle Road, Meddawaththa, Matara</p>
                                    <p>Tel: +94 774 088 839</p>
                                </div>
                                <div className="asi-inv-title-block">
                                    <div className="asi-inv-title">ORDER</div>
                                    <p className="asi-inv-date">{displayDate}</p>
                                </div>
                            </div>

                            <hr className="asi-divider" />

                            <div className="asi-inv-info-bar">
                                <div className="asi-inv-info-item">
                                    <span className="asi-inv-info-label">Order No. :</span>
                                    <span className="asi-inv-info-value">
                                        {isEdit ? (initialInvoice?.invoiceNumber || "—") : "Auto Generated"}
                                    </span>
                                </div>
                                <div className="asi-inv-info-item">
                                    <span className="asi-inv-info-label">Order Date :</span>
                                    <span className="asi-inv-info-value">{displayDate}</span>
                                </div>
                                <div className="asi-inv-info-item">
                                    <span className="asi-inv-info-label">Credit Terms :</span>
                                    <span className="asi-inv-info-value">
                                        {selectedCustomer?.creditPeriod ? `${selectedCustomer.creditPeriod} Days` : "COD"}
                                    </span>
                                </div>
                                <div className="asi-inv-info-item">
                                    <span className="asi-inv-info-label">Sales Rep :</span>
                                    <span className="asi-inv-info-value">{currentUserName || "Not Assigned"}</span>
                                </div>
                            </div>

                            <div className="asi-inv-meta">
                                <div className="asi-bill-to">
                                    <div className="asi-meta-label">BILL TO</div>
                                    <hr className="asi-meta-divider" />
                                    {selectedCustomer ? (
                                        <>
                                            <p className="asi-bill-name">{selectedCustomer.name}</p>
                                            {selectedCustomer.address && <p>{selectedCustomer.address}</p>}
                                            <p>{selectedCustomer.contact_No}</p>
                                        </>
                                    ) : (
                                        <p className="asi-meta-placeholder">Select a customer</p>
                                    )}
                                </div>
                                <div className="asi-payment-info">
                                    <div className="asi-meta-label">PAYMENT INFO</div>
                                    <hr className="asi-meta-divider" />
                                    <div className="asi-pay-row">
                                        <span>Payment Method:</span><span>Credit</span>
                                    </div>
                                    <div className="asi-pay-row">
                                        <span>Credit Terms:</span>
                                        <span>{selectedCustomer?.creditPeriod ? `${selectedCustomer.creditPeriod} Days` : "30 Days"}</span>
                                    </div>
                                    <div className="asi-pay-row">
                                        <span>Sales Rep:</span>
                                        <span>{currentUserName || "Not Assigned"}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="asi-inv-table-scroll">
                                <table className="asi-inv-table">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Product</th>
                                            <th>Unit</th>
                                            <th>Qty</th>
                                            <th>Bonus</th>
                                            <th>MRP</th>
                                            <th>Price</th>
                                            <th>Amount</th>
                                            <th>BCI</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {addedItems.length === 0 ? (
                                            <tr>
                                                <td colSpan="10" className="asi-inv-empty">
                                                    No items added yet. Add products from the section above.
                                                </td>
                                            </tr>
                                        ) : (
                                            addedItems.map((item, idx) => (
                                                <tr key={item.productId} data-label={idx + 1}>
                                                    <td data-label="#">{idx + 1}</td>
                                                    <td data-label="Product">
                                                        <div>
                                                            <div className="asi-inv-prod-name">{item.productName}</div>
                                                            <div className="asi-inv-prod-sub">* B/N &amp; Exp: Default (30/11/2027)</div>
                                                        </div>
                                                    </td>
                                                    <td data-label="Unit">{item.unit || "-"}</td>
                                                    <td data-label="Qty">{item.quantity}</td>
                                                    <td data-label="Bonus">{item.bonus > 0 ? item.bonus : "-"}</td>
                                                    <td className="asi-mrp-inv-cell" data-label="MRP">
                                                        {item.mrp > 0
                                                            ? parseFloat(item.mrp).toFixed(2)
                                                            : <span className="asi-no-mrp">—</span>}
                                                    </td>
                                                    <td data-label="Price">{parseFloat(item.sellingPrice).toFixed(2)}</td>
                                                    <td data-label="Amount">{parseFloat(item.totalAmount).toFixed(2)}</td>
                                                    <td className="asi-bci-cell" data-label="BCI">
                                                        {(() => {
                                                            const divisor = (item.quantity || 0) + (item.bonus || 0);
                                                            return divisor > 0 ? (item.totalAmount / divisor).toFixed(2) : "-";
                                                        })()}
                                                    </td>
                                                    <td data-label="Action">
                                                        <div className="asi-inv-actions">
                                                            <Edit3 size={15} className="asi-edit-icon" onClick={() => handleEditItem(item.productId)} />
                                                            <Trash2 size={15} className="asi-delete-icon" onClick={() => removeItem(item.productId)} />
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {addedItems.length > 0 && (
                                <div className="asi-totals">
                                    <div className="asi-total-row">
                                        <span><b>Total</b> (LKR)</span>
                                        <span>{totalBeforeExtras.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="asi-total-row" style={{ position: "relative" }}>
                                        <span
                                            style={{ cursor: "pointer", color: "#7c3aed", fontWeight: 600 }}
                                            onClick={() => setShowDiscountPopup(!showDiscountPopup)}
                                        >
                                            Additional Discount (LKR)
                                        </span>
                                        <span style={{ fontWeight: 600 }}>
                                            {additionalDiscount.value
                                                ? additionalDiscount.type === DiscountTypeEnum.percentage
                                                    ? `${getAdditionalDiscountValue().toFixed(2)} (${additionalDiscount.value}%)`
                                                    : `${parseFloat(additionalDiscount.value).toFixed(2)}`
                                                : "0.00"}
                                        </span>
                                        {showDiscountPopup && (
                                            <AdditionalDiscountPopup
                                                initialDiscount={additionalDiscount}
                                                onSave={(data) => { setAdditionalDiscount(data); setShowDiscountPopup(false); }}
                                                onClose={() => setShowDiscountPopup(false)}
                                            />
                                        )}
                                    </div>
                                    <div className={`asi-total-row asi-grand-total ${isOverCredit ? "over" : ""}`}>
                                        <span><b>Due</b> (LKR)</span>
                                        <span>{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default SalesRepOrderForm;
