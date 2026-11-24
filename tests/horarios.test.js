const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");
const { pathToFileURL } = require("node:url");

const archivoHorarios = path.join(__dirname, "..", "js", "horarios.mjs");
const importarHorarios = () => import(pathToFileURL(archivoHorarios).href);

test("genera las 18 franjas de 09:00 a 17:30 cada 30 minutos", async () => {
  const { generarFranjasHorarias } = await importarHorarios();
  const franjas = generarFranjasHorarias("09:00", "17:30", 30);

  assert.equal(franjas.length, 18);
  assert.equal(franjas[0], "09:00");
  assert.equal(franjas.at(-1), "17:30");
  assert.deepEqual(franjas.slice(0, 4), ["09:00", "09:30", "10:00", "10:30"]);
});

test("marca ocupada solo la franja de un turno confirmado en la fecha y rubro elegidos", async () => {
  const { obtenerHorariosDisponibles } = await importarHorarios();
  const turnosExistentes = [
    { fecha: "2026-11-20", rubro: "Corte", horario: "10:00", estado: "confirmado" },
    { fecha: "2026-11-21", rubro: "Corte", horario: "10:30", estado: "confirmado" },
    { fecha: "2026-11-20", rubro: "Coloración", horario: "11:00", estado: "confirmado" },
    { fecha: "2026-11-20", rubro: "Corte", horario: "11:30", estado: "cancelado" }
  ];

  const horarios = obtenerHorariosDisponibles(
    "2026-11-20",
    "Corte",
    turnosExistentes,
    ["10:00", "10:30", "11:00", "11:30"]
  );

  assert.deepEqual(horarios, [
    { horario: "10:00", disponible: false },
    { horario: "10:30", disponible: true },
    { horario: "11:00", disponible: true },
    { horario: "11:30", disponible: true }
  ]);
});