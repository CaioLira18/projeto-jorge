import React from 'react'
import { Link } from 'react-router-dom'

export function PaginaRestrita() {
  return (
    <div className="restricted-page">
      <div className="restricted-box">
        <h1 className="restricted-title">Acesso restrito</h1>
        <p className="restricted-desc">Você não tem permissão para acessar esta página.</p>
        <Link to="/" className="restricted-btn">Voltar para a loja</Link>
      </div>
    </div>
  )
}
