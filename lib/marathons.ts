type SessionLike = { status: string; finished_at: string | null };

export type BookProgressInput = { sessions: SessionLike[]; statusKey: string | null };

export type MarathonInput = {
  starts_on: string | null;
  ends_on: string | null;
  target_books: number | null;
};

export type MarathonProgress = {
  done: number;
  total: number | null;
  complete: boolean;
  phase: "aberta" | "futura" | "encerrada";
};

const inPeriod = (m: MarathonInput, day: string) =>
  (!m.starts_on || day >= m.starts_on) && (!m.ends_on || day <= m.ends_on);

// Um livro da lista conta como lido quando:
//  - tem leitura concluída dentro do período (ou sem período definido);
//  - tem leitura concluída sem data de término (não dá para provar que ficou fora do período);
//  - não tem leitura registrada, mas está com status "lido" e a maratona não tem período.
function bookDone(m: MarathonInput, { sessions, statusKey }: BookProgressInput): boolean {
  const hasPeriod = !!m.starts_on || !!m.ends_on;
  const concluded = sessions.filter((s) => s.status === "concluida");
  if (concluded.length > 0) {
    return concluded.some((s) => !hasPeriod || !s.finished_at || inPeriod(m, s.finished_at));
  }
  return statusKey === "lido" && !hasPeriod;
}

// Com lista de livros: conta os da lista que estão lidos (regras em `bookDone`).
// Sem lista: conta as leituras concluídas dentro do período, contra a meta.
export function marathonProgress(
  m: MarathonInput,
  books: BookProgressInput[],
  allConcludedDays: string[],
  today: string,
): MarathonProgress {
  const hasList = books.length > 0;
  const done = hasList
    ? books.filter((b) => bookDone(m, b)).length
    : allConcludedDays.filter((day) => inPeriod(m, day)).length;

  const total = m.target_books ?? (hasList ? books.length : null);
  const phase =
    m.starts_on && today < m.starts_on ? "futura" : m.ends_on && today > m.ends_on ? "encerrada" : "aberta";

  return { done, total, complete: total != null && done >= total, phase };
}

// Texto que explica por que um livro está (ou não) contando na maratona.
export function bookNote(m: MarathonInput, book: BookProgressInput): string {
  const br = (d: string) => `${d.slice(8)}/${d.slice(5, 7)}/${d.slice(0, 4)}`;
  const hasPeriod = !!m.starts_on || !!m.ends_on;
  const concluded = book.sessions.filter((s) => s.status === "concluida");

  if (bookDone(m, book)) {
    const last = concluded.map((s) => s.finished_at).filter(Boolean).sort().pop();
    return last ? `✓ Lido em ${br(last)}` : "✓ Lido";
  }
  if (concluded.length > 0) {
    const last = concluded.map((s) => s.finished_at).filter(Boolean).sort().pop();
    return `Lido em ${br(last!)}, fora do período da maratona`;
  }
  if (book.statusKey === "lido" && hasPeriod) {
    return "Status “Lido”, mas sem leitura registrada para conferir o período";
  }
  if (book.sessions.some((s) => s.status === "em_andamento")) return "Lendo agora";
  return book.statusKey === "lido"
    ? "Ainda não lido"
    : "Ainda não lido (status na estante não é “Lido”)";
}

export function formatPeriod(m: MarathonInput): string | null {
  const br = (d: string) => `${d.slice(8)}/${d.slice(5, 7)}/${d.slice(0, 4)}`;
  if (m.starts_on && m.ends_on) return `${br(m.starts_on)} a ${br(m.ends_on)}`;
  if (m.starts_on) return `a partir de ${br(m.starts_on)}`;
  if (m.ends_on) return `até ${br(m.ends_on)}`;
  return null;
}
