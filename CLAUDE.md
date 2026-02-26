# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Burjcon CMS - a Next.js-based content management system for managing construction/architecture company content. The application uses:

- **Frontend**: Next.js 15 with React 19, TypeScript, Tailwind CSS
- **UI Components**: Radix UI primitives with shadcn/ui
- **Backend**: Supabase for authentication and database
- **Content Management**: Handles blogs, products, projects, services, team members, testimonials, and cost estimations

## Commands

### Development
```bash
bun run dev                    # Start development server with turbo mode
bun run generate-index         # Generate search index (runs automatically before dev/build)
```

### Build & Deploy
```bash
bun run build                  # Build for production (generates index first)
bun run start                  # Start production server
```

### Linting
```bash
bun run lint                   # Run Next.js linter
```

## Architecture

### Directory Structure
- `app/` - Next.js App Router structure
  - `admin/` - Admin dashboard pages (requires authentication)
    - `content/` - Content management pages (blogs, products, projects, services, team, testimonials, cost-estimation)
    - `leads/` - Lead management
    - `profile/` - User profile management
  - `api/` - API routes for CRUD operations
    - `auth/` - Authentication endpoints
    - `_lib/supabase.ts` - Supabase client setup
  - `contexts/` - React contexts (profile management)
- `components/` - Reusable components
  - `ui/` - shadcn/ui components
  - `custom-ui/` - Custom UI components
  - `common/` - Shared components (layouts, forms, modals)
- `lib/` - Utilities and types
  - `types/` - TypeScript type definitions
  - `constants/` - Application constants

### Authentication & Authorization
- Uses Supabase authentication with Next.js middleware
- All `/admin/*` routes require authentication
- Middleware redirects unauthenticated users to `/login`
- Authenticated users accessing `/login` are redirected to `/admin`

### Content Management
- Supports bilingual content (English/Arabic) using localized schemas
- Common content types: products, projects, blogs, services, team, testimonials
- Image handling with preview modals and custom input components
- Form validation using Zod schemas with react-hook-form

### Database Integration
- Supabase integration via `@supabase/auth-helpers-nextjs`
- Server-side client created in `app/api/_lib/supabase.ts`
- API routes handle CRUD operations for all content types

### Search Functionality
- Pre-build search index generation via `scripts/generate-search-index.ts`
- Search modal component for admin interface

### UI Framework
- Tailwind CSS for styling
- Radix UI primitives for accessible components
- Custom theme provider with dark mode support
- Responsive design with mobile sidebar

## Environment Setup

Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_KEY` - Supabase anon key

## Development Notes

- TypeScript and ESLint errors are ignored during builds (see next.config.mjs)
- Images are unoptimized for deployment flexibility
- Uses dotenv-cli for environment variable loading
- Package manager: Bun (preferred) - uses bun.lock

## Content Type Pattern

All content types follow a consistent pattern:
1. Type definitions in `types.ts`
2. List page with table view
3. Create page with form
4. Edit page with pre-populated form
5. Detail page with read-only view
6. Corresponding API routes for CRUD operations

Content types support:
- Localized strings (English required, Arabic optional)
- Image uploads with preview
- Slug generation for SEO
- Publication status management