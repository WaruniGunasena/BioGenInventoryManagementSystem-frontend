import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import DataTable from '../../components/common/DataTable';
import Layout from '../../components/Layout';
import { searchStock, getPaginatedStock } from '../../api/stockService';
import FilterType from '../../enums/FilterType';
import './Stock.css';

const Stock = () => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    const [stockItems, setStockItems] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);

    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [filter, setFilter] = useState(FilterType.ASC);

    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const controller = new AbortController();

        const fetchStock = async () => {
            setIsLoading(true);
            try {
                const response = searchQuery.trim()
                    ? await searchStock(searchQuery, currentPage, 5, filter, { signal: controller.signal })
                    : await getPaginatedStock(currentPage, 8, filter, { signal: controller.signal });

                if (controller.signal.aborted) return;

                if (response.data?.productStocks && Array.isArray(response.data.productStocks)) {
                    setStockItems(response.data.productStocks);
                    setTotalPages(response.data.totalPages ?? 1);
                } else {
                    setStockItems([]);
                    setTotalPages(0);
                }
            } catch (err) {
                if (err.name !== 'AbortError' && !controller.signal.aborted) {
                    setStockItems([]);
                    setTotalPages(0);
                }
            } finally {
                if (!controller.signal.aborted) setIsLoading(false);
            }
        };

        fetchStock();

        return () => controller.abort();
    }, [currentPage, filter, searchQuery]);

    const handleSearch = (query) => {
        setSearchQuery(query);
        setCurrentPage(0);
    };

    const columns = [
        { header: "Product Name", accessor: "productName" },
        { header: "Product ID", accessor: "itemCode" },
        { header: "Quantity", accessor: "totalQuantity", align: "right" },
        {
            header: "Selling Price",
            accessor: "sellingPrice",
            align: "right",
            render: (row) => row.sellingPrice != null ? Number(row.sellingPrice).toFixed(2) : "-"
        },
        { header: "Minimum Stock", accessor: "minimumStockLevel", align: "right" },
        { header: "Reorder Level", accessor: "reorderLevel", align: "right" },
    ];

    return (
        <Layout>
            <div className={`dashboard-container ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
                <Sidebar
                    isCollapsed={isSidebarCollapsed}
                    toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    isMobileOpen={isMobileSidebarOpen}
                    toggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                />

                <div className="dashboard-content">
                    <header className="stock-header">
                        <h2>Stock</h2>
                    </header>

                    {isLoading && <div className="loading-overlay">Loading...</div>}

                    <DataTable
                        columns={columns}
                        data={stockItems}
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        selectedIds={selectedIds}
                        onSelectionChange={setSelectedIds}
                        onSearch={handleSearch}
                        rowKey="stockId"
                        filterOptions={[
                            { label: 'Name: A → Z', value: FilterType.ASC },
                            { label: 'Name: Z → A', value: FilterType.DESC },
                            { label: 'Date: Oldest to Newest', value: FilterType.DATE_ASC },
                            { label: 'Date: Newest to Oldest', value: FilterType.DATE_DESC }
                        ]}
                        onFilter={(value) => {
                            setFilter(value ?? FilterType.ASC);
                            setCurrentPage(0);
                        }}
                        showAddButton={false}
                        showStatusToggle={false}
                        showActions={false}
                    />
                </div>
            </div>
        </Layout>
    );
};

export default Stock;