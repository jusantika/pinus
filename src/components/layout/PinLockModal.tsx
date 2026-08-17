'use client';

import { useState, useEffect } from 'react';
import { Lock } from 'lucide-react';

export default function PinLockModal({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    const authStatus = sessionStorage.getItem('is_authenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPin = process.env.NEXT_PUBLIC_APP_PIN;
    
    if (pin === correctPin) {
      sessionStorage.setItem('is_authenticated', 'true');
      setIsAuthenticated(true);
      setError(false);
    } else {
      setError(true);
      setPin(''); 
    }
  };

  if (loading) {
    return <div className="h-screen w-full bg-[#f8f9fa] flex items-center justify-center" />;
  }

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-[#f8f9fa] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm animate-in fade-in zoom-in-95 duration-500">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-[0_20px_40px_rgb(0,0,0,0.06)] border border-gray-100 text-center">
          <div className="w-20 h-20 bg-gray-900 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-gray-900/20 rotate-3">
            <Lock className="w-10 h-10 text-white -rotate-3" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">Private</h2>
          <p className="text-gray-500 text-sm mb-10 font-medium">Enter PIN to access your memories</p>
          
          <form onSubmit={handleSubmit}>
            <div className="relative mb-8">
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                className={`w-full text-center tracking-[1em] font-mono text-4xl py-6 px-4 border-2 rounded-[2rem] focus:outline-none transition-all bg-gray-50 text-gray-900 ${
                  error 
                    ? 'border-rose-400 focus:border-rose-500 focus:bg-rose-50 text-rose-600' 
                    : 'border-transparent focus:border-gray-900 focus:bg-white'
                }`}
                placeholder="PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                autoFocus
              />
            </div>
            
            <button
              type="submit"
              className="w-full bg-gray-900 text-white font-bold text-lg rounded-full py-5 hover:bg-black active:scale-[0.98] transition-all shadow-[0_8px_30px_rgb(0,0,0,0.12)]"
            >
              Unlock
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
