function convertirHoraAMinutos(hora) {
  const coincidencia = /^(\d{2}):(\d{2})$/.exec(hora);
  if (!coincidencia) {
    throw new TypeError("La hora debe tener el formato HH:mm.");
  }

  const horas = Number(coincidencia[1]);
  const minutos = Number(coincidencia[2]);
  if (horas > 23 || minutos > 59) {
    throw new RangeError("La hora debe ser válida.");
  }

  return horas * 60 + minutos;
}

function convertirMinutosAHora(minutosTotales) {
  const horas = Math.floor(minutosTotales / 60);
  const minutos = minutosTotales % 60;
  return `${String(horas).padStart(2, "0")}:${String(minutos).padStart(2, "0")}`;
}

export function generarFranjasHorarias(horaInicio, horaFin, intervaloMinutos) {
  const inicioEnMinutos = convertirHoraAMinutos(horaInicio);
  const finEnMinutos = convertirHoraAMinutos(horaFin);
  if (!Number.isInteger(intervaloMinutos) || intervaloMinutos <= 0) {
    throw new RangeError("El intervalo debe ser un número entero positivo.");
  }
  if (finEnMinutos < inicioEnMinutos) {
    throw new RangeError("La hora de fin no puede ser anterior a la hora de inicio.");
  }

  const franjas = [];
  for (
    let horaEnMinutos = inicioEnMinutos;
    horaEnMinutos <= finEnMinutos;
    horaEnMinutos += intervaloMinutos
  ) {
    franjas.push(convertirMinutosAHora(horaEnMinutos));
  }

  return franjas;
}

export function obtenerHorariosDisponibles(fecha, rubro, turnosExistentes, todasLasFranjas) {
  return todasLasFranjas.map((horario) => {
    const estaOcupado = turnosExistentes.some((turno) =>
      turno.fecha === fecha
      && turno.rubro === rubro
      && turno.horario === horario
      && turno.estado === "confirmado"
    );

    return { horario, disponible: !estaOcupado };
  });
}