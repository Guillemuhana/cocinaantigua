import { NavLink } from 'react-router-dom'

/* Encabezado de pantalla: un título grande y, debajo, el contexto en gris.
   La jerarquía sale del tamaño y del peso, sin ornamento alrededor. */
export function Placa({ children, sub, className = '' }) {
  return (
    <div className={className}>
      <h1 className="text-2xl sm:text-3xl leading-tight">{children}</h1>
      {sub && <p className="text-sm text-tinta-50 mt-1.5">{sub}</p>}
    </div>
  )
}

export function Hoja({ children, className = '' }) {
  return <div className={`hoja rounded-xl ${className}`}>{children}</div>
}

export function Dato({ etiqueta, valor, detalle, tono = 'normal' }) {
  const color = {
    normal: 'text-tinta',
    bien:   'text-laurel',
    mal:    'text-membrillo',
    marca:  'text-higo',
  }[tono]
  return (
    <div>
      <p className="text-xs font-medium text-tinta-50">{etiqueta}</p>
      <p className={`cifra text-2xl font-semibold mt-1 ${color}`}>{valor}</p>
      {detalle && <p className="text-xs text-tinta-50 mt-1">{detalle}</p>}
    </div>
  )
}

/* Etiqueta de estado. Fondo tenue del mismo tono que el texto, sin borde. */
export function Chip({ children, tono = 'neutro' }) {
  const estilos = {
    neutro: 'bg-papel-2 text-tinta-50',
    marca:  'bg-higo/10 text-higo',
    bien:   'bg-laurel/10 text-laurel',
    mal:    'bg-membrillo/10 text-membrillo',
    aviso:  'bg-damasco/10 text-damasco',
  }[tono]
  return (
    <span className={`inline-flex items-center text-xs font-medium px-2 py-1 rounded-md ${estilos}`}>
      {children}
    </span>
  )
}

export function Boton({ children, variante = 'primario', className = '', ...props }) {
  const estilos = {
    primario: 'bg-higo text-papel hover:bg-higo-claro shadow-sm',
    accion:   'bg-higo text-papel hover:bg-higo-claro shadow-sm',
    fantasma: 'bg-papel border border-tinta/15 text-tinta hover:bg-papel-2',
  }[variante]
  return (
    <button className={`btn px-4 py-2.5 rounded-lg text-sm ${estilos} disabled:opacity-40 disabled:cursor-not-allowed ${className}`} {...props}>
      {children}
    </button>
  )
}

export function Vacio({ titulo, accion }) {
  return (
    <div className="text-center py-14">
      <p className="text-tinta-50">{titulo}</p>
      {accion && <div className="mt-4">{accion}</div>}
    </div>
  )
}

export function Tab({ to, children, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `text-sm font-medium px-3 py-2 rounded-lg transition-colors ${
          isActive ? 'bg-higo text-papel' : 'text-tinta-50 hover:text-tinta hover:bg-papel-2'
        }`
      }
    >
      {children}
    </NavLink>
  )
}

/* Barra proporcional. Se usa para stock y para participación por medio de pago. */
export function Barra({ valor, total, color = 'var(--color-higo)' }) {
  const pct = total > 0 ? Math.min(100, (valor / total) * 100) : 0
  return (
    <div className="h-2 bg-papel-2 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}
