import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MANTENIMIENTO, tieneAcceso } from './lib/acceso'
import './index.css'

/* Una sola de las dos pantallas se descarga. Con el import dinámico, el
   visitante que ve el cartel de mantenimiento no baja el código de la app
   ni los datos de demostración: se queda en el chunk del cartel. */
const pantalla = MANTENIMIENTO && !tieneAcceso()
  ? import('./pages/Mantenimiento')
  : import('./App')

const raiz = createRoot(document.getElementById('root'))

pantalla.then(({ default: Pantalla }) => {
  raiz.render(
    <StrictMode>
      <Pantalla />
    </StrictMode>
  )
})
