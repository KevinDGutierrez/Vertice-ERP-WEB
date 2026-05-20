import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, ArrowRight, LockKeyhole, Mail, Hexagon, BarChart3, TrendingUp, Shield } from 'lucide-react';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch {
      setError('Correo o contraseña inválidos. Verifica tus datos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-split">
      
      {/* LEFT: Immersive Hero Panel */}
      <div className="login-hero">
        <div className="hero-gradient-overlay" />
        
        {/* Animated floating shapes */}
        <div className="hero-shape shape-1" />
        <div className="hero-shape shape-2" />
        <div className="hero-shape shape-3" />
        
        <div className="hero-content">
          <motion.div 
            className="hero-logo-ring"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, type: 'spring', stiffness: 100 }}
          >
            <Hexagon size={48} strokeWidth={1.5} />
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            VÉRTICE<br/>FASHION
          </motion.h1>
          
          <motion.p 
            className="hero-subtitle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            Sistema de Gestión Contable Empresarial
          </motion.p>

          <motion.div 
            className="hero-features"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <div className="hero-feature">
              <div className="feature-icon"><BarChart3 size={20} /></div>
              <div>
                <strong>Análisis en Tiempo Real</strong>
                <span>Visualiza la salud financiera al instante</span>
              </div>
            </div>
            <div className="hero-feature">
              <div className="feature-icon"><TrendingUp size={20} /></div>
              <div>
                <strong>Control Total</strong>
                <span>Libro diario, mayor y catálogo integrados</span>
              </div>
            </div>
            <div className="hero-feature">
              <div className="feature-icon"><Shield size={20} /></div>
              <div>
                <strong>Seguridad Avanzada</strong>
                <span>Autenticación cifrada y roles de acceso</span>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="hero-footer">
          <span>© {new Date().getFullYear()} Vértice Fashion — Todos los derechos reservados</span>
        </div>
      </div>

      {/* RIGHT: Clean Form Panel */}
      <div className="login-form-panel">
        <motion.div 
          className="form-container"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="form-welcome">
            <h2>Bienvenido</h2>
            <p>Ingresa tus credenciales para acceder al panel de control</p>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div 
                className="login-error-bar"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <AlertCircle size={18} />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="login-form-stack">
            <div className="login-field">
              <label htmlFor="login-email">Correo Electrónico</label>
              <div className="field-input-wrap">
                <Mail size={18} className="field-icon" />
                <input 
                  id="login-email"
                  type="email" 
                  placeholder="tu@email.com" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  required 
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="login-field">
              <label htmlFor="login-password">Contraseña</label>
              <div className="field-input-wrap">
                <LockKeyhole size={18} className="field-icon" />
                <input 
                  id="login-password"
                  type="password" 
                  placeholder="••••••••" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  required 
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button type="submit" className="login-submit-btn" disabled={loading}>
              {loading ? (
                <div className="login-btn-spinner" />
              ) : (
                <>Ingresar al Sistema <ArrowRight size={20} /></>
              )}
            </button>
          </form>

          <div className="login-form-footer">
            <p>Plataforma protegida con autenticación Firebase</p>
          </div>
        </motion.div>
      </div>

    </div>
  );
};

export default Login;
