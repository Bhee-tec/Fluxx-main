import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user } = body;

    if (!user || !user.id) {
      return NextResponse.json({ error: 'Invalid user data' }, { status: 400 });
    }

    // Find user by Telegram ID
    let existingUser = await prisma.user.findUnique({
      where: { telegramId: user.id },
    });

    // If user doesn't exist, create one
    if (!existingUser) {
      existingUser = await prisma.user.create({
        data: {
          telegramId: user.id,
          username: user.username || '',
          firstName: user.first_name || '',
          lastName: user.last_name || '',
          referralCode: body.referralCode || '', // Optional referral code
        },
      });
    }

    // Check for moves reset logic (optional, based on your design)
    if (existingUser.moveResetAt && new Date(existingUser.moveResetAt).getTime() < Date.now() - 86400000) {
      // Reset moves to 30 if it's time (for example, 24-hour reset)
      await prisma.user.update({
        where: { telegramId: existingUser.telegramId },
        data: {
          moves: 30, // Resetting moves to the starting value
          moveResetAt: new Date(), // Set current time as move reset time
        },
      });
    }

    return NextResponse.json(existingUser);
  } catch (error) {
    console.error('Error processing user data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
