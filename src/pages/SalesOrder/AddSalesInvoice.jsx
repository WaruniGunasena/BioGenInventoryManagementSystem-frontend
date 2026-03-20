import React, { useState, useEffect, useCallback, useRef } from "react";
import Layout from "../../components/Layout";
import Sidebar from "../../components/Sidebar";
import { Search, Trash2, AlertCircle, FileText, Edit3, ShoppingCart } from "lucide-react";
import { getAllCustomers } from "../../api/customerService";
import { getPaginatedProductResults, searchProduct } from "../../api/productService";
import { getAllCategory } from "../../api/categoryService";
import { getAllStock } from "../../api/stockService";
import { createSalesOrder } from "../../api/salesOrderService";
import { useToast } from "../../context/ToastContext";
import { getUserId, getUserName } from "../../components/common/Utils/userUtils/userUtils";
import "./AddSalesInvoice.css";

const AddSalesInvoice = () => {
    const { showToast } = useToast();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const customerDropdownRef = useRef(null);
    const topSelectionRef = useRef(null);

    // Customer Selection State
    const [customers, setCustomers] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [customerSearch, setCustomerSearch] = useState("");
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    // Product List State
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [productSearch, setProductSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [pageSize] = useState(5);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [showProductSearch, setShowProductSearch] = useState(false);

    // Invoice/Order State
    const [addedItems, setAddedItems] = useState([]);
    const [stockData, setStockData] = useState([]);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [currentUserName, setCurrentUserName] = useState("");

    // Dummy Data Fallbacks
    const dummyCustomers = [
        { id: 1, name: "Walk-in Customer", contact_No: "0000000000", creditLimit: 50000, dueAmount: 5000 },
        { id: 2, name: "BioGen Clinic", contact_No: "0112345678", creditLimit: 200000, dueAmount: 150000 },
        { id: 3, name: "City Pharmacy", contact_No: "0771234567", creditLimit: 100000, dueAmount: 20000 }
    ];

    const dummyCategories = [
        { id: 1, name: "Antibiotics" },
        { id: 2, name: "Painkillers" },
        { id: 3, name: "Supplements" },
        { id: 4, name: "Surgicals" }
    ];

    const dummyProducts = [
        { id: 101, name: "Amoxicillin 500mg", sellingPrice: 45.50, unit: "Tablet", categoryId: 1 },
        { id: 102, name: "Paracetamol 500mg", sellingPrice: 5.00, unit: "Tablet", categoryId: 2 },
        { id: 103, name: "Vitamin C 1000mg", sellingPrice: 120.00, unit: "Bottle", categoryId: 3 },
        { id: 104, name: "Surgical Gloves", sellingPrice: 85.00, unit: "Pair", categoryId: 4 },
        { id: 105, name: "Metformin 500mg", sellingPrice: 12.00, unit: "Tablet", categoryId: 1 }
    ];

    const fetchUserId = useCallback(async () => {
        try {
            const id = await getUserId();
            const name = await getUserName();
            setCurrentUserId(id);
            setCurrentUserName(name);
        } catch (error) {
            console.error("Error fetching user data:", error);
        }
    }, []);

    const fetchCustomers = useCallback(async () => {
        try {
            const res = await getAllCustomers();
            const data = (res.data?.customers || res.data || []);
            setCustomers(Array.isArray(data) && data.length > 0 ? data : dummyCustomers);
        } catch (error) {
            setCustomers(dummyCustomers);
        }
    }, []);

    const fetchCategories = useCallback(async () => {
        try {
            const res = await getAllCategory();
            const data = res.data || [];
            setCategories(Array.isArray(data) && data.length > 0 ? data : dummyCategories);
        } catch (error) {
            setCategories(dummyCategories);
        }
    }, []);


    // fetchProducts accepts optional pre-loaded stock array to avoid closure staleness
    const fetchProducts = useCallback(async (page, categoryId, search, append = false, resolvedStock = null) => {
        if (!append) setLoadingProducts(true);
        try {
            const filter = categoryId !== "all" ? categoryId : "";
            let data = [];
            let total = 0;
            let res;

            if (search) {
                res = await searchProduct(search);
                data = res.data?.products || res.data || [];
                total = 1;
            } else {
                res = await getPaginatedProductResults(page, pageSize, filter);
                data = res.data?.products || res.data?.content || [];
                total = res.data?.totalPages || 1;
            }

            if (!Array.isArray(data) || data.length === 0) {
                if (page === 0) {
                    data = dummyProducts.filter(p =>
                        (categoryId === "all" || p.categoryId.toString() === categoryId.toString()) &&
                        (search === "" || p.name.toLowerCase().includes(search.toLowerCase()))
                    );
                    total = 1;
                } else {
                    data = [];
                }
            }

            // Use passed-in stock OR the current stockData state
            const stock = resolvedStock !== null ? resolvedStock : stockData;

            const productsWithInputs = data.map(p => {
                const pid = (p.id || p._id)?.toString();
                const stockItem = stock.find(s => s.productId?.toString() === pid);
                const resolvedPrice = stockItem?.sellingPrice ?? p.sellingPrice ?? 0;
                return {
                    ...p,
                    sellingPrice: resolvedPrice,
                    inputQty: p.inputQty || "",
                    inputBonus: p.inputBonus || ""
                };
            });

            setProducts(prev => append ? [...prev, ...productsWithInputs] : productsWithInputs);
            setTotalPages(total);
            setHasMore(page < total - 1);
        } catch (error) {
            if (!append) {
                const filteredDummy = dummyProducts.filter(p =>
                    (categoryId === "all" || p.categoryId.toString() === categoryId.toString()) &&
                    (search === "" || p.name.toLowerCase().includes(search.toLowerCase()))
                );
                setProducts(filteredDummy.map(p => ({ ...p, inputQty: "", inputBonus: "" })));
                setTotalPages(1);
            }
        } finally {
            setLoadingProducts(false);
        }
    }, [pageSize, stockData]);

    useEffect(() => {
        // Load stock FIRST, then load products with the stock data so prices resolve immediately
        const init = async () => {
            await Promise.all([fetchCustomers(), fetchCategories(), fetchUserId()]);
            let resolvedStock = [];
            try {
                const res = await getAllStock();
                if (res.data && Array.isArray(res.data)) resolvedStock = res.data;
                else if (res.data?.productStocks && Array.isArray(res.data.productStocks)) resolvedStock = res.data.productStocks;
                setStockData(resolvedStock);
            } catch (e) {
                console.error("Stock fetch failed:", e);
            }
            // Pass stock inline so fetchProducts doesn't rely on stale closure
            fetchProducts(0, "all", "", false, resolvedStock);
        };
        init();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (customerDropdownRef.current && !customerDropdownRef.current.contains(event.target)) {
                setShowCustomerDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        fetchProducts(0, selectedCategory, productSearch);
    }, [selectedCategory, productSearch]);

    const handleProductSearch = (val) => {
        setProductSearch(val);
        setCurrentPage(0);
    };

    const handleCustomerSearch = (e) => {
        setCustomerSearch(e.target.value);
        setShowCustomerDropdown(true);
    };

    const selectCustomer = (customer) => {
        setSelectedCustomer(customer);
        setCustomerSearch(customer.name);
        setShowCustomerDropdown(false);
    };

    const handleScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        if (scrollHeight - scrollTop <= clientHeight * 1.5 && hasMore && !loadingProducts && !productSearch) {
            const nextPage = currentPage + 1;
            setCurrentPage(nextPage);
            fetchProducts(nextPage, selectedCategory, productSearch, true);
        }
    };

    const addToOrder = useCallback((product, qty, bonus) => {
        setAddedItems(prev => {
            const existingIndex = prev.findIndex(item => item.productId === (product.id || product._id));
            const newItem = {
                productId: product.id || product._id,
                productName: product.name,
                sellingPrice: product.sellingPrice || 0,
                mrp: product.mrp || 0,
                quantity: qty,
                bonus: bonus,
                unit: product.unit || "Unit",
                totalAmount: (product.sellingPrice || 0) * qty
            };
            if (existingIndex > -1) {
                const newItems = [...prev];
                newItems[existingIndex] = newItem;
                return newItems;
            }
            return [...prev, newItem];
        });
    }, []);

    const handleProductInputChange = (productId, field, value) => {
        setProducts(prev => prev.map(p =>
            (p.id || p._id) === productId ? { ...p, [field]: value } : p
        ));
    };

    const handleAddClick = (product) => {
        const qty = parseFloat(product.inputQty) || 0;
        const bonus = parseFloat(product.inputBonus) || 0;
        if (qty <= 0 && bonus <= 0) {
            showToast("warning", "Please enter a valid quantity or bonus");
            return;
        }
        addToOrder(product, qty, bonus);
        showToast("success", `Added ${product.name} to invoice`);
    };

    const handleEditItem = (productId) => {
        if (topSelectionRef.current) {
            topSelectionRef.current.scrollIntoView({ behavior: "smooth" });
            showToast("info", "Update qty and click Add again to edit");
        }
    };

    const removeItem = (productId) => {
        setAddedItems(prev => prev.filter(item => item.productId !== productId));
        setProducts(prev => prev.map(p =>
            (p.id || p._id) === productId ? { ...p, inputQty: "", inputBonus: "" } : p
        ));
    };

    const grandTotal = addedItems.reduce((sum, item) => sum + item.totalAmount, 0);
    const availableCredit = selectedCustomer ? (selectedCustomer.creditLimit - (selectedCustomer.dueAmount || 0)) : 0;
    const isOverCredit = selectedCustomer && grandTotal > availableCredit;

    const handleSubmitInvoice = async () => {
        if (!selectedCustomer) { showToast("error", "Please select a customer"); return; }
        if (addedItems.length === 0) { showToast("error", "Please add at least one product"); return; }

        // Expand each item into sale line + optional bonus line (separate zero-price entry)
        // This matches the behaviour in the existing SalesOrder flow
        const mappedItems = [];

        addedItems.forEach(item => {
            // Regular sale line
            mappedItems.push({
                productId: item.productId,
                productName: item.productName,
                unit: item.unit || "",
                quantity: item.quantity,
                sellingPrice: item.sellingPrice,
                totalAmount: item.totalAmount,
                discountPercent: item.discountPercent ?? 0,
                discountedPrice: item.discountedPrice ?? 0
            });

            // Bonus line — separate entry with qty = bonusQty and price = 0
            if (item.bonus > 0) {
                mappedItems.push({
                    productId: item.productId,
                    productName: item.productName,
                    unit: item.unit || "",
                    quantity: item.bonus,
                    sellingPrice: 0,
                    totalAmount: 0,
                    discountPercent: 0,
                    discountedPrice: 0
                });
            }
        });

        const payload = {
            customerId: selectedCustomer.id || selectedCustomer._id,
            userId: currentUserId,
            date: new Date().toISOString().split("T")[0],
            grandTotal,
            items: mappedItems
        };

        try {
            const res = await createSalesOrder(payload);
            const invoiceNo = res.data?.invoiceNumber || res.data?.data?.invoiceNumber;
            showToast("success", `Sales Invoice created! ${invoiceNo ? `Invoice No: ${invoiceNo}` : ""}`);
            setAddedItems([]);
            setSelectedCustomer(null);
            setCustomerSearch("");
            setProducts(prev => prev.map(p => ({ ...p, inputQty: "", inputBonus: "" })));
        } catch (error) {
            const msg = error?.response?.data?.message || "Failed to create Sales Invoice";
            showToast("error", msg);
        }
    };

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(customerSearch.toLowerCase())
    );

    const today = new Date();
    const formattedDate = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;

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

                        {/* ── Page Header ── */}
                        <header className="asi-header">
                            <div className="asi-header-left">
                                <div className="asi-header-icon">
                                    <FileText size={22} />
                                </div>
                                <div>
                                    <h1 className="asi-header-title">Create Sales Invoice</h1>
                                    <p className="asi-header-sub">Generate new invoices for customers</p>
                                </div>
                            </div>
                            <div className="asi-header-actions">
                                <button className="asi-btn-back" onClick={() => window.history.back()}>Back</button>
                                <button className="asi-btn-confirm" onClick={handleSubmitInvoice}>Confirm Invoice</button>
                            </div>
                        </header>

                        {/* ── Top Section: Customer (top) + Product (below) in one card ── */}
                        <div className="asi-top-section" ref={topSelectionRef}>
                        <div className="asi-card asi-combined-card">

                            {/* Customer Info (top) */}
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
                                                filteredCustomers.map(c => (
                                                    <div key={c.id || c._id} className="asi-dropdown-item" onClick={() => selectCustomer(c)}>
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
                                            <strong className="asi-text-warning">LKR {(selectedCustomer.dueAmount || 0).toLocaleString()}</strong>
                                        </div>
                                        <div className={`asi-credit-row asi-credit-available ${isOverCredit ? "over" : "ok"}`}>
                                            <span>Available Credit</span>
                                            <strong>LKR {availableCredit.toLocaleString()}</strong>
                                        </div>
                                        {isOverCredit && (
                                            <div className="asi-over-limit">
                                                <AlertCircle size={14} /> Invoice exceeds credit limit!
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <hr className="asi-section-divider" />

                            {/* Product Selection (below) */}
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
                                            {categories.map(cat => (
                                                <option key={cat.id || cat._id} value={cat.id || cat._id}>{cat.name}</option>
                                            ))}
                                        </select>
                                        <button className="asi-search-toggle" onClick={() => setShowProductSearch(s => !s)}>
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
                                            onChange={e => handleProductSearch(e.target.value)}
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
                                            {products.map(p => (
                                                <tr key={p.id || p._id}>
                                                    <td className="asi-product-name-cell">
                                                        <div className="asi-prod-name">{p.name}</div>
                                                        <div className="asi-prod-unit">{p.unit}</div>
                                                    </td>
                                                    <td className="asi-price-cell">{p.sellingPrice?.toFixed(2)}</td>
                                                    <td>
                                                        <input
                                                            type="number" min="0"
                                                            className="asi-num-input"
                                                            value={p.inputQty}
                                                            placeholder="0"
                                                            onChange={e => handleProductInputChange(p.id || p._id, "inputQty", e.target.value)}
                                                        />
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="number" min="0"
                                                            className="asi-num-input"
                                                            value={p.inputBonus}
                                                            placeholder="0"
                                                            onChange={e => handleProductInputChange(p.id || p._id, "inputBonus", e.target.value)}
                                                        />
                                                    </td>
                                                    <td>
                                                        <button
                                                            className={`asi-add-btn ${addedItems.some(i => i.productId === (p.id || p._id)) ? "asi-added" : ""}`}
                                                            onClick={() => handleAddClick(p)}
                                                        >
                                                            {addedItems.some(i => i.productId === (p.id || p._id)) ? "✓" : "+"}
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {loadingProducts && <tr><td colSpan="5" className="asi-loading">Loading more...</td></tr>}
                                            {!loadingProducts && products.length === 0 && <tr><td colSpan="5" className="asi-loading">No products found</td></tr>}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                        </div>

                        {/* ── Bottom: Formal Invoice Preview ── */}
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
                                    <div className="asi-inv-title">INVOICE</div>
                                    <p className="asi-inv-date">{formattedDate}</p>
                                </div>
                            </div>

                            <hr className="asi-divider" />

                            {/* Invoice Info Bar */}
                            <div className="asi-inv-info-bar">
                                <div className="asi-inv-info-item">
                                    <span className="asi-inv-info-label">Invoice No. :</span>
                                    <span className="asi-inv-info-value">Auto Generated</span>
                                </div>
                                <div className="asi-inv-info-item">
                                    <span className="asi-inv-info-label">Invoice Date :</span>
                                    <span className="asi-inv-info-value">{formattedDate}</span>
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
                                        <span>Payment Method:</span>
                                        <span>Credit</span>
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
                                            <tr key={item.productId}>
                                                <td>{idx + 1}</td>
                                                <td>
                                                    <div className="asi-inv-prod-name">{item.productName}</div>
                                                    <div className="asi-inv-prod-sub">* B/N &amp; Exp: Default (30/11/2027)</div>
                                                </td>
                                                <td>{item.unit || "-"}</td>
                                                <td>{item.quantity}</td>
                                                <td>{item.bonus > 0 ? item.bonus : "-"}</td>
                                                <td className="asi-mrp-inv-cell">
                                                    {item.mrp > 0 ? parseFloat(item.mrp).toFixed(2) : <span className="asi-no-mrp">—</span>}
                                                </td>
                                                <td>{parseFloat(item.sellingPrice).toFixed(2)}</td>
                                                <td>{parseFloat(item.totalAmount).toFixed(2)}</td>
                                                <td className="asi-bci-cell">
                                                    {(() => {
                                                        const divisor = (item.quantity || 0) + (item.bonus || 0);
                                                        return divisor > 0
                                                            ? (item.totalAmount / divisor).toFixed(2)
                                                            : "-";
                                                    })()}
                                                </td>
                                                <td>
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
                            </div>{/* end asi-inv-table-scroll */}

                            {addedItems.length > 0 && (
                                <div className="asi-totals">
                                    <div className="asi-total-row">
                                        <span>Total (LKR)</span>
                                        <span>{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="asi-total-row">
                                        <span>Additional Discount</span>
                                        <span>0.00</span>
                                    </div>
                                    <div className="asi-total-row">
                                        <span>Payment Total</span>
                                        <span>0.00</span>
                                    </div>
                                    <div className={`asi-total-row asi-grand-total ${isOverCredit ? "over" : ""}`}>
                                        <span>Due (LKR)</span>
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

export default AddSalesInvoice;
