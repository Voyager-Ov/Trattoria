import React from "react";

export interface SpectrumIconProps extends React.SVGProps<SVGSVGElement> {
    variant?: "diamond" | "cube" | "nodes" | "wave" | "organic" | "starburst" | "blob";
}

export function SpectrumIcon({ variant = "diamond", className, ...props }: SpectrumIconProps) {
    // Background Aesthetic Blobs
    if (variant === "organic") {
        return (
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
                <path fill="currentColor" d="M44.7,-76.4C58.8,-69.2,71.8,-59.1,81.3,-46.6C90.8,-34.1,96.8,-19.1,97.7,-4C98.6,11.2,94.5,26.4,85.6,38.8C76.8,51.3,63.2,61.1,48.2,66.8C33.2,72.5,16.6,74.1,2.1,70.5C-12.4,66.8,-24.8,57.9,-37.8,49.9C-50.8,41.9,-64.4,34.8,-71.4,23.3C-78.4,11.8,-78.9,-4.1,-75.4,-18.9C-71.9,-33.7,-64.4,-47.4,-53.1,-56.3C-41.8,-65.3,-26.7,-69.5,-12.3,-72.1C2.1,-74.7,16.6,-75.6,30.6,-78.3C35.3,-79.1,40,-78.6,44.7,-76.4Z" transform="translate(100 100)" />
            </svg>
        );
    }

    if (variant === "starburst") {
        return (
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
                <path fill="currentColor" d="M100,5 C105,40 160,40 195,50 C160,60 160,110 195,150 C160,140 105,160 100,195 C95,160 40,140 5,150 C40,110 40,60 5,50 C40,40 95,40 100,5 Z" />
            </svg>
        );
    }

    if (variant === "blob") {
        return (
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
                <path fill="currentColor" d="M51.1,-71.6C62.5,-61.1,65.3,-40.8,70.7,-21.9C76.2,-2.9,84.4,14.8,79.8,30C75.2,45.2,57.8,58,40.1,65.7C22.4,73.4,4.3,76.1,-13.6,74.5C-31.4,72.9,-49,67,-61.4,54.7C-73.8,42.4,-81,23.7,-82.1,5.1C-83.3,-13.5,-78.4,-31.9,-68,-46.3C-57.5,-60.7,-41.5,-71.1,-24.5,-75.1C-7.5,-79.1,10.6,-76.8,26.4,-70.7L51.1,-71.6Z" transform="translate(100 100)" />
            </svg>
        );
    }

    // Stylized "Dollar/Revenue" equivalent
    if (variant === "diamond") {
        return (
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
                <path d="M12 2L2 12l10 10 10-10L12 2z" />
                <path d="M12 2v20" />
                <path d="M2 12h20" />
            </svg>
        );
    }

    // Stylized "Bag/Orders" equivalent
    if (variant === "cube") {
        return (
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <path d="M3.27 6.96L12 12.01l8.73-5.05" />
                <path d="M12 22.08V12" />
            </svg>
        );
    }

    // Stylized "Users/Clients" equivalent
    if (variant === "nodes") {
        return (
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
                <circle cx="18" cy="6" r="3" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="18" r="3" />
                <path d="M16.5 7.5l-9 9" />
                <path d="M18 9v6" />
                <path d="M15 18H9" />
            </svg>
        );
    }

    // Stylized "Trending/Growth" equivalent
    if (variant === "wave") {
        return (
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
                <path d="M3 12h4l3-9 5 18 3-9h3" />
            </svg>
        );
    }

    return null;
}
