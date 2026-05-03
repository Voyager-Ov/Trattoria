import { Prisma, ProductCatalogRole, ProductOptionPriceMode } from "@prisma/client";

export const publicCatalogProductInclude = {
  optionGroupAssignments: {
    orderBy: { orden: "asc" },
    include: {
      group: true,
    },
  },
  optionLinksAsBase: {
    where: {
      activo: true,
      option: {
        activo: true,
        deletedAt: null,
        OR: [
          { optionProductId: null },
          {
            optionProduct: {
              activo: true,
              disponible: true,
              deletedAt: null,
            },
          },
        ],
      },
    },
    orderBy: [{ orden: "asc" }, { option: { orden: "asc" } }],
    include: {
      option: {
        include: {
          group: true,
          optionProduct: true,
        },
      },
    },
  },
} satisfies Prisma.ProductInclude;

export type PublicCatalogProductRecord = Prisma.ProductGetPayload<{
  include: typeof publicCatalogProductInclude;
}>;

export type PublicCatalogOption = {
  id: string;
  slug: string;
  label: string;
  price: number;
  priceMode: ProductOptionPriceMode;
  optionProductId: string | null;
  optionProductName: string | null;
  recipeMultiplier: number | null;
};

export type PublicCatalogOptionGroup = {
  id: string;
  key: string;
  nombre: string;
  priceMode: ProductOptionPriceMode;
  required: boolean;
  orden: number;
  options: PublicCatalogOption[];
};

export type PublicCatalogProduct = {
  id: string;
  nombre: string;
  descripcion: string | null;
  imagen: string | null;
  orden?: number;
  precio: number;
  stockActual: number;
  catalogRole: ProductCatalogRole;
  optionGroups: PublicCatalogOptionGroup[];
  minSelectablePrice: number;
  maxSelectablePrice: number;
};

export type ConfiguredOptionSelection = {
  groupId: string;
  groupKey: string;
  groupName: string;
  optionId: string;
  optionSlug: string;
  optionLabel: string;
  price: number;
  priceMode: ProductOptionPriceMode;
  optionProductId: string | null;
  optionProductName: string | null;
  recipeMultiplier: number | null;
};

export function calculateConfiguredUnitPrice(basePrice: number, selections: ConfiguredOptionSelection[]) {
  return selections.reduce((total, selection) => {
    if (selection.priceMode === "OVERRIDE") {
      return selection.price;
    }

    return total + selection.price;
  }, basePrice);
}

export function buildConfiguredDisplayName(baseName: string, selections: ConfiguredOptionSelection[]) {
  if (!selections.length) {
    return baseName;
  }

  return `${baseName} + ${selections.map((selection) => selection.optionLabel).join(" + ")}`;
}

export function getCatalogDisplayPrice(product: Pick<PublicCatalogProduct, "catalogRole" | "precio" | "optionGroups" | "minSelectablePrice">) {
  if (product.catalogRole === "CONFIGURABLE_BASE") {
    return product.minSelectablePrice;
  }

  return product.precio;
}

export function mapPublicCatalogProduct(product: PublicCatalogProductRecord): PublicCatalogProduct {
  const linksByGroupId = new Map<string, PublicCatalogProductRecord["optionLinksAsBase"]>();

  for (const link of product.optionLinksAsBase) {
    const groupId = link.option.group.id;
    const existing = linksByGroupId.get(groupId);
    if (existing) {
      existing.push(link);
    } else {
      linksByGroupId.set(groupId, [link]);
    }
  }

  const optionGroups = product.optionGroupAssignments
    .map((assignment) => {
      const links = linksByGroupId.get(assignment.group.id) ?? [];
      const options = links.map((link) => ({
        id: link.option.id,
        slug: link.option.slug,
        label: link.option.label,
        price: Number(link.price),
        priceMode: link.option.group.priceMode,
        optionProductId: link.option.optionProductId,
        optionProductName: link.option.optionProduct?.nombre ?? null,
        recipeMultiplier: link.option.recipeMultiplier === null ? null : Number(link.option.recipeMultiplier),
      }));

      return {
        id: assignment.group.id,
        key: assignment.group.key,
        nombre: assignment.group.nombre,
        priceMode: assignment.group.priceMode,
        required: assignment.group.required,
        orden: assignment.orden,
        options,
      };
    })
    .filter((group) => group.options.length > 0);

  const selectablePrices =
    product.catalogRole === "CONFIGURABLE_BASE"
      ? optionGroups
          .flatMap((group) =>
            group.options.map((option) =>
              group.priceMode === "ADD" ? Number(product.precio) + option.price : option.price
            )
          )
          .filter((price) => Number.isFinite(price))
      : [Number(product.precio)];

  const minSelectablePrice = selectablePrices.length ? Math.min(...selectablePrices) : Number(product.precio);
  const maxSelectablePrice = selectablePrices.length ? Math.max(...selectablePrices) : Number(product.precio);

  return {
    id: product.id,
    nombre: product.nombre,
    descripcion: product.descripcion,
    imagen: product.imagen,
    orden: product.orden,
    precio: Number(product.precio),
    stockActual: product.stockActual,
    catalogRole: product.catalogRole,
    optionGroups,
    minSelectablePrice,
    maxSelectablePrice,
  };
}
