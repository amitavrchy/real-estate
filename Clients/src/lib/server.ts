import "server-only";
import { cache } from "react";
export const serverGet = cache(async <T>(path: string): Promise<T | null> => {
  const response = await fetch(
    `${process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:4100"}${path}`,
    { cache: "no-store", signal: AbortSignal.timeout(8000) },
  );
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`API returned ${response.status}`);
  return response.json();
});
