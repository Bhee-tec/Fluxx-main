import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // adjust path to your prisma instance

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const telegramUser = body.user;

    if (!telegramUser?.id) {
      return NextResponse.json({ error: 'Telegram user ID is required' }, { status: 400 });
    }

    // Step 1: Check if user exists
    let user = await prisma.user.findUnique({
      where: { telegramId: telegramUser.id },
    });

    // Step 2: Create new user if not found
    if (!user) {
      user = await prisma.user.create({
        data: {
          telegramId: telegramUser.id,
          username: telegramUser.username,
          firstName: telegramUser.first_name,
          lastName: telegramUser.last_name,
        },
      });
    }

    return NextResponse.json(user);
  } catch (error: any) {
    console.error('Error creating user:', error);

    // Handle unique constraint error
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'User already exists' }, { status: 409 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
