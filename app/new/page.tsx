import { ProjectForm } from '@/components/project-form';

export default function NewProjectPage() {
  return (
    <main className="flex flex-col gap-8">
      <header className="space-y-3">
        <p className="text-sm uppercase tracking-[0.35em] text-white/60">Project setup</p>
        <h1 className="text-4xl font-semibold text-white">Describe the brief Intellex should run.</h1>
        <p className="text-lg text-white/70">
          Intellex Planner converts your goal into a task graph, Browser gathers sources via AWS Lambda, Extractor captures
          facts + quotes, and Synthesizer produces a cited markdown report. Queue your first run below—every step runs on hosted
          GPT-4o mini, Claude 3 Haiku, Gemini Flash, Groq Llama 3.1, Together Mixtral, or OpenRouter fallbacks, never a local model.
        </p>
      </header>

      <section className="rounded-[40px] border border-white/10 bg-white/5 p-8 shadow-2xl">
        <ProjectForm />
      </section>
    </main>
  );
}
