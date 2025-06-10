import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log(`📡 GET /api/tasks/${params.id} called`);
    const task = await prisma.task.findUnique({
      where: { id: params.id },
    });
    if (!task) {
      console.log('❌ Task not found:', params.id);
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    console.log('📊 Task fetched:', task);
    return NextResponse.json(task, { status: 200 });
  } catch (error: any) {
    console.error('❌ Error fetching task:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { title, link, point } = await request.json();
    console.log(`📝 Updating task ${params.id}:`, { title, link, point });
    if (!title || !link || point == null) {
      return NextResponse.json(
        { error: 'Title, link, and point are required' },
        { status: 400 }
      );
    }
    const task = await prisma.task.update({
      where: { id: params.id },
      data: {
        title,
        link,
        point: Number(point),
      },
    });
    console.log('✅ Task updated:', task);
    return NextResponse.json(task, { status: 200 });
  } catch (error: any) {
    if (error.code === 'P2025') {
      console.log('❌ Task not found:', params.id);
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    console.error('❌ Error updating task:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log(`🗑️ Deleting task ${params.id}`);
    await prisma.task.delete({
      where: { id: params.id },
    });
    console.log('✅ Task deleted:', params.id);
    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    if (error.code === 'P2025') {
      console.log('❌ Task not found:', params.id);
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    console.error('❌ Error deleting task:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}