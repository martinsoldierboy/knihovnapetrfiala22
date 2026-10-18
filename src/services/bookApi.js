/**
  Book Database lookup service (Knihovny.cz API, Google Books API & Open Library API)
 */

/**
 * Normalizes ISBN input string (removes hyphens and spaces)
 */
export function normalizeIsbn(input) {
  if (!input) return '';
  return input.replace(/[-\s]/g, '').trim();
}

/**
 * Converts a 10-digit ISBN (or 9 digits + X) to a 13-digit ISBN (978...)
 */
export function isbn10ToIsbn13(isbn10) {
  const clean = normalizeIsbn(isbn10);
  if (!/^\d{9}[\dX]$/i.test(clean)) return clean;

  const prefix = '978' + clean.slice(0, 9);
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(prefix[i], 10);
    sum += i % 2 === 0 ? digit : digit * 3;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return prefix + checkDigit;
}

/**
 * Normalizes input to 13-digit ISBN string if possible
 */
export function normalizeToIsbn13(input) {
  const clean = normalizeIsbn(input);
  if (/^\d{13}$/.test(clean)) {
    return clean;
  }
  if (/^\d{9}[\dX]$/i.test(clean)) {
    return isbn10ToIsbn13(clean);
  }
  return clean;
}

/**
 * Checks if the string looks like a valid ISBN-10 or ISBN-13 or barcode number
 */
export function isIsbnLike(input) {
  const clean = normalizeIsbn(input);
  return /^\d{9}[\dX]$/i.test(clean) || /^\d{13}$/.test(clean);
}

/**
 * Cleans cataloging punctuation from strings (e.g. "Argo,", "Praha :", "[Praha] :")
 */
export function cleanCatalogPunctuation(str) {
  if (!str) return '';
  return str
    .replace(/^[\s\[\]]+/g, '')
    .replace(/[\s,:/;=\[\]]+$/g, '')
    .trim();
}

/**
 * Cleans birth/death years and catalog annotations from author name string
 * (e.g. "Jean de Nostredame, asi 1507-1577" -> "Jean de Nostredame")
 */
export function cleanAuthorName(name) {
  if (!name) return '';
  return name
    .replace(/,?\s*(?:asi|cca|nar\.|b\.|d\.)?\s*\d{3,4}(?:\s*[-–—]\s*\d{0,4})?\s*$/i, '')
    .trim();
}

/**
 * Parses authors object from Knihovny.cz API records
 */
export function parseKnihovnyAuthors(authorsObj) {
  if (!authorsObj) return 'Neznámý autor';

  const primaryKeys = authorsObj.primary ? Object.keys(authorsObj.primary) : [];
  const secondaryKeys = authorsObj.secondary ? Object.keys(authorsObj.secondary) : [];
  const corporateKeys = authorsObj.corporate ? Object.keys(authorsObj.corporate) : [];

  const primaryAuthors = primaryKeys.map(cleanAuthorName).filter(Boolean);
  if (primaryAuthors.length > 0) {
    return primaryAuthors.join(', ');
  }

  const secondaryAuthors = secondaryKeys.map(cleanAuthorName).filter(Boolean);
  if (secondaryAuthors.length > 0) {
    return secondaryAuthors.join(', ');
  }

  const corporateAuthors = corporateKeys.map(cleanAuthorName).filter(Boolean);
  if (corporateAuthors.length > 0) {
    return corporateAuthors.join(', ');
  }

  return 'Neznámý autor';
}

const KNIHOVNY_FIELDS = [
  'id',
  'title',
  'authors',
  'publishers',
  'placesOfPublication',
  'publicationDates',
  'physicalDescriptions',
  'isbns',
  'issns',
  'cnb',
  'formats'
];

/**
 * Search Knihovny.cz API catalog directly from browser
 */
export async function fetchFromKnihovnyCz(query) {
  if (!query || !query.trim()) return null;

  const isIsbn = isIsbnLike(query);
  const targetIsbn13 = isIsbn ? normalizeToIsbn13(query) : null;
  const searchLookfor = targetIsbn13 || query.trim();
  const searchType = isIsbn ? 'ISN' : 'AllFields';

  const params = new URLSearchParams({
    lookfor: searchLookfor,
    type: searchType,
    limit: '10'
  });
  for (const field of KNIHOVNY_FIELDS) {
    params.append('field[]', field);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(`https://www.knihovny.cz/api/v1/search?${params.toString()}`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) return null;

    const data = await response.json();
    const records = data.records ?? [];
    if (!Array.isArray(records) || records.length === 0) return null;

    let selectedRecord = null;

    if (isIsbn) {
      // Find record whose isbns array actually contains targetIsbn13 after normalization
      selectedRecord = records.find(rec => {
        if (!rec.isbns || !Array.isArray(rec.isbns)) return false;
        return rec.isbns.some(rawIsbn => {
          // Extract clean digits/X from rawIsbn e.g. "978-80-257-0367-0" or "80-202-0468-7 (brož.)"
          const clean = normalizeIsbn(rawIsbn.replace(/\(.*?\)/g, ''));
          return normalizeToIsbn13(clean) === targetIsbn13;
        });
      });
    } else {
      // General search: prefer records with format "0/BOOKS/"
      selectedRecord = records.find(rec => rec.formats?.includes('0/BOOKS/')) || records[0];
    }

    if (!selectedRecord) return null;

    const rawTitle = selectedRecord.title || 'Neznámý název';
    const title = cleanCatalogPunctuation(rawTitle);

    const authors = parseKnihovnyAuthors(selectedRecord.authors);

    const rawPublisher = selectedRecord.publishers?.[0] || '';
    const publisher = cleanCatalogPunctuation(rawPublisher);

    const rawPlace = selectedRecord.placesOfPublication?.[0] || '';
    const place = cleanCatalogPunctuation(rawPlace);

    let publishedDate = '';
    if (selectedRecord.publicationDates?.[0]) {
      const yearMatch = selectedRecord.publicationDates[0].match(/\d{4}/);
      if (yearMatch) {
        publishedDate = yearMatch[0];
      }
    }

    let pageCount = 0;
    const physDesc = selectedRecord.physicalDescriptions?.[0] || '';
    if (physDesc) {
      const pageMatch = physDesc.match(/(\d+)\s*(?:s\.|stran|str|p\.)/i);
      if (pageMatch) {
        pageCount = parseInt(pageMatch[1], 10);
      }
    }

    // Determine representative ISBN
    let displayIsbn = targetIsbn13 || query;
    if (selectedRecord.isbns?.[0]) {
      const isbnMatch = selectedRecord.isbns[0].match(/[\d-X]+/i);
      if (isbnMatch) displayIsbn = isbnMatch[0];
    }

    return {
      id: selectedRecord.id || `knihovny-${Date.now()}`,
      title,
      authors,
      isbn: displayIsbn,
      publishedDate,
      publisher: place ? `${publisher} (${place})`.replace(/^\s*\((.*?)\)$/, '$1') : publisher,
      description: physDesc ? `Fyzický popis: ${physDesc}` : 'Popis není k dispozici.',
      coverImage: null,
      pageCount,
      categories: selectedRecord.formats?.join(', ') || '',
      language: '',
      cnb: selectedRecord.cnb || '',
      source: 'Knihovny.cz'
    };
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('Chyba při načítání z Knihovny.cz API:', error);
    return null;
  }
}

/**
 * Search Google Books API
 */
export async function fetchFromGoogleBooks(query) {
  const clean = normalizeIsbn(query);
  const searchParam = isIsbnLike(clean) ? `isbn:${clean}` : encodeURIComponent(query);
  const url = `https://www.googleapis.com/books/v1/volumes?q=${searchParam}`;

  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();

    if (!data.items || data.items.length === 0) return null;

    const book = data.items[0].volumeInfo;
    const industryIdentifiers = book.industryIdentifiers || [];

    let isbn = clean;
    const isbn13Obj = industryIdentifiers.find(id => id.type === 'ISBN_13');
    const isbn10Obj = industryIdentifiers.find(id => id.type === 'ISBN_10');
    if (isbn13Obj) isbn = isbn13Obj.identifier;
    else if (isbn10Obj) isbn = isbn10Obj.identifier;

    // Cover image high res if available
    const coverImage = book.imageLinks?.thumbnail
      ? book.imageLinks.thumbnail.replace('http://', 'https://')
      : null;

    return {
      id: data.items[0].id || `gb-${Date.now()}`,
      title: book.title || 'Neznámý název',
      authors: book.authors ? book.authors.join(', ') : 'Neznámý autor',
      isbn: isbn || query,
      publishedDate: book.publishedDate || '',
      publisher: book.publisher || '',
      description: book.description || 'Popis není k dispozici.',
      coverImage: coverImage,
      pageCount: book.pageCount || 0,
      categories: book.categories ? book.categories.join(', ') : '',
      language: book.language || '',
      source: 'Google Books'
    };
  } catch (error) {
    console.error('Chyba při načítání z Google Books API:', error);
    return null;
  }
}

/**
 * Search Open Library API
 */
export async function fetchFromOpenLibrary(query) {
  const clean = normalizeIsbn(query);

  try {
    if (isIsbnLike(clean)) {
      const url = `https://openlibrary.org/api/books?bibkeys=ISBN:${clean}&format=json&jscmd=data`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        const key = `ISBN:${clean}`;
        if (data[key]) {
          const item = data[key];
          return {
            id: `ol-${clean}`,
            title: item.title || 'Neznámý název',
            authors: item.authors ? item.authors.map(a => a.name).join(', ') : 'Neznámý autor',
            isbn: clean,
            publishedDate: item.publish_date || '',
            publisher: item.publishers ? item.publishers.map(p => p.name).join(', ') : '',
            description: typeof item.notes === 'string' ? item.notes : 'Popis není k dispozici.',
            coverImage: item.cover?.medium || item.cover?.large || null,
            pageCount: item.number_of_pages || 0,
            categories: item.subjects ? item.subjects.map(s => s.name).slice(0, 3).join(', ') : '',
            language: '',
            source: 'Open Library'
          };
        }
      }
    }

    // Fallback general search query
    const searchUrl = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=1`;
    const searchResp = await fetch(searchUrl);
    if (!searchResp.ok) return null;
    const searchData = await searchResp.json();

    if (!searchData.docs || searchData.docs.length === 0) return null;

    const doc = searchData.docs[0];
    const foundIsbn = doc.isbn ? doc.isbn[0] : clean;
    const coverImage = doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : null;

    return {
      id: doc.key || `ol-${Date.now()}`,
      title: doc.title || 'Neznámý název',
      authors: doc.author_name ? doc.author_name.join(', ') : 'Neznámý autor',
      isbn: foundIsbn,
      publishedDate: doc.first_publish_year ? String(doc.first_publish_year) : '',
      publisher: doc.publisher ? doc.publisher[0] : '',
      description: 'Popis není k dispozici v vyhledávání Open Library.',
      coverImage: coverImage,
      pageCount: doc.number_of_pages_median || 0,
      categories: doc.subject ? doc.subject.slice(0, 3).join(', ') : '',
      language: doc.language ? doc.language[0] : '',
      source: 'Open Library'
    };
  } catch (error) {
    console.error('Chyba při načítání z Open Library API:', error);
    return null;
  }
}

/**
 * Fetch book details by ISBN or query trying Knihovny.cz first, then Google Books, then Open Library
 */
export async function searchBook(query) {
  if (!query || !query.trim()) return null;

  // Try Knihovny.cz API first
  const knihovnyResult = await fetchFromKnihovnyCz(query);
  if (knihovnyResult) return knihovnyResult;

  // Fallback to Google Books API
  const googleResult = await fetchFromGoogleBooks(query);
  if (googleResult) return googleResult;

  // Fallback to Open Library
  const openLibraryResult = await fetchFromOpenLibrary(query);
  if (openLibraryResult) return openLibraryResult;

  return null;
}
