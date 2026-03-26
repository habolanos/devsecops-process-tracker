import { NextRequest, NextResponse } from 'next/server';
import { getFileUrl } from '@/lib/s3';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cloudStoragePath, isPublic } = body;

    if (!cloudStoragePath) {
      return NextResponse.json(
        { error: 'cloudStoragePath is required' },
        { status: 400 }
      );
    }

    const url = await getFileUrl(cloudStoragePath, isPublic ?? false);

    return NextResponse.json({ url });
  } catch (error) {
    console.error('Error completing upload:', error);
    return NextResponse.json(
      { error: 'Failed to complete upload' },
      { status: 500 }
    );
  }
}
