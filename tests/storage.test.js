import test from 'node:test';
import assert from 'node:assert/strict';

// Mock localStorage for Node test environment before importing storage
const mockStore = new Map();
globalThis.localStorage = {
  getItem: (key) => mockStore.get(key) || null,
  setItem: (key, val) => mockStore.set(key, String(val)),
  removeItem: (key) => mockStore.delete(key),
  clear: () => mockStore.clear()
};

const {
  getSavedBooks,
  saveBook,
  removeBook,
  clearAllBooks,
  updateBookCount,
  changeBookCount,
  isSameBook
} = await import('../src/services/storage.js');

test('isSameBook identifies duplicate books correctly', () => {
  assert.equal(isSameBook({ id: '123' }, { id: '123' }), true);
  assert.equal(isSameBook({ isbn: '978-80-257-0367-0' }, { isbn: '9788025703670' }), true);
  // ISBN-10 vs ISBN-13
  assert.equal(isSameBook({ isbn: '80-257-0367-2' }, { isbn: '978-80-257-0367-0' }), true);
  assert.equal(isSameBook({ isbn: '9788025703670' }, { isbn: '9788020455826' }), false);
  assert.equal(isSameBook(null, { isbn: '9788025703670' }), false);
});

test('saveBook saves single book with count = 1 and increments on duplicate scan', () => {
  clearAllBooks();

  const book1 = {
    title: 'R.U.R.',
    isbn: '978-80-257-0367-0',
    authors: 'Karel Čapek'
  };

  const res1 = saveBook(book1);
  assert.equal(res1.success, true);
  assert.equal(res1.isDuplicate, false);
  assert.equal(res1.book.count, 1);

  let saved = getSavedBooks();
  assert.equal(saved.length, 1);
  assert.equal(saved[0].count, 1);

  // Scan same ISBN again
  const book2 = {
    title: 'R.U.R.',
    isbn: '9788025703670',
    authors: 'Karel Čapek'
  };

  const res2 = saveBook(book2);
  assert.equal(res2.success, true);
  assert.equal(res2.isDuplicate, true);
  assert.equal(res2.book.count, 2);

  saved = getSavedBooks();
  assert.equal(saved.length, 1); // No new entry created
  assert.equal(saved[0].count, 2);

  // Scan a third time using ISBN-10 format
  const book3 = {
    title: 'R.U.R.',
    isbn: '80-257-0367-2',
    authors: 'Karel Čapek'
  };

  const res3 = saveBook(book3);
  assert.equal(res3.success, true);
  assert.equal(res3.isDuplicate, true);
  assert.equal(res3.book.count, 3);

  saved = getSavedBooks();
  assert.equal(saved.length, 1);
  assert.equal(saved[0].count, 3);
});

test('saveBook with distinct ISBN adds separate entry', () => {
  clearAllBooks();

  saveBook({ title: 'Book A', isbn: '9788025703670' });
  saveBook({ title: 'Book B', isbn: '9788020455826' });

  const saved = getSavedBooks();
  assert.equal(saved.length, 2);
  assert.equal(saved[0].title, 'Book B');
  assert.equal(saved[0].count, 1);
  assert.equal(saved[1].title, 'Book A');
  assert.equal(saved[1].count, 1);
});

test('changeBookCount and updateBookCount modify copy counts', () => {
  clearAllBooks();

  const saved = saveBook({ id: 'test-1', title: 'Test Book', isbn: '9780000000001' });
  assert.equal(saved.book.count, 1);

  // Increment count
  const updated1 = changeBookCount('test-1', 1);
  assert.equal(updated1.count, 2);
  assert.equal(getSavedBooks()[0].count, 2);

  // Decrement count
  const updated2 = changeBookCount('test-1', -1);
  assert.equal(updated2.count, 1);
  assert.equal(getSavedBooks()[0].count, 1);

  // Should not decrement below 1
  const updated3 = changeBookCount('test-1', -1);
  assert.equal(updated3.count, 1);

  // updateBookCount
  updateBookCount('test-1', 5);
  assert.equal(getSavedBooks()[0].count, 5);
});
