/* ===========================================================================
   Gráficos.

   Barras horizontales y nada más. Todo lo que este negocio necesita comparar
   son magnitudes con nombre — sabores, ferias, medios de pago — y para eso la
   barra horizontal gana: los nombres se leen de corrido, entran muchos sin
   apretarse y no hace falta girar la cabeza.

   Reglas que se respetan en todos:
     · una sola serie → un solo color; varias series → paleta fija y además
       el nombre al lado de cada barra, para que el color nunca sea el único
       dato que distingue
     · el valor va escrito, no hay que estimarlo contra una grilla
     · la barra es fina y el fondo tenue: el dato pesa más que el adorno
   =========================================================================== */

/* Paleta para series con identidad propia. El orden es fijo: si mañana se
   agrega un canal, los tres de ahora conservan su color.
   Validada para daltonismo (deutan/protan/tritan) contra fondo blanco. */
export const coloresSerie = ['#2563EB', '#DB2777', '#B45309']

export function Barras({ datos, color = 'var(--color-higo)', porSerie = false }) {
  const maximo = Math.max(...datos.map(d => d.valor), 1)

  return (
    <ul className="space-y-4">
      {datos.map((d, i) => (
        <li key={d.clave} className="group">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
            <span className="flex items-center gap-2.5 min-w-0">
              {porSerie && (
                <span
                  className="w-2.5 h-2.5 rounded-sm shrink-0"
                  style={{ background: coloresSerie[i % coloresSerie.length] }}
                  aria-hidden="true"
                />
              )}
              <span className="font-medium truncate">{d.etiqueta}</span>
            </span>
            <span className="cifra font-semibold shrink-0">{d.valorTexto}</span>
          </div>

          <div className="h-2 bg-papel-2 rounded-full overflow-hidden mt-2">
            <div
              className="h-full rounded-full transition-[width] duration-700 ease-out"
              style={{
                width: `${(d.valor / maximo) * 100}%`,
                background: porSerie ? coloresSerie[i % coloresSerie.length] : color,
              }}
            />
          </div>

          {d.detalle && (
            <p className="text-xs text-tinta-50 mt-1.5">{d.detalle}</p>
          )}
        </li>
      ))}
    </ul>
  )
}

/* Barra partida en tramos, para cuando lo que importa es la proporción del
   total y no cada valor por separado. Los tramos se separan 2px para que se
   distingan sin necesitar borde. */
export function BarraPartida({ tramos }) {
  const total = tramos.reduce((a, t) => a + t.valor, 0) || 1

  return (
    <div>
      <div className="flex gap-0.5 h-3">
        {tramos.map((t, i) => (
          <div
            key={t.clave}
            className="h-full first:rounded-l-full last:rounded-r-full transition-opacity"
            style={{
              width: `${(t.valor / total) * 100}%`,
              background: coloresSerie[i % coloresSerie.length],
            }}
            title={`${t.etiqueta}: ${t.valorTexto}`}
          />
        ))}
      </div>

      <ul className="flex flex-wrap gap-x-6 gap-y-2 mt-4">
        {tramos.map((t, i) => (
          <li key={t.clave} className="flex items-baseline gap-2">
            <span
              className="w-2.5 h-2.5 rounded-sm shrink-0 translate-y-px"
              style={{ background: coloresSerie[i % coloresSerie.length] }}
              aria-hidden="true"
            />
            <span className="text-sm">
              <span className="text-tinta-50">{t.etiqueta}</span>{' '}
              <span className="cifra font-semibold">{t.valorTexto}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
