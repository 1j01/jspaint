/**
 * useSystemFonts Hook
 *
 * Enumerates available system fonts using multiple methods:
 * 1. Local Font Access API (Chrome/Edge)
 * 2. FontDetective library (fallback)
 * 3. Hardcoded fallback fonts
 *
 * Provides incremental loading feedback as fonts are detected.
 */

import { useState, useEffect } from "react";

// Extend Window interface for Local Font Access API and FontDetective
declare global {
  interface Window {
    queryLocalFonts?: () => Promise<{ family: string }[]>;
    FontDetective?: {
      each: (callback: (font: { name: string; toString: () => string }) => void) => void;
      all: (callback: (fonts: { name: string }[]) => void) => void;
    };
  }
}

export const FALLBACK_FONTS: string[] = [
  "Arial",
  "Calibri",
  "Cambria",
  "Comic Sans MS",
  "Courier New",
  "Georgia",
  "Helvetica",
  "Impact",
  "Liberation Sans",
  "Lucida Console",
  "Palatino Linotype",
  "Tahoma",
  "Times New Roman",
  "Trebuchet MS",
  "Verdana",
];

/**
 * Ensures font list is valid, unique, and sorted.
 * Deduplicates and alphabetically sorts the font list.
 * Falls back to FALLBACK_FONTS if empty.
 *
 * @param fonts - Font family names to process
 * @returns Unique, sorted font list
 */
function ensureFonts(fonts: string[]): string[] {
  const source = !fonts || !fonts.length ? FALLBACK_FONTS : fonts;
  return Array.from(new Set(source)).sort((a, b) => a.localeCompare(b));
}

/**
 * Hook for loading system fonts
 *
 * Progressive font enumeration:
 * 1. Try Local Font Access API (window.queryLocalFonts)
 * 2. Fallback to FontDetective library (incremental detection)
 * 3. Fallback to FALLBACK_FONTS list
 *
 * @returns Available fonts and loading state
 *
 * @example
 * const { fonts, loading } = useSystemFonts();
 *
 * if (loading) {
 *   return <div>Loading fonts...</div>;
 * }
 *
 * return (
 *   <select>
 *     {fonts.map(font => (
 *       <option key={font} value={font}>{font}</option>
 *     ))}
 *   </select>
 * );
 */
export function useSystemFonts() {
  const [fonts, setFonts] = useState<string[]>(() => ensureFonts([]));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadFonts = async () => {
      // Skip if running on server
      if (typeof window === "undefined") {
        setFonts(ensureFonts([]));
        return;
      }

      setLoading(true);

      /**
       * Helper to use FontDetective fallback
       * FontDetective incrementally detects fonts by testing character widths
       */
      const useFontDetective = () => {
        if (cancelled) return;

        if (!window.FontDetective) {
          // FontDetective not available, use fallback fonts
          setFonts(ensureFonts([]));
          setLoading(false);
          return;
        }

        const detectedFonts: string[] = [];

        // FontDetective.each is called for each font as it's detected
        window.FontDetective.each((font) => {
          if (!cancelled) {
            detectedFonts.push(font.name);
            // Update incrementally as fonts are detected
            setFonts(ensureFonts([...detectedFonts]));
          }
        });

        // FontDetective.all is called when detection is complete
        window.FontDetective.all(() => {
          if (!cancelled) {
            setFonts(ensureFonts(detectedFonts));
            setLoading(false);
          }
        });
      };

      try {
        // Try Local Font Access API first (Chrome/Edge 103+)
        if (window.queryLocalFonts) {
          const fontData = await window.queryLocalFonts();
          if (cancelled) return;

          if (fontData.length) {
            // Extract unique font family names
            const familyNames = new Set<string>();
            for (const font of fontData) {
              if (!familyNames.has(font.family)) {
                familyNames.add(font.family);
              }
            }
            setFonts(ensureFonts(Array.from(familyNames)));
            setLoading(false);
            return;
          } else {
            // queryLocalFonts returned no fonts, fall back to FontDetective
            useFontDetective();
            return;
          }
        }
      } catch (error) {
        if (!cancelled) {
          // queryLocalFonts failed, fall back to FontDetective
          useFontDetective();
          return;
        }
      }

      // No Local Font Access API, use FontDetective
      useFontDetective();
    };

    loadFonts();

    // Cleanup function to prevent state updates after unmount
    return () => {
      cancelled = true;
    };
  }, []);

  return { fonts, loading };
}
