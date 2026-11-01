import React, { useState } from 'react';
import { Search, Trash2, Download, Upload, BookOpen, ChevronRight, ArrowLeft, Info, PlusCircle, Filter, Tag, Copy, Plus, Minus } from 'lucide-react';
import { exportBooksToJson, importBooksFromJson, changeBookCount } from '../services/storage';
import { getMdtCategory, MDT_CLASSES } from '../services/mdtClassification';

export default function BookList({ books, onSelectBook, onDeleteBook, onGoBack, onRefresh }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMdtCode, setSelectedMdtCode] = useState('ALL');
  const [importStatus, setImportStatus] = useState(null);

  const totalCopies = books.reduce((sum, b) => sum + (b.count || 1), 0);

  const filteredBooks = books.filter(book => {
    const term = searchTerm.toLowerCase();
    const matchesTerm = (
      (book.title && book.title.toLowerCase().includes(term)) ||
      (book.authors && book.authors.toLowerCase().includes(term)) ||
      (book.isbn && book.isbn.toLowerCase().includes(term)) ||
      (book.publisher && book.publisher.toLowerCase().includes(term))
    );

    if (selectedMdtCode === 'ALL') {
      return matchesTerm;
    }

    const mdtCategory = getMdtCategory(book);
    return matchesTerm && mdtCategory.code === selectedMdtCode;
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

  const handleIncrement = (e, book) => {
    e.stopPropagation();
    changeBookCount(book.id, 1);
    onRefresh();
  };

  const handleDecrement = (e, book) => {
    e.stopPropagation();
    if (book.count > 1) {
      changeBookCount(book.id, -1);
      onRefresh();
    }
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

      {/* Header, Search and Filter */}
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-emerald-600" /> Databáze naskenovaných knih
            </h2>
            <p className="text-slate-500 text-sm">
              Knihy roztříděny podle Mezinárodního desetinného třídění (MDT). Celkem: <span className="font-semibold text-slate-800">{books.length} {books.length === 1 ? 'titul' : books.length < 5 ? 'tituly' : 'titulů'}</span>
              {' '}&bull;{' '}
              <span className="font-semibold text-emerald-700">{totalCopies} {totalCopies === 1 ? 'kus' : totalCopies < 5 ? 'kusy' : 'kusů'}</span>
            </p>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Hledat v databázi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            />
          </div>
        </div>

        {/* MDT Genre filter chips */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-2">
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-emerald-600" /> Filtrovat podle žánru / třídy MDT:
          </span>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setSelectedMdtCode('ALL')}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition border ${
                selectedMdtCode === 'ALL'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
              }`}
            >
              Všechny žánry ({books.length})
            </button>

            {Object.values(MDT_CLASSES).map(cls => {
              const count = books.filter(b => getMdtCategory(b).code === cls.code).length;
              if (count === 0 && selectedMdtCode !== cls.code) return null;

              return (
                <button
                  key={cls.code}
                  onClick={() => setSelectedMdtCode(cls.code)}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium transition border flex items-center gap-1.5 ${
                    selectedMdtCode === cls.code
                      ? 'ring-2 ring-emerald-500 font-bold shadow-sm ' + cls.badgeBg
                      : cls.badgeBg + ' opacity-80 hover:opacity-100'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: cls.hex }}></span>
                  <span>{cls.shortName}</span>
                  <span className="bg-white/70 px-1.5 py-0.2 rounded-full text-[10px] font-bold">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* List / Cards */}
      {filteredBooks.length === 0 ? (
        <div className="bg-white rounded-xl p-10 text-center border border-slate-200">
          <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium text-lg">
            {searchTerm || selectedMdtCode !== 'ALL'
              ? 'Žádné knihy neodpovídají zvolenému filtru.'
              : 'Zatím jste nenaskenovali žádné knihy.'}
          </p>
          <p className="text-slate-400 text-sm mt-1 mb-6">
            {searchTerm || selectedMdtCode !== 'ALL'
              ? 'Zkuste změnit vyhledávací dotaz nebo vybraný žánr.'
              : 'Připojte kameru na hlavní stránce a začněte skenovat!'}
          </p>
          {!searchTerm && selectedMdtCode === 'ALL' && (
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
          {filteredBooks.map((book) => {
            const mdtCategory = getMdtCategory(book);
            const bookCount = book.count || 1;

            return (
              <div
                key={book.id}
                onClick={() => onSelectBook(book)}
                className={`bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition duration-200 cursor-pointer flex gap-4 group relative overflow-hidden ${mdtCategory.cardBorder}`}
              >
                {/* MDT Color Bar Left */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-1.5"
                  style={{ backgroundColor: mdtCategory.hex }}
                ></div>

                {/* Cover Image */}
                <div className="w-20 h-28 bg-slate-100 rounded border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center relative">
                  {book.coverImage ? (
                    <img
                      src={book.coverImage}
                      alt={book.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div
                    className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-300"
                    style={{ display: book.coverImage ? 'none' : 'flex' }}
                  >
                    <BookOpen className="w-8 h-8" />
                  </div>

                  {bookCount > 1 && (
                    <span className="absolute top-1 left-1 bg-amber-500 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded shadow">
                      {bookCount}×
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 flex flex-col justify-between pl-1">
                  <div>
                    {/* Header Tags */}
                    <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md border ${mdtCategory.badgeBg}`}
                      >
                        <Tag className="w-3 h-3" />
                        MDT {mdtCategory.code}
                      </span>

                      {bookCount > 1 ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-300 shadow-xs">
                          <Copy className="w-3 h-3" />
                          {bookCount} ks (duplikát)
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                          1 ks
                        </span>
                      )}
                    </div>

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
                    {/* Count increment/decrement controls */}
                    <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-0.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={(e) => handleDecrement(e, book)}
                        disabled={bookCount <= 1}
                        className="w-5 h-5 flex items-center justify-center rounded hover:bg-slate-200 disabled:opacity-30 text-slate-700"
                        title="Ubrat kus"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-1 font-bold text-slate-800 text-[11px]" title="Počet kusů">
                        {bookCount} ks
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleIncrement(e, book)}
                        className="w-5 h-5 flex items-center justify-center rounded hover:bg-slate-200 text-slate-700"
                        title="Přidat další kus"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

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
            );
          })}
        </div>
      )}
    </div>
  );
}
