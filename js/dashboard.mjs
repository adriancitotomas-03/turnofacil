import { CATEGORIAS } from "./servicios.mjs";

export function calcularMetricas(turnos, fechaHoy) {
  const totalTurnos = turnos.length;
  const turnosHoy = turnos.filter((turno) => turno.fecha === fechaHoy).length;
  const atendidos = turnos.filter((turno) => turno.estado === "atendido").length;
  const cancelados = turnos.filter((turno) => turno.estado === "cancelado").length;
  const porcentaje = (cantidad) => (
    totalTurnos ? Math.round((cantidad / totalTurnos) * 100) : 0
  );
  const distribucionRubros = CATEGORIAS.map((rubro) => {
    const cantidad = turnos.filter((turno) => turno.rubro === rubro).length;
    return {
      rubro,
      cantidad,
      porcentaje: porcentaje(cantidad)
    };
  });

  return {
    totalTurnos,
    turnosHoy,
    atendidos,
    porcentajeAtendidos: porcentaje(atendidos),
    cancelados,
    porcentajeCancelados: porcentaje(cancelados),
    distribucionRubros
  };
}