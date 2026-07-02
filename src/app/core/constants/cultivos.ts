export interface CultivoOption {
  key: string;
  value: string;
  label: string;
  icon: string;
  iconPath?: string;
}

export const CULTIVO_OPTIONS: CultivoOption[] = [
  { key: 'cacao', value: 'cacao', label: 'Cacao', icon: '', iconPath: '/icons/cacao.svg' },
  { key: 'maiz', value: 'ma\u00EDz', label: 'Ma\u00EDz', icon: '', iconPath: '/icons/planta-completa.svg' },
  { key: 'papa', value: 'papa', label: 'Papa', icon: '', iconPath: '/icons/planta-completa.svg' },
  { key: 'arroz', value: 'arroz', label: 'Arroz', icon: '', iconPath: '/icons/planta-completa.svg' },
  { key: 'quinua', value: 'quinua', label: 'Quinua', icon: '', iconPath: '/icons/planta-completa.svg' },
  { key: 'palta', value: 'palta', label: 'Palta', icon: '', iconPath: '/icons/planta-completa.svg' },
  { key: 'mango', value: 'mango', label: 'Mango', icon: '', iconPath: '/icons/planta-completa.svg' },
  { key: 'platano', value: 'pl\u00E1tano', label: 'Pl\u00E1tano', icon: '', iconPath: '/icons/planta-completa.svg' },
  { key: 'otro', value: 'otro', label: 'Otro', icon: '', iconPath: '/icons/planta-completa.svg' },
];

const CULTIVO_FALLBACK: CultivoOption = {
  key: 'otro',
  value: 'otro',
  label: 'Otro',
  icon: '',
  iconPath: '/icons/planta-completa.svg'
};

export function normalizeCultivo(value?: string | null): string {
  const normalized = (value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (normalized === 'palto') {
    return 'palta';
  }

  if (normalized === 'cafe') {
    return 'cacao';
  }

  return normalized;
}

export function getCultivoOption(value?: string | null): CultivoOption {
  const key = normalizeCultivo(value);
  return CULTIVO_OPTIONS.find((option) => option.key === key) || CULTIVO_FALLBACK;
}
