import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, BookOpen, Calendar, Building, Hash, ChevronRight, X } from 'lucide-react';
import { searchBooks } from '../services/bookApi';

export default function BookSearchInput({ onSelectBook, isLoadingGlobal }) {
  const [inputValue, setInputValue] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Debounced search when inputValue changes
  useEffect(() => {
    const trimmed = inputValue.trim();
    if (!trimmed || trimmed.length < 2) {
      setResults([]);
      setIsSearching(false);
      setIsOpen(false);
      return;
    }

    let isCurrent = true;
    setIsSearching(true);

    const timer = setTimeout(async () => {
      try {
        const books = await searchBooks(trimmed, { limit: 8 });
        if (isCurrent) {
          setResults(books);
          setIsOpen(true);
          setSelectedIndex(-1);
        }
      } catch (err) {
        if (isCurrent) {
          setResults([]);
        }
      } finally {
        if (isCurrent) {
          setIsSearching(false);
        }
      }
    }, 350);

    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [inputValue]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (book) => {
    setIsOpen(false);
    setInputValue('');
    setResults([]);
    onSelectBook(book);
  };

  const handleKeyDown = (e) => {
    if (!isOpen || results.length === 0) {
      if (e.key === 'Enter' && inputValue.trim()) {
        e.preventDefault();
        // If user presses enter without selecting from dropdown, trigger search/select
        setIsSearching(true);
        searchBooks(inputValue.trim(), { limit: 1 }).then((res) => {
          setIsSearching(false);
          if (res.length > 0) {
            handleSelect(res[0]);
          } else {
            onSelectBook({ queryOnly: inputValue.trim() });
            setInputValue('');
          }
        });
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < results.length) {
        handleSelect(results[selectedIndex]);
      } else if (results.length > 0) {
        handleSelect(results[0]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const clearInput = () => {
    setInputValue('');
    setResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          placeholder="Napište název knihy, jméno autora nebo zadejte ISBN..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          disabled={isLoadingGlobal}
          className="w-full pl-10 pr-10 py-3 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 focus:bg-white shadow-sm transition"
        />
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          {isSearching ? (
            <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </div>

        {inputValue && (
          <button
            type="button"
            onClick={clearInput}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition"
            title="Vymazat"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden max-h-96 overflow-y-auto">
          {results.length > 0 ? (
            <div className="divide-y divide-slate-100">
              <div className="px-3 py-2 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider flex justify-between items-center">
                <span>Nalezené tituly a vydání v databázi ({results.length})</span>
                <span className="text-[10px] text-emerald-600 font-normal">Kliknutím uložíte knihu</span>
              </div>
              {results.map((book, idx) => {
                const isSelected = selectedIndex === idx;
                return (
                  <div
                    key={book.id || idx}
                    onClick={() => handleSelect(book)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`p-3 flex items-start gap-3 cursor-pointer transition ${
                      isSelected ? 'bg-emerald-50/80 border-l-4 border-emerald-500' : 'hover:bg-slate-50'
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="w-12 h-16 bg-slate-100 rounded border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center relative">
                      {book.coverImage ? (
                        <img
                          src={book.coverImage}
                          alt={book.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div
                        className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-300"
                        style={{ display: book.coverImage ? 'none' : 'flex' }}
                      >
                        <BookOpen className="w-5 h-5 text-slate-300" />
                      </div>
                    </div>

                    {/* Book Information & Editions */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 leading-snug line-clamp-1">
                        {book.title}
                      </h4>
                      <p className="text-xs text-emerald-700 font-medium truncate mt-0.5">
                        {book.authors || 'Neznámý autor'}
                      </p>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px] text-slate-500">
                        {book.publishedDate && (
                          <span className="flex items-center gap-1 font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {book.publishedDate}
                          </span>
                        )}
                        {book.publisher && (
                          <span className="flex items-center gap-1 truncate max-w-[180px]">
                            <Building className="w-3 h-3 text-slate-400 flex-shrink-0" />
                            {book.publisher}
                          </span>
                        )}
                        {book.isbn && (
                          <span className="flex items-center gap-1 font-mono text-[10px] text-slate-400">
                            <Hash className="w-3 h-3 text-slate-300" />
                            {book.isbn}
                          </span>
                        )}
                      </div>

                      {book.source && (
                        <span className="inline-block mt-1 text-[10px] text-slate-400">
                          Zdroj: {book.source}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center self-center text-slate-300">
                      <ChevronRight className="w-5 h-5 group-hover:text-emerald-500" />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : isSearching ? (
            <div className="p-6 text-center text-slate-500 text-sm flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
              <span>Vyhledávám v knižní databázi...</span>
            </div>
          ) : inputValue.trim().length >= 2 ? (
            <div className="p-6 text-center text-slate-500 text-sm">
              <p className="font-medium text-slate-700">Kniha ani autor nebyli nalezeni</p>
              <p className="text-xs text-slate-400 mt-1">
                Zkuste upřesnit název, jméno autora nebo zkontrolovat překlepy.
              </p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
