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
import { DiscountTypeEnum } from "../../enums/DiscountTypeEnum";
import { AdditionalDiscountPopup } from "./AdditionalDiscountPopup";
import "./SalesRepOrder.css";

const SalesRepOrder = () => {
    const { showToast } = useToast();
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
    const [stockData, setStockData] = useState([]);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [currentUserName, setCurrentUserName] = useState("");

    const [additionalDiscount, setAdditionalDiscount] = useState({ type: DiscountTypeEnum.cash, value: "" });
    const [showDiscountPopup, setShowDiscountPopup] = useState(false);

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
            console.log(res.data);
            const data = (res.data?.customers || res.data || []);
            setCustomers(Array.isArray(data) && data.length > 0 ? data : []);
        } catch (error) {
            setCustomers([]);
        }
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
            let data = [];
            let total = 0;
            let res;

            if (search) {
                res = await searchProduct(search);
                data = res.data?.products || res.data || [];
                total = 1;
            } else {
                const sortFilter = "ASC";
                const catIdParam = categoryId !== "all" ? categoryId : null;
                res = await getPaginatedProductResults(page, pageSize, sortFilter, catIdParam);
                data = res.data?.products || res.data?.content || [];
                total = res.data?.totalPages || 1;
            }

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
            console.error("Failed to fetch products:", error);
        } finally {
            setLoadingProducts(false);
        }
    }, [pageSize, stockData]);

    useEffect(() => {
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
            fetchProducts(0, "all", "", false, resolvedStock);
        };
        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
    }, [selectedCategory, productSearch, fetchProducts]);

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
        showToast("success", `Added ${product.name} to Order`);
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

    const getAdditionalDiscountValue = () => {
        const total = addedItems.reduce((sum, item) => sum + (item.totalAmount || 0), 0);
        const value = parseFloat(additionalDiscount.value) || 0;
        if (additionalDiscount.type === DiscountTypeEnum.percentage) {
            return (total * value) / 100;
        }
        return value;
    };

    const totalBeforeExtras = addedItems.reduce((sum, item) => sum + (item.totalAmount || 0), 0);
    const discountAmount = getAdditionalDiscountValue();
    const grandTotal = totalBeforeExtras - discountAmount;
    const availableCredit = selectedCustomer ? (selectedCustomer.creditLimit - (selectedCustomer.dueAmount || 0)) : 0;
    const isOverCredit = selectedCustomer && grandTotal > availableCredit;

    const handleSubmitInvoice = async () => {
        if (!selectedCustomer) { showToast("error", "Please select a customer"); return; }
        if (addedItems.length === 0) { showToast("error", "Please add at least one product"); return; }

        const mappedItems = [];

        addedItems.forEach(item => {
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
            date: new Date().toLocaleDateString('en-CA'),
            grandTotal: totalBeforeExtras,
            additionalDiscountType: additionalDiscount.type,
            additionalDiscountValue: parseFloat(additionalDiscount.value) || 0,
            items: mappedItems
        };

        try {
            const res = await createSalesOrder(payload);
            const invoiceNo = res.data?.invoiceNumber || res.data?.data?.invoiceNumber;
            showToast("success", `Sales Order created! ${invoiceNo ? `Order No: ${invoiceNo}` : ""}`);
            setAddedItems([]);
            setSelectedCustomer(null);
            setCustomerSearch("");
            setProducts(prev => prev.map(p => ({ ...p, inputQty: "", inputBonus: "" })));
        } catch (error) {
            const msg = error?.response?.data?.message || "Failed to create Sales Order";
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

                        <header className="asi-header">
                            <div className="asi-header-left">
                                <div className="asi-header-icon">
                                    <FileText size={22} />
                                </div>
                                <div>
                                    <h1 className="asi-header-title">Create Sales Order</h1>
                                    <p className="asi-header-sub">Generate new orders for customers</p>
                                </div>
                            </div>
                            <div className="asi-header-actions">
                                <button className="asi-btn-back" onClick={() => window.history.back()}>Back</button>
                                <button className="asi-btn-confirm" onClick={handleSubmitInvoice} disabled={isOverCredit}>Confirm Order</button>
                            </div>
                        </header>

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
                                                <strong className="asi-text-warning">LKR {(selectedCustomer.totalDue || 0).toLocaleString()}</strong>
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
                                                        <td className="asi-product-name-cell" data-label="Product">
                                                            <div className="asi-prod-name">{p.name}</div>
                                                            <div className="asi-prod-unit">{p.unit}</div>
                                                        </td>
                                                        <td className="asi-price-cell" data-label="Price">{p.sellingPrice?.toFixed(2)}</td>
                                                        <td data-label="Qty">
                                                            <input
                                                                type="number" min="0"
                                                                className="asi-num-input"
                                                                value={p.inputQty}
                                                                placeholder="0"
                                                                onChange={e => handleProductInputChange(p.id || p._id, "inputQty", e.target.value)}
                                                            />
                                                        </td>
                                                        <td data-label="Bonus">
                                                            <input
                                                                type="number" min="0"
                                                                className="asi-num-input"
                                                                value={p.inputBonus}
                                                                placeholder="0"
                                                                onChange={e => handleProductInputChange(p.id || p._id, "inputBonus", e.target.value)}
                                                            />
                                                        </td>
                                                        <td data-label="Action">
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
                                    <p className="asi-inv-date">{formattedDate}</p>
                                </div>
                            </div>

                            <hr className="asi-divider" />

                            <div className="asi-inv-info-bar">
                                <div className="asi-inv-info-item">
                                    <span className="asi-inv-info-label">Order No. :</span>
                                    <span className="asi-inv-info-value">Auto Generated</span>
                                </div>
                                <div className="asi-inv-info-item">
                                    <span className="asi-inv-info-label">Order Date :</span>
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
                                                        {item.mrp > 0 ? parseFloat(item.mrp).toFixed(2) : <span className="asi-no-mrp">—</span>}
                                                    </td>
                                                    <td data-label="Price">{parseFloat(item.sellingPrice).toFixed(2)}</td>
                                                    <td data-label="Amount">{parseFloat(item.totalAmount).toFixed(2)}</td>
                                                    <td className="asi-bci-cell" data-label="BCI">
                                                        {(() => {
                                                            const divisor = (item.quantity || 0) + (item.bonus || 0);
                                                            return divisor > 0
                                                                ? (item.totalAmount / divisor).toFixed(2)
                                                                : "-";
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
                                    <div className="asi-total-row" style={{ position: 'relative' }}>
                                        <span
                                            style={{ cursor: 'pointer', color: '#7c3aed', fontWeight: 600 }}
                                            onClick={() => { setShowDiscountPopup(!showDiscountPopup) }}
                                        >
                                            Additional Discount (LKR)
                                        </span>
                                        <span style={{ fontWeight: 600 }}>
                                            {additionalDiscount.value ? (
                                                additionalDiscount.type === DiscountTypeEnum.percentage
                                                    ? `${getAdditionalDiscountValue().toFixed(2)} (${additionalDiscount.value}%)`
                                                    : `${parseFloat(additionalDiscount.value).toFixed(2)}`
                                            ) : "0.00"}
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

export default SalesRepOrder;
