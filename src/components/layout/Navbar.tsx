'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Map, History, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const navItems = [
    { name: 'Map', path: '/', icon: Map },
    { name: 'Timeline', path: '/timeline', icon: History },
    { name: 'Wishlist', path: '/wishlist', icon: Heart },
  ];

  if (!mounted) return null;

  return (
    <div className="fixed bottom-6 w-full px-4 z-[1500] flex justify-center pointer-events-none">
      <motion.nav 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="pointer-events-auto flex items-center gap-1 p-1.5 rounded-full bg-[#1c1c1e]/80 backdrop-blur-2xl border border-white/10 shadow-2xl"
      >
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.name}
              href={item.path}
              className="relative outline-none flex-shrink-0"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <motion.div
                layout
                className={`flex items-center justify-center h-14 rounded-full transition-colors duration-300 ${
                  isActive ? 'text-white px-6' : 'text-neutral-400 hover:text-white active:scale-95 px-5'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 bg-white/15 rounded-full"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <motion.div layout className="relative z-10 flex items-center justify-center">
                  <item.icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
                </motion.div>
                
                {isActive && (
                  <motion.span
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30, delay: 0.05 }}
                    className="relative z-10 ml-2.5 text-[15px] font-semibold tracking-wide whitespace-nowrap"
                  >
                    {item.name}
                  </motion.span>
                )}
              </motion.div>
            </Link>
          );
        })}
      </motion.nav>
    </div>
  );
}
