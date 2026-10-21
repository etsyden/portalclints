import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Bell,
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  ImagePlus,
  Eye,
  EyeOff,
  LoaderCircle,
  Save,
  ShieldCheck,
  UserRound,
  X,
} from 'lucide-react';
import {
  getMe,
  saveStoredUser,
  uploadAvatar,
  type AuthUser,
} from '../api/auth';
import { apiRequest } from '../api/client';

const API_URL = 'http://localhost:3000';
const MAX_AVATAR_SIZE = 2 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

type Section = 'profile' | 'security' | 'notifications';

function getAvatarSrc(avatarUrl?: string | null) {
  if (!avatarUrl) return '';
  if (avatarUrl.startsWith('http')) return avatarUrl;
  return `${API_URL}${avatarUrl}`;
}

export default function ProfilePage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [user, setUser] = useState<AuthUser | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [originalFirstName, setOriginalFirstName] = useState('');
  const [originalLastName, setOriginalLastName] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [section, setSection] = useState<Section>('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);


  async function handleChangePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword !== confirmPassword) {
      setPasswordError('Новый пароль и подтверждение не совпадают.');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('Новый пароль должен содержать не менее 8 символов.');
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError('Новый пароль должен отличаться от текущего.');
      return;
    }

    setPasswordSaving(true);

    try {
      await apiRequest<{ success: boolean; message: string }>(
        '/auth/me/password',
        {
          method: 'PATCH',
          body: JSON.stringify({
            currentPassword,
            newPassword,
          }),
        },
      );

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordSuccess('Пароль успешно изменён. Войдите заново на других устройствах.');
    } catch (requestError) {
      setPasswordError(
        requestError instanceof Error
          ? requestError.message
          : 'Не удалось изменить пароль.',
      );
    } finally {
      setPasswordSaving(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        const profile = await getMe();
        if (cancelled) return;

        setUser(profile);
        setFirstName(profile.firstName ?? '');
        setLastName(profile.lastName ?? '');
        setOriginalFirstName(profile.firstName ?? '');
        setOriginalLastName(profile.lastName ?? '');
      } catch {
        if (!cancelled) {
          setError('Не удалось загрузить профиль. Обновите страницу.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, []);



  useEffect(() => {
    return () => {
      if (previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
  const initial = firstName.trim().charAt(0).toUpperCase() || 'П';
  const avatarSrc = previewUrl || getAvatarSrc(user?.avatarUrl);
  const hasNameChanges =
    firstName.trim() !== originalFirstName ||
    lastName.trim() !== originalLastName;

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    setError('');
    setSuccess('');

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Выберите изображение JPEG, PNG или WebP.');
      return;
    }

    if (file.size > MAX_AVATAR_SIZE) {
      setError('Размер изображения не должен превышать 2 МБ.');
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  function cancelSelectedAvatar() {
    setSelectedFile(null);
    setPreviewUrl('');
    setError('');
  }

  async function handleAvatarUpload() {
    if (!selectedFile) return;

    setError('');
    setSuccess('');
    setUploading(true);

    try {
      const updatedUser = await uploadAvatar(selectedFile);

      setUser(updatedUser);
      saveStoredUser(updatedUser);
      setSelectedFile(null);
      setPreviewUrl('');
      setSuccess('Фотография профиля обновлена.');
      window.dispatchEvent(new Event('profile-updated'));
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : 'Не удалось загрузить фотографию.',
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');

    const normalizedFirstName = firstName.trim();
    const normalizedLastName = lastName.trim();

    if (
      normalizedFirstName.length < 2 ||
      normalizedLastName.length < 2
    ) {
      setError('Имя и фамилия должны содержать минимум 2 символа.');
      return;
    }

    if (!hasNameChanges) {
      setSuccess('Изменений нет — данные уже актуальны.');
      return;
    }

    setSaving(true);

    try {
      const updatedUser = await apiRequest<AuthUser>('/auth/me', {
        method: 'PATCH',
        body: JSON.stringify({
          firstName: normalizedFirstName,
          lastName: normalizedLastName,
        }),
      });

      setUser(updatedUser);
      setFirstName(updatedUser.firstName ?? '');
      setLastName(updatedUser.lastName ?? '');
      setOriginalFirstName(updatedUser.firstName ?? '');
      setOriginalLastName(updatedUser.lastName ?? '');
      saveStoredUser(updatedUser);
      setSuccess('Личные данные сохранены.');
      window.dispatchEvent(new Event('profile-updated'));
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Не удалось сохранить изменения.',
      );
    } finally {
      setSaving(false);
    }
  }

  function resetNameChanges() {
    setFirstName(originalFirstName);
    setLastName(originalLastName);
    setError('');
    setSuccess('');
  }

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center gap-3 text-sm text-slate-500">
        <LoaderCircle size={18} className="animate-spin" />
        Загружаем профиль...
      </div>
    );
  }

  const navigation: {
    id: Section;
    label: string;
    description: string;
    icon: typeof UserRound;
  }[] = [
    {
      id: 'profile',
      label: 'Общие данные',
      description: 'Фото и личная информация',
      icon: UserRound,
    },
    {
      id: 'security',
      label: 'Безопасность',
      description: 'Пароль и доступ к аккаунту',
      icon: ShieldCheck,
    },
    {
      id: 'notifications',
      label: 'Уведомления',
      description: 'Настройки оповещений',
      icon: Bell,
    },
  ];

  return (
    <div className="w-full pb-10">
      <Link
        to="/projects"
        className="inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-slate-900"
      >
        <ArrowLeft size={16} />
        К списку проектов
      </Link>

      <header className="mb-7 mt-6">
        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
          Настройки аккаунта
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
          Мой профиль
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Управляйте личными данными и настройками рабочего пространства в одном месте.
        </p>
      </header>

      {(error || success) && (
        <div
          role={error ? 'alert' : 'status'}
          className={`mb-6 flex items-start gap-3 rounded-xl border px-4 py-4 text-sm leading-5 shadow-sm ${
            error
              ? 'border-red-200/80 bg-red-50 text-red-700'
              : 'border-emerald-200/80 bg-emerald-50 text-emerald-700'
          }`}
        >
          {error ? (
            <X size={18} className="mt-0.5 shrink-0" />
          ) : (
            <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
          )}
          <span>{error || success}</span>
          <button
            type="button"
            aria-label="Закрыть сообщение"
            onClick={() => {
              setError('');
              setSuccess('');
            }}
            className="ml-auto rounded-md p-1 opacity-70 transition hover:bg-black/5 hover:opacity-100"
          >
            <X size={15} />
          </button>
        </div>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="space-y-4 lg:sticky lg:top-6">
          <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/40">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-800 text-xl font-semibold text-white ring-4 ring-slate-100">
                {getAvatarSrc(user?.avatarUrl) ? (
                  <img
                    src={getAvatarSrc(user?.avatarUrl)}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  initial
                )}
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-slate-900">
                  {fullName || 'Ваш профиль'}
                </div>
                <div className="mt-1 truncate text-xs text-slate-500">
                  {user?.email}
                </div>
              </div>
            </div>
            <div className="mt-5 flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-xs font-medium text-emerald-700">
              <CheckCircle2 size={15} />
              Аккаунт активен
            </div>
          </section>

          <nav
            aria-label="Разделы настроек профиля"
            className="rounded-2xl border border-slate-200/80 bg-white p-2.5 shadow-sm shadow-slate-200/40"
          >
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = section === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setSection(item.id);
                    setError('');
                    setSuccess('');
                  }}
                  aria-current={active ? 'page' : undefined}
                  className={`mb-1 flex w-full items-center gap-3 rounded-xl px-3.5 py-3.5 text-left transition duration-200 last:mb-0 ${
                    active
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon size={19} className="shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">
                      {item.label}
                    </span>
                    <span
                      className={`mt-0.5 block text-xs ${
                        active ? 'text-slate-300' : 'text-slate-400'
                      }`}
                    >
                      {item.description}
                    </span>
                  </span>
                  <ChevronRight size={16} className="shrink-0 opacity-60" />
                </button>
              );
            })}
          </nav>

          <p className="px-2 text-xs leading-5 text-slate-400">
            Изменения сохраняются только после подтверждения кнопкой сохранения.
          </p>
        </aside>

        <main className="min-w-0">
          {section === 'profile' && (
            <div className="space-y-5">
              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-5 py-5 sm:px-7">
                  <h2 className="font-semibold text-slate-900">
                    Фотография профиля
                  </h2>
                  <p className="mt-1 text-sm leading-5 text-slate-500">
                    Загрузите фото, чтобы коллегам было проще узнать вас.
                  </p>
                </div>

                <div className="flex flex-col gap-6 p-5 sm:flex-row sm:items-center sm:gap-7 sm:px-7 sm:py-7">
                  <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-800 text-3xl font-semibold text-white ring-4 ring-slate-100 shadow-sm">
                    {avatarSrc ? (
                      <img
                        src={avatarSrc}
                        alt="Предварительный просмотр фотографии профиля"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      initial
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-slate-900">
                      {fullName || 'Ваш профиль'}
                    </div>
                    <div className="mt-1 break-all text-sm text-slate-500">
                      {user?.email}
                    </div>
                    <p className="mt-3 text-xs leading-5 text-slate-400">
                      JPEG, PNG или WebP. Максимальный размер — 2 МБ.
                    </p>
                  </div>

                  <div className="flex w-full flex-col gap-2 sm:ml-auto sm:w-auto sm:flex-row sm:justify-end">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                    >
                      <Camera size={17} />
                      Выбрать фото
                    </button>
                  </div>
                </div>

                {selectedFile && (
                  <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                    <div className="flex min-w-0 items-center gap-3">
                      <ImagePlus size={19} className="shrink-0 text-slate-500" />
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-slate-800">
                          {selectedFile.name}
                        </div>
                        <div className="text-xs text-slate-500">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} МБ
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={cancelSelectedAvatar}
                        disabled={uploading}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition duration-200 hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-100 disabled:opacity-50"
                      >
                        Отмена
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleAvatarUpload()}
                        disabled={uploading}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition duration-200 hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {uploading ? (
                          <LoaderCircle size={17} className="animate-spin" />
                        ) : (
                          <Check size={17} />
                        )}
                        {uploading ? 'Загрузка...' : 'Сохранить фото'}
                      </button>
                    </div>
                  </div>
                )}
              </section>

              <form
                onSubmit={handleSubmit}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="border-b border-slate-100 px-5 py-5 sm:px-7">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                      <UserRound size={20} />
                    </div>
                    <div>
                      <h2 className="font-semibold text-slate-900">
                        Личные данные
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">
                        Информация, отображаемая в рабочем пространстве.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-7">
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="profile-email"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Email
                    </label>
                    <input
                      id="profile-email"
                      type="email"
                      value={user?.email ?? ''}
                      readOnly
                      autoComplete="email"
                      className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-500 outline-none"
                    />
                    <p className="mt-2 text-xs leading-5 text-slate-400">
                      Email используется для входа. Его изменение здесь пока недоступно.
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="profile-first-name"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Имя
                    </label>
                    <input
                      id="profile-first-name"
                      value={firstName}
                      onChange={(event) => setFirstName(event.target.value)}
                      minLength={2}
                      maxLength={100}
                      required
                      autoComplete="given-name"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                      placeholder="Введите имя"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="profile-last-name"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Фамилия
                    </label>
                    <input
                      id="profile-last-name"
                      value={lastName}
                      onChange={(event) => setLastName(event.target.value)}
                      minLength={2}
                      maxLength={100}
                      required
                      autoComplete="family-name"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                      placeholder="Введите фамилию"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-4 border-t border-slate-100 bg-slate-50/60 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                  <p className="text-xs text-slate-500">
                    {hasNameChanges
                      ? 'У вас есть несохранённые изменения.'
                      : 'Все изменения имени и фамилии сохранены.'}
                  </p>
                  <div className="flex flex-col-reverse gap-2 sm:flex-row">
                    {hasNameChanges && (
                      <button
                        type="button"
                        onClick={resetNameChanges}
                        disabled={saving}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 transition duration-200 hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-100 disabled:opacity-50"
                      >
                        Отменить
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={saving || !hasNameChanges}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white shadow-sm transition duration-200 hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {saving ? (
                        <LoaderCircle size={17} className="animate-spin" />
                      ) : (
                        <Save size={17} />
                      )}
                      {saving ? 'Сохранение...' : 'Сохранить изменения'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {section === 'security' && (
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                <ShieldCheck size={23} />
              </div>

              <h2 className="mt-5 text-xl font-semibold text-slate-900">
                Безопасность аккаунта
              </h2>
              <p className="mt-2 max-w-lg text-sm leading-6 text-slate-500">
                Регулярно обновляйте пароль, чтобы защитить доступ к своему аккаунту.
              </p>

              <form onSubmit={handleChangePassword} className="mt-7 max-w-xl space-y-5">
                <div>
                  <label htmlFor="currentPassword" className="mb-2 block text-sm font-medium text-slate-700">
                    Текущий пароль
                  </label>
                  <div className="relative">
                    <input
                      id="currentPassword"
                      type={showCurrentPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={currentPassword}
                      onChange={(event) => setCurrentPassword(event.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-4 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                      placeholder="Введите текущий пароль"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword((visible) => !visible)}
                      aria-label={showCurrentPassword ? 'Скрыть пароль' : 'Показать пароль'}
                      title={showCurrentPassword ? 'Скрыть пароль' : 'Показать пароль'}
                      className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-400 transition hover:text-slate-700"
                    >
                      {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="newPassword" className="mb-2 block text-sm font-medium text-slate-700">
                    Новый пароль
                  </label>
                  <div className="relative">
                    <input
                      id="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      minLength={8}
                      maxLength={128}
                      required
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-4 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                      placeholder="Не менее 8 символов"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((visible) => !visible)}
                      aria-label={showNewPassword ? 'Скрыть пароль' : 'Показать пароль'}
                      title={showNewPassword ? 'Скрыть пароль' : 'Показать пароль'}
                      className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-400 transition hover:text-slate-700"
                    >
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    Используйте не менее 8 символов.
                  </p>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-slate-700">
                    Подтвердите новый пароль
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      minLength={8}
                      maxLength={128}
                      required
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-4 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                      placeholder="Повторите новый пароль"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((visible) => !visible)}
                      aria-label={showConfirmPassword ? 'Скрыть пароль' : 'Показать пароль'}
                      title={showConfirmPassword ? 'Скрыть пароль' : 'Показать пароль'}
                      className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-400 transition hover:text-slate-700"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {passwordError && (
                  <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-5 text-rose-700">
                    {passwordError}
                  </div>
                )}

                {passwordSuccess && (
                  <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-5 text-emerald-700">
                    {passwordSuccess}
                  </div>
                )}

                <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs leading-5 text-slate-500">
                    После изменения пароля потребуется заново войти на других устройствах.
                  </p>
                  <button
                    type="submit"
                    disabled={passwordSaving}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-slate-700 focus:outline-none focus:ring-4 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {passwordSaving && <LoaderCircle size={16} className="animate-spin" />}
                    {passwordSaving ? 'Изменение...' : 'Изменить пароль'}
                  </button>
                </div>
              </form>
            </section>
          )}

          {section === 'notifications' && (
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                <Bell size={23} />
              </div>
              <h2 className="mt-5 text-xl font-semibold text-slate-900">
                Уведомления
              </h2>
              <p className="mt-2 max-w-lg text-sm leading-6 text-slate-500">
                В этом разделе можно будет управлять уведомлениями о проектах и событиях рабочего пространства после подключения системы настроек уведомлений.
              </p>
              <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-5 text-slate-600">
                Настройки уведомлений пока не подключены. Неактивные переключатели не показываются, чтобы не вводить вас в заблуждение.
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
