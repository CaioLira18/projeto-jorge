import React, { useEffect, useState } from 'react'
import { api } from '../utils/api'
import { useCart, useToast } from './Index' 

const EMOJI = ['📦','💻','📱','👟','🎧','📚','⌚','🎮']

export default function Home() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const { add, setOpen } = useCart()
  const toast = useToast()

  useEffect(() => {
    api.getProducts()
      .then(setProducts)
      .catch(() => toast('Erro ao carregar produtos', 'error'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleAdd = (p) => {
    add(p)
    toast(`${p.name} adicionado ao carrinho`)
    setOpen(true)
  }

  return (
    <div className="page">
      <div className="container">
        <div className="hero">
          <h1 className="hero-title">Tudo o que você<br/><em>precisa aqui.</em></h1>
          <p className="text-muted" style={{fontSize:16,maxWidth:480}}>
            Produtos selecionados com entrega rápida e segura.
          </p>
        </div>

        <div style={{marginBottom:24}}>
          <input
            placeholder="Buscar produtos..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{maxWidth:400}}
          />
        </div>

        {loading
          ? <div style={{display:'flex',justifyContent:'center',padding:60}}><div className="spinner"/></div>
          : filtered.length === 0
            ? <p className="text-muted text-center" style={{padding:60}}>Nenhum produto encontrado.</p>
            : <div className="grid-4">
                {filtered.map((p, i) => (
                  <div className="product-card" key={p.id}>
                    <div className="product-img">{EMOJI[i % EMOJI.length]}</div>
                    <div className="product-info">
                      <div className="product-name">{p.name}</div>
                      <div className="text-muted" style={{fontSize:13,marginTop:2,marginBottom:8}}>
                        {p.description || 'Sem descrição'}
                      </div>
                      <div className="product-price">R$ {p.price?.toFixed(2)}</div>
                      <div className="product-stock">
                        {p.stock > 0 ? `${p.stock} em estoque` : <span className="text-danger">Sem estoque</span>}
                      </div>
                      <button
                        className="btn btn-primary btn-sm w-full"
                        style={{marginTop:12}}
                        disabled={p.stock === 0}
                        onClick={() => handleAdd(p)}
                      >
                        Adicionar ao carrinho
                      </button>
                    </div>
                  </div>
                ))}
              </div>
        }
      </div>
    </div>
  )
}
