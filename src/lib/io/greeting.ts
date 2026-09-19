// Logika sapaan personal "io" di Dashboard. Sengaja dipisah jadi 2 bagian
// seperti pola lain di src/lib/io/: fungsi murni (buildInsight) yang bisa
// diuji dengan angka contoh, dan pengambilan data (computeGreeting) yang
// baru menyentuh Supabase.

import { formatRupiah } from "@/lib/format";

export type GreetingNumbers = {
  todayOmzet: number;
  todayCount: number;
  yesterdayOmzet: number;
  thisWeekOmzet: number;
  lastWeekOmzet: number;
};

export type GreetingInsight = { text: string; hasData: boolean };

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pct(current: number, previous: number): number {
  return Math.round(((current - previous) / previous) * 100);
}

/**
 * Susun satu kalimat insight dari angka yang SUDAH pasti benar. Tidak ada
 * perhitungan tambahan di sini — kalau datanya tidak cukup untuk bikin
 * insight yang bermakna, kembalikan sapaan umum (hasData: false), bukan
 * memaksakan angka yang tidak ada.
 */
export function buildInsight(n: GreetingNumbers): GreetingInsight {
  // 1. Ada data hari ini DAN kemarin -> bandingkan, paling relevan/segar.
  if (n.todayOmzet > 0 && n.yesterdayOmzet > 0) {
    const p = pct(n.todayOmzet, n.yesterdayOmzet);
    if (p > 0) {
      return {
        hasData: true,
        text: pick([
          `Hari ini omzetmu sudah ${formatRupiah(n.todayOmzet)}, naik ${p}% dibanding kemarin 🚀`,
          `Mantap, omzet hari ini ${formatRupiah(n.todayOmzet)} — naik ${p}% dari kemarin.`,
        ]),
      };
    }
    if (p < 0) {
      return {
        hasData: true,
        text: pick([
          `Hari ini omzetmu ${formatRupiah(n.todayOmzet)}, turun ${Math.abs(p)}% dari kemarin. Santai, besok bisa lebih baik lagi 💪`,
          `Omzet hari ini ${formatRupiah(n.todayOmzet)}, sedikit lebih rendah dari kemarin (turun ${Math.abs(p)}%).`,
        ]),
      };
    }
    return {
      hasData: true,
      text: `Hari ini omzetmu ${formatRupiah(n.todayOmzet)}, persis sama dengan kemarin.`,
    };
  }

  // 2. Ada data hari ini saja (kemarin belum ada transaksi, jadi tidak
  //    bisa dihitung persentasenya).
  if (n.todayOmzet > 0) {
    return {
      hasData: true,
      text: pick([
        `Hari ini omzetmu sudah ${formatRupiah(n.todayOmzet)} dari ${n.todayCount} transaksi.`,
        `Sejauh ini hari ini kamu sudah mencatat ${formatRupiah(n.todayOmzet)} omzet 👏`,
      ]),
    };
  }

  // 3. Belum ada transaksi hari ini, tapi minggu ini & minggu lalu ada
  //    datanya -> insight mingguan (masuk akal dilihat pagi-pagi sebelum
  //    ada transaksi baru).
  if (n.thisWeekOmzet > 0 && n.lastWeekOmzet > 0) {
    const p = pct(n.thisWeekOmzet, n.lastWeekOmzet);
    if (p > 0) {
      return {
        hasData: true,
        text: pick([
          `Omzetmu minggu ini naik ${p}% dibanding minggu lalu. Pelan-pelan, tapi kelihatan perkembangannya 🚀`,
          `Minggu ini omzetmu ${formatRupiah(n.thisWeekOmzet)}, naik ${p}% dari minggu lalu.`,
        ]),
      };
    }
    if (p < 0) {
      return {
        hasData: true,
        text: `Minggu ini omzetmu ${formatRupiah(n.thisWeekOmzet)}, turun ${Math.abs(p)}% dari minggu lalu.`,
      };
    }
    return { hasData: true, text: `Omzet minggu ini sama persis dengan minggu lalu, ${formatRupiah(n.thisWeekOmzet)}.` };
  }

  // 4. Minggu ini ada data tapi belum ada pembanding minggu lalu.
  if (n.thisWeekOmzet > 0) {
    return {
      hasData: true,
      text: `Minggu ini omzetmu sudah ${formatRupiah(n.thisWeekOmzet)}. Terus jalan! 🚀`,
    };
  }

  // 5. Belum ada apa-apa minggu ini, tapi kemarin ada transaksi.
  if (n.yesterdayOmzet > 0) {
    return {
      hasData: true,
      text: `Kemarin omzetmu ${formatRupiah(n.yesterdayOmzet)}. Belum ada transaksi tercatat hari ini — yuk mulai catat jualanmu di Kasir 👋`,
    };
  }

  // 6. Sama sekali belum ada data (akun baru / belum pernah transaksi).
  return {
    hasData: false,
    text: "Yuk mulai catat transaksi pertamamu di Kasir, biar io bisa mulai bantu lihat perkembangan warungmu di sini 🌱",
  };
}

export function getTimeGreeting(hourInAppTimezone: number): string {
  if (hourInAppTimezone >= 4 && hourInAppTimezone < 11) return "pagi";
  if (hourInAppTimezone >= 11 && hourInAppTimezone < 15) return "siang";
  if (hourInAppTimezone >= 15 && hourInAppTimezone < 19) return "sore";
  return "malam";
}
