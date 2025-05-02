// app/api/gameUpdate/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { userId, pointsEarned, movesUsed } = await req.json();

    // Validate input
    if (!userId || typeof pointsEarned !== 'number' || typeof movesUsed !== 'number') {
      return NextResponse.json(
        { message: 'Invalid request data' },
        { status: 400 }
      );
    }

    // Get current user state
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        score: true,
        moves: true,
        moveResetAt: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    const now = new Date();
    let currentMoves = user.moves;
    let moveResetAt = user.moveResetAt;

    // Check if reset time has arrived
    if (moveResetAt && now > moveResetAt) {
      currentMoves = 30;
      moveResetAt = null;
    }

    // Check if user has enough moves
    if (currentMoves < movesUsed) {
      return NextResponse.json(
        {
          message: 'Not enough moves',
          availableMoves: currentMoves
        },
        { status: 400 }
      );
    }

    // Calculate new moves after use
    const newMoves = currentMoves - movesUsed;

    // Set reset timer if moves are depleted
    if (newMoves <= 0) {
      moveResetAt = new Date(now.getTime() + 60 * 60 * 1000);
    }

    // Update game state
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        score: { increment: pointsEarned },
        moves: newMoves,
        moveResetAt: moveResetAt
      },
      select: {
        score: true,
        moves: true,
        moveResetAt: true
      }
    });

    return NextResponse.json({
      message: 'Game updated successfully',
      newScore: updatedUser.score,
      remainingMoves: updatedUser.moves,
      nextReset: updatedUser.moveResetAt
    });

  } catch (error) {
    console.error('Game update error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}