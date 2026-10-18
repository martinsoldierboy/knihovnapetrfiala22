import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isbn10ToIsbn13,
  normalizeToIsbn13,
  cleanCatalogPunctuation,
  cleanAuthorName,
  parseKnihovnyAuthors,
  fetchFromKnihovnyCz
} from '../src/services/bookApi.js';

test('ISBN-10 to ISBN-13 conversion', () => {
  assert.equal(isbn10ToIsbn13('80-257-0367-2'), '9788025703670');
  assert.equal(normalizeToIsbn13('80-257-0367-2'), '9788025703670');
  assert.equal(normalizeToIsbn13('978-80-257-0367-0'), '9788025703670');
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

test('Knihovny.cz sample response parsing', async () => {
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
    const result = await fetchFromKnihovnyCz('978-80-257-0367-0');
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
