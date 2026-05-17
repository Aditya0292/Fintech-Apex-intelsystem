import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST() {
    try {
        console.log("🚀 Manual Scan Triggered (Async)...");
        const rootDir = path.resolve(process.cwd(), '..');
        const scriptPath = path.join(rootDir, 'tools', 'production', 'predict_all.py');
        
        // Spawn the process and detach it so it keeps running
        const child = spawn('python', [
            scriptPath, 
            '--headless', 
            '--no-mt5', 
            '--assets', 'XAUUSD', 'EURUSD', 'GBPUSD', 'USDJPY'
        ], {
            cwd: rootDir,
            detached: true,
            stdio: 'ignore',
            env: { ...process.env, PYTHONPATH: rootDir }
        });

        child.unref(); // Allow the parent process to exit independently

        console.log("✅ Scan Process Dispatched.");
        return NextResponse.json({ 
            success: true, 
            message: "Market scan initiated in background.",
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        console.error("Fatal Scan Dispatch Error:", error);
        return NextResponse.json({ 
            error: "Failed to dispatch market scan", 
            details: error.message 
        }, { status: 500 });
    }
}
