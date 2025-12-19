import { Link, usePage } from '@inertiajs/react';
import { PropsWithChildren, ReactNode, useState } from 'react';
import {
    LayoutDashboard,
    Wallet,
    CreditCard,
    Tags,
    Target,
    FileUp,
    BarChart3,
    Settings,
    LogOut,
    Menu,
    X,
    ChevronDown,
    User,
} from 'lucide-react';

interface NavItem {
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    active?: boolean;
}

const navigation: NavItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Transações', href: '/transacoes', icon: Wallet },
    { name: 'Cartões', href: '/cartoes', icon: CreditCard },
    { name: 'Categorias', href: '/categorias', icon: Tags },
    { name: 'Orçamento', href: '/orcamento', icon: BarChart3 },
    { name: 'Metas', href: '/metas', icon: Target },
    { name: 'Importar', href: '/importar', icon: FileUp },
];

export default function AppLayout({
    header,
    children,
}: PropsWithChildren<{ header?: ReactNode }>) {
    const { auth, url } = usePage().props as any;
    const user = auth?.user;
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);

    const isActive = (href: string) => {
        return url?.startsWith(href) || window.location.pathname.startsWith(href);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-lime-50 via-white to-emerald-50">
            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-gray-900 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                {/* Logo */}
                <div className="flex h-16 items-center justify-between px-6">
                    <Link href="/dashboard" className="flex items-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-rose-500">
                            <Wallet className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-xl font-bold text-white">
                            MeuOrçamento
                        </span>
                    </Link>
                    <button
                        className="text-gray-400 lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="mt-6 px-3">
                    <ul className="space-y-1">
                        {navigation.map((item) => {
                            const active = isActive(item.href);
                            return (
                                <li key={item.name}>
                                    <Link
                                        href={item.href}
                                        className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                                            active
                                                ? 'bg-gradient-to-r from-pink-500/20 to-rose-500/20 text-pink-400'
                                                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                        }`}
                                    >
                                        <item.icon
                                            className={`h-5 w-5 ${active ? 'text-pink-400' : ''}`}
                                        />
                                        {item.name}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {/* User section */}
                <div className="absolute bottom-0 left-0 right-0 border-t border-gray-800 p-4">
                    <Link
                        href="/profile"
                        className="flex items-center gap-3 rounded-xl px-3 py-2 text-gray-400 hover:bg-gray-800 hover:text-white"
                    >
                        <Settings className="h-5 w-5" />
                        <span className="text-sm font-medium">Configurações</span>
                    </Link>
                    <Link
                        href="/logout"
                        method="post"
                        as="button"
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-gray-400 hover:bg-gray-800 hover:text-white"
                    >
                        <LogOut className="h-5 w-5" />
                        <span className="text-sm font-medium">Sair</span>
                    </Link>
                </div>
            </aside>

            {/* Main content */}
            <div className="lg:ml-64">
                {/* Top bar */}
                <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white/80 px-4 backdrop-blur-sm sm:px-6 lg:px-8">
                    <div className="flex items-center gap-4">
                        <button
                            className="text-gray-500 lg:hidden"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <Menu className="h-6 w-6" />
                        </button>
                        {header && (
                            <h1 className="text-xl font-semibold text-gray-900">
                                {header}
                            </h1>
                        )}
                    </div>

                    {/* User menu */}
                    <div className="relative">
                        <button
                            onClick={() => setUserMenuOpen(!userMenuOpen)}
                            className="flex items-center gap-2 rounded-full bg-gray-100 py-2 pl-2 pr-4 text-sm font-medium text-gray-700 hover:bg-gray-200"
                        >
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-rose-500 text-white">
                                <User className="h-4 w-4" />
                            </div>
                            <span className="hidden sm:block">{user?.name}</span>
                            <ChevronDown className="h-4 w-4" />
                        </button>

                        {userMenuOpen && (
                            <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white py-2 shadow-lg ring-1 ring-gray-200">
                                <Link
                                    href="/profile"
                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    onClick={() => setUserMenuOpen(false)}
                                >
                                    Meu Perfil
                                </Link>
                                <Link
                                    href="/logout"
                                    method="post"
                                    as="button"
                                    className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                                    onClick={() => setUserMenuOpen(false)}
                                >
                                    Sair
                                </Link>
                            </div>
                        )}
                    </div>
                </header>

                {/* Page content */}
                <main className="p-4 sm:p-6 lg:p-8">{children}</main>
            </div>
        </div>
    );
}
