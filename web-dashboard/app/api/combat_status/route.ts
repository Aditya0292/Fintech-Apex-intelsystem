
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Path to the combat_status.json in the project root/outputs
    // Relative to web-dashboard/
    const statusPath = path.resolve(process.cwd(), '../outputs/combat_status.json');
    
    if (!fs.existsSync(statusPath)) {
      return NextResponse.json({ combat_mode: false, is_monitoring: false });
    }

    const data = fs.readFileSync(statusPath, 'utf8');
    return NextResponse.json(JSON.parse(data));
  } catch (error) {
    return NextResponse.json({ error: "Failed to read combat status" }, { status: 500 });
  }
}
