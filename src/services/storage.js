/**
 * LocalStorage Service for Scanned Books Management
 */

const STORAGE_KEY = 'naskenovane_knihy';

/**
 * Gets all saved books, sorted by ISBN number (ascending)
 */
export function getSavedBooks() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    const books = data ? JSON.parse(data) : [];

    return books.sort((a, b) => {
      const isbnA = (a.isbn || '').replace(/[-\s]/g, '');
      const isbnB = (b.isbn || '').replace(/[-\s]/g, '');

      if (isbnA && !isbnB) return -1;
      if (!isbnA && isbnB) return 1;
      if (!isbnA && !isbnB) return (a.title || '').localeCompare(b.title || '');

      return isbnA.localeCompare(isbnB, undefined, { numeric: true, sensitivity: 'base' });
    });
  } catch (error) {
    console.error('Chyba při načítání uložených knih:', error);
    return [];
  }
}

/**
 * Saves a new book or updates existing
 * Returns object { success: boolean, isDuplicate: boolean, book: object }
 */
export function saveBook(book) {
  try {
    const books = getSavedBooks();

    // Check if book with same ISBN or ID already exists
    const existingIndex = books.findIndex(
      b => (b.isbn && book.isbn && b.isbn === book.isbn) || b.id === book.id
    );

    const timestamp = new Date().toISOString();
    const bookToSave = {
      ...book,
      scannedAt: book.scannedAt || timestamp,
      id: book.id || `book-${Date.now()}`
    };

    let isDuplicate = false;

    if (existingIndex >= 0) {
      isDuplicate = true;
      books[existingIndex] = bookToSave;
    } else {
      books.push(bookToSave);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
    return { success: true, isDuplicate, book: bookToSave };
  } catch (error) {
    console.error('Chyba při ukládání knihy:', error);
    return { success: false, error };
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
