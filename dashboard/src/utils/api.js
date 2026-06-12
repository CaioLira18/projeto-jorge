const BASE = '/api'

const headers = (token) => ({
  'Content-Type': 'application/json',
  ...(token ? { Authorization: `Bearer ${token}` } : {})
})

const req = async (method, path, body, token) => {
  const res = await fetch(BASE + path, {
    method,
    headers: headers(token),
    body: body ? JSON.stringify(body) : undefined
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Erro desconhecido')
  return data
}

export const api = {
  register: (body)           => req('POST', '/users/register', body),
  login:    (body)           => req('POST', '/users/login', body),
  getUser:  (id, token)      => req('GET', `/users/${id}`, null, token),

  getProducts: ()            => req('GET', '/products'),
  getProduct:  (id)          => req('GET', `/products/${id}`),
  createProduct: (body, tok) => req('POST', '/products', body, tok),
  updateProduct: (id, body, tok) => req('PUT', `/products/${id}`, body, tok),
  deleteProduct: (id, tok)       => req('DELETE', `/products/${id}`, null, tok),

  createOrder:  (body, tok)  => req('POST', '/orders', body, tok),
  getOrders:    (uid, tok)   => req('GET', `/orders/${uid}`, null, tok),

  getStatus: ()              => req('GET', '/status'),
}
