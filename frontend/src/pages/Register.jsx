import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useToast } from '../pages/Index'
import { api } from '../utils/api'

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const toast = useToast()
  const nav = useNavigate()

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.password) return toast('Preencha todos os campos', 'error')
    if (form.password !== form.confirm) return toast('As senhas não coincidem', 'error')
    if (form.password.length < 6) return toast('Senha deve ter ao menos 6 caracteres', 'error')

    setLoading(true)
    try {
      await api.register({ name: form.name, email: form.email, password: form.password })
      toast('Conta criada! Faça login para continuar.')
      nav('/login')
    } catch (err) {
      toast(err.message || 'Erro ao criar conta', 'error')
    } finally {
      setLoading(false)
    }
  }

  const strength = form.password.length === 0 ? 0
    : form.password.length < 6 ? 1
    : form.password.length < 10 ? 2
    : 3

  return (
    <div className="reg-page">
      <div className="reg-card">
        <div className="reg-brand">
          <img className="nav-logo-img" style={{width: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', 'margin': '0 auto'}} src="https://res.cloudinary.com/dmf7ocduw/image/upload/v1781371590/logo_a06hef.png" alt="" />
        </div>

        <div className="reg-header">
          <h1 className="reg-title">Criar conta</h1>
          <p className="reg-subtitle">Rápido, grátis e sem burocracia</p>
        </div>

        <form className="reg-form" onSubmit={handleSubmit}>
          <div className="reg-field">
            <label className="reg-label">Nome</label>
            <input
              className="reg-input"
              type="text"
              placeholder="Seu nome completo"
              value={form.name}
              onChange={set('name')}
              autoComplete="name"
            />
          </div>

          <div className="reg-field">
            <label className="reg-label">E-mail</label>
            <input
              className="reg-input"
              type="email"
              placeholder="seu@email.com"
              value={form.email}
              onChange={set('email')}
              autoComplete="email"
            />
          </div>

          <div className="reg-field">
            <label className="reg-label">Senha</label>
            <input
              className="reg-input"
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={form.password}
              onChange={set('password')}
              autoComplete="new-password"
            />
            {form.password.length > 0 && (
              <div className="reg-strength">
                <div className="reg-strength-bars">
                  <div className={`reg-strength-bar ${strength >= 1 ? `reg-strength-bar--${strength}` : ''}`} />
                  <div className={`reg-strength-bar ${strength >= 2 ? `reg-strength-bar--${strength}` : ''}`} />
                  <div className={`reg-strength-bar ${strength >= 3 ? `reg-strength-bar--${strength}` : ''}`} />
                </div>
                <span className="reg-strength-label">
                  {strength === 1 ? 'Fraca' : strength === 2 ? 'Média' : 'Forte'}
                </span>
              </div>
            )}
          </div>

          <div className="reg-field">
            <label className="reg-label">Confirmar senha</label>
            <input
              className={`reg-input ${form.confirm && form.confirm !== form.password ? 'reg-input--error' : ''}`}
              type="password"
              placeholder="Repita a senha"
              value={form.confirm}
              onChange={set('confirm')}
              autoComplete="new-password"
            />
            {form.confirm && form.confirm !== form.password && (
              <span className="reg-error-msg">As senhas não coincidem</span>
            )}
          </div>

          <button
            type="submit"
            className="reg-btn"
            disabled={loading}
          >
            {loading ? <span className="reg-spinner" /> : 'Criar conta'}
          </button>
        </form>

        <p className="reg-footer">
          Já tem conta?{' '}
          <Link to="/login" className="reg-link">Entrar</Link>
        </p>
      </div>

      <div className="reg-deco" aria-hidden="true">
        <div className="reg-deco-ring reg-deco-ring--1" />
        <div className="reg-deco-ring reg-deco-ring--2" />
      </div>
    </div>
  )
}
