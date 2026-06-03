export interface CultivoOption {
  key: string;
  value: string;
  label: string;
  icon: string;
  iconPath?: string;
}

export const CULTIVO_OPTIONS: CultivoOption[] = [
  { key: 'cacao', value: 'cacao', label: 'Cacao', icon: '', iconPath: '/icons/cacao.svg' },
  { key: 'maiz', value: 'ma\u00EDz', label: 'Ma\u00EDz', icon: '\uD83C\uDF3D' },
  { key: 'papa', value: 'papa', label: 'Papa', icon: '\uD83E\uDD54' },
  { key: 'arroz', value: 'arroz', label: 'Arroz', icon: '\uD83C\uDF5A' },
  { key: 'quinua', value: 'quinua', label: 'Quinua', icon: '\uD83C\uDF3E' },
  { key: 'palta', value: 'palta', label: 'Palta', icon: '\uD83E\uDD51' },
  { key: 'mango', value: 'mango', label: 'Mango', icon: '\uD83E\uDD6D' },
  { key: 'platano', value: 'pl\u00E1tano', label: 'Pl\u00E1tano', icon: '\uD83C\uDF4C' },
  { key: 'otro', value: 'otro', label: 'Otro', icon: '\uD83C\uDF31' },
];

const CULTIVO_FALLBACK: CultivoOption = {
  key: 'otro',
  value: 'otro',
  label: 'Otro',
  icon: '\uD83C\uDF31'
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
