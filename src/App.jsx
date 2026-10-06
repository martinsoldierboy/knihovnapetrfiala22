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
        setSuccessMsg(`Kniha "${bookData.title}" již byla v seznamu. Přesunuta na začátek!`);
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
    // Prevent repetitive immediate re-scans of the same code within a short buffer
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
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Navigation Bar */}
      <header className="bg-slate-900 text-white shadow-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div
            onClick={() => setCurrentView('scanner')}
            className="flex items-center gap-3 cursor-pointer hover:opacity-90 transition"
          >
            <div className="bg-emerald-500 p-2 rounded-xl text-slate-950 font-bold">
              <Scan className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-none">Skenování Knih</h1>
              <p className="text-xs text-slate-400 mt-0.5">Online knižní databáze &amp; ISBN</p>
            </div>
          </div>

          <button
            onClick={() => setCurrentView(currentView === 'scanner' ? 'list' : 'scanner')}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-4 py-2 rounded-lg text-sm shadow transition"
          >
            <List className="w-4 h-4" />
            <span>Seznam naskenovaných knih</span>
            <span className="bg-emerald-800 text-emerald-100 font-bold px-2 py-0.5 rounded-full text-xs ml-1">
              {scannedBooks.length}
            </span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-6">
        {currentView === 'scanner' ? (
          <div className="space-y-6 max-w-2xl mx-auto">

            {/* Header info */}
            <div className="text-center space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-medium text-xs">
                <Sparkles className="w-3.5 h-3.5" /> Automatické rozpoznání z Google Books &amp; Open Library
              </span>
              <h2 className="text-2xl font-bold text-slate-800">
                Naskenujte čárový kód knihy
              </h2>
              <p className="text-slate-600 text-sm">
                Naměřte kameru na čárový kód (EAN / ISBN) na obálce nebo zadejte kód ručně.
              </p>
            </div>

            {/* Camera Scanner Component */}
            <BarcodeScanner
              onScanSuccess={handleBarcodeScanned}
              isScanningActive={currentView === 'scanner' && !isLoading}
            />

            {/* Loading Indicator */}
            {isLoading && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center justify-center gap-3 animate-pulse">
                <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
                <span className="font-medium text-sm">Vyhledávám podrobnosti o knize v databázích...</span>
              </div>
            )}

            {/* Error Message */}
            {errorMsg && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <span className="text-sm font-medium">{errorMsg}</span>
              </div>
            )}

            {/* Success Message */}
            {successMsg && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <span className="text-sm font-medium">{successMsg}</span>
                </div>
                <button
                  onClick={() => setCurrentView('list')}
                  className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-md font-medium hover:bg-emerald-700 transition"
                >
                  Zobrazit seznam
                </button>
              </div>
            )}

            {/* Manual ISBN / Search Input */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                <Search className="w-4 h-4 text-emerald-600" /> Ruční zadání knižního kódu nebo názvu
              </h3>
              <form onSubmit={handleManualSearchSubmit} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Vložte ISBN (např. 9788020455826) nebo název knihy..."
                  value={manualQuery}
                  onChange={(e) => setManualQuery(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 focus:bg-white"
                />
                <button
                  type="submit"
                  disabled={isLoading || !manualQuery.trim()}
                  className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium px-4 py-2.5 rounded-lg text-sm transition flex items-center gap-2"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  <span>Vyhledat</span>
                </button>
              </form>
            </div>

            {/* Quick Preview of Recent Scans */}
            {scannedBooks.length > 0 && (
              <div className="pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                    Poslední naskenované knihy
                  </h3>
                  <button
                    onClick={() => setCurrentView('list')}
                    className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold"
                  >
                    Zobrazit vše ({scannedBooks.length}) &rarr;
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {scannedBooks.slice(0, 3).map((book) => (
                    <div
                      key={book.id}
                      onClick={() => setSelectedBook(book)}
                      className="bg-white p-3 rounded-lg border border-slate-200 hover:border-emerald-400 cursor-pointer flex items-center gap-3 transition shadow-sm"
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

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <p>Aplikace na skenování knih &copy; {new Date().getFullYear()} - Google Books &amp; Open Library API</p>
      </footer>
    </div>
  );
}
