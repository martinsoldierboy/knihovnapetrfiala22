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
  parseKnihovnyAuthors,
  fetchFromKnihovnyCz,
  fetchCoverImageFallback
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

test('Cover image fallback generation', async () => {
  const globalFetchBackup = globalThis.fetch;
  globalThis.fetch = async (url) => {
    if (url.includes('covers.openlibrary.org')) {
      return {
        ok: true,
        headers: new Map([
          ['content-type', 'image/jpeg'],
          ['content-length', '25000']
        ])
      };
    }
    return { ok: false };
  };

  try {
    const coverUrl = await fetchCoverImageFallback('9788025703670', 'Životy slavných');
    assert.equal(coverUrl, 'https://covers.openlibrary.org/b/isbn/9788025703670-L.jpg');
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
