import { useParams, Navigate } from 'react-router-dom'
import { useStore } from '../../lib/store'
import { money, num, fecha } from '../../lib/format'
import Documento, { Bloque, Renglones, Tabla } from '../../components/Documento'

/* La hoja que va adentro de la caja. Cumple dos funciones a la vez: le dice
   a quien arma el paquete qué poner, y le dice al que lo recibe qué le
   mandaron y a quién escribirle si algo llegó roto. */
export default function Remito() {
  const { id } = useParams()
  const s = useStore()
  const pd = s.pedidos.find(p => p.id === id)
  if (!pd) return <Navigate to="/pedidos" replace />

  const mayorista = pd.canal === 'mayorista'
  const sub = pd.items.reduce((a, i) => a + i.cantidad * i.precio, 0)
  const frascos = pd.items.reduce((a, i) => a + i.cantidad, 0)

  const csv = () => [
    { titulo: `REMITO ${pd.numero}`, columnas: ['Concepto', 'Valor'], filas: [
      ['Numero', pd.numero],
      ['Canal', mayorista ? 'Mayorista' : 'Publico'],
      ...(pd.negocio ? [['Negocio', pd.negocio]] : []),
      ...(pd.cuit ? [['CUIT', pd.cuit]] : []),
      ['Cliente', pd.cliente], ['Mail', pd.email], ['Localidad', pd.localidad],
      ['Fecha', pd.fecha],
    ]},
    { titulo: 'CONTENIDO', columnas: ['Producto', 'Cantidad', 'Precio unitario', 'Subtotal'],
      filas: pd.items.map(i => {
        const p = s.producto(i.productoId)
        return [p?.nombre, i.cantidad, i.precio, i.cantidad * i.precio]
      }) },
    { titulo: 'TOTALES', columnas: ['Concepto', 'Importe'], filas: [
      ['Frascos', frascos], ['Subtotal', sub], ['Envio', pd.envio || 0], ['Total', sub + (pd.envio || 0)],
    ]},
  ]

  return (
    <Documento
      titulo={`Remito #${pd.numero}`}
      subtitulo={mayorista ? 'Pedido mayorista' : 'Pedido de la tienda online'}
      volverA="/pedidos" volverTexto="Volver a los pedidos"
      csv={csv}
    >
      <Bloque titulo="Para">
        <p className="text-lg font-semibold tracking-tight">{pd.negocio || pd.cliente}</p>
        <div className="text-sm text-tinta-50 mt-1 space-y-0.5">
          {pd.negocio && <p>A la atención de {pd.cliente}</p>}
          {pd.cuit && <p>CUIT {pd.cuit}</p>}
          <p>{pd.localidad}</p>
          <p>{pd.email}</p>
          <p>Pedido del {fecha(pd.fecha)}</p>
        </div>
      </Bloque>

      <Bloque titulo="Contenido del paquete">
        <Tabla
          columnas={['Producto', 'Cant.', 'Unitario', 'Subtotal']}
          filas={pd.items.map(i => {
            const p = s.producto(i.productoId)
            return [
              `${p?.nombre} · ${p?.presentacion} g`,
              num(i.cantidad), money(i.precio), money(i.cantidad * i.precio),
            ]
          })}
        />
        <div className="mt-5">
          <Renglones filas={[
            { etiqueta: `${num(frascos)} frascos`, valor: money(sub) },
            { etiqueta: 'Envío', valor: pd.envio ? money(pd.envio) : 'Sin cargo' },
            { etiqueta: 'Total', valor: money(sub + (pd.envio || 0)), fuerte: true },
          ]} />
        </div>
        <p className="text-xs text-tinta-50 mt-4">
          Pagado por {pd.medio}. Este remito no es factura.
        </p>
      </Bloque>

      {/* Casilleros para tildar mientras se arma la caja */}
      <Bloque titulo="Control de armado" className="no-imprimir-nunca">
        <ul className="space-y-2 text-sm">
          {pd.items.map(i => (
            <li key={i.productoId} className="flex items-center gap-3">
              <span className="inline-block w-4 h-4 border border-tinta/40 rounded shrink-0" aria-hidden="true" />
              <span className="cifra font-semibold w-8">{num(i.cantidad)}</span>
              <span>{s.producto(i.productoId)?.nombre}</span>
            </li>
          ))}
          <li className="flex items-center gap-3 pt-2">
            <span className="inline-block w-4 h-4 border border-tinta/40 rounded shrink-0" aria-hidden="true" />
            <span>Envuelto con papel entre frasco y frasco</span>
          </li>
        </ul>
        <p className="text-xs text-tinta-50 mt-4">Armó ______________ Fecha ____/____/____</p>
      </Bloque>

      <div className="evitar-corte text-center pt-2">
        <p className="font-semibold">¡Gracias por elegirnos!</p>
        <p className="text-sm text-tinta-50 mt-1 max-w-sm mx-auto leading-relaxed">
          Si algún frasco llegó roto, escribinos por WhatsApp con una foto y te lo reponemos
          en el próximo envío.
        </p>
      </div>
    </Documento>
  )
}
