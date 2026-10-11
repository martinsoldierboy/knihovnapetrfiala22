import React from 'react';
import { X, BookOpen, Calendar, Building, Hash, Tag, Globe } from 'lucide-react';

export default function BookDetailModal({ book, onClose, onDelete }) {
  if (!book) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh] sm:max-h-[85vh]">

        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-4 flex justify-between items-center flex-shrink-0">
          <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-400" /> Detaily knihy
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition touch-manipulation"
            aria-label="Zavřít"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto flex-1">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-center sm:items-start">
            {/* Book Cover */}
            <div className="w-28 sm:w-32 h-40 sm:h-44 flex-shrink-0 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 shadow-sm flex items-center justify-center">
              {book.coverImage ? (
                <img
                  src={book.coverImage}
                  alt={book.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center p-3 text-slate-400 text-xs">
                  <BookOpen className="w-10 h-10 mx-auto mb-1 opacity-40" />
                  Obálka nedostupná
                </div>
              )}
            </div>

            {/* Main Info */}
            <div className="flex-1 text-center sm:text-left space-y-2 min-w-0">
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">{book.title}</h3>
              <p className="text-sm sm:text-base text-emerald-700 font-semibold">{book.authors || 'Neznámý autor'}</p>

              <div className="pt-2 text-xs sm:text-sm text-slate-600 space-y-1.5">
                {book.publisher && (
                  <div className="flex items-center gap-2 justify-center sm:justify-start">
                    <Building className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span className="truncate"><strong>Nakladatelství:</strong> {book.publisher}</span>
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
                    <span className="font-mono"><strong>ISBN / Kód:</strong> {book.isbn}</span>
                  </div>
                )}
                {book.categories && (
                  <div className="flex items-center gap-2 justify-center sm:justify-start">
                    <Tag className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span className="truncate"><strong>Kategorie:</strong> {book.categories}</span>
                  </div>
                )}
                {book.source && (
                  <div className="flex items-center gap-2 justify-center sm:justify-start text-xs text-slate-500 pt-1">
                    <Globe className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span>Zdroj dát: {book.source}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          {book.description && (
            <div className="bg-slate-50 p-3.5 sm:p-4 rounded-xl border border-slate-200">
              <h4 className="font-semibold text-slate-800 text-xs sm:text-sm mb-1">Popis / Anotace</h4>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                {book.description}
              </p>
            </div>
          )}

          {book.scannedAt && (
            <p className="text-[11px] text-slate-400 text-right">
              Naskenováno: {new Date(book.scannedAt).toLocaleString('cs-CZ')}
            </p>
          )}
        </div>

        {/* Modal Bottom Action Bar */}
        <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex justify-between items-center gap-3 flex-shrink-0">
          {onDelete && (
            <button
              onClick={() => onDelete(book.id)}
              className="text-red-600 hover:text-red-800 font-medium text-xs sm:text-sm px-3 py-2 rounded-lg hover:bg-red-50 transition touch-manipulation"
            >
              Odstranit z knihovny
            </button>
          )}
          <button
            onClick={onClose}
            className="bg-slate-800 active:bg-slate-900 text-white text-xs sm:text-sm font-bold px-6 py-2.5 rounded-xl transition ml-auto touch-manipulation"
          >
            Zavřít
          </button>
        </div>

      </div>
    </div>
  );
}
