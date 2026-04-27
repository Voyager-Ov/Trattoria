"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import {
  buildConfiguredDisplayName,
  calculateConfiguredUnitPrice,
  type ConfiguredOptionSelection,
  type PublicCatalogProduct,
} from "@/lib/catalog-config";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useCart } from "@/providers/CartProvider";
import { toast } from "sonner";

interface ProductConfiguratorDialogProps {
  product: PublicCatalogProduct;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatOptionPrice(selection: { price: number; priceMode: "ADD" | "OVERRIDE" }) {
  if (selection.priceMode === "OVERRIDE") {
    return `$${selection.price.toLocaleString("es-CL")}`;
  }

  return `+$${selection.price.toLocaleString("es-CL")}`;
}

export function ProductConfiguratorDialog({ product, open, onOpenChange }: ProductConfiguratorDialogProps) {
  const { addItem } = useCart();
  const [selectedOptionIds, setSelectedOptionIds] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) {
      setSelectedOptionIds({});
    }
  }, [open]);

  const selectedOptions: ConfiguredOptionSelection[] = product.optionGroups
    .map((group) => {
      const selectedOptionId = selectedOptionIds[group.id];
      if (!selectedOptionId) return null;

      const option = group.options.find((entry) => entry.id === selectedOptionId);
      if (!option) return null;

      return {
        groupId: group.id,
        groupKey: group.key,
        groupName: group.nombre,
        optionId: option.id,
        optionSlug: option.slug,
        optionLabel: option.label,
        price: option.price,
        priceMode: option.priceMode,
        optionProductId: option.optionProductId,
        optionProductName: option.optionProductName,
        recipeMultiplier: option.recipeMultiplier,
      };
    })
    .filter((option): option is ConfiguredOptionSelection => option !== null);

  const missingRequiredGroup = product.optionGroups.find(
    (group) => group.required && !selectedOptionIds[group.id]
  );
  const isComplete = !missingRequiredGroup;
  const unitPrice = calculateConfiguredUnitPrice(product.precio, selectedOptions);
  const displayName = buildConfiguredDisplayName(product.nombre, selectedOptions);

  const handleConfirm = () => {
    if (!isComplete) {
      toast.error(`Selecciona una opción para ${missingRequiredGroup?.nombre?.toLowerCase() ?? "continuar"}.`);
      return;
    }

    const cartKey = [product.id, ...selectedOptions.map((option) => option.optionId)].join(":");

    addItem({
      cartKey,
      baseProductId: product.id,
      baseProductName: product.nombre,
      displayName,
      description: product.descripcion,
      image: product.imagen,
      unitPrice,
      selectedOptions,
    });

    window.dispatchEvent(new Event("cartChanged"));
    toast.success(`${displayName} agregado al carrito`, {
      duration: 2000,
      position: "top-center",
    });
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col rounded-l-[2rem] border-none bg-background p-0 sm:max-w-md">
        <SheetHeader className="p-5 pb-1">
          <div className="mb-1.5 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <Plus className="h-4.5 w-4.5 text-primary" />
            </div>
            <SheetTitle className="font-outfit text-[1.9rem] font-bold leading-none">
              {product.nombre}
            </SheetTitle>
          </div>
          <SheetDescription className="text-sm text-muted-foreground">
            {product.descripcion || "Selecciona las opciones para armar tu pedido."}
          </SheetDescription>
        </SheetHeader>

        <div className="my-3 flex-1 overflow-y-auto px-5 scrollbar-hide">
          <div className="space-y-5">
            {product.optionGroups.map((group) => (
              <section key={group.id} className="rounded-3xl border border-zinc-200 bg-zinc-50/80 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-[0.12em] text-zinc-900">
                      {group.nombre}
                    </h4>
                    <p className="text-xs text-zinc-500">
                      {group.required ? "Selección obligatoria" : "Opcional"}
                    </p>
                  </div>
                  {group.priceMode === "OVERRIDE" && (
                    <span className="rounded-full bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-zinc-500">
                      Define el precio
                    </span>
                  )}
                </div>

                <RadioGroup
                  value={selectedOptionIds[group.id] || ""}
                  onValueChange={(value) =>
                    setSelectedOptionIds((prev) => ({
                      ...prev,
                      [group.id]: value,
                    }))
                  }
                  className="grid gap-2"
                >
                  {group.options.map((option) => (
                    <Label
                      key={option.id}
                      htmlFor={option.id}
                      className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3 transition-all hover:border-red-200 hover:bg-red-50/40"
                    >
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value={option.id} id={option.id} />
                        <div>
                          <p className="text-sm font-bold text-zinc-900">{option.label}</p>
                          {option.optionProductName && (
                            <p className="text-xs text-zinc-500">{option.optionProductName}</p>
                          )}
                        </div>
                      </div>
                      <span className="text-sm font-black text-[#E30909]">
                        {formatOptionPrice({
                          price: option.price,
                          priceMode: option.priceMode,
                        })}
                      </span>
                    </Label>
                  ))}
                </RadioGroup>
              </section>
            ))}
          </div>
        </div>

        <div className="space-y-3 rounded-t-[2.2rem] bg-secondary/30 p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
          <div className="space-y-2">
            <div className="rounded-3xl border border-zinc-200 bg-zinc-950 px-4 py-4 text-white">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.14em] text-zinc-400">
                    Producto configurado
                  </p>
                  <p className="mt-1 text-base font-bold">{displayName}</p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-zinc-400">Total</p>
                  <p className="font-outfit text-[2rem] font-black leading-none">
                    ${unitPrice.toLocaleString("es-CL")}
                  </p>
                </div>
              </div>
            </div>
            <Separator className="my-1.5 bg-border/50" />
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-12 flex-1 rounded-xl border-zinc-300"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="h-12 flex-1 rounded-xl bg-[#E30909] text-white hover:bg-[#A00101]"
              onClick={handleConfirm}
            >
              Agregar
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
