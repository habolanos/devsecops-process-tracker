import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { processIdSchema, validateSchema } from '@/lib/api-schemas';
import { withRateLimit } from '@/lib/rate-limit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Rate limiting
  const rateLimit = withRateLimit(request, 'processes', 'api');
  if (!rateLimit.allowed) return rateLimit.response!;
  
  try {
    const { id } = await params;
    
    // Validate process ID
    const validation = validateSchema(processIdSchema, { id });
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }
    
    // Load index to find the file
    const indexPath = path.join(process.cwd(), 'data', 'processes', 'index.json');
    
    if (!fs.existsSync(indexPath)) {
      return NextResponse.json(
        { error: 'Process index not found' },
        { status: 404 }
      );
    }

    const indexContent = fs.readFileSync(indexPath, 'utf-8');
    const index = JSON.parse(indexContent);
    
    const processTemplate = index.processes.find((p: { id: string }) => p.id === id);
    
    if (!processTemplate) {
      return NextResponse.json(
        { error: 'Process template not found' },
        { status: 404 }
      );
    }

    // Load the YAML file
    const yamlPath = path.join(process.cwd(), 'data', 'processes', processTemplate.file);
    
    if (!fs.existsSync(yamlPath)) {
      return NextResponse.json(
        { error: 'Process YAML file not found' },
        { status: 404 }
      );
    }

    const yamlContent = fs.readFileSync(yamlPath, 'utf-8');

    return NextResponse.json({
      template: processTemplate,
      content: yamlContent
    });
  } catch (error) {
    console.error('Error loading process:', error);
    return NextResponse.json(
      { error: 'Failed to load process' },
      { status: 500 }
    );
  }
}
