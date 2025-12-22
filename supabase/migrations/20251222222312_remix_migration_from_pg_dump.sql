CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";
CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql" WITH SCHEMA "pg_catalog";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
BEGIN;

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'user'
);


--
-- Name: get_room_participants(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_room_participants(room_id_param text) RETURNS TABLE(id uuid, room_id text, user_id uuid, user_name text, joined_at timestamp with time zone, left_at timestamp with time zone)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Only return data if caller is authenticated and is a participant in this room
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;
  
  -- Check if user is admin or participant in this room
  IF NOT (
    is_admin() OR 
    EXISTS (SELECT 1 FROM meeting_participants mp WHERE mp.room_id = room_id_param AND mp.user_id = auth.uid())
  ) THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT 
    mp.id,
    mp.room_id,
    mp.user_id,
    mp.user_name,
    mp.joined_at,
    mp.left_at
  FROM meeting_participants mp
  WHERE mp.room_id = room_id_param;
END;
$$;


--
-- Name: get_safe_participants_for_room(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_safe_participants_for_room(room_id_param text) RETURNS TABLE(id uuid, room_id text, user_id uuid, user_name text, joined_at timestamp with time zone, left_at timestamp with time zone)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT 
    mp.id,
    mp.room_id,
    mp.user_id,
    mp.user_name,
    mp.joined_at,
    mp.left_at
  FROM meeting_participants mp
  WHERE mp.room_id = room_id_param
    AND (
      mp.user_id = auth.uid() 
      OR EXISTS (SELECT 1 FROM meeting_participants mp2 WHERE mp2.room_id = room_id_param AND mp2.user_id = auth.uid())
      OR is_admin()
    )
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;


--
-- Name: is_admin(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_admin() RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  )
$$;


--
-- Name: is_room_participant(text, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_room_participant(check_room_id text, check_user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.meeting_participants
    WHERE room_id = check_room_id
      AND user_id = check_user_id
  )
$$;


--
-- Name: search_profile_by_username(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.search_profile_by_username(search_username text) RETURNS TABLE(user_id uuid, display_name text, username text, avatar_url text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Only return exact match to prevent enumeration
  RETURN QUERY
  SELECT 
    p.user_id,
    p.display_name,
    p.username,
    p.avatar_url
  FROM public.profiles p
  WHERE p.username = lower(trim(search_username))
  LIMIT 1;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: backup_codes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.backup_codes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    code_hash text NOT NULL,
    used boolean DEFAULT false NOT NULL,
    used_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: contacts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contacts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    contact_user_id uuid NOT NULL,
    nickname text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: meeting_participants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.meeting_participants (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    room_id text NOT NULL,
    user_name text NOT NULL,
    joined_at timestamp with time zone DEFAULT now() NOT NULL,
    left_at timestamp with time zone,
    user_id uuid
);


--
-- Name: meeting_transcripts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.meeting_transcripts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    room_id text NOT NULL,
    room_name text NOT NULL,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    ended_at timestamp with time zone,
    transcript text,
    summary text,
    key_points jsonb,
    participants jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    owner_user_id uuid
);


--
-- Name: news; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.news (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    source text,
    url text,
    published_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    language text DEFAULT 'en'::text NOT NULL
);

ALTER TABLE ONLY public.news REPLICA IDENTITY FULL;


--
-- Name: participant_geo_data; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.participant_geo_data (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    participant_id uuid NOT NULL,
    ip_address text,
    city text,
    country text,
    country_code text,
    region text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    display_name text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    username text,
    avatar_url text,
    CONSTRAINT username_format CHECK (((username IS NULL) OR (username ~ '^[a-z0-9_]{3,20}$'::text)))
);


--
-- Name: site_analytics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.site_analytics (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_type text NOT NULL,
    event_data jsonb DEFAULT '{}'::jsonb,
    user_id uuid,
    session_id text,
    page_path text,
    referrer text,
    user_agent text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: translation_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.translation_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    room_id text,
    original_text text NOT NULL,
    translated_text text NOT NULL,
    source_language text,
    target_language text NOT NULL,
    voice_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_presence; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_presence (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    is_online boolean DEFAULT false NOT NULL,
    last_seen timestamp with time zone DEFAULT now() NOT NULL,
    current_room text
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role NOT NULL
);


--
-- Name: backup_codes backup_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.backup_codes
    ADD CONSTRAINT backup_codes_pkey PRIMARY KEY (id);


--
-- Name: contacts contacts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_pkey PRIMARY KEY (id);


--
-- Name: contacts contacts_user_id_contact_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_user_id_contact_user_id_key UNIQUE (user_id, contact_user_id);


--
-- Name: meeting_participants meeting_participants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meeting_participants
    ADD CONSTRAINT meeting_participants_pkey PRIMARY KEY (id);


--
-- Name: meeting_transcripts meeting_transcripts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meeting_transcripts
    ADD CONSTRAINT meeting_transcripts_pkey PRIMARY KEY (id);


--
-- Name: news news_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.news
    ADD CONSTRAINT news_pkey PRIMARY KEY (id);


--
-- Name: participant_geo_data participant_geo_data_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.participant_geo_data
    ADD CONSTRAINT participant_geo_data_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);


--
-- Name: profiles profiles_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_username_key UNIQUE (username);


--
-- Name: site_analytics site_analytics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_analytics
    ADD CONSTRAINT site_analytics_pkey PRIMARY KEY (id);


--
-- Name: translation_history translation_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.translation_history
    ADD CONSTRAINT translation_history_pkey PRIMARY KEY (id);


--
-- Name: contacts unique_user_contact; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT unique_user_contact UNIQUE (user_id, contact_user_id);


--
-- Name: user_presence user_presence_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_presence
    ADD CONSTRAINT user_presence_pkey PRIMARY KEY (id);


--
-- Name: user_presence user_presence_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_presence
    ADD CONSTRAINT user_presence_user_id_key UNIQUE (user_id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: idx_backup_codes_lookup; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_backup_codes_lookup ON public.backup_codes USING btree (user_id, used);


--
-- Name: idx_backup_codes_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_backup_codes_user_id ON public.backup_codes USING btree (user_id);


--
-- Name: idx_news_language; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_news_language ON public.news USING btree (language);


--
-- Name: idx_news_language_published; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_news_language_published ON public.news USING btree (language, published_at DESC);


--
-- Name: idx_news_published_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_news_published_at ON public.news USING btree (published_at DESC);


--
-- Name: idx_profiles_username; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_username ON public.profiles USING btree (username);


--
-- Name: idx_site_analytics_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_site_analytics_created_at ON public.site_analytics USING btree (created_at DESC);


--
-- Name: idx_site_analytics_event_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_site_analytics_event_type ON public.site_analytics USING btree (event_type);


--
-- Name: idx_site_analytics_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_site_analytics_user_id ON public.site_analytics USING btree (user_id);


--
-- Name: idx_translation_history_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_translation_history_created_at ON public.translation_history USING btree (created_at DESC);


--
-- Name: idx_translation_history_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_translation_history_user_id ON public.translation_history USING btree (user_id);


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: meeting_transcripts meeting_transcripts_owner_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meeting_transcripts
    ADD CONSTRAINT meeting_transcripts_owner_user_id_fkey FOREIGN KEY (owner_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: profiles profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: site_analytics Admins can delete analytics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete analytics" ON public.site_analytics FOR DELETE USING (public.is_admin());


--
-- Name: meeting_participants Admins can delete participant records; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete participant records" ON public.meeting_participants FOR DELETE TO authenticated USING (public.is_admin());


--
-- Name: meeting_transcripts Admins can delete transcripts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete transcripts" ON public.meeting_transcripts FOR DELETE TO authenticated USING (public.is_admin());


--
-- Name: site_analytics Admins can view all analytics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all analytics" ON public.site_analytics FOR SELECT USING (public.is_admin());


--
-- Name: meeting_participants Admins can view all participant data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all participant data" ON public.meeting_participants FOR SELECT USING (public.is_admin());


--
-- Name: profiles Admins can view all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.is_admin());


--
-- Name: translation_history Admins can view all translations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all translations" ON public.translation_history FOR SELECT USING (public.is_admin());


--
-- Name: participant_geo_data Insert geo data for own participants only; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Insert geo data for own participants only" ON public.participant_geo_data FOR INSERT WITH CHECK ((public.is_admin() OR (EXISTS ( SELECT 1
   FROM public.meeting_participants mp
  WHERE ((mp.id = participant_geo_data.participant_id) AND (mp.user_id = auth.uid()))))));


--
-- Name: news News are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "News are viewable by everyone" ON public.news FOR SELECT USING (true);


--
-- Name: participant_geo_data Only admins can delete geo data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only admins can delete geo data" ON public.participant_geo_data FOR DELETE USING (public.is_admin());


--
-- Name: news Only admins can delete news; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only admins can delete news" ON public.news FOR DELETE TO authenticated USING (public.is_admin());


--
-- Name: user_roles Only admins can delete roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only admins can delete roles" ON public.user_roles FOR DELETE TO authenticated USING (public.is_admin());


--
-- Name: news Only admins can insert news; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only admins can insert news" ON public.news FOR INSERT TO authenticated WITH CHECK (public.is_admin());


--
-- Name: user_roles Only admins can insert roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only admins can insert roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.is_admin());


--
-- Name: news Only admins can update news; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only admins can update news" ON public.news FOR UPDATE TO authenticated USING (public.is_admin());


--
-- Name: user_roles Only admins can update roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only admins can update roles" ON public.user_roles FOR UPDATE TO authenticated USING (public.is_admin());


--
-- Name: participant_geo_data Only admins can view geo data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only admins can view geo data" ON public.participant_geo_data FOR SELECT USING (public.is_admin());


--
-- Name: meeting_transcripts Owner can insert transcripts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owner can insert transcripts" ON public.meeting_transcripts FOR INSERT TO authenticated WITH CHECK ((auth.uid() = owner_user_id));


--
-- Name: meeting_transcripts Owner or admin can update transcripts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owner or admin can update transcripts" ON public.meeting_transcripts FOR UPDATE TO authenticated USING (((auth.uid() = owner_user_id) OR public.is_admin()));


--
-- Name: contacts Users can add their own contacts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can add their own contacts" ON public.contacts FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: backup_codes Users can delete their own backup codes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own backup codes" ON public.backup_codes FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: contacts Users can delete their own contacts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own contacts" ON public.contacts FOR DELETE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: user_presence Users can delete their own presence; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own presence" ON public.user_presence FOR DELETE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: profiles Users can delete their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own profile" ON public.profiles FOR DELETE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: translation_history Users can delete their own translations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own translations" ON public.translation_history FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: backup_codes Users can insert their own backup codes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own backup codes" ON public.backup_codes FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: meeting_participants Users can insert their own participant record; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own participant record" ON public.meeting_participants FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_presence Users can insert their own presence; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own presence" ON public.user_presence FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: profiles Users can insert their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: translation_history Users can insert their own translations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own translations" ON public.translation_history FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: site_analytics Users can only insert their own analytics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can only insert their own analytics" ON public.site_analytics FOR INSERT WITH CHECK (((auth.uid() IS NOT NULL) AND ((user_id IS NULL) OR (user_id = auth.uid()))));


--
-- Name: backup_codes Users can update their own backup codes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own backup codes" ON public.backup_codes FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: contacts Users can update their own contacts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own contacts" ON public.contacts FOR UPDATE TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: meeting_participants Users can update their own participant record; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own participant record" ON public.meeting_participants FOR UPDATE TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_presence Users can update their own presence; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own presence" ON public.user_presence FOR UPDATE TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: profiles Users can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: meeting_participants Users can view participants in their rooms; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view participants in their rooms" ON public.meeting_participants FOR SELECT USING (((auth.uid() = user_id) OR public.is_admin() OR public.is_room_participant(room_id, auth.uid())));


--
-- Name: user_presence Users can view presence of their contacts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view presence of their contacts" ON public.user_presence FOR SELECT TO authenticated USING (((auth.uid() = user_id) OR (EXISTS ( SELECT 1
   FROM public.contacts
  WHERE ((contacts.user_id = auth.uid()) AND (contacts.contact_user_id = user_presence.user_id))))));


--
-- Name: profiles Users can view profiles of their contacts and own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view profiles of their contacts and own" ON public.profiles FOR SELECT USING (((auth.uid() = user_id) OR (EXISTS ( SELECT 1
   FROM public.contacts
  WHERE ((contacts.user_id = auth.uid()) AND (contacts.contact_user_id = profiles.user_id))))));


--
-- Name: backup_codes Users can view their own backup codes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own backup codes" ON public.backup_codes FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: contacts Users can view their own contacts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own contacts" ON public.contacts FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: user_roles Users can view their own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: translation_history Users can view their own translations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own translations" ON public.translation_history FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: meeting_transcripts View own or participated transcripts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "View own or participated transcripts" ON public.meeting_transcripts FOR SELECT TO authenticated USING ((public.is_admin() OR (owner_user_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.meeting_participants mp
  WHERE ((mp.room_id = meeting_transcripts.room_id) AND (mp.user_id = auth.uid()))))));


--
-- Name: backup_codes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.backup_codes ENABLE ROW LEVEL SECURITY;

--
-- Name: contacts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

--
-- Name: meeting_participants; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.meeting_participants ENABLE ROW LEVEL SECURITY;

--
-- Name: meeting_transcripts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.meeting_transcripts ENABLE ROW LEVEL SECURITY;

--
-- Name: news; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;

--
-- Name: participant_geo_data; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.participant_geo_data ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: site_analytics; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.site_analytics ENABLE ROW LEVEL SECURITY;

--
-- Name: translation_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.translation_history ENABLE ROW LEVEL SECURITY;

--
-- Name: user_presence; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--




COMMIT;