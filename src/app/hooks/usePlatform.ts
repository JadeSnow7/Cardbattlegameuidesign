import { useState, useEffect } from "react";

interface Platform {
    isDesktop: boolean;
    isMobile: boolean;
    isTablet: boolean;
}

function detectPlatform(): Platform {
    // Check if running in Electron
    const isElectron = navigator.userAgent.toLowerCase().indexOf(" electron/") > -1;
    if (isElectron) {
        return { isDesktop: true, isMobile: false, isTablet: false };
    }

    // Basic fallback detection based on window width
    const width = window.innerWidth;
    const isMobile = width < 768; // Tailwind md breakpoint
    const isTablet = width >= 768 && width < 1024; // Tailwind lg breakpoint
    const isDesktop = width >= 1024;

    return { isDesktop, isMobile, isTablet };
}

export function usePlatform(): Platform {
    const [platform, setPlatform] = useState<Platform>(detectPlatform());

    useEffect(() => {
        const handler = () => {
            setPlatform(detectPlatform());
        };

        window.addEventListener("resize", handler);
        return () => window.removeEventListener("resize", handler);
    }, []);

    return platform;
}
