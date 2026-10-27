/**
 * MDT (Mezinárodní Desetinné Třídění / Universal Decimal Classification) Mapping & Genre Colors
 *
 * Classes:
 * 0 - Všeobecnosti, informatika, knihovnictví
 * 1 - Filozofie, psychologie, etika
 * 2 - Náboženství, teologie
 * 3 - Společenské vědy, právo, ekonomie, vzdělávání
 * 4 - Neobsazena / Speciální
 * 5 - Přírodní vědy, matematika
 * 6 - Lékařství, technika, zemědělství, užité vědy
 * 7 - Umění, hudba, architektura, sport, zábava
 * 8 - Jazykověda, literatura, krásná literatura (beletrie)
 * 9 - Geografie, historie, životopisy, archeologie
 */

export const MDT_CLASSES = {
  '0': {
    code: '0',
    name: 'Všeobecnosti & Informatika',
    shortName: 'Informatika & Všeobecné',
    bgColor: 'bg-slate-100',
    textColor: 'text-slate-800',
    borderColor: 'border-slate-300',
    badgeBg: 'bg-slate-100 text-slate-800 border-slate-300',
    cardBorder: 'hover:border-slate-400',
    hex: '#64748b'
  },
  '1': {
    code: '1',
    name: 'Filozofie & Psychologie',
    shortName: 'Filozofie & Psychologie',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-800',
    borderColor: 'border-purple-300',
    badgeBg: 'bg-purple-100 text-purple-800 border-purple-300',
    cardBorder: 'hover:border-purple-400',
    hex: '#a855f7'
  },
  '2': {
    code: '2',
    name: 'Náboženství & Teologie',
    shortName: 'Náboženství',
    bgColor: 'bg-amber-100',
    textColor: 'text-amber-800',
    borderColor: 'border-amber-300',
    badgeBg: 'bg-amber-100 text-amber-800 border-amber-300',
    cardBorder: 'hover:border-amber-400',
    hex: '#f59e0b'
  },
  '3': {
    code: '3',
    name: 'Společenské vědy & Právo',
    shortName: 'Společenské vědy',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    borderColor: 'border-blue-300',
    badgeBg: 'bg-blue-100 text-blue-800 border-blue-300',
    cardBorder: 'hover:border-blue-400',
    hex: '#3b82f6'
  },
  '4': {
    code: '4',
    name: 'Všeobecné / Nespecifikováno',
    shortName: 'Všeobecné',
    bgColor: 'bg-teal-100',
    textColor: 'text-teal-800',
    borderColor: 'border-teal-300',
    badgeBg: 'bg-teal-100 text-teal-800 border-teal-300',
    cardBorder: 'hover:border-teal-400',
    hex: '#14b8a6'
  },
  '5': {
    code: '5',
    name: 'Přírodní vědy & Matematika',
    shortName: 'Přírodní vědy',
    bgColor: 'bg-emerald-100',
    textColor: 'text-emerald-800',
    borderColor: 'border-emerald-300',
    badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    cardBorder: 'hover:border-emerald-400',
    hex: '#10b981'
  },
  '6': {
    code: '6',
    name: 'Lékařství, Technika & Zemědělství',
    shortName: 'Technika & Lékařství',
    bgColor: 'bg-cyan-100',
    textColor: 'text-cyan-800',
    borderColor: 'border-cyan-300',
    badgeBg: 'bg-cyan-100 text-cyan-800 border-cyan-300',
    cardBorder: 'hover:border-cyan-400',
    hex: '#06b6d4'
  },
  '7': {
    code: '7',
    name: 'Umění, Zábava & Sport',
    shortName: 'Umění & Sport',
    bgColor: 'bg-rose-100',
    textColor: 'text-rose-800',
    borderColor: 'border-rose-300',
    badgeBg: 'bg-rose-100 text-rose-800 border-rose-300',
    cardBorder: 'hover:border-rose-400',
    hex: '#f43f5e'
  },
  '8': {
    code: '8',
    name: 'Literatura & Beletrie',
    shortName: 'Literatura / Beletrie',
    bgColor: 'bg-indigo-100',
    textColor: 'text-indigo-800',
    borderColor: 'border-indigo-300',
    badgeBg: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    cardBorder: 'hover:border-indigo-400',
    hex: '#6366f1'
  },
  '9': {
    code: '9',
    name: 'Geografie & Historie',
    shortName: 'Historie & Geografie',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-800',
    borderColor: 'border-orange-300',
    badgeBg: 'bg-orange-100 text-orange-800 border-orange-300',
    cardBorder: 'hover:border-orange-400',
    hex: '#f97316'
  }
};

/**
 * Gets color configuration for given MDT code
 */
export function getMdtColorConfig(code) {
  const classKey = String(code).trim()[0];
  return MDT_CLASSES[classKey] || MDT_CLASSES['8']; // Default to Literature / Beletrie if unknown
}

/**
 * Determines MDT Category code ('0' - '9') for a book record based on categories, title, description, or MDT codes
 */
export function getMdtCategory(book) {
  if (!book) return MDT_CLASSES['8'];

  // Check explicit mdt property
  if (book.mdt) {
    const code = String(book.mdt).trim()[0];
    if (MDT_CLASSES[code]) return MDT_CLASSES[code];
  }

  const textToScan = [
    book.categories || '',
    book.title || '',
    book.description || ''
  ].join(' ').toLowerCase();

  // Keyword mapping rules for MDT
  if (/(filozof|psycholog|etika|morálka|mysl|duše|vědomí)/i.test(textToScan)) {
    return MDT_CLASSES['1'];
  }
  if (/(náboženství|teologie|bůh|církev|víra|mýty|bible|křesťanství|buddhismus|islám)/i.test(textToScan)) {
    return MDT_CLASSES['2'];
  }
  if (/(společnost|sociolog|ekonom|politik|právo|pedagog|vzděláv|statistika|finance|byznys|marketing|zákon)/i.test(textToScan)) {
    return MDT_CLASSES['3'];
  }
  if (/(fyzika|chemie|biologie|matematik|přírod|ekologie|astronomie|geologie|botanika|zoolo)/i.test(textToScan)) {
    return MDT_CLASSES['5'];
  }
  if (/(lékař|medicín|zdraví|technik|inženýr|zeměděl|průmysl|stroj|počítač|informatik|recept|kuchař|automobil)/i.test(textToScan)) {
    return MDT_CLASSES['6'];
  }
  if (/(umění|malíř|hudba|film|divadlo|fotografie|architekt|sport|zábava|hry|design)/i.test(textToScan)) {
    return MDT_CLASSES['7'];
  }
  if (/(historie|dějiny|geografie|zeměpis|cestopis|biografie|životopis|archeolog|váleč|kronika)/i.test(textToScan)) {
    return MDT_CLASSES['9'];
  }
  if (/(encyklopedie|slovník|knihovn|časopis|médium|databáz)/i.test(textToScan)) {
    return MDT_CLASSES['0'];
  }

  // Fiction / Novels / Poems / Plays / Literature default
  return MDT_CLASSES['8'];
}
