import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useStore } from '../lib/store'

const enlaces = [
  { to: '/',         texto: 'Panel',    end: true },
  { to: '/eventos',  texto: 'Eventos' },
  { to: '/deposito', texto: 'Depósito' },
  { to: '/pedidos',  texto: 'Pedidos web' },
]

export default function Layout() {
  const { pedidos } = useStore()
  const { pathname } = useLocation()
  const pendientes = pedidos.filter(p => ['pendiente_pago', 'pagado', 'en_preparacion'].includes(p.estado)).length

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="border-b border-tinta/12 bg-papel/85 backdrop-blur sticky top-0 z-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex items-center gap-6 h-16">
            <Link to="/" className="shrink-0 leading-none">
              <span className="font-display italic text-xl text-higo">Cocina Antigua</span>
              <span className="eyebrow block text-tinta-50 mt-0.5">Gestión de ferias</span>
            </Link>

            <nav className="flex items-center gap-1 overflow-x-auto ml-auto">
              {enlaces.map(l => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.end}
                  className={({ isActive }) =>
                    `eyebrow whitespace-nowrap px-3 py-2 rounded-sm transition-colors ${
                      isActive ? 'bg-higo text-papel' : 'text-tinta-50 hover:text-tinta hover:bg-papel-2'
                    }`
                  }
                >
                  {l.texto}
                  {l.to === '/pedidos' && pendientes > 0 && (
                    <span className="ml-1.5 inline-block px-1.5 rounded-full bg-damasco text-tinta">{pendientes}</span>
                  )}
                </NavLink>
              ))}
              <Link
                to="/tienda"
                className={`eyebrow whitespace-nowrap px-3 py-2 rounded-sm border transition-colors ${
                  pathname.startsWith('/tienda')
                    ? 'bg-tinta text-papel border-tinta'
                    : 'border-tinta/25 text-tinta hover:bg-papel-2'
                }`}
              >
                Ver la tienda ↗
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto max-w-6xl w-full px-4 sm:px-6 py-8 sm:py-10">
        <Outlet />
      </main>

      <footer className="border-t border-tinta/12 mt-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-5 flex flex-wrap gap-3 justify-between">
          <p className="eyebrow text-tinta-50">Demostración con datos de ejemplo</p>
          <p className="eyebrow text-tinta-50">Ninguna operación se guarda al recargar</p>
        </div>
      </footer>
    </div>
  )
}
