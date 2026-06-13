import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../utils/api'
import { useCart, useToast } from './Index'

const EMOJI = ['📦', '💻', '📱', '👟', '🎧', '📚', '⌚', '🎮']

const CATEGORIES = ['CONSOLES', 'GAMES', 'BOOKS', 'ACCESSORIES', 'GPU', 'CPU', 'MONITOR', 'MOUSE', 'KEYBOARD', 'HEADPHONES']

const PAGE_SIZE = 20

export default function Products() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('default')
  const [onlyInStock, setOnlyInStock] = useState(false)
  const [category, setCategory] = useState('')
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
  useEffect(() => { setPage(1) }, [search, sort, onlyInStock, category])

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
      const matchCategory = !category || p.category === category
      return matchSearch && matchStock && matchCategory
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
        <div className="products-header">
          <h1 className="products-title">Todos os produtos</h1>
          <p className="products-subtitle text-muted">
            {loading ? '...' : `${filtered.length} produto${filtered.length !== 1 ? 's' : ''} encontrado${filtered.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        {/* Toolbar */}
        <div className="products-toolbar">
          <input
            className="products-search"
            placeholder="Buscar produtos..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />

          <select
            className="products-select"
            value={category}
            onChange={e => setCategory(e.target.value)}
          >
            <option value="">Todas as categorias</option>
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            className="products-select"
            value={sort}
            onChange={e => setSort(e.target.value)}
          >
            <option value="default">Ordenar: padrão</option>
            <option value="price-asc">Menor preço</option>
            <option value="price-desc">Maior preço</option>
            <option value="name">Nome A-Z</option>
          </select>

          <label className="products-check">
            <input
              type="checkbox"
              checked={onlyInStock}
              onChange={e => setOnlyInStock(e.target.checked)}
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
            <p className="text-muted">Nenhum produto encontrado.</p>
            {(search || onlyInStock) && (
              <button
                className="btn btn-primary btn-sm"
                style={{ marginTop: 12 }}
                onClick={() => { setSearch(''); setOnlyInStock(false); setCategory('') }}
              >
                Limpar filtros
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid-4">
              {paginated.map((p, i) => (
                <Link to={`/produtos/${p.id}`} className="product-card" key={p.id}>
                  <div className="product-img">
                    {p.imageUrl && (
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        onError={e => {
                          e.currentTarget.style.display = 'none'
                          e.currentTarget.nextSibling.style.display = 'flex'
                        }}
                      />
                    )}
                    <span
                      className="product-img-fallback"
                      style={{ display: p.imageUrl ? 'none' : 'flex' }}
                    >
                      {EMOJI[i % EMOJI.length]}
                    </span>
                  </div>
                  <div className="product-info">
                    <div className="product-name">{p.name}</div>
                    <div className="product-desc text-muted">
                      {p.description || 'Sem descrição'}
                    </div>
                    <div className="product-price">R$ {p.price?.toFixed(2)}</div>
                    <div className="product-stock">
                      {p.stock > 0
                        ? `${p.stock} em estoque`
                        : <span className="text-danger">Sem estoque</span>}
                    </div>
                    <button
                      className="btn btn-primary btn-sm w-full product-card-btn"
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
