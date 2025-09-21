import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";

export async function GET() {
  const ctx = await getAuthContext();
  return NextResponse.json({
    user: ctx ? { id: ctx.userId, email: ctx.email } : null,
  });
}
