'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/ui/Navbar';
import Game from '@/components/ui/Game';
import Loading from '@/app/loading';

async function getUserData(initData: string) {
  const response = await fetch('/api/user', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ initData }),
  });

  if (!response.ok) throw new Error('Failed to fetch user data');
  return await response.json();
}

export default function GamePageClient() {
  const searchParams = useSearchParams();
  const initData = searchParams.get('initData');

  const [userData, setUserData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ErrorContainer = ({ message }: { message: string }) => (
    <div className="flex flex-col min-h-screen bg-[#06060F] text-white p-4 font-sans">
      <div className="text-center py-8">
        <h1 className="text-2xl text-red-500 mb-4">{message}</h1>
        <p>
          {message.includes('Missing')
            ? 'Please open this page through your Telegram bot'
            : 'Please try again or contact support'}
        </p>
      </div>
      <Navbar />
    </div>
  );

  useEffect(() => {
    if (!initData) {
      setError('Missing Telegram authentication data');
      return;
    }

    getUserData(initData)
      .then(setUserData)
      .catch(() => setError('Authentication Failed'));
  }, [initData]);

  if (error) return <ErrorContainer message={error} />;
  if (!userData) return <Loading />;

  return (
    <div className="flex flex-col min-h-screen bg-[#06060F] text-white p-4 font-sans">
      <div className="max-h-fit bg-gradient-to-br p-4">
        <Suspense fallback={<Loading />}>
          <Game
            userId={userData.id}
            initialScore={userData.score}
            initialMoves={userData.moves}
          />
        </Suspense>
      </div>
      <Navbar />
    </div>
  );
}
