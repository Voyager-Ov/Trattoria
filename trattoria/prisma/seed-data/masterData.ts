type SeedUnit = "UNIDAD" | "KILOGRAMO" | "GRAMO" | "LITRO" | "MILILITRO" | "PORCION";

type RecipeSeed = {
  supplyName: string;
  qtyPerUnit: number;
  unidad: SeedUnit;
};

type ProductSeed = {
  nombre: string;
  descripcion: string;
  precio: number;
  costoUnitario: number;
  categorySlug: string;
  orden: number;
  recipe: RecipeSeed[];
};

type SupplySeed = {
  nombre: string;
  categoryName: string;
  unidad: SeedUnit;
  stockMinimo: number;
  costoUnitario: number;
};

type CategorySeed = {
  slug: string;
  nombre: string;
  descripcion: string;
  orden: number;
  esPromocion: false;
};

type SupplyCategorySeed = {
  nombre: string;
};

export const BUSINESS_DAYS = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"] as const;

export const BUSINESS_HOURS = BUSINESS_DAYS.reduce<Record<string, { start: string; end: string }[]>>((acc, day) => {
  acc[day === "Miercoles" ? "Miércoles" : day === "Sabado" ? "Sábado" : day] = [{ start: "19:00", end: "23:30" }];
  return acc;
}, {});

export const APP_CONFIGS = {
  "business.profile": { name: "La Trattoria", address: "Av. Principal 123", logo: "" },
  "business.hours": BUSINESS_HOURS,
  "business.closedDays": [],
  "payments.methods": [
    { id: "EFECTIVO", label: "Efectivo", enabled: true, sortOrder: 0 },
    { id: "TRANSFERENCIA", label: "Transferencia", enabled: true, sortOrder: 1 },
    { id: "MERCADOPAGO", label: "Mercado Pago", enabled: false, sortOrder: 2 },
  ],
  "integrations.mercadoPago": { publicKey: "", enabled: false },
  "delivery.settings": {
    enabled: true,
    deliveryFeeNear: 1500,
    deliveryFeeFar: 2500,
    estimatedTimeRange: "30-45 min",
    allowPickup: true,
    allowDelivery: true,
  },
  "whatsapp.settings": {
    phoneNumber: "5491112345678",
    templateMessage:
      "Hola {nombre}! Gracias por elegir La Trattoria.\n\nRecibimos tu pedido #{id} correctamente.\n\n- Entrega en: {direccion}\n- Total: {total}\n- Metodo de pago: {metodoPago}\n\nDetalle:\n{items}\n\nEstamos preparando tu pedido.\n\n- Tipo de entrega: {tipoEntrega}\n- Telefono: {telefono}",
    enabled: true,
  },
  "goals.monthly": { amount: 2500000, type: "revenue" },
} as const;

export const APP_SEQUENCES = [
  { tipo: "order", prefijo: "ORD-", ultimo: 0 },
  { tipo: "egreso", prefijo: "E-", ultimo: 0 },
] as const;

export const CATEGORY_SEEDS: readonly CategorySeed[] = [
  ["pizzas", "Pizzas", "Pizzas de la carta actual.", 0],
  ["pastas", "Pastas", "Pastas y salsas de la carta actual.", 1],
  ["tartas", "Tartas", "Tartas familiares e individuales.", 2],
  ["calzoni", "Calzoni", "Calzoni de la carta actual.", 3],
  ["empanadas", "Empanadas", "Empanadas por unidad, media docena y docena.", 4],
  ["milanesas", "Milanesas", "Milanesas y sandwich de mila.", 5],
  ["hamburguesas", "Hamburguesas", "Hamburguesas simples y dobles.", 6],
  ["postres", "Postres", "Postres de la carta actual.", 7],
].map(([slug, nombre, descripcion, orden]) => ({ slug, nombre, descripcion, orden, esPromocion: false })) as readonly CategorySeed[];

export const SUPPLY_CATEGORY_SEEDS: readonly SupplyCategorySeed[] = [
  "Bases y Masas",
  "Salsas y Aderezos",
  "Quesos y Lacteos",
  "Fiambres, Conservas y Embutidos",
  "Carnes y Aves",
  "Verduras, Frutas y Hierbas",
  "Condimentos y Secos",
  "Panificados y Tapas",
  "Semielaborados de Cocina",
  "Postres y Dulces",
].map((nombre) => ({ nombre })) as readonly SupplyCategorySeed[];

export const SUPPLY_SEEDS: readonly SupplySeed[] = [
  ["Disco de pizza", "Bases y Masas", "UNIDAD", 20, 650],
  ["Masa de calzoni", "Bases y Masas", "UNIDAD", 10, 700],
  ["Masa de tarta", "Bases y Masas", "UNIDAD", 18, 320],
  ["Tapa de empanada salada", "Panificados y Tapas", "UNIDAD", 120, 110],
  ["Tapa arabe", "Panificados y Tapas", "UNIDAD", 60, 140],
  ["Pan de hamburguesa", "Panificados y Tapas", "UNIDAD", 24, 350],
  ["Pan de sandwich", "Panificados y Tapas", "UNIDAD", 20, 400],
  ["Salsa de tomate", "Salsas y Aderezos", "KILOGRAMO", 10, 2200],
  ["Salsa bolognesa", "Salsas y Aderezos", "KILOGRAMO", 5, 4800],
  ["Salsa parisienne", "Salsas y Aderezos", "KILOGRAMO", 4, 6200],
  ["Salsa peceto", "Salsas y Aderezos", "KILOGRAMO", 4, 7000],
  ["Salsa golf", "Salsas y Aderezos", "MILILITRO", 1000, 4.2],
  ["Mostaza", "Salsas y Aderezos", "MILILITRO", 800, 2.8],
  ["Mozzarella", "Quesos y Lacteos", "KILOGRAMO", 10, 8800],
  ["Queso parmesano", "Quesos y Lacteos", "KILOGRAMO", 2, 18000],
  ["Queso sardo", "Quesos y Lacteos", "KILOGRAMO", 2, 14000],
  ["Queso roquefort", "Quesos y Lacteos", "KILOGRAMO", 2, 16500],
  ["Queso tybo", "Quesos y Lacteos", "KILOGRAMO", 2, 12000],
  ["Queso", "Quesos y Lacteos", "KILOGRAMO", 2, 11000],
  ["Queso crema", "Quesos y Lacteos", "KILOGRAMO", 2, 7600],
  ["Crema", "Quesos y Lacteos", "LITRO", 6, 4000],
  ["Huevo", "Quesos y Lacteos", "UNIDAD", 60, 300],
  ["Aceitunas", "Fiambres, Conservas y Embutidos", "KILOGRAMO", 3, 7600],
  ["Jamon cocido", "Fiambres, Conservas y Embutidos", "KILOGRAMO", 5, 11500],
  ["Salchicha", "Fiambres, Conservas y Embutidos", "KILOGRAMO", 2, 9000],
  ["Palmitos", "Fiambres, Conservas y Embutidos", "KILOGRAMO", 2, 7500],
  ["Salame calabresa", "Fiambres, Conservas y Embutidos", "KILOGRAMO", 3, 14500],
  ["Anchoas", "Fiambres, Conservas y Embutidos", "KILOGRAMO", 1, 25000],
  ["Jamon crudo", "Fiambres, Conservas y Embutidos", "KILOGRAMO", 2, 26000],
  ["Carne vacuna", "Carnes y Aves", "KILOGRAMO", 5, 12500],
  ["Pollo", "Carnes y Aves", "KILOGRAMO", 5, 7800],
  ["Peceto", "Carnes y Aves", "KILOGRAMO", 3, 16000],
  ["Cebolla", "Verduras, Frutas y Hierbas", "KILOGRAMO", 8, 1400],
  ["Cebolla de verdeo", "Verduras, Frutas y Hierbas", "KILOGRAMO", 3, 3400],
  ["Ajo", "Verduras, Frutas y Hierbas", "KILOGRAMO", 2, 5000],
  ["Perejil", "Verduras, Frutas y Hierbas", "GRAMO", 250, 3],
  ["Albahaca", "Verduras, Frutas y Hierbas", "GRAMO", 200, 6],
  ["Morron", "Verduras, Frutas y Hierbas", "KILOGRAMO", 4, 3600],
  ["Tomate", "Verduras, Frutas y Hierbas", "KILOGRAMO", 8, 2000],
  ["Choclo", "Verduras, Frutas y Hierbas", "KILOGRAMO", 4, 2600],
  ["Champinones", "Verduras, Frutas y Hierbas", "KILOGRAMO", 2, 11000],
  ["Rucula", "Verduras, Frutas y Hierbas", "GRAMO", 300, 8],
  ["Pimiento picante", "Verduras, Frutas y Hierbas", "KILOGRAMO", 1, 4500],
  ["Anana", "Verduras, Frutas y Hierbas", "KILOGRAMO", 2, 3800],
  ["Acelga", "Verduras, Frutas y Hierbas", "KILOGRAMO", 3, 1800],
  ["Oregano", "Condimentos y Secos", "GRAMO", 500, 6],
  ["Hierbas secas", "Condimentos y Secos", "GRAMO", 500, 5.5],
  ["Azucar morena", "Condimentos y Secos", "GRAMO", 1000, 2.3],
  ["Cafe", "Condimentos y Secos", "GRAMO", 500, 18],
  ["Cacao", "Condimentos y Secos", "GRAMO", 500, 14],
  ["Papa prefrita", "Condimentos y Secos", "KILOGRAMO", 8, 3000],
  ["Relleno de pollo", "Semielaborados de Cocina", "PORCION", 24, 340],
  ["Relleno de jamon y queso", "Semielaborados de Cocina", "PORCION", 24, 380],
  ["Relleno de choclo", "Semielaborados de Cocina", "PORCION", 24, 320],
  ["Relleno de acelga", "Semielaborados de Cocina", "PORCION", 24, 300],
  ["Relleno de cebolla y queso", "Semielaborados de Cocina", "PORCION", 18, 330],
  ["Relleno arabe", "Semielaborados de Cocina", "PORCION", 18, 360],
  ["Relleno salado", "Semielaborados de Cocina", "PORCION", 24, 340],
  ["Relleno dulce", "Semielaborados de Cocina", "PORCION", 18, 260],
  ["Porcion de noquis", "Semielaborados de Cocina", "PORCION", 10, 950],
  ["Porcion de ravioles", "Semielaborados de Cocina", "PORCION", 10, 1100],
  ["Porcion de canelones", "Semielaborados de Cocina", "PORCION", 10, 1500],
  ["Porcion de tallarines", "Semielaborados de Cocina", "PORCION", 10, 900],
  ["Porcion de lasagna", "Semielaborados de Cocina", "PORCION", 8, 2200],
  ["Milanesa rebozada", "Semielaborados de Cocina", "UNIDAD", 20, 1900],
  ["Medallon de hamburguesa", "Semielaborados de Cocina", "UNIDAD", 24, 1300],
  ["Dulce de leche", "Postres y Dulces", "KILOGRAMO", 4, 5200],
  ["Oreo", "Postres y Dulces", "PORCION", 12, 900],
  ["Chocolinas", "Postres y Dulces", "PORCION", 12, 700],
].map(([nombre, categoryName, unidad, stockMinimo, costoUnitario]) => ({ nombre, categoryName, unidad, stockMinimo, costoUnitario })) as readonly SupplySeed[];

const ingredient = (supplyName: string, qtyPerUnit: number, unidad: SeedUnit): RecipeSeed => ({ supplyName, qtyPerUnit, unidad });
const roundQty = (value: number) => Number(value.toFixed(3));
const roundMoney = (value: number) => Number(value.toFixed(2));
const scaleRecipe = (recipe: readonly RecipeSeed[], factor: number): RecipeSeed[] =>
  recipe.map((item) => ({ ...item, qtyPerUnit: roundQty(item.qtyPerUnit * factor) }));
const SUPPLY_COST_BY_NAME = Object.fromEntries(SUPPLY_SEEDS.map((supply) => [supply.nombre, Number(supply.costoUnitario)])) as Record<string, number>;
const calculateRecipeCost = (recipe: readonly RecipeSeed[]): number =>
  roundMoney(recipe.reduce((total, item) => total + (SUPPLY_COST_BY_NAME[item.supplyName] ?? 0) * item.qtyPerUnit, 0));
const makeProduct = (data: Omit<ProductSeed, "costoUnitario">): ProductSeed => ({ ...data, costoUnitario: calculateRecipeCost(data.recipe) });

const buildPizzaRecipe = (toppings: RecipeSeed[], options?: { withSauce?: boolean; mozzarellaQty?: number }): RecipeSeed[] => {
  const recipe: RecipeSeed[] = [ingredient("Disco de pizza", 1, "UNIDAD")];
  if (options?.withSauce !== false) recipe.push(ingredient("Salsa de tomate", 0.18, "KILOGRAMO"));
  recipe.push(ingredient("Mozzarella", options?.mozzarellaQty ?? 0.24, "KILOGRAMO"));
  return [...recipe, ...toppings];
};

const pizzaDefinitions = [
  ["Muzzarella", 7000, 4000, "Salsa de tomate, mozzarella, aceitunas y oregano.", buildPizzaRecipe([ingredient("Aceitunas", 0.03, "KILOGRAMO"), ingredient("Oregano", 4, "GRAMO")])],
  ["Fugazzeta", 7000, 4000, "Cebolla salteada, mozzarella, aceitunas y oregano.", buildPizzaRecipe([ingredient("Cebolla", 0.14, "KILOGRAMO"), ingredient("Aceitunas", 0.02, "KILOGRAMO"), ingredient("Oregano", 4, "GRAMO")], { withSauce: false })],
  ["Fuga al Verdeo", 7000, 4000, "Cebolla salteada, mozzarella, verdeo y parmesano.", buildPizzaRecipe([ingredient("Cebolla", 0.12, "KILOGRAMO"), ingredient("Cebolla de verdeo", 0.05, "KILOGRAMO"), ingredient("Queso parmesano", 0.025, "KILOGRAMO")], { withSauce: false })],
  ["Mozza con Huevo", 7000, 4000, "Salsa, mozzarella, huevo, aceitunas y oregano.", buildPizzaRecipe([ingredient("Huevo", 1, "UNIDAD"), ingredient("Aceitunas", 0.02, "KILOGRAMO"), ingredient("Oregano", 4, "GRAMO")])],
  ["Provenzal", 7000, 4000, "Salsa, mozzarella, ajo, perejil y aceitunas.", buildPizzaRecipe([ingredient("Ajo", 0.012, "KILOGRAMO"), ingredient("Perejil", 12, "GRAMO"), ingredient("Aceitunas", 0.02, "KILOGRAMO")])],
  ["Margarita", 7000, 4000, "Salsa, mozzarella, sardo, aceitunas, albahaca y oregano.", buildPizzaRecipe([ingredient("Queso sardo", 0.03, "KILOGRAMO"), ingredient("Aceitunas", 0.02, "KILOGRAMO"), ingredient("Albahaca", 10, "GRAMO"), ingredient("Oregano", 4, "GRAMO")])],
  ["Especial", 8000, 4500, "Salsa, jamon, mozzarella, aceitunas, morrones y oregano.", buildPizzaRecipe([ingredient("Jamon cocido", 0.08, "KILOGRAMO"), ingredient("Aceitunas", 0.02, "KILOGRAMO"), ingredient("Morron", 0.05, "KILOGRAMO"), ingredient("Oregano", 4, "GRAMO")])],
  ["Napolitana", 8000, 4500, "Salsa, mozzarella, tomate, ajo y oregano.", buildPizzaRecipe([ingredient("Tomate", 0.12, "KILOGRAMO"), ingredient("Ajo", 0.01, "KILOGRAMO"), ingredient("Oregano", 4, "GRAMO")])],
  ["Fuga con Jamon", 8000, 4500, "Cebolla salteada, mozzarella, jamon y morron.", buildPizzaRecipe([ingredient("Cebolla", 0.12, "KILOGRAMO"), ingredient("Jamon cocido", 0.08, "KILOGRAMO"), ingredient("Morron", 0.04, "KILOGRAMO")], { withSauce: false })],
  ["Choclo", 8000, 4500, "Salsa, mozzarella, choclo, aceitunas y morrones.", buildPizzaRecipe([ingredient("Choclo", 0.11, "KILOGRAMO"), ingredient("Aceitunas", 0.02, "KILOGRAMO"), ingredient("Morron", 0.03, "KILOGRAMO")])],
  ["Vienesa", 8000, 4500, "Salsa, mozzarella, salchicha, mostaza, aceitunas y oregano.", buildPizzaRecipe([ingredient("Salchicha", 0.12, "KILOGRAMO"), ingredient("Mostaza", 15, "MILILITRO"), ingredient("Aceitunas", 0.02, "KILOGRAMO"), ingredient("Oregano", 4, "GRAMO")])],
  ["Del Campo", 8000, 4500, "Salsa, hierbas, mozzarella, champinones y aceitunas.", buildPizzaRecipe([ingredient("Hierbas secas", 8, "GRAMO"), ingredient("Champinones", 0.09, "KILOGRAMO"), ingredient("Aceitunas", 0.02, "KILOGRAMO")])],
  ["Auvernia", 9000, 5000, "Cebolla, mozzarella, roquefort y aceitunas.", buildPizzaRecipe([ingredient("Cebolla", 0.12, "KILOGRAMO"), ingredient("Queso roquefort", 0.07, "KILOGRAMO"), ingredient("Aceitunas", 0.02, "KILOGRAMO")], { withSauce: false })],
  ["Palmito", 9000, 5000, "Salsa, mozzarella, palmito, salsa golf y aceitunas.", buildPizzaRecipe([ingredient("Palmitos", 0.12, "KILOGRAMO"), ingredient("Salsa golf", 30, "MILILITRO"), ingredient("Aceitunas", 0.02, "KILOGRAMO")])],
  ["4 Quesos", 9000, 5000, "Salsa, mozzarella, sardo, roquefort, tybo y aceitunas.", buildPizzaRecipe([ingredient("Queso sardo", 0.05, "KILOGRAMO"), ingredient("Queso roquefort", 0.04, "KILOGRAMO"), ingredient("Queso tybo", 0.05, "KILOGRAMO"), ingredient("Aceitunas", 0.02, "KILOGRAMO")], { mozzarellaQty: 0.18 })],
  ["Capresse", 9000, 5000, "Salsa, mozzarella, tomate, albahaca y aceitunas.", buildPizzaRecipe([ingredient("Tomate", 0.11, "KILOGRAMO"), ingredient("Albahaca", 12, "GRAMO"), ingredient("Aceitunas", 0.02, "KILOGRAMO")])],
  ["Calabresa", 9000, 5000, "Salsa, mozzarella, salame calabresa, aceitunas y oregano.", buildPizzaRecipe([ingredient("Salame calabresa", 0.11, "KILOGRAMO"), ingredient("Aceitunas", 0.02, "KILOGRAMO"), ingredient("Oregano", 4, "GRAMO")])],
  ["Anchoa", 9000, 5000, "Salsa, mozzarella, jamon, anchoa, aceitunas, morron y oregano.", buildPizzaRecipe([ingredient("Jamon cocido", 0.06, "KILOGRAMO"), ingredient("Anchoas", 0.035, "KILOGRAMO"), ingredient("Aceitunas", 0.02, "KILOGRAMO"), ingredient("Morron", 0.04, "KILOGRAMO"), ingredient("Oregano", 4, "GRAMO")])],
  ["Rucula", 9000, 5000, "Salsa, mozzarella, rucula, jamon crudo y aceitunas.", buildPizzaRecipe([ingredient("Rucula", 35, "GRAMO"), ingredient("Jamon crudo", 0.05, "KILOGRAMO"), ingredient("Aceitunas", 0.02, "KILOGRAMO")])],
  ["Trattoria", 9000, 5000, "Salsa, mozzarella, cebolla y pimiento salteado picante.", buildPizzaRecipe([ingredient("Cebolla", 0.1, "KILOGRAMO"), ingredient("Morron", 0.06, "KILOGRAMO"), ingredient("Pimiento picante", 0.015, "KILOGRAMO")])],
  ["Tropical", 9000, 5000, "Salsa, mozzarella, jamon, anana, azucar morena y aceitunas.", buildPizzaRecipe([ingredient("Jamon cocido", 0.07, "KILOGRAMO"), ingredient("Anana", 0.11, "KILOGRAMO"), ingredient("Azucar morena", 10, "GRAMO"), ingredient("Aceitunas", 0.02, "KILOGRAMO")])],
  ["Atomica", 12000, 7000, "Salsa, mozzarella, papas fritas, salsa golf y huevo.", buildPizzaRecipe([ingredient("Papa prefrita", 0.18, "KILOGRAMO"), ingredient("Salsa golf", 35, "MILILITRO"), ingredient("Huevo", 1, "UNIDAD")])],
] as const;

const buildPizzaProducts = (): ProductSeed[] =>
  pizzaDefinitions.flatMap(([nombre, wholePrice, halfPrice, descripcion, recipe], index) => [
    makeProduct({ nombre: `Pizza ${nombre} - Entera`, descripcion, precio: wholePrice, categorySlug: "pizzas", orden: index * 2, recipe: [...recipe] }),
    makeProduct({ nombre: `Pizza ${nombre} - Media`, descripcion: `${descripcion} Version media.`, precio: halfPrice, categorySlug: "pizzas", orden: index * 2 + 1, recipe: scaleRecipe(recipe, 0.5) }),
  ]);

const pastaProducts: ProductSeed[] = [
  makeProduct({ nombre: "\u00d1oquis Bolognesa", descripcion: "Porcion de noquis con salsa bolognesa y parmesano.", precio: 7500, categorySlug: "pastas", orden: 0, recipe: [ingredient("Porcion de noquis", 1, "PORCION"), ingredient("Salsa bolognesa", 0.22, "KILOGRAMO"), ingredient("Queso parmesano", 0.015, "KILOGRAMO")] }),
  makeProduct({ nombre: "Ravioles Fileto", descripcion: "Porcion de ravioles con fileto y parmesano.", precio: 7500, categorySlug: "pastas", orden: 1, recipe: [ingredient("Porcion de ravioles", 1, "PORCION"), ingredient("Salsa de tomate", 0.2, "KILOGRAMO"), ingredient("Queso parmesano", 0.015, "KILOGRAMO")] }),
  makeProduct({ nombre: "Canelones Parisienne", descripcion: "Porcion de canelones con salsa parisienne.", precio: 8500, categorySlug: "pastas", orden: 2, recipe: [ingredient("Porcion de canelones", 1, "PORCION"), ingredient("Salsa parisienne", 0.22, "KILOGRAMO"), ingredient("Queso parmesano", 0.015, "KILOGRAMO")] }),
  makeProduct({ nombre: "Tallarines Peceto", descripcion: "Porcion de tallarines con salsa peceto.", precio: 8500, categorySlug: "pastas", orden: 3, recipe: [ingredient("Porcion de tallarines", 1, "PORCION"), ingredient("Salsa peceto", 0.22, "KILOGRAMO"), ingredient("Queso parmesano", 0.015, "KILOGRAMO")] }),
  makeProduct({ nombre: "Lasagna", descripcion: "Porcion de lasagna de la casa. Precio estimado de forma conservadora por no verse en la carta.", precio: 9000, categorySlug: "pastas", orden: 4, recipe: [ingredient("Porcion de lasagna", 1, "PORCION"), ingredient("Salsa de tomate", 0.12, "KILOGRAMO"), ingredient("Mozzarella", 0.04, "KILOGRAMO")] }),
];

const tartaDefinitions = [
  ["Pollo", "Relleno de pollo", true],
  ["Jamon y Queso", "Relleno de jamon y queso", true],
  ["Choclo", "Relleno de choclo", true],
  ["Acelga", "Relleno de acelga", true],
  ["Cebolla y Queso", "Relleno de cebolla y queso", false],
] as const;

const buildTartaProducts = (): ProductSeed[] => {
  const products: ProductSeed[] = [];
  let order = 0;
  for (const [nombre, filling, hasFamily] of tartaDefinitions) {
    if (hasFamily) {
      products.push(makeProduct({ nombre: `Tarta de ${nombre} - Familiar`, descripcion: `Tarta familiar de ${nombre.toLowerCase()}.`, precio: 6000, categorySlug: "tartas", orden: order++, recipe: scaleRecipe([ingredient("Masa de tarta", 1, "UNIDAD"), ingredient(filling, 1, "PORCION")], 3) }));
    }
    products.push(makeProduct({ nombre: `Tarta de ${nombre} - Individual`, descripcion: `Tarta individual de ${nombre.toLowerCase()}.`, precio: 2000, categorySlug: "tartas", orden: order++, recipe: [ingredient("Masa de tarta", 1, "UNIDAD"), ingredient(filling, 1, "PORCION")] }));
  }
  return products;
};

const calzoniProducts: ProductSeed[] = [
  makeProduct({ nombre: "Calzoni Sanvito", descripcion: "Bolognesa, mozzarella y aceitunas.", precio: 8500, categorySlug: "calzoni", orden: 0, recipe: [ingredient("Masa de calzoni", 1, "UNIDAD"), ingredient("Salsa bolognesa", 0.18, "KILOGRAMO"), ingredient("Mozzarella", 0.2, "KILOGRAMO"), ingredient("Aceitunas", 0.02, "KILOGRAMO")] }),
  makeProduct({ nombre: "Calzoni Ghiottone", descripcion: "Tomate, jamon, aceituna, mozzarella y morron.", precio: 8500, categorySlug: "calzoni", orden: 1, recipe: [ingredient("Masa de calzoni", 1, "UNIDAD"), ingredient("Tomate", 0.09, "KILOGRAMO"), ingredient("Jamon cocido", 0.07, "KILOGRAMO"), ingredient("Aceitunas", 0.02, "KILOGRAMO"), ingredient("Mozzarella", 0.19, "KILOGRAMO"), ingredient("Morron", 0.04, "KILOGRAMO")] }),
  makeProduct({ nombre: "Calzoni Capresse", descripcion: "Tomate, mozzarella, albahaca, morron y aceituna.", precio: 8500, categorySlug: "calzoni", orden: 2, recipe: [ingredient("Masa de calzoni", 1, "UNIDAD"), ingredient("Tomate", 0.1, "KILOGRAMO"), ingredient("Mozzarella", 0.2, "KILOGRAMO"), ingredient("Albahaca", 10, "GRAMO"), ingredient("Morron", 0.04, "KILOGRAMO"), ingredient("Aceitunas", 0.02, "KILOGRAMO")] }),
  makeProduct({ nombre: "Calzoni 4 Quesos", descripcion: "Mozzarella, tybo, sardo y roquefort.", precio: 8500, categorySlug: "calzoni", orden: 3, recipe: [ingredient("Masa de calzoni", 1, "UNIDAD"), ingredient("Mozzarella", 0.16, "KILOGRAMO"), ingredient("Queso tybo", 0.05, "KILOGRAMO"), ingredient("Queso sardo", 0.05, "KILOGRAMO"), ingredient("Queso roquefort", 0.04, "KILOGRAMO")] }),
  makeProduct({ nombre: "Calzoni Calabresa", descripcion: "Tomate, mozzarella, calabresa y aceituna.", precio: 8500, categorySlug: "calzoni", orden: 4, recipe: [ingredient("Masa de calzoni", 1, "UNIDAD"), ingredient("Tomate", 0.09, "KILOGRAMO"), ingredient("Mozzarella", 0.19, "KILOGRAMO"), ingredient("Salame calabresa", 0.1, "KILOGRAMO"), ingredient("Aceitunas", 0.02, "KILOGRAMO")] }),
];

const empanadaDefinitions = [
  ["Empanada \u00c1rabe", [ingredient("Tapa arabe", 1, "UNIDAD"), ingredient("Relleno arabe", 1, "PORCION")]],
  ["Empanada Salada", [ingredient("Tapa de empanada salada", 1, "UNIDAD"), ingredient("Relleno salado", 1, "PORCION")]],
  ["Empanada de Jamon y Queso", [ingredient("Tapa de empanada salada", 1, "UNIDAD"), ingredient("Relleno de jamon y queso", 1, "PORCION")]],
  ["Empanada de Cebolla y Queso", [ingredient("Tapa de empanada salada", 1, "UNIDAD"), ingredient("Relleno de cebolla y queso", 1, "PORCION")]],
  ["Empanada Dulce", [ingredient("Tapa de empanada salada", 1, "UNIDAD"), ingredient("Relleno dulce", 1, "PORCION")]],
] as const;

const empanadaVariants = [
  ["x1", 1200, 1],
  ["x6", 7000, 6],
  ["x12", 14000, 12],
] as const;

const buildEmpanadaProducts = (): ProductSeed[] => {
  const products: ProductSeed[] = [];
  let order = 0;
  for (const [nombreBase, singleRecipe] of empanadaDefinitions) {
    for (const [suffix, price, factor] of empanadaVariants) {
      products.push(makeProduct({ nombre: `${nombreBase} ${suffix}`, descripcion: `${nombreBase} en presentacion ${suffix}.`, precio: price, categorySlug: "empanadas", orden: order++, recipe: scaleRecipe(singleRecipe, factor) }));
    }
  }
  return products;
};

const milanesaProducts: ProductSeed[] = [
  makeProduct({ nombre: "Mila con Frita", descripcion: "Milanesa con papa prefrita.", precio: 7000, categorySlug: "milanesas", orden: 0, recipe: [ingredient("Milanesa rebozada", 1, "UNIDAD"), ingredient("Papa prefrita", 0.25, "KILOGRAMO")] }),
  makeProduct({ nombre: "Mila Completa", descripcion: "Milanesa, jamon, queso y huevo frito.", precio: 9000, categorySlug: "milanesas", orden: 1, recipe: [ingredient("Milanesa rebozada", 1, "UNIDAD"), ingredient("Jamon cocido", 0.07, "KILOGRAMO"), ingredient("Queso", 0.08, "KILOGRAMO"), ingredient("Huevo", 1, "UNIDAD")] }),
  makeProduct({ nombre: "Mila Napo", descripcion: "Milanesa, salsa, jamon y mozzarella.", precio: 9000, categorySlug: "milanesas", orden: 2, recipe: [ingredient("Milanesa rebozada", 1, "UNIDAD"), ingredient("Salsa de tomate", 0.09, "KILOGRAMO"), ingredient("Jamon cocido", 0.06, "KILOGRAMO"), ingredient("Mozzarella", 0.09, "KILOGRAMO")] }),
  makeProduct({ nombre: "Mila a Caballo", descripcion: "Milanesa con dos huevos fritos.", precio: 9000, categorySlug: "milanesas", orden: 3, recipe: [ingredient("Milanesa rebozada", 1, "UNIDAD"), ingredient("Huevo", 2, "UNIDAD")] }),
  makeProduct({ nombre: "Sandwich de Mila", descripcion: "Pan de sandwich con milanesa y vegetales base.", precio: 7000, categorySlug: "milanesas", orden: 4, recipe: [ingredient("Pan de sandwich", 1, "UNIDAD"), ingredient("Milanesa rebozada", 1, "UNIDAD"), ingredient("Tomate", 0.05, "KILOGRAMO"), ingredient("Cebolla", 0.03, "KILOGRAMO")] }),
];

const hamburguesaProducts: ProductSeed[] = [
  makeProduct({ nombre: "Hamburguesa Simple", descripcion: "Hamburguesa simple con vegetales base y aderezo.", precio: 6500, categorySlug: "hamburguesas", orden: 0, recipe: [ingredient("Medallon de hamburguesa", 1, "UNIDAD"), ingredient("Pan de hamburguesa", 1, "UNIDAD"), ingredient("Tomate", 0.04, "KILOGRAMO"), ingredient("Cebolla", 0.02, "KILOGRAMO"), ingredient("Salsa golf", 15, "MILILITRO")] }),
  makeProduct({ nombre: "Hamburguesa Doble", descripcion: "Hamburguesa doble con queso, vegetales base y aderezo.", precio: 10000, categorySlug: "hamburguesas", orden: 1, recipe: [ingredient("Medallon de hamburguesa", 2, "UNIDAD"), ingredient("Pan de hamburguesa", 1, "UNIDAD"), ingredient("Queso", 0.07, "KILOGRAMO"), ingredient("Tomate", 0.04, "KILOGRAMO"), ingredient("Cebolla", 0.02, "KILOGRAMO"), ingredient("Salsa golf", 15, "MILILITRO")] }),
];

const postreProducts: ProductSeed[] = [
  makeProduct({ nombre: "Postre Oreo", descripcion: "Postre de oreo de receta corta inferida.", precio: 5500, categorySlug: "postres", orden: 0, recipe: [ingredient("Oreo", 1, "PORCION"), ingredient("Crema", 0.06, "LITRO"), ingredient("Queso crema", 0.04, "KILOGRAMO"), ingredient("Dulce de leche", 0.04, "KILOGRAMO")] }),
  makeProduct({ nombre: "Tiramisu", descripcion: "Tiramisu con receta corta inferida de forma conservadora.", precio: 5500, categorySlug: "postres", orden: 1, recipe: [ingredient("Queso crema", 0.06, "KILOGRAMO"), ingredient("Crema", 0.05, "LITRO"), ingredient("Cafe", 8, "GRAMO"), ingredient("Cacao", 6, "GRAMO")] }),
  makeProduct({ nombre: "Chocolina", descripcion: "Chocolina con receta corta inferida.", precio: 5500, categorySlug: "postres", orden: 2, recipe: [ingredient("Chocolinas", 1, "PORCION"), ingredient("Dulce de leche", 0.08, "KILOGRAMO"), ingredient("Crema", 0.05, "LITRO"), ingredient("Queso crema", 0.04, "KILOGRAMO")] }),
];

export const PRODUCT_SEEDS: readonly ProductSeed[] = [
  ...buildPizzaProducts(),
  ...pastaProducts,
  ...buildTartaProducts(),
  ...calzoniProducts,
  ...buildEmpanadaProducts(),
  ...milanesaProducts,
  ...hamburguesaProducts,
  ...postreProducts,
] as const;

if (CATEGORY_SEEDS.length !== 8) throw new Error(`Expected 8 product categories, received ${CATEGORY_SEEDS.length}.`);
if (PRODUCT_SEEDS.length !== 88) throw new Error(`Expected 88 products, received ${PRODUCT_SEEDS.length}.`);
