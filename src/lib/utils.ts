import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { makeUseQueryWithStatus } from "convex-helpers/react";
import { useQueries } from "convex/react";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
// Do this once somewhere, name it whatever you want.
export const useQueryWithStatus = makeUseQueryWithStatus(useQueries);