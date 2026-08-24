import { createContext, useContext, useMemo, useReducer } from 'react'
import * as seed from './demoData'

/* ===========================================================================
   Estado del demo.

   Cada selector de acá replica una vista del esquema SQL, con el mismo nombre
   entre paréntesis. Cuando se conecte Supabase, se reemplaza la función por un
   `select` a esa vista y el resto de la app no cambia.
   =========================================================================== */

const Ctx = createContext(null)

const estadoInicial = {
  productos: seed.productos,
  personal: seed.personal,
  eventos: seed.eventos,
  remitos: seed.remitos,
  produccion: seed.produccion,
  egresosNoVenta: seed.egresosNoVenta,
  gastos: seed.gastos,
  cuentas: seed.cuentas,
  jornadas: seed.jornadas,
  ventas: seed.ventas,
  pedidos: seed.pedidos,
  metodosEnvio: seed.metodosEnvio,
  carritoWeb: [],
  modoTienda: 'minorista',   // o 'mayorista'
}

let seq = 1000
const nuevoId = (p) => `${p}${++seq}`

function reducer(state, action) {
  switch (action.type) {
    case 'REGISTRAR_VENTA': {
      const { eventoId, jornadaId, vendedorId, items, pagos, tipo } = action.payload
      return {
        ...state,
        ventas: [...state.ventas, {
          id: nuevoId('v'), eventoId, jornadaId, vendedorId, items, pagos,
          canal: 'evento', tipo: tipo || 'detallada', fecha: new Date().toISOString(),
        }],
      }
    }
    case 'REGISTRAR_EGRESO': {
      return { ...state, egresosNoVenta: [...state.egresosNoVenta, { id: nuevoId('g'), ...action.payload }] }
    }
    case 'REGISTRAR_GASTO': {
      return { ...state, gastos: [...state.gastos, { id: nuevoId('gs'), ...action.payload }] }
    }
    case 'CERRAR_JORNADA': {
      return {
        ...state,
        jornadas: state.jornadas.map(j =>
          j.id === action.payload.jornadaId
            ? { ...j, estado: 'cerrada', efectivoContado: action.payload.efectivoContado }
            : j),
      }
    }
    case 'CARRITO_AGREGAR': {
      const existe = state.carritoWeb.find(i => i.productoId === action.payload.productoId)
      return {
        ...state,
        carritoWeb: existe
          ? state.carritoWeb.map(i => i.productoId === action.payload.productoId
              ? { ...i, cantidad: i.cantidad + action.payload.cantidad } : i)
          : [...state.carritoWeb, action.payload],
      }
    }
    case 'CARRITO_CANTIDAD': {
      return {
        ...state,
        carritoWeb: state.carritoWeb
          .map(i => i.productoId === action.payload.productoId ? { ...i, cantidad: action.payload.cantidad } : i)
          .filter(i => i.cantidad > 0),
      }
    }
    case 'CARRITO_VACIAR':
      return { ...state, carritoWeb: [] }

    /* Cambiar de modo vacía el carrito. Los precios y las unidades mínimas
       son distintos en cada canal, así que arrastrar lo elegido dejaría
       cantidades que no son múltiplo de bulto y precios del canal anterior. */
    case 'TIENDA_MODO':
      return state.modoTienda === action.payload.modo
        ? state
        : { ...state, modoTienda: action.payload.modo, carritoWeb: [] }

    case 'CREAR_PEDIDO': {
      const numero = Math.max(...state.pedidos.map(p => p.numero)) + 1
      return {
        ...state,
        pedidos: [{ id: nuevoId('pd'), numero, estado: 'pendiente_pago', fecha: new Date().toISOString(), ...action.payload }, ...state.pedidos],
        carritoWeb: [],
      }
    }
    case 'PEDIDO_ESTADO': {
      return {
        ...state,
        pedidos: state.pedidos.map(p => p.id === action.payload.id ? { ...p, estado: action.payload.estado } : p),
      }
    }
    default:
      return state
  }
}

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, estadoInicial)
  const value = useMemo(() => ({ ...state, dispatch, ...selectores(state) }), [state])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useStore = () => {
  const c = useContext(Ctx)
  if (!c) throw new Error('useStore se usa dentro de <StoreProvider>')
  return c
}

/* ------------------------------------------------------------------------ */

function selectores(s) {
  const producto = (id) => s.productos.find(p => p.id === id)

  /* Precio mayorista: el de la web menos el descuento acordado, redondeado
     a múltiplos de 50 para que no queden precios con cifras raras. */
  const precioMayorista = (p) =>
    Math.round(p.precioWeb * (1 - seed.condicionesMayorista.descuento) / 50) * 50

  const precioSegunModo = (p) =>
    s.modoTienda === 'mayorista' ? precioMayorista(p) : p.precioWeb
  const evento   = (id) => s.eventos.find(e => e.id === id)
  const persona  = (id) => s.personal.find(p => p.id === id)

  const ventasDe = (eventoId) => s.ventas.filter(v => v.eventoId === eventoId)

  const totalVenta = (v) => v.items.reduce((a, i) => a + i.cantidad * i.precio, 0)
  const cobradoVenta = (v) => v.pagos.reduce((a, p) => a + p.importe, 0)
  const netoVenta = (v) => v.pagos.reduce((a, p) => a + p.importe * (1 - (p.comision || 0) / 100), 0)

  /* v_stock_evento — la ecuación del negocio:
     inicial + ingresos − ventas − egresos no venta = stock teórico */
  const stockEvento = (eventoId) => {
    const recibidos = s.remitos
      .filter(r => r.eventoId === eventoId && r.estado === 'recibido')
      .flatMap(r => r.items)

    return s.productos.map(p => {
      const enviadas  = recibidos.filter(i => i.productoId === p.id).reduce((a, i) => a + i.enviadas, 0)
      const recibidas = recibidos.filter(i => i.productoId === p.id).reduce((a, i) => a + (i.recibidas ?? i.enviadas), 0)
      const roturaTransito = enviadas - recibidas

      const vendidas = ventasDe(eventoId)
        .flatMap(v => v.items).filter(i => i.productoId === p.id)
        .reduce((a, i) => a + i.cantidad, 0)

      const egresos = s.egresosNoVenta
        .filter(g => g.eventoId === eventoId && g.productoId === p.id)
        .reduce((a, g) => a + g.cantidad, 0)

      return {
        producto: p,
        ingresos: enviadas,
        roturaTransito,
        vendidas,
        egresos: egresos + roturaTransito,
        teorico: enviadas - vendidas - egresos - roturaTransito,
      }
    }).filter(r => r.ingresos > 0)
  }

  /* v_stock_central */
  const stockCentral = () => s.productos.map(p => {
    const producido = s.produccion.find(x => x.productoId === p.id)?.cantidad || 0
    const despachado = s.remitos
      .filter(r => r.estado !== 'borrador' && r.tipo !== 'devolucion')
      .flatMap(r => r.items).filter(i => i.productoId === p.id)
      .reduce((a, i) => a + i.enviadas, 0)
    const vendidoWeb = s.pedidos
      .filter(pd => ['pagado', 'en_preparacion', 'despachado', 'entregado'].includes(pd.estado))
      .flatMap(pd => pd.items).filter(i => i.productoId === p.id)
      .reduce((a, i) => a + i.cantidad, 0)
    return { producto: p, stock: producido - despachado - vendidoWeb }
  })

  /* v_stock_web — lo único que la tienda puede vender de verdad.
     Descuenta lo reservado, lo apartado en remitos borrador y el colchón. */
  const stockWeb = () => stockCentral().map(({ producto, stock }) => {
    const reservado = s.pedidos
      .filter(pd => pd.estado === 'pendiente_pago')
      .flatMap(pd => pd.items).filter(i => i.productoId === producto.id)
      .reduce((a, i) => a + i.cantidad, 0)

    const comprometido = s.remitos
      .filter(r => r.estado === 'borrador' && r.tipo !== 'devolucion')
      .flatMap(r => r.items).filter(i => i.productoId === producto.id)
      .reduce((a, i) => a + i.enviadas, 0)

    return {
      producto, stock, reservado, comprometido,
      colchon: producto.reservaFerias,
      disponible: Math.max(stock - reservado - comprometido - producto.reservaFerias, 0),
    }
  })

  /* v_arqueo_jornada — efectivo esperado vs. contado */
  const arqueo = (jornadaId) => {
    const j = s.jornadas.find(x => x.id === jornadaId)
    if (!j) return null
    const ventasEfectivo = s.ventas
      .filter(v => v.jornadaId === jornadaId)
      .flatMap(v => v.pagos).filter(p => p.medio === 'efectivo')
      .reduce((a, p) => a + p.importe, 0)
    const gastosCaja = s.gastos
      .filter(g => g.eventoId === j.eventoId && g.pagadoPor === 'caja_evento' && g.medio === 'efectivo')
      .reduce((a, g) => a + g.importe, 0)
    const esperado = j.fondoInicial + ventasEfectivo - gastosCaja
    return {
      jornada: j, ventasEfectivo, gastosCaja, esperado,
      contado: j.efectivoContado,
      diferencia: j.efectivoContado == null ? null : j.efectivoContado - esperado,
    }
  }

  const ventasPorMedio = (eventoId) => {
    const acc = {}
    ventasDe(eventoId).flatMap(v => v.pagos).forEach(p => {
      acc[p.medio] ??= { medio: p.medio, bruto: 0, neto: 0 }
      acc[p.medio].bruto += p.importe
      acc[p.medio].neto  += p.importe * (1 - (p.comision || 0) / 100)
    })
    return Object.values(acc).sort((a, b) => b.bruto - a.bruto)
  }

  /* v_resultado_evento — lo que decide si vuelven el año que viene */
  const resultadoEvento = (eventoId) => {
    const e = evento(eventoId)
    const vs = ventasDe(eventoId)
    const bruto = vs.reduce((a, v) => a + totalVenta(v), 0)
    const neto  = vs.reduce((a, v) => a + netoVenta(v), 0)
    const unidades = vs.flatMap(v => v.items).reduce((a, i) => a + i.cantidad, 0)
    const costo = vs.flatMap(v => v.items)
      .reduce((a, i) => a + i.cantidad * (producto(i.productoId)?.costo || 0), 0)
    const gastosEvento = s.gastos.filter(g => g.eventoId === eventoId).reduce((a, g) => a + g.importe, 0)
    const jornales = (e?.equipo || []).reduce((a, m) => {
      if (m.modalidad === 'jornal') return a + m.jornal * m.dias
      if (m.modalidad === 'comision') return a + bruto * m.comision / 100
      return a + m.jornal * m.dias + bruto * m.comision / 100
    }, 0)
    const gastosTotales = gastosEvento + (e?.canon || 0) + jornales
    return {
      evento: e, bruto, neto, unidades, tickets: vs.length,
      ticketPromedio: vs.length ? bruto / vs.length : 0,
      costo, jornales, gastosTotales, margen: neto - costo - gastosTotales,
    }
  }

  const liquidacion = (eventoId) => {
    const e = evento(eventoId)
    const bruto = ventasDe(eventoId).reduce((a, v) => a + totalVenta(v), 0)
    return (e?.equipo || []).map(m => {
      const vendidoPropio = ventasDe(eventoId)
        .filter(v => v.vendedorId === m.personalId).reduce((a, v) => a + totalVenta(v), 0)
      const base = m.modalidad === 'comision' ? 0 : m.jornal * m.dias
      const comision = m.modalidad === 'jornal' ? 0
        : (m.modalidad === 'comision' ? bruto : vendidoPropio) * m.comision / 100
      return {
        ...m, persona: persona(m.personalId), vendidoPropio,
        base, comision, aPagar: base + comision - m.adelantos,
      }
    })
  }

  const totalPedido = (pd) =>
    pd.items.reduce((a, i) => a + i.cantidad * i.precio, 0) + (pd.envio || 0)

  /* Ranking de sabores: suma lo vendido en ferias y por la web, para saber
     qué conviene cocinar más. Es la pregunta que se hace antes de cada tanda. */
  const rankingProductos = () => {
    const acc = {}
    const sumar = (productoId, cantidad, importe) => {
      const p = producto(productoId)
      if (!p) return
      acc[productoId] ??= { producto: p, unidades: 0, bruto: 0 }
      acc[productoId].unidades += cantidad
      acc[productoId].bruto += importe
    }

    s.ventas.flatMap(v => v.items).forEach(i => sumar(i.productoId, i.cantidad, i.cantidad * i.precio))
    s.pedidos
      .filter(pd => ['pagado', 'en_preparacion', 'despachado', 'entregado'].includes(pd.estado))
      .flatMap(pd => pd.items)
      .forEach(i => sumar(i.productoId, i.cantidad, i.cantidad * i.precio))

    return Object.values(acc).sort((a, b) => b.unidades - a.unidades)
  }

  /* Cómo paga la gente, sumando todas las ferias. Define cuánta plata queda
     atada a comisiones y cuánto efectivo hay que contar al cierre. */
  const mediosDePago = () => {
    const acc = {}
    s.ventas.flatMap(v => v.pagos).forEach(pg => {
      acc[pg.medio] ??= { medio: pg.medio, bruto: 0, comision: 0, operaciones: 0 }
      acc[pg.medio].bruto += pg.importe
      acc[pg.medio].comision += pg.importe * (pg.comision || 0) / 100
      acc[pg.medio].operaciones += 1
    })
    return Object.values(acc).sort((a, b) => b.bruto - a.bruto)
  }

  /* Lo vendido por feria, para compararlas entre sí de un vistazo. */
  const ventasPorEvento = () =>
    s.eventos
      .map(e => ({ evento: e, ...resultadoEvento(e.id) }))
      .filter(r => r.bruto > 0)
      .sort((a, b) => b.bruto - a.bruto)

  /* v_resultado_canal — ¿rinde más una feria o la web? */
  const resultadoCanal = () => {
    const ferias = s.eventos.map(e => resultadoEvento(e.id))
    const brutoFerias = ferias.reduce((a, r) => a + r.bruto, 0)
    const costoFerias = ferias.reduce((a, r) => a + r.costo, 0)

    const pagados = s.pedidos.filter(p => ['pagado', 'en_preparacion', 'despachado', 'entregado'].includes(p.estado))

    const resumirPedidos = (nombre, lista) => {
      const bruto = lista.reduce((a, pd) => a + pd.items.reduce((b, i) => b + i.cantidad * i.precio, 0), 0)
      const costo = lista.reduce((a, pd) =>
        a + pd.items.reduce((b, i) => b + i.cantidad * (producto(i.productoId)?.costo || 0), 0), 0)
      return {
        canal: nombre,
        operaciones: lista.length,
        unidades: lista.reduce((a, pd) => a + pd.items.reduce((b, i) => b + i.cantidad, 0), 0),
        bruto, costo,
        envio: lista.reduce((a, pd) => a + (pd.envio || 0), 0),
        margenBruto: bruto - costo,
      }
    }

    return [
      {
        canal: 'Ferias',
        operaciones: ferias.reduce((a, r) => a + r.tickets, 0),
        unidades: ferias.reduce((a, r) => a + r.unidades, 0),
        bruto: brutoFerias, costo: costoFerias, margenBruto: brutoFerias - costoFerias,
      },
      resumirPedidos('Tienda online', pagados.filter(p => p.canal !== 'mayorista')),
      resumirPedidos('Mayoristas', pagados.filter(p => p.canal === 'mayorista')),
    ]
  }

  return {
    producto, evento, persona, ventasDe, totalVenta, cobradoVenta, netoVenta,
    precioMayorista, precioSegunModo, condicionesMayorista: seed.condicionesMayorista,
    stockEvento, stockCentral, stockWeb, arqueo, ventasPorMedio,
    rankingProductos, mediosDePago, ventasPorEvento,
    resultadoEvento, liquidacion, totalPedido, resultadoCanal,
  }
}
