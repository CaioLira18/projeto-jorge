import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../utils/api'
import { useCart, useToast } from './Index'

const EMOJI = ['📦', '💻', '📱', '👟', '🎧', '📚', '⌚', '🎮']

const PAGE_SIZE = 20

export default function Products() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('default')
  const [onlyInStock, setOnlyInStock] = useState(false)
  const [page, setPage] = useState(1)
  const { add, setOpen } = useCart()
  const toast = useToast()

  useEffect(() => {
    api.getProducts()
      .then(setProducts)
      .catch(() => toast('Erro ao carregar produtos', 'error'))
      .finally(() => setLoading(false))
  }, [])

  // reset page when filters change
  useEffect(() => { setPage(1) }, [search, sort, onlyInStock])

  const handleAdd = (p, e) => {
    e.preventDefault()
    e.stopPropagation()
    add(p)
    toast(`${p.name} adicionado ao carrinho`)
    setOpen(true)
  }

  const filtered = products
    .filter(p => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.description || '').toLowerCase().includes(search.toLowerCase())
      const matchStock = onlyInStock ? p.stock > 0 : true
      return matchSearch && matchStock
    })
    .sort((a, b) => {
      if (sort === 'price-asc') return a.price - b.price
      if (sort === 'price-desc') return b.price - a.price
      if (sort === 'name') return a.name.localeCompare(b.name)
      return 0
    })

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="page">
      <div className="container">

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>Todos os produtos</h1>
          <p className="text-muted" style={{ fontSize: 14 }}>
            {loading ? '...' : `${filtered.length} produto${filtered.length !== 1 ? 's' : ''} encontrado${filtered.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        {/* Toolbar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 28, alignItems: 'center' }}>
          <input
            placeholder="Buscar produtos..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: '1 1 240px', maxWidth: 360 }}
          />

          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid var(--border, #e2e8f0)',
              background: 'var(--card, #fff)',
              color: 'var(--text, #1a202c)',
              fontSize: 14,
              cursor: 'pointer'
            }}
          >
            <option value="default">Ordenar: padrão</option>
            <option value="price-asc">Menor preço</option>
            <option value="price-desc">Maior preço</option>
            <option value="name">Nome A-Z</option>
          </select>

          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, cursor: 'pointer', userSelect: 'none' }}>
            <input
              type="checkbox"
              checked={onlyInStock}
              onChange={e => setOnlyInStock(e.target.checked)}
              style={{ width: 16, height: 16, cursor: 'pointer' }}
            />
            Apenas em estoque
          </label>
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
            <div className="spinner" />
          </div>
        ) : paginated.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 80 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
            <p className="text-muted">Nenhum produto encontrado.</p>
            {(search || onlyInStock) && (
              <button
                className="btn btn-primary btn-sm"
                style={{ marginTop: 12 }}
                onClick={() => { setSearch(''); setOnlyInStock(false) }}
              >
                Limpar filtros
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid-4">
              {paginated.map((p, i) => (
                <Link to={`/produtos/${p.id}`} className="product-card" key={p.id} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                  <div className="product-img">
                    {p.imageUrl
                      ? <img
                          src={p.imageUrl}
                          alt={p.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }}
                          onError={e => {
                            e.currentTarget.style.display = 'none'
                            e.currentTarget.nextSibling.style.display = 'flex'
                          }}
                        />
                      : null}
                    <span style={{
                      display: p.imageUrl ? 'none' : 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      width: '100%', height: '100%', fontSize: 32
                    }}>
                      {EMOJI[i % EMOJI.length]}
                    </span>
                  </div>
                  <div className="product-info">
                    <div className="product-name">{p.name}</div>
                    <div className="text-muted" style={{ fontSize: 13, marginTop: 2, marginBottom: 8 }}>
                      {p.description || 'Sem descrição'}
                    </div>
                    <div className="product-price">R$ {p.price?.toFixed(2)}</div>
                    <div className="product-stock">
                      {p.stock > 0
                        ? `${p.stock} em estoque`
                        : <span className="text-danger">Sem estoque</span>}
                    </div>
                    <button
                      className="btn btn-primary btn-sm w-full"
                      style={{ marginTop: 12 }}
                      disabled={p.stock === 0}
                      onClick={e => handleAdd(p, e)}
                    >
                      Adicionar ao carrinho
                    </button>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 40 }}>
                <button
                  className="btn btn-sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  style={{ padding: '6px 14px' }}
                >
                  ← Anterior
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
                  .reduce((acc, n, idx, arr) => {
                    if (idx > 0 && n - arr[idx - 1] > 1) acc.push('...')
                    acc.push(n)
                    return acc
                  }, [])
                  .map((n, idx) =>
                    n === '...'
                      ? <span key={`ellipsis-${idx}`} style={{ padding: '0 4px', color: 'var(--text-muted, #718096)' }}>…</span>
                      : <button
                          key={n}
                          className={`btn btn-sm${page === n ? ' btn-primary' : ''}`}
                          onClick={() => setPage(n)}
                          style={{ padding: '6px 12px', minWidth: 36 }}
                        >
                          {n}
                        </button>
                  )}

                <button
                  className="btn btn-sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  style={{ padding: '6px 14px' }}
                >
                  Próxima →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
