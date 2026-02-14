import { BENTO_GRID_TOTAL_ROW_HEIGHT } from '@/lib/constants/grid';

type GridItemLike = {
  x?: number;
  y?: number;
  w?: number;
  h?: number;
};

const getGridWidth = (): number => {
  if (typeof window === 'undefined') return 4; // SSR fallback
  return window.innerWidth < 1100 ? 2 : 4;
};

export const computeBestInsertPosition = (
  layout: GridItemLike[],
  cardWidth: number,
  cardHeight: number
): { x: number; y: number } => {
  if (typeof window === 'undefined') {
    const y = layout.reduce((max, item) => Math.max(max, (item.y || 0) + (item.h || 1)), 0);
    return { x: 0, y };
  }

  const GRID_WIDTH = getGridWidth();
  const ROW_HEIGHT_IN_PIXELS = BENTO_GRID_TOTAL_ROW_HEIGHT;
  const VIEWPORT_SEARCH_ROWS = Math.floor(window.innerHeight / ROW_HEIGHT_IN_PIXELS);

  const maxY = layout.reduce((max, item) => Math.max(max, (item.y || 0) + (item.h || 1)), 0);
  const occupiedGrid: boolean[][] = Array.from(
    { length: maxY + cardHeight + VIEWPORT_SEARCH_ROWS },
    () => new Array(GRID_WIDTH).fill(false)
  );

  layout.forEach(item => {
    const itemX = item.x || 0;
    const itemY = item.y || 0;
    const itemW = item.w || 1;
    const itemH = item.h || 1;
    for (let y = itemY; y < itemY + itemH; y++) {
      for (let x = itemX; x < itemX + itemW; x++) {
        if (y < occupiedGrid.length && x < GRID_WIDTH) {
          occupiedGrid[y][x] = true;
        }
      }
    }
  });

  const viewportYStart = Math.floor(window.scrollY / ROW_HEIGHT_IN_PIXELS);
  const viewportYEnd = viewportYStart + VIEWPORT_SEARCH_ROWS;
  const searchEndY = maxY + cardHeight + VIEWPORT_SEARCH_ROWS;

  // Strategy 1a: First, search viewport area (top-down, left-first)
  // This ensures new cards appear in user's viewport when possible
  void 0;
  for (let y = viewportYStart; y <= viewportYEnd - cardHeight && y < searchEndY; y++) {
    if (y < 0) continue;
    for (let x = 0; x <= GRID_WIDTH - cardWidth; x++) {
      let canPlace = true;
      for (let dy = 0; dy < cardHeight && canPlace; dy++) {
        for (let dx = 0; dx < cardWidth && canPlace; dx++) {
          if (y + dy >= occupiedGrid.length || (occupiedGrid[y + dy] && occupiedGrid[y + dy][x + dx])) {
            canPlace = false;
          }
        }
      }
      if (canPlace) {
        void 0;
        return { x, y };
      }
    }
  }

  // Strategy 1b: If viewport is full, search outside viewport (top-down, left-first)
  // This ensures new cards fill empty spaces next to existing cards
  void 0;
  for (let y = 0; y < searchEndY; y++) {
    // Skip viewport area already searched
    if (y >= viewportYStart && y <= viewportYEnd - cardHeight) continue;
    
    for (let x = 0; x <= GRID_WIDTH - cardWidth; x++) {
      let canPlace = true;
      for (let dy = 0; dy < cardHeight && canPlace; dy++) {
        for (let dx = 0; dx < cardWidth && canPlace; dx++) {
          if (y + dy >= occupiedGrid.length || (occupiedGrid[y + dy] && occupiedGrid[y + dy][x + dx])) {
            canPlace = false;
          }
        }
      }
      if (canPlace) {
        void 0;
        return { x, y };
      }
    }
  }

  // Strategy 2: If entire grid is full, insert near viewport center
  // This ensures new cards appear in user's viewport even when grid is full
  const insertionY = viewportYStart + Math.floor(VIEWPORT_SEARCH_ROWS / 4);
  void 0;
  return { x: 0, y: Math.max(0, insertionY) };
};


