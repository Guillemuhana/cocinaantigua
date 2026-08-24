import { useState } from 'react'
import { Link } from 'react-router-dom'
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

const filtros = [
  { id: 'todos',      texto: 'Todos' },
  { id: 'minorista',  texto: 'Del público' },
  { id: 'mayorista',  texto: 'De revendedores' },
]

export default function Pedidos() {
  const s = useStore()
  const [filtro, setFiltro] = useState('todos')

  const todos = [...s.pedidos].sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
  const lista = filtro === 'todos' ? todos : todos.filter(p => (p.canal || 'minorista') === filtro)
  const cuantos = (id) => id === 'todos' ? todos.length : todos.filter(p => (p.canal || 'minorista') === id).length

  return (
    <div className="space-y-10">
      <Placa sub="Las compras que entran por la tienda online, en el orden en que llegaron">Pedidos de la web</Placa>

      <p className="text-sm text-tinta-50 max-w-prose leading-relaxed">
        Entran juntos los pedidos del público y los de los revendedores. El stock no se descuenta
        cuando alguien compra: se descuenta cuando la plata está acreditada. Mientras tanto queda
        reservado 48 horas y después se libera solo.
      </p>

      <div className="flex flex-wrap gap-1">
        {filtros.map(f => (
          <button key={f.id} onClick={() => setFiltro(f.id)}
            className={`text-sm font-medium px-4 py-2 rounded-lg transition-colors ${
              filtro === f.id ? 'bg-higo text-papel' : 'text-tinta-50 hover:text-tinta hover:bg-papel-2'}`}>
            {f.texto}
            <span className={`ml-2 cifra ${filtro === f.id ? 'text-papel/70' : 'text-tinta-50'}`}>{cuantos(f.id)}</span>
          </button>
        ))}
      </div>

      <div className="escalona space-y-4">
        {lista.map(pd => {
          const sub = pd.items.reduce((a, i) => a + i.cantidad * i.precio, 0)
          const paso = siguiente[pd.estado]
          return (
            <Hoja key={pd.id} viva className="p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="cifra text-sm text-tinta-50">#{pd.numero}</span>
                    <Chip tono={tono[pd.estado]}>{etiquetaPedido[pd.estado]}</Chip>
                    {pd.canal === 'mayorista' && <Chip tono="marca">Revendedor</Chip>}
                  </div>
                  <p className="text-lg font-semibold tracking-tight mt-1.5">
                    {pd.negocio || pd.cliente}
                  </p>
                  <p className="text-xs text-tinta-50 mt-0.5">
                    {pd.negocio && `${pd.cliente} · `}{pd.localidad} · {fecha(pd.fecha)} {hora(pd.fecha)}
                    {pd.cuit && ` · CUIT ${pd.cuit}`}
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
                  <div className="flex flex-wrap justify-end gap-2 mt-3">
                    <Link to={`/reportes/remito/${pd.id}`}
                      className="btn bg-papel border border-tinta/15 px-4 py-2.5 rounded-xl text-sm hover:bg-papel-2 hover:border-tinta/30">
                      Remito ↓
                    </Link>
                    {paso && (
                      <Boton
                        variante="fantasma"
                        onClick={() => s.dispatch({ type: 'PEDIDO_ESTADO', payload: { id: pd.id, estado: paso.estado } })}>
                        {paso.texto}
                      </Boton>
                    )}
                  </div>
                </div>
              </div>
            </Hoja>
          )
        })}
      </div>
    </div>
  )
}
