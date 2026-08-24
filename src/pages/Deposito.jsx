import { useStore } from '../lib/store'
import { num } from '../lib/format'
import { Placa, Hoja, Chip } from '../components/ui'

export default function Deposito() {
  const { stockWeb } = useStore()
  const filas = stockWeb()

  return (
    <div className="space-y-8">
      <Placa sub="Un solo depósito para las ferias y la tienda">Depósito central</Placa>

      <p className="text-sm text-tinta-50 max-w-prose leading-relaxed">
        La tienda no puede vender todo lo que hay en el galpón. Del stock se descuenta lo que ya
        está apartado para una feria, lo que tienen reservado los pedidos sin pagar, y un colchón
        fijo que se protege para no quedarse sin mercadería antes de salir de viaje. Lo que queda
        es lo único que la web muestra como disponible.
      </p>

      <Hoja className="entra overflow-x-auto">
        <table className="w-full text-sm min-w-[680px]">
          <thead>
            <tr className="border-b border-tinta/12 text-left">
              <th className="eyebrow text-tinta-50 font-normal px-4 py-3">Producto</th>
              <th className="eyebrow text-tinta-50 font-normal px-4 py-3 text-right">En depósito</th>
              <th className="eyebrow text-tinta-50 font-normal px-4 py-3 text-right">Apartado ferias</th>
              <th className="eyebrow text-tinta-50 font-normal px-4 py-3 text-right">Reservado web</th>
              <th className="eyebrow text-tinta-50 font-normal px-4 py-3 text-right">Colchón</th>
              <th className="eyebrow text-tinta-50 font-normal px-4 py-3 text-right">Vende la web</th>
            </tr>
          </thead>
          <tbody>
            {filas.map(f => (
              <tr key={f.producto.id} className="border-b border-tinta/8 last:border-0">
                <td className="px-4 py-3">
                  <span className="inline-block w-2 h-2 rounded-full mr-2 align-middle" style={{ background: f.producto.color }} />
                  {f.producto.nombre}
                  {!f.producto.visibleWeb && <Chip>No publicado</Chip>}
                </td>
                <td className="px-4 py-3 text-right cifra">{num(f.stock)}</td>
                <td className="px-4 py-3 text-right cifra text-tinta-50">{f.comprometido ? `−${num(f.comprometido)}` : '—'}</td>
                <td className="px-4 py-3 text-right cifra text-tinta-50">{f.reservado ? `−${num(f.reservado)}` : '—'}</td>
                <td className="px-4 py-3 text-right cifra text-tinta-50">{f.colchon ? `−${num(f.colchon)}` : '—'}</td>
                <td className={`px-4 py-3 text-right cifra font-semibold ${f.disponible === 0 ? 'text-membrillo' : ''}`}>
                  {num(f.disponible)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Hoja>
    </div>
  )
}
