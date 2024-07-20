import { NextResponse } from 'next/server';
import { hashPassword} from '@/lib/utils/password';
import prisma from '@/prisma';

export async function POST(request: Request) {
  try {
    const { email, name, password, preferredLanguage } = await request.json();

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ message: 'User already exists' }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await hashPassword(password, 10);

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        preferredLanguage,
      },
    });

    return NextResponse.json({ message: 'User created successfully', userId: newUser.id }, { status: 201 });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ message: 'Error creating user' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}