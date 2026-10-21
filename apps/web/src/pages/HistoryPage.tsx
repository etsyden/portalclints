import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Filter,
  History,
  RefreshCw,
  Search,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import {
  getProjectHistory,
  type ProjectEvent,
} from '../api/project';
import {
  getEventLabel,
  getVisibilityLabel,
} from '../utils/eventLabels';

type VisibilityFilter = 'ALL' | 'CLIENT' | 'INTERNAL';

function formatDate(date: string): string {
  return new Date(date).toLocaleString('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getEventDateGroup(date: string): string {
  const value = new Date(date);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (value.toDateString() === today.toDateString()) {
    return 'Сегодня';
  }

  if (value.toDateString() === yesterday.toDateString()) {
    return 'Вчера';
  }

  return value.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function getVisibilityStyle(visibility: string): string {
  return visibility === 'CLIENT'
    ? 'bg-emerald-50 text-emerald-700'
    : 'bg-slate-100 text-slate-600';
}

export default function HistoryPage() {
  const { projectId } = useParams();

  const [events, setEvents] = useState<ProjectEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [visibility, setVisibility] = useState<VisibilityFilter>('ALL');
  const [eventType, setEventType] = useState('ALL');

  useEffect(() => {
    if (!projectId) {
      setError('Идентификатор проекта не указан');
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadHistory() {
      setError('');

      try {
        const result = await getProjectHistory(projectId!);

        if (!cancelled) {
          setEvents(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Не удалось загрузить историю',
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }

    void loadHistory();

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const eventTypes = useMemo(
    () => [...new Set(events.map((event) => event.eventType))].sort(),
    [events],
  );

  const filteredEvents = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('ru-RU');

    return events.filter((event) => {
      if (visibility !== 'ALL' && event.visibility !== visibility) {
        return false;
      }

      if (eventType !== 'ALL' && event.eventType !== eventType) {
        return false;
      }

      if (!query) {
        return true;
      }

      const actor = event.actor
        ? `${event.actor.firstName} ${event.actor.lastName} ${event.actor.email}`
        : '';

      const searchableText = [
        getEventLabel(event.eventType),
        event.eventType,
        event.entityType,
        event.entityId ?? '',
        actor,
        event.visibility,
      ].join(' ').toLocaleLowerCase('ru-RU');

      return searchableText.includes(query);
    });
  }, [events, search, visibility, eventType]);

  const groupedEvents = useMemo(() => {
    const groups = new Map<string, ProjectEvent[]>();

    for (const event of filteredEvents) {
      const group = getEventDateGroup(event.createdAt);
      const current = groups.get(group) ?? [];
      current.push(event);
      groups.set(group, current);
    }

    return [...groups.entries()];
  }, [filteredEvents]);

  async function refreshHistory() {
    if (!projectId || refreshing) {
      return;
    }

    setRefreshing(true);
    setError('');

    try {
      const result = await getProjectHistory(projectId);
      setEvents(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Не удалось обновить историю',
      );
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }

  function resetFilters() {
    setSearch('');
    setVisibility('ALL');
    setEventType('ALL');
  }

  const hasFilters =
    search.trim() !== '' ||
    visibility !== 'ALL' ||
    eventType !== 'ALL';

  return (
    <div className="space-y-7 pb-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to={`/projects/${projectId}`}
          className="inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-slate-900"
        >
          <ArrowLeft size={16} />
          Обзор проекта
        </Link>

        <button
          type="button"
          onClick={refreshHistory}
          disabled={refreshing || loading}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900 disabled:opacity-50"
        >
          <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
          Обновить
        </button>
      </div>

      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-24 h-64 w-64 rounded-full bg-violet-100/60 blur-3xl" />

        <div className="relative">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
            <History size={23} />
          </div>

          <div className="mt-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <div className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                Активность проекта
              </div>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                История событий
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Хронология действий, сообщений, материалов и согласований,
                доступных вашей роли в проекте.
              </p>
            </div>

            <div className="flex gap-3">
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <div className="text-xs text-slate-400">Всего событий</div>
                <div className="mt-1 text-2xl font-semibold text-slate-900">
                  {events.length}
                </div>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <div className="text-xs text-slate-400">По фильтрам</div>
                <div className="mt-1 text-2xl font-semibold text-slate-900">
                  {filteredEvents.length}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Filter size={17} className="text-slate-400" />
          Поиск и фильтры
        </div>

        <div className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_200px_220px]">
          <label className="relative block">
            <Search
              size={17}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Поиск по событиям и авторам..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
            />
          </label>

          <select
            value={visibility}
            onChange={(event) => setVisibility(event.target.value as VisibilityFilter)}
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
          >
            <option value="ALL">Любая видимость</option>
            <option value="CLIENT">Для клиента</option>
            <option value="INTERNAL">Внутренние</option>
          </select>

          <select
            value={eventType}
            onChange={(event) => setEventType(event.target.value)}
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
          >
            <option value="ALL">Все типы событий</option>
            {eventTypes.map((type) => (
              <option key={type} value={type}>
                {getEventLabel(type)}
              </option>
            ))}
          </select>
        </div>

        {hasFilters && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs text-slate-400">
              Найдено событий: {filteredEvents.length}
            </span>
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 transition hover:text-slate-900"
            >
              <X size={14} />
              Сбросить фильтры
            </button>
          </div>
        )}
      </section>

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <ShieldCheck size={18} className="mt-0.5 shrink-0" />
          <div>
            <div className="font-medium">Не удалось загрузить историю</div>
            <div className="mt-1">{error}</div>
            <button
              type="button"
              onClick={refreshHistory}
              className="mt-2 font-medium underline underline-offset-2"
            >
              Попробовать снова
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white py-16 text-sm text-slate-500">
          <RefreshCw size={17} className="mr-2 animate-spin" />
          Загружаем историю...
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
            {hasFilters ? <Search size={21} /> : <History size={21} />}
          </div>
          <h2 className="mt-4 font-semibold text-slate-900">
            {hasFilters ? 'Ничего не найдено' : 'История пока пуста'}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            {hasFilters
              ? 'Попробуйте изменить запрос или сбросить фильтры.'
              : 'События появятся здесь, когда в проекте будут выполняться действия.'}
          </p>
          {hasFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="mt-4 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
            >
              Сбросить фильтры
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-7">
          {groupedEvents.map(([group, groupEvents]) => (
            <section key={group}>
              <div className="mb-3 flex items-center gap-2">
                <CalendarDays size={15} className="text-slate-400" />
                <h2 className="text-sm font-semibold text-slate-700">{group}</h2>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                  {groupEvents.length}
                </span>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="divide-y divide-slate-100">
                  {groupEvents.map((event) => (
                    <article
                      key={event.id}
                      className="flex gap-4 px-4 py-4 transition hover:bg-slate-50/70 sm:px-6"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                        <History size={17} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                          <div className="min-w-0">
                            <h3 className="font-medium text-slate-900">
                              {getEventLabel(event.eventType)}
                            </h3>
                            <p className="mt-1 text-sm text-slate-500">
                              {event.entityType}
                              {event.entityId ? ` · ${event.entityId}` : ''}
                            </p>
                          </div>

                          <span className={`w-fit shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${getVisibilityStyle(event.visibility)}`}>
                            {getVisibilityLabel(event.visibility)}
                          </span>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-400">
                          {event.actor ? (
                            <span className="inline-flex items-center gap-1.5">
                              <Users size={13} />
                              {event.actor.firstName} {event.actor.lastName}
                            </span>
                          ) : (
                            <span>Системное событие</span>
                          )}
                          <span>{formatDate(event.createdAt)}</span>
                        </div>
                      </div>

                      <div className="hidden shrink-0 items-start pt-1 text-emerald-600 sm:flex">
                        <Check size={16} />
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </section>
          ))}
        </div>
      )}

      <div className="text-center text-xs leading-5 text-slate-400">
        Отображаются события, доступные вашей учётной записи.
      </div>
    </div>
  );
}
