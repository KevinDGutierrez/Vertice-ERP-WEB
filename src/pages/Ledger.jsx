import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import api from '../api/client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, BookOpen, Calendar, Filter, 
  TrendingUp, TrendingDown, DollarSign, Activity 
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import './Ledger.css';

const formatQ = (val) => `Q${(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const Ledger = () => {
  const [accounts, setAccounts] = useState([]);
  const [accountId, setAccountId] = useState('');
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const [startDate, setStartDate] = useState(firstDay.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const res = await api.get('/accounts');
      setAccounts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!accountId) return;

    setLoading(true);
    setError(null);
    try {
      const params = { accountId };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await api.get('/entries/ledger', { params });
      
      // Map backend response to component's expected shape
      const movements = res.data.movements || [];
      const totalDebit = movements.reduce((s, m) => s + (m.debit || 0), 0);
      const totalCredit = movements.reduce((s, m) => s + (m.credit || 0), 0);
      const finalBalance = movements.length > 0 ? movements[movements.length - 1].balance : 0;
      
      setData({
        account: res.data.account,
        entries: movements,
        initialBalance: 0,
        finalBalance,
        totalDebit,
        totalCredit
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar el libro mayor');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  // Auto-search when account changes
  useEffect(() => {
    if (accountId) handleSearch();
  }, [accountId]);

  // Derive chart data from entries to show balance evolution
  let currentBal = data?.initialBalance || 0;
  const chartData = (data?.entries || []).map((entry) => {
    if (data.account.nature === 'DEUDORA') {
      currentBal += (entry.debit - entry.credit);
    } else {
      currentBal += (entry.credit - entry.debit);
    }
    return {
      date: new Date(entry.date + 'T12:00:00').toLocaleDateString('es-GT', { day: 'numeric', month: 'short' }),
      balance: currentBal
    };
  });

  return (
    <Layout>
      <div className="ledger-analytic-container fade-in">

        {/* Massive Spotlight Search */}
        <div className={`spotlight-search-bar ${data ? 'compact' : 'expanded'}`}>
          <div className="search-icon-wrap">
            <Search size={data ? 24 : 32} />
          </div>
          <select 
            className="massive-select" 
            value={accountId} 
            onChange={e => setAccountId(e.target.value)}
          >
            <option value="">Buscar cuenta contable para analizar...</option>
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
            ))}
          </select>
        </div>

        {/* Extra Filters (only visible if an account is selected) */}
        <AnimatePresence>
          {accountId && (
            <motion.form 
              className="ledger-filters"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              onSubmit={handleSearch}
            >
              <div className="l-filter-group">
                <Calendar size={16} />
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
              </div>
              <span className="l-arrow">→</span>
              <div className="l-filter-group">
                <Calendar size={16} />
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
              </div>
              <button type="submit" className="l-btn">
                <Filter size={16} /> Aplicar Rango
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="ledger-loading">
            <div className="spin-loader"></div>
            <p>Calculando históricos...</p>
          </div>
        ) : error ? (
          <div className="ledger-error">
            <p>{error}</p>
          </div>
        ) : !data ? (
          <div className="ledger-empty-hero">
            <div className="hero-icon-container">
              <BookOpen size={80} strokeWidth={1} />
            </div>
            <h2>Explorador Analítico</h2>
            <p>Utiliza la barra superior para buscar una cuenta y visualizar su evolución, saldos y todos los movimientos asociados en un entorno gráfico enfocado.</p>
          </div>
        ) : (
          <div className="ledger-dashboard">
            
            {/* Account Hero Metrics */}
            <div className="ld-metrics-grid">
              <div className="ld-metric-card highlight">
                <div className="ld-metric-icon"><DollarSign size={24} /></div>
                <div className="ld-metric-content">
                  <span>Saldo Actual</span>
                  <strong>{formatQ(data.finalBalance)}</strong>
                </div>
              </div>
              <div className="ld-metric-card">
                <div className="ld-metric-icon secondary"><Activity size={24} /></div>
                <div className="ld-metric-content">
                  <span>Saldo Inicial</span>
                  <strong>{formatQ(data.initialBalance)}</strong>
                </div>
              </div>
              <div className="ld-metric-card">
                <div className="ld-metric-icon success"><TrendingUp size={24} /></div>
                <div className="ld-metric-content">
                  <span>Total Cargos (Debe)</span>
                  <strong>{formatQ(data.totalDebit)}</strong>
                </div>
              </div>
              <div className="ld-metric-card">
                <div className="ld-metric-icon warning"><TrendingDown size={24} /></div>
                <div className="ld-metric-content">
                  <span>Total Abonos (Haber)</span>
                  <strong>{formatQ(data.totalCredit)}</strong>
                </div>
              </div>
            </div>

            {/* Account Chart */}
            {chartData.length > 0 && (
              <div className="ld-chart-card">
                <h3>Evolución de Saldo</h3>
                <div className="ld-chart-wrapper">
                  <ResponsiveContainer width="100%" height={240}>
                    <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.5}/>
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                      <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                      <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }} />
                      <Area type="step" dataKey="balance" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorBalance)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Individual Receipts Feed */}
            <div className="ld-feed-section">
              <h3>Historial de Movimientos</h3>
              
              {data.entries && data.entries.length > 0 ? (
                <div className="ld-receipt-grid">
                  {data.entries.map((entry, idx) => (
                    <div className="receipt-card" key={idx}>
                      <div className="rc-header">
                        <span className="rc-date">
                          <Calendar size={14} /> 
                          {new Date(entry.date + 'T12:00:00').toLocaleDateString('es-GT', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                        <span className="rc-badge">P-{entry.entryNumber}</span>
                      </div>
                      <div className="rc-desc">
                        {entry.description}
                      </div>
                      <div className="rc-amounts">
                        <div className="rc-amt-box">
                          <span className="lbl">Debe</span>
                          <span className={`val ${entry.debit > 0 ? 'active' : ''}`}>{formatQ(entry.debit)}</span>
                        </div>
                        <div className="rc-amt-box">
                          <span className="lbl">Haber</span>
                          <span className={`val ${entry.credit > 0 ? 'active' : ''}`}>{formatQ(entry.credit)}</span>
                        </div>
                      </div>
                      <div className="rc-footer">
                        <span>Saldo resultante</span>
                        <strong>{formatQ(entry.balance)}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="ld-no-entries">
                  <BookOpen size={48} className="empty-icon-faded" />
                  <p>No se encontraron movimientos para esta cuenta en el periodo.</p>
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </Layout>
  );
};

export default Ledger;
