import { NextRequest, NextResponse } from 'next/server';
import { generatePresignedUploadUrl } from '@/lib/s3';
import { getBucketConfig } from '@/lib/aws-config';
import { presignedUploadSchema, validateSchema } from '@/lib/api-schemas';
import { withRateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  // Rate limiting
  const rateLimit = withRateLimit(request, 'upload/presigned', 'upload');
  if (!rateLimit.allowed) return rateLimit.response!;
  
  try {
    const body = await request.json();
    
    // Validate input with Zod
    const validation = validateSchema(presignedUploadSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }
    
    const { fileName, contentType, isPublic } = validation.data;

    // Check if S3 is configured
    const { bucketName } = getBucketConfig();
    const isLocalMode = !bucketName;

    if (isLocalMode) {
      // Local mode: return flag to indicate base64 upload
      return NextResponse.json({
        localMode: true,
        fileName,
        contentType
      });
    }

    const { uploadUrl, cloudStoragePath } = await generatePresignedUploadUrl(
      fileName,
      contentType,
      isPublic ?? false
    );

    return NextResponse.json({ uploadUrl, cloudStoragePath });
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    );
  }
}
