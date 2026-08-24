import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { money, num, rango } from '../lib/format'
import { Placa, Hoja, Chip } from '../components/ui'

const tonoEstado = { abierto: 'bien', planificado: 'aviso', cerrado: 'neutro' }
const textoEstado = { abierto: 'En curso', planificado: 'Planificado', cerrado: 'Cerrado' }

export default function Eventos() {
  const { eventos, resultadoEvento } = useStore()
  const orden = { abierto: 0, planificado: 1, cerrado: 2 }
  const lista = [...eventos].sort((a, b) => orden[a.estado] - orden[b.estado])

  return (
    <div className="space-y-8">
      <Placa sub="Cada feria rinde por separado">Eventos</Placa>

      <div className="space-y-3">
        {lista.map(e => {
          const r = resultadoEvento(e.id)
          const sinVentas = r.tickets === 0
          return (
            <Hoja key={e.id} className="p-5 hover:border-higo/40 transition-colors">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <Chip tono={tonoEstado[e.estado]}>{textoEstado[e.estado]}</Chip>
                    <span className="eyebrow text-tinta-50">{e.provincia}</span>
                  </div>
                  <h2 className="font-display text-xl mt-2">
                    <Link to={`/eventos/${e.id}`} className="hover:text-higo">{e.nombre}</Link>
                  </h2>
                  <p className="text-xs text-tinta-50 mt-1">
                    {e.localidad} · {rango(e.desde, e.hasta)} · {e.equipo.length} personas
                  </p>
                </div>

                <div className="flex gap-8 sm:gap-10">
                  <div className="text-right">
                    <p className="eyebrow text-tinta-50">Vendido</p>
                    <p className="cifra text-lg font-semibold mt-1">
                      {sinVentas ? '—' : money(r.bruto)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="eyebrow text-tinta-50">Margen</p>
                    <p className={`cifra text-lg font-semibold mt-1 ${
                      sinVentas ? 'text-tinta-50' : r.margen >= 0 ? 'text-laurel' : 'text-membrillo'}`}>
                      {sinVentas ? '—' : money(r.margen)}
                    </p>
                  </div>
                </div>
              </div>

              {sinVentas && e.estado === 'planificado' && (
                <p className="text-xs text-tinta-50 mt-4 pt-4 border-t border-tinta/10">
                  Todavía no salió la mercadería. Hay {num(360)} frascos apartados en un remito en borrador.
                </p>
              )}
            </Hoja>
          )
        })}
      </div>
    </div>
  )
}
