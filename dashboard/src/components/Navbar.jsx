import React, { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth, useCart } from '../pages/Index'

function Navbar() {
  const { user, logout } = useAuth()
  const { count, setOpen } = useCart()
  const nav = useNavigate()
  const [adminOpen, setAdminOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const adminRef = useRef(null)
  const userRef = useRef(null)

  // Fecha ao clicar fora
  useEffect(() => {
    const handler = (e) => {
      if (adminRef.current && !adminRef.current.contains(e.target)) setAdminOpen(false)
      if (userRef.current && !userRef.current.contains(e.target)) setUserOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = () => {
    logout()
    setUserOpen(false)
    nav('/')
  }

  const initials = user?.email?.split('@')[0]?.slice(0, 2).toUpperCase()

  return (
    <nav className="navbar">
      <div className="container nav-inner">

        {/* Logo */}
        <Link to="/" className="nav-logo">E-Commerce</Link>

        {/* Links centrais */}
        <div className="nav-links">
          <Link to="/produtos" className="btn btn-ghost btn-sm">Produtos</Link>

          {/* Carrinho */}
          <Link to="/cart" className="btn btn-ghost btn-sm nav-cart-btn" onClick={() => setOpen(true)}>
            Carrinho
              {count > 0 && <span className="nav-cart-badge">{count}</span>}
          </Link>
        </div>

        {/* Lado direito */}
        <div className="nav-right">
          {user ? (
            <>
              {/* Admin dropdown */}
              {user.role === 'admin' && (
                <div className="nav-dropdown" ref={adminRef}>
                  <button
                    className="btn btn-ghost btn-sm nav-admin-btn"
                    onClick={() => { setAdminOpen(o => !o); setUserOpen(false) }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                    </svg>
                    Admin
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"
                      fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                      style={{ transition: 'transform .2s', transform: adminOpen ? 'rotate(180deg)' : 'none' }}>
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>

                  {adminOpen && (
                    <div className="nav-dropdown-menu">
                      <div className="nav-dropdown-header">
                        <span>Painel Admin</span>
                      </div>
                      <Link to="/admin/produtos" className="nav-dropdown-item" onClick={() => setAdminOpen(false)}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
                          fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Gerenciar produtos
                      </Link>
                      <Link to="/admin/dashboard" className="nav-dropdown-item" onClick={() => setAdminOpen(false)}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
                          fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                          <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                        </svg>
                        Dashboard
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {/* User avatar dropdown */}
              <div className="nav-dropdown" ref={userRef}>
                <button
                  className="nav-avatar-btn"
                  onClick={() => { setUserOpen(o => !o); setAdminOpen(false) }}
                  title={user.email}
                >
                  <span className="nav-avatar">{initials}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    style={{ transition: 'transform .2s', transform: userOpen ? 'rotate(180deg)' : 'none' }}>
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {userOpen && (
                  <div className="nav-dropdown-menu nav-dropdown-menu--right">
                    <div className="nav-dropdown-header">
                      <span className="nav-dropdown-email">{user.email}</span>
                      {user.role === 'admin' && <span className="nav-dropdown-role">Admin</span>}
                    </div>
                    <Link to={`/orders/${user.userId}`} className="nav-dropdown-item" onClick={() => setUserOpen(false)}>
                      <i class="fa-regular fa-file-lines"></i>
                      Meus pedidos
                    </Link>
                    <div className="nav-dropdown-divider" />
                    <button className="nav-dropdown-item nav-dropdown-item--danger" onClick={handleLogout}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
                        fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                      Sair
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <Link to="/login" className="btn btn-ghost btn-sm">Entrar</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Cadastrar</Link>
            </div>
          )}
        </div>

      </div>

      <style>{`
        .nav-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .nav-cart-btn {
          position: relative;
        }

        .nav-cart-badge {
          position: absolute;
          top: -6px;
          right: -6px;
          background: var(--accent);
          color: #0c0c0f;
          font-size: 10px;
          font-weight: 700;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .nav-admin-btn {
          border-color: var(--accent-dim);
          color: var(--accent);
        }

        .nav-dropdown {
          position: relative;
        }

        .nav-dropdown-menu {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          min-width: 200px;
          z-index: 300;
          box-shadow: 0 8px 32px rgba(0,0,0,.4);
          animation: dropIn .15s ease;
          overflow: hidden;
        }

        .nav-dropdown-menu--right {
          left: auto;
          right: 0;
        }

        @keyframes dropIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: none; }
        }

        .nav-dropdown-header {
          padding: 12px 16px;
          border-bottom: 1px solid var(--border);
          font-size: 12px;
          color: var(--muted);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .nav-dropdown-email {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .nav-dropdown-role {
          background: var(--accent-dim);
          color: var(--accent);
          font-size: 10px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 99px;
          flex-shrink: 0;
        }

        .nav-dropdown-item {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 11px 16px;
          font-size: 14px;
          color: var(--text);
          background: none;
          border: none;
          text-align: left;
          cursor: pointer;
          transition: background .12s;
          font-family: var(--font);
          text-decoration: none;
        }

        .nav-dropdown-item:hover {
          background: var(--surface2);
        }

        .nav-dropdown-item--danger {
          color: var(--danger);
        }

        .nav-dropdown-divider {
          height: 1px;
          background: var(--border);
          margin: 4px 0;
        }

        .nav-avatar-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 99px;
          padding: 4px 10px 4px 4px;
          cursor: pointer;
          transition: border-color .15s;
          color: var(--muted);
        }

        .nav-avatar-btn:hover {
          border-color: var(--accent);
        }

        .nav-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: var(--accent);
          color: #0c0c0f;
          font-size: 11px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
      `}</style>
    </nav>
  )
}

export default Navbar
