"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Product } from '@prisma/client';

export interface ProductSelectionOption {
    groupId: string;
    groupLabel: string;
    optionId: string;
    optionLabel: string;
    priceDelta: number;
}

export interface CartItem extends Product {
    quantity: number;
    lineKey: string;
    selectedOptions?: ProductSelectionOption[];
}

interface CartContextType {
    items: CartItem[];
    addItem: (product: Product, selectedOptions?: ProductSelectionOption[]) => void;
    removeItem: (lineKey: string) => void;
    updateQuantity: (lineKey: string, quantity: number) => void;
    clearCart: () => void;
    totalItems: number;
    totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function buildLineKey(productId: string, selectedOptions: ProductSelectionOption[] = []): string {
    if (selectedOptions.length === 0) return productId;

    const serializedOptions = [...selectedOptions]
        .sort((a, b) => a.groupId.localeCompare(b.groupId))
        .map((option) => `${option.groupId}:${option.optionId}`)
        .join('|');

    return `${productId}::${serializedOptions}`;
}

function normalizeCartItem(item: unknown): CartItem {
    const rawItem = (item ?? {}) as Partial<CartItem>;
    const selectedOptions = Array.isArray(rawItem.selectedOptions) ? rawItem.selectedOptions : undefined;
    const lineKey = typeof rawItem.lineKey === 'string'
        ? rawItem.lineKey
        : buildLineKey(String(rawItem.id ?? ''), selectedOptions ?? []);

    return {
        ...(rawItem as Product),
        quantity: Number(rawItem.quantity) || 1,
        lineKey,
        selectedOptions,
    } as CartItem;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);
    const [isInitialized, setIsInitialized] = useState(false);

    // Initialize cart from localStorage
    useEffect(() => {
        const initCart = () => {
            const savedCart = localStorage.getItem('trattoria-cart');
            if (savedCart) {
                try {
                    const parsed = JSON.parse(savedCart);
                    if (Array.isArray(parsed)) {
                        setItems(parsed.map(normalizeCartItem));
                    }
                } catch (error) {
                    console.error("Error parsing saved cart:", error);
                }
            }
            setIsInitialized(true);
        };

        setTimeout(initCart, 0);
    }, []);

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        if (isInitialized) {
            localStorage.setItem('trattoria-cart', JSON.stringify(items));
        }
    }, [items, isInitialized]);

    const addItem = (product: Product, selectedOptions: ProductSelectionOption[] = []) => {
        const lineKey = buildLineKey(product.id, selectedOptions);
        setItems(prevItems => {
            const existingItem = prevItems.find(item => item.lineKey === lineKey);
            if (existingItem) {
                return prevItems.map(item =>
                    item.lineKey === lineKey
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prevItems, {
                ...product,
                quantity: 1,
                lineKey,
                selectedOptions: selectedOptions.length > 0 ? selectedOptions : undefined,
            }];
        });
    };

    const removeItem = (lineKey: string) => {
        setItems(prevItems => prevItems.filter(item => item.lineKey !== lineKey));
    };

    const updateQuantity = (lineKey: string, quantity: number) => {
        if (quantity <= 0) {
            removeItem(lineKey);
            return;
        }
        setItems(prevItems =>
            prevItems.map(item =>
                item.lineKey === lineKey ? { ...item, quantity } : item
            )
        );
    };

    const clearCart = () => {
        setItems([]);
    };

    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = items.reduce((sum, item) => {
        const itemPrice = Number(item.precio);
        const optionsPrice = (item.selectedOptions || []).reduce((optSum, opt) => optSum + opt.priceDelta, 0);
        return sum + ((itemPrice + optionsPrice) * item.quantity);
    }, 0);

    return (
        <CartContext.Provider value={{
            items,
            addItem,
            removeItem,
            updateQuantity,
            clearCart,
            totalItems,
            totalPrice
        }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
