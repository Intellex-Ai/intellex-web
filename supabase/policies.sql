-- Enable RLS on all relevant tables
ALTER TABLE projects       ENABLE ROW LEVEL SECURITY;
ALTER TABLE sources        ENABLE ROW LEVEL SECURITY;
ALTER TABLE facts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports        ENABLE ROW LEVEL SECURITY;
ALTER TABLE source_chunks  ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_sources  ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE scrape_events  ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles      ENABLE ROW LEVEL SECURITY;

-- Projects are owned by user
CREATE POLICY "Projects are owned by user or public"
ON projects
FOR ALL
USING (user_id = auth.uid() OR user_id IS NULL)
WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- Sources inherit project ownership
CREATE POLICY "Sources inherit project ownership"
ON sources
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = sources.project_id
      AND (projects.user_id = auth.uid() OR projects.user_id IS NULL)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = sources.project_id
      AND (projects.user_id = auth.uid() OR projects.user_id IS NULL)
  )
);

-- Facts inherit project ownership
CREATE POLICY "Facts inherit project ownership"
ON facts
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = facts.project_id
      AND (projects.user_id = auth.uid() OR projects.user_id IS NULL)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = facts.project_id
      AND (projects.user_id = auth.uid() OR projects.user_id IS NULL)
  )
);

-- Reports inherit project ownership
CREATE POLICY "Reports inherit project ownership"
ON reports
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = reports.project_id
      AND (projects.user_id = auth.uid() OR projects.user_id IS NULL)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = reports.project_id
      AND (projects.user_id = auth.uid() OR projects.user_id IS NULL)
  )
);

-- Source chunks inherit project ownership
CREATE POLICY "Chunks inherit project ownership"
ON source_chunks
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = source_chunks.project_id
      AND (projects.user_id = auth.uid() OR projects.user_id IS NULL)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = source_chunks.project_id
      AND (projects.user_id = auth.uid() OR projects.user_id IS NULL)
  )
);

-- Model sources are readable by all authenticated users
CREATE POLICY "Model sources readable"
ON model_sources
FOR SELECT
USING (true);

-- Model releases are readable by all authenticated users
CREATE POLICY "Model releases readable"
ON model_releases
FOR SELECT
USING (true);

-- Scrape events inherit project ownership
CREATE POLICY "Scrape events inherit project ownership"
ON scrape_events
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = scrape_events.project_id
      AND (projects.user_id = auth.uid() OR projects.user_id IS NULL)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = scrape_events.project_id
      AND (projects.user_id = auth.uid() OR projects.user_id IS NULL)
  )
);

-- Profiles are owned by user
CREATE POLICY "Profiles are owned by user"
ON profiles
FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
