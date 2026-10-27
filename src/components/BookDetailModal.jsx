import React from 'react';
import { X, BookOpen, Calendar, Building, Hash, Tag, Globe, Bookmark } from 'lucide-react';
import { getMdtCategory } from '../services/mdtClassification';

export default function BookDetailModal({ book, onClose, onDelete }) {
  if (!book) return null;

  const mdtCategory = getMdtCategory(book);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200">

        {/* Header with MDT Accent border */}
        <div className="bg-slate-900 text-white p-4 flex justify-between items-center relative">
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
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
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
              <p className="text-base text-emerald-700 font-semibold">{book.authors || 'Neznámý autor'}</p>

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
              Naskenováno: {new Date(book.scannedAt).toLocaleString('cs-CZ')}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-between items-center">
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
