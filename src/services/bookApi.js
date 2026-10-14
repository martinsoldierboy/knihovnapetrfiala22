/**
  Book Database lookup service (Google Books API & Open Library API)
  Includes MDT (Mezinárodní desetinné třídění / UDC) classification logic.
 */

/**
 * Maps book categories/subjects, title, and description to MDT (UDC) classification
 */
export function deriveMdtClassification(categoriesStr = '', title = '', description = '') {
  const text = `${categoriesStr} ${title} ${description}`.toLowerCase();

  if (/pohádk|dětsk|pro děti|mládež|youth|children|juvenile|fairy/.test(text)) {
    return '82-93 (Literatura pro děti a mládež)';
  }
  if (/poezie|básn|poetry|poems/.test(text)) {
    return '82-1 (Poezie)';
  }
  if (/dram|divadl|play|theater|theatre/.test(text)) {
    return '82-2 (Dramatická literatura)';
  }
  if (/beletrie|fiction|novel|román|povídk|příběh|proza|prose|literatura|literature|detektiv|thriller|scifi|sci-fi|fantasy/.test(text)) {
    return '82-3 (Krásná literatura - Próza)';
  }
  if (/histori|dějin|historick|history|war|válka/.test(text)) {
    return '94 (Dějiny / Historie)';
  }
  if (/geograf|zeměpis|cestopis|geography|travel/.test(text)) {
    return '91 (Geografie / Cestopisy)';
  }
  if (/biograf|životopis|paměti|memoir|biography/.test(text)) {
    return '929 (Biografie)';
  }
  if (/filosof|filozof|psycholog|philosophy|psychology/.test(text)) {
    return '1 (Filosofie. Psychologie)';
  }
  if (/náboženství|teologie|religi|theology|bible|buddh/.test(text)) {
    return '2 (Náboženství. Teologie)';
  }
  if (/společens|sociolog|právo|ekonom|politik|pedagog|law|economics|sociology|education/.test(text)) {
    return '3 (Společenské vědy. Právo. Ekonomie)';
  }
  if (/matematik|přírodn|fyzik|chemie|biolog|astronom|math|physics|chemistry|biology|science/.test(text)) {
    return '5 (Matematika. Přírodní vědy)';
  }
  if (/technik|počítač|informatik|lékař|medic|zdraví|zeměděl|computer|technology|medicine|engineering/.test(text)) {
    return '6 (Uplatněné vědy. Technika. Lékařství)';
  }
  if (/umění|architektur|fotograf|hudba|sport|hry|art|music|sports/.test(text)) {
    return '7 (Umění. Hudba. Sport)';
  }
  if (/jazyk|lingvist|slovník|language|linguistics|dictionary/.test(text)) {
    return '81 (Jazykověda / Lingvistika)';
  }

  // Default fallback for general literature / fiction
  return '82-3 (Krásná literatura - Próza)';
}

/**
 * Normalizes ISBN input string (removes hyphens and spaces)
 */
export function normalizeIsbn(input) {
  if (!input) return '';
  return input.replace(/[-\s]/g, '').trim();
}

/**
 * Checks if the string looks like a valid ISBN-10 or ISBN-13 or barcode number
 */
export function isIsbnLike(input) {
  const clean = normalizeIsbn(input);
  return /^\d{9}[\dX]$/i.test(clean) || /^\d{13}$/.test(clean);
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

    let isbn = isIsbnLike(clean) ? clean : '';
    const isbn13Obj = industryIdentifiers.find(id => id.type === 'ISBN_13');
    const isbn10Obj = industryIdentifiers.find(id => id.type === 'ISBN_10');
    if (isbn13Obj) isbn = isbn13Obj.identifier;
    else if (isbn10Obj) isbn = isbn10Obj.identifier;

    const coverImage = book.imageLinks?.thumbnail
      ? book.imageLinks.thumbnail.replace('http://', 'https://')
      : null;

    const categories = book.categories ? book.categories.join(', ') : '';
    const mdt = deriveMdtClassification(categories, book.title, book.description);

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
      categories: categories,
      mdt: mdt,
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
          const categories = item.subjects ? item.subjects.map(s => s.name).slice(0, 3).join(', ') : '';
          const notes = typeof item.notes === 'string' ? item.notes : 'Popis není k dispozici.';
          const mdt = deriveMdtClassification(categories, item.title, notes);

          return {
            id: `ol-${clean}`,
            title: item.title || 'Neznámý název',
            authors: item.authors ? item.authors.map(a => a.name).join(', ') : 'Neznámý autor',
            isbn: clean,
            publishedDate: item.publish_date || '',
            publisher: item.publishers ? item.publishers.map(p => p.name).join(', ') : '',
            description: notes,
            coverImage: item.cover?.medium || item.cover?.large || null,
            pageCount: item.number_of_pages || 0,
            categories: categories,
            mdt: mdt,
            language: '',
            source: 'Open Library'
          };
        }
      }
    }

    // Fallback general search query by title / query
    const searchUrl = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=1`;
    const searchResp = await fetch(searchUrl);
    if (!searchResp.ok) return null;
    const searchData = await searchResp.json();

    if (!searchData.docs || searchData.docs.length === 0) return null;

    const doc = searchData.docs[0];
    const foundIsbn = doc.isbn ? doc.isbn[0] : (isIsbnLike(clean) ? clean : '');
    const coverImage = doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : null;
    const categories = doc.subject ? doc.subject.slice(0, 3).join(', ') : '';
    const mdt = deriveMdtClassification(categories, doc.title, '');

    return {
      id: doc.key || `ol-${Date.now()}`,
      title: doc.title || 'Neznámý název',
      authors: doc.author_name ? doc.author_name.join(', ') : 'Neznámý autor',
      isbn: foundIsbn || query,
      publishedDate: doc.first_publish_year ? String(doc.first_publish_year) : '',
      publisher: doc.publisher ? doc.publisher[0] : '',
      description: 'Popis z vyhledávání Open Library.',
      coverImage: coverImage,
      pageCount: doc.number_of_pages_median || 0,
      categories: categories,
      mdt: mdt,
      language: doc.language ? doc.language[0] : '',
      source: 'Open Library'
    };
  } catch (error) {
    console.error('Chyba při načítání z Open Library API:', error);
    return null;
  }
}

/**
 * Fetch book details by ISBN code or book title search query
 */
export async function searchBook(query) {
  if (!query || !query.trim()) return null;

  // Try Google Books API first
  const googleResult = await fetchFromGoogleBooks(query);
  if (googleResult) return googleResult;

  // Fallback to Open Library
  const openLibraryResult = await fetchFromOpenLibrary(query);
  if (openLibraryResult) return openLibraryResult;

  return null;
}
