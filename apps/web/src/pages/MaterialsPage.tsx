
import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { FormEvent } from 'react';
import {
  createMaterial,
  createMaterialVersion,
  getMaterials,
  shareMaterial,
  type CreateMaterialInput,
  type CreateMaterialVersionInput,
  type Material,
  type MaterialType,
  type MaterialVisibility,
} from '../api/materials';

const materialTypes: { value: MaterialType; label: string }[] = [
  { value: 'FILE', label: 'Файл' },
  { value: 'LINK', label: 'Ссылка' },
  { value: 'TEXT', label: 'Текст' },
  { value: 'IMAGE', label: 'Изображение' },
  { value: 'VIDEO', label: 'Видео' },
  { value: 'AUDIO', label: 'Аудио' },
  { value: 'DOCUMENT', label: 'Документ' },
  { value: 'REFERENCE', label: 'Референс' },
  { value: 'SCREENSHOT', label: 'Скриншот' },
  { value: 'OTHER', label: 'Другое' },
];

function getTypeLabel(type: MaterialType): string {
  return materialTypes.find((item) => item.value === type)?.label ?? type;
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

type VersionForm = {
  changeSummary: string;
  provider: string;
  externalUrl: string;
  externalFileId: string;
  externalVersionId: string;
};

const emptyVersionForm: VersionForm = {
  changeSummary: '',
  provider: '',
  externalUrl: '',
  externalFileId: '',
  externalVersionId: '',
};

export default function MaterialsPage() {
  const { projectId } = useParams();

  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [formOpen, setFormOpen] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<MaterialType>('LINK');
  const [visibility, setVisibility] =
    useState<MaterialVisibility>('INTERNAL');

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [versionFormFor, setVersionFormFor] = useState<string | null>(null);
  const [versionForms, setVersionForms] = useState<
    Record<string, VersionForm>
    >({});
  const [versionErrors, setVersionErrors] = useState<
    Record<string, string>
    >({});
  const [savingVersionId, setSavingVersionId] = useState<string | null>(null);
  const [sharingId, setSharingId] = useState<string | null>(null);

  const loadMaterials = useCallback(async () => {
    if (!projectId) {
      setError('Идентификатор проекта не указан');
      setLoading(false);
      return;
    }

    try {
      setError('');
      const data = await getMaterials(projectId);
      setMaterials(data);
    } catch (err) {
      setError(getErrorMessage(err, 'Не удалось загрузить материалы'));
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void loadMaterials();
  }, [loadMaterials]);

  function updateVersionForm(
    materialId: string,
    field: keyof VersionForm,
    value: string,
  ) {
    setVersionForms((current) => ({
      ...current,
      [materialId]: {
        ...(current[materialId] ?? emptyVersionForm),
        [field]: value,
      },
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!projectId) {
      setFormError('Идентификатор проекта не указан');
      return;
    }

    const cleanTitle = title.trim();
    const cleanDescription = description.trim();

    if (cleanTitle.length < 3) {
      setFormError('Название должно содержать не менее 3 символов');
      return;
    }

    if (cleanTitle.length > 200 || cleanDescription.length > 5000) {
      setFormError('Проверь длину названия и описания');
      return;
    }

    setSaving(true);
    setFormError('');
    setNotice('');

    const input: CreateMaterialInput = {
      title: cleanTitle,
      description: cleanDescription,
      type,
      visibility,
    };

    try {
      await createMaterial(projectId, input);
      setTitle('');
      setDescription('');
      setType('LINK');
      setVisibility('INTERNAL');
      setFormOpen(false);
      setNotice('Материал успешно создан');
      await loadMaterials();
    } catch (err) {
      setFormError(getErrorMessage(err, 'Не удалось создать материал'));
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateVersion(
    event: FormEvent<HTMLFormElement>,
    materialId: string,
  ) {
    event.preventDefault();

    if (!projectId) {
      setVersionErrors((current) => ({
        ...current,
        [materialId]: 'Идентификатор проекта не указан',
      }));
      return;
    }

    const form = versionForms[materialId] ?? emptyVersionForm;
    const externalUrl = form.externalUrl.trim();

    if (externalUrl && !isValidHttpUrl(externalUrl)) {
      setVersionErrors((current) => ({
        ...current,
        [materialId]: 'Укажи корректную ссылку, начинающуюся с http:// или https://',
      }));
      return;
    }

    const input: CreateMaterialVersionInput = {
      changeSummary: form.changeSummary.trim(),
      provider: form.provider.trim(),
      externalUrl,
      externalFileId: form.externalFileId.trim(),
      externalVersionId: form.externalVersionId.trim(),
    };

    setSavingVersionId(materialId);
    setVersionErrors((current) => ({ ...current, [materialId]: '' }));
    setNotice('');

    try {
      const version = await createMaterialVersion(
        projectId,
        materialId,
        input,
      );

      setVersionForms((current) => ({
        ...current,
        [materialId]: { ...emptyVersionForm },
      }));
      setVersionFormFor(null);
      setNotice(
        `Создана версия ${version.versionNumber} материала «${
          materials.find((item) => item.id === materialId)?.title ?? ''
        }»`,
      );
    } catch (err) {
      setVersionErrors((current) => ({
        ...current,
        [materialId]: getErrorMessage(
          err,
          'Не удалось создать версию материала',
        ),
      }));
    } finally {
      setSavingVersionId(null);
    }
  }

  async function handleShare(material: Material) {
    if (!projectId || sharingId) return;

    const confirmed = window.confirm(
      `Опубликовать материал «${material.title}» для клиента?`,
    );

    if (!confirmed) return;

    setSharingId(material.id);
    setNotice('');
    setError('');

    try {
      const updated = await shareMaterial(projectId, material.id);

      setMaterials((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      setNotice(`Материал «${material.title}» теперь доступен клиенту`);
    } catch (err) {
      setError(getErrorMessage(err, 'Не удалось опубликовать материал'));
    } finally {
      setSharingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <p className="text-sm text-slate-500">Загрузка материалов...</p>
      </div>
    );
  }

  if (error && materials.length === 0) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
        <p>{error}</p>
        <button
          type="button"
          onClick={() => void loadMaterials()}
          className="mt-3 font-medium underline"
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
              Материалы
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Файлы, ссылки, версии и другие материалы проекта.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setFormOpen((open) => !open);
              setFormError('');
              setNotice('');
            }}
            className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            {formOpen ? 'Отмена' : '+ Добавить материал'}
          </button>
        </div>
      </div>

      {notice && (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
        >
          {notice}
          <button
            type="button"
            onClick={() => setNotice('')}
            aria-label="Закрыть уведомление"
            className="ml-3 font-medium"
          >
            ×
          </button>
        </div>
      )}

      {error && materials.length > 0 && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
          <button
            type="button"
            onClick={() => void loadMaterials()}
            className="ml-3 font-medium underline"
          >
            Повторить
          </button>
        </div>
      )}

      {formOpen && (
        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
        >
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Новый материал
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Добавь описание или ссылку на материал проекта.
            </p>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="material-title"
              className="block text-sm font-medium text-slate-700"
            >
              Название *
            </label>
            <input
              id="material-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              minLength={3}
              maxLength={200}
              required
              placeholder="Например, Главная страница — макет Figma"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-3 text-sm outline-none placeholder:text-slate-400 focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="material-type"
              className="block text-sm font-medium text-slate-700"
            >
              Тип материала
            </label>
            <select
              id="material-type"
              value={type}
              onChange={(event) =>
                setType(event.target.value as MaterialType)
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
            >
              {materialTypes.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="material-description"
              className="block text-sm font-medium text-slate-700"
            >
              Описание или ссылка
            </label>
            <textarea
              id="material-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              maxLength={5000}
              placeholder="Добавь описание или ссылку на Figma, Google Drive и т. п."
              className="w-full resize-y rounded-xl border border-slate-300 px-3.5 py-3 text-sm outline-none placeholder:text-slate-400 focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="material-visibility"
              className="block text-sm font-medium text-slate-700"
            >
              Видимость
            </label>
            <select
              id="material-visibility"
              value={visibility}
              onChange={(event) =>
                setVisibility(event.target.value as MaterialVisibility)
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
            >
              <option value="INTERNAL">Только команда</option>
              <option value="CLIENT">Доступно клиенту</option>
            </select>
            <p className="text-xs text-slate-500">
              Клиент увидит только материалы с видимостью «Доступно клиенту».
            </p>
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
              disabled={saving}
              onClick={() => {
                setFormOpen(false);
                setFormError('');
              }}
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? 'Сохранение...' : 'Добавить материал'}
            </button>
          </div>
        </form>
      )}

      {materials.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <h2 className="text-base font-medium text-slate-900">
            Материалов пока нет
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Добавь первый материал проекта с помощью кнопки выше.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {materials.map((material) => {
            const versionForm =
              versionForms[material.id] ?? emptyVersionForm;
            const isVersionFormOpen = versionFormFor === material.id;
            const isSavingVersion = savingVersionId === material.id;
            const isSharing = sharingId === material.id;

            return (
              <article
                key={material.id}
                className="flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="break-words font-medium text-slate-900">
                      {material.title}
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                      {getTypeLabel(material.type)}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                      material.visibility === 'CLIENT'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {material.visibility === 'CLIENT'
                      ? 'Клиенту'
                      : 'Команде'}
                  </span>
                </div>

                {material.description && (
                  <div className="mt-3 break-words whitespace-pre-wrap text-sm leading-6 text-slate-600">
                    {material.description
                      .split(/(https?:\/\/[^\s]+)/g)
                      .map((part, index) => {
                        if (/^https?:\/\/[^\s]+$/i.test(part)) {
                          const url = part.replace(/[.,;!?)\]}]+$/, '');
                          const trailing = part.slice(url.length);

                          return (
                            <span key={index}>
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium text-blue-600 underline underline-offset-2 hover:text-blue-800"
                              >
                                {url}
                              </a>
                              {trailing}
                            </span>
                          );
                        }

                        return <span key={index}>{part}</span>;
                      })}
                  </div>
                )}

                <div className="mt-auto pt-5 text-xs text-slate-400">
                  Добавлен {formatDate(material.createdAt)}
                </div>

                <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setVersionFormFor(isVersionFormOpen ? null : material.id);
                      setVersionErrors((current) => ({
                        ...current,
                        [material.id]: '',
                      }));
                      setNotice('');
                    }}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    {isVersionFormOpen ? 'Отмена' : '+ Новая версия'}
                  </button>

                  {material.visibility === 'INTERNAL' && (
                    <button
                      type="button"
                      disabled={Boolean(sharingId)}
                      onClick={() => void handleShare(material)}
                      className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isSharing ? 'Публикация...' : 'Поделиться с клиентом'}
                    </button>
                  )}
                </div>

                {isVersionFormOpen && (
                  <form
                    onSubmit={(event) =>
                      void handleCreateVersion(event, material.id)
                    }
                    className="mt-4 space-y-3 rounded-xl bg-slate-50 p-4"
                  >
                    <h3 className="text-sm font-semibold text-slate-900">
                      Новая версия
                    </h3>

                    <div className="space-y-1.5">
                      <label
                        htmlFor={`version-summary-${material.id}`}
                        className="block text-xs font-medium text-slate-700"
                      >
                        Что изменилось
                      </label>
                      <textarea
                        id={`version-summary-${material.id}`}
                        value={versionForm.changeSummary}
                        onChange={(event) =>
                          updateVersionForm(
                            material.id,
                            'changeSummary',
                            event.target.value,
                          )
                        }
                        maxLength={2000}
                        rows={2}
                        placeholder="Например, обновлён дизайн главной страницы"
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label
                        htmlFor={`version-url-${material.id}`}
                        className="block text-xs font-medium text-slate-700"
                      >
                        Ссылка на версию
                      </label>
                      <input
                        id={`version-url-${material.id}`}
                        type="url"
                        value={versionForm.externalUrl}
                        onChange={(event) =>
                          updateVersionForm(
                            material.id,
                            'externalUrl',
                            event.target.value,
                          )
                        }
                        placeholder="https://..."
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label
                        htmlFor={`version-provider-${material.id}`}
                        className="block text-xs font-medium text-slate-700"
                      >
                        Сервис или хранилище
                      </label>
                      <input
                        id={`version-provider-${material.id}`}
                        value={versionForm.provider}
                        onChange={(event) =>
                          updateVersionForm(
                            material.id,
                            'provider',
                            event.target.value,
                          )
                        }
                        maxLength={200}
                        placeholder="Например, Figma или Google Drive"
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label
                        htmlFor={`version-file-id-${material.id}`}
                        className="block text-xs font-medium text-slate-700"
                      >
                        ID файла во внешнем сервисе (необязательно)
                      </label>
                      <input
                        id={`version-file-id-${material.id}`}
                        value={versionForm.externalFileId}
                        onChange={(event) =>
                          updateVersionForm(
                            material.id,
                            'externalFileId',
                            event.target.value,
                          )
                        }
                        maxLength={500}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label
                        htmlFor={`version-external-id-${material.id}`}
                        className="block text-xs font-medium text-slate-700"
                      >
                        ID версии во внешнем сервисе (необязательно)
                      </label>
                      <input
                        id={`version-external-id-${material.id}`}
                        value={versionForm.externalVersionId}
                        onChange={(event) =>
                          updateVersionForm(
                            material.id,
                            'externalVersionId',
                            event.target.value,
                          )
                        }
                        maxLength={500}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                      />
                    </div>

                    {versionErrors[material.id] && (
                      <p role="alert" className="text-xs text-red-700">
                        {versionErrors[material.id]}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={isSavingVersion}
                      className="w-full rounded-lg bg-slate-900 px-3 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isSavingVersion ? 'Создание...' : 'Создать версию'}
                    </button>
                  </form>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
