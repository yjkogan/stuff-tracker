import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom';
import { LogOut, Home, ArrowLeft } from 'lucide-react';
import FloatingActionButton from './FloatingActionButton';

export default function Layout() {
    const location = useLocation();
    const navigate = useNavigate();
    const isHome = location.pathname === '/';
    const isLogin = location.pathname === '/login';

    if (isLogin) {
        return <Outlet />;
    }

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 pb-24">
            <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm transition-all duration-300">
                <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {!isHome && (
                            <button
                                onClick={() => navigate(-1)}
                                className="p-2 -ml-2 text-gray-600 hover:text-indigo-600 hover:bg-gray-100 rounded-full transition-colors"
                                aria-label="Go back"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                        )}

                        <Link to="/" className="font-bold text-xl tracking-tight bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent hover:opacity-80 transition-opacity">
                            Stuff Tracker
                        </Link>
                    </div>

                    <button
                        onClick={() => navigate('/login')} // Mock logout
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-all duration-300"
                        title="Logout"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 py-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <Outlet />
            </main>

            <FloatingActionButton />
        </div>
    );
}
