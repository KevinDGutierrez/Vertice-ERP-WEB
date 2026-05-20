import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import api from '../api/client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, FileText, Plus, Trash2, Save, 
  AlertCircle, CheckCircle2, ArrowRightLeft, AlignLeft, ShieldCheck
} from 'lucide-react';
import './NewEntry.css';

const NewEntry = () => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [type, setType] = useState('DIARIO');
  // Changed state to include explicit nature and a single amount field
  const [details, setDetails] = useState([{ accountId: '', nature: 'debit', amount: '' }]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const res = await api.get('/accounts');
      setAccounts(res.data);
    } catch (err) {
      console.error(err);
      setMessage({ text: 'Error al cargar cuentas', type: 'error' });
    }
  };

  const handleAddRow = () => {
    setDetails([...details, { accountId: '', nature: 'debit', amount: '' }]);
  };

  const handleRemoveRow = (index) => {
    if (details.length > 1) {
      setDetails(details.filter((_, i) => i !== index));
    }
  };

  const handleChange = (index, field, value) => {
    const newDetails = [...details];
    newDetails[index][field] = value;
    setDetails(newDetails);
    
    // Clear error for this specific row/field if it exists
    if (fieldErrors[`row_${index}`]) {
      const newErrors = { ...fieldErrors };
      delete newErrors[`row_${index}`];
      setFieldErrors(newErrors);
    }
  };

  const totalDebit = details.reduce((sum, d) => sum + (d.nature === 'debit' ? parseFloat(d.amount || 0) : 0), 0);
  const totalCredit = details.reduce((sum, d) => sum + (d.nature === 'credit' ? parseFloat(d.amount || 0) : 0), 0);
  const isBalanced = totalDebit > 0 && totalDebit === totalCredit;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Front-end Validations
    const errs = {};
    if (description.trim().length < 5) errs.description = 'La descripción debe tener al menos 5 caracteres.';
    
    let hasRowErrors = false;
    details.forEach((row, i) => {
      if (!row.accountId) {
        errs[`row_${i}`] = 'Selecciona una cuenta contable.';
        hasRowErrors = true;
      } else if (parseFloat(row.amount || 0) <= 0) {
        errs[`row_${i}`] = 'El monto debe ser mayor a 0.';
        hasRowErrors = true;
      }
    });

    if (!isBalanced) {
      errs.balance = 'La partida no está cuadrada.';
      const statusDiv = document.querySelector('.sum-status');
      if (statusDiv) {
        statusDiv.classList.add('shake');
        setTimeout(() => statusDiv.classList.remove('shake'), 400);
      }
    }

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      if (hasRowErrors || errs.description) {
        const form = document.querySelector('.ne-split-container');
        if (form) {
          form.classList.add('shake');
          setTimeout(() => form.classList.remove('shake'), 400);
        }
      }
      return;
    }
    
    setFieldErrors({});

    // Transform rows to match the backend expectation
    const formattedDetails = details.map(d => ({
      accountId: d.accountId,
      debit: d.nature === 'debit' ? parseFloat(d.amount || 0) : 0,
      credit: d.nature === 'credit' ? parseFloat(d.amount || 0) : 0
    }));

    setLoading(true);
    try {
      await api.post('/entries', { date, description, type, details: formattedDetails });
      setMessage({ text: 'Partida registrada con éxito', type: 'success' });
      // Reset
      setDescription('');
      setDetails([{ accountId: '', nature: 'debit', amount: '' }]);
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Error al guardar', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <form className="ne-split-container fade-in" onSubmit={handleSubmit}>
        
        {/* Left Pane: Meta Info */}
        <div className="ne-meta-pane">
          <div className="ne-meta-header">
            <div className="ne-icon-box">
              <Plus size={32} />
            </div>
            <h1>Crear Partida</h1>
            <p>Define la configuración general del nuevo registro contable.</p>
          </div>

          <div className="ne-form-stack">
            <div className="ne-input-group">
              <label><Calendar size={14} /> Fecha de Operación</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} required />
            </div>

            <div className="ne-input-group">
              <label><ShieldCheck size={14} /> Tipo de Partida</label>
              <div className="ne-type-selector">
                {['DIARIO', 'APERTURA', 'AJUSTE', 'CIERRE'].map(t => (
                  <button 
                    key={t}
                    type="button"
                    className={`type-btn ${type === t ? 'active' : ''}`}
                    onClick={() => setType(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="ne-input-group">
              <label><AlignLeft size={14} /> Concepto / Descripción</label>
              <textarea 
                className={fieldErrors.description ? 'input-error' : ''}
                placeholder="Ej. Pago de planilla mes de mayo..." 
                value={description} 
                onChange={e => { setDescription(e.target.value); setFieldErrors({...fieldErrors, description: null}); }} 
              />
              {fieldErrors.description && <span className="field-error-text"><AlertCircle size={12}/> {fieldErrors.description}</span>}
            </div>
          </div>

          <div className="ne-balance-summary">
            <div className="sum-row">
              <span>Total Debe</span>
              <strong>Q{totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
            </div>
            <div className="sum-row">
              <span>Total Haber</span>
              <strong>Q{totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
            </div>
            <div className={`sum-status ${isBalanced ? 'ok' : 'err'}`}>
              {isBalanced ? (
                <><CheckCircle2 size={16} /> Cuadrada</>
              ) : (
                <><AlertCircle size={16} /> Descuadrada (Dif: Q{Math.abs(totalDebit - totalCredit).toLocaleString()})</>
              )}
            </div>
            {fieldErrors.balance && <span className="field-error-text" style={{marginTop: '8px'}}><AlertCircle size={12}/> {fieldErrors.balance}</span>}
          </div>

          <button type="submit" className="ne-save-btn" disabled={loading || !isBalanced}>
            {loading ? <div className="btn-spinner" /> : <><Save size={20} /> Registrar Partida</>}
          </button>

          <AnimatePresence>
            {message.text && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className={`ne-alert ${message.type}`}
              >
                {message.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
                {message.text}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Pane: Movements Builder */}
        <div className="ne-builder-pane">
          <div className="builder-header sticky-header">
            <h2>Movimientos</h2>
            <button type="button" className="ne-add-btn" onClick={handleAddRow}>
              <Plus size={16} /> Agregar Fila
            </button>
          </div>

          <div className="builder-canvas">
            <AnimatePresence>
              {details.map((row, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20, height: 0 }}
                  className={`movement-card ${fieldErrors[`row_${index}`] ? 'row-error' : ''}`}
                >
                  <div className="mc-header">
                    <span className="mc-num">0{index + 1}</span>
                    <button type="button" className="mc-del" onClick={() => handleRemoveRow(index)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                  
                  <div className="mc-body">
                    <div className="mc-field flex-2">
                      <label>Cuenta Contable</label>
                      <select 
                        className={fieldErrors[`row_${index}`] && !row.accountId ? 'input-error' : ''}
                        value={row.accountId} 
                        onChange={e => handleChange(index, 'accountId', e.target.value)} 
                      >
                        <option value="">-- Buscar cuenta --</option>
                        {accounts.map(acc => (
                          <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                        ))}
                      </select>
                      {fieldErrors[`row_${index}`] && !row.accountId && <span className="field-error-text"><AlertCircle size={12}/> Requerido</span>}
                    </div>

                    <div className="mc-field">
                      <label>Naturaleza</label>
                      <div className="mc-toggle">
                        <button 
                          type="button" 
                          className={`tg-btn ${row.nature === 'debit' ? 'active' : ''}`}
                          onClick={() => handleChange(index, 'nature', 'debit')}
                        >
                          Debe
                        </button>
                        <button 
                          type="button" 
                          className={`tg-btn ${row.nature === 'credit' ? 'active' : ''}`}
                          onClick={() => handleChange(index, 'nature', 'credit')}
                        >
                          Haber
                        </button>
                      </div>
                    </div>

                    <div className="mc-field flex-1">
                      <label>Monto (Q)</label>
                      <input 
                        className={fieldErrors[`row_${index}`] && parseFloat(row.amount||0) <= 0 ? 'input-error' : ''}
                        type="number" 
                        min="0" 
                        step="0.01" 
                        placeholder="0.00"
                        value={row.amount}
                        onChange={e => handleChange(index, 'amount', e.target.value)}
                      />
                      {fieldErrors[`row_${index}`] && parseFloat(row.amount||0) <= 0 && <span className="field-error-text"><AlertCircle size={12}/> Inválido</span>}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

      </form>
    </Layout>
  );
};

export default NewEntry;
