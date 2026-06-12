import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../utils/api'
import { useAuth, useToast } from './Index'

const STATUS_LABEL = {
  PENDING:    { label: 'Pendente',    color: '#f59e0b', bg: 'rgba(245,158,11,.12)',  border: 'rgba(245,158,11,.3)'  },
  CONFIRMED:  { label: 'Confirmado', color: '#60a5fa', bg: 'rgba(96,165,250,.12)',  border: 'rgba(96,165,250,.3)'  },
  SHIPPED:    { label: 'Enviado',    color: '#a78bfa', bg: 'rgba(167,139,250,.12)', border: 'rgba(167,139,250,.3)' },
  DELIVERED:  { label: 'Entregue',   color: '#22c55e', bg: 'rgba(34,197,94,.12)',   border: 'rgba(34,197,94,.3)'   },
  CANCELLED:  { label: 'Cancelado',  color: '#ef4444', bg: 'rgba(239,68,68,.12)',   border: 'rgba(239,68,68,.3)'   },
}

const PAYMENT_LABEL = {
  CREDIT_CARD: '💳 Cartão de crédito',
  DEBIT_CARD:  '💳 Cartão de débito',
  PIX:         '⚡ Pix',
  BOLETO:      '🧾 Boleto',
}

function StatusBadge({ status }) {
  const s = STATUS_LABEL[status] || { label: status, color: 'var(--muted)', bg: 'var(--surface2)', border: 'var(--border)' }
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99,
      textTransform: 'uppercase', letterSpacing: '.05em',
      color: s.color, background: s.bg, border: `1px solid ${s.border}`
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
      {/* Cabeçalho */}
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

      {/* Detalhes expandíveis */}
      {open && (
        <div className="ocard-body">
          <div className="ocard-body-inner">

            {/* Itens */}
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

            {/* Resumo financeiro */}
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
                  <span className="text-accent">R$ {total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Pagamento */}
            <div className="ocard-section">
              <p className="ocard-section-title">Pagamento</p>
              <p style={{ fontSize: 14, color: 'var(--muted)' }}>
                {PAYMENT_LABEL[order.paymentMethod] ?? order.paymentMethod ?? '—'}
              </p>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}

export default function Orders() {
  const { id } = useParams()
  const [orders,  setOrders]  = useState([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const toast = useToast()

  useEffect(() => {
    // userId vem do token decodificado; api.getOrders(id, user?.token) deve injetá-lo
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

        {/* Header */}
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

        {/* Content */}
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

      <style>{`
        .orders-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 32px;
          flex-wrap: wrap;
        }
        .orders-title {
          font-family: var(--display);
          font-size: 28px;
          font-style: italic;
        }
        .orders-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 80px 0;
          text-align: center;
        }
        .orders-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        /* Card */
        .ocard {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          overflow: hidden;
          transition: border-color .2s;
        }
        .ocard:hover { border-color: #3a3a48; }

        .ocard-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 20px;
          cursor: pointer;
          gap: 12px;
          flex-wrap: wrap;
          user-select: none;
        }
        .ocard-left { display: flex; align-items: center; gap: 20px; flex-wrap: wrap; }
        .ocard-id { display: flex; flex-direction: column; gap: 2px; }
        .ocard-label { font-size: 10px; text-transform: uppercase; letter-spacing: .08em; color: var(--muted); }
        .ocard-num { font-size: 14px; font-weight: 700; font-family: monospace; color: var(--text); }
        .ocard-date { font-size: 13px; color: var(--muted); }

        .ocard-right { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
        .ocard-total { font-size: 16px; font-weight: 700; color: var(--accent); }
        .ocard-chevron { color: var(--muted); font-size: 14px; transition: transform .2s; line-height: 1; }

        /* Body */
        .ocard-body {
          border-top: 1px solid var(--border);
          background: var(--surface2);
        }
        .ocard-body-inner {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 0;
        }
        @media (max-width: 600px) {
          .ocard-body-inner { grid-template-columns: 1fr; }
        }

        .ocard-section {
          padding: 20px;
          border-right: 1px solid var(--border);
        }
        .ocard-section:last-child { border-right: none; }
        @media (max-width: 600px) {
          .ocard-section { border-right: none; border-bottom: 1px solid var(--border); }
          .ocard-section:last-child { border-bottom: none; }
        }

        .ocard-section-title {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: .08em;
          color: var(--muted);
          margin-bottom: 12px;
          font-weight: 600;
        }

        /* Itens */
        .ocard-items { display: flex; flex-direction: column; gap: 8px; }
        .ocard-item { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
        .ocard-item-info { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
        .ocard-item-name {
          font-size: 13px;
          font-weight: 500;
          color: var(--text);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          text-decoration: none;
        }
        .ocard-item-name:hover { color: var(--accent); }
        .ocard-item-qty { font-size: 12px; color: var(--muted); }
        .ocard-item-price { font-size: 13px; font-weight: 600; color: var(--text); white-space: nowrap; }

        /* Summary */
        .ocard-summary { display: flex; flex-direction: column; gap: 8px; }
        .ocard-summary-row { display: flex; justify-content: space-between; font-size: 13px; color: var(--muted); }
        .ocard-summary-divider { border-top: 1px solid var(--border); margin: 4px 0; }
        .ocard-summary-total { font-size: 14px; font-weight: 700; color: var(--text); }
      `}</style>
    </div>
  )
}
