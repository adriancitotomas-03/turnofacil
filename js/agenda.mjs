function obtenerSiguienteId(turnosExistentes) {
  const idsNumericos = turnosExistentes
    .map((turno) => /^TRN-(\d+)$/.exec(turno.id))
    .filter(Boolean)
    .map((coincidencia) => Number(coincidencia[1]));
  let siguienteNumero = Math.max(0, ...idsNumericos) + 1;
  let id = `TRN-${String(siguienteNumero).padStart(3, "0")}`;

  while (turnosExistentes.some((turno) => turno.id === id)) {
    siguienteNumero += 1;
    id = `TRN-${String(siguienteNumero).padStart(3, "0")}`;
  }

  return id;
}

export function crearTurno(turnosExistentes, nuevoTurnoDatos) {
  const horario = nuevoTurnoDatos.horario ?? nuevoTurnoDatos.hora;
  const haySolapamiento = turnosExistentes.some((turno) =>
    turno.estado === "confirmado"
    && turno.rubro === nuevoTurnoDatos.rubro
    && turno.fecha === nuevoTurnoDatos.fecha
    && (turno.horario ?? turno.hora) === horario
  );

  if (haySolapamiento) {
    throw new Error(
      `Ya existe un turno confirmado para ${nuevoTurnoDatos.rubro} el ${nuevoTurnoDatos.fecha} a las ${horario}.`
    );
  }

  const turnoCreado = {
    ...nuevoTurnoDatos,
    id: obtenerSiguienteId(turnosExistentes),
    horario,
    estado: "confirmado"
  };

  return {
    turnos: [...turnosExistentes, turnoCreado],
    turnoCreado
  };
}

export function filtrarTurnos(turnos, { busqueda = "", rubro = "", estado = "", fecha = "" } = {}) {
  const textoBusqueda = String(busqueda).trim().toLowerCase();

  return turnos.filter((turno) => {
    const coincideBusqueda = !textoBusqueda || [
      turno.nombre,
      turno.telefono,
      turno.id
    ].some((valor) => String(valor ?? "").toLowerCase().includes(textoBusqueda));
    const coincideRubro = !rubro || turno.rubro === rubro;
    const coincideEstado = !estado || turno.estado === estado;
    const coincideFecha = !fecha || turno.fecha === fecha;

    return coincideBusqueda && coincideRubro && coincideEstado && coincideFecha;
  });
}

export function cambiarEstadoTurno(turnos, idTurno, nuevoEstado) {
  const estadosPermitidos = ["atendido", "cancelado"];
  if (!estadosPermitidos.includes(nuevoEstado)) {
    throw new RangeError("El nuevo estado debe ser \"atendido\" o \"cancelado\".");
  }

  const existeTurno = turnos.some((turno) => turno.id === idTurno);
  if (!existeTurno) {
    throw new Error(`No se encontró el turno ${idTurno}.`);
  }

  return turnos.map((turno) => (
    turno.id === idTurno ? { ...turno, estado: nuevoEstado } : turno
  ));
}

export function reprogramarTurno(turnos, idTurno, nuevaFecha, nuevaHora) {
  const turnoActual = turnos.find((turno) => turno.id === idTurno);
  if (!turnoActual) {
    throw new Error(`No se encontró el turno ${idTurno}.`);
  }

  const haySolapamiento = turnos.some((turno) =>
    turno.id !== idTurno
    && turno.estado === "confirmado"
    && turno.rubro === turnoActual.rubro
    && turno.fecha === nuevaFecha
    && (turno.horario ?? turno.hora) === nuevaHora
  );
  if (haySolapamiento) {
    throw new Error(
      `Ya existe un turno confirmado para ${turnoActual.rubro} el ${nuevaFecha} a las ${nuevaHora}.`
    );
  }

  return turnos.map((turno) => (
    turno.id === idTurno
      ? { ...turno, fecha: nuevaFecha, hora: nuevaHora, horario: nuevaHora }
      : turno
  ));
}

export function eliminarTurno(turnos, idTurno) {
  return turnos.filter((turno) => turno.id !== idTurno);
}