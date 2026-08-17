'use client';

import dynamic from 'next/dynamic';

const DynamicMap = dynamic(() => import('@/components/map/DynamicMap'), {
  ssr: false,
  loading: () => (
    <div className="h-screen w-full flex items-center justify-center bg-gray-100">
      <p className="text-lg font-medium text-gray-600">Memuat Peta...</p>
    </div>
  )
});

export default function Home() {
  return (
    <main className="fixed inset-0 z-0">
      <DynamicMap />
    </main>
  );
}
