import { NextRequest, NextResponse } from "next/server";

// MT5 trade execution bridge.
// In production this calls the Python MT5 bridge via a local socket or exec.
// In demo/dev mode it returns a mock success response so the UI works without MT5.
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const { symbol, direction, lots, sl, tp } = body as {
      symbol: string;
      direction: "BUY" | "SELL";
      lots: number;
      sl?: number;
      tp?: number;
    };

    // Production: exec Python bridge via a worker/serverless function.
    // For now we return a mock success so the UI works in demo mode.
    // Replace this block with actual process spawn when MT5 is available.
    const isDemoMode = true; // Set to false when MT5 terminal is connected

    if (isDemoMode) {
      return NextResponse.json({
        success: true,
        demo: true,
        message: `[DEMO] ${direction} ${lots} lots ${symbol} @ market | SL: ${sl ?? 0} | TP: ${tp ?? 0}`,
        order: { symbol, direction, lots, sl, tp },
        ticketId: Math.floor(Math.random() * 9000000) + 1000000,
      });
    }

    // Stub for live execution path (connect real MT5 bridge here)
    return NextResponse.json({ success: false, message: "MT5 bridge not configured." }, { status: 503 });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
