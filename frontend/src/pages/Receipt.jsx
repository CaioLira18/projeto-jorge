import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from './Index'
import { api } from '../utils/api'

const PAYMENT_LABELS = {
  credit: 'Cartão de crédito',
  pix: 'Pix',
  boleto: 'Boleto',
}

export default function Receipt() {
  const { orderId } = useParams()
  const { user } = useAuth()
  const nav = useNavigate()

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { nav('/login'); return }
    api.getOrder(orderId, user.token)
      .then(order => setOrder(order || null))
      .catch(() => setOrder(null))
      .finally(() => setLoading(false))
  }, [orderId, user])

  if (loading) {
    return (
      <div className="page">
        <div className="container" style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div className="spinner" />
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="page">
        <div className="container" style={{ maxWidth: 480, textAlign: 'center', padding: 60 }}>
          <p className="text-muted">Pedido não encontrado.</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => nav('/')}>
            Voltar à loja
          </button>
        </div>
      </div>
    )
  }

  const date = order.createdAt ? new Date(order.createdAt) : new Date()

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 480, marginTop: 40 }}>
        <div className="card" style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>✅</div>
          <h2 style={{ marginBottom: 4 }}>Pedido confirmado!</h2>
          <p className="text-muted" style={{ fontSize: 14 }}>
            Pedido #{order.id} — {date.toLocaleDateString('pt-BR')} às {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ fontWeight: 600, marginBottom: 16 }}>Itens</div>
          {(order.items || []).map((item, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 14 }}>
              <span>
                {item.quantity}x {item.productName || item.productId}
              </span>
              <span style={{ fontWeight: 600 }}>
                R$ {(item.price * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}

          <div style={{ borderTop: '1px solid var(--border, #333)', paddingTop: 12, marginTop: 8, display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 500 }}>Total pago</span>
            <span style={{ fontWeight: 700, fontSize: 20, color: 'var(--accent)' }}>
              R$ {order.total?.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
            <span className="text-muted">Forma de pagamento</span>
            <span style={{ fontWeight: 600 }}>
              {PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod || '—'}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginTop: 8 }}>
            <span className="text-muted">Status</span>
            <span style={{ fontWeight: 600, color: 'var(--accent)' }}>
              {order.status || 'Confirmado'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => nav(`/orders/${user.userId}`)}>
            Meus pedidos
          </button>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => nav('/')}>
            Voltar à loja
          </button>
        </div>
      </div>
    </div>
  )
}
