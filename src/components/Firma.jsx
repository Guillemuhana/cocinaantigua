/* Firma del estudio. Va en el pie de todas las pantallas, en gris tenue:
   presente, pero sin competir con la marca del cliente. */
export default function Firma({ className = '' }) {
  return (
    <div className={`text-right ${className}`}>
      <p className="text-[11px] uppercase tracking-[0.14em] text-tinta-50/70">
        Diseño y desarrollo
      </p>
      <p className="text-sm font-bold tracking-tight text-tinta mt-1">
        Studio<span className="text-higo">B2B</span>
      </p>
    </div>
  )
}
