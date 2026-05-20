import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/layout/Layout';
import api from '../api/client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Search, Filter, AlertCircle, FileText, 
  ChevronRight, ArrowRightLeft, Banknote, History, Download
} from 'lucide-react';
import html2pdf from 'html2pdf.js';
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
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const [startDate, setStartDate] = useState(firstDay.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);
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

  const handleExportPDF = () => {
    // Build a formal document for PDF
    const totalDebe = entries.reduce((s, e) => s + (e.details || []).reduce((ss, d) => ss + (Number(d.debit) || 0), 0), 0);
    const totalHaber = entries.reduce((s, e) => s + (e.details || []).reduce((ss, d) => ss + (Number(d.credit) || 0), 0), 0);

    const rows = entries.map(entry => {
      const details = entry.details || [];
      return details.map((d, i) => `
        <tr>
          ${i === 0 ? `<td rowspan="${details.length}" style="vertical-align:top;font-weight:700;">${new Date(entry.date + 'T12:00:00').toLocaleDateString('es-GT')}</td>` : ''}
          ${i === 0 ? `<td rowspan="${details.length}" style="vertical-align:top;">${entry.entryNumber || '-'}</td>` : ''}
          <td>${d.accountCode || ''}</td>
          <td>${d.accountName || ''}</td>
          <td style="text-align:right;">${Number(d.debit) > 0 ? formatQ(d.debit) : ''}</td>
          <td style="text-align:right;">${Number(d.credit) > 0 ? formatQ(d.credit) : ''}</td>
        </tr>
      `).join('');
    }).join('');

    const html = `
      <div style="font-family:'Inter',sans-serif;padding:24px;color:#1e293b;">
        <div style="text-align:center;margin-bottom:24px;">
          <h2 style="margin:0;font-size:1.4rem;">Vértice Fashion</h2>
          <p style="margin:4px 0;color:#64748b;font-size:0.85rem;">NIT: 1234567-8</p>
          <h1 style="margin:12px 0 4px;font-size:1.6rem;">Libro Diario</h1>
          <p style="color:#64748b;font-size:0.85rem;">Del ${new Date(startDate).toLocaleDateString('es-GT')} al ${new Date(endDate).toLocaleDateString('es-GT')}</p>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:0.8rem;">
          <thead>
            <tr style="background:#f1f5f9;">
              <th style="padding:10px 8px;text-align:left;border-bottom:2px solid #e2e8f0;">Fecha</th>
              <th style="padding:10px 8px;text-align:left;border-bottom:2px solid #e2e8f0;">P. No.</th>
              <th style="padding:10px 8px;text-align:left;border-bottom:2px solid #e2e8f0;">Código</th>
              <th style="padding:10px 8px;text-align:left;border-bottom:2px solid #e2e8f0;">Cuenta</th>
              <th style="padding:10px 8px;text-align:right;border-bottom:2px solid #e2e8f0;">Debe</th>
              <th style="padding:10px 8px;text-align:right;border-bottom:2px solid #e2e8f0;">Haber</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
          <tfoot>
            <tr style="border-top:2px solid #1e293b;font-weight:800;">
              <td colspan="4" style="padding:10px 8px;">Sumas Iguales</td>
              <td style="padding:10px 8px;text-align:right;">${formatQ(totalDebe)}</td>
              <td style="padding:10px 8px;text-align:right;">${formatQ(totalHaber)}</td>
            </tr>
          </tfoot>
        </table>
        <p style="text-align:center;margin-top:24px;color:#94a3b8;font-size:0.75rem;">Generado: ${new Date().toLocaleString('es-GT')}</p>
      </div>
    `;

    const container = document.createElement('div');
    container.innerHTML = html;

    html2pdf().set({
      margin: 0.4,
      filename: `Libro_Diario_${startDate}_a_${endDate}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    }).from(container).save();
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
          {entries.length > 0 && (
            <button type="button" className="f-btn export" onClick={handleExportPDF}>
              <Download size={18} /> Exportar PDF
            </button>
          )}
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
