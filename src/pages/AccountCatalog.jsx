import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import api from '../api/client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Folder, FolderOpen, FileText, Search, Plus, 
  ChevronRight, ChevronDown, Activity, DollarSign,
  TrendingUp, TrendingDown, Hash, PieChart, X, Save,
  AlertCircle, ArrowRight
} from 'lucide-react';
import './AccountCatalog.css';

const TreeNode = ({ account, allAccounts, onSelect, selectedId, level = 0 }) => {
  const children = allAccounts.filter(a => a.parentId === account.id);
  const isExpandable = children.length > 0;
  const [expanded, setExpanded] = useState(level < 2);

  const isSelected = selectedId === account.id;

  return (
    <div className="tree-node-wrapper">
      <div 
        className={`tree-node level-${level} ${isSelected ? 'selected' : ''}`}
        onClick={() => {
          if (isExpandable) setExpanded(!expanded);
          onSelect(account);
        }}
        style={{ paddingLeft: `${level * 16 + 12}px` }}
      >
        <div className="node-icon">
          {isExpandable ? (
            expanded ? <FolderOpen size={16} className="text-folder" /> : <Folder size={16} className="text-folder" />
          ) : (
            <FileText size={16} className="text-file" />
          )}
        </div>
        <div className="node-content">
          <span className="node-code">{account.code}</span>
          <span className="node-name">{account.name}</span>
        </div>
        {isExpandable && (
          <div className="node-chevron">
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </div>
        )}
      </div>
      
      <AnimatePresence>
        {expanded && isExpandable && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="tree-children"
          >
            {children.map(child => (
              <TreeNode 
                key={child.id} 
                account={child} 
                allAccounts={allAccounts} 
                onSelect={onSelect} 
                selectedId={selectedId} 
                level={level + 1} 
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const AccountCatalog = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAccount, setSelectedAccount] = useState(null);
  
  // Side Drawer State (Replaces old modal)
  const [showDrawer, setShowDrawer] = useState(false);
  const [newAcc, setNewAcc] = useState({ code: '', name: '', type: 'ACTIVO', nature: 'DEUDORA', parentId: '' });
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [drawerError, setDrawerError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/accounts');
      setAccounts(res.data);
      if (res.data.length > 0 && !selectedAccount) {
        setSelectedAccount(res.data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    
    // Frontend Validation
    const errs = {};
    if (newAcc.name.trim().length < 3) errs.name = 'Debe tener al menos 3 caracteres.';
    if (!newAcc.type) errs.type = 'Selecciona un tipo.';
    if (!newAcc.nature) errs.nature = 'Selecciona una naturaleza.';
    
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      const form = document.getElementById('create-account-form');
      if (form) {
        form.classList.add('shake');
        setTimeout(() => form.classList.remove('shake'), 400);
      }
      return;
    }
    
    setFieldErrors({});
    setDrawerLoading(true);
    setDrawerError('');
    try {
      const payload = { ...newAcc };
      if (!payload.parentId) delete payload.parentId;
      
      await api.post('/accounts', payload);
      await fetchAccounts();
      setShowDrawer(false);
      setNewAcc({ code: '', name: '', type: 'ACTIVO', nature: 'DEUDORA', parentId: '' });
    } catch (err) {
      setDrawerError(err.response?.data?.message || 'Error al crear la cuenta');
    } finally {
      setDrawerLoading(false);
    }
  };

  const filteredAccounts = accounts.filter(acc => 
    (acc?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (acc?.code || '').includes(searchQuery)
  );

  const rootAccounts = filteredAccounts.filter(acc => !acc.parentId || !filteredAccounts.find(p => p.id === acc.parentId));

  const getNatureBadge = (nature) => {
    if (nature === 'DEUDORA') return <span className="cat-badge deudora">Deudora</span>;
    if (nature === 'ACREEDORA') return <span className="cat-badge acreedora">Acreedora</span>;
    return <span className="cat-badge default">{nature}</span>;
  };

  const getTypeBadge = (type) => {
    const classes = {
      'ACTIVO': 'activo',
      'PASIVO': 'pasivo',
      'PATRIMONIO': 'patrimonio',
      'CAPITAL': 'capital',
      'INGRESO': 'ingreso',
      'GASTO': 'gasto'
    };
    return <span className={`cat-badge ${classes[type] || 'default'}`}>{type}</span>;
  };

  return (
    <Layout>
      <div className="catalog-split-pane fade-in">
        
        {/* Left Side: Tree Explorer */}
        <div className="catalog-sidebar">
          <div className="sidebar-header">
            <h2>Explorador de Cuentas</h2>
            <button className="add-acc-btn" onClick={() => setShowDrawer(true)}>
              <Plus size={18} />
            </button>
          </div>
          
          <div className="sidebar-search">
            <Search size={16} />
            <input 
              type="text" 
              placeholder="Buscar código o nombre..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="tree-container">
            {loading ? (
              <div className="tree-loading">
                <div className="spin-loader" />
                <span>Cargando árbol...</span>
              </div>
            ) : rootAccounts.length > 0 ? (
              rootAccounts.map(root => (
                <TreeNode 
                  key={root.id}
                  account={root}
                  allAccounts={filteredAccounts}
                  onSelect={setSelectedAccount}
                  selectedId={selectedAccount?.id}
                />
              ))
            ) : (
              <div className="tree-empty">No se encontraron cuentas</div>
            )}
          </div>
        </div>

        {/* Right Side: Detail View */}
        <div className="catalog-detail-pane">
          {selectedAccount ? (
            <motion.div 
              key={selectedAccount.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="detail-content"
            >
              <div className="detail-header-card">
                <div className="detail-icon-wrap">
                  <PieChart size={32} />
                </div>
                <div className="detail-title-group">
                  <div className="detail-code">{selectedAccount.code}</div>
                  <h1>{selectedAccount.name}</h1>
                  <div className="detail-tags">
                    {getTypeBadge(selectedAccount.type)}
                    {getNatureBadge(selectedAccount.nature)}
                  </div>
                </div>
              </div>

              <div className="detail-metrics-grid">
                <div className="metric-box">
                  <div className="metric-icon"><DollarSign size={20} /></div>
                  <div className="metric-info">
                    <span className="metric-lbl">Saldo Actual</span>
                    <span className="metric-val">
                      Q{(selectedAccount.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
                <div className="metric-box">
                  <div className="metric-icon blue"><Activity size={20} /></div>
                  <div className="metric-info">
                    <span className="metric-lbl">Nivel Jerárquico</span>
                    <span className="metric-val text">{selectedAccount.parentId ? 'Subcuenta' : 'Cuenta Mayor'}</span>
                  </div>
                </div>
                <div className="metric-box">
                  <div className="metric-icon purple"><Hash size={20} /></div>
                  <div className="metric-info">
                    <span className="metric-lbl">ID Interno</span>
                    <span className="metric-val text small">{selectedAccount.id}</span>
                  </div>
                </div>
              </div>

              <div className="detail-actions-card">
                <h3>Acciones Rápidas</h3>
                <div className="action-buttons-grid">
                  <button className="grid-action-btn" onClick={() => window.location.href='/ledger'}>
                    <TrendingUp size={20} />
                    <span>Ver en Libro Mayor</span>
                  </button>
                  <button className="grid-action-btn" onClick={() => window.location.href='/new-entry'}>
                    <Plus size={20} />
                    <span>Usar en Partida</span>
                  </button>
                  <button className="grid-action-btn warning">
                    <TrendingDown size={20} />
                    <span>Ajuste Contable</span>
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="detail-empty-state">
              <FolderOpen size={64} className="empty-icon-faded" />
              <h2>Selecciona una cuenta</h2>
              <p>Haz clic en cualquier cuenta del árbol izquierdo para visualizar sus detalles y métricas.</p>
            </div>
          )}
        </div>

      </div>

      {/* CREATE ACCOUNT SIDE DRAWER (Redesign from Modal) */}
      <AnimatePresence>
        {showDrawer && (
          <>
            <motion.div 
              className="drawer-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDrawer(false)}
            />
            <motion.div 
              className="side-drawer"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
              <div className="drawer-header">
                <div>
                  <h2>Añadir Cuenta</h2>
                  <p>Registra una nueva cuenta en el catálogo general.</p>
                </div>
                <button type="button" onClick={() => setShowDrawer(false)} className="close-drawer">
                  <ArrowRight size={24} />
                </button>
              </div>
              
              <div className="drawer-body">
                <form id="create-account-form" onSubmit={handleCreateAccount} className="drawer-form">
                  
                  {drawerError && (
                    <div className="drawer-error">
                      <AlertCircle size={16} />
                      {drawerError}
                    </div>
                  )}

                  <div className="drawer-field">
                    <label>Código Contable</label>
                    <input 
                      type="text" 
                      placeholder="Ej. 1.1.1.01 (Opcional, se genera auto)" 
                      value={newAcc.code} 
                      onChange={e => { setNewAcc({...newAcc, code: e.target.value}); setFieldErrors({...fieldErrors, code: null}) }} 
                    />
                  </div>

                  <div className="drawer-field">
                    <label>Nombre de la Cuenta</label>
                    <input 
                      type="text" 
                      className={fieldErrors.name ? 'input-error' : ''}
                      placeholder="Ej. Caja Chica" 
                      value={newAcc.name} 
                      onChange={e => { setNewAcc({...newAcc, name: e.target.value}); setFieldErrors({...fieldErrors, name: null}) }} 
                    />
                    {fieldErrors.name && <span className="field-error-text"><AlertCircle size={12}/> {fieldErrors.name}</span>}
                  </div>

                  <div className="drawer-row">
                    <div className="drawer-field">
                      <label>Tipo</label>
                      <div className="drawer-select-wrap">
                        <select className={fieldErrors.type ? 'input-error' : ''} value={newAcc.type} onChange={e => { setNewAcc({...newAcc, type: e.target.value}); setFieldErrors({...fieldErrors, type: null}) }}>
                          <option value="ACTIVO">Activo</option>
                          <option value="PASIVO">Pasivo</option>
                          <option value="PATRIMONIO">Patrimonio</option>
                          <option value="CAPITAL">Capital</option>
                          <option value="INGRESO">Ingreso</option>
                          <option value="GASTO">Gasto</option>
                        </select>
                        <ChevronDown size={14} className="sel-icon"/>
                      </div>
                    </div>
                    <div className="drawer-field">
                      <label>Naturaleza</label>
                      <div className="drawer-select-wrap">
                        <select className={fieldErrors.nature ? 'input-error' : ''} value={newAcc.nature} onChange={e => { setNewAcc({...newAcc, nature: e.target.value}); setFieldErrors({...fieldErrors, nature: null}) }}>
                          <option value="DEUDORA">Deudora</option>
                          <option value="ACREEDORA">Acreedora</option>
                        </select>
                        <ChevronDown size={14} className="sel-icon"/>
                      </div>
                    </div>
                  </div>

                  <div className="drawer-field">
                    <label>Dependencia (Cuenta Padre)</label>
                    <div className="drawer-select-wrap">
                      <select value={newAcc.parentId} onChange={e => setNewAcc({...newAcc, parentId: e.target.value})}>
                        <option value="">-- Cuenta Mayor (Ninguna) --</option>
                        {accounts.map(a => (
                          <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="sel-icon"/>
                    </div>
                  </div>

                </form>
              </div>

              <div className="drawer-footer">
                <button type="button" className="btn-cancel-drawer" onClick={() => setShowDrawer(false)}>Cancelar</button>
                <button type="submit" form="create-account-form" className="btn-save-drawer" disabled={drawerLoading}>
                  {drawerLoading ? <div className="btn-spinner"/> : <><Save size={18}/> Confirmar y Guardar</>}
                </button>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>
    </Layout>
  );
};

export default AccountCatalog;
