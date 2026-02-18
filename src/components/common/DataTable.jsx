import React from 'react';
import { Search, Filter, Download, Plus, Trash2, Edit2, ChevronLeft, ChevronRight } from 'lucide-react';
import './Common.css';

const DataTable = ({
    columns = [],
    data = [],
    title = "", // Optional title inside table

    // Controls
    showSearch = true,
    showFilter = true,
    showExport = true,
    showAddButton = true,
    addButtonLabel = "Add New",
    onAddClick = () => { },
    onSearch = () => { },
    onFilter = () => { },
    onExport = () => { },

    // Pagination
    currentPage = 1,
    totalPages = 10,
    onPageChange = () => { },

    // Selection
    selectedIds = [],
    onSelectionChange = () => { },

    // Actions
    onEdit = () => { },
    onDelete = () => { },
    onToggleStatus = () => { },
}) => {

    const isAllSelected = data.length > 0 && selectedIds.length === data.length;

    const handleSelectAll = () => {
        if (isAllSelected) {
            onSelectionChange([]);
        } else {
            onSelectionChange(data.map(item => item.id));
        }
    };

    const handleSelectRow = (id) => {
        if (selectedIds.includes(id)) {
            onSelectionChange(selectedIds.filter(itemId => itemId !== id));
        } else {
            onSelectionChange([...selectedIds, id]);
        }
    };

    return (
        <div className="data-table-container">
            {/* Controls Header */}
            {(showSearch || showFilter || showExport || showAddButton) && (
                <div className="table-header-controls">
                    <div className="control-left">
                        {showSearch && (
                            <div className="search-bar-wrapper">
                                <Search className="table-search-icon" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search"
                                    className="table-search-input"
                                    onChange={(e) => onSearch(e.target.value)}
                                />
                            </div>
                        )}
                        {showFilter && (
                            <button className="btn-secondary" onClick={onFilter}>
                                <Filter size={16} /> Filters
                            </button>
                        )}
                    </div>

                    <div className="control-right">
                        {showExport && (
                            <button className="btn-secondary" onClick={onExport}>
                                <Download size={16} /> Export
                            </button>
                        )}
                        {showAddButton && (
                            <button className="btn-primary" onClick={onAddClick}>
                                <Plus size={16} /> {addButtonLabel}
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="table-wrapper">
                <table className="common-table">
                    <thead>
                        <tr>
                            {columns.map((col, index) => (
                                <th key={index}>{col.header}</th>
                            ))}
                            <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row) => (
                            <tr key={row.id}>
                                {columns.map((col, idx) => (
                                    <td key={idx}>
                                        {col.render ? col.render(row) : row[col.accessor]}
                                    </td>
                                ))}
                                <td style={{ textAlign: 'right' }}>
                                    <div className="action-buttons" style={{ justifyContent: 'flex-end' }}>
                                        <button className="action-btn edit-btn" onClick={() => onEdit(row)}>
                                            <Edit2 size={18} />
                                        </button>
                                        <button className="action-btn delete-btn" onClick={() => onDelete(row)}>
                                            <Trash2 size={18} />
                                        </button>
                                        {onToggleStatus && (
                                            <label className="switch">
                                                <input
                                                    type="checkbox"
                                                    checked={row.isActive}
                                                    onChange={() => onToggleStatus(row)}
                                                />
                                                <span className="slider round"></span>
                                            </label>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="pagination-container">
                <button
                    className="nav-btn"
                    disabled={currentPage === 0}
                    onClick={() => onPageChange(currentPage - 1)}
                >
                    <ChevronLeft size={16} /> Previous
                </button>

                <div className="page-numbers">
                    {[...Array(totalPages)].map((_, i) => (
                        <button
                            key={i}
                            className={`page-btn ${currentPage === i ? 'active' : ''}`}
                            onClick={() => onPageChange(i + 1)}
                        >
                            {i + 1}
                        </button>
                    ))}
                </div>

                <button
                    className="nav-btn"
                    disabled={currentPage === totalPages-1}
                    onClick={() => onPageChange(currentPage + 1)}
                >
                    Next <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
};

export default DataTable;
