

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."move_service"("_id" "uuid", "_new_index" integer) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  _old_index int;
  _max_index int;
  _target    int;
BEGIN
  PERFORM pg_advisory_xact_lock(43);

  -- Find current index
  SELECT sort_index INTO _old_index
  FROM public.services
  WHERE service_id = _id;

  IF _old_index IS NULL THEN
    RAISE EXCEPTION 'Service % not found', _id;
  END IF;

  -- Clamp new index
  SELECT MAX(sort_index) INTO _max_index FROM public.services;
  IF _new_index IS NULL THEN
    _target := _max_index; -- null means "move to last"
  ELSE
    _target := GREATEST(1, LEAST(_new_index, _max_index));
  END IF;

  -- No-op
  IF _target = _old_index THEN
    RETURN;
  END IF;

  -- Park moving row at 0
  UPDATE public.services
  SET sort_index = 0
  WHERE service_id = _id;

  IF _target < _old_index THEN
    -- Moving up (shift everything between [target .. old-1] down by +1)
    UPDATE public.services
    SET sort_index = sort_index + 1
    WHERE sort_index >= _target AND sort_index < _old_index;
  ELSE
    -- Moving down (shift everything between [old+1 .. target] up by -1)
    UPDATE public.services
    SET sort_index = sort_index - 1
    WHERE sort_index > _old_index AND sort_index <= _target;
  END IF;

  -- Put the moving row into target
  UPDATE public.services
  SET sort_index = _target
  WHERE service_id = _id;
END;
$$;


ALTER FUNCTION "public"."move_service"("_id" "uuid", "_new_index" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."services_compact_on_delete"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE public.services
  SET sort_index = sort_index - 1
  WHERE sort_index > OLD.sort_index;
  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."services_compact_on_delete"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."services_set_sort_index_on_insert"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.sort_index IS NULL THEN
    NEW.sort_index = (SELECT COALESCE(MAX(sort_index), 0) + 1 FROM public.services);
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."services_set_sort_index_on_insert"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_blog_publish"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Handle published state
  IF NEW.status = 'published' THEN
    -- If slug is provided (not NULL or empty), check uniqueness
    IF NEW.slug IS NOT NULL AND LENGTH(TRIM(NEW.slug)) > 0 THEN
      IF EXISTS (
        SELECT 1 FROM public.blogs
        WHERE slug = NEW.slug
          AND blog_id <> NEW.blog_id
          AND status = 'published'
      ) THEN
        RAISE EXCEPTION 'Slug must be unique among published blogs';
      END IF;
    END IF;

    -- Auto-set published_at if not already set
    IF NEW.published_at IS NULL THEN
      NEW.published_at := timezone('utc', now());
    END IF;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validate_blog_publish"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."admins" (
    "admin_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "email" "text" NOT NULL,
    "img" "text",
    "name" "text",
    "role" "text" NOT NULL
);


ALTER TABLE "public"."admins" OWNER TO "postgres";


COMMENT ON COLUMN "public"."admins"."role" IS 'role as in admin / super admin...';



CREATE TABLE IF NOT EXISTS "public"."blogs" (
    "blog_id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "title" "jsonb" NOT NULL,
    "img_urls" "jsonb" DEFAULT '[]'::"jsonb",
    "author" "text",
    "content" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "tags" "text"[] DEFAULT ARRAY[]::"text"[],
    "published_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "hero_title" "jsonb",
    "slug" "text",
    CONSTRAINT "blog_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'published'::"text"])))
);


ALTER TABLE "public"."blogs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."client_logos" (
    "client_logo_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(255),
    "img_url" "text" NOT NULL,
    "group_id" "uuid" NOT NULL,
    "order_index" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."client_logos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."clientele_groups" (
    "group_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_name" character varying(255) NOT NULL,
    "order_index" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."clientele_groups" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cost_estimations" (
    "cost_estimation_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "project_type" "text" NOT NULL,
    "project_specification" "text" NOT NULL,
    "style_preference" "text" NOT NULL,
    "price_per_sqft" numeric NOT NULL,
    "furniture_included_price_per_sqft" numeric
);


ALTER TABLE "public"."cost_estimations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."leads" (
    "lead_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "first_name" "text",
    "last_name" "text",
    "message" "text",
    "mobile" "text",
    "source" "text",
    "email" "text"
);


ALTER TABLE "public"."leads" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."products" (
    "product_id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "img_urls" "jsonb" NOT NULL,
    "name" "jsonb" NOT NULL,
    "intro" "jsonb" NOT NULL,
    "description" "jsonb" NOT NULL,
    "tags" "text"[],
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "key_features" "jsonb",
    "materials_and_dimensions" "jsonb",
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "installation_steps" "jsonb",
    "slug" "text"
);


ALTER TABLE "public"."products" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."projects" (
    "project_id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "img_urls" "jsonb" NOT NULL,
    "title" "jsonb" NOT NULL,
    "location" "text" NOT NULL,
    "description" "jsonb" NOT NULL,
    "area" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "type" "jsonb",
    "slug" "text"
);


ALTER TABLE "public"."projects" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."services" (
    "service_id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "img_urls" "jsonb" NOT NULL,
    "intro" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "title" "jsonb" NOT NULL,
    "service_features" "jsonb" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "paragraph_one" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "paragraph_two" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "image_description" "jsonb",
    "slug" "text",
    "sort_index" integer NOT NULL
);


ALTER TABLE "public"."services" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."teams" (
    "team_id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "img_urls" "jsonb" NOT NULL,
    "name" "jsonb" NOT NULL,
    "position" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "description" "jsonb"
);


ALTER TABLE "public"."teams" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."testimonials" (
    "testimonial_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "jsonb" NOT NULL,
    "quote" "jsonb" NOT NULL,
    "updated_at" timestamp with time zone,
    "img_urls" "jsonb",
    "role" "jsonb" NOT NULL
);


ALTER TABLE "public"."testimonials" OWNER TO "postgres";


ALTER TABLE ONLY "public"."admins"
    ADD CONSTRAINT "admins_pkey" PRIMARY KEY ("admin_id");



ALTER TABLE ONLY "public"."blogs"
    ADD CONSTRAINT "blogs_pkey" PRIMARY KEY ("blog_id");



ALTER TABLE ONLY "public"."client_logos"
    ADD CONSTRAINT "client_logos_pkey" PRIMARY KEY ("client_logo_id");



ALTER TABLE ONLY "public"."clientele_groups"
    ADD CONSTRAINT "clientele_groups_pkey" PRIMARY KEY ("group_id");



ALTER TABLE ONLY "public"."cost_estimations"
    ADD CONSTRAINT "cost-estimations_pkey" PRIMARY KEY ("cost_estimation_id");



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_pkey" PRIMARY KEY ("lead_id");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "portfolios_pkey" PRIMARY KEY ("project_id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("product_id");



ALTER TABLE ONLY "public"."services"
    ADD CONSTRAINT "services_pkey" PRIMARY KEY ("service_id");



ALTER TABLE ONLY "public"."services"
    ADD CONSTRAINT "services_sort_index_uniq" UNIQUE ("sort_index") DEFERRABLE INITIALLY DEFERRED;



ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_pkey" PRIMARY KEY ("team_id");



ALTER TABLE ONLY "public"."testimonials"
    ADD CONSTRAINT "testimonials_pkey" PRIMARY KEY ("testimonial_id");



CREATE UNIQUE INDEX "blogs_slug_unique_idx" ON "public"."blogs" USING "btree" ("slug") WHERE (("slug" IS NOT NULL) AND ("slug" <> ''::"text"));



CREATE INDEX "idx_client_logos_group_id" ON "public"."client_logos" USING "btree" ("group_id");



CREATE INDEX "idx_client_logos_order" ON "public"."client_logos" USING "btree" ("group_id", "order_index");



CREATE INDEX "idx_clientele_groups_order" ON "public"."clientele_groups" USING "btree" ("order_index");



CREATE UNIQUE INDEX "products_slug_unique_idx" ON "public"."products" USING "btree" ("slug") WHERE (("slug" IS NOT NULL) AND ("slug" <> ''::"text"));



CREATE UNIQUE INDEX "projects_slug_unique_idx" ON "public"."projects" USING "btree" ("slug") WHERE (("slug" IS NOT NULL) AND ("slug" <> ''::"text"));



CREATE UNIQUE INDEX "services_slug_unique_idx" ON "public"."services" USING "btree" ("slug") WHERE (("slug" IS NOT NULL) AND ("slug" <> ''::"text"));



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."blogs" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."products" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."projects" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."services" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."teams" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."testimonials" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trg_services_compact_on_delete" AFTER DELETE ON "public"."services" FOR EACH ROW EXECUTE FUNCTION "public"."services_compact_on_delete"();



CREATE OR REPLACE TRIGGER "trg_services_set_sort_index_on_insert" BEFORE INSERT ON "public"."services" FOR EACH ROW EXECUTE FUNCTION "public"."services_set_sort_index_on_insert"();



CREATE OR REPLACE TRIGGER "update_client_logos_updated_at" BEFORE UPDATE ON "public"."client_logos" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_clientele_groups_updated_at" BEFORE UPDATE ON "public"."clientele_groups" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "validate_blog_publish_trigger" BEFORE INSERT OR UPDATE ON "public"."blogs" FOR EACH ROW EXECUTE FUNCTION "public"."validate_blog_publish"();



ALTER TABLE ONLY "public"."client_logos"
    ADD CONSTRAINT "client_logos_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."clientele_groups"("group_id") ON DELETE CASCADE;



CREATE POLICY "Allow Authenticated admin to ALL" ON "public"."leads" TO "authenticated" USING (true);



CREATE POLICY "Allow all operations for authenticated users on client_logos" ON "public"."client_logos" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow all operations for authenticated users on clientele_group" ON "public"."clientele_groups" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow all users to SELECT" ON "public"."blogs" FOR SELECT USING (true);



CREATE POLICY "Allow all users to SELECT" ON "public"."products" FOR SELECT USING (true);



CREATE POLICY "Allow all users to SELECT" ON "public"."projects" FOR SELECT USING (true);



CREATE POLICY "Allow all users to SELECT" ON "public"."services" FOR SELECT USING (true);



CREATE POLICY "Allow all users to SELECT" ON "public"."teams" FOR SELECT USING (true);



CREATE POLICY "Allow all users to SELECT" ON "public"."testimonials" FOR SELECT USING (true);



CREATE POLICY "Allow authenticated admin to DELETE" ON "public"."blogs" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated admin to DELETE" ON "public"."products" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated admin to DELETE" ON "public"."projects" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated admin to DELETE" ON "public"."services" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated admin to DELETE" ON "public"."teams" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated admin to DELETE" ON "public"."testimonials" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated admin to INSERT" ON "public"."blogs" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Allow authenticated admin to INSERT" ON "public"."products" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Allow authenticated admin to INSERT" ON "public"."projects" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Allow authenticated admin to INSERT" ON "public"."services" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Allow authenticated admin to INSERT" ON "public"."teams" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Allow authenticated admin to INSERT" ON "public"."testimonials" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Allow authenticated admin to UPDATE" ON "public"."blogs" FOR UPDATE TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated admin to UPDATE" ON "public"."products" FOR UPDATE TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated admin to UPDATE" ON "public"."projects" FOR UPDATE TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated admin to UPDATE" ON "public"."services" FOR UPDATE TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated admin to UPDATE" ON "public"."teams" FOR UPDATE TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated admin to UPDATE" ON "public"."testimonials" FOR UPDATE TO "authenticated" USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."client_logos" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."clientele_groups" FOR SELECT USING (true);



ALTER TABLE "public"."blogs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."client_logos" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."clientele_groups" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."products" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."projects" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."services" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."teams" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."testimonials" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."move_service"("_id" "uuid", "_new_index" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."move_service"("_id" "uuid", "_new_index" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."move_service"("_id" "uuid", "_new_index" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."services_compact_on_delete"() TO "anon";
GRANT ALL ON FUNCTION "public"."services_compact_on_delete"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."services_compact_on_delete"() TO "service_role";



GRANT ALL ON FUNCTION "public"."services_set_sort_index_on_insert"() TO "anon";
GRANT ALL ON FUNCTION "public"."services_set_sort_index_on_insert"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."services_set_sort_index_on_insert"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_blog_publish"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_blog_publish"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_blog_publish"() TO "service_role";


















GRANT ALL ON TABLE "public"."admins" TO "anon";
GRANT ALL ON TABLE "public"."admins" TO "authenticated";
GRANT ALL ON TABLE "public"."admins" TO "service_role";



GRANT ALL ON TABLE "public"."blogs" TO "anon";
GRANT ALL ON TABLE "public"."blogs" TO "authenticated";
GRANT ALL ON TABLE "public"."blogs" TO "service_role";



GRANT ALL ON TABLE "public"."client_logos" TO "anon";
GRANT ALL ON TABLE "public"."client_logos" TO "authenticated";
GRANT ALL ON TABLE "public"."client_logos" TO "service_role";



GRANT ALL ON TABLE "public"."clientele_groups" TO "anon";
GRANT ALL ON TABLE "public"."clientele_groups" TO "authenticated";
GRANT ALL ON TABLE "public"."clientele_groups" TO "service_role";



GRANT ALL ON TABLE "public"."cost_estimations" TO "anon";
GRANT ALL ON TABLE "public"."cost_estimations" TO "authenticated";
GRANT ALL ON TABLE "public"."cost_estimations" TO "service_role";



GRANT ALL ON TABLE "public"."leads" TO "anon";
GRANT ALL ON TABLE "public"."leads" TO "authenticated";
GRANT ALL ON TABLE "public"."leads" TO "service_role";



GRANT ALL ON TABLE "public"."products" TO "anon";
GRANT ALL ON TABLE "public"."products" TO "authenticated";
GRANT ALL ON TABLE "public"."products" TO "service_role";



GRANT ALL ON TABLE "public"."projects" TO "anon";
GRANT ALL ON TABLE "public"."projects" TO "authenticated";
GRANT ALL ON TABLE "public"."projects" TO "service_role";



GRANT ALL ON TABLE "public"."services" TO "anon";
GRANT ALL ON TABLE "public"."services" TO "authenticated";
GRANT ALL ON TABLE "public"."services" TO "service_role";



GRANT ALL ON TABLE "public"."teams" TO "anon";
GRANT ALL ON TABLE "public"."teams" TO "authenticated";
GRANT ALL ON TABLE "public"."teams" TO "service_role";



GRANT ALL ON TABLE "public"."testimonials" TO "anon";
GRANT ALL ON TABLE "public"."testimonials" TO "authenticated";
GRANT ALL ON TABLE "public"."testimonials" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























RESET ALL;
