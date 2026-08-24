import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { StoreProvider } from './lib/store'
import Layout from './components/Layout'
import Panel from './pages/Panel'
import Eventos from './pages/Eventos'
import EventoDetalle from './pages/EventoDetalle'
import PuntoVenta from './pages/PuntoVenta'
import Deposito from './pages/Deposito'
import Pedidos from './pages/Pedidos'
import Tienda from './pages/Tienda'
import ResumenAnio from './pages/reportes/ResumenAnio'
import CierreFeria from './pages/reportes/CierreFeria'
import Remito from './pages/reportes/Remito'

export default function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <Routes>
          {/* Sistema de gestión */}
          <Route element={<Layout />}>
            <Route index element={<Panel />} />
            <Route path="eventos" element={<Eventos />} />
            <Route path="eventos/:id" element={<EventoDetalle />} />
            <Route path="deposito" element={<Deposito />} />
            <Route path="pedidos" element={<Pedidos />} />
          </Route>

          {/* Reportes: hojas para imprimir o guardar como PDF, sin la
              navegación del sistema alrededor */}
          <Route path="/reportes/anio" element={<ResumenAnio />} />
          <Route path="/reportes/feria/:id" element={<CierreFeria />} />
          <Route path="/reportes/remito/:id" element={<Remito />} />

          {/* Pantallas a pantalla completa */}
          <Route path="/venta/:id" element={<PuntoVenta />} />
          <Route path="/tienda" element={<Tienda />} />
        </Routes>
      </BrowserRouter>
    </StoreProvider>
  )
}
