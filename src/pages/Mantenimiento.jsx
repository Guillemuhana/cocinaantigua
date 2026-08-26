import Firma from '../components/Firma'

/* ===========================================================================
   Pantalla de mantenimiento.

   Es lo único que ve quien entra mientras el trabajo está en pausa. No dice
   "error" ni "roto": el sistema no falló, está en preparación. Tono sobrio,
   la marca del cliente arriba, la firma del estudio abajo y ni un solo link
   que lleve a la app — porque no hay nada detrás para mostrar todavía.

   Usa el mismo sistema visual que el resto (papel, tinta, halo, escalona),
   así el día que se levante el mantenimiento no hay un salto de estilo.
   =========================================================================== */

export default function Mantenimiento() {
  return (
    <main className="halo min-h-dvh flex flex-col">
      <div className="flex-1 flex items-center justify-center px-5 py-16">
        <div className="escalona w-full max-w-lg text-center">

          <img
            src="/marca.png"
            alt="Cocina Antigua"
            width="112"
            height="112"
            className="mx-auto w-20 h-20 sm:w-28 sm:h-28"
          />

          <p className="eyebrow text-tinta-50 mt-7 inline-flex items-center gap-2">
            <span className="punto punto-vivo text-damasco" />
            En preparación
          </p>

          <h1 className="display-2 mt-3">
            Estamos terminando de armarlo
          </h1>

          <p className="text-base sm:text-lg text-tinta-50 leading-relaxed mt-4">
            El sistema de gestión y la tienda están en la última etapa de
            trabajo. En cuanto queden listos, vuelven a estar disponibles en
            esta misma dirección.
          </p>

          {/* Si querés que puedan escribirte desde acá, agregá tu contacto:
              <a href="mailto:...">...</a> */}
          <p className="text-sm text-tinta-50/80 mt-8">
            Gracias por la paciencia.
          </p>

        </div>
      </div>

      <footer className="px-5 pb-8">
        <div className="mx-auto max-w-lg">
          <Firma />
        </div>
      </footer>
    </main>
  )
}
