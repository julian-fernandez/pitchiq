'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

const NAV_LINKS = [
  { href: '/',          label: 'Home' },
  { href: '/leagues',   label: 'Table' },
  { href: '/explorer',  label: 'Matches' },
  { href: '/compare',   label: 'Scorers' },
];

export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <>
      {/* Thin top bar — solid black, editorial */}
      <header className="fixed top-0 inset-x-0 z-50 bg-[#0B0B0B] border-b border-white/10">
        <nav
          className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between"
          aria-label="Main navigation"
        >
          {/* Wordmark */}
          <Link
            href="/"
            className="flex items-center gap-2.5 group"
            aria-label="PitchIQ home"
          >
            {/* PL-esque crest shape */}
            <div className="w-7 h-7 bg-[#E8BE00] flex items-center justify-center flex-shrink-0" style={{ clipPath: 'polygon(50% 0%, 100% 20%, 100% 80%, 50% 100%, 0% 80%, 0% 20%)' }}>
              <span className="font-[var(--font-oswald)] font-700 text-[#0B0B0B] text-[10px] leading-none tracking-tighter select-none">PL</span>
            </div>
            <span className="font-[var(--font-oswald)] font-bold text-lg tracking-wide text-white uppercase">
              Pitch<span className="text-[#E8BE00]">IQ</span>
            </span>
          </Link>

          {/* Desktop links */}
          <ul className="hidden md:flex items-center" role="list">
            {NAV_LINKS.map(({ href, label }) => {
              const active = pathname === href || (href !== '/' && pathname.startsWith(href));
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={`relative px-4 py-5 text-xs font-[var(--font-oswald)] font-semibold tracking-widest uppercase transition-colors flex items-center ${
                      active ? 'text-[#E8BE00]' : 'text-white/50 hover:text-white'
                    }`}
                    aria-current={active ? 'page' : undefined}
                  >
                    {label}
                    {active && (
                      <motion.span
                        layoutId="nav-bar"
                        className="absolute bottom-0 inset-x-0 h-[2px] bg-[#E8BE00]"
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Mobile hamburger */}
          <button
            className="md:hidden w-8 h-8 flex flex-col items-center justify-center gap-[5px]"
            onClick={() => setOpen(v => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            <span className={`w-5 h-[1.5px] bg-white transition-all ${open ? 'rotate-45 translate-y-[6.5px]' : ''}`} />
            <span className={`w-5 h-[1.5px] bg-white transition-all ${open ? 'opacity-0' : ''}`} />
            <span className={`w-5 h-[1.5px] bg-white transition-all ${open ? '-rotate-45 -translate-y-[6.5px]' : ''}`} />
          </button>
        </nav>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-x-0 top-14 z-40 bg-[#0B0B0B] border-b border-white/10 md:hidden"
          >
            <ul className="flex flex-col py-2" role="list">
              {NAV_LINKS.map(({ href, label }) => {
                const active = pathname === href || (href !== '/' && pathname.startsWith(href));
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      className={`block px-5 py-4 text-sm font-[var(--font-oswald)] font-semibold tracking-widest uppercase border-b border-white/5 transition-colors ${
                        active ? 'text-[#E8BE00] border-l-2 border-l-[#E8BE00] pl-[18px]' : 'text-white/55 hover:text-white'
                      }`}
                      aria-current={active ? 'page' : undefined}
                    >
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
