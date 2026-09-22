"use client";

import { useRef, useState } from "react";

type Message = {
  id: string;
  role: "user" | "io";
  text: string;
  breakdown?: { label: string; value: string }[];
};

const QUICK_QUESTIONS = [
  "Omzet hari ini",
  "Omzet bulan ini",
  "Produk terlaris",
  "Bandingkan bulan lalu",
  "Perjalanan warung",
];

// Panel "Tanya io" — sengaja dibuat sebagai kartu yang menyatu di dashboard
// (bukan widget chat mengambang/fullscreen), supaya terasa jadi bagian
// dari Warung.io, bukan tempelan chatbot generik.
export function IoAskPanel() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  async function ask(question: string) {
    const trimmed = question.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", text: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/io/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed }),
      });
      const data = await res.json();

      const ioMsg: Message = {
        id: crypto.randomUUID(),
        role: "io",
        text: data.answer ?? "Maaf, aku belum bisa jawab itu sekarang.",
        breakdown: data.breakdown,
      };
      setMessages((prev) => [...prev, ioMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "io",
          text: "Koneksinya lagi terputus nih, coba tanya lagi sebentar ya 🙏",
        },
      ]);
    } finally {
      setLoading(false);
      requestAnimationFrame(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
      });
    }
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-lg">
          💬
        </span>
        <div>
          <h2 className="text-sm font-semibold text-gray-800">Tanya io</h2>
          <p className="text-xs text-gray-500">Tanyakan apa saja tentang warungmu</p>
        </div>
      </div>

      {/* Percakapan */}
      {messages.length > 0 && (
        <div ref={listRef} className="mt-4 max-h-80 space-y-3 overflow-y-auto pr-1">
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${
                  m.role === "user"
                    ? "bg-brand-500 text-white"
                    : "bg-gray-50 text-gray-800 ring-1 ring-gray-100"
                }`}
              >
                <p className="whitespace-pre-line">{m.text}</p>
                {m.breakdown && (
                  <div className="mt-2 space-y-1 border-t border-gray-200 pt-2">
                    {m.breakdown.map((b) => (
                      <div key={b.label} className="flex justify-between gap-3 text-xs">
                        <span className="text-gray-500">{b.label}</span>
                        <span className="font-medium text-gray-800">{b.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-1 rounded-2xl bg-gray-50 px-3.5 py-2.5 ring-1 ring-gray-100">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.2s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.1s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pertanyaan cepat */}
      <div className="mt-4 flex flex-wrap gap-1.5">
        {QUICK_QUESTIONS.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => ask(q)}
            disabled={loading}
            className="rounded-full bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600 ring-1 ring-gray-200 transition hover:bg-gray-100 disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input bebas */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
        className="mt-3 flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Tanya sesuatu, mis. omzet hari ini berapa?"
          disabled={loading}
          className="flex-1 rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition active:scale-[0.97] disabled:opacity-50"
        >
          Kirim
        </button>
      </form>
    </div>
  );
}
