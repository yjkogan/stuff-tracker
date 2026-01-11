import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom';
import { LogOut, ArrowLeft } from 'lucide-react';
import FloatingActionButton from './FloatingActionButton';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === '/';

  return (
    <div className='min-h-screen bg-gray-50 pb-24 text-gray-900'>
      <header className='sticky top-0 z-40 border-b border-gray-100 bg-white/80 shadow-sm backdrop-blur-md transition-all duration-300'>
        <div className='mx-auto flex h-16 max-w-3xl items-center justify-between px-4'>
          <div className='flex items-center gap-2'>
            {!isHome && (
              <button
                onClick={() => navigate(-1)}
                className='-ml-2 rounded-full p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-indigo-600'
                aria-label='Go back'
              >
                <ArrowLeft className='h-5 w-5' />
              </button>
            )}

            <Link to='/' className='flex items-center gap-3 transition-opacity hover:opacity-80'>
              <img src='/logo.png' alt='Logo' className='h-10 w-10 object-contain' />
              <span className='bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-xl font-bold tracking-tight text-transparent'>
                Stuff Tracker
              </span>
            </Link>
          </div>

          <button
            onClick={() => navigate('/login')} // Mock logout
            className='rounded-full p-2 text-gray-500 transition-all duration-300 hover:bg-red-50 hover:text-red-600'
            title='Logout'
          >
            <LogOut className='h-5 w-5' />
          </button>
        </div>
      </header>

      <main className='animate-in fade-in slide-in-from-bottom-2 mx-auto max-w-3xl px-4 py-6 duration-500'>
        <Outlet />
      </main>

      <FloatingActionButton />
    </div>
  );
}
