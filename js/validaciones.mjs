function obtenerFechaLocalActual() {
  const hoy = new Date();
  const anio = hoy.getFullYear();
  const mes = String(hoy.getMonth() + 1).padStart(2, "0");
  const dia = String(hoy.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

function esFechaValida(fecha) {
  if (typeof fecha !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return false;
  }

  const [anio, mes, dia] = fecha.split("-").map(Number);
  const fechaCalendario = new Date(0);
  fechaCalendario.setFullYear(anio, mes - 1, dia);
  fechaCalendario.setHours(0, 0, 0, 0);

  return fechaCalendario.getFullYear() === anio
    && fechaCalendario.getMonth() === mes - 1
    && fechaCalendario.getDate() === dia;
}

export function validarDatosTurno(datosTurno) {
  const errores = [];
  const nombre = typeof datosTurno?.nombre === "string" ? datosTurno.nombre.trim() : "";
  const telefono = typeof datosTurno?.telefono === "string" ? datosTurno.telefono : "";
  const email = typeof datosTurno?.email === "string" ? datosTurno.email.trim() : "";
  const fecha = datosTurno?.fecha;

  if (typeof datosTurno?.rubro !== "string" || !datosTurno.rubro.trim()) {
    errores.push("Seleccioná una categoría.");
  }
  if (typeof datosTurno?.servicio !== "string" || !datosTurno.servicio.trim()) {
    errores.push("Seleccioná un servicio.");
  }
  if (nombre.length < 3) {
    errores.push("El nombre del cliente debe tener al menos 3 caracteres.");
  }
  if (telefono.replace(/\D/g, "").length < 7) {
    errores.push("El teléfono debe contener al menos 7 dígitos.");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errores.push("Ingresá un correo electrónico válido.");
  }
  if (!esFechaValida(fecha)) {
    errores.push("Ingresá una fecha válida.");
  } else if (fecha < obtenerFechaLocalActual()) {
    errores.push("La fecha del turno no puede ser anterior a hoy.");
  }
  if (typeof datosTurno?.hora !== "string" || !datosTurno.hora.trim()) {
    errores.push("Seleccioná un horario.");
  }

  return { valido: errores.length === 0, errores };
}