import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const tasks = await prisma.task.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(tasks, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: Request) {
  try {
    const { title, link, point } = await request.json();
    if (!title || !link || point == null) {
      return NextResponse.json({ error: 'Title, link, and point are required' }, { status: 400 });
    }
    const task = await prisma.task.create({
      data: {
        title,
        link,
        point: Number(point),
      },
    });
    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}