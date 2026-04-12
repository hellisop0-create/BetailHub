import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number) {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0,
  }).format(price);
}

export function generateWhatsAppLink(phone: string, title: string) {
  const message = encodeURIComponent(`Assalam-o-Alaikum, I am interested in your ad: ${title} on BetailHub.`);
  return `https://wa.me/${phone.replace(/\D/g, '')}?text=${message}`;
}
