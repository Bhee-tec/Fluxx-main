import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
    try {
        // Get the user data from the request body
        const body = await req.json();
        const { user, referralCode } = body;

        // Log the received user data for debugging
        console.log('Received user data:', user);

        // Validate the required fields
        if (!user || !user.id) {
            console.error('Invalid user data: Missing user ID', user); // Log the issue
            return NextResponse.json({ error: 'Invalid user data' }, { status: 400 });
        }

        // Check if the user already exists in the database
        let existingUser = await prisma.user.findUnique({
            where: { telegramId: user.id },
        });

        // If the user doesn't exist, create a new user
        if (!existingUser) {
            try {
                existingUser = await prisma.user.create({
                    data: {
                        telegramId: user.id,
                        username: user.username || '',
                        firstName: user.first_name || '',
                        lastName: user.last_name || '',
                    },
                });
                console.log('New user created:', existingUser);
            } catch (createError) {
                console.error('Error creating user:', createError); // Log any error during user creation
                return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
            }
        }

        // Check if the user's moves need to be reset (after 24 hours)
        if (existingUser.moveResetAt && new Date(existingUser.moveResetAt).getTime() < Date.now() - 86400000) {
            try {
                // Reset moves and update the moveResetAt timestamp
                await prisma.user.update({
                    where: { telegramId: existingUser.telegramId },
                    data: {
                        moves: 30,
                        moveResetAt: new Date(),
                    },
                });
                console.log('Moves reset for user:', existingUser.telegramId);
            } catch (resetError) {
                console.error('Error resetting moves:', resetError); // Log any error during move reset
                return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
            }
        }

        // Return the user data
        return NextResponse.json(existingUser);
    } catch (error) {
        console.error('Error processing user data:', error); // Log any unexpected errors
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
