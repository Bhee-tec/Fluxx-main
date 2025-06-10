import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const task = await prisma.task.findUnique({
      where: { id: params.id },
    });
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    return NextResponse.json(task, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { title, link, point } = await request.json();
    if (!title || !link || point == null) {
      return NextResponse.json({ error: 'Title, link, and point are required' }, { status: 400 });
    }
    const task = await prisma.task.update({
      where: { id: params.id },
      data: {
        title,
        link,
        point: Number(point),
      },
    });
    return NextResponse.json(task, { status: 200 });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    console.error(error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.task.delete({
      where: { id: params.id },
    });
    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    console.error(error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}