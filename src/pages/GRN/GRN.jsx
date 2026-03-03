import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import Layout from "../../components/Layout";
import { getAllSuppliers } from "../../api/supplierService";
import { getAllProducts } from "../../api/productService";
import { createGRN } from "../../api/grnService";
import AddProductModal from "../../components/Products/AddProductModal";
import { PlusCircle, Trash2, Edit3, FileText } from "lucide-react";
import { getUserId } from "../../components/common/Utils/userUtils/userUtils";
import "./GRN.css";

const GRN = () => {
    const navigate = useNavigate();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    const [suppliers, setSuppliers] = useState([]);
    const [products, setProducts] = useState([]);
    const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);

    const [formData, setFormData] = useState({
        supplierId: "",
        date: new Date().toISOString().split("T")[0],
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
    });

    const [selectedSupplierData, setSelectedSupplierData] = useState(null);
    const [addedItems, setAddedItems] = useState([]);
    const [editingItemId, setEditingItemId] = useState(null);
    const [currentUserId, setCurrentUserId] = useState(null);

    useEffect(() => {
        fetchSuppliers();
        fetchProducts();
        fetchUserId();
    }, []);

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
            productCode: product ? (product.id || product._id) : "",
        }));
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => {
            const newData = { ...prev, [name]: value };

            if (name === "purchasePrice" || name === "quantity") {
                const price = parseFloat(newData.purchasePrice) || 0;
                const qty = parseFloat(newData.quantity) || 0;
                newData.totalAmount = (price * qty).toFixed(2);
            }

            return newData;
        });
    };

    const handleEditItem = (item) => {
        setFormData({
            ...item,
        });
        setEditingItemId(item.id);
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
        }));
    };

    const handleAddItem = () => {
        if (!formData.productId || !formData.purchasePrice || !formData.quantity) {
            alert("Please select a product and enter price/quantity");
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
            batchNumber: "",
            mfgDate: "",
            expDate: "",
            purchasePrice: "",
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

    const handleAddStock = async () => {
        if (addedItems.length === 0) {
            alert("Please add at least one item");
            return;
        }

        const grnData = {
            supplierId: formData.supplierId,
            userId: currentUserId,
            date: formData.date,
            invoiceNumber: formData.invoiceNumber,
            items: addedItems.map(item => ({
                productId: item.productId,
                batchNumber: item.batchNumber,
                mfgDate: item.mfgDate,
                expDate: item.expDate,
                purchasePrice: item.purchasePrice,
                quantity: item.quantity,
                totalAmount: item.totalAmount
            })),
            grandTotal: calculateGrandTotal()
        };

        try {
            await createGRN(grnData);
            alert("Stock added successfully!");
            setAddedItems([]);
            setFormData({
                supplierId: "",
                date: new Date().toISOString().split("T")[0],
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
            });
            setSelectedSupplierData(null);
        } catch (error) {
            console.error("Error adding GRN:", error);
            alert(error.response?.data?.message || "Failed to add stock. Please try again.");
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
                    <div className="grn-container">
                        <header className="grn-header">
                            <h2>Good Receive Note</h2>
                            <button className="see-invoices-btn" onClick={() => navigate("/invoices")}>
                                <FileText size={18} /> See All Invoices
                            </button>
                        </header>

                        <div className="grn-form-section">
                            <div className="grn-row">
                                <div className="grn-field">
                                    <label>Supplier</label>
                                    <select
                                        className="grn-select"
                                        value={formData.supplierId}
                                        onChange={handleSupplierChange}
                                    >
                                        <option value="">Select Supplier</option>
                                        {suppliers.map((s) => (
                                            <option key={s.id || s._id} value={s.id || s._id}>
                                                {s.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grn-field">
                                    <label>Date</label>
                                    <div className="date-input-wrapper">
                                        <input
                                            type="date"
                                            name="date"
                                            className="grn-input"
                                            value={formData.date}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                </div>
                                <div className="grn-field">
                                    <label>Credit Period</label>
                                    <input
                                        type="text"
                                        className="grn-input"
                                        value={formData.creditPeriod ? `${formData.creditPeriod} days` : ""}
                                        placeholder="Credit Period"
                                        readOnly
                                    />
                                </div>
                                <div className="grn-field">
                                    <label>Product</label>
                                    <select
                                        className="grn-select"
                                        value={formData.productId}
                                        onChange={handleProductChange}
                                    >
                                        <option value="">Select Product</option>
                                        {products.map((p) => (
                                            <option key={p.id || p._id} value={p.id || p._id}>
                                                {p.name}
                                            </option>
                                        ))}
                                    </select>
                                    <button className="add-product-btn" onClick={() => setIsAddProductModalOpen(true)}>
                                        <PlusCircle size={14} /> Add New Product
                                    </button>
                                </div>
                                <div className="grn-field">
                                    <label>Product Id</label>
                                    <input
                                        type="text"
                                        className="grn-input"
                                        value={formData.productCode}
                                        placeholder="ID"
                                        readOnly
                                    />
                                </div>
                            </div>

                            <div className="grn-row">
                                <div className="grn-field">
                                    <label>Batch Number</label>
                                    <input
                                        type="text"
                                        name="batchNumber"
                                        className="grn-input"
                                        placeholder="Enter Batch NUmber"
                                        value={formData.batchNumber}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="grn-field">
                                    <label>Manufacture Date</label>
                                    <input
                                        type="date"
                                        name="mfgDate"
                                        className="grn-input"
                                        value={formData.mfgDate}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="grn-field">
                                    <label>Expiry Date</label>
                                    <input
                                        type="date"
                                        name="expDate"
                                        className="grn-input"
                                        value={formData.expDate}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>

                            <div className="grn-row">
                                <div className="grn-field">
                                    <label>Purchase Price</label>
                                    <input
                                        type="number"
                                        name="purchasePrice"
                                        className="grn-input"
                                        placeholder="Enter Purchase Price"
                                        value={formData.purchasePrice}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="grn-field">
                                    <label>Quantity</label>
                                    <input
                                        type="number"
                                        name="quantity"
                                        className="grn-input"
                                        placeholder="Enter Quantity"
                                        value={formData.quantity}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="grn-field">
                                    <label>Total Amount</label>
                                    <input
                                        type="text"
                                        className="grn-input"
                                        value={formData.totalAmount}
                                        readOnly
                                    />
                                </div>
                                <div className="grn-field">
                                    <label>Invoice Number</label>
                                    <input
                                        type="text"
                                        name="invoiceNumber"
                                        className="grn-input"
                                        placeholder="Enter Invoice Number"
                                        value={formData.invoiceNumber}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="add-btn-wrapper">
                                    <button className="grn-add-btn" onClick={handleAddItem}>
                                        {editingItemId ? "Update" : "Add"}
                                    </button>
                                    {editingItemId && (
                                        <button className="grn-cancel-btn" onClick={handleCancelEdit}>
                                            Cancel
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="grn-summary-section">
                            <div className="supplier-info">
                                {selectedSupplierData ? (
                                    <>
                                        <h3>{selectedSupplierData.name}</h3>
                                        <p>{selectedSupplierData.address}</p>
                                        <p>{selectedSupplierData.phoneNumber}  {selectedSupplierData.email}</p>
                                    </>
                                ) : (
                                    <>
                                        <h3>Supplier Name</h3>
                                        <p>Address</p>
                                        <p>Telephone Number  Email Address</p>
                                    </>
                                )}
                            </div>

                            <div className="grn-table-container">
                                <table className="grn-table">
                                    <thead>
                                        <tr>
                                            <th>Product Description</th>
                                            <th>Purchase Price</th>
                                            <th>Quantity</th>
                                            <th>Total Amount RS.</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {addedItems.map((item) => (
                                            <tr key={item.id}>
                                                <td>{item.productName}</td>
                                                <td>{parseFloat(item.purchasePrice).toFixed(2)}</td>
                                                <td>{item.quantity}</td>
                                                <td>{item.totalAmount}</td>
                                                <td>
                                                    <div className="action-btns">
                                                        <Edit3
                                                            size={18}
                                                            className="edit-icon"
                                                            onClick={() => handleEditItem(item)}
                                                        />
                                                        <Trash2
                                                            size={18}
                                                            className="delete-icon"
                                                            onClick={() => handleRemoveItem(item.id)}
                                                        />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {addedItems.length > 0 && (
                                            <tr className="total-row">
                                                <td>Total</td>
                                                <td></td>
                                                <td></td>
                                                <td>{calculateGrandTotal()}</td>
                                                <td></td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                                <div className="add-stock-footer">
                                    <button className="add-stock-btn" onClick={handleAddStock}>Add Stock</button>
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
