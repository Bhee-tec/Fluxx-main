import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { user } = await req.json();

    if (!user || !user.id) {
      return NextResponse.json({ error: 'Missing Telegram user ID' }, { status: 400 });
    }

    const upsertedUser = await prisma.user.upsert({
      where: { telegramId: user.id },
      update: {
        username: user.username || '',
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        updatedAt: new Date(),
      },
      create: {
        telegramId: user.id,
        username: user.username || '',
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(upsertedUser, { status: 200 });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
