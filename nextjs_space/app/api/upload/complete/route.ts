import { NextRequest, NextResponse } from 'next/server';
import { getFileUrl } from '@/lib/s3';
import { completeUploadSchema, validateSchema } from '@/lib/api-schemas';
import { withRateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  // Rate limiting
  const rateLimit = withRateLimit(request, 'upload/complete', 'upload');
  if (!rateLimit.allowed) return rateLimit.response!;
  
  try {
    const body = await request.json();
    
    // Validate input with Zod
    const validation = validateSchema(completeUploadSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }
    
    const { cloudStoragePath, isPublic } = validation.data;

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
