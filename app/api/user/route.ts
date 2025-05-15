// Example: app/api/user/route.ts (for App Router)
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { user } = await req.json();

    if (!user || !user.id) {
      return NextResponse.json({ error: 'Missing Telegram user ID' }, { status: 400 });
    }

    // Check if user already exists
    let existingUser = await prisma.user.findUnique({
      where: { telegramId: user.id },
    });

    if (!existingUser) {
      // Create new user if they don't exist
      existingUser = await prisma.user.create({
        data: {
          telegramId: user.id,
          username: user.username,
          firstName: user.first_name,
          lastName: user.last_name,
        },
      });
    }

    return NextResponse.json(existingUser, { status: 200 });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
