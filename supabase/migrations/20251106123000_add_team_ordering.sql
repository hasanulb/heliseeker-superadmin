ALTER TABLE public.teams
ADD COLUMN order_index INTEGER;

WITH ordered_teams AS (
  SELECT
    team_id,
    ROW_NUMBER() OVER (ORDER BY created_at) as row_num
  FROM public.teams
)
UPDATE public.teams
SET order_index = ordered_teams.row_num
FROM ordered_teams
WHERE public.teams.team_id = ordered_teams.team_id;

ALTER TABLE public.teams
ALTER COLUMN order_index SET NOT NULL,
ALTER COLUMN order_index SET DEFAULT 999999;

CREATE INDEX idx_teams_order_index ON public.teams(order_index);

COMMENT ON COLUMN public.teams.order_index IS 'Order index for manual sorting of team members. Lower values appear first.';
