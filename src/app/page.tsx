"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const STORAGE_KEY = "meal-planner-web:v1";

const DAY_KEYS = [
  "lunedi",
  "martedi",
  "mercoledi",
  "giovedi",
  "venerdi",
  "sabato",
  "domenica",
] as const;

type DayKey = (typeof DAY_KEYS)[number];

type WeekMenu = {
  id: string;
  name: string;
  days: Record<DayKey, string>;
};

type StoredData = {
  anchorDate: string | null;
  weeks: WeekMenu[];
};

const IT_DAY_LABELS: Record<DayKey, string> = {
  lunedi: "Lunedi",
  martedi: "Martedi",
  mercoledi: "Mercoledi",
  giovedi: "Giovedi",
  venerdi: "Venerdi",
  sabato: "Sabato",
  domenica: "Domenica",
};

const IT_DAY_LABELS_SHORT: Record<DayKey, string> = {
  lunedi: "Lun",
  martedi: "Mar",
  mercoledi: "Mer",
  giovedi: "Gio",
  venerdi: "Ven",
  sabato: "Sab",
  domenica: "Dom",
};

const emptyDays = (): Record<DayKey, string> => ({
  lunedi: "",
  martedi: "",
  mercoledi: "",
  giovedi: "",
  venerdi: "",
  sabato: "",
  domenica: "",
});

const startOfWeekMonday = (date: Date) => {
  const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const weeksBetween = (start: Date, end: Date) => {
  const msWeek = 7 * 24 * 60 * 60 * 1000;
  return Math.floor((end.getTime() - start.getTime()) / msWeek);
};

const getTodayKey = (): DayKey => {
  const day = new Date().getDay();
  switch (day) {
    case 0:
      return "domenica";
    case 1:
      return "lunedi";
    case 2:
      return "martedi";
    case 3:
      return "mercoledi";
    case 4:
      return "giovedi";
    case 5:
      return "venerdi";
    default:
      return "sabato";
  }
};

export default function Home() {
  const [weeks, setWeeks] = useState<WeekMenu[]>([]);
  const [anchorDate, setAnchorDate] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as StoredData;
        setWeeks(parsed.weeks || []);
        setAnchorDate(parsed.anchorDate || null);
      } catch (error) {
        console.warn("Errore parsing localStorage", error);
      }
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const payload: StoredData = { weeks, anchorDate };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [anchorDate, hydrated, weeks]);

  const todayKey = useMemo(getTodayKey, []);

  const activeWeek = useMemo(() => {
    if (!anchorDate || weeks.length === 0) return null;
    const anchor = new Date(anchorDate);
    const today = startOfWeekMonday(new Date());
    const diff = Math.max(0, weeksBetween(anchor, today));
    const index = diff % weeks.length;
    return weeks[index] ?? null;
  }, [anchorDate, weeks]);

  const todayMenu = activeWeek?.days[todayKey] ?? "";

  const addWeek = () => {
    const nextIndex = weeks.length + 1;
    const newWeek: WeekMenu = {
      id: `week-${Date.now()}`,
      name: `Settimana ${nextIndex}`,
      days: emptyDays(),
    };
    const nextAnchor = anchorDate ?? startOfWeekMonday(new Date()).toISOString();
    setWeeks((prev) => [...prev, newWeek]);
    setAnchorDate(nextAnchor);
  };

  const updateWeekName = (id: string, name: string) => {
    setWeeks((prev) =>
      prev.map((week) => (week.id === id ? { ...week, name } : week))
    );
  };

  const updateDay = (id: string, day: DayKey, value: string) => {
    setWeeks((prev) =>
      prev.map((week) =>
        week.id === id ? { ...week, days: { ...week.days, [day]: value } } : week
      )
    );
  };

  const removeWeek = (id: string) => {
    setWeeks((prev) => prev.filter((week) => week.id !== id));
  };

  const exportJson = () => {
    const payload: StoredData = { weeks, anchorDate };
    const json = JSON.stringify(payload, null, 2);
    const defaultName = `meal-planner-${new Date().toISOString().slice(0, 10)}`;
    const rawName = window.prompt("Nome del file da esportare:", defaultName);
    if (!rawName) return;
    const safeName = rawName
      .trim()
      .replace(/[\\/:*?"<>|]+/g, "-")
      .replace(/\s+/g, "-")
      .slice(0, 80);
    if (!safeName) return;
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = safeName.endsWith(".json") ? safeName : `${safeName}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as StoredData;
        if (!parsed || !Array.isArray(parsed.weeks)) {
          alert("File non valido: JSON incompatibile.");
          return;
        }

        setWeeks(parsed.weeks);
        setAnchorDate(parsed.anchorDate ?? null);
      } catch (error) {
        console.warn("Errore import JSON", error);
        alert("Impossibile importare il file.");
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#f7e7d5_0%,#f8f4f0_45%,#f2ebe4_100%)] text-[#1f1a17]">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute left-[-120px] top-[-140px] h-[320px] w-[320px] rounded-full bg-[#f3d3b8] blur-3xl opacity-70" />
        <div className="pointer-events-none absolute right-[-160px] top-[120px] h-[360px] w-[360px] rounded-full bg-[#f9efe6] blur-3xl opacity-80" />
      </div>

      <main className="relative mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 pb-24 pt-12 lg:px-10">
        <header className="flex flex-col gap-4">
          <p className="text-xs uppercase tracking-[0.4em] text-[#8c4c2a]">
            Planner settimanale
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-4xl leading-tight text-[#2b1b13] md:text-5xl">
            Meal Planner con rotazione automatica
          </h1>
          <p className="max-w-2xl text-base text-[#5a4b43] md:text-lg">
            Inserisci piu settimane di menu e lascia che l&apos;app ruoti
            automaticamente in base al lunedi corrente.
          </p>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="rounded-3xl border border-white/60 bg-white/70 p-6 shadow-[0_25px_60px_-40px_rgba(41,18,9,0.8)] backdrop-blur">
            <p className="text-xs uppercase tracking-[0.3em] text-[#b27652]">
              Oggi
            </p>
            <div className="mt-4 flex flex-col gap-3">
              <h2 className="text-2xl font-semibold text-[#2b1b13]">
                {IT_DAY_LABELS[todayKey]}
              </h2>
              <p className="text-sm text-[#8b7569]">
                Settimana attiva: {activeWeek?.name ?? "Nessuna configurata"}
              </p>
              <div className="rounded-2xl border border-[#f1e2d7] bg-[#fff6ef] p-4 text-[#3a2b24]">
                {todayMenu || "Aggiungi un menu per oggi."}
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={addWeek}
                  className="rounded-full bg-[#1f1a17] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#3a2b24]"
                >
                  Aggiungi settimana
                </button>
                <button
                  onClick={handleImportClick}
                  className="rounded-full border border-[#d9a37b] px-5 py-2 text-sm font-semibold text-[#8c4c2a] transition hover:bg-[#f7e7d5]"
                >
                  Importa JSON
                </button>
                <button
                  onClick={exportJson}
                  className="rounded-full border border-[#d9a37b] px-5 py-2 text-sm font-semibold text-[#8c4c2a] transition hover:bg-[#f7e7d5]"
                >
                  Esporta JSON
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json"
                  className="hidden"
                  onChange={handleImportFile}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-5 rounded-3xl bg-[#2b1b13] p-6 text-white">
            <h3 className="font-[family-name:var(--font-display)] text-2xl">
              Rotazione settimanale
            </h3>
            <p className="text-sm text-[#f2d9c8]">
              La rotazione parte dalla settimana in cui inserisci la prima
              settimana. Ogni nuovo lunedi passa alla settimana successiva e
              ricomincia quando finisci l&apos;elenco.
            </p>
            <div className="mt-auto rounded-2xl bg-white/10 p-4 text-xs uppercase tracking-[0.25em] text-[#f2d9c8]">
              Dati salvati in locale
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-semibold text-[#2b1b13]">Settimane</h2>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={addWeek}
                className="rounded-full bg-[#d9a37b] px-4 py-2 text-sm font-semibold text-[#2b1b13] transition hover:bg-[#c89167]"
              >
                + Nuova
              </button>
              <button
                onClick={handleImportClick}
                className="rounded-full border border-[#d9a37b] px-4 py-2 text-sm font-semibold text-[#8c4c2a] transition hover:bg-[#f7e7d5]"
              >
                Importa JSON
              </button>
              <button
                onClick={exportJson}
                className="rounded-full border border-[#d9a37b] px-4 py-2 text-sm font-semibold text-[#8c4c2a] transition hover:bg-[#f7e7d5]"
              >
                Esporta JSON
              </button>
            </div>
          </div>

          {weeks.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[#d9c5b7] bg-white/70 p-6 text-sm text-[#7b6a60]">
              Nessuna settimana: premi “+ Nuova” per iniziare.
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              {weeks.map((week) => (
                <div
                  key={week.id}
                  className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-[0_20px_50px_-35px_rgba(41,18,9,0.7)]"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <input
                      value={week.name}
                      onChange={(event) =>
                        updateWeekName(week.id, event.target.value)
                      }
                      className="w-full rounded-2xl border border-transparent bg-[#f7f1ec] px-4 py-2 text-base font-semibold text-[#2b1b13] outline-none transition focus:border-[#d9a37b]"
                      placeholder="Nome settimana"
                    />
                    <button
                      onClick={() => removeWeek(week.id)}
                      className="rounded-full border border-[#e2c7b3] px-3 py-1 text-xs font-semibold text-[#8c4c2a] transition hover:bg-[#f7e7d5]"
                    >
                      Rimuovi
                    </button>
                  </div>

                  <div className="mt-4 grid gap-3">
                    {DAY_KEYS.map((day) => (
                      <label
                        key={day}
                        className="flex flex-col gap-2 rounded-2xl border border-[#f1e2d7] bg-[#fff8f3] p-3"
                      >
                        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#b27652]">
                          {IT_DAY_LABELS_SHORT[day]}
                        </span>
                        <textarea
                          value={week.days[day]}
                          onChange={(event) =>
                            updateDay(week.id, day, event.target.value)
                          }
                          className="min-h-[64px] w-full resize-none bg-transparent text-sm text-[#3a2b24] outline-none"
                          placeholder={`Menu ${IT_DAY_LABELS[day]}`}
                        />
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
