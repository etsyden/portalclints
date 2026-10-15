import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  getProject,
  getProjectHistory,
  type ProjectDetails,
  type ProjectEvent,
} from '../api/project';
import {
  getEventLabel,
  getVisibilityLabel,
} from '../utils/eventLabels';

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
  return new Date(date).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ProjectPage() {
  const { projectId } = useParams();

  const [project, setProject] = useState<ProjectDetails | null>(null);
  const [events, setEvents] = useState<ProjectEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!projectId) {
      setError('Идентификатор проекта не указан');
      setLoading(false);
      return;
    }

    const id = projectId;

    async function loadProject() {
      try {
        const [projectData, historyData] = await Promise.all([
          getProject(id),
          getProjectHistory(id),
        ]);

        setProject(projectData);
        setEvents(historyData);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : 'Не удалось загрузить проект',
        );
      } finally {
        setLoading(false);
      }
    }

    loadProject();
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <div className="text-sm text-slate-500">
          Загрузка проекта...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (!project) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        Проект не найден
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/projects"
          className="text-sm text-slate-500 transition hover:text-slate-900"
        >
          ← Все проекты
        </Link>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="mb-2 text-sm font-medium text-slate-400">
              Проект
            </div>

            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              {project.name}
            </h1>

            {project.description && (
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                {project.description}
              </p>
            )}
          </div>

          <div className="shrink-0">
            <span className="inline-flex rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700">
              {getStatusLabel(project.status)}
            </span>
          </div>
        </div>

        <div className="mt-6 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-3">
          <div>
            <div className="text-xs text-slate-400">
              Создан
            </div>

            <div className="mt-1 text-sm font-medium text-slate-700">
              {formatDate(project.createdAt)}
            </div>
          </div>

          <div>
            <div className="text-xs text-slate-400">
              Обновлён
            </div>

            <div className="mt-1 text-sm font-medium text-slate-700">
              {formatDate(project.updatedAt)}
            </div>
          </div>

          <div>
            <div className="text-xs text-slate-400">
              Событий в истории
            </div>

            <div className="mt-1 text-sm font-medium text-slate-700">
              {events.length}
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900">
            История проекта
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Все события, доступные вам в рамках проекта.
          </p>
        </div>

        {events.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <p className="text-sm text-slate-500">
              История пока пуста.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((event) => (
              <article
                key={event.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="font-medium text-slate-900">
                      {getEventLabel(event.eventType)}
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      {event.entityType}
                    </p>
                  </div>

                  <span className="w-fit rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                    {getVisibilityLabel(event.visibility)}
                  </span>
                </div>

                <div className="mt-4 flex flex-col gap-1 text-xs text-slate-400">
                  {event.actor && (
                    <span>
                      {event.actor.firstName} {event.actor.lastName}
                    </span>
                  )}

                  <span>{formatDate(event.createdAt)}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
