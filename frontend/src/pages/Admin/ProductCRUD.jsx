import React, { useEffect, useState, useCallback } from 'react'
import { useAuth, useToast } from '../Index'
import { api } from '../../utils/api'
import { PaginaRestrita } from '../PaginaRestrita'

const CATEGORIES = [
  'CONSOLES', 'GAMES', 'BOOKS', 'ACCESSORIES',
  'GPU', 'CPU', 'MONITOR', 'MOUSE', 'KEYBOARD', 'HEADPHONES',
]

const EMPTY_FORM = { name: '', description: '', price: '', stock: '', imageUrl: '', category: '' }

const stockStatus = (stock) => {
  if (stock === 0) return { label: 'Sem estoque', cls: 'crud-badge--out' }
  if (stock <= 5) return { label: 'Estoque baixo', cls: 'crud-badge--low' }
  return { label: 'Disponível', cls: 'crud-badge--ok' }
}

export default function ProductCRUD() {
  const { user } = useAuth()
  const toast = useToast()

  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)

  const [modal, setModal] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  const [delTarget, setDelTarget] = useState(null)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.getProducts()
      setProducts(data)
    } catch (err) {
      toast(err.message || 'Erro ao carregar produtos', 'error')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  const openCreate = () => {
    setEditId(null)
    setForm(EMPTY_FORM)
    setFormError('')
    setModal(true)
  }

  const openEdit = (p) => {
    setEditId(p.id)
    setForm({ name: p.name, description: p.description || '', price: p.price, stock: p.stock, imageUrl: p.imageUrl || '', category: p.category || '' })
    setFormError('')
    setModal(true)
  }

  const closeModal = () => {
    setModal(false)
    setFormError('')
  }

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.name.trim() || form.price === '' || !form.category) {
      setFormError('Nome, preço e categoria são obrigatórios')
      return
    }
    setSaving(true)
    setFormError('')
    try {
      const body = {
        name: form.name.trim(),
        description: form.description.trim(),
        price: parseFloat(form.price),
        stock: parseInt(form.stock) || 0,
        imageUrl: form.imageUrl.trim(),
        category: form.category,
      }
      const tok = user?.token || ''
      if (editId) {
        await api.updateProduct(editId, body, tok)
        toast('Produto atualizado')
      } else {
        await api.createProduct(body, tok)
        toast('Produto criado')
      }
      closeModal()
      fetchProducts()
    } catch (err) {
      setFormError(err.message || 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  const confirmDel = async () => {
    try {
      const tok = user?.token || ''
      await api.deleteProduct(delTarget.id, tok)
      toast('Produto removido')
      setDelTarget(null)
      fetchProducts()
    } catch (err) {
      toast(err.message || 'Erro ao remover', 'error')
      setDelTarget(null)
    }
  }

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.description || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.category || '').toLowerCase().includes(search.toLowerCase())
  )

  const statLow = products.filter(p => p.stock > 0 && p.stock <= 5).length
  const statOut = products.filter(p => p.stock === 0).length

  if (user?.role !== 'admin') return <PaginaRestrita />

  return (
    <div className="crud-page">
      <div className="crud-stats">
        <div className="crud-stat">
          <span className="crud-stat__label">Total de produtos</span>
          <span className="crud-stat__value">{products.length}</span>
        </div>
        <div className="crud-stat">
          <span className="crud-stat__label">Estoque baixo</span>
          <span className="crud-stat__value crud-stat__value--warn">{statLow}</span>
        </div>
        <div className="crud-stat">
          <span className="crud-stat__label">Sem estoque</span>
          <span className="crud-stat__value crud-stat__value--danger">{statOut}</span>
        </div>
      </div>

      <div className="crud-toolbar">
        <div className="crud-search">
          <svg className="crud-search__icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            className="crud-search__input"
            type="text"
            placeholder="Buscar produtos..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button className="crud-btn-primary" onClick={openCreate}>
          + Novo produto
        </button>
      </div>

      <div className="crud-table-wrap">
        {loading ? (
          <div className="crud-empty">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="crud-empty">Nenhum produto encontrado</div>
        ) : (
          <table className="crud-table">
            <thead>
              <tr>
                <th>Imagem</th>
                <th>Nome</th>
                <th>Descrição</th>
                <th>Categoria</th>
                <th>Preço</th>
                <th>Estoque</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const { label, cls } = stockStatus(p.stock)
                return (
                  <tr key={p.id}>
                    <td>
                      {p.imageUrl
                        ? <img src={p.imageUrl} alt={p.name} className="crud-td--img" />
                        : <span className="crud-td--no-img">—</span>}
                    </td>
                    <td className="crud-td--name">{p.name}</td>
                    <td>{p.description}</td>
                    <td>{p.category || '—'}</td>
                    <td>R$ {parseFloat(p.price).toFixed(2)}</td>
                    <td>{p.stock}</td>
                    <td><span className={`crud-badge ${cls}`}>{label}</span></td>
                    <td className="crud-td--actions">
                      <button className="crud-act-btn" onClick={() => openEdit(p)} title="Editar">
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button className="crud-act-btn crud-act-btn--del" onClick={() => setDelTarget(p)} title="Remover">
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <div className="crud-overlay">
          <div className="crud-modal">
            <div className="crud-modal__header">
              <h2 className="crud-modal__title">{editId ? 'Editar produto' : 'Novo produto'}</h2>
              <button className="crud-modal__close" onClick={closeModal} aria-label="Fechar">✕</button>
            </div>

            <form className="crud-form" onSubmit={handleSave}>
              <div className="crud-field">
                <label className="crud-label">Nome *</label>
                <input className="crud-input" name="name" value={form.name} onChange={handleChange} placeholder="Ex: Camiseta Premium" />
              </div>
              <div className="crud-field">
                <label className="crud-label">Descrição</label>
                <textarea className="crud-input crud-input--textarea" name="description" value={form.description} onChange={handleChange} placeholder="Breve descrição do produto" />
              </div>
              <div className="crud-field">
                <label className="crud-label">URL da imagem</label>
                <input className="crud-input" name="imageUrl" value={form.imageUrl} onChange={handleChange} placeholder="https://..." />
              </div>
              <div className="crud-field">
                <label className="crud-label">Categoria *</label>
                <select className="crud-input" name="category" value={form.category} onChange={handleChange}>
                  <option value="">Selecione uma categoria</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="crud-field-row">
                <div className="crud-field">
                  <label className="crud-label">Preço (R$) *</label>
                  <input className="crud-input" name="price" type="number" step="0.01" min="0" value={form.price} onChange={handleChange} placeholder="0.00" />
                </div>
                <div className="crud-field">
                  <label className="crud-label">Estoque</label>
                  <input className="crud-input" name="stock" type="number" min="0" value={form.stock} onChange={handleChange} placeholder="0" />
                </div>
              </div>

              {formError && <p className="crud-form__error">{formError}</p>}

              <div className="crud-modal__footer">
                <button type="button" className="crud-btn-cancel" onClick={closeModal}>Cancelar</button>
                <button type="submit" className="crud-btn-primary" disabled={saving}>
                  {saving ? <span className="crud-spinner" /> : 'Salvar produto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {delTarget && (
        <div className="crud-overlay">
          <div className="crud-modal crud-modal--confirm">
            <svg className="crud-confirm__icon" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            <p className="crud-confirm__text">
              Remover <strong>{delTarget.name}</strong>?<br />
              Esta ação não pode ser desfeita.
            </p>
            <div className="crud-modal__footer crud-modal__footer--center">
              <button className="crud-btn-cancel" onClick={() => setDelTarget(null)}>Cancelar</button>
              <button className="crud-btn-danger" onClick={confirmDel}>Remover</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
