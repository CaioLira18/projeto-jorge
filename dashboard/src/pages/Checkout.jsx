import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart, useAuth, useToast } from './Index'
import { api } from '../utils/api'

const pixLogo = <i className="fa-brands fa-pix"></i>
const cartaoLogo = <i className="fa-solid fa-credit-card"></i>
const boletoLogo = <i className="fa-regular fa-file-lines"></i>

const PAYMENT_METHODS = [
  { id: 'credit', label: 'Cartão de crédito', icon: cartaoLogo },
  { id: 'pix',    label: 'Pix',               icon: pixLogo },
  { id: 'boleto', label: 'Boleto',             icon: boletoLogo },
]

export default function Checkout() {
  const { items, total, clear } = useCart()
  const { user } = useAuth()
  const toast = useToast()
  const nav = useNavigate()

  const [payment, setPayment] = useState('pix')
  const [loading, setLoading] = useState(false)

  // ✅ CORRIGIDO: navegação dentro do useEffect, não durante o render
  useEffect(() => {
    if (items.length === 0) {
      nav('/')
    }
  }, [items.length])

  if (items.length === 0) return null

  const handleConfirm = async () => {
    setLoading(true)
    try {
      const body = {
        items: items.map(i => ({ productId: i.id, quantity: i.qty })),
        paymentMethod: payment,
      }
      const result = await api.createOrder(body, user.token)
      nav(`/receipt/${result.id}`)
      toast('Pedido realizado com sucesso!')
      clear()
    } catch (err) {
      toast(err.message || 'Erro ao finalizar pedido', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 640 }}>
        <h2 style={{ marginBottom: 24 }}>Finalizar pedido</h2>

        {/* Resumo dos itens */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ fontWeight: 600, marginBottom: 16 }}>Resumo</div>
          {items.map(item => (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: 'var(--surface-2, #222)' }}>
                {item.imageUrl
                  ? <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 22 }}>📦</span>}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{item.name}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>Qtd: {item.qty}</div>
              </div>
              <div style={{ fontWeight: 700, color: 'var(--accent)' }}>
                R$ {(item.price * item.qty).toFixed(2)}
              </div>
            </div>
          ))}
          <div style={{ borderTop: '1px solid var(--border, #333)', paddingTop: 12, marginTop: 4, display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 500 }}>Total</span>
            <span style={{ fontWeight: 700, fontSize: 20, color: 'var(--accent)' }}>R$ {total.toFixed(2)}</span>
          </div>
        </div>

        {/* Método de pagamento */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ fontWeight: 600, marginBottom: 16 }}>Forma de pagamento</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {PAYMENT_METHODS.map(m => (
              <label
                key={m.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 16px', borderRadius: 10, cursor: 'pointer',
                  border: `2px solid ${payment === m.id ? 'var(--accent)' : 'var(--border, #333)'}`,
                  background: payment === m.id ? 'var(--accent-subtle, rgba(255,180,0,0.08))' : 'transparent',
                  transition: 'border-color .15s, background .15s',
                }}
              >
                <input
                  type="radio"
                  name="payment"
                  value={m.id}
                  checked={payment === m.id}
                  onChange={() => setPayment(m.id)}
                  style={{ accentColor: 'var(--accent)', width: 16, height: 16 }}
                />
                <span style={{ fontSize: 20 }}>{m.icon}</span>
                <span style={{ fontWeight: 500 }}>{m.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Ações */}
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => nav(-1)} disabled={loading}>
            Voltar
          </button>
          <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleConfirm} disabled={loading}>
            {loading ? <span className="spinner" /> : 'Confirmar pedido'}
          </button>
        </div>
      </div>
    </div>
  )
}
