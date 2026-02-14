export const BENTO_GRID_ROW_HEIGHT = 67.5;
export const BENTO_GRID_VERTICAL_MARGIN = 40;

/**
 * The total height of a single grid row in pixels, including the margin/gap below it.
 * This is crucial for accurately converting scroll position (in pixels) to a grid row index.
 */
export const BENTO_GRID_TOTAL_ROW_HEIGHT = BENTO_GRID_ROW_HEIGHT + BENTO_GRID_VERTICAL_MARGIN;

const NEED_BOARD_HORIZONTAL_ALIASES = ['horizontal', 'small'];
const NEED_BOARD_SQUARE_ALIASES = ['square', 'vertical', 'large'];

export type NeedBoardNormalizedSize = 'horizontal' | 'square';

export const resolveNeedBoardSize = (size?: string | null): NeedBoardNormalizedSize => {
  const normalized = typeof size === 'string' ? size.toLowerCase() : '';

  if (NEED_BOARD_SQUARE_ALIASES.includes(normalized)) {
    return 'square';
  }

  if (NEED_BOARD_HORIZONTAL_ALIASES.includes(normalized)) {
    return 'horizontal';
  }

  return 'horizontal';
};

export const NEED_BOARD_GRID_SIZES: Record<NeedBoardNormalizedSize, { w: number; h: number }> = {
  horizontal: { w: 4, h: 2 },
  square: { w: 2, h: 4 },
};

export const getNeedBoardGridSize = (size?: string | null) => {
  const normalized = resolveNeedBoardSize(size);
  return NEED_BOARD_GRID_SIZES[normalized];
};
