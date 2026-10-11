import React, { useState, useEffect } from 'react';
import BarcodeScanner from './components/BarcodeScanner';
import BookList from './components/BookList';
import BookDetailModal from './components/BookDetailModal';
import { searchBook } from './services/bookApi';
import { getSavedBooks, saveBook, removeBook } from './services/storage';
import { BookOpen, List, Search, Loader2, CheckCircle2, AlertCircle, Scan, Sparkles } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState('scanner'); // 'scanner' | 'list'
  const [manualQuery, setManualQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [scannedBooks, setScannedBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [lastProcessedCode, setLastProcessedCode] = useState('');

  // Load saved books on mount
  useEffect(() => {
    refreshBooks();
  }, []);

  const refreshBooks = () => {
    const books = getSavedBooks();
    setScannedBooks(books);
  };

  const handleBookSearchAndSave = async (query) => {
    if (!query || !query.trim()) return;

    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const bookData = await searchBook(query);

      if (!bookData) {
        setErrorMsg(`Kniha s kódem/názvem "${query}" nebyla nalezena v internetových databázích.`);
        setIsLoading(false);
        return;
      }

      const result = saveBook(bookData);
      refreshBooks();

      if (result.isDuplicate) {
        setSuccessMsg(`Kniha "${bookData.title}" již byla v seznamu.`);
      } else {
        setSuccessMsg(`Kniha "${bookData.title}" byla úspěšně uložena do seznamu!`);
      }

      setSelectedBook(result.book);
    } catch (err) {
      console.error('Chyba vyhledávání:', err);
      setErrorMsg('Při hledání v knižní databázi došlo k chybě.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBarcodeScanned = (code) => {
    if (code === lastProcessedCode && isLoading) return;
    setLastProcessedCode(code);
    handleBookSearchAndSave(code);
  };

  const handleManualSearchSubmit = (e) => {
    e.preventDefault();
    if (manualQuery.trim()) {
      handleBookSearchAndSave(manualQuery.trim());
      setManualQuery('');
    }
  };

  const handleDeleteBook = (id) => {
    removeBook(id);
    refreshBooks();
    if (selectedBook && selectedBook.id === id) {
      setSelectedBook(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans pb-12">
      {/* Mobile-optimized Header */}
      <header className="bg-slate-900 text-white shadow-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2">
          <div
            onClick={() => setCurrentView('scanner')}
            className="flex items-center gap-2.5 cursor-pointer active:opacity-80 transition"
          >
            <div className="bg-emerald-500 p-2 rounded-xl text-slate-950 font-bold flex-shrink-0">
              <Scan className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold leading-none truncate">Skenování Knih</h1>
              <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">Android Skener &amp; Databáze</p>
            </div>
          </div>

          <button
            onClick={() => setCurrentView(currentView === 'scanner' ? 'list' : 'scanner')}
            className="flex items-center gap-1.5 sm:gap-2 bg-emerald-600 active:bg-emerald-700 text-white font-medium px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm shadow transition touch-manipulation flex-shrink-0"
          >
            <List className="w-4 h-4" />
            <span className="hidden xs:inline">Seznam</span>
            <span className="bg-emerald-800 text-emerald-100 font-bold px-2 py-0.5 rounded-full text-xs">
              {scannedBooks.length}
            </span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-3 sm:p-4 md:p-6">
        {currentView === 'scanner' ? (
          <div className="space-y-4 sm:space-y-6 max-w-2xl mx-auto">

            {/* Mobile Header info */}
            <div className="text-center space-y-1.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-medium text-[11px] sm:text-xs">
                <Sparkles className="w-3 h-3 text-emerald-600" /> Rozpoznání knih z Google Books &amp; Open Library
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-800">
                Naskenujte čárový kód knihy
              </h2>
              <p className="text-slate-600 text-xs sm:text-sm px-2">
                Stiskněte tlačítko pro spuštění fotoaparátu Android nebo zadejte kód ručně.
              </p>
            </div>

            {/* Camera Scanner Component */}
            <BarcodeScanner
              onScanSuccess={handleBarcodeScanned}
            />

            {/* Loading Indicator */}
            {isLoading && (
              <div className="p-3.5 sm:p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center justify-center gap-3 animate-pulse">
                <Loader2 className="w-5 h-5 animate-spin text-emerald-600 flex-shrink-0" />
                <span className="font-medium text-xs sm:text-sm">Vyhledávám podrobnosti v knižních databázích...</span>
              </div>
            )}

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3.5 sm:p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium">{errorMsg}</span>
              </div>
            )}

            {/* Success Message */}
            {successMsg && (
              <div className="p-3.5 sm:p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-medium">{successMsg}</span>
                </div>
                <button
                  onClick={() => setCurrentView('list')}
                  className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg font-medium active:bg-emerald-700 transition touch-manipulation flex-shrink-0"
                >
                  Zobrazit seznam
                </button>
              </div>
            )}

            {/* Manual ISBN / Search Input */}
            <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <h3 className="font-semibold text-slate-800 text-xs sm:text-sm flex items-center gap-2">
                <Search className="w-4 h-4 text-emerald-600" /> Ruční zadání knižního kódu nebo názvu
              </h3>
              <form onSubmit={handleManualSearchSubmit} className="flex flex-col xs:flex-row gap-2">
                <input
                  type="text"
                  placeholder="Vložte ISBN nebo název knihy..."
                  value={manualQuery}
                  onChange={(e) => setManualQuery(e.target.value)}
                  className="flex-1 px-3.5 py-3 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 focus:bg-white"
                />
                <button
                  type="submit"
                  disabled={isLoading || !manualQuery.trim()}
                  className="bg-emerald-600 active:bg-emerald-700 disabled:opacity-50 text-white font-bold px-5 py-3 rounded-xl text-sm transition flex items-center justify-center gap-2 touch-manipulation"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  <span>Vyhledat</span>
                </button>
              </form>
            </div>

            {/* Quick Preview of Recent Scans */}
            {scannedBooks.length > 0 && (
              <div className="pt-3 border-t border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Naskenováno ({scannedBooks.length}) - dle ISBN
                  </h3>
                  <button
                    onClick={() => setCurrentView('list')}
                    className="text-xs text-emerald-700 active:text-emerald-900 font-semibold p-1 touch-manipulation"
                  >
                    Vše &rarr;
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {scannedBooks.slice(0, 3).map((book) => (
                    <div
                      key={book.id}
                      onClick={() => setSelectedBook(book)}
                      className="bg-white p-2.5 rounded-xl border border-slate-200 active:border-emerald-400 cursor-pointer flex items-center gap-2.5 transition shadow-sm touch-manipulation"
                    >
                      <div className="w-10 h-14 bg-slate-100 rounded overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {book.coverImage ? (
                          <img src={book.coverImage} alt={book.title} className="w-full h-full object-cover" />
                        ) : (
                          <BookOpen className="w-5 h-5 text-slate-300" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-xs text-slate-900 truncate">{book.title}</p>
                        <p className="text-[11px] text-emerald-700 font-medium truncate">{book.authors}</p>
                        {book.isbn && <p className="text-[10px] text-slate-400 font-mono truncate">ISBN: {book.isbn}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        ) : (
          <BookList
            books={scannedBooks}
            onSelectBook={setSelectedBook}
            onDeleteBook={handleDeleteBook}
            onGoBack={() => setCurrentView('scanner')}
            onRefresh={refreshBooks}
          />
        )}
      </main>

      {/* Book Detail Modal */}
      {selectedBook && (
        <BookDetailModal
          book={selectedBook}
          onClose={() => setSelectedBook(null)}
          onDelete={(id) => {
            handleDeleteBook(id);
            setSelectedBook(null);
          }}
        />
      )}

      {/* Mobile Footer */}
      <footer className="bg-white border-t border-slate-200 py-3 text-center text-xs text-slate-500 mt-auto">
        <p>Aplikace na skenování knih &copy; {new Date().getFullYear()} - Google Books &amp; Open Library API</p>
      </footer>
    </div>
  );
}
