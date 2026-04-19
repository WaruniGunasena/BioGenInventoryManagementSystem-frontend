import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "../../context/ToastContext";
import Sidebar from "../../components/Sidebar";
import Layout from "../../components/Layout";
import { getAllSuppliers } from "../../api/supplierService";
import { getAllProducts } from "../../api/productService";
import { createGRN, updateGRN } from "../../api/grnService";
import AddProductModal from "../../components/Products/AddProductModal";
import { Trash2, Edit3, FileText, Plus } from "lucide-react";
import { getUserId } from "../../components/common/Utils/userUtils/userUtils";
import "./GRN.css";

const GRN = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { showToast } = useToast();
    const formRef = useRef(null);
    const today = new Date().toLocaleDateString('en-CA');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    const [suppliers, setSuppliers] = useState([]);
    const [products, setProducts] = useState([]);
    const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);

    const [formData, setFormData] = useState({
        supplierId: "",
        date: new Date().toLocaleDateString('en-CA'),
        creditPeriod: "",
        productId: "",
        productName: "",
        productCode: "",
        batchNumber: "",
        mfgDate: "",
        expDate: "",
        purchasePrice: "",
        quantity: "",
        totalAmount: "0.00",
        invoiceNumber: "",
        invoiceId: "",
        sellingPricePercentage: "",
        sellingPrice: "",
        mrpValue: "",
        bonus: "",
        packSize: "",
        discountPercentage: "",
        discountedPrice: "",
    });

    const [selectedSupplierData, setSelectedSupplierData] = useState(null);
    const [addedItems, setAddedItems] = useState([]);
    const [editingItemId, setEditingItemId] = useState(null);
    const [currentUserId, setCurrentUserId] = useState(null);
    const hasPopulatedRef = useRef(false);

    useEffect(() => {
        fetchSuppliers();
        fetchProducts();
        fetchUserId();
    }, []);

    useEffect(() => {

        if (location.state?.editInvoice && !hasPopulatedRef.current && suppliers.length > 0 && products.length > 0) {
            const invoice = location.state.editInvoice;
            setFormData((prev) => ({
                ...prev,
                supplierId: invoice.supplierId || invoice.supplier?.id || invoice.supplier?._id || "",
                date: invoice.date || invoice.grnDate || new Date().toLocaleDateString('en-CA'),
                invoiceNumber: invoice.invoiceNumber || invoice.grnNumber || "",
                creditPeriod: invoice.creditPeriod || invoice.supplier?.creditPeriod || "",
                invoiceId: invoice.id || invoice._id,
            }));

            const mappedItems = (invoice.items || []).map((item, index) => ({
                id: Date.now() + index,
                originalId: item.id || item._id,
                productId: item.productId || item.product?.id || item.product?._id,
                productName: item.productName || item.product?.name || "N/A",
                productCode: item.productCode || item.product?.productID || "N/A",
                batchNumber: item.batchNumber || "",
                mfgDate: item.mfgDate || "",
                expDate: item.expDate || "",
                purchasePrice: item.purchasePrice || 0,
                quantity: item.quantity || 0,
                bonus: item.bonus || 0,
                discountPercentage: item.discountPercentage || 0,
                discountedPrice: item.discountValue || item.discountedPrice || item.purchasePrice,
                totalAmount: item.totalAmount || 0,
                sellingPricePercentage: item.sellingPricePercentage || 0,
                sellingPrice: (parseFloat(item.purchasePrice || 0) + (parseFloat(item.purchasePrice || 0) * parseFloat(item.sellingPricePercentage || 0) / 100)).toFixed(2),
                mrpValue: item.mrpValue || item.mrp || "",
                packSize: item.packSize || "",
            }));
            setAddedItems(mappedItems);

            if (invoice.supplier) {
                setSelectedSupplierData(invoice.supplier);
            }
            hasPopulatedRef.current = true;
        }
    }, [location.state, suppliers, products]);

    const fetchUserId = async () => {
        try {
            const id = await getUserId();
            setCurrentUserId(id);
        } catch (error) {
            console.error("Error fetching user ID:", error);
        }
    };

    const fetchSuppliers = async () => {
        try {
            const res = await getAllSuppliers();
            let data = [];
            if (res.data && Array.isArray(res.data)) data = res.data;
            else if (res.data && res.data.suppliers && Array.isArray(res.data.suppliers)) data = res.data.suppliers;
            setSuppliers(data);
        } catch (error) {
            console.error("Error fetching suppliers:", error);
        }
    };

    const fetchProducts = async () => {
        try {
            const res = await getAllProducts();
            let data = [];
            if (res.data && Array.isArray(res.data)) data = res.data;
            else if (res.data && res.data.products && Array.isArray(res.data.products)) data = res.data.products;
            setProducts(data);
        } catch (error) {
            console.error("Error fetching products:", error);
        }
    };

    const handleSupplierChange = (e) => {
        const id = e.target.value;
        const supplier = suppliers.find((s) => (s.id || s._id).toString() === id.toString());
        setSelectedSupplierData(supplier);
        setFormData((prev) => ({
            ...prev,
            supplierId: id,
            creditPeriod: supplier ? supplier.creditPeriod || "" : "",
        }));
    };

    const handleProductChange = (e) => {
        const id = e.target.value;
        const product = products.find((p) => (p.id || p._id).toString() === id.toString());
        setFormData((prev) => ({
            ...prev,
            productId: id,
            productName: product ? product.name : "",
            productCode: product ? (product.productID || product.id || product._id) : "",
            packSize: product ? product.packSize : "",
        }));
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => {
            const newData = { ...prev, [name]: value };
            if (["purchasePrice", "quantity", "discountPercentage"].includes(name)) {
                const price = parseFloat(newData.purchasePrice) || 0;
                const qty = parseFloat(newData.quantity) || 0;
                const discountPct = parseFloat(newData.discountPercentage) || 0;

                const dPrice = price - (price * discountPct / 100);
                newData.discountedPrice = dPrice.toFixed(2);
                newData.totalAmount = (dPrice * qty).toFixed(2);
            }
            if (name === "purchasePrice" || name === "sellingPricePercentage") {
                const price = parseFloat(newData.purchasePrice);
                const percentage = parseFloat(newData.sellingPricePercentage);

                if (!isNaN(price) && !isNaN(percentage)) {
                    newData.sellingPrice = (price + (price * percentage / 100)).toFixed(2);
                } else if (!isNaN(price) && newData.sellingPricePercentage === "") {
                    newData.sellingPrice = "";
                }
            }
            if (name === "sellingPrice") {
                const sp = parseFloat(newData.sellingPrice);
                const price = parseFloat(newData.purchasePrice);

                if (!isNaN(sp) && !isNaN(price) && price !== 0) {
                    newData.sellingPricePercentage = (((sp / price) - 1) * 100).toFixed(2);
                } else if (newData.sellingPrice === "") {
                    newData.sellingPricePercentage = "";
                }
            }
            return newData;
        });
    };

    const handleEditItem = (item) => {
        const pPrice = parseFloat(item.purchasePrice) || 0;
        const sPercentage = parseFloat(item.sellingPricePercentage) || 0;
        const calculatedSellingPrice = (pPrice + (pPrice * sPercentage / 100)).toFixed(2);

        setFormData((prev) => ({
            ...prev,
            ...item,
            sellingPrice: calculatedSellingPrice
        }));
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
            batchNumber: "",
            mfgDate: "",
            expDate: "",
            purchasePrice: "",
            quantity: "",
            totalAmount: "0.00",
            sellingPricePercentage: "",
            sellingPrice: "",
            mrpValue: "",
            bonus: "",
            packSize: "",
            discountPercentage: "",
            discountedPrice: "",
        }));
    };

    const handleAddItem = () => {
        if (!formData.supplierId) {
            showToast('error', "Please select a supplier first");
            return;
        }

        if (!formData.invoiceNumber) {
            showToast('error', "Please enter an invoice number first");
            return;
        }

        if (!formData.date) {
            showToast('error', "Please select a date first");
            return;
        }

        if (!formData.productId) {
            showToast('error', "Please select a product");
            return;
        }

        if (!formData.expDate) {
            showToast('error', "Please enter expiry date");
            return;
        }

        if (!formData.purchasePrice) {
            showToast('error', "Please enter purchase price");
            return;
        }

        if (!formData.quantity) {
            showToast('error', "Please enter quantity");
            return;
        }

        if (!formData.sellingPricePercentage) {
            showToast('error', "Please enter selling price percentage");
            return;
        }

        if (!formData.mrpValue) {
            showToast('error', "Please enter MRP value");
            return;
        }

        const percentage = parseFloat(formData.sellingPricePercentage);
        if (isNaN(percentage) || percentage < 0 || percentage > 100) {
            showToast('error', "Selling price percentage must be between 0 and 100");
            return;
        }

        const isDuplicate = addedItems.some((item) =>
            (item.productId || item._id)?.toString() === (formData.productId || formData._id)?.toString() &&
            item.id !== editingItemId
        );

        if (isDuplicate) {
            showToast('error', `Product "${formData.productName}" is already added. Please update the existing record.`);
            return;
        }
        if (editingItemId) {
            setAddedItems((prev) =>
                prev.map((item) => (item.id === editingItemId ? { ...formData, id: editingItemId } : item))
            );
            setEditingItemId(null);
        } else {
            setAddedItems((prev) => [...prev, { ...formData, id: Date.now() }]);
        }
        setFormData((prev) => ({
            ...prev,
            productId: "",
            productName: "",
            productCode: "",
            batchNumber: "",
            mfgDate: "",
            expDate: "",
            purchasePrice: "",
            quantity: "",
            totalAmount: "0.00",
            sellingPricePercentage: "",
            sellingPrice: "",
            mrpValue: "",
            bonus: "",
            packSize: "",
            discountPercentage: "",
            discountedPrice: "",
        }));
    };

    const handleRemoveItem = (id) => {
        setAddedItems((prev) => prev.filter((item) => item.id !== id));
    };

    const calculateGrandTotal = () => {
        return addedItems.reduce((acc, item) => acc + parseFloat(item.totalAmount), 0).toFixed(2);
    };

    const handleAddStock = async () => {
        if (!formData.supplierId) {
            showToast('error', "Please select a supplier");
            return;
        }

        if (addedItems.length === 0) {
            showToast('error', "Please add at least one item");
            return;
        }
        const grnData = {
            supplierId: formData.supplierId,
            userId: currentUserId,
            date: formData.date,
            invoiceNumber: formData.invoiceNumber,
            paymentStatus: 'unpaid',
            items: addedItems.map((item) => ({
                id: item.originalId,
                productId: item.productId,
                batchNumber: item.batchNumber,
                mfgDate: item.mfgDate,
                expDate: item.expDate,
                purchasePrice: item.purchasePrice,
                packSize: item.packSize,
                quantity: item.quantity,
                bonus: parseFloat(item.bonus || 0),
                totalAmount: item.totalAmount,
                mrpValue: item.mrpValue,
                sellingPricePercentage: item.sellingPricePercentage,
                discountPercentage: parseFloat(item.discountPercentage || 0),
                discountValue: parseFloat(item.discountedPrice || item.purchasePrice),
            })),
            grandTotal: calculateGrandTotal(),
        };

        try {
            if (formData.invoiceId) {
                await updateGRN(formData.invoiceId, grnData);
                showToast('success', "Stock updated successfully!");
            } else {
                await createGRN(grnData);
                showToast('success', "Stock added successfully!");
            }
            setAddedItems([]);
            setFormData({
                supplierId: "",
                date: new Date().toLocaleDateString('en-CA'),
                creditPeriod: "",
                productId: "",
                productName: "",
                productCode: "",
                batchNumber: "",
                mfgDate: "",
                expDate: "",
                purchasePrice: "",
                quantity: "",
                totalAmount: "0.00",
                invoiceNumber: "",
                invoiceId: "",
                sellingPricePercentage: "",
                sellingPrice: "",
                bonus: "",
                packSize: "",
                discountPercentage: "",
                discountedPrice: "",
            });
            setSelectedSupplierData(null);
        } catch (error) {
            console.error("Error adding GRN:", error);
            showToast('error', error.response?.data?.message || "Failed to add stock. Please try again.");
        }
    };

    const inputStyle = {
        width: "100%",
        padding: "8px 12px",
        border: "1px solid #cbd5e1",
        borderRadius: "8px",
        fontSize: "14px",
        backgroundColor: "#f8fafc",
        outline: "none",
        transition: "border-color 0.2s, box-shadow 0.2s",
        boxSizing: "border-box",
    };

    const selectStyle = {
        ...inputStyle,
        appearance: "none",
        WebkitAppearance: "none",
        MozAppearance: "none",
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 10px center",
        paddingRight: "36px",
    };
    const labelStyle = {
        display: "block",
        fontSize: "14px",
        fontWeight: "500",
        color: "#475569",
        marginBottom: "4px",
    };
    const fieldStyle = { display: "flex", flexDirection: "column", flex: 1, minWidth: "180px" };

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
                    <div style={{ minHeight: "100vh", background: "#f8f9fa" }}>

                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                            <h1 style={{ fontSize: "24px", fontWeight: "700", color: "#1e293b", margin: 0 }}>Good Receive Note</h1>
                            <button className="see-invoices-btn" onClick={() => navigate("/invoices")}>
                                <FileText size={18} /> See All Invoices
                            </button>
                        </div>

                        <div ref={formRef} style={{ background: "white", borderRadius: "16px", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", border: "1px solid #e2e8f0", padding: "20px" }}>

                            <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", marginBottom: "14px", paddingBottom: "14px", borderBottom: "1px solid #f1f5f9" }}>
                                <div style={fieldStyle}>
                                    <label style={labelStyle}>Supplier <span style={{ color: "red" }}>*</span></label>
                                    <select style={selectStyle} value={formData.supplierId} onChange={handleSupplierChange}>
                                        <option value="">Select Supplier</option>
                                        {suppliers.map((s) => (
                                            <option key={s.id || s._id} value={s.id || s._id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div style={fieldStyle}>
                                    <label style={labelStyle}>Date <span style={{ color: "red" }}>*</span></label>
                                    <input type="date" name="date" style={inputStyle} value={formData.date} onChange={handleInputChange} />
                                </div>
                                <div style={fieldStyle}>
                                    <label style={labelStyle}>Invoice Number <span style={{ color: "red" }}>*</span></label>
                                    <input type="text" name="invoiceNumber" style={inputStyle} placeholder="INV-00000" value={formData.invoiceNumber} onChange={handleInputChange} />
                                </div>
                            </div>

                            <div style={{ display: "flex", alignItems: "flex-end", gap: "14px", flexWrap: "wrap", marginBottom: "14px", paddingBottom: "14px", borderBottom: "1px solid #f1f5f9" }}>
                                <div style={{ ...fieldStyle, flex: 2 }}>
                                    <label style={labelStyle}>Product <span style={{ color: "red" }}>*</span></label>
                                    <select style={selectStyle} value={formData.productId} onChange={handleProductChange}>
                                        <option value="">Select Product</option>
                                        {products.map((p) => (
                                            <option key={p.id || p._id} value={p.id || p._id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div style={{ ...fieldStyle, flex: 1 }}>
                                    <label style={labelStyle}>Product ID<span style={{ color: "red" }}>*</span></label>
                                    <input
                                        type="text"
                                        style={{ ...inputStyle, backgroundColor: "#f1f5f9", cursor: "not-allowed" }}
                                        value={formData.productCode}
                                        placeholder="Not Selected"
                                        readOnly
                                    />
                                </div>
                                <button
                                    onClick={() => setIsAddProductModalOpen(true)}
                                    style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", background: "#6366f1", color: "white", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: "500", cursor: "pointer", whiteSpace: "nowrap", boxShadow: "0 2px 8px rgba(99,102,241,0.3)", transition: "all 0.2s", flexShrink: 0 }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = "#4f46e5"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(99,102,241,0.4)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = "#6366f1"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(99,102,241,0.3)"; e.currentTarget.style.transform = "translateY(0)"; }}
                                >
                                    <Plus size={16} /> Add New Product
                                </button>
                                <div style={fieldStyle}>
                                    <label style={labelStyle}>Batch Number</label>
                                    <input type="text" name="batchNumber" style={inputStyle} placeholder="Enter Batch Number" value={formData.batchNumber} onChange={handleInputChange} />
                                </div>
                                <div style={fieldStyle}>
                                    <label style={labelStyle}>Manufacture Date</label>
                                    <input type="date" name="mfgDate" style={inputStyle} value={formData.mfgDate} max={today} onChange={handleInputChange} />
                                </div>
                                <div style={fieldStyle}>
                                    <label style={labelStyle}>Expiry Date <span style={{ color: "red" }}>*</span></label>
                                    <input type="date" name="expDate" style={inputStyle} value={formData.expDate} min={today} onChange={handleInputChange} />
                                </div>
                            </div>

                            <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", marginBottom: "14px", paddingBottom: "14px", borderBottom: "1px solid #f1f5f9" }}>
                                <div style={fieldStyle}>
                                    <label style={labelStyle}>Purchase Price <span style={{ color: "red" }}>*</span></label>
                                    <input type="number" name="purchasePrice" style={inputStyle} placeholder="0.00" value={formData.purchasePrice ?? ""} onChange={handleInputChange} />
                                </div>
                                <div style={fieldStyle}>
                                    <label style={labelStyle}>Quantity <span style={{ color: "red" }}>*</span></label>
                                    <input type="number" name="quantity" style={inputStyle} placeholder="0" value={formData.quantity ?? ""} onChange={handleInputChange} />
                                </div>
                                <div style={fieldStyle}>
                                    <label style={labelStyle}>Selling Price % <span style={{ color: "red" }}>*</span></label>
                                    <input
                                        type="number"
                                        name="sellingPricePercentage"
                                        style={inputStyle}
                                        placeholder="0"
                                        min="0"
                                        max="100"
                                        value={formData.sellingPricePercentage ?? ""}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div style={fieldStyle}>
                                    <label style={labelStyle}>Selling Price <span style={{ color: "red" }}>*</span></label>
                                    <input
                                        type="number"
                                        name="sellingPrice"
                                        style={inputStyle}
                                        value={formData.sellingPrice ?? ""}
                                        placeholder="0.00"
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div style={fieldStyle}>
                                    <label style={labelStyle}>MRP Value <span style={{ color: "red" }}>*</span></label>
                                    <input
                                        type="number"
                                        name="mrpValue"
                                        style={inputStyle}
                                        placeholder="0.00"
                                        value={formData.mrpValue ?? ""}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                            </div>
                            <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", marginBottom: "14px" }}>
                                <div style={fieldStyle}>
                                    <label style={labelStyle}>Bonus</label>
                                    <input type="text" name="bonus" style={inputStyle} placeholder="Enter Bonus" value={formData.bonus} onChange={handleInputChange} />
                                </div>
                                <div style={fieldStyle}>
                                    <label style={labelStyle}>Discount %</label>
                                    <input type="number" name="discountPercentage" style={inputStyle} placeholder="0" min="0" max="100" value={formData.discountPercentage ?? ""} onChange={handleInputChange} />
                                </div>
                                <div style={fieldStyle}>
                                    <label style={labelStyle}>Discounted Price</label>
                                    <input type="text" style={{ ...inputStyle, backgroundColor: "#f1f5f9", cursor: "not-allowed" }} value={formData.discountedPrice ?? ""} placeholder="Calculated" readOnly />
                                </div>
                                <div style={fieldStyle}>
                                    <label style={labelStyle}>Total Amount</label>
                                    <input
                                        type="text"
                                        style={{ ...inputStyle, backgroundColor: "#eef2ff", borderColor: "#c7d2fe", color: "#252429ff", fontWeight: "600", cursor: "not-allowed" }}
                                        value={formData.totalAmount ?? ""}
                                        readOnly
                                    />
                                </div>
                                <div style={fieldStyle}>
                                    <label style={labelStyle}>Credit Period <span style={{ color: "red" }}>*</span></label>
                                    <input
                                        type="text"
                                        style={{ ...inputStyle, backgroundColor: "#f1f5f9", cursor: "not-allowed" }}
                                        value={formData.creditPeriod ? `${formData.creditPeriod}` : ""}
                                        placeholder="Not Selected"
                                        readOnly
                                    />
                                </div>
                            </div>
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", paddingTop: "14px", borderTop: "1px solid #f1f5f9" }}>
                                {editingItemId && (
                                    <button
                                        onClick={handleCancelEdit}
                                        style={{ padding: "10px 28px", border: "1px solid #cbd5e1", borderRadius: "8px", background: "white", color: "#64748b", fontSize: "14px", fontWeight: "500", cursor: "pointer", transition: "all 0.2s" }}
                                        onMouseEnter={(e) => { e.currentTarget.style.background = "#f8fafc"; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.background = "white"; }}
                                    >
                                        Cancel
                                    </button>
                                )}
                                <button
                                    onClick={handleAddItem}
                                    style={{ padding: "10px 40px", background: "#6366f1", color: "white", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: "600", cursor: "pointer", boxShadow: "0 2px 8px rgba(99,102,241,0.35)", transition: "all 0.2s" }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = "#4f46e5"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(99,102,241,0.5)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = "#6366f1"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(99,102,241,0.35)"; e.currentTarget.style.transform = "translateY(0)"; }}
                                >
                                    {editingItemId ? "Update" : "Add"}
                                </button>
                            </div>
                        </div>

                        <div className="grn-summary-section" style={{ marginTop: "24px" }}>
                            <div className="supplier-info">
                                {selectedSupplierData ? (
                                    <>
                                        <h3>{selectedSupplierData.name}</h3>
                                        <p>{selectedSupplierData.address}</p>
                                        <p>{selectedSupplierData.phoneNumber}&nbsp;&nbsp;{selectedSupplierData.email}</p>
                                    </>
                                ) : (
                                    <>
                                        <h3>Supplier Name</h3>
                                        <p>Address</p>
                                        <p>Telephone Number &nbsp; Email Address</p>
                                    </>
                                )}
                            </div>

                            <div className="grn-table-container">
                                <table className="grn-table">
                                    <thead>
                                        <tr>
                                            <th>Product Description</th>
                                            <th>Pack Size</th>
                                            <th className="text-right">Purchase Price</th>
                                            <th className="text-right">MRP Value</th>
                                            <th className="text-center">Quantity</th>
                                            <th className="text-right">Discount %</th>
                                            <th className="text-right">Discounted Price</th>
                                            <th className="text-right">Total Amount (LKR)</th>
                                            <th className="text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {addedItems.map((item) => (
                                            <React.Fragment key={item.id}>
                                                <tr>
                                                    <td>{item.productName}</td>
                                                    <td>{item.packSize || "-"}</td>
                                                    <td className="text-right">{parseFloat(item.purchasePrice).toFixed(2)}</td>
                                                    <td className="text-right">{parseFloat(item.mrpValue || 0).toFixed(2)}</td>
                                                    <td className="text-center">{item.quantity}</td>
                                                    <td className="text-right">{parseFloat(item.discountPercentage || 0).toFixed(2)}%</td>
                                                    <td className="text-right">{parseFloat(item.discountedPrice || item.purchasePrice).toFixed(2)}</td>
                                                    <td className="text-right">{parseFloat(item.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                    <td className="text-center">
                                                        <div className="action-btns" style={{ justifyContent: "center" }}>
                                                            <Edit3 size={18} className="edit-icon" onClick={() => handleEditItem(item)} />
                                                            <Trash2 size={18} className="delete-icon" onClick={() => handleRemoveItem(item.id)} />
                                                        </div>
                                                    </td>
                                                </tr>
                                                {parseFloat(item.bonus || 0) > 0 && (
                                                    <tr className="bonus-row">
                                                        <td>{item.productName}</td>
                                                        <td>{item.packSize || "-"}</td>
                                                        <td className="text-right">0.00</td>
                                                        <td className="text-right">0.00</td>
                                                        <td className="text-center">{item.bonus}</td>
                                                        <td className="text-right">0.00%</td>
                                                        <td className="text-right">0.00</td>
                                                        <td className="text-right">0.00</td>
                                                        <td></td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        ))}
                                        {addedItems.length > 0 && (
                                            <tr className="total-row">
                                                <td>Total</td>
                                                <td></td>
                                                <td></td>
                                                <td></td>
                                                <td></td>
                                                <td></td>
                                                <td className="text-right">{parseFloat(calculateGrandTotal()).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                <td></td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                                <div className="add-stock-footer">
                                    <button className="add-stock-btn" onClick={handleAddStock}>{formData.invoiceId ? "Update Stock" : "Add Stock"}</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <AddProductModal
                        isOpen={isAddProductModalOpen}
                        onClose={() => setIsAddProductModalOpen(false)}
                        onProductAdded={() => {
                            fetchProducts();
                            setIsAddProductModalOpen(false);
                        }}
                    />
                </div>
            </div>
        </Layout>
    );
};

export default GRN;
