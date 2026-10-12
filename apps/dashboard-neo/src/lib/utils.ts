import { clsx, type ClassValue } from "clsx"
import { cx } from "@/utils/cx"

export function cn(...inputs: ClassValue[]) {
  return cx(clsx(inputs))
}
