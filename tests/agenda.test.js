const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");
const { pathToFileURL } = require("node:url");

const archivoAgenda = path.join(__dirname, "..", "js", "agenda.mjs");
const importarAgenda = () => import(pathToFileURL(archivoAgenda).href);

test("crea un turno confirmado con un ID correlativo y devuelve la lista actualizada", async () => {
  const { crearTurno } = await importarAgenda();
  const turnosExistentes = [
    { id: "TRN-105", rubro: "Corte", fecha: "2026-11-20", horario: "09:00", estado: "confirmado" },
    { id: "TRN-106", rubro: "Coloración", fecha: "2026-11-20", horario: "09:00", estado: "confirmado" }
  ];
  const nuevoTurnoDatos = {
    nombre: "Julieta Gómez",
    rubro: "Corte",
    servicio: "Corte de cabello",
    fecha: "2026-11-20",
    hora: "10:00"
  };

  const resultado = crearTurno(turnosExistentes, nuevoTurnoDatos);

  assert.equal(resultado.turnos.length, 3);
  assert.equal(resultado.turnoCreado.id, "TRN-107");
  assert.equal(resultado.turnoCreado.horario, "10:00");
  assert.equal(resultado.turnoCreado.estado, "confirmado");
  assert.equal(resultado.turnos[2], resultado.turnoCreado);
  assert.equal(turnosExistentes.length, 2);
});

test("rechaza otro turno confirmado en la misma categoría, fecha y hora", async () => {
  const { crearTurno } = await importarAgenda();
  const turnosExistentes = [
    { id: "TRN-106", rubro: "Corte", fecha: "2026-11-20", horario: "10:00", estado: "confirmado" }
  ];

  assert.throws(
    () => crearTurno(turnosExistentes, {
      rubro: "Corte",
      servicio: "Corte y brushing",
      fecha: "2026-11-20",
      hora: "10:00"
    }),
    {
      name: "Error",
      message: /Ya existe un turno confirmado para Corte el 2026-11-20 a las 10:00/
    }
  );
});

test("permite el mismo horario en otra categoría, fecha o si el turno anterior fue cancelado", async () => {
  const { crearTurno } = await importarAgenda();
  const turnosExistentes = [
    { id: "TRN-106", rubro: "Corte", fecha: "2026-11-20", horario: "10:00", estado: "cancelado" },
    { id: "TRN-107", rubro: "Coloración", fecha: "2026-11-20", horario: "10:00", estado: "confirmado" },
    { id: "TRN-108", rubro: "Corte", fecha: "2026-11-21", horario: "10:00", estado: "confirmado" }
  ];

  const resultado = crearTurno(turnosExistentes, {
    rubro: "Corte",
    fecha: "2026-11-20",
    hora: "10:00"
  });

  assert.equal(resultado.turnoCreado.id, "TRN-109");
  assert.equal(resultado.turnos.length, 4);
});

test("filtra turnos por texto sin distinguir mayúsculas y minúsculas", async () => {
  const { filtrarTurnos } = await importarAgenda();
  const turnos = [
    { id: "TRN-107", nombre: "Ana Pérez", telefono: "1123456789", rubro: "Corte", estado: "confirmado", fecha: "2026-11-20" },
    { id: "TRN-108", nombre: "María López", telefono: "1198765432", rubro: "Coloración", estado: "atendido", fecha: "2026-11-21" }
  ];

  assert.deepEqual(filtrarTurnos(turnos, { busqueda: "ANA" }), [turnos[0]]);
  assert.deepEqual(filtrarTurnos(turnos, { busqueda: "98765432" }), [turnos[1]]);
  assert.deepEqual(filtrarTurnos(turnos, { busqueda: "trn-108" }), [turnos[1]]);
});

test("combina categoría, estado y fecha con la búsqueda", async () => {
  const { filtrarTurnos } = await importarAgenda();
  const turnos = [
    { id: "TRN-107", nombre: "Ana Pérez", telefono: "1123456789", rubro: "Corte", estado: "confirmado", fecha: "2026-11-20" },
    { id: "TRN-108", nombre: "Ana López", telefono: "1198765432", rubro: "Corte", estado: "atendido", fecha: "2026-11-20" },
    { id: "TRN-109", nombre: "Ana Díaz", telefono: "1111111111", rubro: "Coloración", estado: "confirmado", fecha: "2026-11-20" },
    { id: "TRN-110", nombre: "Ana Ruiz", telefono: "1122222222", rubro: "Corte", estado: "confirmado", fecha: "2026-11-21" }
  ];

  const filtrados = filtrarTurnos(turnos, {
    busqueda: "ana",
    rubro: "Corte",
    estado: "confirmado",
    fecha: "2026-11-20"
  });

  assert.deepEqual(filtrados, [turnos[0]]);
});

test("filtra por coincidencia parcial en nombre, teléfono o código", async () => {
  const { filtrarTurnos } = await importarAgenda();
  const turnos = [
    { id: "TRN-107", nombre: "Ana Pérez", telefono: "1123456789", rubro: "Corte", estado: "confirmado", fecha: "2026-11-20" },
    { id: "TRN-108", nombre: "María López", telefono: "1198765432", rubro: "Coloración", estado: "atendido", fecha: "2026-11-21" }
  ];

  assert.deepEqual(filtrarTurnos(turnos, { busqueda: "ana" }), [turnos[0]]);
  assert.deepEqual(filtrarTurnos(turnos, { busqueda: "98765432" }), [turnos[1]]);
  assert.deepEqual(filtrarTurnos(turnos, { busqueda: "trn-108" }), [turnos[1]]);
});

test("aplica fecha exacta y devuelve todos los turnos sin filtros", async () => {
  const { filtrarTurnos } = await importarAgenda();
  const turnos = [
    { id: "TRN-107", nombre: "Ana Pérez", telefono: "1123456789", rubro: "Corte", estado: "confirmado", fecha: "2026-11-20" },
    { id: "TRN-108", nombre: "Ana López", telefono: "1198765432", rubro: "Corte", estado: "atendido", fecha: "2026-11-21" }
  ];

  assert.deepEqual(filtrarTurnos(turnos, { fecha: "2026-11-20" }), [turnos[0]]);
  assert.deepEqual(filtrarTurnos(turnos), turnos);
});

test("cambia el estado de un turno existente sin mutar la lista original", async () => {
  const { cambiarEstadoTurno } = await importarAgenda();
  const turnos = [
    { id: "TRN-107", nombre: "Ana Pérez", estado: "confirmado" },
    { id: "TRN-108", nombre: "María López", estado: "confirmado" }
  ];

  const atendidos = cambiarEstadoTurno(turnos, "TRN-107", "atendido");
  assert.equal(atendidos[0].estado, "atendido");
  assert.equal(atendidos[1].estado, "confirmado");
  assert.equal(turnos[0].estado, "confirmado");
  assert.notEqual(atendidos, turnos);

  const cancelados = cambiarEstadoTurno(turnos, "TRN-108", "cancelado");
  assert.equal(cancelados[1].estado, "cancelado");
});

test("rechaza un estado no permitido o un turno inexistente", async () => {
  const { cambiarEstadoTurno } = await importarAgenda();
  const turnos = [{ id: "TRN-107", estado: "confirmado" }];

  assert.throws(
    () => cambiarEstadoTurno(turnos, "TRN-107", "confirmado"),
    { name: "RangeError", message: /atendido.*cancelado/ }
  );
  assert.throws(
    () => cambiarEstadoTurno(turnos, "TRN-999", "cancelado"),
    { name: "Error", message: /No se encontró el turno TRN-999/ }
  );
});

test("reprograma un turno y conserva los demás datos sin mutar la lista", async () => {
  const { reprogramarTurno } = await importarAgenda();
  const turnos = [
    {
      id: "TRN-101",
      rubro: "Corte",
      fecha: "2026-11-20",
      horario: "09:00",
      hora: "09:00",
      estado: "confirmado",
      nombre: "Ana Pérez"
    },
    { id: "TRN-102", rubro: "Coloración", fecha: "2026-11-20", horario: "09:00", estado: "confirmado" }
  ];

  const actualizados = reprogramarTurno(turnos, "TRN-101", "2026-11-21", "10:30");

  assert.equal(actualizados[0].fecha, "2026-11-21");
  assert.equal(actualizados[0].hora, "10:30");
  assert.equal(actualizados[0].horario, "10:30");
  assert.equal(actualizados[0].nombre, "Ana Pérez");
  assert.equal(actualizados[1], turnos[1]);
  assert.equal(turnos[0].fecha, "2026-11-20");
});

test("rechaza una reprogramación que se solapa con otro turno confirmado", async () => {
  const { reprogramarTurno } = await importarAgenda();
  const turnos = [
    { id: "TRN-101", rubro: "Corte", fecha: "2026-11-20", horario: "09:00", estado: "confirmado" },
    { id: "TRN-102", rubro: "Corte", fecha: "2026-11-21", horario: "10:00", estado: "confirmado" },
    { id: "TRN-103", rubro: "Coloración", fecha: "2026-11-21", horario: "10:30", estado: "confirmado" }
  ];

  assert.throws(
    () => reprogramarTurno(turnos, "TRN-101", "2026-11-21", "10:00"),
    { name: "Error", message: /Ya existe un turno confirmado para Corte el 2026-11-21 a las 10:00/ }
  );
});

test("no considera ocupado el horario actual del mismo turno y permite otra categoría", async () => {
  const { reprogramarTurno } = await importarAgenda();
  const turnos = [
    { id: "TRN-101", rubro: "Corte", fecha: "2026-11-20", horario: "09:00", estado: "confirmado" },
    { id: "TRN-102", rubro: "Coloración", fecha: "2026-11-21", horario: "10:00", estado: "confirmado" }
  ];

  const mismoHorario = reprogramarTurno(turnos, "TRN-101", "2026-11-20", "09:00");
  const otraCategoria = reprogramarTurno(turnos, "TRN-101", "2026-11-21", "10:00");

  assert.equal(mismoHorario[0].horario, "09:00");
  assert.equal(otraCategoria[0].fecha, "2026-11-21");
  assert.equal(otraCategoria[0].horario, "10:00");
});

test("rechaza reprogramar un turno inexistente", async () => {
  const { reprogramarTurno } = await importarAgenda();

  assert.throws(
    () => reprogramarTurno([], "TRN-999", "2026-11-21", "10:00"),
    { name: "Error", message: /No se encontró el turno TRN-999/ }
  );
});

test("elimina el turno indicado y conserva la lista original", async () => {
  const { eliminarTurno } = await importarAgenda();
  const turnos = [
    { id: "TRN-101", nombre: "Ana Pérez" },
    { id: "TRN-102", nombre: "María López" }
  ];

  const restantes = eliminarTurno(turnos, "TRN-101");

  assert.deepEqual(restantes, [turnos[1]]);
  assert.notEqual(restantes, turnos);
  assert.equal(turnos.length, 2);
});

test("devuelve un nuevo array sin cambios si el turno no existe", async () => {
  const { eliminarTurno } = await importarAgenda();
  const turnos = [{ id: "TRN-101", nombre: "Ana Pérez" }];

  const restantes = eliminarTurno(turnos, "TRN-999");

  assert.deepEqual(restantes, turnos);
  assert.notEqual(restantes, turnos);
});