import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  return NextResponse.json({ message: 'Hello from the API!' })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    // Process the body here
    return NextResponse.json({ message: 'Data received', data: body })
  } catch (error) {
    return NextResponse.json({ error: 'Error processing request' }, { status: 400 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    // Process the body here
    return NextResponse.json({ message: 'Data updated', data: body })
  } catch (error) {
    return NextResponse.json({ error: 'Error processing request' }, { status: 400 })
  }
}

export async function DELETE(request: NextRequest) {
  return NextResponse.json({ message: 'Resource deleted' })
}