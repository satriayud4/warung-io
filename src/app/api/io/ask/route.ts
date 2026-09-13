import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { answerQuestion } from "@/lib/io/engine";

// Endpoint "Tanya io". Sengaja dibuat sebagai Route Handler (server-side)
// supaya:
// 1. Query ke Supabase selalu jalan di server, tidak pernah expose logic
//    perhitungan ke browser.
// 2. Kalau nanti mau dihubungkan ke AI API asli (OpenAI/Anthropic/dst)
//    untuk memahami pertanyaan yang lebih bebas, API key-nya cukup taruh
//    di environment variable server (mis. IO_AI_API_KEY di .env.local /
//    Vercel project settings) dan dipakai di sini — TIDAK PERNAH di
//    frontend. Saat ini belum ada API key yang di-set, jadi io menjawab
//    memakai parser aturan (lihat src/lib/io/intent-parser.ts), bukan AI
//    generatif — supaya tidak pernah mengarang angka.
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Belum login." }, { status: 401 });
  }

  let question = "";
  try {
    const body = await request.json();
    question = typeof body?.question === "string" ? body.question : "";
  } catch {
    return NextResponse.json({ error: "Format permintaan tidak valid." }, { status: 400 });
  }

  if (!question || question.length > 500) {
    return NextResponse.json({ error: "Pertanyaan kosong atau terlalu panjang." }, { status: 400 });
  }

  try {
    const result = await answerQuestion(question);
    return NextResponse.json(result);
  } catch (err) {
    console.error("io/ask error:", err);
    return NextResponse.json(
      { answer: "Waduh, ada gangguan pas aku coba hitung itu. Coba tanya lagi sebentar ya 🙏" },
      { status: 200 }
    );
  }
}
