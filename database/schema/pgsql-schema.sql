--
-- PostgreSQL database dump
--

\restrict qMWY4VKhT8UM88LfMWxf5NDN52gyf56guW7Z8tRLTAdSGMco9C1Pj1HihIAWGvm

-- Dumped from database version 16.11
-- Dumped by pg_dump version 16.11

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: cache; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cache (
    key character varying(255) NOT NULL,
    value text NOT NULL,
    expiration integer NOT NULL
);


--
-- Name: cache_locks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cache_locks (
    key character varying(255) NOT NULL,
    owner character varying(255) NOT NULL,
    expiration integer NOT NULL
);


--
-- Name: comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.comments (
    id bigint NOT NULL,
    post_id bigint NOT NULL,
    user_id bigint,
    parent_id bigint,
    author_name character varying(255) NOT NULL,
    author_email character varying(255),
    author_avatar character varying(255),
    content text NOT NULL,
    status character varying(255) DEFAULT 'approved'::character varying NOT NULL,
    approved_at timestamp(0) without time zone,
    ip_address character varying(45),
    user_agent character varying(255),
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: comments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.comments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: comments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.comments_id_seq OWNED BY public.comments.id;


--
-- Name: failed_jobs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.failed_jobs (
    id bigint NOT NULL,
    uuid character varying(255) NOT NULL,
    connection text NOT NULL,
    queue text NOT NULL,
    payload text NOT NULL,
    exception text NOT NULL,
    failed_at timestamp(0) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: failed_jobs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.failed_jobs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: failed_jobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.failed_jobs_id_seq OWNED BY public.failed_jobs.id;


--
-- Name: job_batches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.job_batches (
    id character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    total_jobs integer NOT NULL,
    pending_jobs integer NOT NULL,
    failed_jobs integer NOT NULL,
    failed_job_ids text NOT NULL,
    options text,
    cancelled_at integer,
    created_at integer NOT NULL,
    finished_at integer
);


--
-- Name: jobs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.jobs (
    id bigint NOT NULL,
    queue character varying(255) NOT NULL,
    payload text NOT NULL,
    attempts smallint NOT NULL,
    reserved_at integer,
    available_at integer NOT NULL,
    created_at integer NOT NULL
);


--
-- Name: jobs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.jobs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: jobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.jobs_id_seq OWNED BY public.jobs.id;


--
-- Name: locales; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.locales (
    id bigint NOT NULL,
    code character varying(10) NOT NULL,
    name character varying(100) NOT NULL,
    native_name character varying(100),
    direction character varying(3) DEFAULT 'ltr'::character varying NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: locales_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.locales_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: locales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.locales_id_seq OWNED BY public.locales.id;


--
-- Name: media; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.media (
    id bigint NOT NULL,
    model_type character varying(255) NOT NULL,
    model_id bigint NOT NULL,
    uuid uuid,
    collection_name character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    file_name character varying(255) NOT NULL,
    mime_type character varying(255),
    disk character varying(255) NOT NULL,
    conversions_disk character varying(255),
    size bigint NOT NULL,
    manipulations json NOT NULL,
    custom_properties json NOT NULL,
    generated_conversions json NOT NULL,
    responsive_images json NOT NULL,
    order_column integer,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: media_buckets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.media_buckets (
    id bigint NOT NULL,
    name character varying(255) NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    parent_id bigint,
    slug character varying(255) NOT NULL,
    path character varying(255) NOT NULL,
    deleted_at timestamp(0) without time zone
);


--
-- Name: media_buckets_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.media_buckets_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: media_buckets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.media_buckets_id_seq OWNED BY public.media_buckets.id;


--
-- Name: media_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.media_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: media_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.media_id_seq OWNED BY public.media.id;


--
-- Name: menu_item_translations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.menu_item_translations (
    id bigint NOT NULL,
    menu_item_id bigint NOT NULL,
    locale character varying(8) NOT NULL,
    label character varying(255) NOT NULL,
    url character varying(255),
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: menu_item_translations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.menu_item_translations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: menu_item_translations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.menu_item_translations_id_seq OWNED BY public.menu_item_translations.id;


--
-- Name: menu_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.menu_items (
    id bigint NOT NULL,
    menu_id bigint NOT NULL,
    parent_id bigint,
    label character varying(255) NOT NULL,
    url character varying(255),
    page_slug character varying(255),
    route_name character varying(255),
    "order" integer DEFAULT 0 NOT NULL,
    visible_to character varying(255) DEFAULT 'all'::character varying NOT NULL,
    target character varying(255),
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    CONSTRAINT menu_items_visible_to_check CHECK (((visible_to)::text = ANY ((ARRAY['all'::character varying, 'guest'::character varying, 'auth'::character varying])::text[])))
);


--
-- Name: menu_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.menu_items_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: menu_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.menu_items_id_seq OWNED BY public.menu_items.id;


--
-- Name: menus; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.menus (
    id bigint NOT NULL,
    name character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    location character varying(255),
    description text,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: menus_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.menus_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: menus_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.menus_id_seq OWNED BY public.menus.id;


--
-- Name: migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.migrations (
    id integer NOT NULL,
    migration character varying(255) NOT NULL,
    batch integer NOT NULL
);


--
-- Name: migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.migrations_id_seq OWNED BY public.migrations.id;


--
-- Name: model_has_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.model_has_permissions (
    permission_id bigint NOT NULL,
    model_type character varying(255) NOT NULL,
    model_id bigint NOT NULL
);


--
-- Name: model_has_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.model_has_roles (
    role_id bigint NOT NULL,
    model_type character varying(255) NOT NULL,
    model_id bigint NOT NULL
);


--
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.password_reset_tokens (
    email character varying(255) NOT NULL,
    token character varying(255) NOT NULL,
    created_at timestamp(0) without time zone
);


--
-- Name: permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.permissions (
    id bigint NOT NULL,
    name character varying(255) NOT NULL,
    guard_name character varying(255) NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.permissions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.permissions_id_seq OWNED BY public.permissions.id;


--
-- Name: plugins; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.plugins (
    id bigint NOT NULL,
    name character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    version character varying(255) NOT NULL,
    description character varying(255),
    author character varying(255),
    service_provider character varying(255),
    is_active boolean DEFAULT false NOT NULL,
    settings json,
    installed_at timestamp(0) without time zone,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: plugins_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.plugins_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: plugins_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.plugins_id_seq OWNED BY public.plugins.id;


--
-- Name: post_taxonomy_terms; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.post_taxonomy_terms (
    id bigint NOT NULL,
    post_id bigint NOT NULL,
    taxonomy_term_id bigint NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: post_taxonomy_terms_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.post_taxonomy_terms_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: post_taxonomy_terms_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.post_taxonomy_terms_id_seq OWNED BY public.post_taxonomy_terms.id;


--
-- Name: post_translations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.post_translations (
    id bigint NOT NULL,
    post_id bigint NOT NULL,
    locale character varying(8) NOT NULL,
    title character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    excerpt character varying(512),
    content text,
    seo_title character varying(255),
    seo_description text,
    meta json,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: post_translations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.post_translations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: post_translations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.post_translations_id_seq OWNED BY public.post_translations.id;


--
-- Name: post_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.post_types (
    id bigint NOT NULL,
    name character varying(255) NOT NULL,
    label character varying(255) NOT NULL,
    plural_label character varying(255) NOT NULL,
    description text,
    has_taxonomies boolean DEFAULT true NOT NULL,
    has_featured_image boolean DEFAULT true NOT NULL,
    has_excerpt boolean DEFAULT true NOT NULL,
    has_comments boolean DEFAULT true NOT NULL,
    supports json,
    taxonomies json,
    slug character varying(255) NOT NULL,
    is_public boolean DEFAULT true NOT NULL,
    is_hierarchical boolean DEFAULT false NOT NULL,
    menu_icon character varying(255),
    menu_position integer DEFAULT 5 NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    route_prefix character varying(255),
    single_template_id bigint,
    archive_template_id bigint,
    show_in_menu boolean DEFAULT true NOT NULL
);


--
-- Name: post_types_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.post_types_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: post_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.post_types_id_seq OWNED BY public.post_types.id;


--
-- Name: posts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.posts (
    id bigint NOT NULL,
    post_type_id bigint NOT NULL,
    author_id bigint NOT NULL,
    title character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    excerpt text,
    content text NOT NULL,
    featured_image character varying(255),
    status character varying(255) DEFAULT 'draft'::character varying NOT NULL,
    published_at timestamp(0) without time zone,
    parent_id bigint,
    menu_order integer DEFAULT 0 NOT NULL,
    meta_title character varying(255),
    meta_description text,
    meta_data json,
    view_count integer DEFAULT 0 NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    CONSTRAINT posts_status_check CHECK (((status)::text = ANY ((ARRAY['draft'::character varying, 'published'::character varying, 'private'::character varying, 'archived'::character varying])::text[])))
);


--
-- Name: posts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.posts_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: posts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.posts_id_seq OWNED BY public.posts.id;


--
-- Name: role_has_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role_has_permissions (
    permission_id bigint NOT NULL,
    role_id bigint NOT NULL
);


--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    id bigint NOT NULL,
    name character varying(255) NOT NULL,
    guard_name character varying(255) NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.roles_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sessions (
    id character varying(255) NOT NULL,
    user_id bigint,
    ip_address character varying(45),
    user_agent text,
    payload text NOT NULL,
    last_activity integer NOT NULL
);


--
-- Name: site_setting_translations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.site_setting_translations (
    id bigint NOT NULL,
    site_setting_id bigint NOT NULL,
    locale character varying(10) NOT NULL,
    value text,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: site_setting_translations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.site_setting_translations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: site_setting_translations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.site_setting_translations_id_seq OWNED BY public.site_setting_translations.id;


--
-- Name: site_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.site_settings (
    id bigint NOT NULL,
    "group" character varying(255) DEFAULT 'general'::character varying NOT NULL,
    key character varying(255) NOT NULL,
    value text,
    type character varying(255) DEFAULT 'string'::character varying NOT NULL,
    autoload boolean DEFAULT true NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: site_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.site_settings_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: site_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.site_settings_id_seq OWNED BY public.site_settings.id;


--
-- Name: sitemap_setting_translations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sitemap_setting_translations (
    id bigint NOT NULL,
    sitemap_setting_id bigint NOT NULL,
    locale character varying(10) NOT NULL,
    included_post_type_ids json,
    include_taxonomies boolean,
    custom_urls json,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: sitemap_setting_translations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sitemap_setting_translations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sitemap_setting_translations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sitemap_setting_translations_id_seq OWNED BY public.sitemap_setting_translations.id;


--
-- Name: sitemap_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sitemap_settings (
    id bigint NOT NULL,
    included_post_type_ids json,
    include_taxonomies boolean DEFAULT true NOT NULL,
    enable_cache boolean DEFAULT true NOT NULL,
    cache_ttl integer DEFAULT 3600 NOT NULL,
    last_generated_at timestamp(0) without time zone,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: sitemap_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sitemap_settings_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sitemap_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sitemap_settings_id_seq OWNED BY public.sitemap_settings.id;


--
-- Name: taxonomies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.taxonomies (
    id bigint NOT NULL,
    name character varying(255) NOT NULL,
    label character varying(255) NOT NULL,
    plural_label character varying(255) NOT NULL,
    description text,
    slug character varying(255) NOT NULL,
    is_hierarchical boolean DEFAULT false NOT NULL,
    is_public boolean DEFAULT true NOT NULL,
    post_types json,
    show_in_menu boolean DEFAULT true NOT NULL,
    menu_icon character varying(255),
    menu_position integer DEFAULT 5 NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: taxonomies_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.taxonomies_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: taxonomies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.taxonomies_id_seq OWNED BY public.taxonomies.id;


--
-- Name: taxonomy_term_translations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.taxonomy_term_translations (
    id bigint NOT NULL,
    taxonomy_term_id bigint NOT NULL,
    locale character varying(8) NOT NULL,
    name character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    description text,
    meta_title character varying(255),
    meta_description text,
    meta_data json,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: taxonomy_term_translations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.taxonomy_term_translations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: taxonomy_term_translations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.taxonomy_term_translations_id_seq OWNED BY public.taxonomy_term_translations.id;


--
-- Name: taxonomy_terms; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.taxonomy_terms (
    id bigint NOT NULL,
    taxonomy_id bigint NOT NULL,
    name character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    description text,
    parent_id bigint,
    term_order integer DEFAULT 0 NOT NULL,
    meta_title character varying(255),
    meta_description text,
    meta_data json,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: taxonomy_terms_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.taxonomy_terms_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: taxonomy_terms_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.taxonomy_terms_id_seq OWNED BY public.taxonomy_terms.id;


--
-- Name: taxonomy_translations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.taxonomy_translations (
    id bigint NOT NULL,
    taxonomy_id bigint NOT NULL,
    locale character varying(8) NOT NULL,
    label character varying(255) NOT NULL,
    plural_label character varying(255),
    description text,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: taxonomy_translations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.taxonomy_translations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: taxonomy_translations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.taxonomy_translations_id_seq OWNED BY public.taxonomy_translations.id;


--
-- Name: templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.templates (
    id bigint NOT NULL,
    name character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    type character varying(255) NOT NULL,
    description text,
    content text NOT NULL,
    variables json,
    is_default boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_by bigint,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: templates_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.templates_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: templates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.templates_id_seq OWNED BY public.templates.id;


--
-- Name: themes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.themes (
    id bigint NOT NULL,
    name character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    version character varying(255) DEFAULT '1.0.0'::character varying NOT NULL,
    description text,
    author character varying(255),
    author_url character varying(255),
    screenshot character varying(255),
    tags json,
    supports json,
    templates json,
    partials json,
    assets json,
    menus json,
    widget_areas json,
    directory_path character varying(255) NOT NULL,
    is_active boolean DEFAULT false NOT NULL,
    is_installed boolean DEFAULT false NOT NULL,
    installed_at timestamp(0) without time zone,
    installed_by bigint,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    template_engine character varying(255) DEFAULT 'blade'::character varying NOT NULL,
    parent_theme_id bigint
);


--
-- Name: themes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.themes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: themes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.themes_id_seq OWNED BY public.themes.id;


--
-- Name: translation_overrides; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.translation_overrides (
    id bigint NOT NULL,
    locale character varying(10) NOT NULL,
    domain character varying(64) NOT NULL,
    key character varying(255) NOT NULL,
    value text,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: translation_overrides_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.translation_overrides_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: translation_overrides_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.translation_overrides_id_seq OWNED BY public.translation_overrides.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id bigint NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    email_verified_at timestamp(0) without time zone,
    password character varying(255) NOT NULL,
    remember_token character varying(100),
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    is_admin boolean DEFAULT false NOT NULL,
    locale character varying(10)
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: comments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comments ALTER COLUMN id SET DEFAULT nextval('public.comments_id_seq'::regclass);


--
-- Name: failed_jobs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.failed_jobs ALTER COLUMN id SET DEFAULT nextval('public.failed_jobs_id_seq'::regclass);


--
-- Name: jobs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jobs ALTER COLUMN id SET DEFAULT nextval('public.jobs_id_seq'::regclass);


--
-- Name: locales id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.locales ALTER COLUMN id SET DEFAULT nextval('public.locales_id_seq'::regclass);


--
-- Name: media id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media ALTER COLUMN id SET DEFAULT nextval('public.media_id_seq'::regclass);


--
-- Name: media_buckets id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media_buckets ALTER COLUMN id SET DEFAULT nextval('public.media_buckets_id_seq'::regclass);


--
-- Name: menu_item_translations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.menu_item_translations ALTER COLUMN id SET DEFAULT nextval('public.menu_item_translations_id_seq'::regclass);


--
-- Name: menu_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.menu_items ALTER COLUMN id SET DEFAULT nextval('public.menu_items_id_seq'::regclass);


--
-- Name: menus id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.menus ALTER COLUMN id SET DEFAULT nextval('public.menus_id_seq'::regclass);


--
-- Name: migrations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.migrations ALTER COLUMN id SET DEFAULT nextval('public.migrations_id_seq'::regclass);


--
-- Name: permissions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions ALTER COLUMN id SET DEFAULT nextval('public.permissions_id_seq'::regclass);


--
-- Name: plugins id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plugins ALTER COLUMN id SET DEFAULT nextval('public.plugins_id_seq'::regclass);


--
-- Name: post_taxonomy_terms id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_taxonomy_terms ALTER COLUMN id SET DEFAULT nextval('public.post_taxonomy_terms_id_seq'::regclass);


--
-- Name: post_translations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_translations ALTER COLUMN id SET DEFAULT nextval('public.post_translations_id_seq'::regclass);


--
-- Name: post_types id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_types ALTER COLUMN id SET DEFAULT nextval('public.post_types_id_seq'::regclass);


--
-- Name: posts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.posts ALTER COLUMN id SET DEFAULT nextval('public.posts_id_seq'::regclass);


--
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- Name: site_setting_translations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_setting_translations ALTER COLUMN id SET DEFAULT nextval('public.site_setting_translations_id_seq'::regclass);


--
-- Name: site_settings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_settings ALTER COLUMN id SET DEFAULT nextval('public.site_settings_id_seq'::regclass);


--
-- Name: sitemap_setting_translations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sitemap_setting_translations ALTER COLUMN id SET DEFAULT nextval('public.sitemap_setting_translations_id_seq'::regclass);


--
-- Name: sitemap_settings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sitemap_settings ALTER COLUMN id SET DEFAULT nextval('public.sitemap_settings_id_seq'::regclass);


--
-- Name: taxonomies id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.taxonomies ALTER COLUMN id SET DEFAULT nextval('public.taxonomies_id_seq'::regclass);


--
-- Name: taxonomy_term_translations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.taxonomy_term_translations ALTER COLUMN id SET DEFAULT nextval('public.taxonomy_term_translations_id_seq'::regclass);


--
-- Name: taxonomy_terms id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.taxonomy_terms ALTER COLUMN id SET DEFAULT nextval('public.taxonomy_terms_id_seq'::regclass);


--
-- Name: taxonomy_translations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.taxonomy_translations ALTER COLUMN id SET DEFAULT nextval('public.taxonomy_translations_id_seq'::regclass);


--
-- Name: templates id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.templates ALTER COLUMN id SET DEFAULT nextval('public.templates_id_seq'::regclass);


--
-- Name: themes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.themes ALTER COLUMN id SET DEFAULT nextval('public.themes_id_seq'::regclass);


--
-- Name: translation_overrides id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.translation_overrides ALTER COLUMN id SET DEFAULT nextval('public.translation_overrides_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: cache_locks cache_locks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cache_locks
    ADD CONSTRAINT cache_locks_pkey PRIMARY KEY (key);


--
-- Name: cache cache_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cache
    ADD CONSTRAINT cache_pkey PRIMARY KEY (key);


--
-- Name: comments comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (id);


--
-- Name: failed_jobs failed_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.failed_jobs
    ADD CONSTRAINT failed_jobs_pkey PRIMARY KEY (id);


--
-- Name: failed_jobs failed_jobs_uuid_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.failed_jobs
    ADD CONSTRAINT failed_jobs_uuid_unique UNIQUE (uuid);


--
-- Name: job_batches job_batches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_batches
    ADD CONSTRAINT job_batches_pkey PRIMARY KEY (id);


--
-- Name: jobs jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_pkey PRIMARY KEY (id);


--
-- Name: locales locales_code_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.locales
    ADD CONSTRAINT locales_code_unique UNIQUE (code);


--
-- Name: locales locales_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.locales
    ADD CONSTRAINT locales_pkey PRIMARY KEY (id);


--
-- Name: media_buckets media_buckets_parent_id_slug_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media_buckets
    ADD CONSTRAINT media_buckets_parent_id_slug_unique UNIQUE (parent_id, slug);


--
-- Name: media_buckets media_buckets_path_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media_buckets
    ADD CONSTRAINT media_buckets_path_unique UNIQUE (path);


--
-- Name: media_buckets media_buckets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media_buckets
    ADD CONSTRAINT media_buckets_pkey PRIMARY KEY (id);


--
-- Name: media media_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media
    ADD CONSTRAINT media_pkey PRIMARY KEY (id);


--
-- Name: media media_uuid_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media
    ADD CONSTRAINT media_uuid_unique UNIQUE (uuid);


--
-- Name: menu_item_translations menu_item_translations_menu_item_id_locale_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.menu_item_translations
    ADD CONSTRAINT menu_item_translations_menu_item_id_locale_unique UNIQUE (menu_item_id, locale);


--
-- Name: menu_item_translations menu_item_translations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.menu_item_translations
    ADD CONSTRAINT menu_item_translations_pkey PRIMARY KEY (id);


--
-- Name: menu_items menu_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.menu_items
    ADD CONSTRAINT menu_items_pkey PRIMARY KEY (id);


--
-- Name: menus menus_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.menus
    ADD CONSTRAINT menus_pkey PRIMARY KEY (id);


--
-- Name: menus menus_slug_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.menus
    ADD CONSTRAINT menus_slug_unique UNIQUE (slug);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: model_has_permissions model_has_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.model_has_permissions
    ADD CONSTRAINT model_has_permissions_pkey PRIMARY KEY (permission_id, model_id, model_type);


--
-- Name: model_has_roles model_has_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.model_has_roles
    ADD CONSTRAINT model_has_roles_pkey PRIMARY KEY (role_id, model_id, model_type);


--
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (email);


--
-- Name: permissions permissions_name_guard_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_name_guard_name_unique UNIQUE (name, guard_name);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: plugins plugins_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plugins
    ADD CONSTRAINT plugins_pkey PRIMARY KEY (id);


--
-- Name: plugins plugins_slug_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plugins
    ADD CONSTRAINT plugins_slug_unique UNIQUE (slug);


--
-- Name: post_taxonomy_terms post_taxonomy_terms_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_taxonomy_terms
    ADD CONSTRAINT post_taxonomy_terms_pkey PRIMARY KEY (id);


--
-- Name: post_taxonomy_terms post_taxonomy_terms_post_id_taxonomy_term_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_taxonomy_terms
    ADD CONSTRAINT post_taxonomy_terms_post_id_taxonomy_term_id_unique UNIQUE (post_id, taxonomy_term_id);


--
-- Name: post_translations post_translations_locale_slug_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_translations
    ADD CONSTRAINT post_translations_locale_slug_unique UNIQUE (locale, slug);


--
-- Name: post_translations post_translations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_translations
    ADD CONSTRAINT post_translations_pkey PRIMARY KEY (id);


--
-- Name: post_translations post_translations_post_id_locale_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_translations
    ADD CONSTRAINT post_translations_post_id_locale_unique UNIQUE (post_id, locale);


--
-- Name: post_types post_types_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_types
    ADD CONSTRAINT post_types_name_unique UNIQUE (name);


--
-- Name: post_types post_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_types
    ADD CONSTRAINT post_types_pkey PRIMARY KEY (id);


--
-- Name: post_types post_types_slug_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_types
    ADD CONSTRAINT post_types_slug_unique UNIQUE (slug);


--
-- Name: posts posts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_pkey PRIMARY KEY (id);


--
-- Name: posts posts_slug_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_slug_unique UNIQUE (slug);


--
-- Name: role_has_permissions role_has_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_has_permissions
    ADD CONSTRAINT role_has_permissions_pkey PRIMARY KEY (permission_id, role_id);


--
-- Name: roles roles_name_guard_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_guard_name_unique UNIQUE (name, guard_name);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: site_setting_translations site_setting_translations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_setting_translations
    ADD CONSTRAINT site_setting_translations_pkey PRIMARY KEY (id);


--
-- Name: site_setting_translations site_setting_translations_site_setting_id_locale_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_setting_translations
    ADD CONSTRAINT site_setting_translations_site_setting_id_locale_unique UNIQUE (site_setting_id, locale);


--
-- Name: site_settings site_settings_key_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_settings
    ADD CONSTRAINT site_settings_key_unique UNIQUE (key);


--
-- Name: site_settings site_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_settings
    ADD CONSTRAINT site_settings_pkey PRIMARY KEY (id);


--
-- Name: sitemap_setting_translations sitemap_setting_translations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sitemap_setting_translations
    ADD CONSTRAINT sitemap_setting_translations_pkey PRIMARY KEY (id);


--
-- Name: sitemap_setting_translations sitemap_setting_translations_sitemap_setting_id_locale_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sitemap_setting_translations
    ADD CONSTRAINT sitemap_setting_translations_sitemap_setting_id_locale_unique UNIQUE (sitemap_setting_id, locale);


--
-- Name: sitemap_settings sitemap_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sitemap_settings
    ADD CONSTRAINT sitemap_settings_pkey PRIMARY KEY (id);


--
-- Name: taxonomies taxonomies_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.taxonomies
    ADD CONSTRAINT taxonomies_name_unique UNIQUE (name);


--
-- Name: taxonomies taxonomies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.taxonomies
    ADD CONSTRAINT taxonomies_pkey PRIMARY KEY (id);


--
-- Name: taxonomies taxonomies_slug_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.taxonomies
    ADD CONSTRAINT taxonomies_slug_unique UNIQUE (slug);


--
-- Name: taxonomy_term_translations taxonomy_term_translations_locale_slug_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.taxonomy_term_translations
    ADD CONSTRAINT taxonomy_term_translations_locale_slug_unique UNIQUE (locale, slug);


--
-- Name: taxonomy_term_translations taxonomy_term_translations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.taxonomy_term_translations
    ADD CONSTRAINT taxonomy_term_translations_pkey PRIMARY KEY (id);


--
-- Name: taxonomy_term_translations taxonomy_term_translations_taxonomy_term_id_locale_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.taxonomy_term_translations
    ADD CONSTRAINT taxonomy_term_translations_taxonomy_term_id_locale_unique UNIQUE (taxonomy_term_id, locale);


--
-- Name: taxonomy_terms taxonomy_terms_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.taxonomy_terms
    ADD CONSTRAINT taxonomy_terms_pkey PRIMARY KEY (id);


--
-- Name: taxonomy_terms taxonomy_terms_slug_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.taxonomy_terms
    ADD CONSTRAINT taxonomy_terms_slug_unique UNIQUE (slug);


--
-- Name: taxonomy_translations taxonomy_translations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.taxonomy_translations
    ADD CONSTRAINT taxonomy_translations_pkey PRIMARY KEY (id);


--
-- Name: taxonomy_translations taxonomy_translations_taxonomy_id_locale_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.taxonomy_translations
    ADD CONSTRAINT taxonomy_translations_taxonomy_id_locale_unique UNIQUE (taxonomy_id, locale);


--
-- Name: templates templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.templates
    ADD CONSTRAINT templates_pkey PRIMARY KEY (id);


--
-- Name: templates templates_slug_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.templates
    ADD CONSTRAINT templates_slug_unique UNIQUE (slug);


--
-- Name: themes themes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.themes
    ADD CONSTRAINT themes_pkey PRIMARY KEY (id);


--
-- Name: themes themes_slug_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.themes
    ADD CONSTRAINT themes_slug_unique UNIQUE (slug);


--
-- Name: translation_overrides translation_overrides_locale_domain_key_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.translation_overrides
    ADD CONSTRAINT translation_overrides_locale_domain_key_unique UNIQUE (locale, domain, key);


--
-- Name: translation_overrides translation_overrides_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.translation_overrides
    ADD CONSTRAINT translation_overrides_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: comments_parent_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX comments_parent_id_index ON public.comments USING btree (parent_id);


--
-- Name: comments_post_id_status_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX comments_post_id_status_index ON public.comments USING btree (post_id, status);


--
-- Name: comments_post_status_created_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX comments_post_status_created_index ON public.comments USING btree (post_id, status, created_at);


--
-- Name: jobs_queue_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX jobs_queue_index ON public.jobs USING btree (queue);


--
-- Name: locales_is_active_sort_order_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX locales_is_active_sort_order_index ON public.locales USING btree (is_active, sort_order);


--
-- Name: media_buckets_parent_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX media_buckets_parent_id_index ON public.media_buckets USING btree (parent_id);


--
-- Name: media_model_type_model_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX media_model_type_model_id_index ON public.media USING btree (model_type, model_id);


--
-- Name: media_order_column_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX media_order_column_index ON public.media USING btree (order_column);


--
-- Name: menu_item_translations_locale_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX menu_item_translations_locale_index ON public.menu_item_translations USING btree (locale);


--
-- Name: menu_items_menu_id_hot_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX menu_items_menu_id_hot_idx ON public.menu_items USING btree (menu_id);


--
-- Name: menu_items_menu_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX menu_items_menu_id_idx ON public.menu_items USING btree (menu_id);


--
-- Name: menu_items_order_hot_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX menu_items_order_hot_idx ON public.menu_items USING btree ("order");


--
-- Name: menu_items_order_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX menu_items_order_idx ON public.menu_items USING btree ("order");


--
-- Name: menu_items_parent_id_hot_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX menu_items_parent_id_hot_idx ON public.menu_items USING btree (parent_id);


--
-- Name: menu_items_parent_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX menu_items_parent_id_idx ON public.menu_items USING btree (parent_id);


--
-- Name: menus_location_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX menus_location_index ON public.menus USING btree (location);


--
-- Name: menus_slug_hot_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX menus_slug_hot_idx ON public.menus USING btree (slug);


--
-- Name: menus_slug_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX menus_slug_idx ON public.menus USING btree (slug);


--
-- Name: model_has_permissions_model_id_model_type_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX model_has_permissions_model_id_model_type_index ON public.model_has_permissions USING btree (model_id, model_type);


--
-- Name: model_has_roles_model_id_model_type_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX model_has_roles_model_id_model_type_index ON public.model_has_roles USING btree (model_id, model_type);


--
-- Name: post_taxonomy_terms_post_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX post_taxonomy_terms_post_id_index ON public.post_taxonomy_terms USING btree (post_id);


--
-- Name: post_taxonomy_terms_taxonomy_term_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX post_taxonomy_terms_taxonomy_term_id_index ON public.post_taxonomy_terms USING btree (taxonomy_term_id);


--
-- Name: post_translations_locale_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX post_translations_locale_index ON public.post_translations USING btree (locale);


--
-- Name: post_types_is_public_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX post_types_is_public_idx ON public.post_types USING btree (is_public);


--
-- Name: post_types_route_prefix_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX post_types_route_prefix_idx ON public.post_types USING btree (route_prefix);


--
-- Name: post_types_slug_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX post_types_slug_idx ON public.post_types USING btree (slug);


--
-- Name: posts_author_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX posts_author_id_idx ON public.posts USING btree (author_id);


--
-- Name: posts_author_id_status_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX posts_author_id_status_index ON public.posts USING btree (author_id, status);


--
-- Name: posts_author_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX posts_author_status_idx ON public.posts USING btree (author_id, status);


--
-- Name: posts_parent_id_hot_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX posts_parent_id_hot_idx ON public.posts USING btree (parent_id);


--
-- Name: posts_parent_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX posts_parent_id_idx ON public.posts USING btree (parent_id);


--
-- Name: posts_post_type_id_status_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX posts_post_type_id_status_index ON public.posts USING btree (post_type_id, status);


--
-- Name: posts_published_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX posts_published_at_idx ON public.posts USING btree (published_at);


--
-- Name: posts_slug_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX posts_slug_idx ON public.posts USING btree (slug);


--
-- Name: posts_slug_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX posts_slug_index ON public.posts USING btree (slug);


--
-- Name: posts_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX posts_status_idx ON public.posts USING btree (status);


--
-- Name: posts_status_published_at_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX posts_status_published_at_index ON public.posts USING btree (status, published_at);


--
-- Name: posts_type_published_hot_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX posts_type_published_hot_idx ON public.posts USING btree (post_type_id, published_at);


--
-- Name: posts_type_status_published_hot_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX posts_type_status_published_hot_idx ON public.posts USING btree (post_type_id, status, published_at);


--
-- Name: posts_type_status_published_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX posts_type_status_published_idx ON public.posts USING btree (post_type_id, status, published_at);


--
-- Name: sessions_last_activity_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sessions_last_activity_index ON public.sessions USING btree (last_activity);


--
-- Name: sessions_user_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sessions_user_id_index ON public.sessions USING btree (user_id);


--
-- Name: site_setting_translations_locale_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX site_setting_translations_locale_index ON public.site_setting_translations USING btree (locale);


--
-- Name: site_settings_autoload_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX site_settings_autoload_index ON public.site_settings USING btree (autoload);


--
-- Name: site_settings_group_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX site_settings_group_index ON public.site_settings USING btree ("group");


--
-- Name: site_settings_group_key_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX site_settings_group_key_index ON public.site_settings USING btree ("group", key);


--
-- Name: sitemap_setting_translations_locale_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sitemap_setting_translations_locale_index ON public.sitemap_setting_translations USING btree (locale);


--
-- Name: taxonomy_term_translations_locale_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX taxonomy_term_translations_locale_index ON public.taxonomy_term_translations USING btree (locale);


--
-- Name: taxonomy_terms_parent_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX taxonomy_terms_parent_id_idx ON public.taxonomy_terms USING btree (parent_id);


--
-- Name: taxonomy_terms_slug_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX taxonomy_terms_slug_idx ON public.taxonomy_terms USING btree (slug);


--
-- Name: taxonomy_terms_slug_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX taxonomy_terms_slug_index ON public.taxonomy_terms USING btree (slug);


--
-- Name: taxonomy_terms_taxonomy_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX taxonomy_terms_taxonomy_id_idx ON public.taxonomy_terms USING btree (taxonomy_id);


--
-- Name: taxonomy_terms_taxonomy_id_parent_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX taxonomy_terms_taxonomy_id_parent_id_index ON public.taxonomy_terms USING btree (taxonomy_id, parent_id);


--
-- Name: taxonomy_terms_taxonomy_slug_hot_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX taxonomy_terms_taxonomy_slug_hot_idx ON public.taxonomy_terms USING btree (taxonomy_id, slug);


--
-- Name: taxonomy_terms_taxonomy_slug_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX taxonomy_terms_taxonomy_slug_idx ON public.taxonomy_terms USING btree (taxonomy_id, slug);


--
-- Name: taxonomy_translations_locale_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX taxonomy_translations_locale_index ON public.taxonomy_translations USING btree (locale);


--
-- Name: templates_type_is_active_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX templates_type_is_active_index ON public.templates USING btree (type, is_active);


--
-- Name: themes_is_installed_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX themes_is_installed_index ON public.themes USING btree (is_installed);


--
-- Name: themes_slug_is_active_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX themes_slug_is_active_index ON public.themes USING btree (slug, is_active);


--
-- Name: translation_overrides_domain_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX translation_overrides_domain_index ON public.translation_overrides USING btree (domain);


--
-- Name: translation_overrides_locale_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX translation_overrides_locale_index ON public.translation_overrides USING btree (locale);


--
-- Name: users_email_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX users_email_idx ON public.users USING btree (email);


--
-- Name: users_is_admin_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX users_is_admin_idx ON public.users USING btree (is_admin);


--
-- Name: comments comments_parent_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_parent_id_foreign FOREIGN KEY (parent_id) REFERENCES public.comments(id) ON DELETE CASCADE;


--
-- Name: comments comments_post_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_post_id_foreign FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--
-- Name: comments comments_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: media_buckets media_buckets_parent_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media_buckets
    ADD CONSTRAINT media_buckets_parent_id_foreign FOREIGN KEY (parent_id) REFERENCES public.media_buckets(id) ON DELETE SET NULL;


--
-- Name: menu_item_translations menu_item_translations_menu_item_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.menu_item_translations
    ADD CONSTRAINT menu_item_translations_menu_item_id_foreign FOREIGN KEY (menu_item_id) REFERENCES public.menu_items(id) ON DELETE CASCADE;


--
-- Name: menu_items menu_items_menu_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.menu_items
    ADD CONSTRAINT menu_items_menu_id_foreign FOREIGN KEY (menu_id) REFERENCES public.menus(id) ON DELETE CASCADE;


--
-- Name: menu_items menu_items_parent_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.menu_items
    ADD CONSTRAINT menu_items_parent_id_foreign FOREIGN KEY (parent_id) REFERENCES public.menu_items(id) ON DELETE CASCADE;


--
-- Name: model_has_permissions model_has_permissions_permission_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.model_has_permissions
    ADD CONSTRAINT model_has_permissions_permission_id_foreign FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON DELETE CASCADE;


--
-- Name: model_has_roles model_has_roles_role_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.model_has_roles
    ADD CONSTRAINT model_has_roles_role_id_foreign FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: post_taxonomy_terms post_taxonomy_terms_post_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_taxonomy_terms
    ADD CONSTRAINT post_taxonomy_terms_post_id_foreign FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--
-- Name: post_taxonomy_terms post_taxonomy_terms_taxonomy_term_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_taxonomy_terms
    ADD CONSTRAINT post_taxonomy_terms_taxonomy_term_id_foreign FOREIGN KEY (taxonomy_term_id) REFERENCES public.taxonomy_terms(id) ON DELETE CASCADE;


--
-- Name: post_translations post_translations_post_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_translations
    ADD CONSTRAINT post_translations_post_id_foreign FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--
-- Name: post_types post_types_archive_template_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_types
    ADD CONSTRAINT post_types_archive_template_id_foreign FOREIGN KEY (archive_template_id) REFERENCES public.templates(id) ON DELETE SET NULL;


--
-- Name: post_types post_types_single_template_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_types
    ADD CONSTRAINT post_types_single_template_id_foreign FOREIGN KEY (single_template_id) REFERENCES public.templates(id) ON DELETE SET NULL;


--
-- Name: posts posts_author_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_author_id_foreign FOREIGN KEY (author_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: posts posts_parent_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_parent_fk FOREIGN KEY (parent_id) REFERENCES public.posts(id) ON DELETE SET NULL;


--
-- Name: posts posts_post_type_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_post_type_id_foreign FOREIGN KEY (post_type_id) REFERENCES public.post_types(id) ON DELETE CASCADE;


--
-- Name: role_has_permissions role_has_permissions_permission_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_has_permissions
    ADD CONSTRAINT role_has_permissions_permission_id_foreign FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON DELETE CASCADE;


--
-- Name: role_has_permissions role_has_permissions_role_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_has_permissions
    ADD CONSTRAINT role_has_permissions_role_id_foreign FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: site_setting_translations site_setting_translations_site_setting_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_setting_translations
    ADD CONSTRAINT site_setting_translations_site_setting_id_foreign FOREIGN KEY (site_setting_id) REFERENCES public.site_settings(id) ON DELETE CASCADE;


--
-- Name: sitemap_setting_translations sitemap_setting_translations_sitemap_setting_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sitemap_setting_translations
    ADD CONSTRAINT sitemap_setting_translations_sitemap_setting_id_foreign FOREIGN KEY (sitemap_setting_id) REFERENCES public.sitemap_settings(id) ON DELETE CASCADE;


--
-- Name: taxonomy_term_translations taxonomy_term_translations_taxonomy_term_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.taxonomy_term_translations
    ADD CONSTRAINT taxonomy_term_translations_taxonomy_term_id_foreign FOREIGN KEY (taxonomy_term_id) REFERENCES public.taxonomy_terms(id) ON DELETE CASCADE;


--
-- Name: taxonomy_terms taxonomy_terms_parent_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.taxonomy_terms
    ADD CONSTRAINT taxonomy_terms_parent_fk FOREIGN KEY (parent_id) REFERENCES public.taxonomy_terms(id) ON DELETE SET NULL;


--
-- Name: taxonomy_terms taxonomy_terms_taxonomy_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.taxonomy_terms
    ADD CONSTRAINT taxonomy_terms_taxonomy_id_foreign FOREIGN KEY (taxonomy_id) REFERENCES public.taxonomies(id) ON DELETE CASCADE;


--
-- Name: taxonomy_translations taxonomy_translations_taxonomy_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.taxonomy_translations
    ADD CONSTRAINT taxonomy_translations_taxonomy_id_foreign FOREIGN KEY (taxonomy_id) REFERENCES public.taxonomies(id) ON DELETE CASCADE;


--
-- Name: templates templates_created_by_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.templates
    ADD CONSTRAINT templates_created_by_foreign FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: themes themes_installed_by_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.themes
    ADD CONSTRAINT themes_installed_by_foreign FOREIGN KEY (installed_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: themes themes_parent_theme_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.themes
    ADD CONSTRAINT themes_parent_theme_id_foreign FOREIGN KEY (parent_theme_id) REFERENCES public.themes(id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict qMWY4VKhT8UM88LfMWxf5NDN52gyf56guW7Z8tRLTAdSGMco9C1Pj1HihIAWGvm

