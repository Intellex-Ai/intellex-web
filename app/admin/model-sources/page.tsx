import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase/service';
import type { ModelSourceRecord } from '@/lib/model-sources/registry';

export const dynamic = 'force-dynamic';

export default async function AdminModelSourcesPage() {
  const { data } = await supabaseAdmin.from('model_sources').select('*').order('priority', { ascending: false });
  const rows = (data ?? []) as ModelSourceRecord[];

  return (
    <section className="space-y-6">
      <article className="space-y-4">
        {rows.map((row) => (
          <details key={row.id} className="rounded-3xl border border-white/10 bg-white/5 p-4" open>
            <summary className="cursor-pointer text-lg font-semibold text-white">
              {row.vendor} — {row.model_name}
            </summary>
            <form action={updateModelSource} className="mt-4 grid gap-4 md:grid-cols-2">
              <input type="hidden" name="id" value={row.id} />
              <Field label="Primary URL">
                <input
                  name="primary_url"
                  defaultValue={row.primary_url}
                  required
                  className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white focus:border-white/40 focus:outline-none"
                />
              </Field>
              <Field label="Docs URL">
                <input
                  name="docs_url"
                  defaultValue={row.docs_url ?? ''}
                  className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white focus:border-white/40 focus:outline-none"
                />
              </Field>
              <Field label="RSS URL">
                <input
                  name="rss_url"
                  defaultValue={row.rss_url ?? ''}
                  className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white focus:border-white/40 focus:outline-none"
                />
              </Field>
              <Field label="API ref">
                <input
                  name="api_ref"
                  defaultValue={row.api_ref ?? ''}
                  className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white focus:border-white/40 focus:outline-none"
                />
              </Field>
              <Field label="Keywords (comma or newline)">
                <textarea
                  name="keywords"
                  defaultValue={(row.keywords ?? []).join(', ')}
                  rows={3}
                  className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white focus:border-white/40 focus:outline-none"
                />
              </Field>
              <Field label="Fallback queries">
                <textarea
                  name="fallback_queries"
                  defaultValue={(row.fallback_queries ?? []).join(', ')}
                  rows={3}
                  className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white focus:border-white/40 focus:outline-none"
                />
              </Field>
              <Field label="Mirror templates">
                <textarea
                  name="mirrors"
                  defaultValue={(row.mirrors ?? []).join(', ')}
                  rows={3}
                  className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white focus:border-white/40 focus:outline-none"
                />
              </Field>
              <Field label="Mirrored assets">
                <textarea
                  name="mirrored_assets"
                  defaultValue={(row.mirrored_assets ?? []).join(', ')}
                  rows={3}
                  className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white focus:border-white/40 focus:outline-none"
                />
              </Field>
              <Field label="Press PDFs">
                <textarea
                  name="press_pdfs"
                  defaultValue={(row.press_pdfs ?? []).join(', ')}
                  rows={3}
                  className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white focus:border-white/40 focus:outline-none"
                />
              </Field>
              <Field label="Priority">
                <input
                  name="priority"
                  type="number"
                  defaultValue={row.priority ?? 0}
                  className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white focus:border-white/40 focus:outline-none"
                  min={0}
                  max={10}
                />
              </Field>
              <Field label="Freshness (hours)">
                <input
                  name="freshness_interval_hours"
                  type="number"
                  defaultValue={row.freshness_interval_hours ?? 168}
                  className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white focus:border-white/40 focus:outline-none"
                  min={1}
                />
              </Field>
              <label className="flex items-center gap-2 text-sm text-white/80">
                <input type="checkbox" name="needs_proxy" defaultChecked={row.needs_proxy ?? false} />
                Needs proxy tier
              </label>
              <button type="submit" className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20 md:col-span-2">
                Save changes
              </button>
            </form>
          </details>
        ))}
      </article>

      <article className="rounded-3xl border border-dashed border-white/20 bg-white/5 p-4">
        <p className="text-lg font-semibold text-white">Add new model source</p>
        <form action={createModelSource} className="mt-4 grid gap-3 md:grid-cols-2">
          <Field label="Vendor">
            <input
              name="vendor"
              required
              className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white focus:border-white/40 focus:outline-none"
            />
          </Field>
          <Field label="Model name">
            <input
              name="model_name"
              required
              className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white focus:border-white/40 focus:outline-none"
            />
          </Field>
          <Field label="Primary URL">
            <input
              name="primary_url"
              required
              className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white focus:border-white/40 focus:outline-none"
            />
          </Field>
          <Field label="Docs URL">
            <input
              name="docs_url"
              className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white focus:border-white/40 focus:outline-none"
            />
          </Field>
          <Field label="Keywords">
            <textarea
              name="keywords"
              rows={3}
              className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white focus:border-white/40 focus:outline-none"
            />
          </Field>
          <Field label="Fallback queries">
            <textarea
              name="fallback_queries"
              rows={3}
              className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white focus:border-white/40 focus:outline-none"
            />
          </Field>
          <Field label="Mirror templates">
            <textarea
              name="mirrors"
              rows={3}
              className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white focus:border-white/40 focus:outline-none"
            />
          </Field>
          <Field label="Mirrored assets">
            <textarea
              name="mirrored_assets"
              rows={3}
              className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white focus:border-white/40 focus:outline-none"
            />
          </Field>
          <label className="flex items-center gap-2 text-sm text-white/80">
            <input type="checkbox" name="needs_proxy" />
            Needs proxy tier
          </label>
          <Field label="Priority">
            <input
              name="priority"
              type="number"
              defaultValue={5}
              className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white focus:border-white/40 focus:outline-none"
            />
          </Field>
          <button type="submit" className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20 md:col-span-2">
            Create model entry
          </button>
        </form>
      </article>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm text-white/80">
      <span className="uppercase tracking-[0.3em] text-xs text-white/50">{label}</span>
      {children}
    </label>
  );
}

async function updateModelSource(formData: FormData) {
  'use server';
  const id = String(formData.get('id'));
  const payload = {
    primary_url: String(formData.get('primary_url') ?? ''),
    docs_url: nullableString(formData.get('docs_url')),
    rss_url: nullableString(formData.get('rss_url')),
    api_ref: nullableString(formData.get('api_ref')),
    keywords: parseList(formData.get('keywords')),
    fallback_queries: parseList(formData.get('fallback_queries')),
    mirrors: parseList(formData.get('mirrors')),
    mirrored_assets: parseList(formData.get('mirrored_assets')),
    press_pdfs: parseList(formData.get('press_pdfs')),
    priority: Number(formData.get('priority') ?? 0),
    freshness_interval_hours: Number(formData.get('freshness_interval_hours') ?? 168),
    needs_proxy: Boolean(formData.get('needs_proxy'))
  };

  await supabaseAdmin.from('model_sources').update(payload).eq('id', id);
  revalidatePath('/admin/model-sources');
}

async function createModelSource(formData: FormData) {
  'use server';
  const payload = {
    vendor: String(formData.get('vendor') ?? ''),
    model_name: String(formData.get('model_name') ?? ''),
    primary_url: String(formData.get('primary_url') ?? ''),
    docs_url: nullableString(formData.get('docs_url')),
    keywords: parseList(formData.get('keywords')),
    fallback_queries: parseList(formData.get('fallback_queries')),
    mirrors: parseList(formData.get('mirrors')),
    mirrored_assets: parseList(formData.get('mirrored_assets')),
    needs_proxy: Boolean(formData.get('needs_proxy')),
    priority: Number(formData.get('priority') ?? 5)
  };

  await supabaseAdmin.from('model_sources').insert(payload);
  revalidatePath('/admin/model-sources');
}

function parseList(value: FormDataEntryValue | null) {
  if (!value) return [];
  return value
    .toString()
    .split(/[\n,]+/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function nullableString(value: FormDataEntryValue | null) {
  const str = value?.toString().trim();
  return str ? str : null;
}
