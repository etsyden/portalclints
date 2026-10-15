import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  getRequests,
  type ProjectRequest,
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

export default function RequestsPage() {
  const { projectId } = useParams();

  const [requests, setRequests] = useState<ProjectRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!projectId) {
      setError('Идентификатор проекта не указан');
      setLoading(false);
      return;
    }

    const id = projectId;

    async function loadRequests() {
      try {
        const data = await getRequests(id);
        setRequests(data);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : 'Не удалось загрузить запросы',
        );
      } finally {
        setLoading(false);
      }
    }

    loadRequests();
  }, [projectId]);

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

        <div className="mt-5">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Запросы
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Запросы и обращения, связанные с проектом.
          </p>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <h2 className="text-base font-medium text-slate-900">
            Запросов пока нет
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Здесь появятся обращения и запросы по проекту.
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

                <span
                  className={`w-fit shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${getStatusClass(request.status)}`}
                >
                  {getStatusLabel(request.status)}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
