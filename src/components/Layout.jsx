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
    <div className="min-h-dvh flex flex-col bg-papel-2/40">
      <header className="border-b border-tinta/10 bg-papel/80 backdrop-blur-md sticky top-0 z-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex items-center gap-6 h-16">
            <Link to="/" className="shrink-0 flex items-center gap-2.5 leading-none">
              <img src="/marca.png" alt="Cocina Antigua" width="32" height="32" className="w-8 h-8 shrink-0" />
              <span className="hidden sm:block">
                <span className="block text-[15px] font-semibold tracking-tight">Cocina Antigua</span>
                <span className="block text-xs text-tinta-50 mt-0.5">Gestión de ferias</span>
              </span>
            </Link>

            <nav className="flex items-center gap-1 overflow-x-auto ml-auto">
              {enlaces.map(l => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.end}
                  className={({ isActive }) =>
                    `text-sm font-medium whitespace-nowrap px-3 py-2 rounded-lg transition-colors ${
                      isActive ? 'bg-higo text-papel' : 'text-tinta-50 hover:text-tinta hover:bg-papel-2'
                    }`
                  }
                >
                  {l.texto}
                  {l.to === '/pedidos' && pendientes > 0 && (
                    <span className="ml-1.5 inline-block min-w-5 text-center text-xs font-semibold px-1.5 py-0.5 rounded-full bg-membrillo text-papel">
                      {pendientes}
                    </span>
                  )}
                </NavLink>
              ))}
              <Link
                to="/tienda"
                className={`text-sm font-medium whitespace-nowrap px-3 py-2 rounded-lg border transition-colors ${
                  pathname.startsWith('/tienda')
                    ? 'bg-tinta text-papel border-tinta'
                    : 'bg-papel border-tinta/15 text-tinta hover:bg-papel-2'
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

      <footer className="border-t border-tinta/10 mt-8 bg-papel">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-5 flex flex-wrap gap-3 justify-between">
          <p className="text-xs text-tinta-50">Demostración con datos de ejemplo</p>
          <p className="text-xs text-tinta-50">Ninguna operación se guarda al recargar</p>
        </div>
      </footer>
    </div>
  )
}
