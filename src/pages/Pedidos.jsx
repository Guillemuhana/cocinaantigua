import { useStore } from '../lib/store'
import { money, num, fecha, hora, etiquetaPedido } from '../lib/format'
import { Placa, Hoja, Chip, Boton } from '../components/ui'

const tono = {
  pendiente_pago: 'aviso', pagado: 'marca', en_preparacion: 'marca',
  despachado: 'bien', entregado: 'bien', cancelado: 'mal',
}

const siguiente = {
  pendiente_pago: { estado: 'pagado',         texto: 'Marcar como pagado' },
  pagado:         { estado: 'en_preparacion', texto: 'Empezar a preparar' },
  en_preparacion: { estado: 'despachado',     texto: 'Marcar despachado' },
  despachado:     { estado: 'entregado',      texto: 'Marcar entregado' },
}

export default function Pedidos() {
  const s = useStore()
  const lista = [...s.pedidos].sort((a, b) => new Date(b.fecha) - new Date(a.fecha))

  return (
    <div className="space-y-10">
      <Placa sub="Compras hechas por internet">Pedidos de la tienda</Placa>

      <p className="text-sm text-tinta-50 max-w-prose leading-relaxed">
        El stock no se descuenta cuando alguien compra: se descuenta cuando la plata está acreditada.
        Mientras tanto queda reservado 48 horas y después se libera solo.
      </p>

      <div className="escalona space-y-4">
        {lista.map(pd => {
          const sub = pd.items.reduce((a, i) => a + i.cantidad * i.precio, 0)
          const paso = siguiente[pd.estado]
          return (
            <Hoja key={pd.id} viva className="p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="cifra text-sm text-tinta-50">#{pd.numero}</span>
                    <Chip tono={tono[pd.estado]}>{etiquetaPedido[pd.estado]}</Chip>
                  </div>
                  <p className="font-display text-lg mt-1.5">{pd.cliente}</p>
                  <p className="text-xs text-tinta-50 mt-0.5">
                    {pd.localidad} · {fecha(pd.fecha)} {hora(pd.fecha)}
                  </p>
                  <ul className="mt-3 space-y-0.5">
                    {pd.items.map(i => (
                      <li key={i.productoId} className="text-sm text-tinta-50">
                        <span className="cifra">{num(i.cantidad)}×</span> {s.producto(i.productoId)?.nombre}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="text-right shrink-0">
                  <p className="cifra text-xl font-semibold">{money(sub + pd.envio)}</p>
                  <p className="text-xs text-tinta-50 mt-1">
                    {pd.envio ? `incluye ${money(pd.envio)} de envío` : 'sin cargo de envío'}
                  </p>
                  {paso && (
                    <Boton
                      variante="fantasma"
                      className="mt-3"
                      onClick={() => s.dispatch({ type: 'PEDIDO_ESTADO', payload: { id: pd.id, estado: paso.estado } })}>
                      {paso.texto}
                    </Boton>
                  )}
                </div>
              </div>
            </Hoja>
          )
        })}
      </div>
    </div>
  )
}
