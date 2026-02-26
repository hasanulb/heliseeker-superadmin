import { z } from "zod";
import { LocalizedStringType } from "@/lib/types";
import { slugSchema } from "../content-types";

const blogStatusValues = ["draft", "published"] as const;

export const BlogStatusEnum = {
  DRAFT: "draft",
  PUBLISHED: "published",
} as const;

export type BlogStatusType = (typeof blogStatusValues)[number]; // 'draft' | 'published'

export interface BlogType {
  blog_id: string;
  hero_title: LocalizedStringType;
  title: LocalizedStringType;
  img_urls?: string[] | null;
  author?: string | null;
  content: LocalizedStringType; // This will now contain HTML strings
  tags?: string[] | null;
  published_at?: string | null;
  status: BlogStatusType;
  created_at: string;
  updated_at: string;
  slug: string | null;
}

// Helper function to check if HTML content is empty
const isHtmlEmpty = (html: string): boolean => {
  if (!html || html.trim() === "") return true;

  // Remove HTML tags and check if there's actual content
  const textContent = html.replace(/<[^>]*>/g, '').trim();
  if (textContent === "") return true;

  // Check for common empty rich text patterns
  const emptyPatterns = [
    /^<p><br><\/p>$/,
    /^<p><br\/><\/p>$/,
    /^<p>\s*<\/p>$/,
    /^<div><br><\/div>$/,
    /^<div><br\/><\/div>$/,
    /^<div>\s*<\/div>$/,
  ];

  return emptyPatterns.some(pattern => pattern.test(html.trim()));
};

// Custom schema for blog title/content
const blogLocalizedStringSchema = (label: string) =>
  z.object({
    en: z.string().optional(),
    ar: z.string().optional(),
  }).superRefine((obj, ctx) => {
    // This is only for the inner object, not the whole blog
    // We check at the blogSchema level for status
    // This is just to allow all to be optional here
    return true;
  });

export const blogSchema = z.object({
  hero_title: blogLocalizedStringSchema("Hero Title").optional().nullable(),
  title: blogLocalizedStringSchema("Title").optional().nullable(),
  img_urls: z.array(z.any()).optional(),
  slug: slugSchema,
  author: z.string().optional().nullable(),
  content: blogLocalizedStringSchema("Content"),
  tags: z.array(z.string()).optional().nullable(),
  published_at: z.string().optional().nullable().transform((val) => {
    if (!val) return null;
    if (val.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)) {
      return val + ":00.000Z";
    }
    if (val.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return val + "T00:00:00.000Z";
    }
    if (val.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/)) {
      return val.endsWith('Z') ? val : val + 'Z';
    }
    return val;
  }),
  status: z.enum(blogStatusValues).default(BlogStatusEnum.DRAFT),
}).superRefine((data, ctx) => {
  // For publish: English required
  if (data.status === BlogStatusEnum.PUBLISHED) {
    if (!data.hero_title || !data.hero_title.en || data.hero_title.en.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Hero Title (English) is required for publish",
        path: ["hero_title", "en"]
      });
    } else {
      const heroTitleEn = data.hero_title.en.trim();
      const wordCount = heroTitleEn.split(/\s+/).length;
      if (heroTitleEn.length > 45 || wordCount > 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Hero Title (English) must be at most 45 characters or 2 words",
          path: ["hero_title", "en"]
        });
      }
    }
    if (!data.title || !data.title.en || data.title.en.trim() === "") {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Title (English) is required for publish", path: ["title", "en"] });
    }
    if (!data.content || !data.content.en || isHtmlEmpty(data.content.en)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Content (English) is required for publish", path: ["content", "en"] });
    }
    if (!data.img_urls || data.img_urls.length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "At least one image required for publish", path: ["img_urls"] });
    }
  } else if (data.status === BlogStatusEnum.DRAFT) {
    const title = data.title || {};
    const hero_title = data.hero_title || {};
    const content = data.content || {};
    type BlogLang = "en" | "ar";
    const langs: BlogLang[] = ["en", "ar"];
  
    const hasTitle = langs.some((lang) => typeof title[lang] === "string" && title[lang]!.trim() !== "");
    const hasHeroTitle = langs.some((lang) => typeof hero_title[lang] === "string" && hero_title[lang]!.trim() !== "");
    const hasContent = langs.some((lang) =>
      typeof content[lang] === "string" && !isHtmlEmpty(content[lang]!)
    );
  
    langs.forEach((lang) => {
      const value = hero_title[lang]?.trim();
      if (!value || value === "") {
        if (!hasHeroTitle) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "At least one hero title (any language) required for draft",
            path: ["hero_title", lang]
          });
        }
      } else {
        const wordCount = value.split(/\s+/).length;
        if (value.length > 45 || wordCount > 2) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Hero title must be at most 45 characters or 2 words",
            path: ["hero_title", lang]
          });
        }
      }
    });
  
    if (!hasTitle) {
      langs.forEach((lang) => {
        if (!title[lang] || title[lang]!.trim() === "") {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "At least one title (any language) required for draft",
            path: ["title", lang]
          });
        }
      });
    }
  
    if (!hasContent) {
      langs.forEach((lang) => {
        if (!content[lang] || isHtmlEmpty(content[lang]!)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "At least one content (any language) required for draft",
            path: ["content", lang]
          });
        }
      });
    }
  }
  
});

export type BlogFormInputType = z.infer<typeof blogSchema>;