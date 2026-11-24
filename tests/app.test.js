const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

function crearElemento(id, atributos = {}) {
  const clases = new Set(atributos.class?.split(" ") ?? []);
  const valoresAtributos = { ...atributos };

  return {
    id,
    hidden: Boolean(atributos.hidden),
    disabled: false,
    open: false,
    style: {},
    escuchas: {},
    opciones: [],
    hijos: [],
    value: "",
    get className() {
      return [...clases].join(" ");
    },
    set className(valor) {
      clases.clear();
      valor.split(" ").filter(Boolean).forEach((clase) => clases.add(clase));
    },
    classList: {
      contains(clase) {
        return clases.has(clase);
      },
      add(clase) {
        clases.add(clase);
      },
      remove(clase) {
        clases.delete(clase);
      },
      toggle(clase, activa) {
        if (activa) {
          clases.add(clase);
        } else {
          clases.delete(clase);
        }
      }
    },
    addEventListener(tipo, manejador) {
      this.escuchas[tipo] = manejador;
    },
    showModal() {
      this.open = true;
    },
    close() {
      this.open = false;
    },
    append(...opciones) {
      this.opciones.push(...opciones);
      this.hijos.push(...opciones);
    },
    replaceChildren(...opciones) {
      this.opciones = opciones;
      this.hijos = opciones;
    },
    querySelectorAll(selector) {
      if (selector !== ".boton-horario.seleccionado") {
        return [];
      }
      return this.hijos.filter((hijo) => hijo.classList.contains("boton-horario")
        && hijo.classList.contains("seleccionado"));
    },
    contains(elemento) {
      return Boolean(elemento);
    },
    getAttribute(nombre) {
      return valoresAtributos[nombre] ?? null;
    },
    setAttribute(nombre, valor) {
      valoresAtributos[nombre] = valor;
    },
    atributo(nombre) {
      return valoresAtributos[nombre];
    }
  };
}

function prepararNavegacion(turnosIniciales = [
  {
    id: "TRN-106",
    nombre: "Ana Pérez",
    telefono: "1123456789",
    email: "ana@ejemplo.com",
    rubro: "Corte",
    servicio: "Corte de cabello",
    fecha: "2026-11-20",
    horario: "09:30",
    estado: "confirmado"
  }
], fechaActual = new Date()) {
  const pestañas = [
    crearElemento("tab-nuevo", {
      class: "tab-boton activo",
      "aria-controls": "panel-nuevo-turno",
      "aria-selected": "true"
    }),
    crearElemento("tab-agenda", {
      class: "tab-boton",
      "aria-controls": "panel-agenda",
      "aria-selected": "false"
    }),
    crearElemento("tab-dashboard", {
      class: "tab-boton",
      "aria-controls": "panel-dashboard",
      "aria-selected": "false"
    })
  ];
  const paneles = [
    crearElemento("panel-nuevo-turno", { class: "panel-contenido activo" }),
    crearElemento("panel-agenda", { class: "panel-contenido", hidden: true }),
    crearElemento("panel-dashboard", { class: "panel-contenido", hidden: true })
  ];
  const botonIrAgenda = crearElemento("boton-ir-agenda");
  const botonIrNuevo = crearElemento("boton-ir-nuevo");
  const selectorRubro = crearElemento("rubro");
  const selectorServicio = crearElemento("servicio");
  const selectorFecha = crearElemento("fecha");
  const grillaHorarios = crearElemento("grilla-horarios");
  const horarioSeleccionado = crearElemento("horario-seleccionado");
  const formularioTurno = crearElemento("formulario-turno");
  const mensajeFormulario = crearElemento("mensaje-formulario");
  const comprobanteVacio = crearElemento("comprobante-vacio");
  const comprobanteReserva = crearElemento("comprobante-reserva", { hidden: true });
  const cuerpoTablaTurnos = crearElemento("cuerpo-tabla-turnos");
  const agendaVacia = crearElemento("agenda-vacia", { hidden: true });
  const badgeContadorTurnos = crearElemento("badge-contador-turnos");
  const filtroBusqueda = crearElemento("filtro-busqueda");
  const filtroRubro = crearElemento("filtro-rubro");
  const filtroEstado = crearElemento("filtro-estado");
  const filtroFecha = crearElemento("filtro-fecha");
  const botonLimpiarFiltros = crearElemento("boton-limpiar-filtros");
  const modalReprogramar = crearElemento("modal-reprogramar");
  const formularioReprogramar = crearElemento("formulario-reprogramar");
  const botonCerrarModalReprogramar = crearElemento("boton-cerrar-modal-reprogramar");
  const botonCancelarReprogramar = crearElemento("boton-cancelar-reprogramar");
  const informacionReprogramacion = crearElemento("modal-reprogramar-info");
  const idTurnoReprogramar = crearElemento("reprogramar-turno-id");
  const rubroReprogramar = crearElemento("reprogramar-rubro");
  const fechaReprogramar = crearElemento("reprogramar-fecha");
  const grillaReprogramacion = crearElemento("reprogramar-grilla-horarios");
  const horarioReprogramar = crearElemento("reprogramar-horario-seleccionado");
  const errorReprogramacion = crearElemento("modal-reprogramar-error");
  const modalEliminar = crearElemento("modal-eliminar");
  const mensajeModalEliminar = crearElemento("modal-eliminar-mensaje");
  const idTurnoEliminar = crearElemento("eliminar-turno-id");
  const botonCerrarModalEliminar = crearElemento("boton-cerrar-modal-eliminar");
  const botonCancelarEliminar = crearElemento("boton-cancelar-eliminar");
  const botonConfirmarEliminar = crearElemento("boton-confirmar-eliminar");
  const kpiTotal = crearElemento("kpi-total");
  const kpiHoy = crearElemento("kpi-hoy");
  const kpiHoyFecha = crearElemento("kpi-hoy-fecha");
  const kpiAtendidos = crearElemento("kpi-atendidos");
  const kpiTasaAtendidos = crearElemento("kpi-tasa-atendidos");
  const kpiCancelados = crearElemento("kpi-cancelados");
  const kpiTasaCancelados = crearElemento("kpi-tasa-cancelados");
  const listaDistribucionRubros = crearElemento("lista-distribucion-rubros");
  const listaProximosTurnos = crearElemento("lista-proximos-turnos");
  const FechaSimulada = class extends Date {
    constructor(...argumentos) {
      super(...(argumentos.length ? argumentos : [fechaActual.getTime()]));
    }
  };
  const camposTurno = {
    "#cliente-nombre": crearElemento("cliente-nombre"),
    "#cliente-telefono": crearElemento("cliente-telefono"),
    "#cliente-email": crearElemento("cliente-email"),
    "#cliente-notas": crearElemento("cliente-notas")
  };
  const tickets = {
    "#ticket-id": crearElemento("ticket-id"),
    "#ticket-cliente": crearElemento("ticket-cliente"),
    "#ticket-contacto": crearElemento("ticket-contacto"),
    "#ticket-rubro": crearElemento("ticket-rubro"),
    "#ticket-servicio": crearElemento("ticket-servicio"),
    "#ticket-fechahora": crearElemento("ticket-fechahora")
  };
  let turnosGuardados = JSON.stringify(turnosIniciales);
  formularioTurno.reset = () => {
    Object.values(camposTurno).forEach((campo) => {
      campo.value = "";
    });
    selectorRubro.value = "";
    selectorServicio.value = "";
    selectorFecha.value = "";
    horarioSeleccionado.value = "";
  };
  selectorRubro.opciones.push({ value: "", textContent: "Seleccione una categoría..." });
  selectorServicio.opciones.push({ value: "", textContent: "Primero seleccione una categoría" });
  selectorServicio.disabled = true;
  const codigo = fs.readFileSync(path.join(__dirname, "..", "js", "app.js"), "utf8")
    .replace(/^import \{[\s\S]*?\} from "\.\/(?:servicios|horarios|agenda|validaciones|dashboard)\.mjs";\r?\n/gm, "");
  const contexto = {
    Date: FechaSimulada,
    CATEGORIAS: ["Corte", "Coloración"],
    calcularMetricas(turnos, fechaHoy) {
      const totalTurnos = turnos.length;
      const atendidos = turnos.filter((turno) => turno.estado === "atendido").length;
      const cancelados = turnos.filter((turno) => turno.estado === "cancelado").length;
      const porcentaje = (cantidad) => (
        totalTurnos ? Math.round((cantidad / totalTurnos) * 100) : 0
      );
      return {
        totalTurnos,
        turnosHoy: turnos.filter((turno) => turno.fecha === fechaHoy).length,
        atendidos,
        porcentajeAtendidos: porcentaje(atendidos),
        cancelados,
        porcentajeCancelados: porcentaje(cancelados),
        distribucionRubros: ["Corte", "Coloración"].map((rubro) => {
          const cantidad = turnos.filter((turno) => turno.rubro === rubro).length;
          return { rubro, cantidad, porcentaje: porcentaje(cantidad) };
        })
      };
    },
    obtenerServiciosPorCategoria(categoria) {
      if (categoria === "Corte") {
        return ["Corte de cabello"];
      }
      return categoria === "Coloración" ? ["Color completo"] : [];
    },
    generarFranjasHorarias() {
      return ["09:00", "09:30", "10:00"];
    },
    obtenerHorariosDisponibles(fecha, rubro, turnos, franjas) {
      return franjas.map((horario) => ({
        horario,
        disponible: !turnos.some((turno) =>
          turno.fecha === fecha
          && turno.rubro === rubro
          && turno.horario === horario
          && turno.estado === "confirmado"
        )
      }));
    },
    crearTurno(turnos, datos) {
      const horario = datos.horario ?? datos.hora;
      if (turnos.some((turno) => turno.estado === "confirmado"
        && turno.fecha === datos.fecha
        && turno.rubro === datos.rubro
        && (turno.horario ?? turno.hora) === horario)) {
        throw new Error("Ese horario ya está ocupado.");
      }
      const siguienteNumero = Math.max(0, ...turnos.map((turno) => Number(turno.id.slice(4)) || 0)) + 1;
      const turnoCreado = {
        ...datos,
        id: `TRN-${String(siguienteNumero).padStart(3, "0")}`,
        horario,
        estado: "confirmado"
      };
      return { turnos: [...turnos, turnoCreado], turnoCreado };
    },
    validarDatosTurno(datos) {
      const errores = [];
      if (!datos.rubro || !datos.servicio || !datos.hora) {
        errores.push("Completá categoría, servicio y horario.");
      }
      if (datos.nombre.length < 3) {
        errores.push("El nombre es inválido.");
      }
      return { valido: errores.length === 0, errores };
    },
    filtrarTurnos(turnos, filtros = {}) {
      const busqueda = (filtros.busqueda ?? "").trim().toLowerCase();
      return turnos.filter((turno) =>
        (!busqueda || [turno.nombre, turno.telefono, turno.id]
          .some((valor) => String(valor ?? "").toLowerCase().includes(busqueda)))
        && (!filtros.rubro || turno.rubro === filtros.rubro)
        && (!filtros.estado || turno.estado === filtros.estado)
        && (!filtros.fecha || turno.fecha === filtros.fecha));
    },
    cambiarEstadoTurno(turnos, idTurno, nuevoEstado) {
      if (!["atendido", "cancelado"].includes(nuevoEstado)) {
        throw new RangeError("El nuevo estado debe ser atendido o cancelado.");
      }
      if (!turnos.some((turno) => turno.id === idTurno)) {
        throw new Error(`No se encontró el turno ${idTurno}.`);
      }
      return turnos.map((turno) => (
        turno.id === idTurno ? { ...turno, estado: nuevoEstado } : turno
      ));
    },
    reprogramarTurno(turnos, idTurno, nuevaFecha, nuevaHora) {
      const turnoActual = turnos.find((turno) => turno.id === idTurno);
      if (!turnoActual) {
        throw new Error(`No se encontró el turno ${idTurno}.`);
      }
      if (turnos.some((turno) => turno.id !== idTurno
        && turno.estado === "confirmado"
        && turno.rubro === turnoActual.rubro
        && turno.fecha === nuevaFecha
        && (turno.horario ?? turno.hora) === nuevaHora)) {
        throw new Error(`Ya existe un turno confirmado para ${turnoActual.rubro} el ${nuevaFecha} a las ${nuevaHora}.`);
      }
      return turnos.map((turno) => (
        turno.id === idTurno
          ? { ...turno, fecha: nuevaFecha, hora: nuevaHora, horario: nuevaHora }
          : turno
      ));
    },
    eliminarTurno(turnos, idTurno) {
      return turnos.filter((turno) => turno.id !== idTurno);
    },
    localStorage: {
      getItem() {
        return turnosGuardados;
      },
      setItem(clave, valor) {
        turnosGuardados = valor;
      }
    },
    console: { error() {} },
    document: {
      querySelectorAll(selector) {
        return selector === ".tab-boton" ? pestañas : paneles;
      },
      querySelector(selector) {
        const elementos = {
          "#boton-ir-agenda": botonIrAgenda,
          "#boton-ir-nuevo": botonIrNuevo,
          "#fecha": selectorFecha,
          "#formulario-turno": formularioTurno,
          "#grilla-horarios": grillaHorarios,
          "#horario-seleccionado": horarioSeleccionado,
          "#mensaje-formulario": mensajeFormulario,
          "#comprobante-vacio": comprobanteVacio,
          "#comprobante-reserva": comprobanteReserva,
          "#cuerpo-tabla-turnos": cuerpoTablaTurnos,
          "#agenda-vacia": agendaVacia,
          "#badge-contador-turnos": badgeContadorTurnos,
          "#filtro-busqueda": filtroBusqueda,
          "#filtro-rubro": filtroRubro,
          "#filtro-estado": filtroEstado,
          "#filtro-fecha": filtroFecha,
          "#boton-limpiar-filtros": botonLimpiarFiltros,
          "#modal-reprogramar": modalReprogramar,
          "#formulario-reprogramar": formularioReprogramar,
          "#boton-cerrar-modal-reprogramar": botonCerrarModalReprogramar,
          "#boton-cancelar-reprogramar": botonCancelarReprogramar,
          "#modal-reprogramar-info": informacionReprogramacion,
          "#reprogramar-turno-id": idTurnoReprogramar,
          "#reprogramar-rubro": rubroReprogramar,
          "#reprogramar-fecha": fechaReprogramar,
          "#reprogramar-grilla-horarios": grillaReprogramacion,
          "#reprogramar-horario-seleccionado": horarioReprogramar,
          "#modal-reprogramar-error": errorReprogramacion,
          "#modal-eliminar": modalEliminar,
          "#modal-eliminar-mensaje": mensajeModalEliminar,
          "#eliminar-turno-id": idTurnoEliminar,
          "#boton-cerrar-modal-eliminar": botonCerrarModalEliminar,
          "#boton-cancelar-eliminar": botonCancelarEliminar,
          "#boton-confirmar-eliminar": botonConfirmarEliminar,
          "#kpi-total": kpiTotal,
          "#kpi-hoy": kpiHoy,
          "#kpi-hoy-fecha": kpiHoyFecha,
          "#kpi-atendidos": kpiAtendidos,
          "#kpi-tasa-atendidos": kpiTasaAtendidos,
          "#kpi-cancelados": kpiCancelados,
          "#kpi-tasa-cancelados": kpiTasaCancelados,
          "#lista-distribucion-rubros": listaDistribucionRubros,
          "#lista-proximos-turnos": listaProximosTurnos,
          "#rubro": selectorRubro,
          "#servicio": selectorServicio,
          "#tab-agenda": pestañas[1],
          "#tab-nuevo": pestañas[0],
          ...camposTurno,
          ...tickets
        };
        return elementos[selector];
      },
      createElement() {
        return crearElemento("");
      }
    }
  };

  vm.runInNewContext(codigo, contexto);
  return {
    pestañas,
    paneles,
    botonIrAgenda,
    botonIrNuevo,
    selectorRubro,
    selectorServicio,
    selectorFecha,
    grillaHorarios,
    horarioSeleccionado,
    formularioTurno,
    mensajeFormulario,
    comprobanteVacio,
    comprobanteReserva,
    cuerpoTablaTurnos,
    agendaVacia,
    badgeContadorTurnos,
    filtroBusqueda,
    filtroRubro,
    filtroEstado,
    filtroFecha,
    botonLimpiarFiltros,
    modalReprogramar,
    formularioReprogramar,
    botonCerrarModalReprogramar,
    botonCancelarReprogramar,
    informacionReprogramacion,
    idTurnoReprogramar,
    rubroReprogramar,
    fechaReprogramar,
    grillaReprogramacion,
    horarioReprogramar,
    errorReprogramacion,
    modalEliminar,
    mensajeModalEliminar,
    idTurnoEliminar,
    botonCerrarModalEliminar,
    botonCancelarEliminar,
    botonConfirmarEliminar,
    kpiTotal,
    kpiHoy,
    kpiHoyFecha,
    kpiAtendidos,
    kpiTasaAtendidos,
    kpiCancelados,
    kpiTasaCancelados,
    listaDistribucionRubros,
    listaProximosTurnos,
    camposTurno,
    tickets,
    turnosGuardados: () => JSON.parse(turnosGuardados)
  };
}

function comprobarPestanaActiva(pestañas, paneles, indiceActivo) {
  pestañas.forEach((pestana, indice) => {
    const activa = indice === indiceActivo;
    assert.equal(pestana.atributo("aria-selected"), String(activa));
    assert.equal(pestana.classList.contains("activo"), activa);
  });
  paneles.forEach((panel, indice) => {
    const activo = indice === indiceActivo;
    assert.equal(panel.hidden, !activo);
    assert.equal(panel.classList.contains("activo"), activo);
  });
}

test("cada pestaña muestra su panel y actualiza la selección", () => {
  const { pestañas, paneles } = prepararNavegacion();

  pestañas[1].escuchas.click();
  comprobarPestanaActiva(pestañas, paneles, 1);

  pestañas[2].escuchas.click();
  comprobarPestanaActiva(pestañas, paneles, 2);

  pestañas[0].escuchas.click();
  comprobarPestanaActiva(pestañas, paneles, 0);
});

test("los botones directos navegan a Agenda y Nuevo Turno", () => {
  const { pestañas, paneles, botonIrAgenda, botonIrNuevo } = prepararNavegacion();

  botonIrAgenda.escuchas.click();
  comprobarPestanaActiva(pestañas, paneles, 1);

  botonIrNuevo.escuchas.click();
  comprobarPestanaActiva(pestañas, paneles, 0);
});

test("el selector de categoría carga los servicios y restablece su estado vacío", () => {
  const { selectorRubro, selectorServicio } = prepararNavegacion();

  assert.deepEqual(
    selectorRubro.opciones.map((opcion) => opcion.textContent),
    ["Seleccione una categoría...", "Corte", "Coloración"]
  );
  assert.equal(selectorServicio.disabled, true);
  assert.equal(selectorServicio.opciones[0].textContent, "Primero seleccione una categoría");

  selectorRubro.value = "Corte";
  selectorRubro.escuchas.change();
  assert.equal(selectorServicio.disabled, false);
  assert.deepEqual(
    selectorServicio.opciones.map((opcion) => opcion.textContent),
    ["Seleccione un servicio...", "Corte de cabello"]
  );

  selectorRubro.value = "Coloración";
  selectorRubro.escuchas.change();
  assert.deepEqual(
    selectorServicio.opciones.map((opcion) => opcion.textContent),
    ["Seleccione un servicio...", "Color completo"]
  );

  selectorRubro.value = "";
  selectorRubro.escuchas.change();
  assert.equal(selectorServicio.disabled, true);
  assert.deepEqual(
    selectorServicio.opciones.map((opcion) => opcion.textContent),
    ["Primero seleccione una categoría"]
  );
});

test("la grilla muestra horarios libres y ocupados, y permite una sola selección", () => {
  const {
    selectorRubro,
    selectorFecha,
    grillaHorarios,
    horarioSeleccionado
  } = prepararNavegacion();

  selectorFecha.value = "2026-11-20";
  selectorRubro.value = "Corte";
  selectorRubro.escuchas.change();

  const botones = grillaHorarios.hijos;
  assert.equal(botones.length, 3);
  assert.equal(botones[0].textContent, "09:00");
  assert.equal(botones[0].disabled, false);
  assert.equal(botones[1].disabled, true);
  assert.equal(botones[1].classList.contains("ocupado"), true);

  botones[0].escuchas.click();
  assert.equal(botones[0].classList.contains("seleccionado"), true);
  assert.equal(horarioSeleccionado.value, "09:00");

  botones[2].escuchas.click();
  assert.equal(botones[0].classList.contains("seleccionado"), false);
  assert.equal(botones[2].classList.contains("seleccionado"), true);
  assert.equal(horarioSeleccionado.value, "10:00");

  selectorFecha.value = "2026-11-21";
  selectorFecha.escuchas.change();
  assert.equal(horarioSeleccionado.value, "");
});

test("al enviar un turno válido lo guarda, limpia el formulario y muestra el comprobante", () => {
  const {
    selectorRubro,
    selectorServicio,
    selectorFecha,
    horarioSeleccionado,
    formularioTurno,
    mensajeFormulario,
    comprobanteVacio,
    comprobanteReserva,
    kpiTotal,
    camposTurno,
    tickets,
    turnosGuardados
  } = prepararNavegacion();
  const fechaFutura = new Date();
  fechaFutura.setDate(fechaFutura.getDate() + 2);
  const fecha = `${fechaFutura.getFullYear()}-${String(fechaFutura.getMonth() + 1).padStart(2, "0")}-${String(fechaFutura.getDate()).padStart(2, "0")}`;
  selectorRubro.value = "Corte";
  selectorServicio.value = "Corte de cabello";
  selectorFecha.value = fecha;
  horarioSeleccionado.value = "09:00";
  camposTurno["#cliente-nombre"].value = "Julieta Gómez";
  camposTurno["#cliente-telefono"].value = "11-4567-8901";
  camposTurno["#cliente-email"].value = "julieta@ejemplo.com";
  camposTurno["#cliente-notas"].value = "Cabello largo";
  let envioPrevenido = false;

  formularioTurno.escuchas.submit({
    preventDefault() {
      envioPrevenido = true;
    }
  });

  assert.equal(envioPrevenido, true);
  assert.equal(turnosGuardados().length, 2);
  assert.equal(turnosGuardados()[1].estado, "confirmado");
  assert.equal(turnosGuardados()[1].nombre, "Julieta Gómez");
  assert.equal(kpiTotal.textContent, "2");
  assert.equal(camposTurno["#cliente-nombre"].value, "");
  assert.equal(selectorRubro.value, "");
  assert.equal(mensajeFormulario.hidden, false);
  assert.equal(mensajeFormulario.classList.contains("mensaje-exito"), true);
  assert.equal(comprobanteVacio.hidden, true);
  assert.equal(comprobanteReserva.hidden, false);
  assert.equal(tickets["#ticket-id"].textContent, "TRN-107");
  assert.equal(tickets["#ticket-cliente"].textContent, "Julieta Gómez");
  assert.equal(tickets["#ticket-servicio"].textContent, "Corte de cabello");
});

test("al enviar datos inválidos muestra errores y no crea ni muestra un comprobante", () => {
  const {
    formularioTurno,
    mensajeFormulario,
    comprobanteVacio,
    comprobanteReserva,
    turnosGuardados
  } = prepararNavegacion();
  const cantidadInicial = turnosGuardados().length;
  let envioPrevenido = false;

  formularioTurno.escuchas.submit({
    preventDefault() {
      envioPrevenido = true;
    }
  });

  assert.equal(envioPrevenido, true);
  assert.equal(turnosGuardados().length, cantidadInicial);
  assert.equal(mensajeFormulario.hidden, false);
  assert.equal(mensajeFormulario.classList.contains("mensaje-error"), true);
  assert.equal(comprobanteVacio.hidden, false);
  assert.equal(comprobanteReserva.hidden, true);
});

test("renderiza cada turno con sus datos, estado y acciones, y actualiza el contador", () => {
  const { cuerpoTablaTurnos, agendaVacia, badgeContadorTurnos } = prepararNavegacion();
  const [fila] = cuerpoTablaTurnos.hijos;
  const celdas = fila.hijos;
  const codigo = celdas[0].hijos[0];
  const fechaHora = celdas[3].hijos[0];
  const badgeEstado = celdas[4].hijos[0];
  const botonesAccion = celdas[5].hijos[0].hijos;

  assert.equal(cuerpoTablaTurnos.hijos.length, 1);
  assert.equal(codigo.textContent, "TRN-106");
  assert.equal(codigo.classList.contains("codigo-celda"), true);
  assert.equal(celdas[1].hijos[0].hijos[0].textContent, "Ana Pérez");
  assert.equal(celdas[1].hijos[0].hijos[1].textContent, "1123456789 · ana@ejemplo.com");
  assert.equal(celdas[2].hijos[0].textContent, "Corte · Corte de cabello");
  assert.equal(fechaHora.textContent, "20/11/2026 · 09:30");
  assert.equal(badgeEstado.classList.contains("badge-confirmado"), true);
  assert.deepEqual(botonesAccion.map((boton) => boton.textContent), [
    "Atender",
    "Cancelar",
    "Reprogramar",
    "Eliminar"
  ]);
  assert.equal(botonesAccion[0].atributo("data-turno-id"), "TRN-106");
  assert.equal(botonesAccion[0].atributo("data-accion"), "atender");
  assert.equal(agendaVacia.hidden, true);
  assert.equal(badgeContadorTurnos.textContent, "1");
});

test("muestra la agenda vacía y contador cero cuando no hay turnos", () => {
  const { cuerpoTablaTurnos, agendaVacia, badgeContadorTurnos } = prepararNavegacion([]);

  assert.equal(cuerpoTablaTurnos.hijos.length, 0);
  assert.equal(agendaVacia.hidden, false);
  assert.equal(badgeContadorTurnos.textContent, "0");
});

test("aplica la clase de badge correspondiente a cada estado", () => {
  const turnos = ["confirmado", "atendido", "cancelado"].map((estado, indice) => ({
    id: `TRN-10${indice}`,
    nombre: "Ana Pérez",
    telefono: "1123456789",
    email: "ana@ejemplo.com",
    rubro: "Corte",
    servicio: "Corte de cabello",
    fecha: "2026-11-20",
    horario: "09:30",
    estado
  }));
  const { cuerpoTablaTurnos } = prepararNavegacion(turnos);

  assert.deepEqual(
    cuerpoTablaTurnos.hijos.map((fila) => fila.hijos[4].hijos[0].className),
    ["badge badge-confirmado", "badge badge-atendido", "badge badge-cancelado"]
  );
});

test("actualiza la tabla en los cambios de filtros y permite limpiarlos", () => {
  const turnos = [
    {
      id: "TRN-101",
      nombre: "Ana Pérez",
      telefono: "1123456789",
      email: "ana@ejemplo.com",
      rubro: "Corte",
      servicio: "Corte de cabello",
      fecha: "2026-11-20",
      horario: "09:00",
      estado: "confirmado"
    },
    {
      id: "TRN-102",
      nombre: "María López",
      telefono: "1198765432",
      email: "maria@ejemplo.com",
      rubro: "Coloración",
      servicio: "Color completo",
      fecha: "2026-11-21",
      horario: "10:00",
      estado: "atendido"
    }
  ];
  const {
    cuerpoTablaTurnos,
    agendaVacia,
    badgeContadorTurnos,
    filtroBusqueda,
    filtroRubro,
    filtroEstado,
    filtroFecha,
    botonLimpiarFiltros
  } = prepararNavegacion(turnos);

  filtroBusqueda.value = "ANA";
  filtroBusqueda.escuchas.input();
  assert.equal(cuerpoTablaTurnos.hijos.length, 1);
  assert.equal(cuerpoTablaTurnos.hijos[0].hijos[0].hijos[0].textContent, "TRN-101");
  assert.equal(badgeContadorTurnos.textContent, "2");

  filtroRubro.value = "Corte";
  filtroRubro.escuchas.change();
  filtroEstado.value = "confirmado";
  filtroEstado.escuchas.change();
  filtroFecha.value = "2026-11-20";
  filtroFecha.escuchas.change();
  assert.equal(cuerpoTablaTurnos.hijos.length, 1);

  filtroBusqueda.value = "sin coincidencias";
  filtroBusqueda.escuchas.input();
  assert.equal(cuerpoTablaTurnos.hijos.length, 0);
  assert.equal(agendaVacia.hidden, false);

  botonLimpiarFiltros.escuchas.click();
  assert.equal(filtroBusqueda.value, "");
  assert.equal(filtroRubro.value, "");
  assert.equal(filtroEstado.value, "");
  assert.equal(filtroFecha.value, "");
  assert.equal(cuerpoTablaTurnos.hijos.length, 2);
  assert.equal(agendaVacia.hidden, true);
});

test("los botones Atender y Cancelar persisten el estado y actualizan la tabla y el Dashboard", () => {
  const turnos = [
    {
      id: "TRN-101",
      nombre: "Ana Pérez",
      telefono: "1123456789",
      email: "ana@ejemplo.com",
      rubro: "Corte",
      servicio: "Corte de cabello",
      fecha: "2026-11-20",
      horario: "09:00",
      estado: "confirmado"
    },
    {
      id: "TRN-102",
      nombre: "María López",
      telefono: "1198765432",
      email: "maria@ejemplo.com",
      rubro: "Coloración",
      servicio: "Color completo",
      fecha: "2026-11-21",
      horario: "10:00",
      estado: "confirmado"
    }
  ];
  const { cuerpoTablaTurnos, badgeContadorTurnos, kpiAtendidos, kpiCancelados, turnosGuardados } = prepararNavegacion(turnos);

  function activarAccion(accion, idTurno) {
    const boton = crearElemento("boton-accion", {
      "data-accion": accion,
      "data-turno-id": idTurno
    });
    cuerpoTablaTurnos.escuchas.click({
      target: {
        closest(selector) {
          assert.equal(selector, "button[data-accion]");
          return boton;
        }
      }
    });
  }

  activarAccion("atender", "TRN-101");
  assert.equal(turnosGuardados()[0].estado, "atendido");
  assert.equal(cuerpoTablaTurnos.hijos[0].hijos[4].hijos[0].classList.contains("badge-atendido"), true);
  assert.equal(kpiAtendidos.textContent, "1");

  activarAccion("cancelar", "TRN-102");
  assert.equal(turnosGuardados()[1].estado, "cancelado");
  assert.equal(cuerpoTablaTurnos.hijos[1].hijos[4].hijos[0].classList.contains("badge-cancelado"), true);
  assert.equal(badgeContadorTurnos.textContent, "2");
  assert.equal(kpiCancelados.textContent, "1");
});

test("muestra métricas, distribución y próximos turnos, y los refresca al modificar y eliminar", () => {
  const turnos = [
    { id: "TRN-101", nombre: "Ana Pérez", telefono: "1111111111", email: "ana@ejemplo.com", rubro: "Corte", servicio: "Corte de cabello", fecha: "2026-11-20", horario: "13:30", estado: "confirmado" },
    { id: "TRN-102", nombre: "Bea López", telefono: "1122222222", email: "bea@ejemplo.com", rubro: "Corte", servicio: "Corte y brushing", fecha: "2026-11-20", horario: "10:00", estado: "confirmado" },
    { id: "TRN-103", nombre: "Cata Ruiz", telefono: "1133333333", email: "cata@ejemplo.com", rubro: "Coloración", servicio: "Color completo", fecha: "2026-11-20", horario: "15:00", estado: "atendido" },
    { id: "TRN-104", nombre: "Dani Paz", telefono: "1144444444", email: "dani@ejemplo.com", rubro: "Corte", servicio: "Corte de flequillo", fecha: "2026-11-20", horario: "16:00", estado: "cancelado" },
    { id: "TRN-105", nombre: "Eli Sol", telefono: "1155555555", email: "eli@ejemplo.com", rubro: "Peinados", servicio: "Trenzas", fecha: "2026-11-21", horario: "12:00", estado: "confirmado" }
  ];
  const {
    cuerpoTablaTurnos,
    kpiTotal,
    kpiHoy,
    kpiAtendidos,
    kpiTasaAtendidos,
    kpiCancelados,
    kpiTasaCancelados,
    listaDistribucionRubros,
    listaProximosTurnos,
    modalEliminar,
    botonConfirmarEliminar,
    turnosGuardados
  } = prepararNavegacion(turnos, new Date("2026-11-20T12:00:00"));

  assert.equal(kpiTotal.textContent, "5");
  assert.equal(kpiHoy.textContent, "4");
  assert.equal(kpiAtendidos.textContent, "1");
  assert.equal(kpiTasaAtendidos.textContent, "20% de cumplimiento");
  assert.equal(kpiCancelados.textContent, "1");
  assert.equal(kpiTasaCancelados.textContent, "20% de cancelaciones");
  assert.equal(listaDistribucionRubros.hijos[0].hijos[0].hijos[1].textContent, "3 (60%)");
  assert.equal(listaDistribucionRubros.hijos[0].hijos[1].hijos[0].style.width, "60%");
  assert.equal(listaProximosTurnos.hijos.length, 1);
  assert.equal(listaProximosTurnos.hijos[0].hijos[1].hijos[0].textContent, "Ana Pérez");

  const botonAtender = crearElemento("boton-atender", {
    "data-accion": "atender",
    "data-turno-id": "TRN-101"
  });
  cuerpoTablaTurnos.escuchas.click({ target: { closest: () => botonAtender } });
  assert.equal(kpiAtendidos.textContent, "2");
  assert.equal(listaProximosTurnos.hijos[0].textContent, "No hay turnos pendientes para hoy.");

  const botonEliminar = crearElemento("boton-eliminar", {
    "data-accion": "eliminar",
    "data-turno-id": "TRN-101"
  });
  cuerpoTablaTurnos.escuchas.click({ target: { closest: () => botonEliminar } });
  botonConfirmarEliminar.escuchas.click();

  assert.equal(modalEliminar.open, false);
  assert.equal(turnosGuardados().length, 4);
  assert.equal(kpiTotal.textContent, "4");
  assert.equal(kpiHoy.textContent, "3");
  assert.equal(kpiAtendidos.textContent, "1");
});

test("reprograma desde el diálogo usando horarios libres y lo cierra al confirmar", () => {
  const turnos = [
    {
      id: "TRN-101",
      nombre: "Ana Pérez",
      telefono: "1123456789",
      email: "ana@ejemplo.com",
      rubro: "Corte",
      servicio: "Corte de cabello",
      fecha: "2026-11-20",
      horario: "09:00",
      estado: "confirmado"
    },
    {
      id: "TRN-102",
      nombre: "María López",
      telefono: "1198765432",
      email: "maria@ejemplo.com",
      rubro: "Corte",
      servicio: "Corte y brushing",
      fecha: "2026-11-20",
      horario: "09:30",
      estado: "confirmado"
    }
  ];
  const {
    cuerpoTablaTurnos,
    modalReprogramar,
    formularioReprogramar,
    fechaReprogramar,
    grillaReprogramacion,
    horarioReprogramar,
    idTurnoReprogramar,
    errorReprogramacion,
    turnosGuardados,
    badgeContadorTurnos,
    kpiHoy
  } = prepararNavegacion(turnos, new Date("2026-11-20T08:00:00"));
  const botonReprogramar = crearElemento("boton-reprogramar", {
    "data-accion": "reprogramar",
    "data-turno-id": "TRN-101"
  });
  cuerpoTablaTurnos.escuchas.click({
    target: { closest: () => botonReprogramar }
  });

  assert.equal(modalReprogramar.open, true);
  assert.equal(idTurnoReprogramar.value, "TRN-101");
  assert.equal(grillaReprogramacion.hijos[1].disabled, true);

  fechaReprogramar.value = "2026-11-21";
  fechaReprogramar.escuchas.change();
  assert.equal(horarioReprogramar.value, "");
  const horarioLibre = grillaReprogramacion.hijos.find((boton) => boton.value === "10:00");
  horarioLibre.escuchas.click();
  assert.equal(horarioReprogramar.value, "10:00");
  assert.equal(kpiHoy.textContent, "2");

  let envioPrevenido = false;
  formularioReprogramar.escuchas.submit({
    preventDefault() {
      envioPrevenido = true;
    }
  });

  assert.equal(envioPrevenido, true);
  assert.equal(turnosGuardados()[0].fecha, "2026-11-21");
  assert.equal(turnosGuardados()[0].horario, "10:00");
  assert.equal(modalReprogramar.open, false);
  assert.equal(errorReprogramacion.hidden, true);
  assert.equal(cuerpoTablaTurnos.hijos[0].hijos[3].hijos[0].textContent, "21/11/2026 · 10:00");
  assert.equal(badgeContadorTurnos.textContent, "2");
  assert.equal(kpiHoy.textContent, "1");
});

test("confirma la eliminación desde el diálogo y actualiza la tabla y el contador", () => {
  const turnos = [
    { id: "TRN-101", nombre: "Ana Pérez", telefono: "1123456789", email: "ana@ejemplo.com", rubro: "Corte", servicio: "Corte", fecha: "2026-11-20", horario: "09:00", estado: "confirmado" },
    { id: "TRN-102", nombre: "María López", telefono: "1198765432", email: "maria@ejemplo.com", rubro: "Coloración", servicio: "Color", fecha: "2026-11-20", horario: "09:30", estado: "confirmado" }
  ];
  const {
    cuerpoTablaTurnos,
    modalEliminar,
    mensajeModalEliminar,
    idTurnoEliminar,
    botonConfirmarEliminar,
    badgeContadorTurnos,
    turnosGuardados
  } = prepararNavegacion(turnos);
  const botonEliminar = crearElemento("boton-eliminar", {
    "data-accion": "eliminar",
    "data-turno-id": "TRN-101"
  });

  cuerpoTablaTurnos.escuchas.click({ target: { closest: () => botonEliminar } });
  assert.equal(modalEliminar.open, true);
  assert.equal(idTurnoEliminar.value, "TRN-101");
  assert.match(mensajeModalEliminar.textContent, /TRN-101/);

  botonConfirmarEliminar.escuchas.click();

  assert.deepEqual(turnosGuardados().map((turno) => turno.id), ["TRN-102"]);
  assert.equal(modalEliminar.open, false);
  assert.equal(cuerpoTablaTurnos.hijos.length, 1);
  assert.equal(badgeContadorTurnos.textContent, "1");
});

test("cancelar la eliminación cierra el diálogo sin borrar el turno", () => {
  const turnos = [
    { id: "TRN-101", nombre: "Ana Pérez", telefono: "1123456789", email: "ana@ejemplo.com", rubro: "Corte", servicio: "Corte", fecha: "2026-11-20", horario: "09:00", estado: "confirmado" }
  ];
  const { cuerpoTablaTurnos, modalEliminar, botonCancelarEliminar, turnosGuardados } = prepararNavegacion(turnos);
  const botonEliminar = crearElemento("boton-eliminar", {
    "data-accion": "eliminar",
    "data-turno-id": "TRN-101"
  });

  cuerpoTablaTurnos.escuchas.click({ target: { closest: () => botonEliminar } });
  botonCancelarEliminar.escuchas.click();

  assert.equal(modalEliminar.open, false);
  assert.equal(turnosGuardados().length, 1);
  assert.equal(cuerpoTablaTurnos.hijos.length, 1);
});
