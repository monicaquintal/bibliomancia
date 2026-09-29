import Link from "next/link";

// O app é feito para leitores brasileiros: "hoje" e o dia de cada comentário
// seguem o fuso de Brasília, não o UTC do servidor.
const dayFormat = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" });
export const toLocalDay = (iso: string) => dayFormat.format(new Date(iso));

export type CalendarDay = { day: string; count: number; titles: string[] };

const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const CELL = 12;
const GAP = 3;

const utc = (day: string) => new Date(`${day}T00:00:00Z`);
const iso = (d: Date) => d.toISOString().slice(0, 10);
function addDays(day: string, n: number) {
  const d = utc(day);
  d.setUTCDate(d.getUTCDate() + n);
  return iso(d);
}
const br = (day: string) => `${day.slice(8)}/${day.slice(5, 7)}/${day.slice(0, 4)}`;

// 0 = sem leitura; 1–4 = intensidade crescente
function level(count: number) {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  if (count <= 4) return 3;
  return 4;
}
const LEVEL_COLOR = [
  "var(--dust-line)",
  "color-mix(in srgb, var(--cover) 35%, transparent)",
  "color-mix(in srgb, var(--cover) 60%, transparent)",
  "color-mix(in srgb, var(--cover) 82%, transparent)",
  "var(--cover-dark)",
];

export function ReadingCalendar({
  days,
  today,
  year,
  years,
  compact = false,
}: {
  days: CalendarDay[];
  today: string;
  year: number | null;
  years: number[];
  // na página inicial: só os últimos 12 meses, com atalho para a versão completa
  compact?: boolean;
}) {
  const byDay = new Map(days.map((d) => [d.day, d]));

  const start = year ? `${year}-01-01` : addDays(today, -364);
  const rawEnd = year ? `${year}-12-31` : today;
  const end = rawEnd > today ? today : rawEnd;
  const gridStart = addDays(start, -utc(start).getUTCDay());
  const totalDays = Math.round((utc(end).getTime() - utc(gridStart).getTime()) / 86_400_000) + 1;
  const weeks = Math.ceil(totalDays / 7);

  const cells = Array.from({ length: totalDays }, (_, i) => addDays(gridStart, i));
  const readDays = cells.filter((d) => d >= start && byDay.has(d)).length;

  // rótulos de mês: um por mudança de mês; se dois ficarem colados, vale o mais novo
  const labels: { week: number; month: number }[] = [];
  let lastMonth = -1;
  for (let w = 0; w < weeks; w++) {
    const first = addDays(gridStart, w * 7);
    const month = Number((first < start ? start : first).slice(5, 7)) - 1;
    if (month === lastMonth) continue;
    lastMonth = month;
    if (labels.length > 0 && w - labels[labels.length - 1].week < 3) labels.pop();
    labels.push({ week: w, month });
  }

  const columns = `repeat(${weeks}, ${CELL}px)`;

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="font-serif text-lg font-semibold text-ink">Calendário de leitura</h2>
        {compact ? (
          <Link href="/estatisticas" className="text-sm text-ink-soft hover:text-ink">
            Ver por ano →
          </Link>
        ) : (
          <nav className="flex flex-wrap gap-x-3 text-sm">
            {[null, ...years].map((y) => (
              <Link
                key={y ?? "recentes"}
                href={y ? `/estatisticas?ano=${y}` : "/estatisticas"}
                aria-current={y === year ? "true" : undefined}
                className={
                  y === year
                    ? "font-medium text-ink underline underline-offset-4"
                    : "text-ink-soft hover:text-ink"
                }
              >
                {y ?? "Últimos 12 meses"}
              </Link>
            ))}
          </nav>
        )}
      </div>

      <div className="rounded-lg border border-dust-line bg-paper-raised p-4">
        <p className="mb-3 text-sm text-ink-soft">
          {readDays === 0
            ? "Nenhum dia com leitura registrada neste período."
            : `${readDays} ${readDays === 1 ? "dia" : "dias"} com leitura registrada neste período.`}
        </p>

        <div className="overflow-x-auto pb-1">
          <div className="flex w-max gap-2">
            <div
              aria-hidden
              className="grid pt-[18px] text-[10px] leading-none text-ink-soft"
              style={{ gridTemplateRows: `repeat(7, ${CELL}px)`, rowGap: GAP }}
            >
              <span style={{ gridRow: 2 }}>seg</span>
              <span style={{ gridRow: 4 }}>qua</span>
              <span style={{ gridRow: 6 }}>sex</span>
            </div>

            <div>
              <div
                aria-hidden
                className="mb-1 grid h-[14px] text-[10px] leading-none text-ink-soft"
                style={{ gridTemplateColumns: columns, columnGap: GAP }}
              >
                {labels.map(({ week, month }) => (
                  <span key={week} className="whitespace-nowrap" style={{ gridColumn: week + 1 }}>
                    {MONTHS[month]}
                  </span>
                ))}
              </div>

              <div
                role="img"
                aria-label={`Calendário de leitura: ${readDays} dias com leitura registrada`}
                className="grid"
                style={{
                  gridTemplateRows: `repeat(7, ${CELL}px)`,
                  gridAutoFlow: "column",
                  gridAutoColumns: `${CELL}px`,
                  gap: GAP,
                }}
              >
                {cells.map((d) => {
                  if (d < start) return <span key={d} />;
                  const info = byDay.get(d);
                  const title = info
                    ? `${br(d)} — ${info.count} ${info.count === 1 ? "registro" : "registros"}${
                        info.titles.length ? `: ${info.titles.join(", ")}` : ""
                      }`
                    : `${br(d)} — sem leitura`;
                  return (
                    <span
                      key={d}
                      title={title}
                      className="rounded-[3px]"
                      style={{ background: LEVEL_COLOR[level(info?.count ?? 0)] }}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-end gap-1.5 text-[10px] text-ink-soft">
          menos
          {LEVEL_COLOR.map((color, i) => (
            <span
              key={i}
              aria-hidden
              className="rounded-[3px]"
              style={{ width: CELL, height: CELL, background: color }}
            />
          ))}
          mais
        </div>
      </div>
    </section>
  );
}
