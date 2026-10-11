import React, { useState } from 'react';
import { Search, Trash2, Download, Upload, BookOpen, ChevronRight, ArrowLeft, Info, PlusCircle, ArrowUpDown } from 'lucide-react';
import { exportBooksToJson, importBooksFromJson } from '../services/storage';

export default function BookList({ books, onSelectBook, onDeleteBook, onGoBack, onRefresh }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [importStatus, setImportStatus] = useState(null);

  const filteredBooks = books.filter(book => {
    const term = searchTerm.toLowerCase();
    return (
      (book.title && book.title.toLowerCase().includes(term)) ||
      (book.authors && book.authors.toLowerCase().includes(term)) ||
      (book.isbn && book.isbn.toLowerCase().includes(term)) ||
      (book.publisher && book.publisher.toLowerCase().includes(term))
    );
  });

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target.result);
        const result = importBooksFromJson(json);
        if (result.success) {
          setImportStatus(`Úspěšně naimportováno ${result.count} knih.`);
          onRefresh();
        } else {
          setImportStatus('Chyba při importu souboru.');
        }
      } catch (err) {
        setImportStatus('Nevalidní JSON soubor.');
      }
      setTimeout(() => setImportStatus(null), 4000);
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Mobile Actions Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-xl shadow-sm border border-slate-200">
        <button
          onClick={onGoBack}
          className="flex items-center justify-center gap-2 text-emerald-700 active:text-emerald-900 font-semibold px-4 py-2.5 rounded-xl bg-emerald-50 active:bg-emerald-100 transition touch-manipulation text-sm"
        >
          <ArrowLeft className="w-5 h-5" /> Zpět ke skeneru
        </button>

        <div className="flex items-center justify-center gap-2 w-full sm:w-auto">
          <label className="flex-1 sm:flex-none cursor-pointer flex items-center justify-center gap-1.5 text-xs sm:text-sm font-medium px-3.5 py-2.5 bg-slate-100 active:bg-slate-200 text-slate-700 rounded-xl transition touch-manipulation">
            <Upload className="w-4 h-4 text-slate-500" />
            <span>Import JSON</span>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          <button
            onClick={exportBooksToJson}
            disabled={books.length === 0}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 text-xs sm:text-sm font-medium px-3.5 py-2.5 bg-slate-100 active:bg-slate-200 disabled:opacity-50 text-slate-700 rounded-xl transition touch-manipulation"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {importStatus && (
        <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-xl text-xs sm:text-sm flex items-center gap-2">
          <Info className="w-4 h-4 flex-shrink-0" />
          {importStatus}
        </div>
      )}

      {/* Header and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" /> Seznam naskenovaných knih
          </h2>
          <div className="flex items-center gap-2 text-slate-500 text-xs sm:text-sm mt-0.5">
            <span>Celkem uložených knih: <strong className="text-slate-800">{books.length}</strong></span>
            <span>•</span>
            <span className="flex items-center gap-1 text-emerald-700 font-medium">
              <ArrowUpDown className="w-3.5 h-3.5" /> Seřazeno podle ISBN
            </span>
          </div>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Hledat v seznamu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          />
        </div>
      </div>

      {/* Book Cards */}
      {filteredBooks.length === 0 ? (
        <div className="bg-white rounded-xl p-8 sm:p-10 text-center border border-slate-200">
          <BookOpen className="w-14 h-14 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-700 font-bold text-base sm:text-lg">
            {searchTerm ? 'Žádné knihy neodpovídají vyhledávání.' : 'Zatím jste nenaskenovali žádné knihy.'}
          </p>
          <p className="text-slate-400 text-xs sm:text-sm mt-1 mb-6">
            {searchTerm ? 'Zkuste změnit hledaný výraz.' : 'Spusťte skener na hlavní stránce a začněte skenovat!'}
          </p>
          {!searchTerm && (
            <button
              onClick={onGoBack}
              className="inline-flex items-center gap-2 bg-emerald-600 active:bg-emerald-700 text-white px-5 py-3 rounded-xl font-medium text-sm transition touch-manipulation"
            >
              <PlusCircle className="w-5 h-5" /> Naskenovat první knihu
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredBooks.map((book) => (
            <div
              key={book.id}
              onClick={() => onSelectBook(book)}
              className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-sm active:shadow-md transition duration-200 cursor-pointer flex gap-3.5 group relative overflow-hidden touch-manipulation"
            >
              {/* Cover Image */}
              <div className="w-20 h-28 bg-slate-100 rounded-lg border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                {book.coverImage ? (
                  <img src={book.coverImage} alt={book.title} className="w-full h-full object-cover" />
                ) : (
                  <BookOpen className="w-8 h-8 text-slate-300" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 line-clamp-2 text-sm sm:text-base group-hover:text-emerald-600 transition leading-snug">
                    {book.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-emerald-700 font-semibold line-clamp-1 mt-0.5">
                    {book.authors}
                  </p>
                  {book.publisher && (
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                      {book.publisher} {book.publishedDate ? `(${book.publishedDate})` : ''}
                    </p>
                  )}
                  {book.isbn && (
                    <p className="text-[11px] text-slate-600 font-semibold font-mono mt-1">
                      ISBN: {book.isbn}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100 text-[11px] text-slate-400">
                  <span>{book.scannedAt ? new Date(book.scannedAt).toLocaleDateString('cs-CZ') : ''}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Opravdu chcete smazat knihu "${book.title}"?`)) {
                          onDeleteBook(book.id);
                        }
                      }}
                      className="p-2 text-slate-400 hover:text-red-600 rounded-lg transition active:bg-red-50 touch-manipulation"
                      title="Smazat"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 transition" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
