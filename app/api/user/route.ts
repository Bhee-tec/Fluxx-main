import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const {
      telegramId,
      username,
      firstName,
      lastName,
    }: {
      telegramId: number;
      username?: string;
      firstName?: string;
      lastName?: string;
    } = await req.json();

    // Validate input
    if (!telegramId || typeof telegramId !== 'number') {
      return NextResponse.json(
        { message: 'Invalid telegramId' },
        { status: 400 }
      );
    }

    // Upsert user by telegramId
    const user = await prisma.user.upsert({
      where: { telegramId },
      update: {
        username,
        firstName,
        lastName,
        updatedAt: new Date(),
      },
      create: {
        telegramId,
        username,
        firstName,
        lastName,
        // other default fields if needed
      },
    });

    return NextResponse.json({
      message: 'User created or updated successfully',
      user,
    });
  } catch (error) {
    console.error('User upsert error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
