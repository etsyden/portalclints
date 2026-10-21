import { Outlet } from 'react-router-dom';
import AppHeader from '../components/AppHeader';

export default function AppShellLayout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <AppHeader />

      <main className="mx-auto w-full max-w-[2000px] px-5 py-6 sm:px-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  );
}
