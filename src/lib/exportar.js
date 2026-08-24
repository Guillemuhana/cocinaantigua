/* ===========================================================================
   Exportar a planilla.

   El destino real de estos archivos es el Excel del contador, así que se
   escriben para Excel en español, no para un lector de CSV genérico:

     · separador punto y coma — con la coma, Excel en configuración regional
       argentina mete toda la fila en una sola celda
     · BOM al principio — sin él, Excel abre el archivo como ANSI y los
       acentos y las eñes salen rotos
     · números sin separador de miles y con coma decimal, que es como Excel
       en español espera leerlos; con punto los toma como texto
   =========================================================================== */

const SEP = ';'

const celda = (v) => {
  if (v == null) return ''
  if (typeof v === 'number') {
    return Number.isInteger(v) ? String(v) : v.toFixed(2).replace('.', ',')
  }
  const t = String(v)
  // Comillas dobles adentro se escapan duplicándolas, según el formato CSV.
  return /[";\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t
}

export function armarCSV(secciones) {
  const lineas = []
  secciones.forEach((s, i) => {
    if (i > 0) lineas.push('')
    if (s.titulo) lineas.push(celda(s.titulo))
    if (s.columnas) lineas.push(s.columnas.map(celda).join(SEP))
    ;(s.filas || []).forEach(f => lineas.push(f.map(celda).join(SEP)))
  })
  return lineas.join('\r\n')
}

export function descargarCSV(nombreArchivo, secciones) {
  const contenido = '﻿' + armarCSV(secciones)
  const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = nombreArchivo.endsWith('.csv') ? nombreArchivo : `${nombreArchivo}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)

  // Sin esto el blob queda retenido en memoria mientras viva la pestaña.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/* Nombre de archivo con fecha adelante, para que ordenen solos en la carpeta
   y no haya que abrirlos para saber cuál es cuál. */
export const nombreConFecha = (base, d = new Date()) => {
  const iso = d.toISOString().slice(0, 10)
  const limpio = base
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
  return `${iso}-${limpio}.csv`
}
