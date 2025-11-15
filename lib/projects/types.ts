import type { Database } from '@/types/database.types';

export type ProjectRow = Database['public']['Tables']['projects']['Row'];
export type SourceRow = Database['public']['Tables']['sources']['Row'];
export type ReportRow = Database['public']['Tables']['reports']['Row'];
export type ProfileRow = Database['public']['Tables']['profiles']['Row'];

export interface ProjectSnapshot {
  project: ProjectRow;
  sources: SourceRow[];
  factsCount: number;
  verifiedFactsCount: number;
  report: ReportRow | null;
  profile: ProfileRow | null;
}
