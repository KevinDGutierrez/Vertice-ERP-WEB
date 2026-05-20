import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import api from '../api/client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Search, Filter, AlertCircle, FileText, 
  ChevronRight, ArrowRightLeft, Banknote, History
} from 'lucide-react';
import './JournalEntries.css';

const formatQ = (val) => `Q${(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const TimelineEvent = ({ entry, index }) => {
  const [expanded, setExpanded] = useState(false);
  
  const isAjuste = entry.type === 'AJUSTE';
  const isApertura = entry.type === 'APERTURA';

  return (
    <div className="timeline-node">
      {/* Visual Line & Dot */}
      <div className="timeline-spine">
        <div className={`timeline-dot ${isAjuste ? 'warn' : isApertura ? 'success' : 'primary'}`}>
          <History size={16} />
        </div>
        <div className="timeline-line" />
      </div>

      {/* Content Card */}
      <motion.div 
        className="timeline-content-card"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05 }}
      >
        <div className="t-card-header" onClick={() => setExpanded(!expanded)}>
          <div className="t-header-left">
            <span className="t-date">
              <Calendar size={14} />
              {new Date(entry.date + 'T12:00:00').toLocaleDateString('es-GT', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
            <div className={`t-badge ${isAjuste ? 'ajuste' : isApertura ? 'apertura' : 'diario'}`}>
              Partida {entry.entryNumber} • {entry.type}
            </div>
          </div>
          <div className="t-header-right">
            <span className="t-total">{formatQ(entry.total || (entry.details ? entry.details.reduce((sum, d) => sum + (Number(d.debit) || 0), 0) : 0))}</span>
            <motion.div animate={{ rotate: expanded ? 90 : 0 }}>
              <ChevronRight size={20} className="t-chevron" />
            </motion.div>
          </div>
        </div>

        <div className="t-desc">
          <p>{entry.description}</p>
        </div>

        <AnimatePresence>
          {expanded && (
            <motion.div 
              className="t-details-flow"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              <div className="flow-container">
                <div className="flow-header">
                  <span>Origen (Haber)</span>
                  <ArrowRightLeft size={16} className="flow-icon" />
                  <span>Destino (Debe)</span>
                </div>
                
                {/* Visualizing Debits and Credits as a Flow rather than a flat table */}
                <div className="flow-body">
                  <div className="flow-col">
                    {entry.details.filter(d => d.credit > 0).map((d, i) => (
                      <div className="flow-pill out" key={`cr-${i}`}>
                        <div className="pill-info">
                          <span className="p-code">{d.accountCode}</span>
                          <span className="p-name">{d.accountName}</span>
                        </div>
                        <span className="p-amt">{formatQ(d.credit)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flow-divider">
                    <div className="flow-line"></div>
                  </div>

                  <div className="flow-col">
                    {entry.details.filter(d => d.debit > 0).map((d, i) => (
                      <div className="flow-pill in" key={`db-${i}`}>
                        <div className="pill-info">
                          <span className="p-code">{d.accountCode}</span>
                          <span className="p-name">{d.accountName}</span>
                        </div>
                        <span className="p-amt">{formatQ(d.debit)}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </motion.div>
    </div>
  );
};

const JournalEntries = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [type, setType] = useState('');

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (type) params.type = type;

      const res = await api.get('/entries/daily-book', { params });
      setEntries(res.data);
    } catch (err) {
      if (err.response && err.response.status === 404) {
        setEntries([]);
      } else {
        setError(err.response?.data?.message || 'Error al cargar partidas');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []); // Initial load

  const handleFilter = (e) => {
    e.preventDefault();
    fetchEntries();
  };

  return (
    <Layout>
      <div className="timeline-container fade-in">
        
        {/* Modern Spotlight Header */}
        <div className="spotlight-header">
          <div className="spotlight-art">
            <Banknote size={64} />
          </div>
          <div className="spotlight-text">
            <h1>Libro Diario</h1>
            <p>Registro cronológico interactivo de todas las operaciones financieras.</p>
          </div>
          <div className="spotlight-stats">
            <div className="s-stat">
              <span>Total Registros</span>
              <strong>{entries.length}</strong>
            </div>
          </div>
        </div>

        {/* Floating Filter Bar */}
        <form className="floating-filter-bar" onSubmit={handleFilter}>
          <div className="f-group">
            <Search size={18} className="f-icon" />
            <select value={type} onChange={e => setType(e.target.value)}>
              <option value="">Todos los Tipos</option>
              <option value="DIARIO">Diario</option>
              <option value="APERTURA">Apertura</option>
              <option value="AJUSTE">Ajuste</option>
            </select>
          </div>
          <div className="f-divider" />
          <div className="f-group">
            <Calendar size={18} className="f-icon" />
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div className="f-divider" />
          <div className="f-group">
            <Calendar size={18} className="f-icon" />
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
          <button type="submit" className="f-btn">
            <Filter size={18} /> Filtrar
          </button>
        </form>

        {loading ? (
          <div className="timeline-loading">
            <div className="spin-loader" />
            <p>Reconstruyendo línea de tiempo...</p>
          </div>
        ) : error ? (
          <div className="timeline-error">
            <AlertCircle size={48} />
            <p>{error}</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="timeline-empty">
            <FileText size={64} className="empty-icon-faded" />
            <h2>No hay eventos</h2>
            <p>No se encontraron partidas en este rango de fechas.</p>
          </div>
        ) : (
          <div className="timeline-wrapper">
            {entries.map((entry, index) => (
              <TimelineEvent key={entry.id} entry={entry} index={index} />
            ))}
          </div>
        )}

      </div>
    </Layout>
  );
};

export default JournalEntries;
