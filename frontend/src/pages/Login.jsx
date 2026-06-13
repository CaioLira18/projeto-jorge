import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth, useToast } from '../pages/Index'
import { api } from '../utils/api'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const toast = useToast()
  const nav = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) return toast('Preencha todos os campos', 'error')
    setLoading(true)
    try {
      const data = await api.login({ email, password })
      login(data)
      toast('Bem-vindo de volta!')
      nav('/')
    } catch (err) {
      toast(err.message || 'Credenciais inválidas', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <img className="nav-logo-img" style={{width: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', 'margin': '0 auto'}} src="https://res.cloudinary.com/dmf7ocduw/image/upload/v1781371590/logo_a06hef.png" alt="" />
        </div>

        <div className="auth-header">
          <h1 className="auth-title">Entrar na conta</h1>
          <p className="auth-subtitle">Acesse seus pedidos e favoritos</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label className="auth-label">E-mail</label>
            <input
              className="auth-input"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="auth-field">
            <label className="auth-label">Senha</label>
            <input
              className="auth-input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="auth-btn"
            disabled={loading}
          >
            {loading ? <span className="auth-spinner" /> : 'Entrar'}
          </button>
        </form>

        <p className="auth-footer">
          Não tem conta?{' '}
          <Link to="/register" className="auth-link">Cadastre-se</Link>
        </p>
      </div>

      <div className="auth-deco" aria-hidden="true">
        <div className="auth-deco-ring auth-deco-ring--1" />
        <div className="auth-deco-ring auth-deco-ring--2" />
        <div className="auth-deco-ring auth-deco-ring--3" />
      </div>
    </div>
  )
}
