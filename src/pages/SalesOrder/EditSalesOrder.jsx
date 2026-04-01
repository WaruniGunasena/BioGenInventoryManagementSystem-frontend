import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import Layout from "../../components/Layout";
import { getAllCustomers } from "../../api/customerService";
import { getAllProducts } from "../../api/productService";
import { updateSalesOrder } from "../../api/salesOrderService";
import { useToast } from "../../context/ToastContext";
import AddCustomerModal from "../../components/Customers/AddCustomerModal";
import { AdditionalDiscountPopup } from "./AdditionalDiscountPopup";
import { CourierChargesPopup } from "./CourierChargesPopup";
import { DiscountTypeEnum } from "../../enums/DiscountTypeEnum";
import {
    PlusCircle,
    Trash2,
    Edit3,
    FileText
} from "lucide-react";
import { getAllStock } from "../../api/stockService";
import { getUserId, getUserName } from "../../components/common/Utils/userUtils/userUtils";
import "./SalesOrder.css";

const EditSalesOrder = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const invoice = location.state?.invoice;
    const invoiceId = invoice?.salesOrderId || invoice?.id;
    const { showToast } = useToast();
    const formRef = useRef(null);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]);
    const [stockData, setStockData] = useState([]);
    const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);

    const [formData, setFormData] = useState({
        customerId: "",
        date: new Date().toLocaleDateString('en-CA'),
        creditTerm: "",
        invoiceNumber: null,
        productId: "",
        productName: "",
        productCode: "",
        sellingPrice: "",
        unit: "",
        discountPercent: "0.00",
        discountedPrice: "0.00",
        quantity: "",
        preIssue: "",
        totalAmount: "0.00",
    });

    const [selectedCustomerData, setSelectedCustomerData] = useState(null);
    const [addedItems, setAddedItems] = useState([]);
    const [editingItemId, setEditingItemId] = useState(null);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [currentUserName, setCurrentUserName] = useState("");

    const [additionalDiscount, setAdditionalDiscount] = useState({ type: DiscountTypeEnum.cash, value: "" });
    const [courierCharges, setCourierCharges] = useState("");
    const [showDiscountPopup, setShowDiscountPopup] = useState(false);
    const [showCourierPopup, setShowCourierPopup] = useState(false);

    useEffect(() => {
        fetchCustomers();
        fetchProducts();
        fetchUserId();
    }, []);

    useEffect(() => {
        if (invoice && customers.length > 0 && products.length > 0) {
            const customer = customers.find(c => (c.id || c._id) === invoice.customerId || c.name === invoice.customerName);
            if (customer) {
                setSelectedCustomerData(customer);
                setFormData(prev => ({
                    ...prev,
                    customerId: customer.id || customer._id,
                    creditTerm: customer.creditPeriod || "Not Specified",
                    invoiceNumber: invoice.invoiceNumber,
                    date: invoice.date || prev.date
                }));
            } else {
                setFormData(prev => ({
                    ...prev,
                    invoiceNumber: invoice.invoiceNumber,
                    date: invoice.date || prev.date
                }));
            }

            setAdditionalDiscount({
                type: invoice.additionalDiscountType || DiscountTypeEnum.cash,
                value: invoice.additionalDiscountValue || ""
            });
            setCourierCharges(invoice.courierCharges || "");

            // Map items
            const salelines = (invoice.items || []).filter(i => parseFloat(i.sellingPrice) > 0);
            const preloadedItems = salelines.map((item, index) => {
                const bonusLine = (invoice.items || []).find(
                    b => (b.productId === item.productId || b.product?.id === item.productId) &&
                        parseFloat(b.sellingPrice) === 0
                );
                return {
                    id: Date.now() + index,
                    productId: item.productId || item.product?.id,
                    productName: item.productName || item.product?.name || "",
                    productCode: item.productCode || item.itemCode || "",
                    sellingPrice: parseFloat(item.sellingPrice),
                    quantity: item.quantity,
                    preIssue: bonusLine ? bonusLine.quantity : 0,
                    unit: item.unit || "",
                    packSize: item.packSize || "",
                    discountPercent: item.discountPercent || "0.00",
                    discountedPrice: item.discountedPrice || "0.00",
                    totalAmount: parseFloat(item.totalAmount)
                };
            });
            setAddedItems(preloadedItems);
        }
    }, [invoice, customers, products]);

    const fetchUserId = async () => {
        try {
            const id = await getUserId();
            const name = await getUserName();
            setCurrentUserId(id);
            setCurrentUserName(name);
        } catch (error) {
            console.error("Error fetching user data:", error);
        }
    };

    const fetchCustomers = async () => {
        try {
            const res = await getAllCustomers();
            let data = [];
            if (res.data && Array.isArray(res.data)) data = res.data;
            else if (res.data && res.data.customers && Array.isArray(res.data.customers)) data = res.data.customers;
            setCustomers(data);
        } catch (error) {
            console.error("Error fetching customers:", error);
        }
    };

    const fetchProducts = async () => {
        try {
            const [prodRes, stockRes] = await Promise.all([
                getAllProducts(),
                getAllStock()
            ]);

            let prodData = [];
            if (prodRes.data && Array.isArray(prodRes.data)) prodData = prodRes.data;
            else if (prodRes.data && prodRes.data.customers && Array.isArray(prodRes.data.customers)) prodData = prodRes.data.customers; // Assuming this might be a typo in original code if it said customers?
            else if (prodRes.data && prodRes.data.products && Array.isArray(prodRes.data.products)) prodData = prodRes.data.products;
            setProducts(prodData);

            let sData = [];
            if (stockRes.data && Array.isArray(stockRes.data)) sData = stockRes.data;
            else if (stockRes.data && stockRes.data.productStocks && Array.isArray(stockRes.data.productStocks)) sData = stockRes.data.productStocks;
            setStockData(sData);

        } catch (error) {
            console.error("Error fetching products or stock:", error);
        }
    };

    const handleCustomerChange = (e) => {
        const id = e.target.value;
        const customer = customers.find((c) => (c.id || c._id).toString() === id.toString());
        setSelectedCustomerData(customer);
        setFormData((prev) => ({
            ...prev,
            customerId: id,
            creditTerm: customer ? customer.creditPeriod || "Not Specified" : "",
        }));
    };

    const handleProductChange = (e) => {
        const id = e.target.value;
        const product = products.find((p) => (p.id || p._id).toString() === id.toString());
        const stockItem = stockData.find((s) => (s.productId).toString() === id.toString());

        setFormData((prev) => {
            const sellingPrice = stockItem ? stockItem.sellingPrice || 0 : (product ? product.sellingPrice || 0 : 0);
            const packSize = stockItem.packSize;
            const quantity = parseFloat(prev.quantity) || 0;
            const availableQuantity = stockItem.totalQuantity;

            return {
                ...prev,
                productId: id,
                productName: product ? product.name : "",
                productCode: stockItem ? stockItem.itemCode : "",
                sellingPrice: sellingPrice,
                unit: product ? product.unit || "" : "",
                packSize: packSize || "",
                discountPercent: "0.00",
                discountedPrice: "0.00",
                totalAmount: (sellingPrice * quantity).toFixed(2),
                availableQuantity: availableQuantity || 0,
            };
        });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => {
            const newData = { ...prev, [name]: value };

            if (["sellingPrice", "quantity", "discountPercent", "discountedPrice"].includes(name)) {
                const price = parseFloat(newData.sellingPrice) || 0;
                const qty = parseFloat(newData.quantity) || 0;
                let dp = parseFloat(newData.discountPercent);
                let dprice = parseFloat(newData.discountedPrice);

                if (isNaN(dp)) dp = 0;
                if (isNaN(dprice)) dprice = 0;

                if (name === "sellingPrice") {
                    dprice = price - (price * dp / 100);
                    newData.discountedPrice = dprice.toFixed(2);
                } else if (name === "discountPercent") {
                    dprice = price - (price * dp / 100);
                    newData.discountedPrice = dprice.toFixed(2);
                } else if (name === "discountedPrice") {
                    dp = price > 0 ? ((price - dprice) / price) * 100 : 0;
                    newData.discountPercent = dp.toFixed(2);
                }

                const activePrice = (newData.discountPercent === "" && newData.discountedPrice === "") || 
                                    (parseFloat(newData.discountPercent) === 0 && parseFloat(newData.discountedPrice) === 0 && name !== "discountedPrice") 
                                    ? price 
                                    : parseFloat(newData.discountedPrice) || price;
                newData.totalAmount = (activePrice * qty).toFixed(2);
            }

            return newData;
        });
    };

    const handleEditItem = (item) => {
        setFormData({
            ...item,
        });
        setEditingItemId(item.id);
        formRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleCancelEdit = () => {
        setEditingItemId(null);
        setFormData((prev) => ({
            ...prev,
            productId: "",
            productName: "",
            productCode: "",
            sellingPrice: "",
            unit: "",
            discountPercent: "0.00",
            discountedPrice: "0.00",
            quantity: "",
            preIssue: "",
            totalAmount: "0.00",
        }));
    };

    const handleAddItem = () => {
        if (!formData.productId || (!formData.sellingPrice && formData.sellingPrice !== 0)) {
            showToast("error", "Please select a product and enter a valid price");
            return;
        }

        const reqQty = parseFloat(formData.quantity) || 0;
        const reqPreIssue = parseFloat(formData.preIssue) || 0;

        if (reqQty <= 0 && reqPreIssue <= 0) {
            showToast("error", "Please enter a valid quantity or Free-issue amount");
            return;
        }

        const stockItem = stockData.find((s) => (s.productId).toString() === formData.productId.toString());
        const requestedTotal = reqQty + reqPreIssue;
        const availableQty = stockItem ? parseFloat(stockItem.quantity) : 0;

        if (requestedTotal > availableQty) {
            showToast("error", `Only ${availableQty} units of "${formData.productName}" are available in stock. You cannot issue ${requestedTotal} units right now.`);
            return;
        }

        const isDuplicate = addedItems.some((item) =>
            item.productId.toString() === formData.productId.toString() &&
            item.id !== editingItemId
        );

        if (isDuplicate) {
            showToast("error", `Product "${formData.productName}" is already added to the order. Please edit the existing entry if you need to change the quantity.`);
            return;
        }

        if (editingItemId) {
            setAddedItems((prev) =>
                prev.map((item) => (item.id === editingItemId ? { ...formData, id: editingItemId } : item))
            );
            setEditingItemId(null);
        } else {
            const newItem = {
                ...formData,
                id: Date.now(),
            };
            setAddedItems((prev) => [...prev, newItem]);
        }

        setFormData((prev) => ({
            ...prev,
            productId: "",
            productName: "",
            productCode: "",
            sellingPrice: "",
            unit: "",
            preIssue: "",
            discountPercent: "0.00",
            discountedPrice: "0.00",
            quantity: "",
            totalAmount: "0.00",
        }));
    };

    const handleRemoveItem = (id) => {
        setAddedItems((prev) => prev.filter((item) => item.id !== id));
    };

    const calculateTotal = () => {
        return addedItems.reduce((acc, item) => acc + parseFloat(item.totalAmount), 0);
    };

    const getAdditionalDiscountValue = () => {
        const total = calculateTotal();
        const value = parseFloat(additionalDiscount.value) || 0;
        if (additionalDiscount.type === DiscountTypeEnum.percentage) {
            return (total * value) / 100;
        }
        return value;
    };

    const calculateGrandTotal = () => {
        const total = calculateTotal();
        const discountAmount = getAdditionalDiscountValue();
        const courier = parseFloat(courierCharges) || 0;
        return (total - discountAmount + courier).toFixed(2);
    };

    const handleUpdateBill = async () => {
        if (!formData.customerId) {
            showToast("error", "Please select a customer before issuing the bill");
            return;
        }

        if (addedItems.length === 0) {
            showToast("error", "Please add at least one item to the order");
            return;
        }

        const mappedItems = [];
        addedItems.forEach(item => {
            const qty = parseFloat(item.quantity) || 0;
            const preIssue = parseFloat(item.preIssue) || 0;

            if (qty > 0) {
                mappedItems.push({
                    productId: item.productId,
                    productName: item.productName,
                    unit: item.unit,
                    packSize: item.packSize,
                    sellingPrice: item.sellingPrice,
                    quantity: qty,
                    discountPercent: item.discountPercent,
                    discountedPrice: item.discountedPrice,
                    totalAmount: calculateGrandTotal()
                });
            }

            if (preIssue > 0) {
                mappedItems.push({
                    productId: item.productId,
                    productName: item.productName,
                    unit: item.unit,
                    sellingPrice: 0,
                    quantity: preIssue,
                    discountPercent: 0,
                    discountedPrice: 0,
                    totalAmount: 0
                });
            }
        });

        const salesOrderData = {
            customerId: formData.customerId,
            userId: currentUserId,
            date: formData.date,
            items: mappedItems,
            additionalDiscountType: additionalDiscount.type,
            additionalDiscountValue: additionalDiscount.value || 0,
            courierCharges: courierCharges || 0,
            grandTotal: calculateTotal()
        };

        try {
            const res = await updateSalesOrder(invoiceId, currentUserId, salesOrderData);
            const generatedInvoiceNumber = res.data?.invoiceNumber || res.data?.data?.invoiceNumber || invoice.invoiceNumber;

            showToast('success', `Sales Order updated successfully! Invoice No: ${generatedInvoiceNumber || ""}`);

            setTimeout(() => {
                navigate("/sales-invoices");
            }, 1000);
            setFormData({
                customerId: "",
                date: new Date().toLocaleDateString('en-CA'),
                creditTerm: "",
                invoiceNumber: null,
                productId: "",
                productName: "",
                productCode: "",
                sellingPrice: "",
                quantity: "",
                preIssue: "",
                unit: "",
                discountPercent: "0.00",
                discountedPrice: "0.00",
                totalAmount: "0.00",
            });
            setSelectedCustomerData(null);
            setAdditionalDiscount({ type: DiscountTypeEnum.cash, value: "" });
            setCourierCharges("");
        } catch (error) {
            console.error("Error creating Sales Order:", error);
            showToast('error', error.response?.data?.message || "Failed to issue bill. Please try again.");
        }
    };

    const grandTotalValue = parseFloat(calculateGrandTotal()) || 0;
    const availableLimit = selectedCustomerData ? ((parseFloat(selectedCustomerData.creditLimit) || 0) - (parseFloat(selectedCustomerData.dueAmount) || 0)) : 0;
    const isOverLimit = selectedCustomerData && selectedCustomerData.creditPeriod !== 'Cash' && (grandTotalValue > availableLimit);

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
                    <div className="sales-order-container">
                        <header className="sales-order-header">
                            <h2>Edit Sales Invoice</h2>
                            <button className="see-invoices-btn" onClick={() => navigate("/sales-invoices")}>
                                <FileText size={18} /> See All Invoices
                            </button>
                        </header>

                        <div className="sales-order-form-section" ref={formRef}>
                            <div className="sales-order-row">
                                <div className="sales-order-field">
                                    <label>Customer</label>
                                    <select
                                        className="sales-order-select"
                                        value={formData.customerId}
                                        onChange={handleCustomerChange}
                                    >
                                        <option value="">Select customer</option>
                                        {customers.map((c) => (
                                            <option key={c.id || c._id} value={c.id || c._id}>
                                                {c.name}
                                            </option>
                                        ))}
                                    </select>
                                    <button className="add-customer-btn" onClick={() => setIsAddCustomerModalOpen(true)}>
                                        <PlusCircle size={14} /> Add New Customer
                                    </button>
                                </div>
                                <div className="sales-order-field">
                                    <label>Customer credit term</label>
                                    <input
                                        type="text"
                                        className="sales-order-input"
                                        value={formData.creditTerm ? `${formData.creditTerm} days` : "Not Specified"}
                                        readOnly
                                    />
                                </div>
                                <div className="sales-order-field">
                                    <label>Date</label>
                                    <div className="date-input-wrapper">
                                        <input
                                            type="date"
                                            className="sales-order-input"
                                            value={formData.date}
                                            disabled
                                        />
                                    </div>
                                </div>
                                <div className="sales-order-field">
                                    <label>Invoice Number</label>
                                    <input
                                        type="text"
                                        className="sales-order-input"
                                        value={formData.invoiceNumber || "Auto Generated"}
                                        disabled
                                    />
                                </div>

                            </div>

                            <div className="sales-order-row">
                                <div className="sales-order-field">
                                    <label>Product</label>
                                    <select
                                        className="sales-order-select"
                                        value={formData.productId}
                                        onChange={handleProductChange}
                                    >
                                        <option value="">Select product</option>
                                        {products.map((p) => (
                                            <option key={p.id || p._id} value={p.id || p._id}>
                                                {p.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="sales-order-field">
                                    <label>Product Id</label>
                                    <input
                                        type="text"
                                        className="sales-order-input"
                                        value={formData.productCode}
                                        placeholder="ID"
                                        readOnly
                                    />
                                </div>
                                <div className="sales-order-field">
                                    <label>Unit</label>
                                    <input
                                        type="text"
                                        name="unit"
                                        className="sales-order-input"
                                        placeholder="unit"
                                        value={formData.unit}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="sales-order-field">
                                    <label>Selling Price</label>
                                    <input
                                        type="number"
                                        name="sellingPrice"
                                        className="sales-order-input"
                                        placeholder="Price"
                                        value={formData.sellingPrice}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="sales-order-field">
                                    <label>Quantity</label>
                                    <input
                                        type="number"
                                        name="quantity"
                                        className={`sales-order-input ${parseFloat(formData.quantity) > formData.availableQuantity ? "input-error" : ""}`}
                                        placeholder="Quantity"
                                        value={formData.quantity}
                                        onChange={handleInputChange}
                                    />
                                    {parseFloat(formData.quantity) > formData.availableQuantity && (
                                        <span style={{ color: "red", fontSize: "12px", marginTop: "4px", display: "block" }}>
                                            Only {formData.availableQuantity} {formData.unit} are available
                                        </span>
                                    )}
                                </div>
                                <div className="sales-order-field">
                                    <label>Free Issue</label>
                                    <input
                                        type="number"
                                        name="preIssue"
                                        className="sales-order-input"
                                        placeholder="Free Issue"
                                        value={formData.preIssue}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="sales-order-field">
                                    <label>Total Amount</label>
                                    <input
                                        type="text"
                                        className="sales-order-input"
                                        value={formData.totalAmount}
                                        readOnly
                                    />
                                </div>
                                <div className="sales-order-field">
                                    <label>Discount %</label>
                                    <input
                                        type="number"
                                        name="discountPercent"
                                        className="sales-order-input"
                                        placeholder="Discount %"
                                        value={formData.discountPercent}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="sales-order-field">
                                    <label>Discounted Price</label>
                                    <input
                                        type="number"
                                        name="discountedPrice"
                                        className="sales-order-input"
                                        placeholder="Discounted Price"
                                        value={formData.discountedPrice}
                                        onChange={handleInputChange}
                                    />
                                </div>

                                <div className="add-btn-wrapper">
                                    <button 
                                        className="sales-order-add-btn" 
                                        onClick={handleAddItem}
                                        disabled={parseFloat(formData.quantity) > formData.availableQuantity}
                                        style={parseFloat(formData.quantity) > formData.availableQuantity ? { cursor: 'not-allowed', opacity: 0.6 } : {}}
                                    >
                                        {editingItemId ? "Update" : "Add"}
                                    </button>
                                    {editingItemId && (
                                        <button className="sales-order-cancel-btn" onClick={handleCancelEdit}>
                                            Cancel
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="sales-order-summary-section">
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
                                    <h1>Edit Sales Invoice</h1>
                                </div>
                            </div>

                            <div className="invoice-info-bar">
                                <div className="info-col">
                                    <span className="info-label">Invoice No. : </span>
                                    <span className="info-value">
                                        {formData.invoiceNumber || "Auto Generated"}
                                    </span>
                                </div>
                                <div className="info-col">
                                    <span className="info-label">Invoice Date : </span>
                                    <span className="info-value">{formData.date}</span>
                                </div>
                                <div className="info-col">
                                    <span className="info-label">Credit Terms : </span>
                                    <span className="info-value">{formData.creditTerm ? `${formData.creditTerm} Days` : "COD"}</span>
                                </div>
                                <div className="info-col">
                                    <span className="info-label">Sales Rep : </span>
                                    <span className="info-value">{currentUserName || "Not Assigned"}</span>
                                </div>
                            </div>

                            <div className="customer-details-grid">
                                <div className="details-box">
                                    <h4 className="box-title">Customer Details</h4>
                                    <div className="box-content">
                                        {selectedCustomerData ? (
                                            <>
                                                <p className="customer-name">{selectedCustomerData.name}</p>
                                                <p>{selectedCustomerData.address}</p>
                                                <p>{selectedCustomerData.contact_No}</p>
                                            </>
                                        ) : (
                                            <>
                                                <p className="placeholder-text">Select a customer to view details</p>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="details-box">
                                    <h4 className="box-title">Customer Credit Details</h4>
                                    <div className="box-content">
                                        {selectedCustomerData ? (
                                            <>
                                                <p><b>Credit Period : </b>{selectedCustomerData.creditPeriod} days</p>
                                                <p><b>Credit Limit : </b>Rs.{selectedCustomerData.creditLimit}</p>
                                                <p><b>Due Amount : </b>Rs.{selectedCustomerData.dueAmount}</p>
                                                <p><b>Available Limit : </b>Rs.{selectedCustomerData.creditLimit - selectedCustomerData.dueAmount}</p>
                                            </>
                                        ) : (
                                            <>
                                                <p className="placeholder-text">Customer Credit Details will appear here</p>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="sales-order-table-container">
                                <table className="sales-order-table invoice-table">
                                    <thead>
                                        <tr>
                                            <th>Item code</th>
                                            <th>Product Description</th>
                                            <th>Pack Size</th>
                                            <th>Qty</th>
                                            <th>Whole Sale Price</th>
                                            <th>Discount %</th>
                                            <th>Discounted Price</th>
                                            <th>Amount (LKR)</th>
                                            <th className="action-col">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {addedItems.map((item, index) => (
                                            <React.Fragment key={item.id}>
                                                <tr>
                                                    <td>{index + 1}</td>
                                                    <td>
                                                        <div className="product-desc-cell">
                                                            <span className="main-desc">{item.productName}</span>
                                                            <span className="sub-desc">{item.productCode}</span>
                                                        </div>
                                                    </td>
                                                    <td>{item.packSize} {item.unit}</td>
                                                    <td>{item.quantity}</td>
                                                    <td>{parseFloat(item.sellingPrice).toFixed(2)}</td>
                                                    <td>{parseFloat(item.discountPercent).toFixed(2)}%</td>
                                                    <td>{parseFloat(item.discountedPrice).toFixed(2)}</td>
                                                    <td>{parseFloat(item.totalAmount).toFixed(2)}</td>
                                                    <td className="action-col">
                                                        <div className="action-btns">
                                                            <Edit3
                                                                size={16}
                                                                className="edit-icon"
                                                                onClick={() => handleEditItem(item)}
                                                            />
                                                            <Trash2
                                                                size={16}
                                                                className="delete-icon"
                                                                onClick={() => handleRemoveItem(item.id)}
                                                            />
                                                        </div>
                                                    </td>
                                                </tr>
                                                {parseFloat(item.preIssue || 0) > 0 && (
                                                    <tr className="bonus-row" style={{ backgroundColor: "#f9f9f9", fontStyle: "italic", opacity: 0.9 }}>
                                                        <td></td>
                                                        <td>
                                                            <div className="product-desc-cell">
                                                                <span className="main-desc" style={{ color: "#666" }}>{item.productName} (Free-Issue)</span>
                                                                <span className="sub-desc">{item.itemCode}</span>
                                                            </div>
                                                        </td>
                                                        <td>{item.packSize} {item.unit}</td>
                                                        <td>{item.preIssue}</td>
                                                        <td>0.00</td>
                                                        <td>0.00%</td>
                                                        <td>0.00</td>
                                                        <td>0.00</td>
                                                        <td className="action-col"></td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
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
                                            <span className="line-value">{calculateTotal().toFixed(2)}</span>
                                        </div>
                                        <div className="totals-line" style={{ position: 'relative' }}>
                                            <span 
                                                className="line-label" 
                                                style={{ cursor: 'pointer', color: '#007bff'}}
                                                onClick={() => { setShowDiscountPopup(!showDiscountPopup); setShowCourierPopup(false); }}
                                            >
                                                Additional Discount (LKR)
                                            </span>
                                            <span className="line-value">
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
                                        <div className="totals-line" style={{ position: 'relative' }}>
                                            <span 
                                                className="line-label" 
                                                style={{ cursor: 'pointer', color: '#007bff' }}
                                                onClick={() => { setShowCourierPopup(!showCourierPopup); setShowDiscountPopup(false); }}
                                            >
                                                Courier Charges (LKR)
                                            </span>
                                            <span className="line-value">
                                                {courierCharges ? `Rs. ${parseFloat(courierCharges).toFixed(2)}` : "0.00"}
                                            </span>
                                            {showCourierPopup && (
                                                <CourierChargesPopup 
                                                    initialCharge={courierCharges}
                                                    onSave={(data) => { setCourierCharges(data); setShowCourierPopup(false); }}
                                                    onClose={() => setShowCourierPopup(false)}
                                                />
                                            )}
                                        </div>
                                        <div className="totals-line grand-due">
                                            <span className="line-label" style={isOverLimit ? { color: "red" } : {}}>Grand Total (LKR)</span>
                                            <span className="line-value" style={isOverLimit ? { color: "red", fontWeight: "bold" } : {}}>{calculateGrandTotal()}</span>
                                        </div>
                                        {isOverLimit && (
                                            <div className="totals-line" style={{ color: "red", fontSize: "0.80rem", marginTop: "10px", justifyContent: "flex-end", textAlign: "right" }}>
                                                ⚠️ Warning: Total exceeds available credit limit of Rs. {availableLimit.toFixed(2)}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="invoice-footer-actions">
                                    <button className="issue-bill-btn" onClick={handleUpdateBill} disabled={isOverLimit}>Update Bill</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <AddCustomerModal
                        isOpen={isAddCustomerModalOpen}
                        onClose={() => setIsAddCustomerModalOpen(false)}
                        onCustomerAdded={() => {
                            fetchCustomers();
                            setIsAddCustomerModalOpen(false);
                        }}
                    />
                </div>
            </div>
        </Layout>
    );
};

export default EditSalesOrder;
