import { Link, NavLink, Outlet } from 'react-router-dom'
import { useStore } from '../lib/store'
import Firma from './Firma'
import BarraDemo from './BarraDemo'

/* Los íconos son de trazo y heredan el color: se ven bien en la barra de
   abajo, activos o no, sin necesitar dos versiones de cada uno. */
const iconos = {
  panel: 'M3 12h4l3 8 4-16 3 8h4',
  ferias: 'M4 9h16M4 9l1.5-4h13L20 9M4 9v10a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9M9 20v-6h6v6',
  deposito: 'M3 7l9-4 9 4v10l-9 4-9-4V7zM3 7l9 4M21 7l-9 4M12 11v10',
  pedidos: 'M6 2 4 6v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6l-2-4H6zM4 6h16M16 10a4 4 0 0 1-8 0',
}

const enlaces = [
  { to: '/',         texto: 'Panel',            corto: 'Panel',   icono: 'panel', end: true },
  { to: '/eventos',  texto: 'Ferias',           corto: 'Ferias',  icono: 'ferias' },
  { to: '/deposito', texto: 'Depósito',         corto: 'Depósito', icono: 'deposito' },
  { to: '/pedidos',  texto: 'Pedidos de la web', corto: 'Pedidos', icono: 'pedidos' },
]

function Icono({ d }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"
         strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true">
      <path d={d} />
    </svg>
  )
}

export default function Layout() {
  const { pedidos } = useStore()
  const pendientes = pedidos.filter(p => ['pendiente_pago', 'pagado', 'en_preparacion'].includes(p.estado)).length

  return (
    <div className="min-h-dvh flex flex-col bg-papel-2/50">
      <BarraDemo lado="sistema" />

      <header className="border-b border-tinta/10 bg-papel/80 backdrop-blur-md sticky top-0 z-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex items-center gap-6 h-16 md:h-24">
            <Link to="/" className="shrink-0 flex items-center gap-3 sm:gap-3.5 leading-none group">
              <img
                src="/marca.png"
                alt="Cocina Antigua"
                width="64" height="64"
                className="w-10 h-10 md:w-16 md:h-16 shrink-0 transition-transform duration-500 group-hover:rotate-180"
              />
              <span>
                <span className="block text-base md:text-xl font-bold tracking-tight leading-none">
                  Cocina Antigua
                </span>
                <span className="hidden md:block text-xs text-tinta-50 mt-1.5">
                  Gestión de ferias y tienda
                </span>
              </span>
            </Link>

            {/* En pantalla grande la navegación vive arriba… */}
            <nav className="hidden md:flex items-center gap-1 ml-auto">
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
            </nav>

            {/* …y en el celular sólo queda el pendiente más urgente a la vista */}
            {pendientes > 0 && (
              <Link to="/pedidos"
                className="md:hidden ml-auto inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-full bg-membrillo/10 text-membrillo">
                <span className="punto" />
                {pendientes} pendiente{pendientes === 1 ? '' : 's'}
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* pb-24 en celular deja lugar para la barra de abajo, que es fija */}
      <main className="flex-1 mx-auto max-w-6xl w-full px-4 sm:px-6 py-6 sm:py-10 md:py-12 pb-24 md:pb-12">
        <Outlet />
      </main>

      <footer className="border-t border-tinta/10 mt-8 bg-papel pb-20 md:pb-0">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 flex flex-wrap items-end gap-6 justify-between">
          <div className="space-y-1">
            <p className="text-xs text-tinta-50">Sistema interno · datos de ejemplo</p>
            <p className="text-xs text-tinta-50">Ninguna operación se guarda al recargar</p>
          </div>
          <Firma />
        </div>
      </footer>

      {/* Navegación de celular: abajo, donde llega el pulgar. Con área de
          toque de 56px de alto y respetando la franja del gesto de iOS. */}
      <nav className="md:hidden no-imprimir fixed bottom-0 inset-x-0 z-30 border-t border-tinta/10 bg-papel/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-4">
          {enlaces.map(l => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `relative flex flex-col items-center justify-center gap-1 h-14 text-[11px] font-medium transition-colors ${
                  isActive ? 'text-higo' : 'text-tinta-50'
                }`
              }
            >
              <Icono d={iconos[l.icono]} />
              {l.corto}
              {l.to === '/pedidos' && pendientes > 0 && (
                <span className="absolute top-1.5 right-[22%] w-2 h-2 rounded-full bg-membrillo" aria-hidden="true" />
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
