BEGIN;

CREATE TABLE IF NOT EXISTS public.comments
(
    comment_id SERIAL PRIMARY KEY,
    event_id integer NOT NULL REFERENCES public.events(event_id) ON DELETE CASCADE,
    user_id integer NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    content text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

COMMIT;
