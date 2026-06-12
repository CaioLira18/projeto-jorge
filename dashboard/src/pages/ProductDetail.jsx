import React, { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { api } from '../utils/api'
import { useCart, useToast } from './Index'

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { add, setOpen } = useCart()
  const toast = useToast()

  const [product, setProduct] = useState(null)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)
  const [qty, setQty] = useState(1)
  const [imgError, setImgError] = useState(false)

  useEffect(() => {
    setLoading(true)
    setImgError(false)
    setQty(1)

    Promise.all([
      api.getProduct(id),
      api.getProducts(),
    ])
      .then(([prod, all]) => {
        setProduct(prod)
        setRelated(
          all.filter(p => p.id !== prod.id && p.category === prod.category).slice(0, 4)
        )
      })
      .catch(() => toast('Produto não encontrado', 'error'))
      .finally(() => setLoading(false))
  }, [id])

  const handleAdd = () => {
    for (let i = 0; i < qty; i++) add(product)
    toast(`${qty}× ${product.name} adicionado${qty > 1 ? 's' : ''} ao carrinho`)
    setOpen(true)
  }

  const handleBuy = () => {
    handleAdd()
    navigate('/checkout')
  }

  if (loading) {
    return (
      <div className="pd-loader">
        <div className="spinner" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="pd-loader">
        <p className="text-muted">Produto não encontrado.</p>
        <Link to="/" className="btn btn-ghost" style={{ marginTop: 16 }}>← Voltar</Link>
      </div>
    )
  }

  const inStock = product.stock > 0
  const lowStock = inStock && product.stock <= 5

  return (
    <div className="page">
      <div className="container">

        {/* Breadcrumb */}
        <nav className="pd-breadcrumb">
          <Link to="/">Início</Link>
          <span>/</span>
          <Link to="/produtos">Produtos</Link>
          <span>/</span>
          <span className="pd-bc-current">{product.name}</span>
        </nav>

        {/* Layout principal */}
        <div className="pd-layout">

          {/* Coluna esquerda — Imagem */}
          <div className="pd-gallery">
            <div className="pd-main-img">
              {product.imageUrl && !imgError ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="pd-img-el"
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="pd-img-placeholder">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                    <rect x="3" y="3" width="18" height="18" rx="1.5"/>
                    <path d="M3 16l5-5 4 4 5-6 4 4" />
                    <circle cx="8.5" cy="8.5" r="1.3" fill="currentColor" stroke="none"/>
                  </svg>
                  <span className="pd-img-placeholder-label">Sem imagem</span>
                </div>
              )}
              {!inStock && <div className="pd-sold-overlay">Esgotado</div>}
            </div>
          </div>

          {/* Coluna direita — Detalhes */}
          <div className="pd-details">
            {/* Badges */}
            <div className="pd-badges">
              {inStock && !lowStock && (
                <span className="pd-badge pd-badge-stock">Em estoque</span>
              )}
              {lowStock && (
                <span className="pd-badge pd-badge-low">Últimas {product.stock} unidades</span>
              )}
              {!inStock && (
                <span className="pd-badge pd-badge-sold">Esgotado</span>
              )}
            </div>

            <h1 className="pd-name">{product.name}</h1>

            {product.description && (
              <p className="pd-description">{product.description}</p>
            )}

            {/* Preço */}
            <div className="pd-price-block">
              <span className="pd-price">R$ {product.price?.toFixed(2)}</span>
              <span className="pd-price-label">à vista</span>
            </div>

            <div className="pd-divider" />

            {/* Quantidade */}
            {inStock && (
              <div className="pd-qty-row">
                <span className="pd-qty-label">Quantidade</span>
                <div className="pd-qty-ctrl">
                  <button
                    className="qty-btn"
                    disabled={qty <= 1}
                    onClick={() => setQty(q => Math.max(1, q - 1))}
                  >−</button>
                  <span className="pd-qty-val">{qty}</span>
                  <button
                    className="qty-btn"
                    disabled={qty >= product.stock}
                    onClick={() => setQty(q => Math.min(product.stock, q + 1))}
                  >+</button>
                </div>
                <span className="pd-stock-hint">
                  {product.stock} disponíve{product.stock === 1 ? 'l' : 'is'}
                </span>
              </div>
            )}

            {/* Ações */}
            <div className="pd-actions">
              <button
                className="btn btn-primary pd-btn-add"
                disabled={!inStock}
                onClick={handleAdd}
              >
                {inStock ? 'Adicionar ao carrinho' : 'Indisponível'}
              </button>
              {inStock && (
                <button
                  className="btn btn-ghost pd-btn-buy"
                  onClick={handleBuy}
                >
                  Comprar agora
                </button>
              )}
            </div>

            {/* Info extra */}
            <div className="pd-meta">
              <div className="pd-meta-item">
                <svg className="pd-meta-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <rect x="1" y="6" width="14" height="10" rx="1"/>
                  <path d="M15 9h3l3 3v4h-6z"/>
                  <circle cx="6" cy="18" r="1.6"/>
                  <circle cx="17.5" cy="18" r="1.6"/>
                </svg>
                <span>Entrega rápida e segura</span>
              </div>
              <div className="pd-meta-item">
                <svg className="pd-meta-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <rect x="4" y="10" width="16" height="10" rx="1.5"/>
                  <path d="M7 10V7a5 5 0 0110 0v3"/>
                </svg>
                <span>Pagamento 100% seguro</span>
              </div>
              <div className="pd-meta-item">
                <svg className="pd-meta-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M3 11a8 8 0 1 1 2.3 5.6"/>
                  <path d="M3 16v-4h4"/>
                </svg>
                <span>Devolução em 7 dias</span>
              </div>
            </div>
          </div>
        </div>

        {/* Produtos relacionados */}
        {related.length > 0 && (
          <div className="pd-related">
            <h2 className="pd-related-title">Você também pode gostar</h2>
            <div className="pd-related-grid">
              {related.map((p, i) => (
                <Link to={`/produtos/${p.id}`} className="pd-rcard" key={p.id}>
                  <div className="pd-rcard-img">
                    {p.imageUrl ? (
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={e => {
                          e.currentTarget.style.display = 'none'
                          e.currentTarget.nextSibling.style.display = 'flex'
                        }}
                      />
                    ) : null}
                    {!p.imageUrl && (
                      <div className="pd-rcard-placeholder">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                          <rect x="3" y="3" width="18" height="18" rx="1.5"/>
                          <path d="M3 16l5-5 4 4 5-6 4 4" />
                          <circle cx="8.5" cy="8.5" r="1.3" fill="currentColor" stroke="none"/>
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="pd-rcard-body">
                    <p className="pd-rcard-name">{p.name}</p>
                    <p className="pd-rcard-price">R$ {p.price?.toFixed(2)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');

        .page {
          font-family: 'Inter', var(--body, sans-serif);
        }

        .pd-loader {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: calc(100vh - 64px);
          gap: 16px;
        }

        /* Breadcrumb */
        .pd-breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: var(--muted);
          margin-top: 52px;
          letter-spacing: .01em;
        }
        .pd-breadcrumb a { transition: color .15s; }
        .pd-breadcrumb a:hover { color: var(--accent); }
        .pd-bc-current {
          color: var(--text);
          font-weight: 500;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 360px;
        }

        /* Layout */
        .pd-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 64px;
          align-items: start;
          margin-top: 40px;
          margin-bottom: 80px;
        }
        @media (max-width: 768px) {
          .pd-layout { grid-template-columns: 1fr; gap: 32px; }
        }

        /* Gallery */
        .pd-gallery { position: sticky; top: 84px; }
        .pd-main-img {
          position: relative;
          width: 100%;
          aspect-ratio: 1 / 1;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .pd-img-el { width: 100%; height: 100%; object-fit: cover; }

        .pd-img-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          color: var(--muted);
        }
        .pd-img-placeholder svg { opacity: .5; }
        .pd-img-placeholder-label {
          font-size: 12px;
          letter-spacing: .08em;
          text-transform: uppercase;
          font-weight: 500;
        }

        .pd-sold-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,.6);
          backdrop-filter: blur(1px);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Space Grotesk', var(--display);
          font-size: 20px;
          font-weight: 700;
          color: var(--danger);
          letter-spacing: .14em;
          text-transform: uppercase;
        }

        /* Details */
        .pd-badges { display: flex; gap: 8px; margin-bottom: 18px; flex-wrap: wrap; }
        .pd-badge {
          font-family: 'Space Grotesk', var(--display);
          font-size: 11px;
          font-weight: 600;
          padding: 5px 12px;
          border-radius: 99px;
          text-transform: uppercase;
          letter-spacing: .08em;
        }
        .pd-badge-stock { background: rgba(34,197,94,.1); color: var(--success); border: 1px solid rgba(34,197,94,.28); }
        .pd-badge-low   { background: rgba(245,158,11,.1); color: var(--accent);  border: 1px solid var(--accent-dim); }
        .pd-badge-sold  { background: rgba(239,68,68,.1);  color: var(--danger);  border: 1px solid rgba(239,68,68,.28); }

        .pd-name {
          font-family: 'Space Grotesk', var(--display);
          font-size: clamp(26px, 3.2vw, 38px);
          font-weight: 700;
          line-height: 1.15;
          letter-spacing: -0.01em;
          margin-bottom: 14px;
        }
        .pd-description {
          color: var(--muted);
          font-size: 15px;
          line-height: 1.7;
          margin-bottom: 26px;
        }

        .pd-price-block {
          display: flex;
          align-items: baseline;
          gap: 10px;
          margin-bottom: 8px;
        }
        .pd-price {
          font-family: 'Space Grotesk', var(--display);
          font-size: clamp(32px, 4vw, 46px);
          font-weight: 700;
          color: var(--accent);
          line-height: 1;
          letter-spacing: -0.01em;
        }
        .pd-price-label { font-size: 13px; color: var(--muted); }

        .pd-divider { border: none; border-top: 1px solid var(--border); margin: 24px 0; }

        /* Quantidade */
        .pd-qty-row {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 28px;
          flex-wrap: wrap;
        }
        .pd-qty-label {
          font-size: 12px;
          font-weight: 600;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: .08em;
        }
        .pd-qty-ctrl {
          display: flex;
          align-items: center;
          gap: 4px;
          border: 1px solid var(--border);
          border-radius: 10px;
          overflow: hidden;
        }
        .pd-qty-ctrl .qty-btn {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--surface);
          border: none;
          color: var(--text);
          font-size: 16px;
          cursor: pointer;
          transition: background .15s;
        }
        .pd-qty-ctrl .qty-btn:hover:not(:disabled) { background: var(--surface2); }
        .pd-qty-ctrl .qty-btn:disabled { opacity: .35; cursor: not-allowed; }
        .pd-qty-val {
          font-family: 'Space Grotesk', var(--display);
          font-size: 15px;
          font-weight: 600;
          min-width: 32px;
          text-align: center;
        }
        .pd-stock-hint { font-size: 12px; color: var(--muted); }

        /* Ações */
        .pd-actions { display: flex; gap: 12px; margin-bottom: 36px; flex-wrap: wrap; }
        .pd-btn-add { flex: 1; justify-content: center; padding: 15px 24px; font-size: 15px; font-weight: 600; }
        .pd-btn-buy { flex: 1; justify-content: center; padding: 15px 24px; font-size: 15px; font-weight: 600; }

        /* Meta */
        .pd-meta {
          display: flex;
          flex-direction: column;
          gap: 14px;
          padding-top: 24px;
          border-top: 1px solid var(--border);
        }
        .pd-meta-item {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 13px;
          color: var(--muted);
        }
        .pd-meta-icon { flex-shrink: 0; color: var(--accent); opacity: .8; }

        /* Related */
        .pd-related { border-top: 1px solid var(--border); padding-top: 48px; padding-bottom: 48px; }
        .pd-related-title {
          font-family: 'Space Grotesk', var(--display);
          font-size: 22px;
          font-weight: 600;
          letter-spacing: -0.01em;
          margin-bottom: 24px;
        }
        .pd-related-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }
        @media (max-width: 900px) { .pd-related-grid { grid-template-columns: repeat(2,1fr); } }
        @media (max-width: 480px) { .pd-related-grid { grid-template-columns: 1fr; } }

        .pd-rcard {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          overflow: hidden;
          text-decoration: none;
          color: inherit;
          transition: border-color .2s, transform .2s;
        }
        .pd-rcard:hover { border-color: var(--accent); transform: translateY(-2px); }
        .pd-rcard-img {
          height: 140px;
          background: var(--surface2);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .pd-rcard-placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          color: var(--muted);
          opacity: .5;
        }
        .pd-rcard-body { padding: 12px 14px; }
        .pd-rcard-name {
          font-size: 13px;
          font-weight: 500;
          margin-bottom: 4px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .pd-rcard-price {
          font-family: 'Space Grotesk', var(--display);
          font-size: 14px;
          font-weight: 700;
          color: var(--accent);
        }
      `}</style>
    </div>
  )
}
