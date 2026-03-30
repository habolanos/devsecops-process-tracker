import { NextRequest, NextResponse } from 'next/server';
import { generatePresignedUploadUrl } from '@/lib/s3';
import { getBucketConfig } from '@/lib/aws-config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileName, contentType, isPublic } = body;

    if (!fileName || !contentType) {
      return NextResponse.json(
        { error: 'fileName and contentType are required' },
        { status: 400 }
      );
    }

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
