import React from 'react'
import { useCart, useAuth } from '../context'
import { useNavigate } from 'react-router-dom'

export default function Cart() {
  const { items, remove, setQty, total, count, open, setOpen } = useCart()
  const { user } = useAuth()
  const nav = useNavigate()

  if (!open) return null

  const goCheckout = () => {
    setOpen(false)
    if (!user) { nav('/login'); return }
    nav('/checkout')
  }

  return (
    <>
      <div className="cart-overlay" onClick={() => setOpen(false)} />
      <div className="cart-panel">
        <div className="cart-header">
          <strong>Carrinho ({count})</strong>
          <button className="btn btn-ghost btn-sm" onClick={() => setOpen(false)}>✕</button>
        </div>
        <div className="cart-body">
          {items.length === 0
            ? <p className="text-muted text-center mt-4">Carrinho vazio</p>
            : items.map(item => (
              <div className="cart-item" key={item.id}>
                <div style={{fontSize:28}}>📦</div>
                <div className="cart-item-info">
                  <div style={{fontWeight:600,fontSize:14}}>{item.name}</div>
                  <div className="text-accent" style={{fontWeight:700}}>
                    R$ {(item.price * item.qty).toFixed(2)}
                  </div>
                  <div className="cart-qty">
                    <button className="qty-btn" onClick={() => setQty(item.id, item.qty - 1)}>−</button>
                    <span style={{fontSize:14,minWidth:20,textAlign:'center'}}>{item.qty}</span>
                    <button className="qty-btn" onClick={() => setQty(item.id, item.qty + 1)}>+</button>
                    <button className="btn btn-sm" style={{background:'none',color:'var(--danger)'}}
                      onClick={() => remove(item.id)}>Remover</button>
                  </div>
                </div>
              </div>
            ))
          }
        </div>
        <div className="cart-footer">
          <div className="flex justify-between" style={{marginBottom:16}}>
            <span style={{fontWeight:500}}>Total</span>
            <span className="text-accent" style={{fontWeight:700,fontSize:20}}>
              R$ {total.toFixed(2)}
            </span>
          </div>
          <button className="btn btn-primary btn-block" disabled={items.length === 0}
            onClick={goCheckout}>
            Finalizar pedido
          </button>
        </div>
      </div>
    </>
  )
}

export default Cart
