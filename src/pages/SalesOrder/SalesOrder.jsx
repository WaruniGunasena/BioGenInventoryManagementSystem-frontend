import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import Layout from "../../components/Layout";
import { getAllCustomers } from "../../api/customerService";
import { getAllProducts } from "../../api/productService";
import { createSalesOrder } from "../../api/salesOrderService";
import { useToast } from "../../context/ToastContext";
import AddCustomerModal from "../../components/Customers/AddCustomerModal";
import {
    PlusCircle,
    Trash2,
    Edit3,
    FileText
} from "lucide-react";
import { getAllStock } from "../../api/stockService";
import { getUserId, getUserName } from "../../components/common/Utils/userUtils/userUtils";
import "./SalesOrder.css";

const SalesOrder = () => {
    const navigate = useNavigate();
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
        quantity: "",
        unit: "",
        discountPercent: "0.00",
        discountedPrice: "0.00",
        totalAmount: "0.00",
    });

    const [selectedCustomerData, setSelectedCustomerData] = useState(null);
    const [addedItems, setAddedItems] = useState([]);
    const [editingItemId, setEditingItemId] = useState(null);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [currentUserName, setCurrentUserName] = useState("");

    useEffect(() => {
        fetchCustomers();
        fetchProducts();
        fetchUserId();
    }, []);

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
            const quantity = parseFloat(prev.quantity) || 0;

            return {
                ...prev,
                productId: id,
                productName: product ? product.name : "",
                productCode: product ? (product.id || product._id) : "",
                sellingPrice: sellingPrice,
                unit: product ? product.unit || "" : "",
                discountPercent: "0.00",
                discountedPrice: "0.00",
                totalAmount: (sellingPrice * quantity).toFixed(2),
            };
        });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => {
            const newData = { ...prev, [name]: value };

            if (name === "sellingPrice" || name === "quantity") {
                const price = parseFloat(newData.sellingPrice) || 0;
                const qty = parseFloat(newData.quantity) || 0;

                newData.totalAmount = (price * qty).toFixed(2);
            }
            newData.discountPercent = "0.00";
            newData.discountedPrice = "0.00";

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
            totalAmount: "0.00",
        }));
    };

    const handleAddItem = () => {
        if (!formData.productId || !formData.sellingPrice || !formData.quantity) {
            showToast("error", "Please select a product and enter price/quantity");
            return;
        }

        const stockItem = stockData.find((s) => (s.productId).toString() === formData.productId.toString());
        const requestedQty = parseFloat(formData.quantity);
        const availableQty = stockItem ? parseFloat(stockItem.quantity) : 0;

        if (requestedQty > availableQty) {
            showToast("error", `Only ${availableQty} units of "${formData.productName}" are available in stock. You cannot issue ${requestedQty} units right now.`);
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
            discountPercent: "0.00",
            discountedPrice: "0.00",
            quantity: "",
            totalAmount: "0.00",
        }));
    };

    const handleRemoveItem = (id) => {
        setAddedItems((prev) => prev.filter((item) => item.id !== id));
    };

    const calculateGrandTotal = () => {
        return addedItems.reduce((acc, item) => acc + parseFloat(item.totalAmount), 0).toFixed(2);
    };

    const handleIssueBill = async () => {
        if (addedItems.length === 0) {
            showToast("error", "Please add at least one item to the order");
            return;
        }

        const salesOrderData = {
            customerId: formData.customerId,
            userId: currentUserId,
            date: formData.date,
            items: addedItems.map(item => ({
                productId: item.productId,
                productName: item.productName,
                unit: item.unit,
                sellingPrice: item.sellingPrice,
                quantity: item.quantity,
                discountPercent: item.discountPercent,
                discountedPrice: item.discountedPrice,
                totalAmount: item.totalAmount
            })),
            grandTotal: calculateGrandTotal()
        };

        try {
            const res = await createSalesOrder(salesOrderData);
            const generatedInvoiceNumber = res.data?.invoiceNumber || res.data?.data?.invoiceNumber;

            showToast('success', `Sales Order issued successfully! Invoice No: ${generatedInvoiceNumber || ""}`);

            setAddedItems([]);
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
                unit: "",
                discountPercent: "0.00",
                discountedPrice: "0.00",
                totalAmount: "0.00",
            });
            setSelectedCustomerData(null);
        } catch (error) {
            console.error("Error creating Sales Order:", error);
            showToast('error', error.response?.data?.message || "Failed to issue bill. Please try again.");
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
                    <div className="sales-order-container">
                        <header className="sales-order-header">
                            <h2>Sales Invoice</h2>
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
                                        className="sales-order-input"
                                        placeholder="Quantity"
                                        value={formData.quantity}
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
                                        readOnly
                                    />
                                </div>
                                <div className="sales-order-field">
                                    <label>Discounted Price</label>
                                    <input
                                        type="text"
                                        className="sales-order-input"
                                        value={formData.discountedPrice}
                                        readOnly
                                    />
                                </div>

                                <div className="add-btn-wrapper">
                                    <button className="sales-order-add-btn" onClick={handleAddItem}>
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
                                    <h1>Sales Invoice</h1>
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
                                    <h4 className="box-title">Delivery Address</h4>
                                    <div className="box-content">
                                        {selectedCustomerData ? (
                                            <>
                                                <p>{selectedCustomerData.address}</p>
                                            </>
                                        ) : (
                                            <>
                                                <p className="placeholder-text">Delivery address will appear here</p>
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
                                            <th>Unit</th>
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
                                            <tr key={item.id}>
                                                <td>{index + 1}</td>
                                                <td>
                                                    <div className="product-desc-cell">
                                                        <span className="main-desc">{item.productName}</span>
                                                        <span className="sub-desc">* B/N & (Exp Date): Default (30/11/2027)</span>
                                                    </div>
                                                </td>
                                                <td>{item.unit || "-"}</td>
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
                                            <span className="line-value">{calculateGrandTotal()}</span>
                                        </div>
                                        <div className="totals-line">
                                            <span className="line-label">Additional Discount (LKR)</span>
                                            <span className="line-value">0.00</span>
                                        </div>
                                        <div className="totals-line">
                                            <span className="line-label">Payment Total (LKR)</span>
                                            <span className="line-value">0.00</span>
                                        </div>
                                        <div className="totals-line grand-due">
                                            <span className="line-label">Due (LKR)</span>
                                            <span className="line-value">{calculateGrandTotal()}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="invoice-footer-actions">
                                    <button className="issue-bill-btn" onClick={handleIssueBill}>Issue Bill</button>
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

export default SalesOrder;
