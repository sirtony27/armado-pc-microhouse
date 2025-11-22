import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrecio(precio: number): string {
  const v = Math.ceil(Number(precio || 0));
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(v);
}

export function formatearNumero(num: number): string {
  return new Intl.NumberFormat('es-AR').format(num);
}

export function roundNice(val: number, step = 1000): number {
  const n = Number(val || 0);
  return Math.ceil(n / step) * step;
}

export function calcularDescuento(precioActual: number, precioAnterior: number): number {
  if (!precioAnterior || precioAnterior <= precioActual) return 0;
  return Math.round(((precioAnterior - precioActual) / precioAnterior) * 100);
}
