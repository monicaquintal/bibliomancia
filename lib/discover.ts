export interface Genre {
  value: string;
  label: string;
  query: string;
}

// `query` é texto livre em português (não usa o operador subject:). A
// taxonomia de categorias do Google Books é em inglês e não reflete o idioma
// do livro (ex: subject:Romance ou subject:Fantasy devolvem quase só livros
// em inglês); uma frase natural em português, testada empiricamente contra a
// API, aproxima muito mais o resultado de livros em português — combinado ao
// filtro por `language` em app/api/books/discover/route.ts.
export const GENRES: Genre[] = [
  { value: "romance", label: "Romance", query: "romance para se apaixonar" },
  { value: "ficcao_cientifica", label: "Ficção científica", query: "ficção científica" },
  { value: "fantasia", label: "Fantasia", query: "livro de fantasia" },
  { value: "romantasia", label: "Romantasia", query: "romantasia" },
  { value: "misterio_suspense", label: "Mistério e suspense", query: "livro de suspense" },
  { value: "terror", label: "Terror", query: "livro de terror" },
  { value: "classicos", label: "Clássicos", query: "clássicos da literatura" },
  { value: "biografia", label: "Biografia", query: "livro biografia" },
  { value: "autoajuda", label: "Autoajuda e desenvolvimento pessoal", query: "autoajuda" },
  { value: "historia", label: "História", query: "livro de história" },
  { value: "infantojuvenil", label: "Infantojuvenil", query: "livro infantojuvenil" },
  { value: "quadrinhos", label: "Quadrinhos e HQs", query: "história em quadrinhos" },
  { value: "poesia", label: "Poesia", query: "coletânea de poesia" },
];

export const SERIES_PREFERENCES = ["any", "standalone", "series"] as const;
export type SeriesPreference = (typeof SERIES_PREFERENCES)[number];

type SeriesCheckable = {
  title: string;
  subtitle: string | null;
  description?: string | null;
};

// Melhor esforço: o Google Books não expõe de forma confiável se um volume
// pertence a uma série, então inferimos a partir de padrões comuns no
// título/subtítulo (ex: "Livro 2", "Vol. 3", "#1", "Trilogia ..."). Usa só
// título/subtítulo (não a descrição) porque "série" também aparece em
// descrições sem relação com séries de livros (ex: "uma série de prêmios").
const SERIES_PATTERN =
  /\b(vol(?:ume)?\.?\s*\d+|livro\s*\d+|book\s*\d+|parte\s*\d+|tomo\s*\d+|trilogia|s[ée]rie|saga|duologia)\b|#\s*\d+/i;

// Padrões específicos o bastante (número de volume explícito, ou uma frase
// como "primeiro livro") para checar também na descrição sem risco de dar
// falso positivo — diferente da palavra solta "série" acima.
const SERIES_NUMBER_PATTERN =
  /\b(?:vol(?:ume)?\.?|livro|book|parte|tomo)\s*(\d+)\b|#\s*(\d+)/i;
const FIRST_VOLUME_PATTERN =
  /\bprimeiro\s+(?:livro|volume)\b|\blivro\s+um\b|\bbook\s+one\b|\bfirst\s+book\b|\bin[ií]cio\s+d[ae]\s+(?:s[ée]rie|saga|trilogia|duologia)\b/i;

function titleAndSubtitle(volume: SeriesCheckable): string {
  return `${volume.title} ${volume.subtitle ?? ""}`;
}

function titleSubtitleAndDescription(volume: SeriesCheckable): string {
  return `${titleAndSubtitle(volume)} ${volume.description ?? ""}`;
}

// Extrai o número do volume quando o título, subtítulo ou descrição indicam
// claramente qual (ex: "Livro 4", "Vol. 2", "#8", "primeiro livro da saga").
// Retorna null quando o texto só sinaliza que é uma série sem dizer qual
// volume (ex: "Trilogia ...", "Saga ...") — nesses casos não há como saber
// se é o primeiro livro ou não.
export function getSeriesVolumeNumber(volume: SeriesCheckable): number | null {
  const text = titleSubtitleAndDescription(volume);
  const match = SERIES_NUMBER_PATTERN.exec(text);
  if (match) {
    const num = match[1] ?? match[2];
    if (num) return Number.parseInt(num, 10);
  }
  return FIRST_VOLUME_PATTERN.test(text) ? 1 : null;
}

export function isLikelySeriesEntry(volume: SeriesCheckable): boolean {
  if (SERIES_PATTERN.test(titleAndSubtitle(volume))) return true;
  // A maioria dos livros de romantasia/fantasia só menciona "Livro 1" ou
  // "primeiro livro da saga" na descrição, não no título — sem isso, o
  // filtro "parte de uma série" ficava restrito demais e repetia sempre a
  // mesma única sugestão que citava o número no título.
  return getSeriesVolumeNumber(volume) !== null;
}

// Busca em texto livre por gênero (em vez do operador subject:, cuja
// taxonomia é em inglês e não reflete livros em português) traz junto muito
// material acadêmico sobre o gênero (ensaios, críticas literárias, revistas
// digitalizadas) em vez de livros do gênero em si. Melhor esforço para
// filtrar esse ruído, não uma garantia.
const NON_GENRE_CATEGORY_PATTERN =
  /literary criticism|language arts|language and languages|reference|study aids|foreign language study|comparative literature|literary collections|education|social science|aesthetics in literature|criticism|periodicals|philology|congresses|conference|proceedings|theses/i;

const ACADEMIC_TITLE_PATTERN =
  /\b(crítica|críticas|ensaio|ensaios|estudo|estudos|antologia cr[ií]tica|anais|catálogo|catalogo|didáctica|didática|teoria|teorias|dicionário|dicionario|diccionario|apontamentos|anuário|anuario|bienal|encontro de|jornadas|congresso|congressos|colóquio|coloquio|suplemento literário|revista de|revista da|artigo|artigos|simpósio|simposio|seminário|seminario|conferência|conferencia|palestra|palestras|workshop|mesa[\s-]redonda|resumo expandido|resumos|cadernos de resumos|tese|teses|dissertação|dissertacao|monografia|trabalho de conclusão|tcc|relatório técnico|relatorio tecnico|working paper|paper|periódico|periodico|boletim informativo)\b/i;

// Revistas digitalizadas recorrentes que aparecem em buscas por praticamente
// qualquer assunto, independente do gênero pesquisado.
const KNOWN_MAGAZINE_TITLES = new Set([
  "trip",
  "tpm",
  "veja",
  "bravo",
  "cruzeiro",
  "o cruzeiro",
  "imprensa",
  "argumento",
  "especial",
  "entre livros",
  "livros de portugal",
  "o pasquim",
  "vértice",
  "seara nova",
  "brotéria",
  "placar magazine",
]);

export function isLowQualitySuggestion(volume: {
  title: string;
  subtitle: string | null;
  categories: string[];
}): boolean {
  const normalizedTitle = volume.title.trim().toLowerCase();
  if (KNOWN_MAGAZINE_TITLES.has(normalizedTitle)) return true;
  // O rótulo "ensaios sobre..." / "críticas..." costuma vir no subtítulo, não
  // no título principal (ex: título "Outros erros", subtítulo "ensaios de
  // literatura"), por isso os dois são checados juntos aqui.
  if (ACADEMIC_TITLE_PATTERN.test(`${volume.title} ${volume.subtitle ?? ""}`)) return true;
  if (volume.categories.some((c) => NON_GENRE_CATEGORY_PATTERN.test(c))) return true;
  return false;
}
