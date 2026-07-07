import { useState } from 'react';
import { Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { searchPatients } from '../api/mock';

interface QuickSearchProps {
  variant?: 'card' | 'nav';
}

export default function QuickSearch({ variant = 'card' }: QuickSearchProps) {
  const [query, setQuery] = useState('');
  const results = searchPatients(query);

  if (variant === 'nav') {
    return (
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="이름, 차트번호, 전화번호 검색"
          className="w-52 pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary focus:bg-white"
        />
        {query && results.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white border border-gray-100 rounded-lg shadow-lg overflow-hidden min-w-[220px]">
            {results.map((p) => (
              <Link
                key={p.id}
                to={`/patient/${p.id}`}
                className="block px-3 py-2 text-sm hover:bg-gray-50 border-b border-gray-50 last:border-0"
                onClick={() => setQuery('')}
              >
                <span className="font-medium">{p.name}</span>
                <span className="text-gray-400 ml-2 text-xs">{p.chartNo}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-card shadow-card p-4">
      <h3 className="font-bold text-gray-900 text-sm mb-3">빠른 검색</h3>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="이름, 차트번호, 전화번호 검색"
          className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />
        {query && results.length > 0 && (
          <div className="mt-2 border border-gray-100 rounded-lg overflow-hidden">
            {results.map((p) => (
              <Link
                key={p.id}
                to={`/patient/${p.id}`}
                className="block px-3 py-2 text-sm hover:bg-gray-50 border-b border-gray-50 last:border-0"
              >
                <span className="font-medium">{p.name}</span>
                <span className="text-gray-400 ml-2 text-xs">{p.chartNo}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
