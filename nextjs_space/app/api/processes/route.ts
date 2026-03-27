import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export interface ProcessTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  file: string;
  version: string;
}

export interface ProcessIndex {
  processes: ProcessTemplate[];
}

export async function GET() {
  try {
    const indexPath = path.join(process.cwd(), 'data', 'processes', 'index.json');
    
    if (!fs.existsSync(indexPath)) {
      return NextResponse.json({ processes: [] });
    }

    const indexContent = fs.readFileSync(indexPath, 'utf-8');
    const index: ProcessIndex = JSON.parse(indexContent);

    return NextResponse.json(index);
  } catch (error) {
    console.error('Error loading process index:', error);
    return NextResponse.json(
      { error: 'Failed to load process templates' },
      { status: 500 }
    );
  }
}
