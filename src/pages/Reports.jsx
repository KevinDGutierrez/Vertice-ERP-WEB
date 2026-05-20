import React, { useState } from 'react';
import Layout from '../components/layout/Layout';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, Calendar, Download, Filter, 
  FileText, ArrowRight, Activity, PieChart,
  Scale, AlertCircle
} from 'lucide-react';
import api from '../api/client';
import html2pdf from 'html2pdf.js';
import './Reports.css';

const formatQ = (val) => `Q${(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const reportTypes = [
  { id: 'comprobacion', endpoint: '/entries/trial-balance', name: 'Balance de Comprobación', icon: Scale, desc: 'Verifica la igualdad de débitos y créditos.' },
  { id: 'resultados', endpoint: '/entries/profit-loss', name: 'Estado de Resultados', icon: Activity, desc: 'Analiza ingresos, costos y gastos del periodo.' },
  { id: 'general', endpoint: '/entries/balance-sheet', name: 'Balance General', icon: PieChart, desc: 'Estado de situación financiera (Activos, Pasivos, Capital).' },
  { id: 'ajustado', endpoint: '/entries/adjusted-trial-balance', name: 'Balance de Saldos Ajustado', icon: FileText, desc: 'Balance post-ajustes contables.' }
];

const Reports = () => {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  
  const [selectedReport, setSelectedReport] = useState('comprobacion');
  const [startDate, setStartDate] = useState(firstDay.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);
  const [generating, setGenerating] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [error, setError] = useState(null);

  const getReportConfig = () => reportTypes.find(r => r.id === selectedReport);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setGenerating(true);
    setReportData(null);
    setError(null);
    
    try {
      const config = getReportConfig();
      const res = await api.get(config.endpoint, {
        params: { startDate, endDate }
      });
      // Attach generated timestamp to the response data
      setReportData({ ...res.data, generatedAt: new Date().toISOString() });
    } catch (err) {
      setError(err.response?.data?.message || 'Error al generar el reporte.');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadPDF = () => {
    const element = document.getElementById('report-content');
    if (!element) return;
    
    const config = getReportConfig();
    const opt = {
      margin:       0.5,
      filename:     `${config.name.replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
    };
    
    html2pdf().set(opt).from(element).save();
  };

  const renderComprobacion = (data) => (
    <table className="doc-table">
      <thead>
        <tr>
          <th>Código</th>
          <th>Cuenta</th>
          <th className="num">Deudor</th>
          <th className="num">Acreedor</th>
        </tr>
      </thead>
      <tbody>
        {data.accounts.map((a, i) => (
          <tr key={i}>
            <td>{a.code}</td>
            <td>{a.name}</td>
            <td className="num">{a.type === 'DEUDOR' ? formatQ(Math.abs(a.balance)) : '-'}</td>
            <td className="num">{a.type === 'ACREEDOR' ? formatQ(Math.abs(a.balance)) : '-'}</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr>
          <td colSpan="2"><strong>Sumas Iguales</strong></td>
          <td className="num total"><strong>{formatQ(data.totals?.debe)}</strong></td>
          <td className="num total"><strong>{formatQ(data.totals?.haber)}</strong></td>
        </tr>
      </tfoot>
    </table>
  );

  const renderResultados = (data) => (
    <table className="doc-table">
      <tbody>
        <tr className="section-title"><td colSpan="2" style={{fontWeight: 800, color: 'var(--vf-accent)', paddingTop: '20px'}}>Ingresos Operativos</td></tr>
        <tr><td>Total Ingresos</td><td className="num">{formatQ(data.resumen?.totalIngresos)}</td></tr>
        
        <tr className="section-title"><td colSpan="2" style={{fontWeight: 800, color: 'var(--vf-accent)', paddingTop: '20px'}}>Costos de Ventas</td></tr>
        <tr><td>Total Costos</td><td className="num">{formatQ(data.resumen?.totalCostos)}</td></tr>
        
        <tr className="subtotal" style={{background: 'var(--vf-bg)', fontWeight: 700}}>
          <td>Utilidad Bruta</td>
          <td className="num">{formatQ(data.resumen?.utilidadBruta)}</td>
        </tr>
        
        <tr className="section-title"><td colSpan="2" style={{fontWeight: 800, color: 'var(--vf-accent)', paddingTop: '20px'}}>Gastos Operativos</td></tr>
        <tr><td>Total Gastos</td><td className="num">{formatQ(data.resumen?.totalGastos)}</td></tr>
      </tbody>
      <tfoot>
        <tr>
          <td><strong>Utilidad Neta del Ejercicio</strong></td>
          <td className="num total">
            <strong>{formatQ(data.resumen?.utilidadNeta)}</strong>
          </td>
        </tr>
      </tfoot>
    </table>
  );

  const renderGeneral = (data) => (
    <div className="balance-general-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
      <div className="bg-col">
        <h3 style={{ color: 'var(--vf-accent)', borderBottom: '2px solid var(--vf-line)', paddingBottom: '8px', marginBottom: '16px' }}>Activos</h3>
        <table className="doc-table no-header">
          <tbody>
            {data.activos?.map((a, i) => (
              <tr key={i}>
                <td>{a.name}</td>
                <td className="num">{formatQ(Math.abs(a.balance))}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td>Total Activos</td>
              <td className="num total">{formatQ(data.totales?.activo)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      
      <div className="bg-col">
        <h3 style={{ color: 'var(--vf-accent)', borderBottom: '2px solid var(--vf-line)', paddingBottom: '8px', marginBottom: '16px' }}>Pasivos</h3>
        <table className="doc-table no-header">
          <tbody>
            {data.pasivos?.map((a, i) => (
              <tr key={i}>
                <td>{a.name}</td>
                <td className="num">{formatQ(Math.abs(a.balance))}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td>Total Pasivos</td>
              <td className="num total">{formatQ(data.totales?.pasivo)}</td>
            </tr>
          </tfoot>
        </table>
        
        <h3 style={{ color: 'var(--vf-accent)', borderBottom: '2px solid var(--vf-line)', paddingBottom: '8px', marginBottom: '16px', marginTop: '32px' }}>Patrimonio</h3>
        <table className="doc-table no-header">
          <tbody>
            {data.patrimonio?.map((a, i) => (
              <tr key={i}>
                <td>{a.name}</td>
                <td className="num">{formatQ(Math.abs(a.balance))}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td>Total Pasivo + Patrimonio</td>
              <td className="num total">{formatQ(data.totales?.patrimonio)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );

  const renderDocumentBody = () => {
    if (selectedReport === 'comprobacion' || selectedReport === 'ajustado') {
      return renderComprobacion(reportData);
    } else if (selectedReport === 'resultados') {
      return renderResultados(reportData);
    } else if (selectedReport === 'general') {
      return renderGeneral(reportData);
    }
    return null;
  };

  return (
    <Layout>
      <div className="reports-container fade-in">
        
        {/* Left Sidebar: Report Selection */}
        <div className="reports-sidebar">
          <div className="rs-header">
            <div className="rs-icon-wrap">
              <BarChart3 size={28} />
            </div>
            <h2>Centro de Reportes</h2>
            <p>Genera estados financieros y balances contables detallados.</p>
          </div>

          <div className="rs-menu">
            {reportTypes.map(report => {
              const Icon = report.icon;
              const isActive = selectedReport === report.id;
              return (
                <button 
                  key={report.id}
                  className={`rs-menu-item ${isActive ? 'active' : ''}`}
                  onClick={() => { setSelectedReport(report.id); setReportData(null); }}
                >
                  <div className="rs-item-icon">
                    <Icon size={20} />
                  </div>
                  <div className="rs-item-text">
                    <strong>{report.name}</strong>
                    <span>{report.desc}</span>
                  </div>
                  {isActive && <ArrowRight size={16} className="rs-item-arrow" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Pane: Report Viewer & Controls */}
        <div className="reports-viewer">
          
          <form className="rv-controls-card" onSubmit={handleGenerate}>
            <div className="rv-filters">
              <div className="rv-group">
                <label><Calendar size={14} /> Fecha Inicio</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
              </div>
              <div className="rv-group">
                <label><Calendar size={14} /> Fecha Fin</label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required />
              </div>
              <button type="submit" className="rv-btn-generate" disabled={generating}>
                {generating ? <div className="btn-spinner" /> : <><Filter size={18} /> Generar Reporte</>}
              </button>
            </div>
          </form>

          <div className="rv-document-area">
            {generating ? (
              <div className="rv-loading">
                <div className="spin-loader lg" />
                <p>Calculando saldos y contactando servidor...</p>
              </div>
            ) : error ? (
              <div className="rv-error" style={{ textAlign: 'center', color: 'var(--vf-danger)', padding: '40px' }}>
                <AlertCircle size={48} style={{ margin: '0 auto 16px', opacity: 0.8 }} />
                <h3>Error de Generación</h3>
                <p>{error}</p>
              </div>
            ) : !reportData ? (
              <div className="rv-empty">
                <FileText size={80} strokeWidth={1} className="empty-icon-faded" />
                <h2>{getReportConfig()?.name}</h2>
                <p>Selecciona un rango de fechas y presiona "Generar Reporte" para descargar los saldos reales de tu empresa.</p>
              </div>
            ) : (
              <motion.div 
                className="rv-document paper-shadow"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {/* The section we will capture as PDF */}
                <div id="report-content" style={{ padding: '20px', background: 'white' }}>
                  <div className="doc-header">
                    <div className="doc-brand">
                      <div className="doc-logo" />
                      <div className="doc-company">
                        <h2>Vértice Fashion</h2>
                        <p>NIT: 1234567-8</p>
                      </div>
                    </div>
                    <div className="doc-meta">
                      <h1>{getReportConfig()?.name}</h1>
                      <p>Del {new Date(startDate).toLocaleDateString('es-GT')} al {new Date(endDate).toLocaleDateString('es-GT')}</p>
                      <span className="doc-timestamp">Generado: {new Date(reportData.generatedAt).toLocaleString('es-GT')}</span>
                    </div>
                  </div>

                  <div className="doc-body">
                    {renderDocumentBody()}
                  </div>
                </div>

                <div className="doc-actions" style={{ marginTop: '20px' }}>
                  <button className="doc-btn-download" onClick={handleDownloadPDF}>
                    <Download size={18} /> Descargar PDF
                  </button>
                </div>
              </motion.div>
            )}
          </div>

        </div>
      </div>
    </Layout>
  );
};

export default Reports;
