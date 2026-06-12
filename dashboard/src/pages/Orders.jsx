import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../utils/api'
import { useAuth, useToast } from './Index'

const STATUS_LABEL = {
  PENDING: { label: 'Pendente', color: '#f59e0b', bg: 'rgba(245,158,11,.12)', border: 'rgba(245,158,11,.3)' },
  CONFIRMED: { label: 'Confirmado', color: '#60a5fa', bg: 'rgba(96,165,250,.12)', border: 'rgba(96,165,250,.3)' },
  SHIPPED: { label: 'Enviado', color: '#a78bfa', bg: 'rgba(167,139,250,.12)', border: 'rgba(167,139,250,.3)' },
  DELIVERED: { label: 'Entregue', color: '#22c55e', bg: 'rgba(34,197,94,.12)', border: 'rgba(34,197,94,.3)' },
  CANCELLED: { label: 'Cancelado', color: '#ef4444', bg: 'rgba(239,68,68,.12)', border: 'rgba(239,68,68,.3)' },
}

const pixLogo = <i className="fa-brands fa-pix"></i>
const cartaoLogo = <i className="fa-solid fa-credit-card"></i>
const boletoLogo = <i className="fa-regular fa-file-lines"></i>

const PAYMENT_LABEL = [
  { id: 'credit', label: 'Cartão de crédito', icon: cartaoLogo },
  { id: 'pix', label: 'Pix', icon: pixLogo },
  { id: 'boleto', label: 'Boleto', icon: boletoLogo },
]
function StatusBadge({ status }) {
  const s = STATUS_LABEL[status] || { label: status, color: 'var(--muted)', bg: 'var(--surface2)', border: 'var(--border)' }
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '11px',
      fontWeight: '700',
      padding: '4px 10px',
      borderRadius: '99px',
      textTransform: 'uppercase',
      letterSpacing: '.05em',
      color: s.color,
      background: s.bg,
      border: `1px solid ${s.border}`,
      lineHeight: '1',
      height: '24px', // Adicione uma altura fixa aqui
      boxSizing: 'border-box' // Garante que o padding não aumente a altura
    }}>
      {s.label}
    </span>
  )
}

function OrderCard({ order }) {
  const [open, setOpen] = useState(false)

  const rawTs = order.createdAt
  const date = rawTs
    ? new Date(rawTs > 1e10 ? rawTs : rawTs * 1000).toLocaleDateString('pt-BR', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
    : '—'

  const total = order.totalPrice ?? order.total ?? order.items?.reduce(
    (sum, item) => sum + (item.price ?? 0) * (item.quantity ?? 1), 0
  ) ?? 0

  return (
    <div className="ocard">
      <div className="ocard-header" onClick={() => setOpen(o => !o)}>
        <div className="ocard-left">
          <div className="ocard-id">
            <span className="ocard-label">Pedido</span>
            <span className="ocard-num">#{order.id?.slice(-8).toUpperCase() ?? '—'}</span>
          </div>
          <div className="ocard-date">{date}</div>
        </div>

        <div className="ocard-right">
          <StatusBadge status={order.status} />
          <div className="ocard-total">R$ {total.toFixed(2)}</div>
          <div className="ocard-chevron" style={{ transform: open ? 'rotate(180deg)' : 'none' }}>
            ▾
          </div>
        </div>
      </div>

      {open && (
        <div className="ocard-body">
          <div className="ocard-body-inner">

            <div className="ocard-section">
              <p className="ocard-section-title">Itens do pedido</p>
              <div className="ocard-items">
                {order.items?.map((item, i) => (
                  <div className="ocard-item" key={i}>
                    <div className="ocard-item-info">
                      <Link
                        to={`/produtos/${item.productId}`}
                        className="ocard-item-name"
                        onClick={e => e.stopPropagation()}
                      >
                        {item.productName ?? `Produto ${item.productId?.slice(-6)}`}
                      </Link>
                      <span className="ocard-item-qty">× {item.quantity ?? 1}</span>
                    </div>
                    <span className="ocard-item-price">
                      R$ {((item.price ?? 0) * (item.quantity ?? 1)).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="ocard-section">
              <p className="ocard-section-title">Resumo</p>
              <div className="ocard-summary">
                <div className="ocard-summary-row">
                  <span>Subtotal</span>
                  <span>R$ {total.toFixed(2)}</span>
                </div>
                <div className="ocard-summary-row">
                  <span>Frete</span>
                  <span className="text-success">Grátis</span>
                </div>
                <div className="ocard-summary-divider" />
                <div className="ocard-summary-row ocard-summary-total">
                  <span>Total</span>
                  <span>R$ {total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="ocard-section">
              <p className="ocard-section-title">Pagamento</p>
              {(() => {
                // 1. Busca o método correspondente no array
                const method = PAYMENT_LABEL.find(
                  (m) => m.id === order.paymentMethod?.toLowerCase()
                );

                if (!method) return <p style={{ fontSize: 14, color: 'var(--muted)' }}>{order.paymentMethod}</p>;

                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 14, color: 'var(--muted)' }}>
                    {/* Renderiza o ícone */}
                    <span>{method.icon}</span>
                    {/* Renderiza o nome em maiúsculas */}
                    <span style={{ textTransform: 'uppercase' }}>{method.label}</span>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Orders() {
  const { id } = useParams()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const toast = useToast()

  useEffect(() => {
    api.getOrders(id, user?.token)
      .then(data => setOrders(data.sort((a, b) => {
        const ts = t => t > 1e10 ? t : t * 1000
        return ts(b.createdAt) - ts(a.createdAt)
      })))
      .catch(() => toast('Erro ao carregar pedidos', 'error'))
      .finally(() => setLoading(false))
  }, [id])

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 760 }}>

        <div className="orders-header">
          <div>
            <h1 className="orders-title">Meus pedidos</h1>
            {!loading && (
              <p className="text-muted" style={{ fontSize: 14, marginTop: 4 }}>
                {orders.length === 0
                  ? 'Nenhum pedido ainda'
                  : `${orders.length} pedido${orders.length !== 1 ? 's' : ''}`}
              </p>
            )}
          </div>
          <Link to="/produtos" className="btn btn-ghost btn-sm">
            Continuar comprando
          </Link>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
            <div className="spinner" />
          </div>
        ) : orders.length === 0 ? (
          <div className="orders-empty">
            <span style={{ fontSize: 56 }}>🛍️</span>
            <p style={{ fontSize: 16, fontWeight: 600 }}>Você ainda não fez nenhum pedido</p>
            <p className="text-muted" style={{ fontSize: 14 }}>
              Explore nossos produtos e faça seu primeiro pedido.
            </p>
            <Link to="/produtos" className="btn btn-primary" style={{ marginTop: 8 }}>
              Ver produtos
            </Link>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map(order => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
