import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

export async function POST() {
    const CACHE_FILE = path.resolve(process.cwd(), '..', 'data', 'prediction_cache.json');
    const SCRIPT_PATH = path.resolve(process.cwd(), '..', 'tools', 'production', 'predict_all.py');

    try {
        // Execute the python script
        const { stdout, stderr } = await execPromise(`python tools/production/refresh_csm.py`, {
            cwd: path.resolve(process.cwd(), '..')
        });

        if (stderr && !stdout) {
            console.error("CSM Refresh Error:", stderr);
            return NextResponse.json({ error: "Failed to refresh CSM" }, { status: 500 });
        }

        const result = JSON.parse(stdout);
        if (result.error) {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }
        return NextResponse.json(result);

    } catch (error) {
        console.error("CSM Refresh API Exception:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
