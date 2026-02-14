import { useState, useCallback, useRef, useEffect } from 'react';
import type { BentoItemProps, BentoItem, BoxUpdateInput, ResponsiveLayout } from "@/types/bento";
import { getPosition } from "@/types/bento";
import { BENTO_GRID_TOTAL_ROW_HEIGHT, getNeedBoardGridSize, resolveNeedBoardSize } from '@/lib/constants/grid';
import type { Layout } from "@/components/features/bento/types";
import type { User } from "@/hooks/use-user";
import * as bentoService from "@/lib/api/bentoService";
import { LocalStorageAdapter, StaticConfigAdapter } from '@/lib/adapters';
import { isPublishedMode, isEditModeOnPublishedSite, seedLocalStorageFromStaticConfig } from '@/lib/adapters/adapter-provider';
import type { ProfileDataAdapter, AdapterBentoItem } from '@/lib/adapters';

// 队列项类型定义
type QueueItem = {
    id: string;
    operationId: string; // 新增：操作ID用于去重
    data: Omit<BentoItemProps, 'id' | 'x' | 'y' | 'w' | 'h'> & { w: number; h: number };
    preferredPosition?: { x: number; y: number };
    resolve: (finalId?: string) => void; // 修改：可以传入最终ID
    reject: (error: any) => void;
};

// Helper function to get current layout mode
const getCurrentLayoutMode = (): 'lg' | 'sm' => {
    return typeof window !== 'undefined' && window.innerWidth < 1100 ? 'sm' : 'lg';
};

// Helper function to map DB data to frontend component props
const mapBentoItemToProps = (item: BentoItem, layoutMode?: 'lg' | 'sm'): BentoItemProps => {
    const getCardSize = (w?: number, h?: number): 'small' | 'horizontal' | 'vertical' | 'large' => {
        if (w === 1 && h === 2) return 'small';
        if (w === 2 && h === 2) return 'horizontal';
        if (w === 1 && h === 4) return 'vertical';
        if (w === 2 && h === 4) return 'large';
        return 'small';
    };

    // 确定当前应该使用的布局模式
    const currentLayoutMode = layoutMode || getCurrentLayoutMode();

    // 使用兼容性工具函数获取位置信息
    const position = getPosition(item, currentLayoutMode);
    const x = position.x;
    const y = position.y;
    let w = item.width || 1;
    const h = item.height || 1;

    const baseProps: Partial<BentoItemProps> = {
        id: item.id,
        type: item.type.toLowerCase() as BentoItemProps['type'],
        url: item.url || undefined,
        x,
        y,
        w,
        h,
        className: item.className || undefined,
    };

    // Merge metadata properties into the baseProps
    const props = { ...baseProps, ...item.metadata } as BentoItemProps;

    if (item.eventTagIds) {
        props.eventTagIds = item.eventTagIds;
    } else if (props.eventTagIds === undefined) {
        props.eventTagIds = [];
    }

    // Infer platform for legacy records: if missing platform but has HF-specific fields, assume 'huggingface'
    if (!('platform' in (props as any)) || !props.platform) {
        const hasHfHints =
            (props as any).downloads !== undefined ||
            (props as any).likes !== undefined ||
            (props as any).category !== undefined;
        if (hasHfHints) {
            (props as any).platform = 'huggingface';
        }
    }

    // 图片变换字段：优先使用数据库字段，而不是 metadata 中的值
    const dbImageScale = (item as any).image_scale;
    const dbImagePositionX = (item as any).image_position_x;
    const dbImagePositionY = (item as any).image_position_y;

    if (dbImageScale !== null && dbImageScale !== undefined) {
        props.image_scale = dbImageScale;
    }
    if (dbImagePositionX !== null && dbImagePositionX !== undefined) {
        props.image_position_x = dbImagePositionX;
    }
    if (dbImagePositionY !== null && dbImagePositionY !== undefined) {
        props.image_position_y = dbImagePositionY;
    }

    if (props.type === 'link' || props.type === 'text' || props.type === 'image') {
        props.cardSize = getCardSize(props.w, props.h);
    }

    if (props.type === 'need') {
        const normalizedSize = resolveNeedBoardSize(props.size as string | undefined);
        const { w: normalizedWidth, h: normalizedHeight } = getNeedBoardGridSize(normalizedSize);
        props.size = normalizedSize;
        props.w = normalizedWidth;
        props.h = normalizedHeight;
    }

    return props;
};

const generateId = () => Math.random().toString(36).substr(2, 9);

// 生成唯一操作ID的函数
const generateOperationId = (item: Omit<BentoItemProps, 'id' | 'x' | 'y' | 'w' | 'h'> & { w: number; h: number }): string => {
    // 基于item内容生成唯一ID，包含type和关键字段
    const keyFields = {
        type: item.type,
        url: item.url,
        text: typeof item.text === 'string' ? item.text : undefined,
        owner: item.owner,
        repo: item.repo,
        userId: item.userId,
    };

    // 过滤掉undefined的字段，并且只保留原始值
    const cleanFields = Object.fromEntries(
        Object.entries(keyFields)
            .filter(([_, value]) => value !== undefined)
            .map(([key, value]: [string, any]) => [key,
                typeof value === 'object' && value !== null ?
                    (value.id || value.toString() || JSON.stringify(Object.keys(value))) :
                    value
            ])
    );

    try {
        return `${item.type}-${JSON.stringify(cleanFields)}`;
    } catch (error) {
        console.warn('Failed to generate operation ID with full fields, falling back to simple ID');
        return `${item.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
};

// 找到最佳位置来放置新卡片的函数（增强版：优先可视区域，可向下推移）
const findBestPosition = (
    layout: BentoItemProps[],
    cardWidth: number,
    cardHeight: number
): { position: { x: number; y: number }, shiftedItems: BentoItemProps[] } => {
    void 0;

    if (typeof window === 'undefined') {
        // Fallback for SSR or non-browser environments
        const y = layout.reduce((max, item) => Math.max(max, (item.y || 0) + (item.h || 1)), 0);
        return { position: { x: 0, y }, shiftedItems: [] };
    }

    // --- 配置常量 ---
    const GRID_WIDTH = window.innerWidth < 1100 ? 2 : 4;
    // 估算值：一个 grid row的高度 + gap。例如 16rem (64px) + 1rem (16px) = 80px
    const ROW_HEIGHT_IN_PIXELS = BENTO_GRID_TOTAL_ROW_HEIGHT;
    // 大约覆盖 1080p 屏幕的高度
    const VIEWPORT_SEARCH_ROWS = Math.floor(window.innerHeight / ROW_HEIGHT_IN_PIXELS);

    // --- 计算当前布局和视口信息 ---
    const maxY = layout.reduce((max, item) => Math.max(max, (item.y || 0) + (item.h || 1)), 0);
    const occupiedGrid: boolean[][] = Array.from({ length: maxY + cardHeight + VIEWPORT_SEARCH_ROWS }, () => new Array(GRID_WIDTH).fill(false));

    layout.forEach(item => {
        for (let y = item.y || 0; y < (item.y || 0) + (item.h || 1); y++) {
            for (let x = item.x || 0; x < (item.x || 0) + (item.w || 1); x++) {
                if (y < occupiedGrid.length && x < GRID_WIDTH) {
                    occupiedGrid[y][x] = true;
                }
            }
        }
    });

    const viewportYStart = Math.floor(window.scrollY / ROW_HEIGHT_IN_PIXELS);
    const viewportYEnd = viewportYStart + VIEWPORT_SEARCH_ROWS;
    const searchEndY = maxY + cardHeight + VIEWPORT_SEARCH_ROWS;
    void 0;

    // --- 策略1a: 优先搜索视口内的空位 (从上到下、从左到右) ---
    // 确保新卡片优先出现在用户视野内
    void 0;
    for (let y = viewportYStart; y <= viewportYEnd - cardHeight && y < searchEndY; y++) {
        if (y < 0) continue;
        for (let x = 0; x <= GRID_WIDTH - cardWidth; x++) {
            let canPlace = true;
            for (let dy = 0; dy < cardHeight; dy++) {
                for (let dx = 0; dx < cardWidth; dx++) {
                    if (y + dy >= occupiedGrid.length || (occupiedGrid[y + dy] && occupiedGrid[y + dy][x + dx])) {
                        canPlace = false;
                        break;
                    }
                }
                if (!canPlace) break;
            }
            if (canPlace) {
                void 0;
                return { position: { x, y }, shiftedItems: [] };
            }
        }
    }

    // --- 策略2: 如果视口内没有空位，在视口内插入并向下推移其他卡片 ---
    // 优先确保新卡片出现在用户视野内，即使需要挤开其他卡片
    const insertionY = Math.max(0, viewportYStart + Math.floor(VIEWPORT_SEARCH_ROWS / 4));
    const insertionX = 0;
    void 0;

    // 筛选出需要向下移动的卡片
    // 条件：与新卡片在水平方向上重叠，并且在新卡片垂直位置或其下方
    const itemsToShift = layout.filter(item => {
        const newCardStartX = insertionX;
        const newCardEndX = insertionX + cardWidth;

        const itemStartX = item.x || 0;
        const itemEndX = (item.x || 0) + (item.w || 1);
        const itemStartY = item.y || 0;

        // 检查x轴是否重叠
        const overlapsX = Math.max(newCardStartX, itemStartX) < Math.min(newCardEndX, itemEndX);

        // 检查y轴位置（在插入行或更下方）
        const atOrBelowY = itemStartY >= insertionY;

        return overlapsX && atOrBelowY;
    });

    const shiftedItems = itemsToShift.map(item => ({
        ...item,
        y: (item.y || 0) + cardHeight,
    }));

    void 0;
    return {
        position: { x: insertionX, y: insertionY },
        shiftedItems: shiftedItems,
    };
};

const calculateNewCardY = (layout: BentoItemProps[]): number => {
    if (layout.length === 0) return 0;
    return layout.reduce((maxY, card) => Math.max(maxY, (card.y || 0) + (card.h || 0)), 0);
};

// 检测并解决碰撞：当卡片尺寸变化时，检测是否会与其他卡片碰撞，并自动调整受影响卡片的位置
const detectAndResolveCollisions = (
    updatedItem: BentoItemProps,
    allItems: BentoItemProps[],
    cols: number
): BentoItemProps[] => {
    const updatedItems = [...allItems];
    const itemIndex = updatedItems.findIndex(item => item.id === updatedItem.id);
    if (itemIndex === -1) return updatedItems;
    
    // 更新目标卡片
    updatedItems[itemIndex] = updatedItem;
    
    const updatedX = updatedItem.x || 0;
    const updatedY = updatedItem.y || 0;
    const updatedW = updatedItem.w || 1;
    const updatedH = updatedItem.h || 1;
    
    // 找出与新尺寸重叠的所有卡片（排除自己）
    const collidingItems: Array<{ item: BentoItemProps; index: number }> = [];
    
    updatedItems.forEach((item, index) => {
        if (item.id === updatedItem.id) return; // 跳过自己
        
        const itemX = item.x || 0;
        const itemY = item.y || 0;
        const itemW = item.w || 1;
        const itemH = item.h || 1;
        
        // 检查水平方向是否重叠
        const overlapsX = Math.max(updatedX, itemX) < Math.min(updatedX + updatedW, itemX + itemW);
        
        // 检查垂直方向是否重叠
        const overlapsY = Math.max(updatedY, itemY) < Math.min(updatedY + updatedH, itemY + itemH);
        
        if (overlapsX && overlapsY) {
            collidingItems.push({ item, index });
        }
    });
    
    // 如果有碰撞，按 Y 坐标排序，从上到下处理，确保移动顺序正确
    if (collidingItems.length > 0) {
        collidingItems.sort((a, b) => (a.item.y || 0) - (b.item.y || 0));
        
        // 计算每个碰撞卡片的新 Y 位置
        // 策略：将碰撞的卡片向下移动到更新后卡片的底部，如果还有碰撞则继续向下移动
        collidingItems.forEach(({ item, index }) => {
            let newY = updatedY + updatedH;
            
            // 检查新位置是否还会与其他卡片碰撞，如果有则继续向下移动
            let hasCollision = true;
            let maxIterations = 100; // 防止无限循环
            while (hasCollision && maxIterations > 0) {
                maxIterations--;
                hasCollision = false;
                
                // 检查新位置是否与其他卡片（包括已移动的卡片）碰撞
                for (let i = 0; i < updatedItems.length; i++) {
                    if (i === index || updatedItems[i].id === updatedItem.id) continue;
                    
                    const otherItem = updatedItems[i];
                    const otherX = otherItem.x || 0;
                    const otherY = otherItem.y || 0;
                    const otherW = otherItem.w || 1;
                    const otherH = otherItem.h || 1;
                    
                    const itemW = item.w || 1;
                    const itemH = item.h || 1;
                    const itemX = item.x || 0;
                    
                    // 检查水平方向是否重叠
                    const overlapsX = Math.max(itemX, otherX) < Math.min(itemX + itemW, otherX + otherW);
                    // 检查垂直方向是否重叠
                    const overlapsY = Math.max(newY, otherY) < Math.min(newY + itemH, otherY + otherH);
                    
                    if (overlapsX && overlapsY) {
                        // 有碰撞，移动到该卡片下方
                        newY = otherY + otherH;
                        hasCollision = true;
                        break;
                    }
                }
            }
            
            // 更新卡片位置
            updatedItems[index] = {
                ...item,
                y: newY
            };
        });
    }
    
    return updatedItems;
};

export const useBentoGrid = () => {
    const [items, setItems] = useState<BentoItemProps[]>([]);
    const itemsRef = useRef(items); // 新增 ref 来持有最新的 items 状态

    // 每次 items 更新时，都同步更新 ref
    useEffect(() => {
        itemsRef.current = items;
    }, [items]);

    const [isLoading, setIsLoading] = useState(true);
    const [currentLayoutMode, setCurrentLayoutMode] = useState<'lg' | 'sm'>('lg');
    // 使用 useRef 来追踪正在处理的URLs，避免依赖变化导致函数重新创建
    const pendingUrlsRef = useRef<Set<string>>(new Set());

    // 队列相关状态
    const [isProcessingQueue, setIsProcessingQueue] = useState(false);
    const queueRef = useRef<QueueItem[]>([]);
    const isProcessingRef = useRef(false);

    // 新增：防重复执行机制
    const executingOperationsRef = useRef<Set<string>>(new Set());

    // Create adapter instance based on current mode:
    // - Published mode (GitHub Pages): StaticConfigAdapter (read-only, loads from profile-config.json)
    // - Edit mode (local dev): LocalStorageAdapter (read-write, uses localStorage)
    const adapterRef = useRef<ProfileDataAdapter>(new LocalStorageAdapter());
    const [isReadOnly, setIsReadOnly] = useState(false);

    useEffect(() => {
        const loadInitialBoxes = async () => {
            setIsLoading(true);
            try {
                // Detect mode and choose the appropriate adapter:
                // 1. Published mode (read-only) → StaticConfigAdapter
                // 2. Edit mode on published site → LocalStorageAdapter, seeded from profile-config.json
                // 3. Normal edit mode (local dev) → LocalStorageAdapter (default)
                if (isPublishedMode()) {
                    // Pure published mode: read-only, data from profile-config.json
                    const staticAdapter = new StaticConfigAdapter();
                    await staticAdapter.loadConfig();
                    adapterRef.current = staticAdapter;
                    setIsReadOnly(true);
                } else if (isEditModeOnPublishedSite()) {
                    // Edit mode on published site: seed localStorage from profile-config.json if empty
                    const lsAdapter = new LocalStorageAdapter();
                    await seedLocalStorageFromStaticConfig(lsAdapter);
                    adapterRef.current = lsAdapter;
                    setIsReadOnly(false);
                }
                // else: default LocalStorageAdapter already set in adapterRef

                const boxes = await adapterRef.current.getBentoItems();
                void 0;

                // 🔧 修改：不在初始加载时自动保存布局到数据库
                // 只在内存中创建默认布局，避免小屏幕加载时影响大屏幕布局
                const boxesWithLayout = boxes.map((box) => {
                    if (!box.layout && !box.position?.responsive) {
                        console.debug(`Box ${box.id} missing responsive layout data, create default layout (in-memory only)`);

                        // 创建默认的双布局数据（只在内存中，不保存到数据库）
                        const defaultResponsive = {
                            lg: { x: box.position?.x || 0, y: box.position?.y || 0 },
                            sm: { x: box.position?.x || 0, y: box.position?.y || 0 }
                        };

                        // 只在内存中添加，不保存到数据库
                        const updatedPosition = {
                            ...box.position,
                            responsive: defaultResponsive
                        };

                        return { ...box, position: updatedPosition };
                    }
                    return box;
                });

                const initialLayoutMode = getCurrentLayoutMode();
                const bentoItems = boxesWithLayout.map(item => mapBentoItemToProps(item, initialLayoutMode));
                setItems(bentoItems);
                setCurrentLayoutMode(initialLayoutMode);
                console.debug('useBentoGrid: init done, items count:', bentoItems.length, 'layout mode:', initialLayoutMode);
            } catch (error) {
                console.error('useBentoGrid: get boxes failed:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadInitialBoxes();
    }, []);

    // 队列处理函数
    const processQueue = useCallback(async () => {
        if (isProcessingRef.current || queueRef.current.length === 0) {
            return;
        }

        void 0;
        isProcessingRef.current = true;
        setIsProcessingQueue(true);

        const queueItem = queueRef.current.shift(); // 每次只处理一个
        if (!queueItem) {
            isProcessingRef.current = false;
            setIsProcessingQueue(false);
            return;
        }

        void 0;

        try {
            // 1. 添加临时卡片到UI，并获取其完整数据用于保存
            let bestPositionResult: { position: { x: number; y: number }, shiftedItems: BentoItemProps[] } | null = null;
            const itemToSave = await new Promise<BentoItemProps>(resolve => {
                setItems(currentItems => {
                    const bestPosition = queueItem.preferredPosition
                        ? { position: queueItem.preferredPosition, shiftedItems: [] }
                        : findBestPosition(currentItems, queueItem.data.w, queueItem.data.h);
                    
                    // 保存 bestPosition 结果供后续使用
                    bestPositionResult = bestPosition;
                    
                    const fullItem: BentoItemProps = {
                        ...queueItem.data,
                        id: queueItem.id,
                        x: bestPosition.position.x,
                        y: bestPosition.position.y,
                    };
                    void 0;
                    
                    // 处理需要被向下推移的卡片
                    let updatedItems = [...currentItems];
                    if (bestPosition.shiftedItems.length > 0) {
                        void 0;
                        bestPosition.shiftedItems.forEach(shiftedItem => {
                            const index = updatedItems.findIndex(item => item.id === shiftedItem.id);
                            if (index !== -1) {
                                updatedItems[index] = {
                                    ...updatedItems[index],
                                    y: shiftedItem.y,
                                };
                            }
                        });
                    }
                    
                    resolve(fullItem);
                    return [...updatedItems, fullItem];
                });
            });

            // 2. 将卡片保存到数据库（使用adapter）
            void 0;
            // 转换数据格式：BentoItemProps -> AdapterBentoItem
            const adapterItem: Omit<AdapterBentoItem, 'id'> = {
                type: itemToSave.type,
                content: itemToSave.metadata || {},
                position: { x: itemToSave.x || 0, y: itemToSave.y || 0 },
                size: { w: itemToSave.w || 1, h: itemToSave.h || 1 },
                imageTransform: {
                    scale: itemToSave.image_scale,
                    positionX: itemToSave.image_position_x,
                    positionY: itemToSave.image_position_y
                },
                ...(itemToSave.eventTagIds && { eventTagIds: itemToSave.eventTagIds })
            };
            // 添加其他 metadata 字段
            if (itemToSave.type === 'link') {
                // url is critical for link cards — must be saved in content for persistence
                if (itemToSave.url) adapterItem.content.url = itemToSave.url;
                if (itemToSave.savedTitle) adapterItem.content.savedTitle = itemToSave.savedTitle;
                if (itemToSave.savedImage) adapterItem.content.savedImage = itemToSave.savedImage;
                if (itemToSave.cardSize) adapterItem.content.cardSize = itemToSave.cardSize;
            }
            if (itemToSave.type === 'text' && itemToSave.text) {
                adapterItem.content.text = itemToSave.text;
            }
            if (itemToSave.type === 'image' && itemToSave.imageUrl) {
                adapterItem.content.imageUrl = itemToSave.imageUrl;
            }
            if (itemToSave.type === 'github') {
                if (itemToSave.owner) adapterItem.content.owner = itemToSave.owner;
                if (itemToSave.repo) adapterItem.content.repo = itemToSave.repo;
                if (itemToSave.platform) adapterItem.content.platform = itemToSave.platform;
                if (itemToSave.savedDescription) adapterItem.content.savedDescription = itemToSave.savedDescription;
                if (itemToSave.language) adapterItem.content.language = itemToSave.language;
                if (itemToSave.languageColor) adapterItem.content.languageColor = itemToSave.languageColor;
                if (itemToSave.stars !== undefined) adapterItem.content.stars = itemToSave.stars;
                if (itemToSave.topics) adapterItem.content.topics = itemToSave.topics;
                if (itemToSave.category) adapterItem.content.category = itemToSave.category;
                if (itemToSave.downloads !== undefined) adapterItem.content.downloads = itemToSave.downloads;
                if (itemToSave.likes !== undefined) adapterItem.content.likes = itemToSave.likes;
            }
            if (itemToSave.type === 'people') {
                if (itemToSave.userId) adapterItem.content.userId = itemToSave.userId;
                if (itemToSave.username) adapterItem.content.username = itemToSave.username;
                if (itemToSave.avatar) adapterItem.content.avatar = itemToSave.avatar;
                if (itemToSave.bio) adapterItem.content.bio = itemToSave.bio;
            }
            if (itemToSave.type === 'section_title') {
                // 始终保存 text（包括空字符串），允许用户清空后再编辑
                adapterItem.content.text = itemToSave.text ?? '';
            }
            if (itemToSave.type === 'need') {
                if (itemToSave.title) adapterItem.content.title = itemToSave.title;
                if (itemToSave.content) adapterItem.content.content = itemToSave.content;
                if (itemToSave.showPin !== undefined) adapterItem.content.showPin = itemToSave.showPin;
                if (itemToSave.isVertical !== undefined) adapterItem.content.isVertical = itemToSave.isVertical;
                if (itemToSave.size) adapterItem.content.size = itemToSave.size;
            }
            const savedBox = await adapterRef.current.addBentoItem(adapterItem);
            void 0;

            // 2.5. 如果有被推移的卡片，更新它们的位置到数据库
            if (bestPositionResult && bestPositionResult.shiftedItems.length > 0) {
                void 0;
                await Promise.all(
                    bestPositionResult.shiftedItems.map(async (shiftedItem) => {
                        try {
                            const position = getPosition(shiftedItem, currentLayoutMode);
                            await adapterRef.current.updateBentoItem(shiftedItem.id, {
                                position: {
                                    x: position.x,
                                    y: shiftedItem.y,
                                    responsive: {
                                        lg: currentLayoutMode === 'lg' 
                                            ? { x: position.x, y: shiftedItem.y }
                                            : (shiftedItem.position?.responsive?.lg || { x: position.x, y: shiftedItem.y }),
                                        sm: currentLayoutMode === 'sm'
                                            ? { x: position.x, y: shiftedItem.y }
                                            : (shiftedItem.position?.responsive?.sm || { x: position.x, y: shiftedItem.y }),
                                    }
                                }
                            });
                            void 0;
                        } catch (error) {
                            console.error(`  ❌ 更新卡片 ${shiftedItem.id} 位置失败:`, error);
                        }
                    })
                );
                void 0;
            }

            // 3. 直接使用完整数据的itemToSave，跳过复杂转换
            // itemToSave已经包含了所有需要的字段（位置、尺寸、内容等）
            // 注意：使用 savedBox.id 替换临时 ID，确保后续更新操作能正确找到卡片
            setItems(currentItems => {
                const filteredItems = currentItems.filter(i => i.id !== queueItem.id);
                return [...filteredItems, { ...itemToSave, id: savedBox.id }];
            });

            // 7. 操作成功，清理并解析Promise
            executingOperationsRef.current.delete(queueItem.operationId);
            void 0;
            queueItem.resolve(savedBox.id); // 传入最终的卡片ID

        } catch (error) {
            console.error(`  ❌ 处理队列项 ${queueItem.id} 时出错:`, error);

            // 8. 操作失败，从UI移除临时卡片并清理
            setItems(currentItems => currentItems.filter(i => i.id !== queueItem.id));
            executingOperationsRef.current.delete(queueItem.operationId);
            void 0;
            queueItem.reject(error);
        } finally {
            // 9. 处理队列中的下一个项目
            isProcessingRef.current = false;
            setIsProcessingQueue(false);
            if (queueRef.current.length > 0) {
                // 使用setTimeout确保UI有机会更新，并避免堆栈溢出
                setTimeout(() => processQueue(), 0);
            }
            void 0;
        }
    }, [currentLayoutMode]);

    // 启动队列处理（当队列有新项目时）
    useEffect(() => {
        if (queueRef.current.length > 0 && !isProcessingRef.current) {
            processQueue();
        }
    }, [processQueue]);

    // 新的 addItem 函数，使用队列机制 + 防重复执行，返回最终卡片ID
    const addItem = useCallback(async (item: Omit<BentoItemProps, 'id' | 'x' | 'y' | 'w' | 'h'> & { w: number; h: number }, preferredPosition?: { x: number; y: number }): Promise<string> => {
        const tempId = generateId();
        const operationId = generateOperationId(item);
        const functionInstanceId = generateId();

        void 0;

        // 检查是否已在执行中，防止React Strict Mode双重调用
        if (executingOperationsRef.current.has(operationId)) {
            void 0;
            void 0;
            return Promise.resolve(tempId); // 返回临时ID
        }

        // 检查队列中是否已有相同操作
        const existingInQueue = queueRef.current.find(q => q.operationId === operationId);
        if (existingInQueue) {
            void 0;
            return Promise.resolve(existingInQueue.id); // 返回现有的临时ID
        }

        // 标记操作开始执行
        executingOperationsRef.current.add(operationId);
        void 0;

        return new Promise<string>((resolve, reject) => {
            const queueItem: QueueItem = {
                id: tempId,
                operationId,
                data: item,
                preferredPosition,
                resolve: (finalId?: string) => {
                    void 0;
                    resolve(finalId || tempId); // 返回最终ID或临时ID
                },
                reject: (error) => {
                    void 0;
                    reject(error);
                }
            };

            queueRef.current.push(queueItem);
            void 0;

            // 触发队列处理
            if (!isProcessingRef.current) {
                processQueue();
            }
        });
    }, [processQueue]);

    const handleLayoutChange = useCallback((newLayout: any[], forceLayoutMode?: 'lg' | 'sm') => {
        console.debug('handleLayoutChange called:', {
            newLayoutLength: newLayout.length,
            forceLayoutMode,
            currentLayoutMode,
            newLayout: newLayout.map(item => ({
                id: item.i,
                pos: `(${item.x}, ${item.y})`,
                size: `${item.w}x${item.h}`
            }))
        });

        const layoutMode = forceLayoutMode || currentLayoutMode;

        setItems(prevItems => {
            // 收集所有需要持久化的位置/尺寸变更，避免并发写入竞态条件
            const batchUpdates: Array<{ id: string; x: number; y: number; w: number; h: number }> = [];

            const updatedItems = prevItems.map(item => {
                const layoutItem = newLayout.find(l => l.i === item.id);
                if (!layoutItem) return item;
                
                // 检查位置或尺寸是否有变化
                const positionChanged = item.x !== layoutItem.x || item.y !== layoutItem.y;
                const sizeChanged = item.w !== layoutItem.w || item.h !== layoutItem.h;
                
                if (positionChanged || sizeChanged) {
                    console.debug(`item ${item.id} changed:`, {
                        oldPos: `(${item.x}, ${item.y})`,
                        newPos: `(${layoutItem.x}, ${layoutItem.y})`,
                        oldSize: `${item.w}x${item.h}`,
                        newSize: `${layoutItem.w}x${layoutItem.h}`,
                        layoutMode: layoutMode,
                        positionChanged,
                        sizeChanged
                    });

                    // 更新位置和尺寸
                    const updated = { 
                        ...item, 
                        x: layoutItem.x, 
                        y: layoutItem.y,
                        w: layoutItem.w,  // 保存用户调整后的尺寸
                        h: layoutItem.h
                    };

                    // 收集变更到批量更新数组（而非逐个调用 updateBentoItem）
                    if (item.id && item.id.length > 10) { // Assume short IDs are temporary
                        batchUpdates.push({
                            id: item.id,
                            x: layoutItem.x,
                            y: layoutItem.y,
                            w: layoutItem.w,
                            h: layoutItem.h,
                        });
                    }
                    return updated;
                }
                return item;
            });

            // 一次性批量写入所有位置/尺寸变更，避免并发 updateBentoItem 互相覆盖
            if (batchUpdates.length > 0) {
                console.debug(`batch saving ${batchUpdates.length} item(s) position/size changes`);
                (adapterRef.current as any).batchUpdatePositions(batchUpdates)
                    .catch((e: Error) => console.error('Failed to batch update positions:', e));
            }

            // Avoid unnecessary re-renders by returning the same reference if nothing changed
            return JSON.stringify(prevItems) === JSON.stringify(updatedItems) ? prevItems : updatedItems;
        });
    }, [currentLayoutMode]);

    // 处理布局模式切换
    const handleLayoutModeChange = useCallback(async (newLayoutMode: 'lg' | 'sm') => {
        void 0;

        if (newLayoutMode === currentLayoutMode) {
            void 0;
            return;
        }

        console.debug(`layout mode switch: ${currentLayoutMode} -> ${newLayoutMode}`);
        setCurrentLayoutMode(newLayoutMode);

        // 重新获取数据库中的最新数据，并应用新的布局模式
        try {
            console.debug(`get user boxes...`);
            const boxes = await adapterRef.current.getBentoItems();
            console.debug(`get ${boxes.length} boxes`);

            const itemsWithCorrectLayout = boxes.map((item, index) => {
                const mappedItem = mapBentoItemToProps(item, newLayoutMode);
                console.debug(`box ${index}: ${item.id} -> (${mappedItem.x}, ${mappedItem.y})`);
                return mappedItem;
            });

            console.debug(`apply ${newLayoutMode} layout, items count:`, itemsWithCorrectLayout.length);
            setItems(itemsWithCorrectLayout);
        } catch (error) {
            console.error("Failed to reload boxes for layout mode change:", error);
            setItems(prevItems => {
                console.debug(`⚠️ 使用降级方案，当前items数量: ${prevItems.length}`);
                return prevItems.map(item => {
                    if (!item.id || item.id.length <= 10) {
                        console.debug(`keep temporary card position: ${item.id}`);
                        return item;
                    }

                    console.debug(`keep persistent card position: ${item.id}`);
                    return item;
                });
            });
        }
    }, [currentLayoutMode]);

    // 智能计算最佳位置的函数 - 支持不同列数
    const findBestPositionForLayout = useCallback((
        existingItems: BentoItemProps[],
        cardWidth: number,
        cardHeight: number,
        cols: number
    ): { x: number; y: number } => {
        console.debug('findBestPositionForLayout:', { cardWidth, cardHeight, cols, existingCount: existingItems.length });

        if (existingItems.length === 0) {
            return { x: 0, y: 0 };
        }

        // 创建占用网格
        const maxY = existingItems.reduce((max, item) => Math.max(max, (item.y || 0) + (item.h || 1)), 0);
        const occupiedGrid: boolean[][] = [];

        for (let y = 0; y <= maxY + cardHeight; y++) {
            occupiedGrid[y] = new Array(cols).fill(false);
        }

        // 标记已占用位置
        existingItems.forEach(item => {
            const itemX = item.x || 0;
            const itemY = item.y || 0;
            const itemW = item.w || 1;
            const itemH = item.h || 1;

            for (let y = itemY; y < itemY + itemH; y++) {
                for (let x = itemX; x < itemX + itemW; x++) {
                    if (y < occupiedGrid.length && x < cols) {
                        occupiedGrid[y][x] = true;
                    }
                }
            }
        });

        // 寻找最佳位置
        for (let y = 0; y <= maxY; y++) {
            for (let x = 0; x <= cols - cardWidth; x++) {
                let canPlace = true;
                for (let dy = 0; dy < cardHeight && canPlace; dy++) {
                    for (let dx = 0; dx < cardWidth && canPlace; dx++) {
                        if (y + dy >= occupiedGrid.length || occupiedGrid[y + dy][x + dx]) {
                            canPlace = false;
                        }
                    }
                }

                if (canPlace) {
                    console.debug(`findBestPositionForLayout - found best position for ${cols} columns: (${x}, ${y})`);
                    return { x, y };
                }
            }
        }

        // 放在最底部
        console.debug(`findBestPositionForLayout - no suitable position, put at bottom of ${cols} columns: (0, ${maxY})`);
        return { x: 0, y: maxY };
    }, []);

    // 为新组件创建双布局数据
    const createDualLayoutForNewItem = useCallback((
        itemData: Omit<BentoItemProps, 'id' | 'x' | 'y' | 'w' | 'h'> & { w: number; h: number },
        existingItems: BentoItemProps[]
    ) => {
        console.debug('createDualLayoutForNewItem - create dual layout for new item:', itemData.type);

        // 计算四列布局的最佳位置
        const lgPosition = findBestPositionForLayout(existingItems, itemData.w, itemData.h, 4);

        // 计算二列布局的最佳位置
        const smPosition = findBestPositionForLayout(existingItems, itemData.w, itemData.h, 2);

        // 创建响应式布局数据（只包含位置信息）
        const responsiveLayout = {
            lg: { x: lgPosition.x, y: lgPosition.y },
            sm: { x: smPosition.x, y: smPosition.y }
        };

        console.debug('createDualLayoutForNewItem - dual layout data:', responsiveLayout);

        // 根据当前模式返回对应的位置
        const currentPosition = currentLayoutMode === 'lg' ? lgPosition : smPosition;

        return {
            responsiveLayout,
            currentPosition
        };
    }, [findBestPositionForLayout, currentLayoutMode]);

    // 智能重新计算另一种布局模式的最佳位置
    const recalculateOtherLayoutMode = useCallback((
        changedItemId: string,
        newDimensions: { w: number; h: number },
        currentLayoutMode: 'lg' | 'sm',
        allItems: BentoItemProps[]
    ): ResponsiveLayout | null => {
        console.debug('recalculateOtherLayoutMode - recalculate another layout mode:', {
            itemId: changedItemId,
            newDimensions,
            currentMode: currentLayoutMode
        });

        const otherMode: 'lg' | 'sm' = currentLayoutMode === 'lg' ? 'sm' : 'lg';
        const otherCols = otherMode === 'lg' ? 4 : 2;
        const otherItems = allItems.filter(item => item.id !== changedItemId);
        const newPosition = findBestPositionForLayout(otherItems, newDimensions.w, newDimensions.h, otherCols);

        console.debug(`recalculateOtherLayoutMode - new position in ${otherMode} mode:`, newPosition);

        return {
            [otherMode]: {
                x: newPosition.x,
                y: newPosition.y
            }
        } as ResponsiveLayout;
    }, [findBestPositionForLayout]);

    const handleItemUpdate = useCallback(async (id: string, updates: Partial<BentoItemProps>) => {
        
        // 特别追踪 eventTagIds 的更新
        if ('eventTagIds' in updates) {
            const currentItem = itemsRef.current.find(item => item.id === id);
            void 0;
            void 0;
        }
        
        // 如果传递了 cardSize，将其转换为 w 和 h
        if ('cardSize' in updates && updates.cardSize) {
            const cardSizeToDimensions = (size: 'small' | 'horizontal' | 'vertical' | 'large' | 'square'): { w: number; h: number } => {
                switch (size) {
                    case 'small':
                        return { w: 1, h: 2 };
                    case 'horizontal':
                        return { w: 2, h: 2 };
                    case 'vertical':
                        return { w: 1, h: 4 };
                    case 'large':
                        return { w: 2, h: 4 };
                    case 'square':
                        return { w: 2, h: 4 }; // square 映射到 large
                    default:
                        return { w: 1, h: 2 };
                }
            };
            const dimensions = cardSizeToDimensions(updates.cardSize as 'small' | 'horizontal' | 'vertical' | 'large' | 'square');
            updates.w = dimensions.w;
            updates.h = dimensions.h;
            // 移除 cardSize，因为我们已经转换为 w 和 h
            delete (updates as any).cardSize;
        }
        
        // 检测尺寸变化，如果有碰撞需要先解决
        const hasSizeChange = (updates.w !== undefined || updates.h !== undefined);
        const itemToUpdate = itemsRef.current.find(item => item.id === id);
        let resolvedItems: BentoItemProps[] | null = null;
        
        if (hasSizeChange && itemToUpdate) {
            // 创建更新后的项目
            const updatedItem: BentoItemProps = {
                ...itemToUpdate,
                ...updates,
                w: updates.w ?? itemToUpdate.w ?? 1,
                h: updates.h ?? itemToUpdate.h ?? 1,
            };
            
            // 获取当前列数
            const cols = currentLayoutMode === 'lg' ? 4 : 2;
            
            // 检测并解决碰撞 — use itemsRef.current for latest state
            resolvedItems = detectAndResolveCollisions(updatedItem, itemsRef.current, cols);
            
            // 更新状态，包括所有受影响的项目
            setItems(resolvedItems);
            
            // 如果有碰撞，需要批量更新受影响的项目位置
            const affectedItems = resolvedItems.filter((item) => {
                const original = itemsRef.current.find(i => i.id === item.id);
                return original && (item.y !== original.y || item.x !== original.x);
            });
            
            if (affectedItems.length > 0) {
                void 0;
                
                // 批量更新受影响项目的位置到数据库
                Promise.all(affectedItems.map(async (item) => {
                    try {
                        const position = {
                            x: item.x || 0,
                            y: item.y || 0,
                            i: item.id,
                            responsive: {
                                [currentLayoutMode]: {
                                    x: item.x || 0,
                                    y: item.y || 0
                                }
                            }
                        };
                        await adapterRef.current.updateBentoItem(item.id, { position });
                    } catch (error) {
                        console.error(`Failed to update position for item ${item.id}:`, error);
                    }
                })).catch(error => {
                    console.error('Error updating affected items:', error);
                });
            }
        } else {
            // 没有尺寸变化，正常更新
            setItems(prev => {
                const updated = prev.map(item => {
                    if (item.id === id) {
                        const newItem = { ...item, ...updates };
                        if ('eventTagIds' in updates) {
                            void 0;
                        }
                        return newItem;
                    }
                    return item;
                });
                return updated;
            });
        }

        if (!id || id.length < 10) {
            console.warn(`Update for temporary item ${id} is only local. It will be persisted on save.`);
            return;
        }
        
        void 0;

        let updateData: Partial<BoxUpdateInput> = {};

        // 如果已经有 itemToUpdate（在尺寸变化检测中获取），则使用它；否则重新查找
        // IMPORTANT: Use itemsRef.current instead of `items` to avoid stale closure issues.
        // When handleItemUpdate is called asynchronously (e.g., after fetching GitHub repo data),
        // the `items` closure variable may be outdated and not contain the newly added card.
        const itemToUpdateForDb = itemToUpdate || itemsRef.current.find(item => item.id === id);
        if (!itemToUpdateForDb) {
            console.warn("⚠️ Item not found for local update (this is expected during async operations):", id);
            void 0;
            return;
        }

        // Prepare backend data, merging with existing metadata
        const metadataFields = [
            'text',
            'savedTitle',
            'savedImage',
            'imageUrl',
            'size',
            'isVertical',
            'showPin',
            'title',
            'content',
            'description',
            // GitHub/HuggingFace 仓库相关字段
            'savedDescription',
            'language',
            'languageColor',
            'stars',
            'topics',
            'category',
            'downloads',
            'likes',
        ];
        const metadataUpdates = Object.keys(updates)
            .filter(key => metadataFields.includes(key))
            .reduce((obj, key) => ({ ...obj, [key]: (updates as any)[key] }), {});

        if (Object.keys(metadataUpdates).length > 0) {
            const currentMetadata = (({ id, type, x, y, w, h, ...rest }) => rest)(itemToUpdateForDb);
            updateData.metadata = { ...currentMetadata, ...metadataUpdates };
            void 0;
        }
        if (updates.url) updateData.url = updates.url;
        if (updates.w || updates.h) {
            updateData.width = updates.w;
            updateData.height = updates.h;

            // 如果进行了碰撞检测，使用 resolvedItems；否则使用 itemsRef.current
            // 注意：由于 setItems 是异步的，我们需要使用之前保存的 resolvedItems
            const latestItems = resolvedItems || itemsRef.current;
            const latestItem = latestItems.find(item => item.id === id) || itemToUpdateForDb;
            const currentResponsiveLayout: ResponsiveLayout = {
                [currentLayoutMode]: {
                    x: latestItem.x || 0,
                    y: latestItem.y || 0
                }
            };

            // 重新计算另一个布局模式的最佳位置
            const otherLayoutMode: 'lg' | 'sm' = currentLayoutMode === 'lg' ? 'sm' : 'lg';
            const otherCols = otherLayoutMode === 'lg' ? 4 : 2;
            const otherItems = latestItems.filter(item => item.id !== id);
            const newPosition = findBestPositionForLayout(otherItems, updates.w || itemToUpdateForDb.w || 1, updates.h || itemToUpdateForDb.h || 1, otherCols);

            // 合并两个布局模式的位置信息到position.responsive
            const fullResponsiveLayout = {
                ...currentResponsiveLayout,
                [otherLayoutMode]: {
                    x: newPosition.x,
                    y: newPosition.y
                }
            };

            // 更新position字段，添加responsive信息
            // 注意：这里我们需要构造一个完整的position对象
            const currentPosition = {
                x: latestItem.x || 0,
                y: latestItem.y || 0,
                i: latestItem.id,
                responsive: fullResponsiveLayout
            };
            updateData.position = currentPosition;

            console.debug(`handleItemUpdate - size changed: ${latestItem.id}`, {
                oldSize: `${itemToUpdateForDb.w}x${itemToUpdateForDb.h}`,
                newSize: `${updates.w}x${updates.h}`,
                layoutMode: currentLayoutMode,
                fullResponsiveLayout: fullResponsiveLayout
            });
        }

        console.debug(`handleItemUpdate - send update data:`, JSON.stringify(updateData));

        try {
            void 0;
            const result = await adapterRef.current.updateBentoItem(id, updateData);
            void 0;
        } catch (error) {
            console.error(`❌ Failed to update item ${id}:`, error);
            // Optionally revert frontend state on failure
            // For now, we keep the optimistic update.
        }
    }, [items, currentLayoutMode, findBestPositionForLayout]);

    const handleDeleteItem = useCallback(async (id: string) => {
        setItems(prev => prev.filter(item => item.id !== id));
        try {
            await adapterRef.current.deleteBentoItem(id);
        } catch (error) {
            console.error(`Failed to delete item ${id}:`, error);
            // Optionally revert frontend state on failure
        }
    }, []);

    const handleAddLink = useCallback(async (url: string) => {
        // 检查是否已存在相同URL的LinkCard - 使用函数式更新来获取最新状态
        let shouldSkip = false;
        setItems(prevItems => {
            const existingLink = prevItems.some(item => item.type === 'link' && item.url === url);
            if (existingLink) {
                void 0;
                shouldSkip = true;
                return prevItems; // 不修改状态
            }
            return prevItems; // 不修改状态
        });

        if (shouldSkip) {
            return;
        }

        // 如果URL不存在，调用addItem创建新的LinkCard
        const cardId = await addItem({ type: 'link', url, w: 2, h: 2, cardSize: 'horizontal' });
        
        // 等待一小段时间，确保卡片已保存到数据库
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 异步获取页面标题和图片
        (async () => {
            try {
                // 获取标题
                const titleResponse = await fetch(`/api/fetch-page-title?url=${encodeURIComponent(url)}`);
                if (titleResponse.ok) {
                    const titleData = await titleResponse.json();
                    if (titleData.title) {
                        // 更新卡片的标题
                        await handleItemUpdate(cardId, { savedTitle: titleData.title });
                    }
                }
                
                // 获取图片
                const imageResponse = await fetch(`/api/fetch-page-image?url=${encodeURIComponent(url)}`);
                if (imageResponse.ok) {
                    const imageData = await imageResponse.json();
                    if (imageData.image) {
                        // 更新卡片的图片
                        await handleItemUpdate(cardId, { savedImage: imageData.image });
                    }
                }
            } catch (error) {
                console.error('Error fetching page metadata:', error);
                // 失败时使用域名作为标题
                try {
                    const hostname = new URL(url).hostname;
                    await handleItemUpdate(cardId, { savedTitle: hostname });
                } catch (e) {
                    console.error('Error setting fallback title:', e);
                }
            }
        })();
    }, [addItem, handleItemUpdate]);

    const handleAddText = useCallback(() => {
        addItem({ type: 'text', text: '', w: 1, h: 2, cardSize: 'small' });
    }, [addItem]);

    const handleAddImage = useCallback(async (imageUrl: string): Promise<string> => {
        return await addItem({ type: 'image', imageUrl, w: 1, h: 2, cardSize: 'small' });
    }, [addItem]);

    const handleAddGithubRepo = useCallback(async (
        owner: string,
        repo: string,
        options?: { 
            platform?: 'github' | 'huggingface'; 
            category?: 'model' | 'dataset'; 
            downloads?: number; 
            likes?: number; 
            description?: string;
        }
    ) => {
        // 检查是否已存在
        let shouldSkip = false;
        setItems(prevItems => {
            if (prevItems.some(item => item.type === 'github' && item.owner === owner && item.repo === repo)) {
                shouldSkip = true;
                return prevItems; // 不修改状态
            }
            return prevItems; // 不修改状态
        });

        if (shouldSkip) {
            return;
        }

        try {
            if (options?.platform === 'huggingface') {
                // HuggingFace 仓库：使用传入的 options（已经在 edit-toolbar.tsx 中获取）
                const cardId = await addItem({
                    type: 'github',
                    owner,
                    repo,
                    platform: 'huggingface',
                    savedDescription: options.description || '',
                    category: options.category,
                    downloads: options.downloads,
                    likes: options.likes,
                    language: '',
                    languageColor: '#ededed',
                    stars: 0,
                    w: 2,
                    h: 2,
                });

                // 如果 options 中没有完整数据，尝试获取
                if (!options.description && !options.downloads && !options.likes) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                    (async () => {
                        try {
                            const { fetchHfModel, fetchHfDataset } = await import('@/lib/api/bentoService');
                            const id = `${owner}/${repo}`;
                            const data = options.category === 'dataset'
                                ? await fetchHfDataset(id)
                                : await fetchHfModel(id);
                            if (data) {
                                await handleItemUpdate(cardId, {
                                    savedDescription: data.description || '',
                                    downloads: typeof data.downloads === 'number' ? data.downloads : undefined,
                                    likes: typeof data.likes === 'number' ? data.likes : undefined,
                                });
                            }
                        } catch (error) {
                            console.error('[HF] 获取失败:', error);
                        }
                    })();
                }
            } else {
                // GitHub 仓库：创建卡片后自动获取数据
                const cardId = await addItem({
                    type: 'github',
                    owner,
                    repo,
                    platform: 'github',
                    savedDescription: '',
                    language: '',
                    languageColor: '#ededed',
                    stars: 0,
                    topics: [],
                    w: 2,
                    h: 2,
                });

                // 等待卡片保存到数据库
                await new Promise(resolve => setTimeout(resolve, 500));

                // 异步获取 GitHub 仓库数据
                (async () => {
                    try {
                        const { fetchGithubRepo } = await import('@/lib/api/bentoService');
                        const repoData = await fetchGithubRepo(owner, repo);
                        if (repoData) {
                            const updateData = {
                                savedDescription: repoData.description || '',
                                language: repoData.language || '',
                                languageColor: repoData.languageColor || '#ededed',
                                stars: repoData.stars || 0,
                                topics: repoData.topics || [],
                            };
                            await handleItemUpdate(cardId, updateData);
                        }
                    } catch (error) {
                        console.error('handleAddGithubRepo: 获取 GitHub 数据失败:', error);
                        // 失败时不显示错误，保持默认值
                    }
                })();
            }
        } catch (error) {
            console.error('Failed to add GitHub repo:', error);
            alert('Failed to add GitHub repo, please try again.');
        }
    }, [addItem, handleItemUpdate]);

    const handleAddPeople = useCallback((person: User) => {
        addItem({
            type: 'people',
            userId: person.id,
            username: person.username,
            avatar: person.avatar,
            bio: person.bio,
            w: 2,
            h: 2
        });
    }, [addItem]);

    const clearNewItemFlag = useCallback((itemId: string) => {
        setItems(currentItems => {
            void 0;
            const newItems = currentItems.map(item =>
                item.id === itemId && item.isNew ? { ...item, isNew: false } : item
            );
            // Check if the flag was actually cleared to prevent unnecessary re-renders
            if (JSON.stringify(newItems) !== JSON.stringify(currentItems)) {
                void 0;
            }
            return newItems;
        });
    }, []);

    const handleAddSectionTitle = useCallback(() => {
        // 创建时使用空字符串，让组件显示 placeholder "Add a title..."
        addItem({ type: 'section_title', text: '', w: 4, h: 1 });
    }, [addItem]);

    const handleAddNeed = useCallback((title?: string, content?: string) => {
        const hasExistingNeed = items.some(item => item.type === 'need');
        if (hasExistingNeed) {
            return;
        }

        const normalizedSize = resolveNeedBoardSize('horizontal');
        const { w, h } = getNeedBoardGridSize(normalizedSize);
        addItem({ 
            type: 'need', 
            title: title || 'Need Board',
            content: content || '',
            size: normalizedSize,
            w,
            h
        });
    }, [addItem, items]);

    const addItemAtPosition = useCallback(async (
        item: Omit<BentoItemProps, 'id' | 'x' | 'y' | 'w' | 'h'> & { w: number; h: number },
        x: number,
        y: number
    ): Promise<string> => {
        return addItem(item, { x, y });
    }, [addItem]);

    return {
        items,
        isLoading,
        isReadOnly, // true when in published mode (StaticConfigAdapter)
        currentLayoutMode,
        isProcessingQueue, // 队列处理状态
        queueLength: queueRef.current.length, // 当前队列长度
        executingOperations: Array.from(executingOperationsRef.current), // 正在执行的操作列表（用于调试）
        pendingUrls: Array.from(pendingUrlsRef.current), // 转换为数组便于调试
        handleLayoutChange,
        handleLayoutModeChange,
        handleItemUpdate,
        handleDeleteItem,
        handleAddLink,
        handleAddText,
        handleAddImage,
        handleAddGithubRepo,
        addItemAtPosition,
        handleAddPeople,
        handleAddSectionTitle,
        handleAddNeed,
        clearNewItemFlag,
    };
}; 
