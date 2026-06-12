import React, { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { api } from '../utils/api'
import { useCart, useToast } from './Index'

const EMOJI = ['📦', '💻', '📱', '👟', '🎧', '📚', '⌚', '🎮']

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { add, setOpen } = useCart()
  const toast = useToast()

  const [product,  setProduct]  = useState(null)
  const [related,  setRelated]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [qty,      setQty]      = useState(1)
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
          all.filter(p => p.id !== prod.id).slice(0, 4)
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

  const emoji = EMOJI[product.id?.charCodeAt(0) % EMOJI.length] || '📦'
  const inStock = product.stock > 0
  const lowStock = inStock && product.stock <= 5

  return (
    <div className="page">
      <div className="container">

        {/* Breadcrumb */}
        <nav className="pd-breadcrumb">
          <Link to="/">Início</Link>
          <span>/</span>
          <Link to="/products">Produtos</Link>
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
                <span className="pd-img-emoji">{emoji}</span>
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
                <span className="pd-meta-icon">🚚</span>
                <span>Entrega rápida e segura</span>
              </div>
              <div className="pd-meta-item">
                <span className="pd-meta-icon">🔒</span>
                <span>Pagamento 100% seguro</span>
              </div>
              <div className="pd-meta-item">
                <span className="pd-meta-icon">↩️</span>
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
                <Link to={`/products/${p.id}`} className="pd-rcard" key={p.id}>
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
                    <span style={{ display: p.imageUrl ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', fontSize: 36 }}>
                      {EMOJI[i % EMOJI.length]}
                    </span>
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
          margin-bottom: 32px;
        }
        .pd-breadcrumb a:hover { color: var(--accent); }
        .pd-bc-current { color: var(--text); font-weight: 500; }

        /* Layout */
        .pd-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 56px;
          align-items: start;
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
        .pd-img-emoji { font-size: 96px; }
        .pd-sold-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,.55);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          font-weight: 700;
          color: var(--danger);
          letter-spacing: .08em;
          text-transform: uppercase;
        }

        /* Details */
        .pd-badges { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
        .pd-badge {
          font-size: 11px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 99px;
          text-transform: uppercase;
          letter-spacing: .05em;
        }
        .pd-badge-stock { background: rgba(34,197,94,.12); color: var(--success); border: 1px solid rgba(34,197,94,.25); }
        .pd-badge-low   { background: rgba(245,158,11,.12); color: var(--accent);  border: 1px solid var(--accent-dim); }
        .pd-badge-sold  { background: rgba(239,68,68,.12);  color: var(--danger);  border: 1px solid rgba(239,68,68,.25); }

        .pd-name {
          font-family: var(--display);
          font-size: clamp(24px, 3vw, 36px);
          font-weight: 700;
          line-height: 1.15;
          margin-bottom: 12px;
        }
        .pd-description {
          color: var(--muted);
          font-size: 15px;
          line-height: 1.7;
          margin-bottom: 24px;
        }

        .pd-price-block {
          display: flex;
          align-items: baseline;
          gap: 10px;
          margin-bottom: 8px;
        }
        .pd-price {
          font-family: var(--display);
          font-size: clamp(32px, 4vw, 48px);
          font-weight: 700;
          color: var(--accent);
          line-height: 1;
        }
        .pd-price-label { font-size: 13px; color: var(--muted); }

        .pd-divider { border: none; border-top: 1px solid var(--border); margin: 24px 0; }

        /* Quantidade */
        .pd-qty-row {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }
        .pd-qty-label { font-size: 13px; font-weight: 500; color: var(--muted); }
        .pd-qty-ctrl { display: flex; align-items: center; gap: 12px; }
        .pd-qty-val { font-size: 16px; font-weight: 600; min-width: 24px; text-align: center; }
        .pd-stock-hint { font-size: 12px; color: var(--muted); }

        /* Ações */
        .pd-actions { display: flex; gap: 12px; margin-bottom: 32px; flex-wrap: wrap; }
        .pd-btn-add { flex: 1; justify-content: center; padding: 14px 24px; font-size: 15px; }
        .pd-btn-buy { flex: 1; justify-content: center; padding: 14px 24px; font-size: 15px; }

        /* Meta */
        .pd-meta { display: flex; flex-direction: column; gap: 10px; }
        .pd-meta-item {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          color: var(--muted);
        }
        .pd-meta-icon { font-size: 16px; }

        /* Related */
        .pd-related { border-top: 1px solid var(--border); padding-top: 48px; padding-bottom: 48px; }
        .pd-related-title {
          font-family: var(--display);
          font-size: 22px;
          font-style: italic;
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
        .pd-rcard-body { padding: 12px 14px; }
        .pd-rcard-name { font-size: 13px; font-weight: 600; margin-bottom: 4px; }
        .pd-rcard-price { font-size: 14px; font-weight: 700; color: var(--accent); }
      `}</style>
    </div>
  )
}
