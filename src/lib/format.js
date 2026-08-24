export const money = (n) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n || 0)

export const num = (n) => new Intl.NumberFormat('es-AR').format(n || 0)

export const fecha = (iso) =>
  new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })

export const hora = (iso) =>
  new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })

export const fechaLarga = (d = new Date()) => {
  const t = d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  return t.charAt(0).toUpperCase() + t.slice(1)
}

export const rango = (a, b) => {
  const f = (d) => new Date(d + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
  return `${f(a)} — ${f(b)}`
}

export const etiquetaEgreso = {
  rotura: 'Rotura',
  rotura_transito: 'Rotura en viaje',
  degustacion: 'Degustación',
  regalo: 'Regalo / muestra',
  consumo_interno: 'Consumo del equipo',
  canje: 'Canje',
  vencimiento: 'Vencido',
}

export const etiquetaPedido = {
  carrito: 'En el carrito',
  pendiente_pago: 'Esperando pago',
  pagado: 'Pagado',
  en_preparacion: 'Preparando',
  despachado: 'Despachado',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
}
