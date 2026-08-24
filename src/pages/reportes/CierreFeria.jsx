import { useParams, Navigate } from 'react-router-dom'
import { useStore } from '../../lib/store'
import { money, num, rango, etiquetaEgreso } from '../../lib/format'
import Documento, { Bloque, Renglones, Tabla } from '../../components/Documento'

const nombreMedio = {
  efectivo: 'Efectivo', posnet: 'Tarjeta (posnet)',
  transferencia: 'Transferencia', qr: 'QR / billetera',
}

const comoCobra = { jornal: 'Por día', comision: 'A comisión', mixta: 'Día + comisión' }

/* La rendición de una feria en una hoja: el papel que se archiva después de
   cada viaje y con el que se discute si el año que viene se vuelve. */
export default function CierreFeria() {
  const { id } = useParams()
  const s = useStore()
  const e = s.evento(id)
  if (!e) return <Navigate to="/eventos" replace />

  const r = s.resultadoEvento(id)
  const stock = s.stockEvento(id)
  const medios = s.ventasPorMedio(id)
  const equipo = s.liquidacion(id)
  const jornadas = s.jornadas.filter(j => j.eventoId === id)
  const gastos = s.gastos.filter(g => g.eventoId === id)
  const egresos = s.egresosNoVenta.filter(g => g.eventoId === id)
  const aPagar = equipo.reduce((a, m) => a + m.aPagar, 0)

  const csv = () => [
    { titulo: `CIERRE DE FERIA - ${e.nombre}`, columnas: ['Concepto', 'Valor'], filas: [
      ['Provincia', e.provincia], ['Localidad', e.localidad],
      ['Desde', e.desde], ['Hasta', e.hasta],
      ['Vendido', r.bruto], ['Frascos', r.unidades], ['Ventas', r.tickets],
      ['Venta promedio', Math.round(r.ticketPromedio)],
      ['Entro de verdad (neto de comisiones)', Math.round(r.neto)],
      ['Costo de los frascos', Math.round(r.costo)],
      ['Sueldos del equipo', Math.round(r.jornales)],
      ['Alquiler del puesto', e.canon],
      ['Ganancia de la feria', Math.round(r.margen)],
    ]},
    { titulo: 'MERCADERIA', columnas: ['Producto', 'Se llevo', 'Vendio', 'Se perdio', 'Queda'],
      filas: stock.map(f => [f.producto.nombre, f.ingresos, f.vendidas, f.egresos, f.teorico]) },
    { titulo: 'MEDIOS DE PAGO', columnas: ['Medio', 'Bruto', 'Neto'],
      filas: medios.map(m => [nombreMedio[m.medio] ?? m.medio, m.bruto, Math.round(m.neto)]) },
    { titulo: 'CAJA POR DIA', columnas: ['Dia', 'Arranco con', 'Cobro efectivo', 'Pago de caja', 'Deberia haber', 'Contado', 'Diferencia'],
      filas: jornadas.map(j => {
        const a = s.arqueo(j.id)
        return [j.fecha, a.jornada.fondoInicial, a.ventasEfectivo, a.gastosCaja,
                a.esperado, a.contado ?? '', a.diferencia ?? '']
      }) },
    { titulo: 'GASTOS', columnas: ['Concepto', 'Categoria', 'Importe'],
      filas: gastos.map(g => [g.concepto, g.categoria, g.importe]) },
    { titulo: 'EQUIPO', columnas: ['Persona', 'Como cobra', 'Por dia', 'Comision', 'Ya cobro', 'Falta pagarle'],
      filas: equipo.map(m => [m.persona?.nombre, comoCobra[m.modalidad] ?? m.modalidad,
                              Math.round(m.base), Math.round(m.comision), m.adelantos, Math.round(m.aPagar)]) },
  ]

  return (
    <Documento
      titulo={`Cierre de feria — ${e.nombre}`}
      subtitulo={`${e.localidad}, ${e.provincia} · ${rango(e.desde, e.hasta)}`}
      volverA={`/eventos/${id}`} volverTexto="Volver a la feria"
      csv={csv}
    >
      <Bloque titulo="Lo que se vendió">
        <Renglones filas={[
          { etiqueta: 'Vendido', valor: money(r.bruto) },
          { etiqueta: 'Frascos', valor: num(r.unidades) },
          { etiqueta: 'Cantidad de ventas', valor: num(r.tickets) },
          { etiqueta: 'Venta promedio', valor: money(r.ticketPromedio) },
          { etiqueta: 'Entró de verdad, después de comisiones', valor: money(r.neto) },
        ]} />
      </Bloque>

      <Bloque titulo="Mercadería que viajó">
        <Tabla
          columnas={['Producto', 'Se llevó', 'Vendió', 'Se perdió', 'Queda']}
          filas={stock.map(f => [
            f.producto.nombre, num(f.ingresos), num(f.vendidas),
            f.egresos > 0 ? `−${num(f.egresos)}` : '—', num(f.teorico),
          ])}
        />
        {egresos.length > 0 && (
          <p className="text-xs text-tinta-50 mt-3 leading-relaxed">
            Salidas que no fueron venta:{' '}
            {egresos.map(g => `${num(g.cantidad)} ${s.producto(g.productoId)?.sabor} (${(etiquetaEgreso[g.tipo] ?? g.tipo).toLowerCase()})`).join(' · ')}.
          </p>
        )}
      </Bloque>

      <Bloque titulo="Cómo pagaron los clientes">
        <Tabla
          columnas={['Medio', 'Cobrado', 'Entró de verdad']}
          filas={medios.map(m => [
            nombreMedio[m.medio] ?? m.medio, money(m.bruto),
            m.neto !== m.bruto ? money(m.neto) : '—',
          ])}
        />
      </Bloque>

      <Bloque titulo="Cierre de caja, día por día">
        <Tabla
          columnas={['Día', 'Arrancó', '+ Efectivo', '− Pagos', '= Debería', 'Contado', 'Dif.']}
          filas={jornadas.map(j => {
            const a = s.arqueo(j.id)
            return [
              j.fecha, money(a.jornada.fondoInicial), money(a.ventasEfectivo),
              money(a.gastosCaja), money(a.esperado),
              a.contado == null ? 'sin cerrar' : money(a.contado),
              a.diferencia == null ? '—' : money(a.diferencia),
            ]
          })}
        />
      </Bloque>

      {gastos.length > 0 && (
        <Bloque titulo="Gastos de la feria">
          <Tabla
            columnas={['Concepto', 'Importe']}
            filas={gastos.map(g => [`${g.concepto} · ${g.categoria}`, money(g.importe)])}
          />
        </Bloque>
      )}

      <Bloque titulo="Lo que se le paga al equipo">
        <Tabla
          columnas={['Persona', 'Cómo cobra', 'Por día', 'Comisión', 'Ya cobró', 'Falta pagarle']}
          filas={equipo.map(m => [
            m.persona?.nombre, comoCobra[m.modalidad] ?? m.modalidad,
            m.base > 0 ? money(m.base) : '—',
            m.comision > 0 ? money(m.comision) : '—',
            m.adelantos > 0 ? `−${money(m.adelantos)}` : '—',
            money(m.aPagar),
          ])}
        />
        <p className="text-sm mt-4 pt-3 border-t border-tinta/15 flex justify-between">
          <span className="font-semibold">Total a pagar al equipo</span>
          <span className="cifra font-bold">{money(aPagar)}</span>
        </p>
      </Bloque>

      <Bloque titulo="Con cuánto quedó la feria">
        <Renglones filas={[
          { etiqueta: 'Entró de verdad', valor: money(r.neto) },
          { etiqueta: 'Costo de los frascos vendidos', valor: `−${money(r.costo)}`, tono: 'mal' },
          { etiqueta: 'Sueldos del equipo', valor: `−${money(r.jornales)}`, tono: 'mal' },
          { etiqueta: 'Alquiler del puesto', valor: `−${money(e.canon)}`, tono: 'mal' },
          { etiqueta: 'Gastos de la feria', valor: `−${money(r.gastosTotales - r.jornales - e.canon)}`, tono: 'mal' },
          { etiqueta: 'Ganancia de la feria', valor: money(r.margen), fuerte: true,
            tono: r.margen >= 0 ? 'bien' : 'mal' },
        ]} />
      </Bloque>

      <div className="evitar-corte pt-4 grid gap-8 sm:grid-cols-2 text-xs text-tinta-50">
        <p className="pt-8 border-t border-tinta/30">Cerró la feria</p>
        <p className="pt-8 border-t border-tinta/30">Revisó</p>
      </div>
    </Documento>
  )
}
