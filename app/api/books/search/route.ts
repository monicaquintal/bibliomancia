import { NextResponse, type NextRequest } from "next/server";
import { searchVolumes } from "@/lib/google-books";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const startIndex = Number.parseInt(searchParams.get("startIndex") ?? "0", 10) || 0;

  if (!q) {
    return NextResponse.json({ items: [], totalItems: 0 });
  }

  try {
    const result = await searchVolumes(q, startIndex);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Não foi possível buscar livros agora. Tente novamente." },
      { status: 502 },
    );
  }
}
