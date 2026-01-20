-- Table: public.events

-- DROP TABLE IF EXISTS public.events;

CREATE TABLE IF NOT EXISTS public.events
(
    event_id integer NOT NULL DEFAULT nextval('events_event_id_seq'::regclass),
    organizer_id integer,
    title character varying(100) COLLATE pg_catalog."default" NOT NULL,
    description text COLLATE pg_catalog."default",
    event_date timestamp without time zone NOT NULL,
    location character varying(255) COLLATE pg_catalog."default",
    is_completed boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    event_end timestamp without time zone,
    capacity integer,
    CONSTRAINT events_pkey PRIMARY KEY (event_id),
    CONSTRAINT events_organizer_id_fkey FOREIGN KEY (organizer_id)
        REFERENCES public.users (user_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.events
    OWNER to postgres;










-- Table: public.reviews

-- DROP TABLE IF EXISTS public.reviews;

CREATE TABLE IF NOT EXISTS public.reviews
(
    review_id integer NOT NULL DEFAULT nextval('reviews_review_id_seq'::regclass),
    event_id integer,
    user_id integer,
    rating integer,
    comment text COLLATE pg_catalog."default",
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT reviews_pkey PRIMARY KEY (review_id),
    CONSTRAINT reviews_event_id_fkey FOREIGN KEY (event_id)
        REFERENCES public.events (event_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
    CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id)
        REFERENCES public.users (user_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT reviews_rating_check CHECK (rating >= 1 AND rating <= 5)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.reviews
    OWNER to postgres;







-- Table: public.signups

-- DROP TABLE IF EXISTS public.signups;

CREATE TABLE IF NOT EXISTS public.signups
(
    signup_id integer NOT NULL DEFAULT nextval('signups_signup_id_seq'::regclass),
    volunteer_id integer,
    event_id integer,
    status character varying(50) COLLATE pg_catalog."default" DEFAULT 'registered'::character varying,
    hours_awarded numeric(5,2) DEFAULT 0,
    signup_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    check_in_time timestamp without time zone,
    check_out_time timestamp without time zone,
    CONSTRAINT signups_pkey PRIMARY KEY (signup_id),
    CONSTRAINT signups_volunteer_id_event_id_key UNIQUE (volunteer_id, event_id),
    CONSTRAINT signups_event_id_fkey FOREIGN KEY (event_id)
        REFERENCES public.events (event_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT signups_volunteer_id_fkey FOREIGN KEY (volunteer_id)
        REFERENCES public.users (user_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.signups
    OWNER to postgres;








    -- Table: public.users

-- DROP TABLE IF EXISTS public.users;

CREATE TABLE IF NOT EXISTS public.users
(
    user_id integer NOT NULL DEFAULT nextval('users_user_id_seq'::regclass),
    email character varying(255) COLLATE pg_catalog."default" NOT NULL,
    password_hash character varying(255) COLLATE pg_catalog."default" NOT NULL,
    full_name character varying(255) COLLATE pg_catalog."default" NOT NULL,
    role character varying(50) COLLATE pg_catalog."default" NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_pkey PRIMARY KEY (user_id),
    CONSTRAINT users_email_key UNIQUE (email),
    CONSTRAINT users_role_check CHECK (role::text = ANY (ARRAY['volunteer'::character varying, 'organization'::character varying]::text[]))
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.users
    OWNER to postgres;