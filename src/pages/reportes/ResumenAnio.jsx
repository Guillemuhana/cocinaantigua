import { useStore } from '../../lib/store'
import { money, num } from '../../lib/format'
import Documento, { Bloque, Renglones, Tabla } from '../../components/Documento'

const nombreMedio = {
  efectivo: 'Efectivo', posnet: 'Tarjeta (posnet)',
  transferencia: 'Transferencia', qr: 'QR / billetera',
}

/* El reporte que se lleva al contador: la foto del negocio entero en una hoja. */
export default function ResumenAnio() {
  const s = useStore()
  const canales = s.resultadoCanal()
  const ranking = s.rankingProductos()
  const porFeria = s.ventasPorEvento()
  const medios = s.mediosDePago()

  const vendido = canales.reduce((a, c) => a + c.bruto, 0)
  const frascos = canales.reduce((a, c) => a + c.unidades, 0)
  const ventas = canales.reduce((a, c) => a + c.operaciones, 0)
  const comisiones = medios.reduce((a, m) => a + m.comision, 0)
  const gananciaFerias = s.eventos.reduce((a, e) => a + s.resultadoEvento(e.id).margen, 0)
  const ganancia = gananciaFerias + canales.slice(1).reduce((a, c) => a + c.margenBruto, 0)
  const pct = (n) => vendido > 0 ? `${(n / vendido * 100).toFixed(1).replace('.', ',')}%` : '—'

  const csv = () => [
    { titulo: 'RESUMEN DEL AÑO', columnas: ['Concepto', 'Valor'], filas: [
      ['Vendido', vendido], ['Frascos vendidos', frascos], ['Ventas', ventas],
      ['Venta promedio', ventas ? Math.round(vendido / ventas) : 0],
      ['Comisiones pagadas', Math.round(comisiones)], ['Ganancia', Math.round(ganancia)],
    ]},
    { titulo: 'POR CANAL', columnas: ['Canal', 'Vendido', 'Frascos', 'Ventas', 'Ganancia sobre el costo'],
      filas: canales.map(c => [c.canal, c.bruto, c.unidades, c.operaciones, Math.round(c.margenBruto)]) },
    { titulo: 'SABORES', columnas: ['Producto', 'Frascos', 'Facturado'],
      filas: ranking.map(r => [r.producto.nombre, r.unidades, r.bruto]) },
    { titulo: 'FERIAS', columnas: ['Feria', 'Provincia', 'Vendido', 'Frascos', 'Ganancia'],
      filas: porFeria.map(r => [r.evento.nombre, r.evento.provincia, r.bruto, r.unidades, Math.round(r.margen)]) },
    { titulo: 'MEDIOS DE PAGO EN FERIA', columnas: ['Medio', 'Cobrado', 'Comision'],
      filas: medios.map(m => [nombreMedio[m.medio] ?? m.medio, m.bruto, Math.round(m.comision)]) },
  ]

  return (
    <Documento
      titulo="Resumen del año"
      subtitulo="Ferias, tienda online y revendedores"
      volverA="/" volverTexto="Volver al panel"
      csv={csv}
    >
      <Bloque titulo="El año en números">
        <Renglones filas={[
          { etiqueta: 'Vendido', valor: money(vendido) },
          { etiqueta: 'Frascos vendidos', valor: num(frascos) },
          { etiqueta: 'Cantidad de ventas', valor: num(ventas) },
          { etiqueta: 'Venta promedio', valor: money(ventas ? vendido / ventas : 0) },
          { etiqueta: 'Comisiones pagadas', valor: `−${money(comisiones)}`, tono: 'mal' },
          { etiqueta: 'Ganancia del año', valor: money(ganancia), fuerte: true,
            tono: ganancia >= 0 ? 'bien' : 'mal' },
        ]} />
        <p className="text-xs text-tinta-50 mt-4 leading-relaxed">
          La ganancia descuenta el costo de los frascos, los sueldos del equipo, el alquiler de
          los puestos y los gastos de cada feria. Los canales web todavía no tienen gastos de
          estructura cargados.
        </p>
      </Bloque>

      <Bloque titulo="Por dónde entró la plata">
        <Tabla
          columnas={['Canal', 'Vendido', '%', 'Frascos', 'Ventas']}
          filas={canales.map(c => [c.canal, money(c.bruto), pct(c.bruto), num(c.unidades), num(c.operaciones)])}
        />
      </Bloque>

      <Bloque titulo="Sabores más vendidos">
        <Tabla
          columnas={['Producto', 'Frascos', 'Facturado']}
          filas={ranking.map(r => [r.producto.nombre, num(r.unidades), money(r.bruto)])}
        />
      </Bloque>

      <Bloque titulo="Cómo rindió cada feria">
        <Tabla
          columnas={['Feria', 'Vendido', 'Frascos', 'Ganancia']}
          filas={porFeria.map(r => [
            `${r.evento.nombre} · ${r.evento.provincia}`,
            money(r.bruto), num(r.unidades), money(r.margen),
          ])}
        />
      </Bloque>

      <Bloque titulo="Cómo pagó la gente en las ferias">
        <Tabla
          columnas={['Medio', 'Cobrado', '%', 'Comisión']}
          filas={medios.map(m => [
            nombreMedio[m.medio] ?? m.medio, money(m.bruto),
            pct(m.bruto), m.comision > 0 ? `−${money(m.comision)}` : '—',
          ])}
        />
      </Bloque>
    </Documento>
  )
}
