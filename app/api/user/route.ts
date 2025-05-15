import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user } = body;

    if (!user || !user.id) {
      return NextResponse.json({ error: 'Invalid user data' }, { status: 400 });
    }

    const telegramId = Number(user.id);

    // Check if the user already exists
    let existingUser = await prisma.user.findUnique({
      where: { telegramId },
    });

    // If user doesn't exist, create new user
    if (!existingUser) {
      existingUser = await prisma.user.create({
        data: {
          telegramId,
          username: user.username ?? '',
          firstName: user.first_name ?? '',
          lastName: user.last_name ?? '',
          moveResetAt: new Date(), // Initialize it here if needed
        },
      });
    }

    // Reset moves if 24 hours passed
    if (
      existingUser.moveResetAt &&
      new Date(existingUser.moveResetAt).getTime() < Date.now() - 24 * 60 * 60 * 1000
    ) {
      existingUser = await prisma.user.update({
        where: { telegramId },
        data: {
          moves: 30,
          moveResetAt: new Date(),
        },
      });
    }

    return NextResponse.json(existingUser);
  } catch (error) {
    console.error('❌ Server Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
