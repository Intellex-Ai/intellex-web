import { notFound } from 'next/navigation';
import { ProjectRealtime } from '@/components/project-realtime';
import { supabaseAdmin } from '@/lib/supabase/service';
import type { ProjectSnapshot, ProjectRow, SourceRow, ReportRow, ProfileRow } from '@/lib/projects/types';

interface ProjectPageProps {
  params: { id: string };
}

export const dynamic = 'force-dynamic';

export default async function ProjectPage({ params }: ProjectPageProps) {
  if (!params.id) {
    notFound();
  }

  const data = await loadProjectData(params.id);
  return <ProjectRealtime initial={data} />;
}

async function loadProjectData(projectId: string): Promise<ProjectSnapshot> {
  const [projectRes, sourcesRes, factsRes, verifiedFactsRes, reportRes] = await Promise.all([
    supabaseAdmin.from('projects').select('*').eq('id', projectId).single(),
    supabaseAdmin.from('sources').select('*').eq('project_id', projectId).order('created_at', { ascending: true }),
    supabaseAdmin.from('facts').select('id', { head: true, count: 'exact' }).eq('project_id', projectId),
    supabaseAdmin.from('facts').select('id', { head: true, count: 'exact' }).eq('project_id', projectId).eq('verified', true),
    supabaseAdmin.from('reports').select('*').eq('project_id', projectId).maybeSingle()
  ]);

  if (projectRes.error || !projectRes.data) {
    notFound();
  }

  const project = projectRes.data as ProjectRow;
  const sources = (sourcesRes.data ?? []) as SourceRow[];
  const report = (reportRes.data ?? null) as ReportRow | null;
  let profile: ProfileRow | null = null;

  if (project.profile_id) {
    const profileRes = await supabaseAdmin.from('profiles').select('*').eq('id', project.profile_id).maybeSingle();
    profile = (profileRes.data ?? null) as ProfileRow | null;
  }

  return {
    project,
    sources,
    factsCount: factsRes.count ?? 0,
    verifiedFactsCount: verifiedFactsRes.count ?? 0,
    report,
    profile
  };
}
