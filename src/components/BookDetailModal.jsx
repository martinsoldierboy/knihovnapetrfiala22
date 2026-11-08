import React from 'react';
import { X, BookOpen, Calendar, Building, Hash, Tag, Globe, Bookmark, Copy, Plus, Minus, ExternalLink, User, Users } from 'lucide-react';
import { getMdtCategory } from '../services/mdtClassification';
import { extractIndividualAuthors } from '../services/bookApi';
import { changeBookCount } from '../services/storage';

export default function BookDetailModal({ book, onClose, onDelete, onRefresh, onFilterByAuthor }) {
  if (!book) return null;

  const mdtCategory = getMdtCategory(book);
  const bookCount = book.count || 1;
  const individualAuthors = extractIndividualAuthors(book.authors);

  const handleAdjustCount = (delta) => {
    changeBookCount(book.id, delta);
    if (onRefresh) onRefresh();
  };

  const handleAuthorClick = (authorName) => {
    if (onFilterByAuthor) {
      onFilterByAuthor(authorName);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">

        {/* Header with MDT Accent border */}
        <div className="bg-slate-900 text-white p-4 flex justify-between items-center relative flex-shrink-0">
          <div
            className="absolute top-0 left-0 right-0 h-1"
            style={{ backgroundColor: mdtCategory.hex }}
          ></div>
          <h2 className="text-lg font-bold flex items-center gap-2 pt-1">
            <BookOpen className="w-5 h-5 text-emerald-400" /> Detaily knihy
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-slate-800 text-slate-300 hover:text-white transition"
            aria-label="Zavřít"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
            {/* Book Cover */}
            <div className="w-32 h-44 flex-shrink-0 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 shadow-sm flex items-center justify-center relative">
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
                className="text-center p-3 text-slate-400 text-xs w-full h-full flex flex-col items-center justify-center bg-slate-50"
                style={{ display: book.coverImage ? 'none' : 'flex' }}
              >
                <BookOpen className="w-10 h-10 mx-auto mb-1 opacity-40" />
                Obálka nedostupná
              </div>
              {bookCount > 1 && (
                <span className="absolute top-1 left-1 bg-amber-500 text-white text-xs font-black px-2 py-0.5 rounded shadow">
                  {bookCount}×
                </span>
              )}
            </div>

            {/* Main Info */}
            <div className="flex-1 text-center sm:text-left space-y-2">
              {/* MDT Genre Tag */}
              <div>
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-md border ${mdtCategory.badgeBg}`}
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  MDT Třída {mdtCategory.code}: {mdtCategory.name}
                </span>
              </div>

              <h3 className="text-xl font-bold text-slate-900 leading-tight">{book.title}</h3>

              {/* Clickable Author or Authors */}
              <div className="flex flex-wrap items-center gap-1.5 text-sm text-emerald-700 font-semibold">
                <User className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                {individualAuthors.map((author, idx) => (
                  <span key={author} className="inline-flex items-center">
                    <button
                      type="button"
                      onClick={() => handleAuthorClick(author)}
                      className="hover:underline hover:text-emerald-900 text-left font-bold"
                      title={`Zobrazit všechny knihy autora: ${author}`}
                    >
                      {author}
                    </button>
                    {idx < individualAuthors.length - 1 && <span className="mr-1">,</span>}
                  </span>
                ))}
              </div>

              {/* Duplicate / Count Bar */}
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-700">
                  <Copy className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold">Počet kusů v knihovně:</span>
                  <span className={`font-bold px-2 py-0.5 rounded text-xs ${bookCount > 1 ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-800'}`}>
                    {bookCount} {bookCount === 1 ? 'kus' : bookCount < 5 ? 'kusy' : 'kusů'}
                  </span>
                </div>
                <div className="flex items-center gap-1 bg-white border border-slate-300 rounded p-0.5 shadow-xs">
                  <button
                    type="button"
                    onClick={() => handleAdjustCount(-1)}
                    disabled={bookCount <= 1}
                    className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 text-slate-600 hover:text-slate-900"
                    title="Odebrat kus"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-1.5 font-bold text-xs">{bookCount}</span>
                  <button
                    type="button"
                    onClick={() => handleAdjustCount(1)}
                    className="p-1 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900"
                    title="Přidat další kus"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="pt-2 text-sm text-slate-600 space-y-1.5">
                {book.publisher && (
                  <div className="flex items-center gap-2 justify-center sm:justify-start">
                    <Building className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span><strong>Nakladatelství:</strong> {book.publisher}</span>
                  </div>
                )}
                {book.publishedDate && (
                  <div className="flex items-center gap-2 justify-center sm:justify-start">
                    <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span><strong>Rok vydání:</strong> {book.publishedDate}</span>
                  </div>
                )}
                {book.isbn && (
                  <div className="flex items-center gap-2 justify-center sm:justify-start">
                    <Hash className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span><strong>ISBN / Kód:</strong> {book.isbn}</span>
                  </div>
                )}
                {book.categories && (
                  <div className="flex items-center gap-2 justify-center sm:justify-start">
                    <Tag className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span><strong>Kategorie:</strong> {book.categories}</span>
                  </div>
                )}
                {book.source && (
                  <div className="flex items-center gap-2 justify-center sm:justify-start text-xs text-slate-500 pt-1">
                    <Globe className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span>Zdroj dat: {book.source}</span>
                  </div>
                )}
                {(book.obalkyKnihUrl || (book.coverImage && book.coverImage.includes('obalkyknih.cz'))) && (
                  <div className="flex items-center gap-2 justify-center sm:justify-start text-xs text-slate-500 pt-0.5">
                    <ExternalLink className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span>
                      Obálka:{' '}
                      <a
                        href={book.obalkyKnihUrl || `https://www.obalkyknih.cz/view?isbn=${book.isbn}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-700 hover:text-emerald-800 underline font-medium"
                      >
                        ObálkyKnih.cz
                      </a>
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          {book.description && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h4 className="font-semibold text-slate-800 text-sm mb-1">Popis / Anotace</h4>
              <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
                {book.description}
              </p>
            </div>
          )}

          {book.scannedAt && (
            <p className="text-xs text-slate-400 text-right">
              Poslední skenování: {new Date(book.scannedAt).toLocaleString('cs-CZ')}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-between items-center flex-shrink-0">
          {onDelete && (
            <button
              onClick={() => onDelete(book.id)}
              className="text-red-600 hover:text-red-800 font-medium text-sm px-3 py-1.5 rounded hover:bg-red-50 transition"
            >
              Odstranit z databáze
            </button>
          )}
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition ml-auto"
          >
            Zavřít
          </button>
        </div>

      </div>
    </div>
  );
}
