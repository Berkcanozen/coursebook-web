import type { FeeType } from '../types';

export const ICONS: Record<string, string> = {
  music: '🎹', sport: '🏊', language: '🗣️', art: '🎨', dance: '🩰',
  code: '💻', science: '🔬', math: '➗', chess: '♟️', book: '📖', other: '📚',
};
export const ICON_TINT: Record<string, string> = {
  music: '#EFE6FA', sport: '#E1F1EC', language: '#F6E7DD', art: '#F8E6EC', dance: '#F9E6F1',
  code: '#E6EEF8', science: '#E9F2DC', math: '#F7EED7', chess: '#ECEAE3', book: '#E6F1FB', other: '#EFEAE2',
};
export const CHILD_COLORS = ['#C85A38', '#3C7A57', '#3E6FA0', '#9A5BA6', '#B5781E', '#5B8FA0', '#B0476A', '#6B7A3C'];
export const FEELABEL: Record<FeeType, string> = { session: 'per session', month: 'per month', term: 'per term' };
