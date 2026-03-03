import React, { useState, useRef, useEffect } from 'react';
import { Search, Filter, Download, FileText, Plus, Trash2, Edit2, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import './Common.css';

const DataTable = ({
    columns = [],
    data = [],
    title = "",

    showSearch = true,
    showFilter = true,
    showExport = true,
    showAddButton = true,
    addButtonLabel = "Add New",
    showStatusToggle = true,
    onAddClick = () => { },
    onSearch = () => { },
    onFilter = () => { },
    onExportCSV = null,
    onExportPDF = null,

    filterOptions = [],

    currentPage = 1,
    totalPages = 10,
    onPageChange = () => { },

    selectedIds = [],
    onSelectionChange = () => { },

    showActions = true,
    onEdit = () => { },
    onDelete = () => { },
    onToggleStatus = () => { },

    rowKey = "id",
}) => {

    const [filterOpen, setFilterOpen] = useState(false);
    const [activeFilter, setActiveFilter] = useState(null);
    const filterRef = useRef(null);

    const [exportOpen, setExportOpen] = useState(false);
    const exportRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (filterRef.current && !filterRef.current.contains(e.target)) {
                setFilterOpen(false);
            }
            if (exportRef.current && !exportRef.current.contains(e.target)) {
                setExportOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleFilterSelect = (option) => {
        setActiveFilter(option.value);
        setFilterOpen(false);
        onFilter(option.value);
    };

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
                    </div>

                    <div className="control-right">
                        {showFilter && (
                            <div className="filter-dropdown-wrapper" ref={filterRef}>
                                <button
                                    className={`btn-secondary ${activeFilter ? 'btn-secondary--active' : ''}`}
                                    onClick={() => setFilterOpen((prev) => !prev)}
                                >
                                    <Filter size={16} />
                                    {activeFilter
                                        ? (filterOptions.find(o => o.value === activeFilter)?.label || 'Filter')
                                        : 'Filter'}
                                    <ChevronDown size={14} className={`filter-chevron ${filterOpen ? 'filter-chevron--open' : ''}`} />
                                </button>
                                {filterOpen && filterOptions.length > 0 && (
                                    <ul className="filter-dropdown-menu">
                                        {filterOptions.map((option) => (
                                            <li
                                                key={option.value}
                                                className={`filter-dropdown-item ${activeFilter === option.value ? 'filter-dropdown-item--selected' : ''}`}
                                                onClick={() => handleFilterSelect(option)}
                                            >
                                                {option.label}
                                            </li>
                                        ))}
                                        {activeFilter && (
                                            <li
                                                className="filter-dropdown-item filter-dropdown-item--clear"
                                                onClick={() => { setActiveFilter(null); setFilterOpen(false); onFilter(null); }}
                                            >
                                                Clear filter
                                            </li>
                                        )}
                                    </ul>
                                )}
                            </div>
                        )}
                        {showExport && (onExportCSV || onExportPDF) && (
                            <div className="filter-dropdown-wrapper" ref={exportRef}>
                                <button
                                    className={`btn-secondary ${exportOpen ? 'btn-secondary--active' : ''}`}
                                    onClick={() => setExportOpen((prev) => !prev)}
                                >
                                    <Download size={16} />
                                    Export
                                    <ChevronDown size={14} className={`filter-chevron ${exportOpen ? 'filter-chevron--open' : ''}`} />
                                </button>
                                {exportOpen && (
                                    <ul className="filter-dropdown-menu">
                                        {onExportCSV && (
                                            <li
                                                className="filter-dropdown-item"
                                                onClick={() => { setExportOpen(false); onExportCSV(); }}
                                            >
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <Download size={14} /> Export as CSV
                                                </span>
                                            </li>
                                        )}
                                        {onExportPDF && (
                                            <li
                                                className="filter-dropdown-item"
                                                onClick={() => { setExportOpen(false); onExportPDF(); }}
                                            >
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <FileText size={14} /> Export as PDF
                                                </span>
                                            </li>
                                        )}
                                    </ul>
                                )}
                            </div>
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
                            {showActions && <th style={{ textAlign: 'right' }}>Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row) => (
                            <tr key={row[rowKey] || Math.random()}>
                                {columns.map((col, idx) => (
                                    <td key={idx}>
                                        {(() => {
                                            const value = col.render ? col.render(row) : row[col.accessor];
                                            return (value === null || value === undefined || value === "") ? "-" : value;
                                        })()}
                                    </td>
                                ))}
                                {showActions && (
                                    <td style={{ textAlign: 'right' }}>
                                        <div className="action-buttons" style={{ justifyContent: 'flex-end' }}>
                                            <button className="action-btn edit-btn" onClick={() => onEdit(row)}>
                                                <Edit2 size={18} />
                                            </button>
                                            <button className="action-btn delete-btn" onClick={() => onDelete(row)}>
                                                <Trash2 size={18} />
                                            </button>
                                            {showStatusToggle && (
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
                                )}
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
                            onClick={() => onPageChange(i)}
                        >
                            {i + 1}
                        </button>
                    ))}
                </div>

                <button
                    className="nav-btn"
                    disabled={currentPage === totalPages - 1}
                    onClick={() => onPageChange(currentPage + 1)}
                >
                    Next <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
};

export default DataTable;
