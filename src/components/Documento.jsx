import { Link } from 'react-router-dom'
import { fechaLarga } from '../lib/format'
import { descargarCSV, nombreConFecha } from '../lib/exportar'

/* ===========================================================================
   Armazón de los reportes.

   Todos los reportes son el mismo objeto: una hoja con membrete arriba, el
   contenido en el medio y el pie con la fecha de emisión. Lo único que
   cambia es lo que va adentro.

   La barra de acciones lleva .no-imprimir, así que existe en pantalla y
   desaparece en el papel. Ese es todo el truco: una sola vista sirve para
   mirar, para imprimir y para guardar como PDF.
   =========================================================================== */

export default function Documento({ titulo, subtitulo, volverA, volverTexto, csv, children }) {
  const bajar = () => descargarCSV(nombreConFecha(titulo), csv())

  return (
    <div className="min-h-dvh bg-papel-2/50">
      {/* Barra de acciones — sólo en pantalla */}
      <div className="no-imprimir border-b border-tinta/10 bg-papel sticky top-0 z-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 py-3 flex flex-wrap items-center gap-2">
          <Link to={volverA}
            className="text-sm font-medium text-tinta-50 hover:text-higo mr-auto">
            ← {volverTexto}
          </Link>
          <button onClick={bajar}
            className="btn bg-papel border border-tinta/15 px-4 py-2 rounded-xl text-sm hover:bg-papel-2 hover:border-tinta/30">
            Descargar planilla
          </button>
          <button onClick={() => window.print()}
            className="btn bg-higo text-papel px-4 py-2 rounded-xl text-sm">
            Imprimir o guardar PDF
          </button>
        </div>
      </div>

      {/* La hoja */}
      <div className="mx-auto max-w-3xl px-3 sm:px-6 py-4 sm:py-10">
        <article className="hoja-impresa bg-papel border border-tinta/10 rounded-2xl p-5 sm:p-10">
          <header className="flex items-start gap-4 pb-6 border-b-2 border-tinta">
            <img src="/marca.png" alt="" width="56" height="56" className="w-12 h-12 sm:w-14 sm:h-14 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-tinta-50">Cocina Antigua</p>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight mt-1 text-balance">{titulo}</h1>
              {subtitulo && <p className="text-sm text-tinta-50 mt-1">{subtitulo}</p>}
            </div>
          </header>

          <div className="space-y-8 py-8">{children}</div>

          <footer className="pt-5 border-t border-tinta/15 flex flex-wrap justify-between gap-x-6 gap-y-1 text-xs text-tinta-50">
            <span>Emitido el {fechaLarga().toLowerCase()}</span>
            <span>Datos de ejemplo · Sistema por StudioB2B</span>
          </footer>
        </article>
      </div>
    </div>
  )
}

/* Bloque con título. En papel no se corta entre dos hojas. */
export function Bloque({ titulo, children, className = '' }) {
  return (
    <section className={`evitar-corte ${className}`}>
      <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-tinta-50 pb-2 border-b border-tinta/12">
        {titulo}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  )
}

/* Lista de renglones "concepto ......... valor". El punteado guía el ojo de
   la etiqueta al número, que es como se lee una rendición en papel. */
export function Renglones({ filas }) {
  return (
    <dl className="space-y-2">
      {filas.map((f, i) => (
        <div key={i}
          className={`flex items-baseline gap-2 ${f.fuerte ? 'pt-2 mt-1 border-t border-tinta/15' : ''}`}>
          <dt className={`shrink-0 ${f.fuerte ? 'font-semibold' : 'text-tinta-50'}`}>{f.etiqueta}</dt>
          <span className="flex-1 border-b border-dotted border-tinta/25 translate-y-[-3px]" aria-hidden="true" />
          <dd className={`cifra shrink-0 tabular-nums ${
            f.fuerte ? 'font-bold text-base' : 'font-medium'} ${f.tono === 'mal' ? 'text-membrillo' : f.tono === 'bien' ? 'text-laurel' : ''}`}>
            {f.valor}
          </dd>
        </div>
      ))}
    </dl>
  )
}

/* Tabla que en un celular no se puede angostar más: se deja desplazar sola
   en vez de apretar las columnas hasta que no se lea ninguna. */
export function Tabla({ columnas, filas }) {
  return (
    <div className="-mx-1 overflow-x-auto">
      <table className="w-full min-w-sm text-sm">
        <thead>
          <tr className="border-b border-tinta/20">
            {columnas.map((c, i) => (
              <th key={i}
                className={`py-2 px-1 text-xs font-semibold uppercase tracking-wider text-tinta-50 ${
                  i === 0 ? 'text-left' : 'text-right'}`}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map((f, i) => (
            <tr key={i} className="border-b border-tinta/8 last:border-0">
              {f.map((celda, j) => (
                <td key={j} className={`py-2 px-1 ${j === 0 ? 'text-left' : 'text-right cifra tabular-nums'}`}>
                  {celda}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
