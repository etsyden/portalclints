import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FolderOpen,
  History,
  LayoutDashboard,
  MessageSquare,
  type LucideIcon,
} from 'lucide-react';

import { getStoredUser } from '../api/auth';
import { getProject, type Project } from '../api/projects';

interface NavigationItem {
  label: string;
  path: string;
  icon: LucideIcon;
}

const navigation: NavigationItem[] = [
  {
    label: 'Обзор',
    path: '',
    icon: LayoutDashboard,
  },
  {
    label: 'Запросы',
    path: '/requests',
    icon: ClipboardList,
  },
  {
    label: 'Материалы',
    path: '/materials',
    icon: FolderOpen,
  },
  {
    label: 'Согласования',
    path: '/approvals',
    icon: CheckCircle2,
  },
  {
    label: 'Сообщения',
    path: '/messages',
    icon: MessageSquare,
  },
  {
    label: 'История',
    path: '/history',
    icon: History,
  },
];

export default function AppLayout() {
  const location = useLocation();
  const { projectId } = useParams();

  const user = getStoredUser();

  const [project, setProject] = useState<Project | null>(null);
  const [projectLoading, setProjectLoading] = useState(true);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('portal-sidebar-collapsed') === 'true';
  });

  const userName = user
    ? `${user.firstName} ${user.lastName}`.trim()
    : 'Пользователь';

  const userInitial =
    user?.firstName?.charAt(0).toUpperCase() || 'П';

  useEffect(() => {
    if (!projectId) {
      setProjectLoading(false);
      return;
    }

    const id = projectId;

    async function loadProject() {
      try {
        const data = await getProject(id);
        setProject(data);
      } catch {
        setProject(null);
      } finally {
        setProjectLoading(false);
      }
    }

    loadProject();
  }, [projectId]);

  function toggleSidebar() {
    setSidebarCollapsed((current) => {
      const next = !current;

      localStorage.setItem(
        'portal-sidebar-collapsed',
        String(next),
      );

      return next;
    });
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="h-16 border-b border-slate-200 bg-white">
        <div className="flex h-full items-center justify-between px-6">
          <Link
            to="/projects"
            className="text-lg font-semibold text-slate-900"
          >
            Рабочее пространство
          </Link>

          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm font-medium text-slate-600">
              {userInitial}
            </div>

            <span className="text-sm font-medium text-slate-700">
              {userName}
            </span>
          </div>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-4rem)]">
        <aside
          className={[
            'shrink-0 border-r border-slate-200 bg-white transition-[width] duration-300 ease-in-out',
            sidebarCollapsed ? 'w-[72px]' : 'w-64',
          ].join(' ')}
        >
          <div className="flex h-full flex-col p-3">
            <div
              className={[
                'flex items-center border-b border-slate-100 pb-4',
                sidebarCollapsed
                  ? 'justify-center'
                  : 'justify-between',
              ].join(' ')}
            >
              {!sidebarCollapsed && (
                <div className="min-w-0 pl-1">
                  <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Проект
                  </div>

                  <div className="mt-1 truncate font-semibold text-slate-800">
                    {projectLoading
                      ? 'Загрузка...'
                      : project?.name || 'Проект'}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={toggleSidebar}
                title={
                  sidebarCollapsed
                    ? 'Развернуть меню'
                    : 'Свернуть меню'
                }
                aria-label={
                  sidebarCollapsed
                    ? 'Развернуть меню'
                    : 'Свернуть меню'
                }
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              >
                {sidebarCollapsed ? (
                  <ChevronRight size={18} />
                ) : (
                  <ChevronLeft size={18} />
                )}
              </button>
            </div>

            <nav className="mt-4 space-y-1">
              {navigation.map((item) => {
                const href =
                  item.path === ''
                    ? `/projects/${projectId}`
                    : `/projects/${projectId}${item.path}`;

                const isActive =
                  item.path === ''
                    ? location.pathname ===
                    `/projects/${projectId}`
                    : location.pathname.startsWith(href);

                const Icon = item.icon;

                return (
                  <Link
                    key={item.label}
                    to={href}
                    title={sidebarCollapsed ? item.label : undefined}
                    className={[
                      'group flex h-10 items-center rounded-lg text-sm transition-all duration-200',
                      sidebarCollapsed
                        ? 'justify-center px-0'
                        : 'gap-3 px-3',
                      isActive
                        ? 'bg-slate-100 font-medium text-slate-900'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                    ].join(' ')}
                  >
                    <Icon
                      size={18}
                      strokeWidth={isActive ? 2.2 : 1.8}
                      className="shrink-0"
                    />

                    {!sidebarCollapsed && (
                      <span>{item.label}</span>
                    )}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-8 border-t border-slate-100 pt-4">
              <Link
                to="/projects"
                title={sidebarCollapsed ? 'Все проекты' : undefined}
                className={[
                  'flex h-10 items-center rounded-lg text-sm text-slate-500 transition hover:bg-slate-50 hover:text-slate-900',
                  sidebarCollapsed
                    ? 'justify-center px-0'
                    : 'gap-3 px-3',
                ].join(' ')}
              >
                <ArrowLeft
                  size={18}
                  strokeWidth={1.8}
                  className="shrink-0"
                />

                {!sidebarCollapsed && (
                  <span>Все проекты</span>
                )}
              </Link>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-8 py-8">
          <div className="mx-auto w-full max-w-[2000px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}