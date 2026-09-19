import { Link } from '@inertiajs/react';
import { ShoppingCart } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface NavigationProps {
    className?: string;
    site?: any;
    menus?: any;
    auth?: {
        user?: {
            id: number;
            name: string;
            email: string;
            roles?: Array<{ id: number; name: string }>;
            permissions?: Array<{ id: number; name: string }>;
        } | null;
    };
}

const Navigation: React.FC<NavigationProps> = ({ className = '', site, menus, auth }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [cartCount, setCartCount] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        let isMounted = true;

        const fetchCartCount = async () => {
            try {
                const response = await fetch('/shop/cart/count');
                const data = await response.json();
                if (isMounted && typeof data.count === 'number') {
                    setCartCount(data.count);
                }
            } catch (error) {
                // Silently ignore cart count errors
            }
        };

        fetchCartCount();
        const interval = window.setInterval(fetchCartCount, 30000);

        return () => {
            isMounted = false;
            window.clearInterval(interval);
        };
    }, []);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    return (
        <nav
            className={`fixed z-50 w-full transition-all duration-500 ${
                isScrolled ? 'border-b border-gray-100/50 bg-white/90 py-3 shadow-lg backdrop-blur-md' : 'bg-indigo-950/95 py-5 backdrop-blur-sm'
            } ${className}`}
        >
            <div className="container mx-auto px-6">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="group flex items-center">
                        <div className="relative">
                            <span
                                className={`text-3xl font-bold transition-all duration-300 ${
                                    isScrolled ? 'text-indigo-700' : 'text-white drop-shadow-lg'
                                }`}
                            >
                                ModuloCMS
                            </span>
                            <div
                                className={`absolute -bottom-1 left-0 h-0.5 bg-indigo-600 transition-all duration-300 ${
                                    isScrolled ? 'w-0 group-hover:w-full' : 'w-full'
                                }`}
                            ></div>
                        </div>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden items-center space-x-1 md:flex">
                        <Link
                            href="/"
                            className={`relative rounded-lg px-4 py-2 font-medium transition-all duration-300 ${
                                isScrolled ? 'text-gray-700 hover:bg-blue-50 hover:text-blue-600' : 'text-white/90 hover:bg-white/10 hover:text-white'
                            }`}
                        >
                            <span className="relative z-10">Home</span>
                        </Link>
                        <Link
                            href="/shop"
                            className={`relative rounded-lg px-4 py-2 font-medium transition-all duration-300 ${
                                isScrolled ? 'text-gray-700 hover:bg-blue-50 hover:text-blue-600' : 'text-white/90 hover:bg-white/10 hover:text-white'
                            }`}
                        >
                            <span className="relative z-10">Shop</span>
                        </Link>
                        <Link
                            href="/posts"
                            className={`relative rounded-lg px-4 py-2 font-medium transition-all duration-300 ${
                                isScrolled ? 'text-gray-700 hover:bg-blue-50 hover:text-blue-600' : 'text-white/90 hover:bg-white/10 hover:text-white'
                            }`}
                        >
                            <span className="relative z-10">Posts</span>
                        </Link>
                        <Link
                            href="/about"
                            className={`relative rounded-lg px-4 py-2 font-medium transition-all duration-300 ${
                                isScrolled ? 'text-gray-700 hover:bg-blue-50 hover:text-blue-600' : 'text-white/90 hover:bg-white/10 hover:text-white'
                            }`}
                        >
                            <span className="relative z-10">About</span>
                        </Link>
                        <Link
                            href="/contact"
                            className={`relative rounded-lg px-4 py-2 font-medium transition-all duration-300 ${
                                isScrolled ? 'text-gray-700 hover:bg-blue-50 hover:text-blue-600' : 'text-white/90 hover:bg-white/10 hover:text-white'
                            }`}
                        >
                            <span className="relative z-10">Contact</span>
                        </Link>
                        <div className="ml-6 flex items-center space-x-3">
                            <Link
                                href="/shop/cart"
                                className={`relative flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-all duration-300 ${
                                    isScrolled
                                        ? 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                                        : 'text-white/90 hover:bg-white/10 hover:text-white'
                                }`}
                            >
                                <ShoppingCart className="h-4 w-4" />
                                <span>Cart</span>
                                {cartCount > 0 && (
                                    <span className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                                        {cartCount}
                                    </span>
                                )}
                            </Link>
                            {auth?.user ? (
                                // User is logged in - show dashboard and logout
                                <>
                                    <span
                                        className={`rounded-full px-3 py-1 text-sm font-medium ${
                                            isScrolled ? 'bg-gray-100 text-gray-600' : 'bg-white/10 text-white/80'
                                        }`}
                                    >
                                        Welcome, {auth.user.name}
                                    </span>
                                    <Link
                                        href="/dashboard"
                                        className={`rounded-lg px-4 py-2 font-medium transition-all duration-300 ${
                                            isScrolled
                                                ? 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                                                : 'text-white/90 hover:bg-white/10 hover:text-white'
                                        }`}
                                    >
                                        Dashboard
                                    </Link>
                                    <Link
                                        href="/logout"
                                        method="post"
                                        as="button"
                                        className="transform rounded-lg bg-indigo-700 px-4 py-2 font-medium text-white shadow-lg transition-all duration-300 hover:scale-105 hover:bg-indigo-800 hover:shadow-xl"
                                    >
                                        Logout
                                    </Link>
                                </>
                            ) : (
                                // User is not logged in - show login and register
                                <>
                                    <Link
                                        href="/login"
                                        className={`rounded-lg px-4 py-2 font-medium transition-all duration-300 ${
                                            isScrolled
                                                ? 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                                                : 'text-white/90 hover:bg-white/10 hover:text-white'
                                        }`}
                                    >
                                        Login
                                    </Link>
                                    <Link
                                        href="/register"
                                        className="transform rounded-lg bg-indigo-600 px-6 py-2 font-medium text-white shadow-lg transition-all duration-300 hover:scale-105 hover:bg-indigo-700 hover:shadow-xl"
                                    >
                                        Register
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden">
                        <button
                            onClick={toggleMenu}
                            className={`rounded-lg p-2 transition-all duration-300 focus:outline-none ${
                                isScrolled ? 'text-gray-700 hover:bg-blue-50 hover:text-blue-600' : 'text-white hover:bg-white/10'
                            }`}
                            aria-label="Toggle menu"
                        >
                            <svg className="h-6 w-6 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                {isMenuOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Mobile menu */}
                <div
                    className={`transition-all duration-500 ease-in-out md:hidden ${
                        isMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 overflow-hidden opacity-0'
                    }`}
                >
                    <div
                        className={`mt-4 rounded-xl border border-white/10 p-4 backdrop-blur-md ${
                            isScrolled ? 'bg-white/95 shadow-lg' : 'bg-white/10'
                        }`}
                    >
                        <div className="space-y-1">
                            <Link
                                href="/"
                                className={`block rounded-lg px-4 py-3 font-medium transition-all duration-300 ${
                                    isScrolled ? 'text-gray-700 hover:bg-blue-50 hover:text-blue-600' : 'text-white hover:bg-white/20'
                                }`}
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Home
                            </Link>
                            <Link
                                href="/shop"
                                className={`block rounded-lg px-4 py-3 font-medium transition-all duration-300 ${
                                    isScrolled ? 'text-gray-700 hover:bg-blue-50 hover:text-blue-600' : 'text-white hover:bg-white/20'
                                }`}
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Shop
                            </Link>
                            <Link
                                href="/shop/cart"
                                className={`flex items-center justify-between rounded-lg px-4 py-3 font-medium transition-all duration-300 ${
                                    isScrolled ? 'text-gray-700 hover:bg-blue-50 hover:text-blue-600' : 'text-white hover:bg-white/20'
                                }`}
                                onClick={() => setIsMenuOpen(false)}
                            >
                                <span className="flex items-center gap-2">
                                    <ShoppingCart className="h-4 w-4" />
                                    Cart
                                </span>
                                {cartCount > 0 && (
                                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                                        {cartCount}
                                    </span>
                                )}
                            </Link>
                            <Link
                                href="/posts"
                                className={`block rounded-lg px-4 py-3 font-medium transition-all duration-300 ${
                                    isScrolled ? 'text-gray-700 hover:bg-blue-50 hover:text-blue-600' : 'text-white hover:bg-white/20'
                                }`}
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Posts
                            </Link>
                            <Link
                                href="/about"
                                className={`block rounded-lg px-4 py-3 font-medium transition-all duration-300 ${
                                    isScrolled ? 'text-gray-700 hover:bg-blue-50 hover:text-blue-600' : 'text-white hover:bg-white/20'
                                }`}
                                onClick={() => setIsMenuOpen(false)}
                            >
                                About
                            </Link>
                            <Link
                                href="/contact"
                                className={`block rounded-lg px-4 py-3 font-medium transition-all duration-300 ${
                                    isScrolled ? 'text-gray-700 hover:bg-blue-50 hover:text-blue-600' : 'text-white hover:bg-white/20'
                                }`}
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Contact
                            </Link>
                            <div className={`my-3 border-t ${isScrolled ? 'border-gray-200' : 'border-white/20'}`}></div>
                            {auth?.user ? (
                                // User is logged in - mobile menu
                                <>
                                    <div className={`px-4 py-2 text-sm font-medium ${isScrolled ? 'text-gray-500' : 'text-white/70'}`}>
                                        Welcome, {auth.user.name}
                                    </div>
                                    <Link
                                        href="/dashboard"
                                        className={`block rounded-lg px-4 py-3 font-medium transition-all duration-300 ${
                                            isScrolled ? 'text-gray-700 hover:bg-blue-50 hover:text-blue-600' : 'text-white hover:bg-white/20'
                                        }`}
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        Dashboard
                                    </Link>
                                    <Link
                                        href="/logout"
                                        method="post"
                                        as="button"
                                        className="block w-full rounded-lg bg-indigo-700 px-4 py-3 text-left font-medium text-white transition-all duration-300 hover:bg-indigo-800"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        Logout
                                    </Link>
                                </>
                            ) : (
                                // User is not logged in - mobile menu
                                <>
                                    <Link
                                        href="/login"
                                        className={`block rounded-lg px-4 py-3 font-medium transition-all duration-300 ${
                                            isScrolled ? 'text-gray-700 hover:bg-blue-50 hover:text-blue-600' : 'text-white hover:bg-white/20'
                                        }`}
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        Login
                                    </Link>
                                    <Link
                                        href="/register"
                                        className="block rounded-lg bg-indigo-600 px-4 py-3 text-center font-medium text-white transition-all duration-300 hover:bg-indigo-700"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        Register
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navigation;
