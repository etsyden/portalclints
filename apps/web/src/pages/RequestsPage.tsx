
import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { FormEvent } from 'react';
import {
  createRequest,
  getRequests,
  updateRequestStatus,
  type CreateRequestInput,
  type ProjectRequest,
  type RequestStatus,
} from '../api/requests';

function getStatusLabel(status: string): string {
  switch (status) {
    case 'NEW':
      return 'Новый';
    case 'IN_PROGRESS':
      return 'В работе';
    case 'WAITING_CLIENT':
      return 'Ожидает клиента';
    case 'COMPLETED':
      return 'Завершён';
    case 'CANCELLED':
      return 'Отменён';
    default:
      return status;
  }
}

function getStatusClass(status: string): string {
  switch (status) {
    case 'NEW':
      return 'bg-blue-50 text-blue-700';
    case 'IN_PROGRESS':
      return 'bg-amber-50 text-amber-700';
    case 'WAITING_CLIENT':
      return 'bg-violet-50 text-violet-700';
    case 'COMPLETED':
      return 'bg-emerald-50 text-emerald-700';
    case 'CANCELLED':
      return 'bg-slate-100 text-slate-500';
    default:
      return 'bg-slate-100 text-slate-600';
  }
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

const requestTypes: {
  value: CreateRequestInput['type'];
  label: string;
}[] = [
  { value: 'GENERAL', label: 'Общий запрос' },
  { value: 'CHANGE', label: 'Изменение' },
  { value: 'NEW_FEATURE', label: 'Новая функция' },
  { value: 'CONTENT', label: 'Контент' },
  { value: 'DESIGN', label: 'Дизайн' },
  { value: 'TECHNICAL', label: 'Технический вопрос' },
  { value: 'QUESTION', label: 'Вопрос' },
];

const requestStatuses: { value: RequestStatus; label: string }[] = [
  { value: 'NEW', label: 'Новый' },
  { value: 'IN_PROGRESS', label: 'В работе' },
  { value: 'WAITING_CLIENT', label: 'Ожидает клиента' },
  { value: 'COMPLETED', label: 'Завершён' },
  { value: 'CANCELLED', label: 'Отменён' },
];

export default function RequestsPage() {
  const { projectId } = useParams();

  const [requests, setRequests] = useState<ProjectRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<CreateRequestInput['type']>('GENERAL');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [updatingRequestId, setUpdatingRequestId] = useState<string | null>(
    null,
  );
  const [statusError, setStatusError] = useState('');

  const loadRequests = useCallback(async () => {
    if (!projectId) {
      setError('Идентификатор проекта не указан');
      setLoading(false);
      return;
    }

    try {
      setError('');
      const data = await getRequests(projectId);
      setRequests(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Не удалось загрузить запросы',
      );
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!projectId) {
      setFormError('Идентификатор проекта не указан');
      return;
    }

    const cleanTitle = title.trim();

    if (cleanTitle.length < 3) {
      setFormError('Название должно содержать не менее 3 символов');
      return;
    }

    setSaving(true);
    setFormError('');

    try {
      await createRequest(projectId, {
        title: cleanTitle,
        description: description.trim(),
        type,
      });

      setTitle('');
      setDescription('');
      setType('GENERAL');
      setFormOpen(false);

      await loadRequests();
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : 'Не удалось создать запрос',
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(
    requestId: string,
    status: RequestStatus,
  ) {
    if (!projectId) return;

    setUpdatingRequestId(requestId);
    setStatusError('');

    try {
      await updateRequestStatus(projectId, requestId, status);
      await loadRequests();
    } catch (err) {
      setStatusError(
        err instanceof Error
          ? err.message
          : 'Не удалось изменить статус',
      );
    } finally {
      setUpdatingRequestId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <div className="text-sm text-slate-500">
          Загрузка запросов...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
        {error}
        <button
          type="button"
          onClick={() => void loadRequests()}
          className="ml-3 font-medium underline"
        >
          Повторить
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          to={`/projects/${projectId}`}
          className="text-sm text-slate-500 transition hover:text-slate-900"
        >
          ← Обзор проекта
        </Link>

        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Запросы
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Запросы и обращения, связанные с проектом.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setFormOpen((open) => !open);
              setFormError('');
            }}
            className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            {formOpen ? 'Отмена' : '+ Создать запрос'}
          </button>
        </div>
      </div>

      {formOpen && (
        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
        >
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Новый запрос
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Опишите, что нужно сделать в рамках проекта.
            </p>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="request-title"
              className="block text-sm font-medium text-slate-700"
            >
              Название *
            </label>
            <input
              id="request-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              minLength={3}
              maxLength={200}
              placeholder="Например, изменить первый экран сайта"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="request-type"
              className="block text-sm font-medium text-slate-700"
            >
              Тип запроса
            </label>
            <select
              id="request-type"
              value={type}
              onChange={(event) =>
                setType(event.target.value as CreateRequestInput['type'])
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
            >
              {requestTypes.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="request-description"
              className="block text-sm font-medium text-slate-700"
            >
              Описание
            </label>
            <textarea
              id="request-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              maxLength={5000}
              placeholder="Добавьте подробности, требования или ожидаемый результат"
              className="w-full resize-y rounded-xl border border-slate-300 px-3.5 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
            />
          </div>

          {formError && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              {formError}
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => {
                setFormOpen(false);
                setFormError('');
              }}
              disabled={saving}
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? 'Сохранение...' : 'Создать запрос'}
            </button>
          </div>
        </form>
      )}

      {statusError && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {statusError}
        </div>
      )}

      {requests.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <h2 className="text-base font-medium text-slate-900">
            Запросов пока нет
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Создайте первый запрос с помощью кнопки выше.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => (
            <article
              key={request.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <h2 className="font-medium text-slate-900">
                    {request.title}
                  </h2>

                  {request.description && (
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {request.description}
                    </p>
                  )}

                  <div className="mt-4 text-xs text-slate-400">
                    Создан {formatDate(request.createdAt)}
                  </div>
                </div>

                <div className="flex shrink-0 flex-col items-start gap-2 md:items-end">
                  <span
                    className={`w-fit rounded-full px-3 py-1.5 text-xs font-medium ${getStatusClass(request.status)}`}
                  >
                    {getStatusLabel(request.status)}
                  </span>

                  <select
                    aria-label={`Изменить статус: ${request.title}`}
                    value={request.status}
                    disabled={updatingRequestId === request.id}
                    onChange={(event) =>
                      void handleStatusChange(
                        request.id,
                        event.target.value as RequestStatus,
                      )
                    }
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-600 outline-none focus:border-slate-400 disabled:opacity-50"
                  >
                    {requestStatuses.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>

                  {updatingRequestId === request.id && (
                    <span className="text-xs text-slate-400">
                      Сохранение...
                    </span>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
