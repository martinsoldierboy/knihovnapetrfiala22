import React, { useState, useMemo } from 'react';
import { Search, Trash2, Download, Upload, BookOpen, ChevronRight, ArrowLeft, Info, PlusCircle, Filter, Tag, Copy, Plus, Minus, User, Users, Layers, X, Sparkles } from 'lucide-react';
import { exportBooksToJson, importBooksFromJson, changeBookCount } from '../services/storage';
import { getMdtCategory, MDT_CLASSES } from '../services/mdtClassification';
import { getAuthorStatistics, extractIndividualAuthors } from '../services/bookApi';

export default function BookList({
  books,
  onSelectBook,
  onDeleteBook,
  onGoBack,
  onRefresh,
  initialAuthorFilter = 'ALL',
  onClearAuthorFilter
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMdtCode, setSelectedMdtCode] = useState('ALL');
  const [selectedAuthor, setSelectedAuthor] = useState(initialAuthorFilter);
  const [authorFilterQuery, setAuthorFilterQuery] = useState('');
  const [isGroupedByAuthor, setIsGroupedByAuthor] = useState(false);
  const [importStatus, setImportStatus] = useState(null);

  const totalCopies = books.reduce((sum, b) => sum + (b.count || 1), 0);

  // Author statistics for chips and quick browsing
  const authorStats = useMemo(() => {
    return getAuthorStatistics(books);
  }, [books]);

  // Filtered author chips when user searches in author input
  const visibleAuthorStats = useMemo(() => {
    if (!authorFilterQuery.trim()) return authorStats;
    const q = authorFilterQuery.toLowerCase();
    return authorStats.filter(stat => stat.name.toLowerCase().includes(q));
  }, [authorStats, authorFilterQuery]);

  const handleSelectAuthor = (authorName) => {
    setSelectedAuthor(authorName);
  };

  const handleResetFilters = () => {
    setSelectedAuthor('ALL');
    setSelectedMdtCode('ALL');
    setSearchTerm('');
    setAuthorFilterQuery('');
    if (onClearAuthorFilter) onClearAuthorFilter();
  };

  const filteredBooks = books.filter(book => {
    const term = searchTerm.toLowerCase();
    const matchesTerm = (
      !term ||
      (book.title && book.title.toLowerCase().includes(term)) ||
      (book.authors && book.authors.toLowerCase().includes(term)) ||
      (book.isbn && book.isbn.toLowerCase().includes(term)) ||
      (book.publisher && book.publisher.toLowerCase().includes(term))
    );

    const matchesMdt = selectedMdtCode === 'ALL' || getMdtCategory(book).code === selectedMdtCode;

    let matchesAuthor = true;
    if (selectedAuthor !== 'ALL') {
      const bookAuthors = extractIndividualAuthors(book.authors);
      matchesAuthor = bookAuthors.some(
        a => a.toLowerCase() === selectedAuthor.toLowerCase()
      ) || (book.authors && book.authors.toLowerCase().includes(selectedAuthor.toLowerCase()));
    }

    return matchesTerm && matchesMdt && matchesAuthor;
  });

  // Group books by author when grouped view is active
  const groupedBooks = useMemo(() => {
    if (!isGroupedByAuthor) return [];

    const map = new Map();
    for (const book of filteredBooks) {
      const authors = extractIndividualAuthors(book.authors);
      for (const author of authors) {
        if (!map.has(author)) {
          map.set(author, []);
        }
        map.get(author).push(book);
      }
    }

    return Array.from(map.entries()).sort((a, b) => {
      // Sort by book count desc, then name asc
      if (b[1].length !== a[1].length) {
        return b[1].length - a[1].length;
      }
      return a[0].localeCompare(b[0], 'cs');
    });
  }, [filteredBooks, isGroupedByAuthor]);

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

  const renderBookCard = (book) => {
    const mdtCategory = getMdtCategory(book);
    const bookCount = book.count || 1;
    const individualAuthors = extractIndividualAuthors(book.authors);

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

            {/* Clickable Authors */}
            <div className="text-sm text-emerald-700 font-medium line-clamp-1 mt-0.5 flex flex-wrap items-center gap-1">
              <User className="w-3.5 h-3.5 inline text-emerald-600 flex-shrink-0" />
              {individualAuthors.map((author, index) => (
                <span key={author} className="inline-flex items-center">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectAuthor(author);
                    }}
                    className="hover:underline hover:text-emerald-900 text-left cursor-pointer"
                    title={`Filtrovat knihy od: ${author}`}
                  >
                    {author}
                  </button>
                  {index < individualAuthors.length - 1 && <span className="mr-1">,</span>}
                </span>
              ))}
            </div>

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

        {/* Active Filters and Author / MDT Categories */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
          {/* Author Category & Filter Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-600" /> Kategorie autorů &amp; vyhledávání ({authorStats.length}):
              </span>
              {(selectedAuthor !== 'ALL' || selectedMdtCode !== 'ALL' || searchTerm) && (
                <button
                  onClick={handleResetFilters}
                  className="text-xs text-red-600 hover:text-red-700 font-medium inline-flex items-center gap-1 px-2 py-0.5 rounded-md hover:bg-red-50 transition border border-red-200"
                >
                  <X className="w-3 h-3" /> Zrušit filtry
                </button>
              )}
            </div>

            {/* Toggle grouping by author */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setIsGroupedByAuthor(!isGroupedByAuthor)}
                className={`text-xs px-2.5 py-1 rounded-lg border font-medium flex items-center gap-1.5 transition ${
                  isGroupedByAuthor
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                {isGroupedByAuthor ? 'Seskupeno dle autorů' : 'Seskupit dle autorů'}
              </button>
            </div>
          </div>

          {/* Quick filter input for authors if many authors exist */}
          {authorStats.length > 5 && (
            <div className="relative max-w-xs">
              <User className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Filtrovat seznam autorů..."
                value={authorFilterQuery}
                onChange={(e) => setAuthorFilterQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50 focus:bg-white"
              />
              {authorFilterQuery && (
                <button
                  onClick={() => setAuthorFilterQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          )}

          {/* Author filter chips */}
          <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
            <button
              onClick={() => handleSelectAuthor('ALL')}
              className={`text-xs px-3 py-1 rounded-full font-medium transition border flex items-center gap-1 ${
                selectedAuthor === 'ALL'
                  ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                  : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
              }`}
            >
              <Users className="w-3 h-3" />
              <span>Všichni autoři</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${selectedAuthor === 'ALL' ? 'bg-emerald-800 text-emerald-100' : 'bg-white/80'}`}>
                {books.length}
              </span>
            </button>

            {visibleAuthorStats.map((stat) => {
              const isSelected = selectedAuthor.toLowerCase() === stat.name.toLowerCase();
              return (
                <button
                  key={stat.name}
                  onClick={() => handleSelectAuthor(stat.name)}
                  className={`text-xs px-2.5 py-1 rounded-full font-medium transition border flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm font-bold'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-emerald-50 hover:border-emerald-200'
                  }`}
                  title={`${stat.name} (${stat.bookCount} titulů, celkem ${stat.totalCopies} ks)`}
                >
                  <User className="w-3 h-3 opacity-70" />
                  <span className="truncate max-w-[160px]">{stat.name}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isSelected ? 'bg-emerald-800 text-emerald-100' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {stat.bookCount} {stat.totalCopies > stat.bookCount && `(${stat.totalCopies} ks)`}
                  </span>
                </button>
              );
            })}
          </div>

          {/* MDT Genre filter chips */}
          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-emerald-600" /> Filtrovat podle žánru / třídy MDT:
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setSelectedMdtCode('ALL')}
                className={`text-xs px-3 py-1 rounded-full font-medium transition border ${
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
                    className={`text-xs px-3 py-1 rounded-full font-medium transition border flex items-center gap-1.5 ${
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
      </div>

      {/* List / Cards */}
      {filteredBooks.length === 0 ? (
        <div className="bg-white rounded-xl p-10 text-center border border-slate-200">
          <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium text-lg">
            {searchTerm || selectedMdtCode !== 'ALL' || selectedAuthor !== 'ALL'
              ? 'Žádné knihy neodpovídají zvolenému filtru.'
              : 'Zatím jste nenaskenovali žádné knihy.'}
          </p>
          <p className="text-slate-400 text-sm mt-1 mb-6">
            {searchTerm || selectedMdtCode !== 'ALL' || selectedAuthor !== 'ALL'
              ? 'Zkuste změnit vyhledávací dotaz, zvoleného autora nebo žánr.'
              : 'Připojte kameru na hlavní stránce a začněte skenovat!'}
          </p>
          {(searchTerm || selectedMdtCode !== 'ALL' || selectedAuthor !== 'ALL') ? (
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-lg font-medium transition"
            >
              <X className="w-4 h-4" /> Resetovat všechny filtry
            </button>
          ) : (
            <button
              onClick={onGoBack}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-lg font-medium transition"
            >
              <PlusCircle className="w-5 h-5" /> Naskenovat první knihu
            </button>
          )}
        </div>
      ) : isGroupedByAuthor ? (
        /* Grouped By Author View */
        <div className="space-y-8">
          {groupedBooks.map(([authorName, authorBookList]) => {
            const authorTotalCopies = authorBookList.reduce((sum, b) => sum + (b.count || 1), 0);
            return (
              <div key={authorName} className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg leading-tight">{authorName}</h3>
                      <p className="text-xs text-slate-500">
                        {authorBookList.length} {authorBookList.length === 1 ? 'titul' : authorBookList.length < 5 ? 'tituly' : 'titulů'} &bull; {authorTotalCopies} ks celkem
                      </p>
                    </div>
                  </div>
                  {selectedAuthor !== authorName && (
                    <button
                      onClick={() => handleSelectAuthor(authorName)}
                      className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold px-2.5 py-1 rounded-md bg-white border border-slate-200 hover:border-emerald-300 transition"
                    >
                      Pouze tento autor
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {authorBookList.map((book) => renderBookCard(book))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBooks.map((book) => renderBookCard(book))}
        </div>
      )}
    </div>
  );
}
