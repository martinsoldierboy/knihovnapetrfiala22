import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeIsbn,
  isbn10ToIsbn13,
  normalizeToIsbn13,
  isIsbnLike,
  extractIsbnFromText,
  cleanCatalogPunctuation,
  cleanAuthorName,
  extractIndividualAuthors,
  getAuthorStatistics,
  parseKnihovnyAuthors,
  formatKnihovnyRecord,
  formatGoogleBooksItem,
  searchKnihovnyCzList,
  searchGoogleBooksList,
  searchBooks,
  fetchFromKnihovnyCz,
  fetchCoverImageFallback,
  fetchCoverFromObalkyKnih,
  normalizeObalkyCoverUrl,
  getDatabazeKnihUrl,
  searchBook
} from '../src/services/bookApi.js';
import { getMdtCategory, getMdtColorConfig, MDT_CLASSES } from '../src/services/mdtClassification.js';

test('ISBN normalization and prefix removal', () => {
  assert.equal(normalizeIsbn('9788025703670'), '9788025703670');
  assert.equal(normalizeIsbn('978-80-257-0367-0'), '9788025703670');
  assert.equal(normalizeIsbn('ISBN 978-80-257-0367-0'), '9788025703670');
  assert.equal(normalizeIsbn('ISBN: 8025703672'), '8025703672');
  assert.equal(normalizeIsbn('  isbn: 978 80 204 5582 6  '), '9788020455826');
});

test('ISBN-10 to ISBN-13 conversion and numeric detection', () => {
  assert.equal(isbn10ToIsbn13('80-257-0367-2'), '9788025703670');
  assert.equal(normalizeToIsbn13('80-257-0367-2'), '9788025703670');
  assert.equal(normalizeToIsbn13('8025703672'), '9788025703670');
  assert.equal(normalizeToIsbn13('978-80-257-0367-0'), '9788025703670');
  assert.equal(normalizeToIsbn13('9788025703670'), '9788025703670');

  assert.equal(isIsbnLike('9788025703670'), true);
  assert.equal(isIsbnLike('8025703672'), true);
  assert.equal(isIsbnLike('0978802045582'), true); // 12-digit UPC code
  assert.equal(isIsbnLike('ISBN 9788025703670'), true);
  assert.equal(isIsbnLike('Karel Capek Valky s mloky'), false);
});

test('Extract ISBN numbers from OCR or printed text', () => {
  assert.equal(extractIsbnFromText('ISBN 978-80-204-5582-6 cena 399 Kc'), '9788020455826');
  assert.equal(extractIsbnFromText('Kniha RUR, ISBN: 80-257-0367-2 Vydavatelstvo Argo'), '9788025703670');
  assert.equal(extractIsbnFromText('Text bez jakéhokoliv čísla kNIHY'), null);
  assert.equal(extractIsbnFromText('9788020455826'), '9788020455826');
});

test('MDT category classification and genre color assignment', () => {
  // Class 1 - Filozofie & Psychologie
  const book1 = { title: 'Základy psychologie a etiky', categories: '' };
  assert.equal(getMdtCategory(book1).code, '1');
  assert.equal(getMdtCategory(book1).shortName, 'Filozofie & Psychologie');

  // Class 5 - Přírodní vědy
  const book5 = { title: 'Úvod do teoretické fyziky a matematiky', categories: '' };
  assert.equal(getMdtCategory(book5).code, '5');

  // Class 6 - Lékařství & Technika
  const book6 = { title: 'Moderní lékařství a zdravotní péče', categories: '' };
  assert.equal(getMdtCategory(book6).code, '6');

  // Class 8 - Literatura & Beletrie
  const book8 = { title: 'Válka s Mloky', categories: 'Beletrie' };
  assert.equal(getMdtCategory(book8).code, '8');

  // Explicit MDT property
  const bookMdt = { title: 'Neznámý titul', mdt: '930.1' };
  assert.equal(getMdtCategory(bookMdt).code, '9');

  // Color config test
  const color5 = getMdtColorConfig('5');
  assert.equal(color5.hex, '#10b981');
});

test('normalizeObalkyCoverUrl converts cache URLs to www.obalkyknih.cz', () => {
  assert.equal(
    normalizeObalkyCoverUrl('http://cache.obalkyknih.cz/file/cover/487884/preview510'),
    'https://www.obalkyknih.cz/file/cover/487884/preview510'
  );
  assert.equal(
    normalizeObalkyCoverUrl('https://cache2.obalkyknih.cz/file/cover/123/medium'),
    'https://www.obalkyknih.cz/file/cover/123/medium'
  );
  assert.equal(
    normalizeObalkyCoverUrl('https://www.obalkyknih.cz/file/cover/487884/medium'),
    'https://www.obalkyknih.cz/file/cover/487884/medium'
  );
  assert.equal(normalizeObalkyCoverUrl(null), null);
});

test('fetchCoverFromObalkyKnih queries ObálkyKnih API and returns normalized cover', async () => {
  const mockObalkyResponse = [
    {
      _id: '6af076ca3541f9a854103ad8',
      ean: '9788025703670',
      cover_preview510_url: 'https://cache.obalkyknih.cz/file/cover/487884/preview510',
      cover_medium_url: 'https://cache.obalkyknih.cz/file/cover/487884/medium',
      backlink_url: 'http://www.obalkyknih.cz/view?isbn=9788025703670',
      annotation: { html: '<p>Skvělá kniha o poezii</p>' },
      rating_avg100: '85'
    }
  ];

  const globalFetchBackup = globalThis.fetch;
  globalThis.fetch = async (url) => {
    assert.match(url, /https:\/\/cache\.obalkyknih\.cz\/api\/books\?/);
    assert.match(url, /isbn=9788025703670/);
    return {
      ok: true,
      json: async () => mockObalkyResponse
    };
  };

  try {
    const result = await fetchCoverFromObalkyKnih('978-80-257-0367-0');
    assert.notEqual(result, null);
    assert.equal(result.coverUrl, 'https://www.obalkyknih.cz/file/cover/487884/preview510');
    assert.equal(result.backlinkUrl, 'https://www.obalkyknih.cz/view?isbn=9788025703670');
    assert.equal(result.annotation, 'Skvělá kniha o poezii');
    assert.equal(result.rating, 85);
  } finally {
    globalThis.fetch = globalFetchBackup;
  }
});

test('getDatabazeKnihUrl formats URL with ISBN, query or title', () => {
  assert.equal(
    getDatabazeKnihUrl({ isbn: '978-80-257-0367-0', title: 'R.U.R.' }),
    'https://www.databazeknih.cz/search?q=9788025703670'
  );
  assert.equal(
    getDatabazeKnihUrl({ title: 'Válka s mloky', authors: 'Karel Čapek' }),
    'https://www.databazeknih.cz/search?q=V%C3%A1lka%20s%20mloky%20Karel%20%C4%8Capek'
  );
  assert.equal(
    getDatabazeKnihUrl('Karel Čapek'),
    'https://www.databazeknih.cz/search?q=Karel%20%C4%8Capek'
  );
  assert.equal(getDatabazeKnihUrl(null), 'https://www.databazeknih.cz');
});

test('searchBooks supports author query and queries Knihovny.cz author search', async () => {
  const globalFetchBackup = globalThis.fetch;
  const queriedUrls = [];

  globalThis.fetch = async (url) => {
    queriedUrls.push(url);
    if (url.includes('knihovny.cz/api/v1/search') && url.includes('type=Author')) {
      return {
        ok: true,
        json: async () => ({
          resultCount: 1,
          records: [{
            id: 'mkp.author.1',
            title: 'Krakatit',
            authors: { primary: { 'Karel Čapek': [] } },
            publishers: ['Aventinum'],
            publicationDates: ['1924'],
            isbns: ['9788025700001'],
            formats: ['0/BOOKS/']
          }]
        })
      };
    }
    if (url.includes('knihovny.cz/api/v1/search')) {
      return {
        ok: true,
        json: async () => ({ resultCount: 0, records: [] })
      };
    }
    return {
      ok: true,
      json: async () => ({ items: [], docs: [] })
    };
  };

  try {
    const results = await searchBooks('Karel Čapek');
    assert.equal(results.length, 1);
    assert.equal(results[0].title, 'Krakatit');
    assert.equal(results[0].authors, 'Karel Čapek');
    assert.equal(results[0].isbn, '9788025700001');
    assert.ok(results[0].databazeKnihUrl.includes('databazeknih.cz'));

    // Check that type=Author query was actually executed
    const authorUrl = queriedUrls.find(u => u.includes('type=Author'));
    assert.notEqual(authorUrl, undefined);
  } finally {
    globalThis.fetch = globalFetchBackup;
  }
});

test('searchBooks author fallback to Google Books inauthor and Open Library author', async () => {
  const globalFetchBackup = globalThis.fetch;
  const queriedUrls = [];

  globalThis.fetch = async (url) => {
    queriedUrls.push(url);
    if (url.includes('knihovny.cz')) {
      return { ok: true, json: async () => ({ records: [] }) };
    }
    if (url.includes('googleapis.com') && url.includes('inauthor:')) {
      return {
        ok: true,
        json: async () => ({
          items: [{
            id: 'gb-capek-1',
            volumeInfo: {
              title: 'Bílá nemoc',
              authors: ['Karel Čapek'],
              publisher: 'Borový',
              publishedDate: '1937',
              averageRating: 4.5,
              ratingsCount: 20,
              industryIdentifiers: [{ type: 'ISBN_13', identifier: '9788025700002' }]
            }
          }]
        })
      };
    }
    return { ok: true, json: async () => ({ items: [], docs: [] }) };
  };

  try {
    const results = await searchBooks('Karel Čapek');
    assert.equal(results.length, 1);
    assert.equal(results[0].title, 'Bílá nemoc');
    assert.equal(results[0].authors, 'Karel Čapek');
    assert.equal(results[0].rating, 90); // 4.5 * 20 = 90%
    assert.ok(results[0].databazeKnihUrl.includes('databazeknih.cz'));

    const inauthorUrl = queriedUrls.find(u => u.includes('inauthor:'));
    assert.notEqual(inauthorUrl, undefined);
  } finally {
    globalThis.fetch = globalFetchBackup;
  }
});

test('searchBook enriches record with ObálkyKnih rating and annotation if available', async () => {
  const sampleKnihovnyResp = {
    resultCount: 1,
    records: [{
      id: 'knihovny-999',
      title: 'Továrna na Absolutno',
      authors: { primary: { 'Karel Čapek': [] } },
      isbns: ['9788025700003'],
      languages: ['cze'],
      editions: ['Vydání 3.']
    }],
    status: 'OK'
  };

  const sampleObalkyResp = [
    {
      cover_preview510_url: 'https://cache.obalkyknih.cz/file/cover/1234/preview510',
      backlink_url: 'https://www.obalkyknih.cz/view?isbn=9788025700003',
      rating_avg100: '88',
      annotation: { html: '<p>Román o vynálezu karburátoru.</p>' }
    }
  ];

  const globalFetchBackup = globalThis.fetch;
  globalThis.fetch = async (url) => {
    if (url.includes('knihovny.cz/api/v1/search')) {
      return { ok: true, json: async () => sampleKnihovnyResp };
    }
    if (url.includes('obalkyknih.cz/api/books')) {
      return { ok: true, json: async () => sampleObalkyResp };
    }
    return { ok: false };
  };

  try {
    const book = await searchBook('9788025700003');
    assert.notEqual(book, null);
    assert.equal(book.title, 'Továrna na Absolutno');
    assert.equal(book.rating, 88);
    assert.equal(book.annotation, 'Román o vynálezu karburátoru.');
    assert.equal(book.description, 'Román o vynálezu karburátoru.');
    assert.equal(book.language, 'cze');
    assert.equal(book.edition, 'Vydání 3.');
    assert.ok(book.databazeKnihUrl.includes('databazeknih.cz'));
    assert.ok(book.knihovnyUrl.includes('knihovny.cz/Record/knihovny-999'));
  } finally {
    globalThis.fetch = globalFetchBackup;
  }
});

test('fetchCoverFromObalkyKnih returns null on bare record without covers', async () => {
  const mockBareResponse = [
    {
      _id: 'bare123',
      flag_bare_record: 1,
      ean: '9999999999999'
    }
  ];

  const globalFetchBackup = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: true,
    json: async () => mockBareResponse
  });

  try {
    const result = await fetchCoverFromObalkyKnih('9999999999999');
    assert.equal(result, null);
  } finally {
    globalThis.fetch = globalFetchBackup;
  }
});

test('Cover image fallback generation prioritizes ObálkyKnih.cz', async () => {
  const globalFetchBackup = globalThis.fetch;
  globalThis.fetch = async (url) => {
    if (url.includes('obalkyknih.cz/api/books')) {
      return {
        ok: true,
        json: async () => [
          {
            cover_medium_url: 'https://cache.obalkyknih.cz/file/cover/2238685/medium',
            backlink_url: 'https://www.obalkyknih.cz/view?isbn=9788020455826'
          }
        ]
      };
    }
    return { ok: false };
  };

  try {
    const coverUrl = await fetchCoverImageFallback('9788020455826', 'Nezlomná');
    assert.equal(coverUrl, 'https://www.obalkyknih.cz/file/cover/2238685/medium');
  } finally {
    globalThis.fetch = globalFetchBackup;
  }
});

test('searchBook enriches Knihovny.cz record with ObálkyKnih cover', async () => {
  const sampleKnihovnyResp = {
    resultCount: 1,
    records: [{
      id: 'knihovny-123',
      title: 'Babička',
      authors: { primary: { 'Božena Němcová': [] } },
      isbns: ['9788025703670'],
      publishers: ['Odeon']
    }],
    status: 'OK'
  };

  const sampleObalkyResp = [
    {
      cover_preview510_url: 'https://cache.obalkyknih.cz/file/cover/487884/preview510',
      backlink_url: 'https://www.obalkyknih.cz/view?isbn=9788025703670'
    }
  ];

  const globalFetchBackup = globalThis.fetch;
  globalThis.fetch = async (url) => {
    if (url.includes('knihovny.cz/api/v1/search')) {
      return {
        ok: true,
        json: async () => sampleKnihovnyResp
      };
    }
    if (url.includes('obalkyknih.cz/api/books')) {
      return {
        ok: true,
        json: async () => sampleObalkyResp
      };
    }
    return { ok: false };
  };

  try {
    const book = await searchBook('9788025703670');
    assert.notEqual(book, null);
    assert.equal(book.title, 'Babička');
    assert.equal(book.coverImage, 'https://www.obalkyknih.cz/file/cover/487884/preview510');
    assert.equal(book.obalkyKnihUrl, 'https://www.obalkyknih.cz/view?isbn=9788025703670');
  } finally {
    globalThis.fetch = globalFetchBackup;
  }
});

test('searchBooks returns distinct editions and records from Knihovny.cz and Google Books', async () => {
  const sampleKnihovnyResponse = {
    resultCount: 2,
    records: [
      {
        id: 'rec-1',
        title: 'Válka s Mloky',
        authors: { primary: { 'Karel Čapek': [] } },
        publishers: ['Fr. Borový'],
        placesOfPublication: ['Praha'],
        publicationDates: ['1936'],
        physicalDescriptions: ['310 s.'],
        isbns: ['9788025703670'],
        formats: ['0/BOOKS/']
      },
      {
        id: 'rec-2',
        title: 'Válka s Mloky',
        authors: { primary: { 'Karel Čapek': [] } },
        publishers: ['Mladá fronta'],
        placesOfPublication: ['Praha'],
        publicationDates: ['1981'],
        physicalDescriptions: ['280 s.'],
        isbns: ['9788020455826'],
        formats: ['0/BOOKS/']
      }
    ]
  };

  const globalFetchBackup = globalThis.fetch;
  globalThis.fetch = async (url) => {
    if (url.includes('knihovny.cz')) {
      return {
        ok: true,
        json: async () => sampleKnihovnyResponse
      };
    }
    return {
      ok: true,
      json: async () => ({ items: [] })
    };
  };

  try {
    const results = await searchBooks('Válka s Mloky');
    assert.equal(results.length, 2);

    // Verify first edition
    assert.equal(results[0].title, 'Válka s Mloky');
    assert.equal(results[0].publishedDate, '1936');
    assert.equal(results[0].publisher, 'Fr. Borový (Praha)');
    assert.equal(results[0].isbn, '9788025703670');
    assert.equal(results[0].coverImage, 'https://www.obalkyknih.cz/view?isbn=9788025703670');

    // Verify second edition
    assert.equal(results[1].title, 'Válka s Mloky');
    assert.equal(results[1].publishedDate, '1981');
    assert.equal(results[1].publisher, 'Mladá fronta (Praha)');
    assert.equal(results[1].isbn, '9788020455826');
    assert.equal(results[1].coverImage, 'https://www.obalkyknih.cz/view?isbn=9788020455826');
  } finally {
    globalThis.fetch = globalFetchBackup;
  }
});

test('searchBooks handles empty search and fallback to Google Books', async () => {
  const globalFetchBackup = globalThis.fetch;
  globalThis.fetch = async (url) => {
    if (url.includes('knihovny.cz')) {
      return {
        ok: true,
        json: async () => ({ records: [] })
      };
    }
    if (url.includes('googleapis.com')) {
      return {
        ok: true,
        json: async () => ({
          items: [{
            id: 'gb-123',
            volumeInfo: {
              title: '1984',
              authors: ['George Orwell'],
              publisher: 'Secker & Warburg',
              publishedDate: '1949',
              industryIdentifiers: [{ type: 'ISBN_13', identifier: '9780451524935' }],
              imageLinks: { thumbnail: 'http://books.google.com/sample.jpg' }
            }
          }]
        })
      };
    }
    return { ok: false };
  };

  try {
    const results = await searchBooks('1984');
    assert.equal(results.length, 1);
    assert.equal(results[0].title, '1984');
    assert.equal(results[0].authors, 'George Orwell');
    assert.equal(results[0].publishedDate, '1949');
    assert.equal(results[0].isbn, '9780451524935');
    assert.equal(results[0].coverImage, 'https://books.google.com/sample.jpg');
    assert.equal(results[0].source, 'Google Books');

    // Empty query test
    const emptyRes = await searchBooks('');
    assert.deepEqual(emptyRes, []);
  } finally {
    globalThis.fetch = globalFetchBackup;
  }
});

test('Clean catalog punctuation', () => {
  assert.equal(cleanCatalogPunctuation('Argo,'), 'Argo');
  assert.equal(cleanCatalogPunctuation('Praha :'), 'Praha');
  assert.equal(cleanCatalogPunctuation('[Praha] :'), 'Praha');
});

test('Clean author name and parse Knihovny authors', () => {
  assert.equal(cleanAuthorName('Jean de Nostredame, asi 1507-1577'), 'Jean de Nostredame');
  assert.equal(cleanAuthorName('Josef Prokop, 1971-'), 'Josef Prokop');
  assert.equal(cleanAuthorName('Vojtěch Domlátil, 1979-'), 'Vojtěch Domlátil');

  const mockAuthors = {
    primary: { 'Jean de Nostredame, asi 1507-1577': [] },
    secondary: { 'Josef Prokop, 1971-': [], 'Vojtěch Domlátil, 1979-': [] },
    corporate: []
  };

  assert.equal(parseKnihovnyAuthors(mockAuthors), 'Jean de Nostredame');
});

test('extractIndividualAuthors handles single and multiple authors', () => {
  assert.deepEqual(extractIndividualAuthors('Karel Čapek'), ['Karel Čapek']);
  assert.deepEqual(extractIndividualAuthors('Karel Čapek, Josef Čapek'), ['Karel Čapek', 'Josef Čapek']);
  assert.deepEqual(extractIndividualAuthors('Božena Němcová; Karel Jaromír Erben'), ['Božena Němcová', 'Karel Jaromír Erben']);
  assert.deepEqual(extractIndividualAuthors('Jean de Nostredame, asi 1507-1577'), ['Jean de Nostredame']);
  assert.deepEqual(extractIndividualAuthors('Neznámý autor'), ['Neznámý autor']);
  assert.deepEqual(extractIndividualAuthors(''), ['Neznámý autor']);
  assert.deepEqual(extractIndividualAuthors(null), []);
});

test('getAuthorStatistics computes counts and copies correctly', () => {
  const books = [
    { id: '1', title: 'Válka s Mloky', authors: 'Karel Čapek', count: 2 },
    { id: '2', title: 'R.U.R.', authors: 'Karel Čapek', count: 1 },
    { id: '3', title: 'Povídání o pejskovi a kočičce', authors: 'Josef Čapek', count: 3 },
    { id: '4', title: 'Ze života hmyzu', authors: 'Karel Čapek, Josef Čapek', count: 1 }
  ];

  const stats = getAuthorStatistics(books);
  assert.equal(stats.length, 2);

  // Karel Čapek: 3 books (Válka s Mloky, R.U.R., Ze života hmyzu), total copies = 2 + 1 + 1 = 4
  assert.equal(stats[0].name, 'Karel Čapek');
  assert.equal(stats[0].bookCount, 3);
  assert.equal(stats[0].totalCopies, 4);

  // Josef Čapek: 2 books (Povídání, Ze života hmyzu), total copies = 3 + 1 = 4
  assert.equal(stats[1].name, 'Josef Čapek');
  assert.equal(stats[1].bookCount, 2);
  assert.equal(stats[1].totalCopies, 4);
});

test('Knihovny.cz sample response parsing with raw numeric ISBN', async () => {
  const sampleResponse = {
    resultCount: 1,
    records: [{
      id: 'mkp.3521868',
      title: 'Životy slavných a starých provensálských básníků, kteří žili v dobách hrabat z kraje Provença',
      authors: {
        primary: { 'Jean de Nostredame, asi 1507-1577': [] },
        secondary: { 'Josef Prokop, 1971-': [], 'Vojtěch Domlátil, 1979-': [] },
        corporate: []
      },
      publishers: ['Argo,'],
      placesOfPublication: ['Praha :'],
      publicationDates: ['2011'],
      physicalDescriptions: ['218 s. : il. ; 22 cm'],
      isbns: ['978-80-257-0367-0'],
      issns: [],
      cnb: 'cnb002163342',
      formats: ['0/BOOKS/']
    }],
    status: 'OK'
  };

  const globalFetchBackup = globalThis.fetch;
  globalThis.fetch = async (url) => {
    // Assert url parameters
    assert.match(url, /https:\/\/www\.knihovny\.cz\/api\/v1\/search\?/);
    assert.match(url, /lookfor=9788025703670/);
    assert.match(url, /type=ISN/);
    assert.match(url, /limit=10/);
    assert.match(url, /field%5B%5D=id/);

    return {
      ok: true,
      json: async () => sampleResponse
    };
  };

  try {
    // Test searching with raw numeric digits (e.g. from camera scan)
    const result = await fetchFromKnihovnyCz('9788025703670');
    assert.notEqual(result, null);
    assert.equal(result.id, 'mkp.3521868');
    assert.equal(result.title, 'Životy slavných a starých provensálských básníků, kteří žili v dobách hrabat z kraje Provença');
    assert.equal(result.authors, 'Jean de Nostredame');
    assert.equal(result.publisher, 'Argo (Praha)');
    assert.equal(result.publishedDate, '2011');
    assert.equal(result.pageCount, 218);
    assert.equal(result.isbn, '978-80-257-0367-0');
    assert.equal(result.cnb, 'cnb002163342');
    assert.equal(result.source, 'Knihovny.cz');
  } finally {
    globalThis.fetch = globalFetchBackup;
  }
});

test('Knihovny.cz empty records response handling', async () => {
  const emptyResponse = {
    resultCount: 0,
    status: 'OK'
  };

  const globalFetchBackup = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: true,
    json: async () => emptyResponse
  });

  try {
    const result = await fetchFromKnihovnyCz('9780000000000');
    assert.equal(result, null);
  } finally {
    globalThis.fetch = globalFetchBackup;
  }
});
