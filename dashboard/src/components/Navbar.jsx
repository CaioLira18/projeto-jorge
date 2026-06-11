import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth, useCart } from '../pages/Index'

function Navbar() {
  const { user, logout } = useAuth()
  const { count, setOpen } = useCart()
  const nav = useNavigate()

  const handleLogout = () => { logout(); nav('/') }

  return (
    <nav className="navbar">
      <div className="container nav-inner">
        <Link to="/" className="nav-logo">Loja</Link>
        <div className="nav-links">
          <Link to="/" className="btn btn-ghost btn-sm">Produtos</Link>
          {user?.role === 'admin' && (
            <>
              <Link to="/admin/products/new" className="btn btn-ghost btn-sm">+ Produto</Link>
              <Link to="/admin/dashboard" className="btn btn-ghost btn-sm">Dashboard</Link>
            </>
          )}
          {user ? (
            <>
              <span className="text-muted hide-mobile">Olá, {user.email?.split('@')[0]}</span>
              <Link to="/orders" className="btn btn-ghost btn-sm">Pedidos</Link>
              <button onClick={handleLogout} className="btn btn-ghost btn-sm">Sair</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">Entrar</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Cadastrar</Link>
            </>
          )}
          <button className="btn btn-ghost btn-sm" onClick={() => setOpen(true)}>
            🛒 {count > 0 && <span className="text-accent">{count}</span>}
          </button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
