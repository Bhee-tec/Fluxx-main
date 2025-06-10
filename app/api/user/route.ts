import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    console.log('📡 GET /api/users called');
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        telegramId: true,
        username: true,
        firstName: true,
        lastName: true,
        points: true,
        score: true,
        moves: true,
      },
    });
    return NextResponse.json(users, { status: 200 });
  } catch (error: any) {
    console.error('❌ Error fetching users:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('🔍 Incoming Telegram payload:', body);

    const userData = body.user;

    if (!userData || !userData.id) {
      return NextResponse.json(
        { message: 'Missing or invalid Telegram user data' },
        { status: 400 }
      );
    }

    const telegramId = userData.id;
    const username = userData.username || null;
    const firstName = userData.first_name || null;
    const lastName = userData.last_name || null;

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
      },
    });

    return NextResponse.json({
      id: user.id,
      telegramId: user.telegramId,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      score: user.score,
      points: user.points,
      moves: user.moves,
    });
  } catch (error: any) {
    console.error('❌ Internal Server Error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}