export const CATEGORIAS = [
  "Corte",
  "Coloración",
  "Tratamientos",
  "Peinados"
];

const serviciosPorCategoria = {
  Corte: [
    "Corte de cabello",
    "Corte y brushing",
    "Corte de flequillo"
  ],
  Coloración: [
    "Color completo",
    "Retoque de raíces",
    "Mechas"
  ],
  Tratamientos: [
    "Hidratación capilar",
    "Nutrición capilar",
    "Alisado"
  ],
  Peinados: [
    "Brushing",
    "Peinado para evento",
    "Trenzas"
  ]
};

export function obtenerServiciosPorCategoria(categoria) {
  return serviciosPorCategoria[categoria]?.slice() ?? [];
}