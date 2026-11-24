const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");
const { pathToFileURL } = require("node:url");

const archivoDashboard = path.join(__dirname, "..", "js", "dashboard.mjs");
const importarDashboard = () => import(pathToFileURL(archivoDashboard).href);

test("calcula total, turnos del día, estados, porcentajes y distribución por categoría", async () => {
  const { calcularMetricas } = await importarDashboard();
  const turnos = [
    { fecha: "2026-11-20", estado: "confirmado", rubro: "Corte" },
    { fecha: "2026-11-20", estado: "atendido", rubro: "Corte" },
    { fecha: "2026-11-21", estado: "cancelado", rubro: "Coloración" },
    { fecha: "2026-11-20", estado: "confirmado", rubro: "Peinados" }
  ];

  assert.deepEqual(calcularMetricas(turnos, "2026-11-20"), {
    totalTurnos: 4,
    turnosHoy: 3,
    atendidos: 1,
    porcentajeAtendidos: 25,
    cancelados: 1,
    porcentajeCancelados: 25,
    distribucionRubros: [
      { rubro: "Corte", cantidad: 2, porcentaje: 50 },
      { rubro: "Coloración", cantidad: 1, porcentaje: 25 },
      { rubro: "Tratamientos", cantidad: 0, porcentaje: 0 },
      { rubro: "Peinados", cantidad: 1, porcentaje: 25 }
    ]
  });
});

test("devuelve ceros para una agenda vacía", async () => {
  const { calcularMetricas } = await importarDashboard();

  assert.deepEqual(calcularMetricas([], "2026-11-20"), {
    totalTurnos: 0,
    turnosHoy: 0,
    atendidos: 0,
    porcentajeAtendidos: 0,
    cancelados: 0,
    porcentajeCancelados: 0,
    distribucionRubros: [
      { rubro: "Corte", cantidad: 0, porcentaje: 0 },
      { rubro: "Coloración", cantidad: 0, porcentaje: 0 },
      { rubro: "Tratamientos", cantidad: 0, porcentaje: 0 },
      { rubro: "Peinados", cantidad: 0, porcentaje: 0 }
    ]
  });
});