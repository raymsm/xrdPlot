import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function downsample<T>(data: T[], threshold: number): T[] {
  if (data.length <= threshold) {
    return data;
  }

  const sampleRate = Math.ceil(data.length / threshold);
  return data.filter((_, index) => index % sampleRate === 0);
}
