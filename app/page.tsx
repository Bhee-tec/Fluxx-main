// app/page.tsx (server component)
import { Metadata } from 'next';
import GamePageClient from './GamePageClient';

export const metadata: Metadata = {
  title: 'Game Page',
  description: 'Match-3 Puzzle Game',
};

export default function Page(props: any) {
  return <GamePageClient {...props} />;
}
