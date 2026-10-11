/**
  Book Database lookup service (Google Books API & Open Library API)
 */

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
 * Fetch book details by ISBN or query trying Google Books first, then Open Library
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
