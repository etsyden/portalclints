import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getProjects, type Project } from '../api/projects';

function getStatusLabel(status: string): string {
  switch (status) {
    case 'DRAFT':
      return 'Черновик';

    case 'ACTIVE':
      return 'В работе';

    case 'PAUSED':
      return 'Приостановлен';

    case 'COMPLETED':
      return 'Завершён';

    case 'ARCHIVED':
      return 'Архив';

    default:
      return status;
  }
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadProjects() {
      try {
        const data = await getProjects();
        setProjects(data);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : 'Не удалось загрузить проекты',
        );
      } finally {
        setLoading(false);
      }
    }

    loadProjects();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-sm text-slate-500">
          Загрузка проектов...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="mx-auto max-w-[2000px] rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-[2000px] items-center justify-between px-6">
          <div className="text-lg font-semibold text-slate-900">
            Рабочее пространство
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm font-medium text-slate-600">
              Е
            </div>

            <div className="text-sm font-medium text-slate-700">
              Евгений Цыден
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[2000px] px-6 py-10">
        <div className="mb-8">
          <div className="text-sm font-medium text-slate-400">
            Рабочее пространство
          </div>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">
            Проекты
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Здесь находятся проекты, к которым у вас есть доступ.
          </p>
        </div>

        {projects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <h2 className="text-base font-medium text-slate-900">
              Проектов пока нет
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Когда вам предоставят доступ к проекту, он появится здесь.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {projects.map((project) => (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 group-hover:text-slate-700">
                      {project.name}
                    </h2>

                    {project.description && (
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        {project.description}
                      </p>
                    )}
                  </div>

                  <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                    {getStatusLabel(project.status)}
                  </span>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="text-xs text-slate-400">
                    Обновлён {formatDate(project.updatedAt)}
                  </span>

                  <span className="text-sm font-medium text-slate-700 transition group-hover:translate-x-0.5">
                    Открыть →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
