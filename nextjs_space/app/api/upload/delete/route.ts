import { NextRequest, NextResponse } from 'next/server';
import { deleteFile } from '@/lib/s3';
import { deleteUploadSchema, validateSchema } from '@/lib/api-schemas';
import { withRateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  // Rate limiting
  const rateLimit = withRateLimit(request, 'upload/delete', 'strict');
  if (!rateLimit.allowed) return rateLimit.response!;
  
  try {
    const body = await request.json();
    
    // Validate input with Zod
    const validation = validateSchema(deleteUploadSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }
    
    const { cloudStoragePath } = validation.data;

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
