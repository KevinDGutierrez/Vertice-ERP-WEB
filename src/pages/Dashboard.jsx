import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import api from '../api/client';
import { motion } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, DollarSign, Activity, 
  PlusCircle, Zap, Eye, Calendar, ArrowRight, Layers
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const formatQ = (val) => `Q${(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const res = await api.get('/dashboard/summary');
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Error al cargar el dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const hasMovements = data && (data.totalAssets > 0 || data.totalLiabilities > 0 || data.monthlySales > 0 || data.monthlyExpenses > 0 || (data.latestEntries && data.latestEntries.length > 0));

  const pieData = data ? [
    { name: 'Activos', value: data.totalAssets || 1 },
    { name: 'Pasivos', value: Math.abs(data.totalLiabilities) || 1 }
  ] : [];

  const pieColors = ['#6366f1', '#ec4899'];

  return (
    <Layout>
      <div className="dash-core-container">
        {/* Quick Actions Floating Bar */}
        <div className="dash-quick-actions">
          <button className="quick-action-btn primary" onClick={() => navigate('/new-entry')}>
            <PlusCircle size={20} />
            <span>Crear Partida</span>
          </button>
          <button className="quick-action-btn secondary" onClick={() => navigate('/ledger')}>
            <Eye size={20} />
            <span>Ver Mayor</span>
          </button>
        </div>

        {loading ? (
          <div className="dash-loading-center fade-in">
            <div className="pulse-ring"></div>
            <p>Conectando con el núcleo financiero...</p>
          </div>
        ) : error ? (
          <div className="dash-error fade-in">
            <Zap size={48} />
            <h3>Error de sincronización</h3>
            <p>{error}</p>
            <button className="btn-primary" onClick={() => window.location.reload()}>Reintentar</button>
          </div>
        ) : !hasMovements ? (
          <div className="dash-empty-state fade-in">
            <div className="empty-state-art">
              <Layers size={80} strokeWidth={1} />
            </div>
            <h2>El motor está listo</h2>
            <p>Aún no hay transacciones registradas. Crea tu primera partida para darle vida al panel de control.</p>
            <button className="btn-primary large" onClick={() => navigate('/new-entry')}>
              Comenzar ahora <ArrowRight size={20} />
            </button>
          </div>
        ) : (
          <div className="dash-command-center">
            
            {/* Left/Top Column: Main Analytics */}
            <div className="dash-analytics-pane">
              <header className="dash-header">
                <div>
                  <h1>Centro de Mando</h1>
                  <p>Estado financiero en tiempo real</p>
                </div>
                <div className="dash-date-pill">
                  {new Date().toLocaleDateString('es-GT', { month: 'long', year: 'numeric' })}
                </div>
              </header>

              {/* Huge KPI Blocks */}
              <div className="kpi-masonry">
                <motion.div className="kpi-block hero-kpi" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <span className="kpi-label">Utilidad Neta</span>
                  <div className={`kpi-big-value ${data.netIncome >= 0 ? 'pos' : 'neg'}`}>
                    {formatQ(data.netIncome)}
                  </div>
                  <div className="kpi-sparkline">
                    <TrendingUp size={24} className="spark-icon" />
                    <span>Balance operativo del periodo actual</span>
                  </div>
                </motion.div>

                <div className="kpi-split">
                  <motion.div className="kpi-block" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <div className="kpi-icon-wrap bg-green"><DollarSign size={24} /></div>
                    <span className="kpi-label">Ingresos Brutos</span>
                    <div className="kpi-value">{formatQ(data.monthlySales)}</div>
                  </motion.div>
                  <motion.div className="kpi-block" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <div className="kpi-icon-wrap bg-red"><Activity size={24} /></div>
                    <span className="kpi-label">Gastos Operativos</span>
                    <div className="kpi-value">{formatQ(data.monthlyExpenses)}</div>
                  </motion.div>
                </div>
              </div>

              {/* Dynamic Flow Chart */}
              <motion.div className="flow-chart-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <div className="flow-chart-header">
                  <h3>Flujo de Caja Dinámico</h3>
                  <span>Mes Actual</span>
                </div>
                <div className="chart-canvas">
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={data.chartData || []} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorGastos" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ec4899" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                      <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={d => d.split('-')[2]} />
                      <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                      <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }} />
                      <Area type="monotone" dataKey="ingresos" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorIngresos)" />
                      <Area type="monotone" dataKey="gastos" stroke="#ec4899" strokeWidth={3} fillOpacity={1} fill="url(#colorGastos)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            </div>

            {/* Right/Bottom Column: Live Feed & Structure */}
            <div className="dash-feed-pane">
              
              {/* Asset Health Ring */}
              <motion.div className="health-ring-card" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                <h3>Estructura Patrimonial</h3>
                <div className="health-ring-container">
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                        {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />)}
                      </Pie>
                      <Tooltip formatter={(value) => formatQ(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="health-ring-center">
                    <span className="ring-label">Patrimonio</span>
                    <span className="ring-val">{formatQ(data.totalEquity)}</span>
                  </div>
                </div>
              </motion.div>

              {/* Live Activity Feed */}
              <motion.div className="live-feed-card" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
                <div className="feed-header">
                  <h3>Radar de Actividad</h3>
                  <button className="feed-link" onClick={() => navigate('/entries')}>Ver todo</button>
                </div>
                <div className="feed-stream">
                  {data.latestEntries && data.latestEntries.length > 0 ? (
                    data.latestEntries.map((entry, idx) => (
                      <div className="feed-item" key={entry.id || idx}>
                        <div className="feed-node">
                          <div className={`node-dot ${entry.type === 'AJUSTE' ? 'warn' : 'ok'}`} />
                          {idx !== data.latestEntries.length - 1 && <div className="node-line" />}
                        </div>
                        <div className="feed-content">
                          <div className="feed-meta">
                            <span className="feed-date">
                              <Calendar size={12} />
                              {new Date(entry.date + 'T12:00:00').toLocaleDateString('es-GT', { day: 'numeric', month: 'short' })}
                            </span>
                            <span className="feed-amt">{formatQ(entry.total || (entry.details ? entry.details.reduce((s,d)=>s+(Number(d.debit)||0),0):0))}</span>
                          </div>
                          <p className="feed-desc">{entry.description}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="feed-empty">No hay eventos recientes</div>
                  )}
                </div>
              </motion.div>

            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;
