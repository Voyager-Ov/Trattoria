"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Search, Bell } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { Input } from "@/components/ui/input";
import { DynamicBreadcrumb } from "./DynamicBreadcrumb";

export function Header() {
    return (
        <header className="sticky top-0 z-30 flex h-20 items-center gap-4 bg-white/80 backdrop-blur-md px-6 border-b border-zinc-100 shadow-sm">
            {/* Mobile Menu Trigger */}
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="md:hidden rounded-xl border-zinc-200">
                        <Menu className="h-5 w-5 text-zinc-600" />
                        <span className="sr-only">Toggle Menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 border-r-zinc-200 bg-white w-[280px]">
                    {/* Force Expanded Sidebar in Mobile Sheet */}
                    <div className="h-full">
                        <Sidebar mode="mobile" className="w-full h-full border-none shadow-none" />
                    </div>
                </SheetContent>
            </Sheet>

            {/* Dynamic Breadcrumbs */}
            <div className="hidden md:flex flex-1 items-center">
                <DynamicBreadcrumb />
            </div>

            {/* Search Bar (Optional) */}
            <div className="hidden md:flex relative w-full max-w-sm items-center ml-auto mr-4">
                <Search className="absolute left-3 h-4 w-4 text-zinc-400" />
                <Input
                    placeholder="Buscar..."
                    className="pl-9 rounded-2xl bg-zinc-50 border-zinc-200 focus-visible:ring-primary/20 text-zinc-800 placeholder:text-zinc-400 h-10"
                />
            </div>

            {/* User & Actions */}
            <div className="flex items-center gap-3 ml-auto md:ml-0">
                <Button variant="ghost" size="icon" className="rounded-full text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100">
                    <Bell className="h-5 w-5" />
                </Button>

                <div className="h-8 w-[1px] bg-zinc-200 mx-1 hidden md:block"></div>

                <div className="flex items-center gap-3">
                    <div className="text-right hidden md:block">
                        <p className="text-sm font-semibold text-zinc-800 leading-none">Admin User</p>
                        <p className="text-xs text-muted-foreground">Gerente</p>
                    </div>
                    <Avatar className="h-10 w-10 border-2 border-white shadow-sm cursor-pointer hover:scale-105 transition-transform">
                        <AvatarImage src="https://github.com/shadcn.png" />
                        <AvatarFallback className="bg-primary/10 text-primary font-bold">CN</AvatarFallback>
                    </Avatar>
                </div>
            </div>
        </header>
    );
}
