const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");
const { pathToFileURL } = require("node:url");

const archivoValidaciones = path.join(__dirname, "..", "js", "validaciones.mjs");
const importarValidaciones = () => import(pathToFileURL(archivoValidaciones).href);

function obtenerFechaLocal(diasDesdeHoy = 0) {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + diasDesdeHoy);
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

test("acepta datos válidos para un turno de hoy o futuro", async () => {
  const { validarDatosTurno } = await importarValidaciones();
  const resultado = validarDatosTurno({
    nombre: "Julieta Gómez",
    telefono: "11-4567-8901",
    email: "julieta@ejemplo.com",
    rubro: "Corte",
    servicio: "Corte de cabello",
    fecha: obtenerFechaLocal(),
    hora: "10:00"
  });

  assert.deepEqual(resultado, { valido: true, errores: [] });
});

test("rechaza datos con nombre, teléfono, email o fecha anterior inválidos", async () => {
  const { validarDatosTurno } = await importarValidaciones();
  const resultado = validarDatosTurno({
    nombre: " Al ",
    telefono: "12-34 56",
    email: "correo-invalido",
    rubro: "Corte",
    servicio: "Corte de cabello",
    fecha: obtenerFechaLocal(-1),
    hora: "10:00"
  });

  assert.equal(resultado.valido, false);
  assert.equal(resultado.errores.length, 4);
  assert.match(resultado.errores[0], /nombre/i);
  assert.match(resultado.errores[1], /teléfono/i);
  assert.match(resultado.errores[2], /correo/i);
  assert.match(resultado.errores[3], /anterior a hoy/i);
});

test("rechaza una fecha inexistente", async () => {
  const { validarDatosTurno } = await importarValidaciones();
  const resultado = validarDatosTurno({
    nombre: "Julieta Gómez",
    telefono: "1145678901",
    email: "julieta@ejemplo.com",
    rubro: "Corte",
    servicio: "Corte de cabello",
    fecha: "2026-02-30",
    hora: "10:00"
  });

  assert.equal(resultado.valido, false);
  assert.match(resultado.errores[0], /fecha válida/i);
});