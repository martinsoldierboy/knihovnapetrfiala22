/**
 * LocalStorage Service for Scanned Books Management
 */
import { normalizeToIsbn13 } from './bookApi.js';

const STORAGE_KEY = 'naskenovane_knihy';

/**
 * Gets all saved books
 */
export function getSavedBooks() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    const books = data ? JSON.parse(data) : [];
    // Ensure all existing books have count initialized to at least 1
    return books.map(book => ({
      ...book,
      count: typeof book.count === 'number' && book.count > 0 ? book.count : 1
    }));
  } catch (error) {
    console.error('Chyba při načítání uložených knih:', error);
    return [];
  }
}

/**
 * Checks if two books have matching ISBNs or IDs
 */
export function isSameBook(b1, b2) {
  if (!b1 || !b2) return false;
  if (b1.id && b2.id && b1.id === b2.id) return true;

  if (b1.isbn && b2.isbn) {
    const isbn1 = normalizeToIsbn13(b1.isbn);
    const isbn2 = normalizeToIsbn13(b2.isbn);
    if (isbn1 && isbn2 && isbn1 === isbn2) return true;
  }
  return false;
}

/**
 * Saves a new book or updates existing
 * When an existing book (same ISBN or ID) is scanned again, its count is incremented.
 * Returns object { success: boolean, isDuplicate: boolean, book: object }
 */
export function saveBook(book) {
  try {
    const books = getSavedBooks();

    // Check if book with same ISBN or ID already exists
    const existingIndex = books.findIndex(b => isSameBook(b, book));

    const timestamp = new Date().toISOString();
    let isDuplicate = false;
    let bookToSave;

    if (existingIndex >= 0) {
      isDuplicate = true;
      const existingBook = books[existingIndex];
      const newCount = (existingBook.count || 1) + (book.count || 1);

      bookToSave = {
        ...existingBook,
        ...book,
        id: existingBook.id || book.id || `book-${Date.now()}`,
        count: newCount,
        scannedAt: timestamp
      };

      // Move to top and update with new count and timestamp
      books.splice(existingIndex, 1);
      books.unshift(bookToSave);
    } else {
      bookToSave = {
        ...book,
        count: typeof book.count === 'number' && book.count > 0 ? book.count : 1,
        scannedAt: book.scannedAt || timestamp,
        id: book.id || `book-${Date.now()}`
      };
      books.unshift(bookToSave);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
    return { success: true, isDuplicate, book: bookToSave };
  } catch (error) {
    console.error('Chyba při ukládání knihy:', error);
    return { success: false, error };
  }
}

/**
 * Updates the copy count of a book by ID
 */
export function updateBookCount(id, count) {
  try {
    const books = getSavedBooks();
    const target = books.find(b => b.id === id);
    if (!target) return null;

    target.count = Math.max(1, count);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
    return target;
  } catch (error) {
    console.error('Chyba při změně počtu kusů knihy:', error);
    return null;
  }
}

/**
 * Changes book copy count by a delta (+1 or -1)
 */
export function changeBookCount(id, delta) {
  try {
    const books = getSavedBooks();
    const target = books.find(b => b.id === id);
    if (!target) return null;

    target.count = Math.max(1, (target.count || 1) + delta);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
    return target;
  } catch (error) {
    console.error('Chyba při změně počtu kusů knihy:', error);
    return null;
  }
}

/**
 * Removes a book by ID
 */
export function removeBook(id) {
  try {
    const books = getSavedBooks();
    const filtered = books.filter(b => b.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Chyba při mazání knihy:', error);
    return false;
  }
}

/**
 * Clears all saved books
 */
export function clearAllBooks() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Chyba při mazání všech knih:', error);
    return false;
  }
}

/**
 * Export books to JSON file
 */
export function exportBooksToJson() {
  const books = getSavedBooks();
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(books, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `naskenovane_knihy_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

/**
 * Import books from JSON array
 */
export function importBooksFromJson(jsonArray) {
  if (!Array.isArray(jsonArray)) return { success: false, count: 0 };
  let importedCount = 0;
  jsonArray.forEach(book => {
    if (book && (book.title || book.isbn)) {
      saveBook(book);
      importedCount++;
    }
  });
  return { success: true, count: importedCount };
}
