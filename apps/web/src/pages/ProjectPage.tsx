import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FolderOpen,
  History,
  MessageSquare,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
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
      return 'В архиве';
    default:
      return status;
  }
}

function getStatusStyle(status: string): string {
  switch (status) {
    case 'ACTIVE':
      return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20';
    case 'COMPLETED':
      return 'bg-blue-50 text-blue-700 ring-blue-600/20';
    case 'PAUSED':
      return 'bg-amber-50 text-amber-700 ring-amber-600/20';
    default:
      return 'bg-slate-100 text-slate-600 ring-slate-500/10';
  }
}

function formatDate(date: string): string {
  return new Date(date).toLocaleString('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatShortDate(date: string): string {
  return new Date(date).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

interface QuickLink {
  label: string;
  description: string;
  path: string;
  icon: LucideIcon;
  iconStyle: string;
}

const quickLinks: QuickLink[] = [
  {
    label: 'Запросы',
    description: 'Вопросы и задачи по проекту',
    path: 'requests',
    icon: MessageSquare,
    iconStyle: 'bg-violet-50 text-violet-600',
  },
  {
    label: 'Материалы',
    description: 'Файлы и версии материалов',
    path: 'materials',
    icon: FolderOpen,
    iconStyle: 'bg-sky-50 text-sky-600',
  },
  {
    label: 'Согласования',
    description: 'Решения и обратная связь',
    path: 'approvals',
    icon: CheckCircle2,
    iconStyle: 'bg-emerald-50 text-emerald-600',
  },
  {
    label: 'Сообщения',
    description: 'Общение по проекту',
    path: 'messages',
    icon: MessageSquare,
    iconStyle: 'bg-amber-50 text-amber-600',
  },
];

export default function ProjectPage() {
  const { projectId } = useParams();

  const [project, setProject] = useState<ProjectDetails | null>(null);
  const [events, setEvents] = useState<ProjectEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!projectId) {
      setError('Идентификатор проекта не указан');
      setLoading(false);
      return;
    }

    let cancelled = false;
    const id = projectId;

    async function loadProject() {
      setLoading(true);
      setError('');

      try {
        const [projectData, historyData] = await Promise.all([
          getProject(id),
          getProjectHistory(id),
        ]);

        if (!cancelled) {
          setProject(projectData);
          setEvents(historyData);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Не удалось загрузить проект',
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadProject();

    return () => {
      cancelled = true;
    };
  }, [projectId, reloadKey]);

  if (loading && !project) {
    return (
      <div className="flex min-h-[360px] items-center justify-center">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <RefreshCw className="animate-spin text-slate-400" size={18} />
          <span className="text-sm text-slate-500">Загружаем рабочее пространство...</span>
        </div>
      </div>
    );
  }

  if (error && !project) {
    return (
      <div className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-red-50 p-2 text-red-600">
            <ShieldCheck size={20} />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-slate-900">Не удалось загрузить проект</h2>
            <p className="mt-1 text-sm text-slate-500">{error}</p>
            <button
              type="button"
              onClick={() => setReloadKey((value) => value + 1)}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
            >
              <RefreshCw size={15} />
              Попробовать снова
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <h2 className="font-semibold text-slate-900">Проект не найден</h2>
        <Link to="/projects" className="mt-3 inline-flex text-sm text-slate-600 hover:text-slate-900">
          Вернуться ко всем проектам
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/projects"
          className="inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-slate-900"
        >
          <ArrowLeft size={16} />
          Все проекты
        </Link>

        <button
          type="button"
          onClick={() => setReloadKey((value) => value + 1)}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900 disabled:opacity-50"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Обновить данные
        </button>
      </div>

      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-violet-500 to-sky-400" />
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-blue-100/60 blur-3xl" />
        <div className="pointer-events-none absolute right-48 top-20 h-40 w-40 rounded-full bg-violet-100/50 blur-3xl" />

        <div className="relative p-6 sm:p-8 lg:p-9">
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
            <Sparkles size={15} className="text-violet-500" />
            Рабочее пространство проекта
          </div>

          <div className="mt-5 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div className="max-w-3xl">
              <div className="mb-3">
                <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${getStatusStyle(project.status)}`}>
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {getStatusLabel(project.status)}
                </span>
              </div>

              <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                {project.name}
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
                {project.description || 'Здесь собраны материалы, согласования и коммуникация по проекту.'}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm backdrop-blur">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white">
                <CalendarDays size={20} />
              </div>
              <div>
                <div className="text-xs text-slate-400">Проект создан</div>
                <div className="mt-1 text-sm font-semibold text-slate-800">
                  {formatShortDate(project.createdAt)}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-3 border-t border-slate-100 pt-6 sm:grid-cols-3">
            <div className="rounded-2xl bg-slate-50/80 p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                <History size={15} />
                События в истории
              </div>
              <div className="mt-2 flex items-end gap-2">
                <span className="text-3xl font-semibold tracking-tight text-slate-900">{events.length}</span>
                <span className="mb-1 text-xs text-slate-400">записей</span>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50/80 p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                <Clock3 size={15} />
                Последнее обновление
              </div>
              <div className="mt-2 text-sm font-semibold text-slate-900">
                {formatShortDate(project.updatedAt)}
              </div>
              <div className="mt-1 text-xs text-slate-400">
                {new Date(project.updatedAt).toLocaleTimeString('ru-RU', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50/80 p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                <ShieldCheck size={15} />
                Видимость данных
              </div>
              <div className="mt-2 text-sm font-semibold text-slate-900">
                По ролям проекта
              </div>
              <div className="mt-1 text-xs text-slate-400">
                Клиент видит доступную ему историю
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">
              Разделы проекта
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Быстрый доступ к материалам и совместной работе.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {quickLinks.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.label}
                to={`/projects/${projectId}/${item.path}`}
                className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${item.iconStyle}`}>
                    <Icon size={20} strokeWidth={1.8} />
                  </div>
                  <ArrowRight size={17} className="mt-1 text-slate-300 transition group-hover:translate-x-1 group-hover:text-slate-700" />
                </div>

                <h3 className="mt-5 font-semibold text-slate-900">{item.label}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-500">{item.description}</p>
              </Link>
            );
          })}
        </div>
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">
              Последние события
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Хронология действий в рамках проекта.
            </p>
          </div>

          <Link
            to={`/projects/${projectId}/history`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 transition hover:text-slate-950"
          >
            Вся история
            <ArrowRight size={15} />
          </Link>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Не удалось обновить данные: {error}
          </div>
        )}

        {events.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <History size={21} />
            </div>
            <h3 className="mt-4 font-medium text-slate-900">Пока нет событий</h3>
            <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-500">
              Когда в проекте появятся новые действия, они отобразятся здесь.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="divide-y divide-slate-100">
              {events.slice(0, 8).map((event, index) => (
                <EventRow key={event.id} event={event} isLast={index === Math.min(events.length, 8) - 1} />
              ))}
            </div>
            {events.length > 8 && (
              <Link
                to={`/projects/${projectId}/history`}
                className="flex items-center justify-center gap-2 border-t border-slate-100 bg-slate-50/70 px-4 py-3.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              >
                Показать всю историю ({events.length})
                <ArrowDownRight size={16} />
              </Link>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function EventRow({
  event,
  isLast,
}: {
  event: ProjectEvent;
  isLast: boolean;
}) {
  return (
    <article className="flex gap-4 px-5 py-4 transition hover:bg-slate-50/70 sm:px-6">
      <div className="flex w-9 shrink-0 flex-col items-center">
        <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
          <History size={16} />
        </div>
        {!isLast && <div className="mt-2 min-h-3 w-px flex-1 bg-slate-100" />}
      </div>

      <div className="min-w-0 flex-1 py-0.5">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
          <div className="min-w-0">
            <h3 className="font-medium text-slate-900">
              {getEventLabel(event.eventType)}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {event.entityType}
            </p>
          </div>

          <span className="w-fit shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
            {getVisibilityLabel(event.visibility)}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
          {event.actor && (
            <span>
              {event.actor.firstName} {event.actor.lastName}
            </span>
          )}
          <span>{formatDate(event.createdAt)}</span>
        </div>
      </div>
    </article>
  );
}
