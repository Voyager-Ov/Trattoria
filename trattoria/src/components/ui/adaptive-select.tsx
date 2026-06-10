"use client";

import { SelectHTMLAttributes } from "react";

import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type AdaptiveSelectOption = {
    value: string;
    label: string;
    disabled?: boolean;
};

type AdaptiveSelectProps = {
    options: AdaptiveSelectOption[];
    value: string;
    onValueChange: (value: string) => void;
    placeholder?: string;
    name?: string;
    triggerClassName?: string;
    contentClassName?: string;
    nativeClassName?: string;
} & Omit<SelectHTMLAttributes<HTMLSelectElement>, "value" | "onChange" | "name">;

export function AdaptiveSelect({
    options,
    value,
    onValueChange,
    placeholder,
    name,
    triggerClassName,
    contentClassName,
    nativeClassName,
    ...nativeProps
}: AdaptiveSelectProps) {
    const isMobile = useIsMobile();

    if (isMobile) {
        return (
            <select
                {...nativeProps}
                name={name}
                value={value}
                onChange={(event) => onValueChange(event.target.value)}
                className={cn(
                    "flex h-14 w-full rounded-[1.5rem] border border-zinc-200 bg-zinc-50 px-5 font-semibold text-zinc-900 outline-none transition focus:border-zinc-400",
                    nativeClassName ?? triggerClassName
                )}
            >
                {placeholder ? (
                    <option value="" disabled>
                        {placeholder}
                    </option>
                ) : null}
                {options.map((option) => (
                    <option key={option.value} value={option.value} disabled={option.disabled}>
                        {option.label}
                    </option>
                ))}
            </select>
        );
    }

    return (
        <Select name={name} value={value} onValueChange={onValueChange}>
            <SelectTrigger className={triggerClassName}>
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent className={contentClassName}>
                {options.map((option) => (
                    <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
                        {option.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
