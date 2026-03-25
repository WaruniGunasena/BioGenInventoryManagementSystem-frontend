import React, { useState, useEffect } from "react";
import Sidebar from '../../components/Sidebar';
import Layout from '../../components/Layout';
import '../../components/Dashboard/Dashboard.css';
import {
  Calendar,
  TrendingDown,
  TrendingUp,
  Activity
} from "lucide-react";
import "./CashFlow.css";
import {
  getPendingCashFlow,
  getCompletedCashFlow,
  getCashFlowSummary
} from "../../api/cashFlowService";

const CashFlow = () => {
  const [activeTab, setActiveTab] = useState("pending");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const [pendingDebits, setPendingDebits] = useState([]);
  const [pendingCredits, setPendingCredits] = useState([]);
  const [completedDebits, setCompletedDebits] = useState([]);
  const [completedCredits, setCompletedCredits] = useState([]);
  const [summaryData, setSummaryData] = useState({
    totalIncome: 0,
    totalExpense: 0,
    profitOrLoss: 0
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!startDate || !endDate) {
        setPendingDebits([]);
        setPendingCredits([]);
        setCompletedDebits([]);
        setCompletedCredits([]);
        setSummaryData({ totalIncome: 0, totalExpense: 0, profitOrLoss: 0 });
        return;
      }
      setIsLoading(true);
      try {
        if (activeTab === "pending") {
          const res = await getPendingCashFlow(startDate, endDate);
          console.log(res.data);
          setPendingDebits(res.data?.debits || []);
          setPendingCredits(res.data?.credits || []);
        } else if (activeTab === "complete") {
          const res = await getCompletedCashFlow(startDate, endDate);
          setCompletedDebits(res.data?.debits || []);
          setCompletedCredits(res.data?.credits || []);
        } else if (activeTab === "summary") {
          const res = await getCashFlowSummary(startDate, endDate);
          setSummaryData({
            totalIncome: res.data?.totalIncome || 0,
            totalExpense: res.data?.totalExpense || 0,
            profitOrLoss: res.data?.profitOrLoss || 0
          });
        }
      } catch (error) {
        console.error("Failed to fetch cash flow data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [activeTab, startDate, endDate]);

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
          <div className="cashflow-dashboard">
            <div className="cashflow-header">
              <div className="header-title">
                <h1>Cash Flow</h1>
              </div>
            </div>

            <div className="cashflow-controls">
              <div className="cashflow-tabs">
                <button
                  className={`tab-btn ${activeTab === "pending" ? "active" : ""}`}
                  onClick={() => setActiveTab("pending")}
                >
                  Pending Payments
                </button>
                <button
                  className={`tab-btn ${activeTab === "complete" ? "active" : ""}`}
                  onClick={() => setActiveTab("complete")}
                >
                  Completed Payments
                </button>
                <button
                  className={`tab-btn ${activeTab === "summary" ? "active" : ""}`}
                  onClick={() => setActiveTab("summary")}
                >
                  Summary & Overview
                </button>
              </div>

              <div className="date-filter">
                <Calendar size={18} className="icon-calendar" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="date-input"
                />
                <span className="date-separator">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="date-input"
                />
              </div>
            </div>

            <div className="cashflow-content">
              {activeTab === "pending" && (
                <div className="tab-pane fade-in">
                  <div className="tables-container">
                    <div className="ledger-card debit-card">
                      <div className="ledger-header">
                        <div className="ledger-title-wrap">
                          <TrendingUp className="ledger-icon" size={24} />
                          <h2>Debit (Receivable)</h2>
                        </div>
                      </div>
                      <div className="table-responsive">
                        <table className="ledger-table">
                          <thead>
                            <tr>
                              <th>Invoice Number</th>
                              <th>Customer</th>
                              <th>Amount</th>
                              <th>Due Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {isLoading ? (
                              <tr><td colSpan="4" className="empty-state">Loading...</td></tr>
                            ) : (!startDate || !endDate) ? (
                              <tr><td colSpan="4" className="empty-state" style={{ color: "#94a3b8", fontStyle: "italic" }}>Please select a date range</td></tr>
                            ) : pendingDebits.length === 0 ? (
                              <tr><td colSpan="4" className="empty-state">No pending debits matching the criteria</td></tr>
                            ) : (
                              pendingDebits.map((item, index) => (
                                <tr key={index}>
                                  <td>{item.invoiceNumber || "N/A"}</td>
                                  <td>{item.customer || "N/A"}</td>
                                  <td>{item.amount || "0.00"}</td>
                                  <td>{item.date || "N/A"}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <div className="ledger-card credit-card">
                      <div className="ledger-header">
                        <div className="ledger-title-wrap">
                          <TrendingDown className="ledger-icon" size={24} />
                          <h2>Credit (Payable)</h2>
                        </div>
                      </div>
                      <div className="table-responsive">
                        <table className="ledger-table">
                          <thead>
                            <tr>
                              <th>Invoice Number</th>
                              <th>Supplier</th>
                              <th>Amount</th>
                              <th>Due Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {isLoading ? (
                              <tr><td colSpan="4" className="empty-state">Loading...</td></tr>
                            ) : (!startDate || !endDate) ? (
                              <tr><td colSpan="4" className="empty-state" style={{ color: "#94a3b8", fontStyle: "italic" }}>Please select a date range</td></tr>
                            ) : pendingCredits.length === 0 ? (
                              <tr><td colSpan="4" className="empty-state">No pending credits matching the criteria</td></tr>
                            ) : (
                              pendingCredits.map((item, index) => (
                                <tr key={index}>
                                  <td>{item.invoiceNumber || "N/A"}</td>
                                  <td>{item.supplier || "N/A"}</td>
                                  <td>{item.amount || "0.00"}</td>
                                  <td>{item.date || "N/A"}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "complete" && (
                <div className="tab-pane fade-in">
                  <div className="tables-container">
                    <div className="ledger-card debit-card">
                      <div className="ledger-header">
                        <div className="ledger-title-wrap">
                          <TrendingDown className="ledger-icon" size={24} />
                          <h2>Debit (Paid)</h2>
                        </div>
                      </div>
                      <div className="table-responsive">
                        <table className="ledger-table">
                          <thead>
                            <tr>
                              <th>Invoice Number</th>
                              <th>Customer</th>
                              <th>Amount</th>
                              <th>Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {isLoading ? (
                              <tr><td colSpan="4" className="empty-state">Loading...</td></tr>
                            ) : (!startDate || !endDate) ? (
                              <tr><td colSpan="4" className="empty-state" style={{ color: "#94a3b8", fontStyle: "italic" }}>Please select a date range</td></tr>
                            ) : completedDebits.length === 0 ? (
                              <tr><td colSpan="4" className="empty-state">No completed debits found</td></tr>
                            ) : (
                              completedDebits.map((item, index) => (
                                <tr key={index}>
                                  <td>{item.invoiceNumber || "N/A"}</td>
                                  <td>{item.customer || "N/A"}</td>
                                  <td>{item.amount || "0.00"}</td>
                                  <td>{item.date || "N/A"}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <div className="ledger-card credit-card">
                      <div className="ledger-header">
                        <div className="ledger-title-wrap">
                          <TrendingUp className="ledger-icon" size={24} />
                          <h2>Credit (Received)</h2>
                        </div>
                      </div>
                      <div className="table-responsive">
                        <table className="ledger-table">
                          <thead>
                            <tr>
                              <th>Invoice Number</th>
                              <th>Supplier</th>
                              <th>Amount</th>
                              <th>Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {isLoading ? (
                              <tr><td colSpan="4" className="empty-state">Loading...</td></tr>
                            ) : (!startDate || !endDate) ? (
                              <tr><td colSpan="4" className="empty-state" style={{ color: "#94a3b8", fontStyle: "italic" }}>Please select a date range</td></tr>
                            ) : completedCredits.length === 0 ? (
                              <tr><td colSpan="4" className="empty-state">No completed credits found</td></tr>
                            ) : (
                              completedCredits.map((item, index) => (
                                <tr key={index}>
                                  <td>{item.invoiceNumber || "N/A"}</td>
                                  <td>{item.supplier || "N/A"}</td>
                                  <td>{item.amount || "0.00"}</td>
                                  <td>{item.date || "N/A"}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "summary" && (
                <div className="tab-pane fade-in">
                  <div className="summary-widgets">

                    <div className="widget-card income">
                      <div className="widget-icon">
                        <TrendingUp size={28} />
                      </div>
                      <div className="widget-info">
                        <p className="widget-label">Total Income</p>
                        <h3 className="widget-value">
                          {isLoading ? "Loading..." : `Rs. ${summaryData.totalIncome || "0.00"}`}
                        </h3>
                      </div>
                    </div>

                    <div className="widget-card expense">
                      <div className="widget-icon">
                        <TrendingDown size={28} />
                      </div>
                      <div className="widget-info">
                        <p className="widget-label">Total Expense</p>
                        <h3 className="widget-value">
                          {isLoading ? "Loading..." : `Rs. ${summaryData.totalExpense || "0.00"}`}
                        </h3>
                      </div>
                    </div>

                    <div className="widget-card profit">
                      <div className="widget-icon">
                        <Activity size={28} />
                      </div>
                      <div className="widget-info">
                        <p className="widget-label">Profit / Loss</p>
                        <h3 className="widget-value">
                          {isLoading ? "Loading..." : `Rs. ${summaryData.profitOrLoss || "0.00"}`}
                        </h3>
                      </div>
                    </div>

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

export default CashFlow;
