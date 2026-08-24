import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { money, num, rango } from '../lib/format'
import { Placa, Hoja, Estado } from '../components/ui'

/* Agrupadas por estado, con un título que dice qué es cada grupo. Ordenarlas
   en una sola lista larga obligaba a leer el cartelito de cada una. */
const grupos = [
  { estado: 'abierto',     titulo: 'Vendiendo ahora',   ayuda: 'El puesto está abierto en este momento.' },
  { estado: 'planificado', titulo: 'Todavía no empiezan', ayuda: 'Ya están agendadas. Falta que salga la mercadería.' },
  { estado: 'cerrado',     titulo: 'Ya terminaron',      ayuda: 'Cerradas, con la cuenta final hecha.' },
]

const tonoEstado = { abierto: 'bien', planificado: 'aviso', cerrado: 'neutro' }

export default function Eventos() {
  const { eventos, resultadoEvento } = useStore()

  return (
    <div className="space-y-12">
      <Placa sub="Cada feria lleva su propia cuenta: lo que vendió, lo que costó y con cuánto quedó">
        Ferias
      </Placa>

      {grupos.map(g => {
        const lista = eventos.filter(e => e.estado === g.estado)
        if (lista.length === 0) return null

        return (
          <section key={g.estado}>
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="text-xl">{g.titulo}</h2>
              <span className="text-sm text-tinta-50">
                {lista.length} {lista.length === 1 ? 'feria' : 'ferias'}
              </span>
            </div>
            <p className="text-sm text-tinta-50 mt-1 mb-4">{g.ayuda}</p>

            <div className="escalona space-y-4">
              {lista.map(e => {
                const r = resultadoEvento(e.id)
                const sinVentas = r.tickets === 0

                return (
                  <Hoja key={e.id} viva className="p-6">
                    <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
                      <div className="min-w-0">
                        <Estado tono={tonoEstado[e.estado]} vivo={e.estado === 'abierto'}>
                          {e.provincia}
                        </Estado>
                        <h3 className="text-xl mt-2">
                          <Link to={`/eventos/${e.id}`} className="hover:text-higo">{e.nombre}</Link>
                        </h3>
                        <p className="text-sm text-tinta-50 mt-1">
                          {e.localidad} · {rango(e.desde, e.hasta)} ·{' '}
                          {e.equipo.length} {e.equipo.length === 1 ? 'persona atendiendo' : 'personas atendiendo'}
                        </p>
                      </div>

                      {sinVentas ? (
                        <p className="text-sm text-tinta-50">Todavía no vendió nada</p>
                      ) : (
                        <div className="flex gap-8 sm:gap-12">
                          <div className="text-right">
                            <p className="text-xs font-medium text-tinta-50">Vendido</p>
                            <p className="cifra text-xl font-bold mt-1">{money(r.bruto)}</p>
                            <p className="text-xs text-tinta-50 mt-0.5">{num(r.unidades)} frascos</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-medium text-tinta-50">Ganancia</p>
                            <p className={`cifra text-xl font-bold mt-1 ${
                              r.margen >= 0 ? 'text-laurel' : 'text-membrillo'}`}>
                              {money(r.margen)}
                            </p>
                            <p className="text-xs text-tinta-50 mt-0.5">
                              {r.margen >= 0 ? 'quedó a favor' : 'quedó en contra'}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {sinVentas && e.estado === 'planificado' && (
                      <p className="text-sm text-tinta-50 mt-5 pt-5 border-t border-tinta/10">
                        Hay {num(360)} frascos apartados en un remito en borrador, esperando que
                        salga el camión.
                      </p>
                    )}
                  </Hoja>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}
