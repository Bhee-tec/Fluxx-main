'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { WebApp } from '@twa-dev/types';
import Navbar from '@/components/ui/Navbar';
import Game from '@/components/ui/Game';
import Loading from '@/app/loading';

declare global {
  interface Window {
    Telegram: {
      WebApp: WebApp;
    };
  }
}

interface TelegramUser {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
}

export default function GamePageClient() {
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [initData, setInitData] = useState<string | null>(null);
  const [initialScore, setInitialScore] = useState<number>(0);
  const [initialMoves, setInitialMoves] = useState<number>(0);

  useEffect(() => {
    const controller = new AbortController();

    const initializeApp = async () => {
      try {
        if (typeof window === 'undefined' || !window.Telegram?.WebApp) {
          setError('This app must be opened within Telegram');
          return;
        }

        const tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();

        if (!tg.initDataUnsafe?.user) {
          setError('Missing user authentication data');
          return;
        }

        const userPayload: TelegramUser = tg.initDataUnsafe.user;

        const response = await fetch('/api/user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user: {
              id: userPayload.id,
              username: userPayload.username,
              first_name: userPayload.first_name,
              last_name: userPayload.last_name,
            },
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const userData = await response.json();
        setUser(userData);
        setInitData(tg.initData);
        setInitialScore(userData.score || 0);
        setInitialMoves(userData.moves || 0);
      } catch (err) {
        console.error('Telegram init error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load user data');
      }
    };

    initializeApp();
    return () => controller.abort();
  }, []);

  if (error) {
    return (
      <div className="flex flex-col min-h-screen bg-[#06060F] text-white p-4 font-sans">
        <div className="text-center py-8">
          <h1 className="text-2xl text-red-500 mb-4">⚠️ {error}</h1>
          <p>
            {error.includes('Missing')
              ? 'Please open this page through your Telegram bot'
              : 'Please try again or contact support'}
          </p>
        </div>
        <Navbar />
      </div>
    );
  }

  if (!user) {
    return <Loading />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#06060F] text-white p-4 font-sans">
      <div className="max-h-fit bg-gradient-to-br p-4">
        <Suspense fallback={<Loading />}>
          <Game
            userId={user.id} // this is Mongo's `_id` returned as string
            initialScore={initialScore}
            initialMoves={initialMoves}
          />
        </Suspense>
      </div>
      <Navbar />
    </div>
  );
}
