import { NextRequest, NextResponse } from 'next/server';
import { deleteFile } from '@/lib/s3';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cloudStoragePath } = body;

    if (!cloudStoragePath) {
      return NextResponse.json(
        { error: 'cloudStoragePath is required' },
        { status: 400 }
      );
    }

    await deleteFile(cloudStoragePath);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}
