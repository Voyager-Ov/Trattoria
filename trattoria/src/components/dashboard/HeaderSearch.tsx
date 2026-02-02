"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Package, ShoppingBag, Users as UsersIcon, Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { globalSearch, SearchResult } from "@/app/admin/dashboard/searchActions";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export function HeaderSearch() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    const handleSelect = (result: SearchResult) => {
        router.push(result.href);
        setIsOpen(false);
        setQuery("");
    };

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.trim().length >= 2) {
                setIsLoading(true);
                const response = await globalSearch(query);
                if (response.success) {
                    setResults(response.data);
                    setIsOpen(response.data.length > 0);
                }
                setIsLoading(false);
            } else {
                setResults([]);
                setIsOpen(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Shortcut Ctrl+K or Cmd+K
            if ((e.ctrlKey || e.metaKey) && e.key === "k") {
                e.preventDefault();
                document.getElementById("header-search-input")?.focus();
            }

            if (!isOpen) return;

            if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
            } else if (e.key === "Enter" && selectedIndex >= 0) {
                e.preventDefault();
                handleSelect(results[selectedIndex]);
            } else if (e.key === "Escape") {
                setIsOpen(false);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, results, selectedIndex, handleSelect]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const getTypeIcon = (type: SearchResult['type']) => {
        switch (type) {
            case 'PEDIDO': return <ShoppingBag className="h-4 w-4" />;
            case 'PRODUCTO': return <Package className="h-4 w-4" />;
            case 'EMPLEADO': return <UsersIcon className="h-4 w-4" />;
        }
    };

    const getTypeLabel = (type: SearchResult['type']) => {
        switch (type) {
            case 'PEDIDO': return 'Pedido';
            case 'PRODUCTO': return 'Producto';
            case 'EMPLEADO': return 'Empleado';
        }
    };

    return (
        <div ref={containerRef} className="hidden md:flex relative w-full max-w-md items-center ml-auto mr-4">
            <Search className="absolute left-3 h-4 w-4 text-zinc-400" />
            <Input
                id="header-search-input"
                placeholder="Buscar (Ctrl+K)"
                value={query}
                onChange={(e) => {
                    setQuery(e.target.value);
                    setSelectedIndex(-1);
                }}
                onFocus={() => query.length >= 2 && results.length > 0 && setIsOpen(true)}
                className="pl-9 pr-10 rounded-2xl bg-zinc-50 border-zinc-200 focus-visible:ring-primary/20 text-zinc-800 placeholder:text-zinc-400 h-11 transition-all focus:bg-white focus:shadow-md"
            />

            {query && (
                <button
                    onClick={() => setQuery("")}
                    className="absolute right-3 p-1 rounded-full hover:bg-zinc-200 text-zinc-400 transition-colors"
                >
                    {isLoading ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                        <X className="h-3 w-3" />
                    )}
                </button>
            )}

            {/* Results Dropdown */}
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-zinc-100 shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="max-h-[400px] overflow-y-auto p-2">
                        {results.map((result, index) => (
                            <button
                                key={`${result.type}-${result.id}`}
                                onClick={() => handleSelect(result)}
                                onMouseEnter={() => setSelectedIndex(index)}
                                className={cn(
                                    "w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left",
                                    selectedIndex === index ? "bg-zinc-50" : "bg-transparent"
                                )}
                            >
                                <div className={cn(
                                    "flex items-center justify-center h-10 w-10 rounded-xl",
                                    result.type === 'PEDIDO' ? "bg-blue-50 text-blue-600" :
                                        result.type === 'PRODUCTO' ? "bg-emerald-50 text-emerald-600" :
                                            "bg-amber-50 text-amber-600"
                                )}>
                                    {getTypeIcon(result.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-semibold text-zinc-900 truncate">
                                            {result.title}
                                        </span>
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                                            {getTypeLabel(result.type)}
                                        </span>
                                    </div>
                                    {result.subtitle && (
                                        <p className="text-xs text-zinc-500 truncate">{result.subtitle}</p>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                    <div className="bg-zinc-50 p-3 flex justify-between items-center border-t border-zinc-100">
                        <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-widest">
                            {results.length} resultados encontrados
                        </p>
                        <div className="flex gap-2">
                            <span className="bg-white border border-zinc-200 text-[9px] px-1.5 py-0.5 rounded text-zinc-400 font-bold">↵ ENTER</span>
                            <span className="bg-white border border-zinc-200 text-[9px] px-1.5 py-0.5 rounded text-zinc-400 font-bold">↑↓ NAVIGATE</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
