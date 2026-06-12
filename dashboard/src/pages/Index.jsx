import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

// ─── Auth ─────────────────────────────────────────────────────────────
const AuthCtx = createContext()
export const useAuth = () => useContext(AuthCtx)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')) } catch { return null }
  })

  const login = (userData) => {
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
  }
  const logout = () => {
    localStorage.removeItem('user')
    setUser(null)
  }

  return <AuthCtx.Provider value={{ user, login, logout }}>{children}</AuthCtx.Provider>
}

// ─── Cart ─────────────────────────────────────────────────────────────
const CartCtx = createContext()
export const useCart = () => useContext(CartCtx)

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cart')) || [] } catch { return [] }
  })
  const [open, setOpen] = useState(false)

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items))
  }, [items])

  const add = (product) => setItems(prev => {
    const ex = prev.find(i => i.id === product.id)
    if (ex) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i)
    return [...prev, { ...product, qty: 1 }]
  })

  const remove = (id) => setItems(prev => prev.filter(i => i.id !== id))

  const setQty = (id, qty) => {
    if (qty < 1) return remove(id)
    setItems(prev => prev.map(i => i.id === id ? { ...i, qty } : i))
  }

  const clear = () => {
    setItems([])
    localStorage.removeItem('cart')
  }

  const total = items.reduce((s, i) => s + i.price * i.qty, 0)
  const count = items.reduce((s, i) => s + i.qty, 0)

  return (
    <CartCtx.Provider value={{ items, add, remove, setQty, clear, total, count, open, setOpen }}>
      {children}
    </CartCtx.Provider>
  )
}

// ─── Toast ────────────────────────────────────────────────────────────
const ToastCtx = createContext()
export const useToast = () => useContext(ToastCtx)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const toast = useCallback((msg, type = 'success') => {
    const id = Date.now()
    setToasts(p => [...p, { id, msg, type }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500)
  }, [])

  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}>{t.msg}</div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}
