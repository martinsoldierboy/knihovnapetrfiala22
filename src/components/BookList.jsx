import React, { useState } from 'react';
import { Search, Trash2, Download, Upload, BookOpen, ChevronRight, ArrowLeft, Info, PlusCircle } from 'lucide-react';
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
    <div className="space-y-6">
      {/* Navigation and Top Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <button
          onClick={onGoBack}
          className="flex items-center gap-2 text-emerald-700 hover:text-emerald-800 font-semibold px-4 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 transition"
        >
          <ArrowLeft className="w-5 h-5" /> Zpět ke skeneru
        </button>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="cursor-pointer flex items-center gap-1.5 text-xs sm:text-sm font-medium px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition">
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
            className="flex items-center gap-1.5 text-xs sm:text-sm font-medium px-3 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 rounded-lg transition"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {importStatus && (
        <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-lg text-sm flex items-center gap-2">
          <Info className="w-4 h-4" />
          {importStatus}
        </div>
      )}

      {/* Header and Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-emerald-600" /> Seznam naskenovaných knih
          </h2>
          <p className="text-slate-500 text-sm">
            Celkem uložených knih: <span className="font-semibold text-slate-800">{books.length}</span>
          </p>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Hledat v seznamu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          />
        </div>
      </div>

      {/* List / Cards */}
      {filteredBooks.length === 0 ? (
        <div className="bg-white rounded-xl p-10 text-center border border-slate-200">
          <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium text-lg">
            {searchTerm ? 'Žádné knihy neodpovídají vyhledávání.' : 'Zatím jste nenaskenovali žádné knihy.'}
          </p>
          <p className="text-slate-400 text-sm mt-1 mb-6">
            {searchTerm ? 'Zkuste změnit hledaný výraz.' : 'Připojte kameru na hlavní stránce a začněte skenovat!'}
          </p>
          {!searchTerm && (
            <button
              onClick={onGoBack}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-lg font-medium transition"
            >
              <PlusCircle className="w-5 h-5" /> Naskenovat první knihu
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBooks.map((book) => (
            <div
              key={book.id}
              onClick={() => onSelectBook(book)}
              className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition duration-200 cursor-pointer flex gap-4 group relative overflow-hidden"
            >
              {/* Cover */}
              <div className="w-20 h-28 bg-slate-100 rounded border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                {book.coverImage ? (
                  <img src={book.coverImage} alt={book.title} className="w-full h-full object-cover" />
                ) : (
                  <BookOpen className="w-8 h-8 text-slate-300" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 line-clamp-2 text-base group-hover:text-emerald-600 transition">
                    {book.title}
                  </h3>
                  <p className="text-sm text-emerald-700 font-medium line-clamp-1 mt-0.5">
                    {book.authors}
                  </p>
                  {book.publisher && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                      {book.publisher} {book.publishedDate ? `(${book.publishedDate})` : ''}
                    </p>
                  )}
                  {book.isbn && (
                    <p className="text-xs text-slate-400 mt-1 font-mono">
                      ISBN: {book.isbn}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 text-xs text-slate-400">
                  <span>{book.scannedAt ? new Date(book.scannedAt).toLocaleDateString('cs-CZ') : ''}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Opravdu chcete smazat knihu "${book.title}"?`)) {
                          onDeleteBook(book.id);
                        }
                      }}
                      className="p-1 text-slate-400 hover:text-red-600 rounded transition"
                      title="Smazat"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 transition transform group-hover:translate-x-1" />
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
