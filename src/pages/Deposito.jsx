import { useStore } from '../lib/store'
import { num } from '../lib/format'
import { Placa, Hoja, Chip } from '../components/ui'

/* ===========================================================================
   Depósito central.

   La pregunta que contesta esta pantalla es una sola: de todo lo que hay en
   el galpón, ¿cuánto puede vender la web sin dejar sin mercadería a la feria
   del mes que viene?

   Por eso cada producto se muestra como la cuenta que es, con los descuentos
   uno abajo del otro, y no como una tabla de números sueltos.
   =========================================================================== */

export default function Deposito() {
  const { stockWeb } = useStore()
  const filas = stockWeb()

  return (
    <div className="space-y-10">
      <Placa sub="Un solo galpón abastece las ferias y la tienda online">
        Depósito central
      </Placa>

      {/* La regla, explicada una vez y en un solo lugar */}
      <Hoja className="entra p-6 sm:p-7">
        <h2 className="text-lg">Por qué la web no vende todo lo que hay</h2>
        <p className="text-sm text-tinta-50 mt-2.5 leading-relaxed max-w-prose">
          Antes de publicar un frasco en la tienda hay que restarle tres cosas: lo que ya está
          cargado en un remito para la próxima feria, lo que tienen reservado los pedidos que
          todavía no se pagaron, y un colchón fijo que se guarda para no salir de viaje sin
          mercadería. Lo que sobra es lo único que la web muestra como disponible.
        </p>
      </Hoja>

      <div className="escalona space-y-4">
        {filas.map(f => {
          const descuentos = [
            { etiqueta: 'apartado para la próxima feria', valor: f.comprometido },
            { etiqueta: 'reservado por pedidos sin pagar', valor: f.reservado },
            { etiqueta: 'colchón que se guarda siempre', valor: f.colchon },
          ].filter(d => d.valor > 0)

          const agotado = f.disponible === 0

          return (
            <Hoja key={f.producto.id} className="p-6">
              <div className="flex flex-wrap items-center gap-2.5 mb-5">
                <span
                  className="inline-block w-3 h-3 rounded-full shrink-0"
                  style={{ background: f.producto.color }}
                />
                <h3 className="text-lg">{f.producto.nombre}</h3>
                {!f.producto.visibleWeb && <Chip>No se publica en la web</Chip>}
                {f.producto.visibleWeb && agotado && <Chip tono="mal">Agotado en la web</Chip>}
              </div>

              {/* La cuenta, renglón por renglón */}
              <div className="grid gap-x-8 gap-y-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                <dl className="space-y-1.5 text-sm">
                  <div className="flex items-baseline gap-3">
                    <dd className="cifra w-16 shrink-0 text-right font-semibold">{num(f.stock)}</dd>
                    <dt className="text-tinta-50">frascos en el galpón</dt>
                  </div>

                  {descuentos.map(d => (
                    <div key={d.etiqueta} className="flex items-baseline gap-3">
                      <dd className="cifra w-16 shrink-0 text-right text-damasco">−{num(d.valor)}</dd>
                      <dt className="text-tinta-50">{d.etiqueta}</dt>
                    </div>
                  ))}

                  {descuentos.length === 0 && (
                    <div className="flex items-baseline gap-3">
                      <dd className="cifra w-16 shrink-0 text-right text-tinta-50">—</dd>
                      <dt className="text-tinta-50">sin nada apartado</dt>
                    </div>
                  )}
                </dl>

                {/* El resultado, separado del resto porque es lo que se viene a buscar */}
                <div className={`rounded-xl px-5 py-4 text-center sm:text-right sm:min-w-44 ${
                  agotado ? 'bg-membrillo/8' : 'bg-laurel/8'
                }`}>
                  <p className={`cifra text-3xl font-bold ${agotado ? 'text-membrillo' : 'text-laurel'}`}>
                    {num(f.disponible)}
                  </p>
                  <p className="text-xs font-medium text-tinta-50 mt-1">
                    {f.producto.visibleWeb
                      ? agotado ? 'no puede vender la web' : 'puede vender la web'
                      : 'quedan libres'}
                  </p>
                </div>
              </div>
            </Hoja>
          )
        })}
      </div>
    </div>
  )
}
