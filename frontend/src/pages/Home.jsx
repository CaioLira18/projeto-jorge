import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../utils/api'
import { useCart, useToast } from './Index'

const EMOJI = ['📦', '💻', '📱', '👟', '🎧', '📚', '⌚', '🎮']
const HOME_LIMIT = 8

const CATEGORIES = ['CONSOLES', 'GAMES', 'BOOKS', 'ACCESSORIES', 'GPU', 'CPU', 'MONITOR', 'MOUSE', 'KEYBOARD', 'HEADPHONES']

const SORT_OPTIONS = [
  { value: 'default', label: 'Relevância' },
  { value: 'price_asc', label: 'Menor preço' },
  { value: 'price_desc', label: 'Maior preço' },
  { value: 'name_asc', label: 'A → Z' },
]

function sortProducts(products, sort) {
  const arr = [...products]
  if (sort === 'price_asc') return arr.sort((a, b) => a.price - b.price)
  if (sort === 'price_desc') return arr.sort((a, b) => b.price - a.price)
  if (sort === 'name_asc') return arr.sort((a, b) => a.name.localeCompare(b.name))
  return arr
}

export default function Home() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('default')
  const [category, setCategory] = useState('')
  const [onlyStock, setOnlyStock] = useState(false)
  const { add, setOpen } = useCart()
  const toast = useToast()

  useEffect(() => {
    api.getProducts()
      .then(setProducts)
      .catch(() => toast('Erro ao carregar produtos', 'error'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = sortProducts(
    products.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
      const matchStock = !onlyStock || p.stock > 0
      const matchCategory = !category || p.category === category
      return matchSearch && matchStock && matchCategory
    }),
    sort
  )

  const visible = filtered.slice(0, HOME_LIMIT)
  const hasMore = filtered.length > HOME_LIMIT

  const handleAdd = (p, e) => {
    e.preventDefault()
    e.stopPropagation()
    add(p)
    toast(`${p.name} adicionado ao carrinho`)
    setOpen(true)
  }

  return (
    <div className="page">
      {/* ── Hero ── */}
      <div className="home-hero">
        <div className="container">
          <div className="home-hero-inner">
            <div className="home-hero-text">
              <span className="home-eyebrow">Nova coleção disponível</span>
              <h1 className="hero-title">
                Tudo o que você<br /><em>precisa aqui.</em>
              </h1>
              <p className="home-hero-sub">
                Produtos selecionados com entrega rápida e segura.<br />
                Do básico ao premium, você encontra.
              </p>
              <div className="home-hero-actions">
                <a href="#produtos" className="btn btn-primary">
                  Ver produtos
                </a>
                <Link to="/produtos" className="btn btn-ghost">
                  Catálogo completo
                </Link>
              </div>
            </div>
            <div className="home-hero-badge">
              <div className="home-hero-stat">
                <span className="home-stat-num">{products.length}</span>
                <span className="home-stat-label">produtos</span>
              </div>
              <div className="home-hero-divider" />
              <div className="home-hero-stat">
                <span className="home-stat-num">
                  {products.filter(p => p.stock > 0).length}
                </span>
                <span className="home-stat-label">em estoque</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Produtos ── */}
      <div className="container" id="produtos">

        {/* Toolbar */}
        <div className="home-toolbar">
          <div className="home-toolbar-left">
            <h2 className="home-section-title">Destaques</h2>
            {!loading && (
              <span className="home-count">
                {filtered.length} produto{filtered.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="home-toolbar-right">
            <label className="home-check">
              <input
                type="checkbox"
                checked={onlyStock}
                onChange={e => setOnlyStock(e.target.checked)}
              />
              <span>Apenas em estoque</span>
            </label>
            <input
              className="home-search"
              placeholder="Buscar produtos..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select
              className="home-sort"
              value={category}
              onChange={e => setCategory(e.target.value)}
            >
              <option value="">Todas as categorias</option>
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select
              className="home-sort"
              value={sort}
              onChange={e => setSort(e.target.value)}
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
            <div className="spinner" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="home-empty">
            <p>Nenhum produto encontrado.</p>
            <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setOnlyStock(false); setCategory('') }}>
              Limpar filtros
            </button>
          </div>
        ) : (
          <>
            <div className="home-grid">
              {visible.map((p, i) => (
                <Link to={`/produtos/${p.id}`} className="hcard" key={p.id}>
                  {/* Imagem */}
                  <div className="hcard-img">
                    {p.imageUrl ? (
                      <>
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          className="hcard-img-el"
                          onError={e => {
                            e.currentTarget.style.display = 'none'
                            e.currentTarget.nextSibling.style.display = 'flex'
                          }}
                        />
                        <span className="hcard-img-fallback" style={{ display: 'none' }}>
                          {EMOJI[i % EMOJI.length]}
                        </span>
                      </>
                    ) : (
                      <span className="hcard-img-fallback">
                        {EMOJI[i % EMOJI.length]}
                      </span>
                    )}
                    {p.stock === 0 && <div className="hcard-badge-sold">Esgotado</div>}
                    {p.stock > 0 && p.stock <= 5 && (
                      <div className="hcard-badge-low">Últimas unidades</div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="hcard-body">
                    <p className="hcard-desc">{p.description || 'Sem descrição'}</p>
                    <h3 className="hcard-name">{p.name}</h3>
                    <div className="hcard-footer">
                      <div>
                        <div className="hcard-price">R$ {p.price?.toFixed(2)}</div>
                        <div className="hcard-stock">
                          {p.stock > 0
                            ? `${p.stock} em estoque`
                            : <span className="text-danger">Sem estoque</span>}
                        </div>
                      </div>
                      <button
                        className="btn btn-primary btn-sm hcard-btn"
                        disabled={p.stock === 0}
                        onClick={e => handleAdd(p, e)}
                      >
                        + Carrinho
                      </button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {hasMore && (
              <div className="home-more">
                <p className="text-muted">
                  Mostrando {HOME_LIMIT} de {filtered.length} produtos
                </p>
                <Link to="/produtos" className="btn btn-ghost">
                  Ver catálogo completo →
                </Link>
              </div>
            )}
          </>
        )}
      </div>


    </div>
  )
}
