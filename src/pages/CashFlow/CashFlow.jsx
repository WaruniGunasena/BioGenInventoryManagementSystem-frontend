import React, { useState, useEffect } from "react";
import Sidebar from '../../components/Sidebar';
import Layout from '../../components/Layout';
import '../../components/Dashboard/Dashboard.css';
import {
  Calendar,
  TrendingDown,
  TrendingUp,
  Activity,
  ArrowDownRight,
  ArrowUpRight
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
    profitOrLoss: 0,
    netCashInflow: 0,
    inflowPercentageChange: 0,
    totalSalesCount: 0,
    netCashOutflow: 0,
    outflowPercentageChange: 0,
    totalGrnCount: 0,
    operatingCashFlow: 0,
    accountsReceivable: 0,
    pendingSalesCount: 0,
    accountsPayable: 0,
    pendingPurchaseCount: 0
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!startDate || !endDate) {
        setPendingDebits([]);
        setPendingCredits([]);
        setCompletedDebits([]);
        setCompletedCredits([]);
        setSummaryData({
          totalIncome: 0, totalExpense: 0, profitOrLoss: 0,
          netCashInflow: 0, inflowPercentageChange: 0, totalSalesCount: 0,
          netCashOutflow: 0, outflowPercentageChange: 0, totalGrnCount: 0,
          operatingCashFlow: 0,
          accountsReceivable: 0, pendingSalesCount: 0,
          accountsPayable: 0, pendingPurchaseCount: 0
        });
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
          console.log(res.data);
          setCompletedDebits(res.data?.debits || []);
          setCompletedCredits(res.data?.credits || []);
        } else if (activeTab === "summary") {
          const res = await getCashFlowSummary(startDate, endDate);
          console.log("summary cash in flow", res);
          const summary = res.data?.cashFlowSummary || {};
          setSummaryData({
            totalIncome: res.data?.totalIncome || 0,
            totalExpense: res.data?.totalExpense || 0,
            profitOrLoss: res.data?.profitOrLoss || 0,
            netCashInflow: summary.netCashInflow || 0,
            inflowPercentageChange: summary.inflowPercentageChange || 0,
            totalSalesCount: summary.totalSalesCount || 0,
            netCashOutflow: summary.netCashOutflow || 0,
            outflowPercentageChange: summary.outflowPercentageChange || 0,
            totalGrnCount: summary.totalGrnCount || 0,
            operatingCashFlow: summary.operatingCashFlow || 0,
            accountsReceivable: summary.accountsReceivable || 0,
            pendingSalesCount: summary.pendingSalesCount || 0,
            accountsPayable: summary.accountsPayable || 0,
            pendingPurchaseCount: summary.pendingPurchaseCount || 0
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
                          <TrendingUp className="ledger-icon" size={24} />
                          <h2>Debit (Received)</h2>
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
                          <TrendingDown className="ledger-icon" size={24} />
                          <h2>Credit (Paid)</h2>
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
                  <div className="summary-overview-grid">
                    <div className="summary-card-modern inflow-modern">
                      <div className="card-header-modern">
                        <div className="card-title-modern">
                          Income
                        </div>
                        <div className="icon-wrapper-modern green">
                          <TrendingUp size={24} strokeWidth={2.5} />
                        </div>
                      </div>
                      <div className="card-body-modern">
                        <h3 className="card-amount-modern">Rs. {summaryData.netCashInflow.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                        <p className="card-subtitle-modern">
                          <span style={{ color: summaryData.inflowPercentageChange >= 0 ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                            {summaryData.inflowPercentageChange > 0 ? '+' : ''}{summaryData.inflowPercentageChange}%
                          </span>
                          Total from {summaryData.totalSalesCount.toLocaleString()} {summaryData.totalSalesCount === 1 ? 'Sale' : 'Sales'}
                        </p>
                      </div>
                    </div>
                    <div className="summary-card-modern outflow-modern">
                      <div className="card-header-modern">
                        <div className="card-title-modern">
                          Expense
                        </div>
                        <div className="icon-wrapper-modern red">
                          <TrendingDown size={24} strokeWidth={2.5} />
                        </div>
                      </div>
                      <div className="card-body-modern">
                        <h3 className="card-amount-modern">Rs. {summaryData.netCashOutflow.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                        <p className="card-subtitle-modern">
                          <span style={{ color: summaryData.outflowPercentageChange >= 0 ? '#ef4444' : '#10b981', fontWeight: 600 }}>
                            {summaryData.outflowPercentageChange > 0 ? '+' : ''}{summaryData.outflowPercentageChange}%
                          </span>
                          Paid for {summaryData.totalGrnCount.toLocaleString()} {summaryData.totalGrnCount === 1 ? 'Order' : 'Orders'}
                        </p>
                      </div>
                    </div>

                    {/* Operating Card */}
                    <div className="summary-card-modern operating-modern">
                      <div className="card-header-modern">
                        <div className="card-title-modern">
                          Profit / Loss
                        </div>
                        <div className="icon-wrapper-modern blue">
                          <Activity size={24} strokeWidth={2.5} />
                        </div>
                      </div>
                      <div className="card-body-modern">
                        <h3 className="card-amount-modern">Rs. {summaryData.operatingCashFlow.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                        <p className="card-subtitle-modern">
                          <span style={{ color: '#3b82f6', fontWeight: 600 }}>Net</span>
                          Income - Expense
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pending-payments-modern-section">
                    <div className="pending-payments-header">
                      <h2>Pending Payments</h2>
                      <p>Overview of expected incomes and expenses</p>
                    </div>

                    <div className="pending-cards-grid">
                      <div className="pending-card receivable">
                        <div className="pending-icon-wrapper blue">
                          <ArrowUpRight size={24} strokeWidth={2.5} />
                        </div>
                        <div className="pending-details">
                          <h3 className="pending-title">Accounts Receivable</h3>
                          <p className="pending-subtitle">
                            Total from unpaid/partial sales
                          </p>
                        </div>
                        <div className="pending-amount-wrapper">
                          <div className="pending-amount text-blue">
                            Rs. {summaryData.accountsReceivable.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                          <div className="pending-count">
                            {summaryData.pendingSalesCount} Pending {summaryData.pendingSalesCount === 1 ? 'Invoice' : 'Invoices'}
                          </div>
                        </div>
                      </div>

                      <div className="pending-card payable">
                        <div className="pending-icon-wrapper red">
                          <ArrowDownRight size={24} strokeWidth={2.5} />
                        </div>
                        <div className="pending-details">
                          <h3 className="pending-title">Accounts Payable</h3>
                          <p className="pending-subtitle">
                            Total owed on supplier orders
                          </p>
                        </div>
                        <div className="pending-amount-wrapper">
                          <div className="pending-amount text-red">
                            Rs. {summaryData.accountsPayable.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                          <div className="pending-count">
                            {summaryData.pendingPurchaseCount} Pending {summaryData.pendingPurchaseCount === 1 ? 'Order' : 'Orders'}
                          </div>
                        </div>
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
