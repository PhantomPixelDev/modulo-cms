import { Link } from '@inertiajs/react';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

interface HeaderProps {
    site?: {
        name?: string;
        tagline?: string;
        logo?: string;
    };
    menu?: Array<{
        id: number;
        label: string;
        url: string;
        target: string;
        children?: Array<any>;
    }>;
    theme?: {
        colors?: {
            primary?: string;
            secondary?: string;
            gradient_from?: string;
            gradient_to?: string;
            text_primary?: string;
            text_muted?: string;
            border?: string;
            card?: string;
            button_text?: string;
        };
    };
}

export default function Header({ site, menu, theme }: HeaderProps) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const safeSite = site && typeof site === 'object' ? site : { name: 'Modulo CMS', tagline: '' };
    const themeColors = theme?.colors || {};
    const primary = themeColors.primary || '#3b82f6';
    const secondary = themeColors.secondary || '#64748b';
    const gradientFrom = themeColors.gradient_from || primary;
    const gradientTo = themeColors.gradient_to || secondary;
    const textPrimary = themeColors.text_primary || '#0f172a';
    const textMuted = themeColors.text_muted || '#94a3b8';
    const borderColor = themeColors.border || 'rgba(255,255,255,0.12)';
    const cardBg = themeColors.card || '#0f172a';
    const buttonText = themeColors.button_text || '#ffffff';

    return (
        <header
            className="shadow-xl backdrop-blur-sm"
            style={{
                background: `linear-gradient(120deg, ${gradientFrom}ee, ${gradientTo}ee)`,
                borderBottom: `1px solid ${borderColor}`,
            }}
        >
            <div className="container mx-auto px-6">
                <div className="flex h-20 items-center justify-between">
                    {/* Logo/Brand */}
                    <div className="flex items-center">
                        <Link href="/" className="group flex items-center space-x-4">
                            {site?.logo ? (
                                <img
                                    src={site.logo}
                                    alt={site.name || 'Logo'}
                                    className="h-10 w-auto transition-transform duration-300 group-hover:scale-105"
                                />
                            ) : (
                                <div
                                    className="flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold shadow-lg transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl"
                                    style={{ background: secondary, color: buttonText }}
                                >
                                    {(safeSite?.name || 'M').charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div>
                                <h1 className="text-2xl font-bold drop-shadow-lg transition-colors duration-300" style={{ color: buttonText }}>
                                    {safeSite?.name || 'Modulo CMS'}
                                </h1>
                                {safeSite?.tagline && (
                                    <p className="mt-0.5 hidden text-sm sm:block" style={{ color: `${buttonText}cc` }}>
                                        {safeSite.tagline}
                                    </p>
                                )}
                            </div>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden space-x-2 md:flex">
                        {menu?.map((item) => (
                            <Link
                                key={item.id}
                                href={item.url}
                                target={item.target}
                                className="relative transform rounded-lg px-5 py-3 font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg"
                                style={{ color: `${buttonText}dd` }}
                            >
                                <span className="relative z-10">{item.label}</span>
                                <div
                                    className="absolute inset-0 rounded-lg opacity-0 transition-opacity duration-300 hover:opacity-100"
                                    style={{ backgroundColor: `${buttonText}1a` }}
                                ></div>
                            </Link>
                        ))}
                    </nav>

                    {/* Mobile menu button */}
                    <div className="md:hidden">
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="rounded-lg p-3 transition-all duration-300"
                            style={{ color: buttonText, backgroundColor: mobileMenuOpen ? `${buttonText}22` : 'transparent' }}
                            aria-label="Toggle menu"
                        >
                            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation */}
                {mobileMenuOpen && (
                    <div className="pb-6 md:hidden">
                        <div
                            className="mt-4 rounded-xl p-4 backdrop-blur-md"
                            style={{ backgroundColor: `${cardBg}dd`, border: `1px solid ${borderColor}` }}
                        >
                            <nav className="flex flex-col space-y-2">
                                {menu?.map((item) => (
                                    <Link
                                        key={item.id}
                                        href={item.url}
                                        target={item.target}
                                        className="transform rounded-lg px-4 py-3 text-base font-medium transition-all duration-300 hover:scale-105"
                                        style={{ color: buttonText, backgroundColor: `${buttonText}14` }}
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        {item.label}
                                    </Link>
                                ))}
                            </nav>
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}
