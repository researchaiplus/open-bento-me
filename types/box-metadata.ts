import { z } from "zod";
// import { BoxType } from "@prisma/client"; // 不再直接导入 BoxType 枚举

// 定义字符串字面量代替 BoxType 枚举
// Note: PAPER and PROJECT types have been removed
const BoxTypeValues = {
  GITHUB: 'GITHUB',
  IMAGE: 'IMAGE',
  PEOPLE: 'PEOPLE',
  TEXT: 'TEXT',
  LINK: 'LINK',
  SECTION_TITLE: 'SECTION_TITLE',
  NEED: 'NEED'
} as const;

// 创建字符串字面量联合类型
export type BoxTypeString = typeof BoxTypeValues[keyof typeof BoxTypeValues];

// Base schema for position (adjust based on react-grid-layout or similar)
export const PositionSchema = z.object({
  x: z.number(),
  y: z.number(),
  i: z.string(), // Unique identifier for the grid item
  static: z.boolean().optional(),
  responsive: z.object({
    lg: z.object({
      x: z.number(),
      y: z.number()
    }).optional(),
    sm: z.object({
      x: z.number(),
      y: z.number()
    }).optional()
  }).optional()
});

// 新增类型别名，用于响应式位置
export type TResponsivePosition = z.infer<typeof PositionSchema>['responsive'];

// Schemas for metadata based on BoxType
const GithubMetadataSchema = z.object({
  owner: z.string(),
  repo: z.string(),
  savedDescription: z.string().nullable().optional(),
  language: z.string().nullable().optional(),
  languageColor: z.string().nullable().optional(),
  stars: z.number().optional(),
  topics: z.array(z.string()).nullable().optional(),
  // Extended fields to support Hugging Face repositories stored under GITHUB type
  platform: z.enum(["github", "huggingface"]).optional(),
  category: z.string().optional(),
  downloads: z.number().optional(),
  likes: z.number().optional(),
});

const ImageMetadataSchema = z.object({
  imageUrl: z.string().url(),
  cropShape: z.enum(["square", "circle"]).optional(),
});

const PeopleMetadataSchema = z.object({
  userId: z.string(), // 真实用户ID，用于从数据库获取用户信息
  username: z.string().nullable().optional(), // 用户名，用于生成URL
  // 注意：不再存储用户的详细信息（name, avatar, title, bio等）
  // 这些信息将通过userId从数据库实时获取
});

const TextMetadataSchema = z.object({
  text: z.string(),
});

const LinkMetadataSchema = z.object({
  savedTitle: z.string().nullable().optional(),
  savedImage: z.string().url().nullable().optional(),
  savedDescription: z.string().nullable().optional(),
});

const SectionTitleMetadataSchema = z.object({
  text: z.string(),
});

const NeedMetadataSchema = z.object({
  title: z.string(),
  content: z.string(),
  showPin: z.boolean().optional().default(true),
  isVertical: z.boolean().optional().default(false),
  size: z.enum(["small", "horizontal", "vertical", "large"]).optional().default("small"),
});

// Base Box Schema for creation (used in POST)
// We use discriminatedUnion to ensure metadata matches the type
export const CreateBoxSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal(BoxTypeValues.GITHUB),
    width: z.number().int().min(1),
    height: z.number().int().min(1),
    position: PositionSchema,
    metadata: GithubMetadataSchema.optional(), // Metadata might be fetched later
    url: z.string().url().optional().nullable(),
    className: z.string().optional().nullable(),
  }),
  z.object({
    type: z.literal(BoxTypeValues.IMAGE),
    width: z.number().int().min(1),
    height: z.number().int().min(1),
    position: PositionSchema,
    metadata: ImageMetadataSchema, // Required for Image type
    url: z.string().url().optional().nullable(),
    className: z.string().optional().nullable(),
  }),
  z.object({
    type: z.literal(BoxTypeValues.PEOPLE),
    width: z.number().int().min(1),
    height: z.number().int().min(1),
    position: PositionSchema,
    metadata: PeopleMetadataSchema, // Required for People type
    url: z.string().url().optional().nullable(),
    className: z.string().optional().nullable(),
  }),
  z.object({
    type: z.literal(BoxTypeValues.TEXT),
    width: z.number().int().min(1),
    height: z.number().int().min(1),
    position: PositionSchema,
    metadata: TextMetadataSchema, // Required for Text type
    url: z.string().url().optional().nullable(),
    className: z.string().optional().nullable(),
  }),
  z.object({
    type: z.literal(BoxTypeValues.LINK),
    width: z.number().int().min(1),
    height: z.number().int().min(1),
    position: PositionSchema,
    metadata: LinkMetadataSchema.optional(),
    url: z.string().url(), // URL is required for Link type
    className: z.string().optional().nullable(),
  }),
  z.object({
    type: z.literal(BoxTypeValues.SECTION_TITLE),
    width: z.number().int().min(1),
    height: z.number().int().min(1),
    position: PositionSchema,
    metadata: SectionTitleMetadataSchema, // Required for SectionTitle type
    url: z.string().url().optional().nullable(),
    className: z.string().optional().nullable(),
  }),
  z.object({
    type: z.literal(BoxTypeValues.NEED),
    width: z.number().int().min(1),
    height: z.number().int().min(1),
    position: PositionSchema,
    metadata: NeedMetadataSchema, // Required for Need type
    url: z.string().url().optional().nullable(),
    className: z.string().optional().nullable(),
  }),
]);

// Schema for updates (used in PUT) - make fields partial
// We don't use discriminatedUnion here as the type itself usually doesn't change,
// and we only update specific fields. Validation might need refinement
// depending on whether metadata structure must strictly follow the existing type on update.
// A simpler approach is to allow partial updates of top-level fields and metadata.
export const UpdateBoxSchema = z.object({
  width: z.number().int().min(1).optional(),
  height: z.number().int().min(1).optional(),
  position: PositionSchema.partial().optional(), // Allow partial updates to position
  metadata: z.record(z.unknown()).optional(), // Allow any object for metadata update (validate further in service)
  url: z.string().url().optional().nullable(),
  className: z.string().optional().nullable(),
  // Note: 'type' is typically not updatable via this route.
}).partial(); // Makes all fields optional

// Type definitions inferred from schemas
export type TPosition = z.infer<typeof PositionSchema>;
export type TCreateBoxInput = z.infer<typeof CreateBoxSchema>;
export type TUpdateBoxInput = z.infer<typeof UpdateBoxSchema>;

// Helper type to map BoxType to its corresponding metadata schema
// This isn't directly used in the base schemas above but can be useful elsewhere
// Note: PAPER and PROJECT types have been removed
export type MetadataSchemas = {
  "GITHUB": typeof GithubMetadataSchema;
  "IMAGE": typeof ImageMetadataSchema;
  "PEOPLE": typeof PeopleMetadataSchema;
  "TEXT": typeof TextMetadataSchema;
  "LINK": typeof LinkMetadataSchema;
  "SECTION_TITLE": typeof SectionTitleMetadataSchema;
  "NEED": typeof NeedMetadataSchema;
}; 