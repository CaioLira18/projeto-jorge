import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../utils/api'
import { useCart, useToast } from './Index'

const EMOJI = ['📦', '💻', '📱', '👟', '🎧', '📚', '⌚', '🎮']
const HOME_LIMIT = 8

const SORT_OPTIONS = [
  { value: 'default',    label: 'Relevância' },
  { value: 'price_asc',  label: 'Menor preço' },
  { value: 'price_desc', label: 'Maior preço' },
  { value: 'name_asc',   label: 'A → Z' },
]

function sortProducts(products, sort) {
  const arr = [...products]
  if (sort === 'price_asc')  return arr.sort((a, b) => a.price - b.price)
  if (sort === 'price_desc') return arr.sort((a, b) => b.price - a.price)
  if (sort === 'name_asc')   return arr.sort((a, b) => a.name.localeCompare(b.name))
  return arr
}

export default function Home() {
  const [products, setProducts]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [sort, setSort]           = useState('default')
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
      const matchStock  = !onlyStock || p.stock > 0
      return matchSearch && matchStock
    }),
    sort
  )

  const visible  = filtered.slice(0, HOME_LIMIT)
  const hasMore  = filtered.length > HOME_LIMIT

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
                <Link to="/products" className="btn btn-ghost">
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
            <span style={{ fontSize: 48 }}>🔍</span>
            <p>Nenhum produto encontrado.</p>
            <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setOnlyStock(false) }}>
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
                <Link to="/products" className="btn btn-ghost">
                  Ver catálogo completo →
                </Link>
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        /* Hero */
        .home-hero {
          border-bottom: 1px solid var(--border);
          padding: 72px 0 64px;
          margin-bottom: 56px;
          background: linear-gradient(160deg, var(--surface) 0%, var(--bg) 60%);
        }
        .home-hero-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 40px;
          flex-wrap: wrap;
        }
        .home-hero-text { flex: 1; min-width: 260px; }
        .home-eyebrow {
          display: inline-block;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: .1em;
          text-transform: uppercase;
          color: var(--accent);
          margin-bottom: 16px;
          padding: 4px 12px;
          border: 1px solid var(--accent-dim);
          border-radius: 99px;
        }
        .home-hero-sub {
          color: var(--muted);
          font-size: 15px;
          line-height: 1.7;
          margin: 16px 0 32px;
          max-width: 420px;
        }
        .home-hero-actions { display: flex; gap: 12px; flex-wrap: wrap; }
        .home-hero-badge {
          display: flex;
          align-items: center;
          gap: 32px;
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 28px 36px;
        }
        .home-hero-stat { display: flex; flex-direction: column; align-items: center; gap: 4px; }
        .home-stat-num {
          font-family: var(--display);
          font-size: 40px;
          font-weight: 700;
          color: var(--accent);
          line-height: 1;
        }
        .home-stat-label { font-size: 12px; color: var(--muted); text-transform: uppercase; letter-spacing: .06em; }
        .home-hero-divider { width: 1px; height: 40px; background: var(--border); }

        /* Toolbar */
        .home-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 32px;
          flex-wrap: wrap;
        }
        .home-toolbar-left { display: flex; align-items: baseline; gap: 12px; }
        .home-section-title { font-family: var(--display); font-size: 26px; font-style: italic; }
        .home-count {
          font-size: 13px;
          color: var(--muted);
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 99px;
          padding: 2px 10px;
        }
        .home-toolbar-right {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .home-check {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 13px;
          color: var(--muted);
          cursor: pointer;
          white-space: nowrap;
        }
        .home-check input { width: auto; }
        .home-search {
          width: 220px !important;
          font-size: 13px;
          padding: 8px 12px;
        }
        .home-sort {
          width: auto !important;
          font-size: 13px;
          padding: 8px 12px;
        }

        /* Grid */
        .home-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-bottom: 48px;
        }
        @media (max-width: 1100px) { .home-grid { grid-template-columns: repeat(3,1fr); } }
        @media (max-width: 768px)  { .home-grid { grid-template-columns: repeat(2,1fr); } .home-hero-badge { display: none; } }
        @media (max-width: 480px)  { .home-grid { grid-template-columns: 1fr; } }

        /* Card */
        .hcard {
          display: flex;
          flex-direction: column;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          overflow: hidden;
          transition: border-color .2s, transform .2s, box-shadow .2s;
          text-decoration: none;
          color: inherit;
        }
        .hcard:hover {
          border-color: var(--accent);
          transform: translateY(-3px);
          box-shadow: 0 8px 32px rgba(245,158,11,.08);
        }
        .hcard-img {
          position: relative;
          height: 190px;
          background: var(--surface2);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .hcard-img-el {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform .3s;
        }
        .hcard:hover .hcard-img-el { transform: scale(1.04); }
        .hcard-img-fallback {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          font-size: 52px;
        }
        .hcard-badge-sold,
        .hcard-badge-low {
          position: absolute;
          top: 10px;
          left: 10px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 700;
          padding: 3px 8px;
          text-transform: uppercase;
          letter-spacing: .04em;
        }
        .hcard-badge-sold { background: var(--danger); color: #fff; }
        .hcard-badge-low  { background: var(--accent); color: #0c0c0f; }

        .hcard-body { display: flex; flex-direction: column; padding: 14px 16px 16px; flex: 1; }
        .hcard-desc { font-size: 11px; color: var(--muted); margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .hcard-name { font-size: 14px; font-weight: 600; line-height: 1.3; margin-bottom: 12px; flex: 1; }
        .hcard-footer { display: flex; align-items: flex-end; justify-content: space-between; gap: 8px; margin-top: auto; }
        .hcard-price { font-size: 18px; font-weight: 700; color: var(--accent); line-height: 1; }
        .hcard-stock { font-size: 11px; color: var(--muted); margin-top: 3px; }
        .hcard-btn { white-space: nowrap; flex-shrink: 0; }

        /* Empty */
        .home-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          padding: 80px 0;
          color: var(--muted);
          font-size: 15px;
        }

        /* More */
        .home-more {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
          padding: 16px 0 48px;
          text-align: center;
        }
      `}</style>
    </div>
  )
}
