export const searchPropertiesFunction = {
  name: "search_properties",
  description: "Busca propiedades en la base de datos",
  parameters: {
    type: "object",
    properties: {
      recamaras: { type: "integer", description: "Número de recámaras" },
      jardin: { type: "boolean", description: "¿Tiene jardín?" },
      colonia: { type: "string", description: "Nombre de la colonia o zona" },
      precio_max: { type: "number", description: "Precio máximo en pesos mexicanos" }
    },
    required: ["recamaras", "colonia", "precio_max"]
  }
};