"use client";

import * as React from "react";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

type ResponsivePanelProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: React.ReactNode;
    description?: React.ReactNode;
    children: React.ReactNode;
    desktopMode?: "dialog" | "sheet";
    desktopSide?: "top" | "bottom" | "left" | "right";
    mobileSide?: "top" | "bottom" | "left" | "right";
    hideHeader?: boolean;
    contentClassName?: string;
    mobileContentClassName?: string;
    desktopContentClassName?: string;
};

export function ResponsivePanel({
    open,
    onOpenChange,
    title,
    description,
    children,
    desktopMode = "sheet",
    desktopSide = "right",
    mobileSide = "bottom",
    hideHeader = false,
    contentClassName,
    mobileContentClassName,
    desktopContentClassName,
}: ResponsivePanelProps) {
    const isMobile = useIsMobile();

    if (isMobile) {
        return (
            <Sheet open={open} onOpenChange={onOpenChange}>
                <SheetContent
                    side={mobileSide}
                    className={cn(
                        "app-mobile-sheet max-h-[min(90dvh,42rem)] overflow-y-auto border-zinc-200 bg-[#FCFCFB] px-4 pt-4",
                        mobileSide === "bottom" ? "rounded-t-[1.75rem]" : "sm:max-w-md",
                        contentClassName,
                        mobileContentClassName
                    )}
                >
                    {!hideHeader && (
                        <SheetHeader className="mb-5 space-y-1 text-left">
                            <SheetTitle className="text-xl font-bold tracking-tight text-zinc-950">{title}</SheetTitle>
                            {description ? <SheetDescription>{description}</SheetDescription> : null}
                        </SheetHeader>
                    )}
                    {children}
                </SheetContent>
            </Sheet>
        );
    }

    if (desktopMode === "dialog") {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent
                    className={cn(
                        "max-h-[85dvh] overflow-y-auto rounded-[1.75rem] border-zinc-200 bg-white p-6 shadow-2xl",
                        contentClassName,
                        desktopContentClassName
                    )}
                >
                    {!hideHeader && (
                        <DialogHeader className="space-y-1 text-left">
                            <DialogTitle className="text-xl font-bold tracking-tight text-zinc-950">{title}</DialogTitle>
                            {description ? <DialogDescription>{description}</DialogDescription> : null}
                        </DialogHeader>
                    )}
                    {children}
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side={desktopSide}
                className={cn(
                    "overflow-y-auto border-zinc-200 bg-white p-6 sm:max-w-xl",
                    contentClassName,
                    desktopContentClassName
                )}
            >
                {!hideHeader && (
                    <SheetHeader className="mb-5 space-y-1 text-left">
                        <SheetTitle className="text-xl font-bold tracking-tight text-zinc-950">{title}</SheetTitle>
                        {description ? <SheetDescription>{description}</SheetDescription> : null}
                    </SheetHeader>
                )}
                {children}
            </SheetContent>
        </Sheet>
    );
}
