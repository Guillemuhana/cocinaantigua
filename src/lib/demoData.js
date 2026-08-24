/* ===========================================================================
   Datos de ejemplo.

   Son inventados pero verosímiles: sirven para que el cliente vea la app llena
   y entienda de qué se trata sin tener que cargar nada. Cuando se conecte
   Supabase, este archivo se borra y las mismas estructuras vienen de la base.
   =========================================================================== */

export const productos = [
  { id: 'p1', sku: 'MER-HIG-420', nombre: 'Mermelada de higo',        sabor: 'higo',      presentacion: 420, costo: 2500, precio: 7000, precioWeb: 8500, visibleWeb: true, reservaFerias: 40, color: '#6B2D4E' },
  { id: 'p2', sku: 'MER-FRU-420', nombre: 'Mermelada de frutilla',    sabor: 'frutilla',  presentacion: 420, costo: 2300, precio: 7000, precioWeb: 8500, visibleWeb: true, reservaFerias: 40, color: '#A32F3E' },
  { id: 'p3', sku: 'MER-DUR-420', nombre: 'Mermelada de durazno',     sabor: 'durazno',   presentacion: 420, costo: 2100, precio: 6500, precioWeb: 8000, visibleWeb: true, reservaFerias: 30, color: '#D98324' },
  { id: 'p4', sku: 'MER-NAR-420', nombre: 'Mermelada de naranja',     sabor: 'naranja',   presentacion: 420, costo: 1900, precio: 6500, precioWeb: 8000, visibleWeb: true, reservaFerias: 30, color: '#C96A1B' },
  { id: 'p5', sku: 'MER-TOM-420', nombre: 'Mermelada de tomate',      sabor: 'tomate',    presentacion: 420, costo: 2000, precio: 7500, precioWeb: 9000, visibleWeb: true, reservaFerias: 20, color: '#8E3B2A' },
  { id: 'p6', sku: 'MER-MEM-420', nombre: 'Dulce de membrillo',       sabor: 'membrillo', presentacion: 500, costo: 2600, precio: 8000, precioWeb: 9500, visibleWeb: true, reservaFerias: 20, color: '#A65A26' },
  { id: 'p7', sku: 'MER-ROS-250', nombre: 'Mermelada de rosa mosqueta', sabor: 'rosa mosqueta', presentacion: 250, costo: 3200, precio: 9500, precioWeb: 11000, visibleWeb: true, reservaFerias: 15, color: '#7D2E48' },
  { id: 'p8', sku: 'MER-ZAP-420', nombre: 'Dulce de zapallo',         sabor: 'zapallo',   presentacion: 420, costo: 1800, precio: 6000, precioWeb: 7500, visibleWeb: false, reservaFerias: 0, color: '#B8791F' },
]

export const personal = [
  { id: 'per1', nombre: 'Marta',    fijo: true },
  { id: 'per2', nombre: 'Rubén',    fijo: true },
  { id: 'per3', nombre: 'Sofía',    fijo: false },
  { id: 'per4', nombre: 'Tomás',    fijo: false },
  { id: 'per5', nombre: 'Camila',   fijo: false },
]

export const eventos = [
  {
    id: 'e1',
    nombre: 'Fiesta Nacional del Poncho',
    provincia: 'Catamarca',
    localidad: 'San Fernando del Valle',
    desde: '2026-08-20', hasta: '2026-08-28',
    estado: 'abierto',
    modoCarga: 'detallada',
    canon: 380000,
    fondoCaja: 60000,
    equipo: [
      { personalId: 'per1', rol: 'Encargada', modalidad: 'jornal_comision', jornal: 45000, comision: 3, dias: 5, adelantos: 50000 },
      { personalId: 'per3', rol: 'Vendedora', modalidad: 'jornal',          jornal: 38000, comision: 0, dias: 5, adelantos: 0 },
    ],
  },
  {
    id: 'e2',
    nombre: 'Feria de las Colectividades',
    provincia: 'Córdoba',
    localidad: 'Córdoba Capital',
    desde: '2026-08-22', hasta: '2026-08-30',
    estado: 'abierto',
    modoCarga: 'resumen',
    canon: 290000,
    fondoCaja: 45000,
    equipo: [
      { personalId: 'per2', rol: 'Encargado', modalidad: 'jornal_comision', jornal: 45000, comision: 3, dias: 4, adelantos: 0 },
      { personalId: 'per4', rol: 'Vendedor',  modalidad: 'jornal',          jornal: 38000, comision: 0, dias: 4, adelantos: 20000 },
    ],
  },
  {
    id: 'e3',
    nombre: 'Vendimia — Paseo de Artesanos',
    provincia: 'Mendoza',
    localidad: 'Maipú',
    desde: '2026-09-12', hasta: '2026-09-15',
    estado: 'planificado',
    modoCarga: 'detallada',
    canon: 210000,
    fondoCaja: 40000,
    equipo: [
      { personalId: 'per5', rol: 'Vendedora', modalidad: 'comision', jornal: 0, comision: 12, dias: 0, adelantos: 0 },
    ],
  },
  {
    id: 'e4',
    nombre: 'Expo Chaco',
    provincia: 'Chaco',
    localidad: 'Resistencia',
    desde: '2026-07-04', hasta: '2026-07-13',
    estado: 'cerrado',
    modoCarga: 'detallada',
    canon: 340000,
    fondoCaja: 50000,
    equipo: [
      { personalId: 'per1', rol: 'Encargada', modalidad: 'jornal_comision', jornal: 42000, comision: 3, dias: 9, adelantos: 100000 },
      { personalId: 'per4', rol: 'Vendedor',  modalidad: 'jornal',          jornal: 35000, comision: 0, dias: 9, adelantos: 60000 },
    ],
  },
]

/* Remitos: qué mercadería se mandó a cada evento.
   'borrador' = todavía en el depósito, ya apartada. */
export const remitos = [
  { id: 'r1', eventoId: 'e1', tipo: 'salida', estado: 'recibido', items: [
    { productoId: 'p1', enviadas: 180, recibidas: 178 },
    { productoId: 'p2', enviadas: 200, recibidas: 200 },
    { productoId: 'p3', enviadas: 150, recibidas: 150 },
    { productoId: 'p6', enviadas: 90,  recibidas: 89  },
    { productoId: 'p7', enviadas: 60,  recibidas: 60  },
  ]},
  { id: 'r2', eventoId: 'e2', tipo: 'salida', estado: 'recibido', items: [
    { productoId: 'p1', enviadas: 120, recibidas: 120 },
    { productoId: 'p2', enviadas: 140, recibidas: 138 },
    { productoId: 'p4', enviadas: 100, recibidas: 100 },
    { productoId: 'p5', enviadas: 80,  recibidas: 80  },
  ]},
  { id: 'r3', eventoId: 'e3', tipo: 'salida', estado: 'borrador', items: [
    { productoId: 'p1', enviadas: 150, recibidas: null },
    { productoId: 'p2', enviadas: 150, recibidas: null },
    { productoId: 'p3', enviadas: 120, recibidas: null },
    { productoId: 'p7', enviadas: 50,  recibidas: null },
  ]},
]

/* Producción acumulada en el depósito central */
export const produccion = [
  { productoId: 'p1', cantidad: 900 },
  { productoId: 'p2', cantidad: 950 },
  { productoId: 'p3', cantidad: 700 },
  { productoId: 'p4', cantidad: 600 },
  { productoId: 'p5', cantidad: 400 },
  { productoId: 'p6', cantidad: 350 },
  { productoId: 'p7', cantidad: 280 },
  { productoId: 'p8', cantidad: 200 },
]

/* Egresos que no son venta: lo que se rompe, se regala o se prueba. */
export const egresosNoVenta = [
  { id: 'g1', eventoId: 'e1', productoId: 'p1', tipo: 'degustacion',     cantidad: 6, motivo: 'Degustación en el stand', fecha: '2026-08-21' },
  { id: 'g2', eventoId: 'e1', productoId: 'p2', tipo: 'rotura',          cantidad: 3, motivo: 'Se cayó una caja al bajar', fecha: '2026-08-20' },
  { id: 'g3', eventoId: 'e1', productoId: 'p7', tipo: 'regalo',          cantidad: 2, motivo: 'Muestra para la radio local', fecha: '2026-08-22' },
  { id: 'g4', eventoId: 'e2', productoId: 'p2', tipo: 'degustacion',     cantidad: 8, motivo: 'Degustación fin de semana', fecha: '2026-08-23' },
  { id: 'g5', eventoId: 'e2', productoId: 'p5', tipo: 'canje',          cantidad: 4, motivo: 'Canje con el puesto de quesos', fecha: '2026-08-23' },
  { id: 'g6', eventoId: 'e1', productoId: 'p3', tipo: 'consumo_interno', cantidad: 2, motivo: 'Desayuno del equipo', fecha: '2026-08-22' },
]

export const gastos = [
  { id: 'gs1', eventoId: 'e1', fecha: '2026-08-19', categoria: 'Flete y logística',   descripcion: 'Flete ida Córdoba–Catamarca', importe: 240000, medio: 'transferencia', pagadoPor: 'empresa' },
  { id: 'gs2', eventoId: 'e1', fecha: '2026-08-20', categoria: 'Alojamiento',         descripcion: 'Hospedaje 5 noches x2',      importe: 320000, medio: 'transferencia', pagadoPor: 'empresa' },
  { id: 'gs3', eventoId: 'e1', fecha: '2026-08-21', categoria: 'Comida del equipo',   descripcion: 'Almuerzos',                  importe: 28000,  medio: 'efectivo',      pagadoPor: 'caja_evento' },
  { id: 'gs4', eventoId: 'e1', fecha: '2026-08-22', categoria: 'Comida del equipo',   descripcion: 'Almuerzos',                  importe: 31000,  medio: 'efectivo',      pagadoPor: 'caja_evento' },
  { id: 'gs5', eventoId: 'e1', fecha: '2026-08-21', categoria: 'Embalaje e insumos',  descripcion: 'Bolsas y papel',             importe: 18500,  medio: 'efectivo',      pagadoPor: 'caja_evento' },
  { id: 'gs6', eventoId: 'e2', fecha: '2026-08-22', categoria: 'Flete y logística',   descripcion: 'Flete local',                importe: 65000,  medio: 'efectivo',      pagadoPor: 'caja_evento' },
  { id: 'gs7', eventoId: 'e2', fecha: '2026-08-23', categoria: 'Comida del equipo',   descripcion: 'Almuerzos',                  importe: 24000,  medio: 'efectivo',      pagadoPor: 'caja_evento' },
  { id: 'gs8', eventoId: 'e4', fecha: '2026-07-03', categoria: 'Flete y logística',   descripcion: 'Flete ida y vuelta Chaco',   importe: 410000, medio: 'transferencia', pagadoPor: 'empresa' },
  { id: 'gs9', eventoId: 'e4', fecha: '2026-07-05', categoria: 'Alojamiento',         descripcion: 'Hospedaje 9 noches',         importe: 540000, medio: 'transferencia', pagadoPor: 'empresa' },
  { id: 'gs10', eventoId: 'e4', fecha: '2026-07-06', categoria: 'Comida del equipo',  descripcion: 'Comidas de la semana',       importe: 195000, medio: 'efectivo',      pagadoPor: 'caja_evento' },
]

export const categoriasGasto = [
  'Canon / alquiler de stand', 'Flete y logística', 'Combustible y peajes',
  'Alojamiento', 'Comida del equipo', 'Jornales', 'Embalaje e insumos',
  'Alquiler de equipos', 'Energía / servicios', 'Publicidad', 'Otros',
]

export const cuentas = [
  { id: 'c1', nombre: 'Caja del evento',  tipo: 'caja',      comision: 0 },
  { id: 'c2', nombre: 'Alias cocina.antigua', tipo: 'billetera', comision: 0 },
  { id: 'c3', nombre: 'Posnet Naranja',   tipo: 'posnet',    comision: 6.5 },
]

export const jornadas = [
  { id: 'j1', eventoId: 'e1', fecha: '2026-08-22', estado: 'cerrada', fondoInicial: 60000, efectivoContado: 576000 },
  { id: 'j2', eventoId: 'e1', fecha: '2026-08-23', estado: 'abierta', fondoInicial: 60000, efectivoContado: null },
  { id: 'j3', eventoId: 'e2', fecha: '2026-08-23', estado: 'abierta', fondoInicial: 45000, efectivoContado: null },
]

/* Ventas ya cargadas. Las de tipo 'resumen' son el cierre de jornada de un
   evento que no carga ticket por ticket. */
export const ventas = [
  { id: 'v1', eventoId: 'e1', jornadaId: 'j1', canal: 'evento', tipo: 'detallada', vendedorId: 'per1', fecha: '2026-08-22T11:20:00',
    items: [{ productoId: 'p1', cantidad: 2, precio: 7000 }, { productoId: 'p6', cantidad: 1, precio: 8000 }],
    pagos: [{ medio: 'efectivo', importe: 22000, comision: 0 }] },
  { id: 'v2', eventoId: 'e1', jornadaId: 'j1', canal: 'evento', tipo: 'detallada', vendedorId: 'per3', fecha: '2026-08-22T12:05:00',
    items: [{ productoId: 'p2', cantidad: 3, precio: 7000 }],
    pagos: [{ medio: 'efectivo', importe: 10000, comision: 0 }, { medio: 'posnet', importe: 11000, comision: 6.5 }] },
  { id: 'v3', eventoId: 'e1', jornadaId: 'j1', canal: 'evento', tipo: 'detallada', vendedorId: 'per1', fecha: '2026-08-22T15:40:00',
    items: [{ productoId: 'p7', cantidad: 2, precio: 9500 }, { productoId: 'p3', cantidad: 1, precio: 6500 }],
    pagos: [{ medio: 'transferencia', importe: 25500, comision: 0 }] },
  { id: 'v4', eventoId: 'e1', jornadaId: 'j1', canal: 'evento', tipo: 'detallada', vendedorId: 'per3', fecha: '2026-08-22T17:10:00',
    items: [{ productoId: 'p1', cantidad: 40, precio: 6300 }],
    pagos: [{ medio: 'transferencia', importe: 252000, comision: 0 }] },
  { id: 'v5', eventoId: 'e1', jornadaId: 'j1', canal: 'evento', tipo: 'detallada', vendedorId: 'per1', fecha: '2026-08-22T18:30:00',
    items: [{ productoId: 'p2', cantidad: 12, precio: 7000 }, { productoId: 'p3', cantidad: 10, precio: 6500 }],
    pagos: [{ medio: 'efectivo', importe: 149000, comision: 0 }] },
  { id: 'v6', eventoId: 'e1', jornadaId: 'j1', canal: 'evento', tipo: 'detallada', vendedorId: 'per3', fecha: '2026-08-22T19:15:00',
    items: [{ productoId: 'p6', cantidad: 30, precio: 8000 }, { productoId: 'p1', cantidad: 25, precio: 7000 }],
    pagos: [{ medio: 'efectivo', importe: 415000, comision: 0 }] },
  { id: 'v7', eventoId: 'e2', jornadaId: 'j3', canal: 'evento', tipo: 'resumen', vendedorId: 'per2', fecha: '2026-08-23T21:00:00',
    items: [{ productoId: 'p1', cantidad: 46, precio: 7000 }, { productoId: 'p2', cantidad: 52, precio: 7000 }, { productoId: 'p4', cantidad: 28, precio: 6500 }],
    pagos: [{ medio: 'efectivo', importe: 480000, comision: 0 }, { medio: 'posnet', importe: 190000, comision: 6.5 }, { medio: 'transferencia', importe: 197000, comision: 0 }] },
  { id: 'v8', eventoId: 'e4', jornadaId: null, canal: 'evento', tipo: 'resumen', vendedorId: 'per1', fecha: '2026-07-12T21:00:00',
    items: [{ productoId: 'p1', cantidad: 210, precio: 6800 }, { productoId: 'p2', cantidad: 240, precio: 6800 }, { productoId: 'p3', cantidad: 160, precio: 6300 }],
    pagos: [{ medio: 'efectivo', importe: 2100000, comision: 0 }, { medio: 'posnet', importe: 980000, comision: 6.5 }, { medio: 'transferencia', importe: 152000, comision: 0 }] },
]

export const metodosEnvio = [
  { id: 'me1', nombre: 'Retiro en el taller (Córdoba)', tipo: 'retiro_local',  costo: 0,     gratisDesde: null,  plazo: 'Coordinamos por WhatsApp' },
  { id: 'me2', nombre: 'Te lo llevo a la feria',        tipo: 'retiro_evento', costo: 0,     gratisDesde: null,  plazo: 'Retirás en nuestro stand' },
  { id: 'me3', nombre: 'Correo Argentino a domicilio',  tipo: 'domicilio',     costo: 12000, gratisDesde: 90000, plazo: '3 a 5 días hábiles' },
  { id: 'me4', nombre: 'Correo Argentino a sucursal',   tipo: 'sucursal',      costo: 8500,  gratisDesde: 90000, plazo: '3 a 5 días hábiles' },
]

export const pedidos = [
  { id: 'pd1', numero: 1041, cliente: 'Ana Pérez',      email: 'ana@ejemplo.com',    localidad: 'Rosario, Santa Fe',  estado: 'pagado',         envio: 12000, medio: 'transferencia', fecha: '2026-08-23T09:14:00',
    items: [{ productoId: 'p1', cantidad: 3, precio: 8500 }] },
  { id: 'pd2', numero: 1042, cliente: 'Julián Sosa',    email: 'julian@ejemplo.com', localidad: 'CABA',              estado: 'pendiente_pago', envio: 12000, medio: 'transferencia', fecha: '2026-08-23T18:02:00',
    items: [{ productoId: 'p7', cantidad: 2, precio: 11000 }, { productoId: 'p6', cantidad: 1, precio: 9500 }] },
  { id: 'pd3', numero: 1043, cliente: 'Vale Gutiérrez', email: 'vale@ejemplo.com',   localidad: 'Córdoba Capital',   estado: 'en_preparacion', envio: 0,     medio: 'transferencia', fecha: '2026-08-24T08:40:00',
    items: [{ productoId: 'p2', cantidad: 4, precio: 8500 }, { productoId: 'p3', cantidad: 2, precio: 8000 }] },
  { id: 'pd4', numero: 1040, cliente: 'Nico Ferreyra',  email: 'nico@ejemplo.com',   localidad: 'Neuquén',           estado: 'despachado',     envio: 12000, medio: 'transferencia', fecha: '2026-08-21T16:20:00',
    items: [{ productoId: 'p5', cantidad: 2, precio: 9000 }, { productoId: 'p1', cantidad: 2, precio: 8500 }] },
]

export const descripcionesWeb = {
  p1: 'Higos de estación cocinados a fuego lento, sin pectina agregada. Espesa, oscura y con los frutos enteros a la vista.',
  p2: 'La más pedida en cada feria. Frutillas del cinturón verde cordobés, azúcar justa y jugo de limón.',
  p3: 'Duraznos de Mendoza en trozos grandes. Dulce y suave, la que eligen los chicos.',
  p4: 'Naranjas con un poco de cáscara en hebras. Amarga en el final, ideal para tostadas.',
  p5: 'La que sorprende a todos. Va con quesos duros y picadas, no con el desayuno.',
  p6: 'Membrillo firme, cortado en tajadas. Receta de la abuela, sin colorantes.',
  p7: 'Rosa mosqueta patagónica. Producción chica, sale una vez al año.',
  p8: 'Zapallo criollo con clavo de olor.',
}
