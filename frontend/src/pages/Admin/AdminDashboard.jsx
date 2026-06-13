import React, { useEffect, useState, useCallback } from 'react'
import { useAuth, useToast } from '../Index'
import { api } from '../../utils/api'
import { PaginaRestrita } from '../PaginaRestrita'

const STATUS_COLOR = {
  UP: 'dash-svc--up',
  DOWN: 'dash-svc--down',
}

const ORDER_STATUS = {
  PENDING:   { label: 'Pendente',   cls: 'dash-badge--warn' },
  CONFIRMED: { label: 'Confirmado', cls: 'dash-badge--info' },
  SHIPPED:   { label: 'Enviado',    cls: 'dash-badge--purple' },
  DELIVERED: { label: 'Entregue',   cls: 'dash-badge--ok' },
  CANCELLED: { label: 'Cancelado',  cls: 'dash-badge--danger' },
}

const fmt = (v) => `R$ ${parseFloat(v).toFixed(2)}`
const fmtDate = (ts) => ts
  ? new Date(ts > 1e10 ? ts : ts * 1000).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
  : '—'

export default function AdminDashboard() {
  const { user } = useAuth()
  const toast = useToast()

  const [tab, setTab] = useState('overview')
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [services, setServices] = useState({})
  const [loading, setLoading] = useState(true)
  const [orderSearch, setOrderSearch] = useState('')

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [prods, ords, svcs] = await Promise.all([
        api.getProducts(),
        api.getAllOrders(user?.token),
        api.getStatus(),
      ])
      setProducts(prods)
      setOrders(ords.sort((a, b) => {
        const ts = t => t > 1e10 ? t : t * 1000
        return ts(b.createdAt) - ts(a.createdAt)
      }))
      setServices(svcs)
    } catch (err) {
      toast(err.message || 'Erro ao carregar dados', 'error')
    } finally {
      setLoading(false)
    }
  }, [user?.token, toast])

  useEffect(() => { fetchAll() }, [fetchAll])

  const totalRevenue = orders.reduce((s, o) => s + (o.totalPrice ?? o.total ?? 0), 0)
  const statOut = products.filter(p => p.stock === 0).length
  const statLow = products.filter(p => p.stock > 0 && p.stock <= 5).length
  const svcsUp = Object.values(services).filter(s => s.status === 'UP').length
  const svcsTotal = Object.values(services).length

  const revenueByDay = (() => {
    const map = {}
    orders.forEach(o => {
      const day = fmtDate(o.createdAt)
      map[day] = (map[day] || 0) + (o.totalPrice ?? o.total ?? 0)
    })
    return Object.entries(map).slice(-7)
  })()

  const maxRev = Math.max(...revenueByDay.map(([, v]) => v), 1)

  const filteredOrders = orders.filter(o =>
    o.id?.toLowerCase().includes(orderSearch.toLowerCase()) ||
    o.userId?.toLowerCase().includes(orderSearch.toLowerCase()) ||
    o.status?.toLowerCase().includes(orderSearch.toLowerCase())
  )

  if (loading) return (
    <div className="dash-page">
      <div className="dash-loading">Carregando dashboard...</div>
    </div>
  )

  if (user?.role !== 'admin') return <PaginaRestrita />

  return (
    <div className="dash-page">
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Dashboard</h1>
          <p className="dash-subtitle">Visão geral do sistema</p>
        </div>
        <button className="dash-refresh" onClick={fetchAll} title="Atualizar">
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
          Atualizar
        </button>
      </div>

      <div className="dash-kpis">
        <div className="dash-kpi">
          <span className="dash-kpi__label">Receita total</span>
          <span className="dash-kpi__value">{fmt(totalRevenue)}</span>
        </div>
        <div className="dash-kpi">
          <span className="dash-kpi__label">Pedidos</span>
          <span className="dash-kpi__value">{orders.length}</span>
        </div>
        <div className="dash-kpi">
          <span className="dash-kpi__label">Produtos</span>
          <span className="dash-kpi__value">{products.length}</span>
        </div>
        <div className="dash-kpi">
          <span className="dash-kpi__label">Sem estoque</span>
          <span className="dash-kpi__value dash-kpi__value--danger">{statOut}</span>
        </div>
        <div className="dash-kpi">
          <span className="dash-kpi__label">Estoque baixo</span>
          <span className="dash-kpi__value dash-kpi__value--warn">{statLow}</span>
        </div>
        <div className="dash-kpi">
          <span className="dash-kpi__label">Serviços ativos</span>
          <span className={`dash-kpi__value ${svcsUp === svcsTotal ? 'dash-kpi__value--ok' : 'dash-kpi__value--danger'}`}>
            {svcsUp}/{svcsTotal}
          </span>
        </div>
      </div>

      <div className="dash-tabs">
        {['overview', 'orders', 'products', 'services'].map(t => (
          <button
            key={t}
            className={`dash-tab ${tab === t ? 'dash-tab--active' : ''}`}
            onClick={() => setTab(t)}
          >
            {{ overview: 'Visão geral', orders: 'Pedidos', products: 'Produtos', services: 'Serviços' }[t]}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="dash-overview">
          <div className="dash-card">
            <p className="dash-card__title">Receita dos últimos dias</p>
            {revenueByDay.length === 0 ? (
              <p className="dash-empty">Sem dados</p>
            ) : (
              <div className="dash-chart">
                {revenueByDay.map(([day, val]) => (
                  <div key={day} className="dash-chart__col">
                    <span className="dash-chart__val">{fmt(val)}</span>
                    <div className="dash-chart__bar-wrap">
                      <div className="dash-chart__bar" style={{ height: `${Math.round((val / maxRev) * 100)}%` }} />
                    </div>
                    <span className="dash-chart__label">{day}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="dash-card">
            <p className="dash-card__title">Últimos pedidos</p>
            <table className="dash-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Data</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 8).map(o => {
                  const s = ORDER_STATUS[o.status] || { label: o.status, cls: '' }
                  return (
                    <tr key={o.id}>
                      <td className="dash-td--mono">#{o.id?.slice(-8).toUpperCase()}</td>
                      <td>{fmtDate(o.createdAt)}</td>
                      <td>{fmt(o.totalPrice ?? o.total ?? 0)}</td>
                      <td><span className={`dash-badge ${s.cls}`}>{s.label}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'orders' && (
        <div className="dash-card">
          <div className="dash-card__toolbar">
            <p className="dash-card__title">Todos os pedidos</p>
            <div className="dash-search">
              <svg className="dash-search__icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input className="dash-search__input" placeholder="Buscar por ID, usuário ou status..." value={orderSearch} onChange={e => setOrderSearch(e.target.value)} />
            </div>
          </div>
          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Usuário</th>
                  <th>Data</th>
                  <th>Itens</th>
                  <th>Total</th>
                  <th>Pagamento</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr><td colSpan={7} className="dash-empty">Nenhum pedido encontrado</td></tr>
                ) : filteredOrders.map(o => {
                  const s = ORDER_STATUS[o.status] || { label: o.status, cls: '' }
                  return (
                    <tr key={o.id}>
                      <td className="dash-td--mono">#{o.id?.slice(-8).toUpperCase()}</td>
                      <td className="dash-td--mono">{o.userId?.slice(-8)}</td>
                      <td>{fmtDate(o.createdAt)}</td>
                      <td>{o.items?.length ?? 0}</td>
                      <td>{fmt(o.totalPrice ?? o.total ?? 0)}</td>
                      <td>{o.paymentMethod?.toUpperCase() ?? '—'}</td>
                      <td><span className={`dash-badge ${s.cls}`}>{s.label}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'products' && (
        <div className="dash-card">
          <p className="dash-card__title">Estoque de produtos</p>
          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Categoria</th>
                  <th>Preço</th>
                  <th>Estoque</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => {
                  const s = p.stock === 0
                    ? { label: 'Sem estoque', cls: 'dash-badge--danger' }
                    : p.stock <= 5
                    ? { label: 'Estoque baixo', cls: 'dash-badge--warn' }
                    : { label: 'Disponível', cls: 'dash-badge--ok' }
                  return (
                    <tr key={p.id}>
                      <td className="dash-td--name">{p.name}</td>
                      <td>{p.category || '—'}</td>
                      <td>{fmt(p.price)}</td>
                      <td>{p.stock}</td>
                      <td><span className={`dash-badge ${s.cls}`}>{s.label}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'services' && (
        <div className="dash-services">
          {Object.entries(services).map(([key, svc]) => (
            <div key={key} className="dash-svc">
              <div className="dash-svc__top">
                <span className="dash-svc__name">{svc.name}</span>
                <span className={`dash-svc__badge ${STATUS_COLOR[svc.status] || ''}`}>
                  {svc.status}
                </span>
              </div>
              <span className="dash-svc__url">{svc.url}</span>
              <div className="dash-svc__meta">
                <span>Falhas: {svc.failures}</span>
                <span>Último check: {svc.lastCheck}</span>
              </div>
              {svc.lastEvent && (
                <span className="dash-svc__event">{svc.lastEvent}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
