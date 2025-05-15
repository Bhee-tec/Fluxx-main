// /app/api/user/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user } = body;

    if (!user || !user.id) {
      return NextResponse.json({ error: 'Invalid user data' }, { status: 400 });
    }

    let existingUser = await prisma.user.findUnique({
      where: { telegramId: user.id },
    });

    if (!existingUser) {
      existingUser = await prisma.user.create({
        data: {
          telegramId: user.id,
          username: user.username || '',
          firstName: user.first_name || '',
          lastName: user.last_name || '',
        },
      });
    }

    // Reset moves if 24h has passed
    if (existingUser.moveResetAt && new Date(existingUser.moveResetAt).getTime() < Date.now() - 86400000) {
      existingUser = await prisma.user.update({
        where: { telegramId: user.id },
        data: {
          moves: 30,
          moveResetAt: new Date(),
        },
      });
    }

    return NextResponse.json(existingUser);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
