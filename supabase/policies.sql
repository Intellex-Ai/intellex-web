-- Enable RLS on all relevant tables
ALTER TABLE projects       ENABLE ROW LEVEL SECURITY;
ALTER TABLE sources        ENABLE ROW LEVEL SECURITY;
ALTER TABLE facts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports        ENABLE ROW LEVEL SECURITY;
ALTER TABLE source_chunks  ENABLE ROW LEVEL SECURITY;

-- Projects are owned by user
CREATE POLICY "Projects are owned by user"
ON projects
FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Sources inherit project ownership
CREATE POLICY "Sources inherit project ownership"
ON sources
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = sources.project_id
      AND projects.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = sources.project_id
      AND projects.user_id = auth.uid()
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
      AND projects.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = facts.project_id
      AND projects.user_id = auth.uid()
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
      AND projects.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = reports.project_id
      AND projects.user_id = auth.uid()
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
      AND projects.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = source_chunks.project_id
      AND projects.user_id = auth.uid()
  )
);
