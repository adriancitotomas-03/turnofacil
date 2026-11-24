import { CATEGORIAS, obtenerServiciosPorCategoria } from "./servicios.mjs";
import { generarFranjasHorarias, obtenerHorariosDisponibles } from "./horarios.mjs";
import {
  crearTurno,
  filtrarTurnos,
  cambiarEstadoTurno,
  reprogramarTurno,
  eliminarTurno
} from "./agenda.mjs";
import { validarDatosTurno } from "./validaciones.mjs";
import { calcularMetricas } from "./dashboard.mjs";

const pestanas = Array.from(document.querySelectorAll(".tab-boton"));
const paneles = Array.from(document.querySelectorAll(".panel-contenido"));
const botonIrAgenda = document.querySelector("#boton-ir-agenda");
const botonIrNuevo = document.querySelector("#boton-ir-nuevo");
const selectorRubro = document.querySelector("#rubro");
const selectorServicio = document.querySelector("#servicio");
const selectorFecha = document.querySelector("#fecha");
const grillaHorarios = document.querySelector("#grilla-horarios");
const horarioSeleccionado = document.querySelector("#horario-seleccionado");
const formularioTurno = document.querySelector("#formulario-turno");
const mensajeFormulario = document.querySelector("#mensaje-formulario");
const comprobanteVacio = document.querySelector("#comprobante-vacio");
const comprobanteReserva = document.querySelector("#comprobante-reserva");
const ticketId = document.querySelector("#ticket-id");
const ticketCliente = document.querySelector("#ticket-cliente");
const ticketContacto = document.querySelector("#ticket-contacto");
const ticketRubro = document.querySelector("#ticket-rubro");
const ticketServicio = document.querySelector("#ticket-servicio");
const ticketFechaHora = document.querySelector("#ticket-fechahora");
const cuerpoTablaTurnos = document.querySelector("#cuerpo-tabla-turnos");
const agendaVacia = document.querySelector("#agenda-vacia");
const badgeContadorTurnos = document.querySelector("#badge-contador-turnos");
const filtroBusqueda = document.querySelector("#filtro-busqueda");
const filtroRubro = document.querySelector("#filtro-rubro");
const filtroEstado = document.querySelector("#filtro-estado");
const filtroFecha = document.querySelector("#filtro-fecha");
const botonLimpiarFiltros = document.querySelector("#boton-limpiar-filtros");
const modalReprogramar = document.querySelector("#modal-reprogramar");
const formularioReprogramar = document.querySelector("#formulario-reprogramar");
const botonCerrarModalReprogramar = document.querySelector("#boton-cerrar-modal-reprogramar");
const botonCancelarReprogramar = document.querySelector("#boton-cancelar-reprogramar");
const informacionReprogramacion = document.querySelector("#modal-reprogramar-info");
const idTurnoReprogramar = document.querySelector("#reprogramar-turno-id");
const rubroReprogramar = document.querySelector("#reprogramar-rubro");
const fechaReprogramar = document.querySelector("#reprogramar-fecha");
const grillaReprogramacion = document.querySelector("#reprogramar-grilla-horarios");
const horarioReprogramar = document.querySelector("#reprogramar-horario-seleccionado");
const errorReprogramacion = document.querySelector("#modal-reprogramar-error");
const modalEliminar = document.querySelector("#modal-eliminar");
const mensajeModalEliminar = document.querySelector("#modal-eliminar-mensaje");
const idTurnoEliminar = document.querySelector("#eliminar-turno-id");
const botonCerrarModalEliminar = document.querySelector("#boton-cerrar-modal-eliminar");
const botonCancelarEliminar = document.querySelector("#boton-cancelar-eliminar");
const botonConfirmarEliminar = document.querySelector("#boton-confirmar-eliminar");
const kpiTotal = document.querySelector("#kpi-total");
const kpiHoy = document.querySelector("#kpi-hoy");
const kpiHoyFecha = document.querySelector("#kpi-hoy-fecha");
const kpiAtendidos = document.querySelector("#kpi-atendidos");
const kpiTasaAtendidos = document.querySelector("#kpi-tasa-atendidos");
const kpiCancelados = document.querySelector("#kpi-cancelados");
const kpiTasaCancelados = document.querySelector("#kpi-tasa-cancelados");
const listaDistribucionRubros = document.querySelector("#lista-distribucion-rubros");
const listaProximosTurnos = document.querySelector("#lista-proximos-turnos");
const mensajeServicioPorDefecto = "Primero seleccione una categoría";
const claveAlmacenamientoTurnos = "turnos";
const franjasHorarias = generarFranjasHorarias("09:00", "17:30", 30);

function crearOpcion(valor, texto) {
  const opcion = document.createElement("option");
  opcion.value = valor;
  opcion.textContent = texto;
  return opcion;
}

function inicializarSelectorRubro() {
  CATEGORIAS.forEach((categoria) => {
    selectorRubro.append(crearOpcion(categoria, categoria));
  });
}

function actualizarServicios() {
  const categoriaSeleccionada = selectorRubro.value;
  selectorServicio.replaceChildren();

  if (!categoriaSeleccionada) {
    selectorServicio.disabled = true;
    selectorServicio.append(crearOpcion("", mensajeServicioPorDefecto));
    return;
  }

  selectorServicio.disabled = false;
  selectorServicio.append(crearOpcion("", "Seleccione un servicio..."));
  obtenerServiciosPorCategoria(categoriaSeleccionada).forEach((servicio) => {
    selectorServicio.append(crearOpcion(servicio, servicio));
  });
}

function leerTurnosExistentes() {
  const turnosGuardados = localStorage.getItem(claveAlmacenamientoTurnos);
  if (turnosGuardados === null) {
    return [];
  }

  const turnos = JSON.parse(turnosGuardados);
  if (!Array.isArray(turnos)) {
    throw new TypeError("Los turnos guardados deben estar en una lista.");
  }
  return turnos;
}

function mostrarMensajeEnGrilla(mensaje) {
  const texto = document.createElement("p");
  texto.className = "texto-ayuda";
  texto.textContent = mensaje;
  grillaHorarios.append(texto);
}

function seleccionarHorario(botonSeleccionado) {
  grillaHorarios.querySelectorAll(".boton-horario.seleccionado").forEach((boton) => {
    boton.classList.remove("seleccionado");
  });
  botonSeleccionado.classList.add("seleccionado");
  horarioSeleccionado.value = botonSeleccionado.value;
}

function mostrarMensajeFormulario(mensaje, esError) {
  mensajeFormulario.textContent = mensaje;
  mensajeFormulario.hidden = false;
  mensajeFormulario.classList.toggle("mensaje-error", esError);
  mensajeFormulario.classList.toggle("mensaje-exito", !esError);
}

function mostrarComprobante(turno) {
  ticketId.textContent = turno.id;
  ticketCliente.textContent = turno.nombre;
  ticketContacto.textContent = `${turno.telefono} · ${turno.email}`;
  ticketRubro.textContent = turno.rubro;
  ticketServicio.textContent = turno.servicio;
  ticketFechaHora.textContent = `${turno.fecha} · ${turno.horario}`;
  comprobanteVacio.hidden = true;
  comprobanteReserva.hidden = false;
}

function formatearFecha(fecha) {
  const coincidencia = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fecha);
  if (!coincidencia) {
    return fecha;
  }
  return `${coincidencia[3]}/${coincidencia[2]}/${coincidencia[1]}`;
}

function crearCelda(contenido, clase = "") {
  const celda = document.createElement("td");
  if (clase) {
    celda.className = clase;
  }
  if (typeof contenido === "string") {
    celda.textContent = contenido;
  } else {
    celda.append(contenido);
  }
  return celda;
}

function crearBotonAccion(turno, accion, texto) {
  const boton = document.createElement("button");
  boton.type = "button";
  boton.className = "boton boton-pequeno boton-secundario";
  boton.textContent = texto;
  boton.setAttribute("data-accion", accion);
  boton.setAttribute("data-turno-id", turno.id);
  boton.setAttribute("aria-label", `${texto} turno ${turno.id}`);
  return boton;
}

function crearFilaTurno(turno) {
  const fila = document.createElement("tr");
  const codigo = document.createElement("span");
  codigo.className = "codigo-celda";
  codigo.textContent = turno.id;
  fila.append(crearCelda(codigo));

  const cliente = document.createElement("div");
  const nombre = document.createElement("div");
  nombre.className = "cliente-celda-nombre";
  nombre.textContent = turno.nombre;
  const contacto = document.createElement("div");
  contacto.className = "cliente-celda-contacto";
  contacto.textContent = `${turno.telefono} · ${turno.email}`;
  cliente.append(nombre, contacto);
  fila.append(crearCelda(cliente));

  const servicio = document.createElement("div");
  servicio.textContent = `${turno.rubro} · ${turno.servicio}`;
  fila.append(crearCelda(servicio));

  const fechaHora = document.createElement("span");
  fechaHora.className = "fechahora-celda";
  fechaHora.textContent = `${formatearFecha(turno.fecha)} · ${turno.horario ?? turno.hora}`;
  fila.append(crearCelda(fechaHora));

  const estado = document.createElement("span");
  const estadosPermitidos = {
    confirmado: "badge-confirmado",
    atendido: "badge-atendido",
    cancelado: "badge-cancelado"
  };
  const nombreEstado = String(turno.estado ?? "").toLowerCase();
  estado.className = estadosPermitidos[nombreEstado]
    ? `badge ${estadosPermitidos[nombreEstado]}`
    : "badge";
  estado.textContent = nombreEstado;
  fila.append(crearCelda(estado));

  const acciones = document.createElement("div");
  acciones.className = "acciones-fila";
  acciones.append(
    crearBotonAccion(turno, "atender", "Atender"),
    crearBotonAccion(turno, "cancelar", "Cancelar"),
    crearBotonAccion(turno, "reprogramar", "Reprogramar"),
    crearBotonAccion(turno, "eliminar", "Eliminar")
  );
  fila.append(crearCelda(acciones, "col-acciones"));

  return fila;
}

function renderizarTurnos(turnos) {
  cuerpoTablaTurnos.replaceChildren();
  turnos.forEach((turno) => cuerpoTablaTurnos.append(crearFilaTurno(turno)));
  agendaVacia.hidden = turnos.length > 0;
}

function obtenerFiltrosAgenda() {
  return {
    busqueda: filtroBusqueda.value,
    rubro: filtroRubro.value,
    estado: filtroEstado.value,
    fecha: filtroFecha.value
  };
}

function actualizarDashboard(turnos) {
  const ahora = new Date();
  const fechaHoy = [
    ahora.getFullYear(),
    String(ahora.getMonth() + 1).padStart(2, "0"),
    String(ahora.getDate()).padStart(2, "0")
  ].join("-");
  const horaActual = `${String(ahora.getHours()).padStart(2, "0")}:${String(ahora.getMinutes()).padStart(2, "0")}`;
  const metricas = calcularMetricas(turnos, fechaHoy);

  kpiTotal.textContent = String(metricas.totalTurnos);
  kpiHoy.textContent = String(metricas.turnosHoy);
  kpiHoyFecha.textContent = formatearFecha(fechaHoy);
  kpiAtendidos.textContent = String(metricas.atendidos);
  kpiTasaAtendidos.textContent = `${metricas.porcentajeAtendidos}% de cumplimiento`;
  kpiCancelados.textContent = String(metricas.cancelados);
  kpiTasaCancelados.textContent = `${metricas.porcentajeCancelados}% de cancelaciones`;

  listaDistribucionRubros.replaceChildren();
  metricas.distribucionRubros.forEach(({ rubro, cantidad, porcentaje }) => {
    const elemento = document.createElement("div");
    elemento.className = "distribucion-item";
    const encabezado = document.createElement("div");
    encabezado.className = "distribucion-encabezado";
    const nombre = document.createElement("span");
    nombre.className = "distribucion-nombre";
    nombre.textContent = rubro;
    const conteo = document.createElement("span");
    conteo.className = "distribucion-conteo";
    conteo.textContent = `${cantidad} (${porcentaje}%)`;
    encabezado.append(nombre, conteo);

    const fondoBarra = document.createElement("div");
    fondoBarra.className = "distribucion-barra-fondo";
    fondoBarra.setAttribute("role", "progressbar");
    fondoBarra.setAttribute("aria-valuemin", "0");
    fondoBarra.setAttribute("aria-valuemax", "100");
    fondoBarra.setAttribute("aria-valuenow", String(porcentaje));
    const barra = document.createElement("div");
    barra.className = "distribucion-barra-progreso";
    barra.style.width = `${porcentaje}%`;
    fondoBarra.append(barra);
    elemento.append(encabezado, fondoBarra);
    listaDistribucionRubros.append(elemento);
  });

  const proximosTurnos = turnos
    .filter((turno) => {
      const horario = turno.horario ?? turno.hora;
      return turno.fecha === fechaHoy
        && turno.estado === "confirmado"
        && horario
        && horario >= horaActual;
    })
    .sort((a, b) => (a.horario ?? a.hora).localeCompare(b.horario ?? b.hora));

  listaProximosTurnos.replaceChildren();
  if (proximosTurnos.length === 0) {
    const vacio = document.createElement("li");
    vacio.className = "texto-ayuda";
    vacio.textContent = "No hay turnos pendientes para hoy.";
    listaProximosTurnos.append(vacio);
    return;
  }

  proximosTurnos.forEach((turno) => {
    const elemento = document.createElement("li");
    elemento.className = "proximo-turno-item";
    const horario = document.createElement("span");
    horario.className = "proximo-hora";
    horario.textContent = turno.horario ?? turno.hora;
    const detalle = document.createElement("div");
    detalle.className = "proximo-detalle";
    const cliente = document.createElement("div");
    cliente.className = "proximo-cliente";
    cliente.textContent = turno.nombre;
    const servicio = document.createElement("div");
    servicio.className = "proximo-servicio";
    servicio.textContent = `${turno.rubro} · ${turno.servicio}`;
    detalle.append(cliente, servicio);
    elemento.append(horario, detalle);
    listaProximosTurnos.append(elemento);
  });
}

function actualizarTablaTurnos() {
  const turnos = leerTurnosExistentes();
  renderizarTurnos(filtrarTurnos(turnos, obtenerFiltrosAgenda()));
  badgeContadorTurnos.textContent = String(turnos.length);
  actualizarDashboard(turnos);
}

function actualizarEstadoDesdeAccion(evento) {
  const boton = evento.target.closest("button[data-accion]");
  if (!boton || !cuerpoTablaTurnos.contains(boton)) {
    return;
  }

  const estadoPorAccion = {
    atender: "atendido",
    cancelar: "cancelado"
  };
  const nuevoEstado = estadoPorAccion[boton.getAttribute("data-accion")];
  if (boton.getAttribute("data-accion") === "reprogramar") {
    abrirDialogoReprogramar(boton.getAttribute("data-turno-id"));
    return;
  }
  if (boton.getAttribute("data-accion") === "eliminar") {
    abrirDialogoEliminar(boton.getAttribute("data-turno-id"));
    return;
  }
  if (!nuevoEstado) {
    return;
  }

  try {
    const turnosActualizados = cambiarEstadoTurno(
      leerTurnosExistentes(),
      boton.getAttribute("data-turno-id"),
      nuevoEstado
    );
    localStorage.setItem(claveAlmacenamientoTurnos, JSON.stringify(turnosActualizados));
    actualizarTablaTurnos();
  } catch (error) {
    console.error("No se pudo actualizar el estado del turno.", error);
  }
}

function mostrarErrorReprogramacion(mensaje) {
  errorReprogramacion.textContent = mensaje;
  errorReprogramacion.hidden = false;
}

function seleccionarHorarioReprogramado(botonSeleccionado) {
  grillaReprogramacion.querySelectorAll(".boton-horario.seleccionado").forEach((boton) => {
    boton.classList.remove("seleccionado");
  });
  botonSeleccionado.classList.add("seleccionado");
  horarioReprogramar.value = botonSeleccionado.value;
  errorReprogramacion.hidden = true;
}

function actualizarHorariosReprogramacion() {
  grillaReprogramacion.replaceChildren();
  horarioReprogramar.value = "";
  errorReprogramacion.hidden = true;

  if (!fechaReprogramar.value) {
    const texto = document.createElement("p");
    texto.className = "texto-ayuda";
    texto.textContent = "Elija una fecha para consultar horarios disponibles.";
    grillaReprogramacion.append(texto);
    return;
  }

  try {
    const turnos = leerTurnosExistentes()
      .filter((turno) => turno.id !== idTurnoReprogramar.value);
    const horarios = obtenerHorariosDisponibles(
      fechaReprogramar.value,
      rubroReprogramar.value,
      turnos,
      franjasHorarias
    );

    horarios.forEach(({ horario, disponible }) => {
      const boton = document.createElement("button");
      boton.type = "button";
      boton.className = "boton-horario";
      boton.value = horario;
      boton.textContent = horario;
      if (!disponible) {
        boton.classList.add("ocupado");
        boton.disabled = true;
      } else {
        boton.addEventListener("click", () => seleccionarHorarioReprogramado(boton));
      }
      grillaReprogramacion.append(boton);
    });
  } catch (error) {
    console.error("No se pudieron cargar los horarios para reprogramar.", error);
    mostrarErrorReprogramacion("No se pudieron cargar los horarios. Revisá los turnos guardados e intentá nuevamente.");
  }
}

function abrirDialogoReprogramar(idTurno) {
  try {
    const turno = leerTurnosExistentes().find((elemento) => elemento.id === idTurno);
    if (!turno) {
      throw new Error(`No se encontró el turno ${idTurno}.`);
    }

    idTurnoReprogramar.value = turno.id;
    rubroReprogramar.value = turno.rubro;
    fechaReprogramar.value = turno.fecha;
    horarioReprogramar.value = "";
    informacionReprogramacion.textContent = `${turno.id} · ${turno.nombre} · ${turno.rubro} / ${turno.servicio}`;
    errorReprogramacion.hidden = true;
    actualizarHorariosReprogramacion();
    modalReprogramar.showModal();
  } catch (error) {
    console.error("No se pudo abrir la reprogramación del turno.", error);
  }
}

function cerrarDialogoReprogramar() {
  modalReprogramar.close();
}

function confirmarReprogramacion(evento) {
  evento.preventDefault();
  if (!fechaReprogramar.value || !horarioReprogramar.value) {
    mostrarErrorReprogramacion("Seleccioná una fecha y un horario disponible.");
    return;
  }

  try {
    const turnosActualizados = reprogramarTurno(
      leerTurnosExistentes(),
      idTurnoReprogramar.value,
      fechaReprogramar.value,
      horarioReprogramar.value
    );
    localStorage.setItem(claveAlmacenamientoTurnos, JSON.stringify(turnosActualizados));
    actualizarTablaTurnos();
    cerrarDialogoReprogramar();
  } catch (error) {
    mostrarErrorReprogramacion(error.message);
  }
}

function abrirDialogoEliminar(idTurno) {
  try {
    const turno = leerTurnosExistentes().find((elemento) => elemento.id === idTurno);
    if (!turno) {
      throw new Error(`No se encontró el turno ${idTurno}.`);
    }

    idTurnoEliminar.value = turno.id;
    mensajeModalEliminar.textContent = `¿Está seguro de que desea eliminar el turno ${turno.id}? Esta acción no se puede deshacer.`;
    modalEliminar.showModal();
  } catch (error) {
    console.error("No se pudo abrir la eliminación del turno.", error);
  }
}

function confirmarEliminacion() {
  try {
    const turnosActualizados = eliminarTurno(leerTurnosExistentes(), idTurnoEliminar.value);
    localStorage.setItem(claveAlmacenamientoTurnos, JSON.stringify(turnosActualizados));
    modalEliminar.close();
    actualizarTablaTurnos();
  } catch (error) {
    console.error("No se pudo eliminar el turno.", error);
    mensajeModalEliminar.textContent = `No se pudo eliminar el turno: ${error.message}`;
  }
}

function inicializarFiltroRubro() {
  CATEGORIAS.forEach((categoria) => {
    filtroRubro.append(crearOpcion(categoria, categoria));
  });
}

function enviarFormularioTurno(evento) {
  evento.preventDefault();

  const datosTurno = {
    nombre: document.querySelector("#cliente-nombre").value.trim(),
    telefono: document.querySelector("#cliente-telefono").value.trim(),
    email: document.querySelector("#cliente-email").value.trim(),
    rubro: selectorRubro.value,
    servicio: selectorServicio.value,
    fecha: selectorFecha.value,
    hora: horarioSeleccionado.value,
    notas: document.querySelector("#cliente-notas").value.trim()
  };
  const resultadoValidacion = validarDatosTurno(datosTurno);

  if (!resultadoValidacion.valido) {
    mostrarMensajeFormulario(resultadoValidacion.errores.join(" "), true);
    return;
  }

  let resultadoCreacion;
  try {
    resultadoCreacion = crearTurno(leerTurnosExistentes(), datosTurno);
  } catch (error) {
    mostrarMensajeFormulario(error.message, true);
    return;
  }

  try {
    localStorage.setItem(claveAlmacenamientoTurnos, JSON.stringify(resultadoCreacion.turnos));
  } catch (error) {
    console.error("No se pudo guardar el turno.", error);
    mostrarMensajeFormulario("No se pudo guardar el turno. Revisá el almacenamiento e intentá nuevamente.", true);
    return;
  }

  actualizarTablaTurnos();
  formularioTurno.reset();
  actualizarServicios();
  actualizarGrillaHorarios();
  mostrarComprobante(resultadoCreacion.turnoCreado);
  mostrarMensajeFormulario(`Turno confirmado. Código: ${resultadoCreacion.turnoCreado.id}.`, false);
}

function actualizarGrillaHorarios() {
  grillaHorarios.replaceChildren();
  horarioSeleccionado.value = "";

  if (!selectorFecha.value || !selectorRubro.value) {
    mostrarMensajeEnGrilla("Seleccione una fecha y una categoría para consultar los horarios disponibles.");
    return;
  }

  let horariosDisponibles;
  try {
    horariosDisponibles = obtenerHorariosDisponibles(
      selectorFecha.value,
      selectorRubro.value,
      leerTurnosExistentes(),
      franjasHorarias
    );
  } catch (error) {
    console.error("No se pudieron consultar los turnos guardados.", error);
    mostrarMensajeEnGrilla("No se pudieron cargar los horarios. Revisá los turnos guardados e intentá nuevamente.");
    return;
  }

  horariosDisponibles.forEach(({ horario, disponible }) => {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "boton-horario";
    boton.value = horario;
    boton.textContent = horario;
    if (!disponible) {
      boton.classList.add("ocupado");
      boton.disabled = true;
    } else {
      boton.addEventListener("click", () => seleccionarHorario(boton));
    }
    grillaHorarios.append(boton);
  });
}

inicializarSelectorRubro();
inicializarFiltroRubro();
actualizarTablaTurnos();
cuerpoTablaTurnos.addEventListener("click", actualizarEstadoDesdeAccion);
fechaReprogramar.addEventListener("change", actualizarHorariosReprogramacion);
formularioReprogramar.addEventListener("submit", confirmarReprogramacion);
botonCerrarModalReprogramar.addEventListener("click", cerrarDialogoReprogramar);
botonCancelarReprogramar.addEventListener("click", cerrarDialogoReprogramar);
botonCerrarModalEliminar.addEventListener("click", () => modalEliminar.close());
botonCancelarEliminar.addEventListener("click", () => modalEliminar.close());
botonConfirmarEliminar.addEventListener("click", confirmarEliminacion);
selectorRubro.addEventListener("change", () => {
  actualizarServicios();
  actualizarGrillaHorarios();
});
selectorFecha.addEventListener("change", actualizarGrillaHorarios);
actualizarGrillaHorarios();
formularioTurno.addEventListener("submit", enviarFormularioTurno);
filtroBusqueda.addEventListener("input", actualizarTablaTurnos);
filtroRubro.addEventListener("change", actualizarTablaTurnos);
filtroEstado.addEventListener("change", actualizarTablaTurnos);
filtroFecha.addEventListener("change", actualizarTablaTurnos);
botonLimpiarFiltros.addEventListener("click", () => {
  filtroBusqueda.value = "";
  filtroRubro.value = "";
  filtroEstado.value = "";
  filtroFecha.value = "";
  actualizarTablaTurnos();
});

function seleccionarPestana(pestanaSeleccionada) {
  pestanas.forEach((pestana) => {
    const estaActiva = pestana === pestanaSeleccionada;
    pestana.classList.toggle("activo", estaActiva);
    pestana.setAttribute("aria-selected", String(estaActiva));
  });

  paneles.forEach((panel) => {
    const estaActivo = panel.id === pestanaSeleccionada.getAttribute("aria-controls");
    panel.hidden = !estaActivo;
    panel.classList.toggle("activo", estaActivo);
  });

  if (pestanaSeleccionada.getAttribute("aria-controls") === "panel-dashboard") {
    actualizarDashboard(leerTurnosExistentes());
  }
}

pestanas.forEach((pestana) => {
  pestana.addEventListener("click", () => seleccionarPestana(pestana));
});

botonIrAgenda.addEventListener("click", () => {
  seleccionarPestana(document.querySelector("#tab-agenda"));
});

botonIrNuevo.addEventListener("click", () => {
  seleccionarPestana(document.querySelector("#tab-nuevo"));
});