import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { usePersona } from '../hooks/usePersona';
import PersonaCard from '../components/PersonaCard';
import { MagnifyingGlassIcon } from '@heroicons/react/24/solid';

export default function PersonasPage() {
  const { personas, loading, fetchPersonas } = usePersona();
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('elo_rating');
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadPersonas();
  }, [sortBy, page]);

  const loadPersonas = () => {
    fetchPersonas({
      search,
      sortBy,
      page,
      limit: 12
    });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    loadPersonas();
  };

  return (
    <div className="min-h-screen pt-32 pb-20 px-4">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-12">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="cosmic-text text-5xl font-black mb-4"
        >
          🎭 All Personas
        </motion.h1>
        <p className="text-xl" style={{ color: '#cbd5e1' }}>
          Discover AI personas created by the community
        </p>

        {/* Search & Filters */}
        <div className="mt-8 flex flex-col md:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search personas..."
                className="cosmic-input pr-12"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all"
                style={{
                  background: 'linear-gradient(135deg, #ff00ff, #a020f0)',
                  border: 'none'
                }}
              >
                <MagnifyingGlassIcon className="w-5 h-5 text-white" />
              </button>
            </div>
          </form>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="cosmic-input md:w-48"
          >
            <option value="elo_rating">Top Rated</option>
            <option value="created_at">Newest</option>
            <option value="total_battles">Most Battles</option>
            <option value="total_chats">Most Chats</option>
          </select>
        </div>
      </div>

      {/* Personas Grid */}
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="cosmic-spinner" />
          </div>
        ) : personas.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-xl" style={{ color: '#888' }}>
              No personas found
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {personas.map((persona, index) => (
                <motion.div
                  key={persona.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <PersonaCard persona={persona} />
                </motion.div>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex justify-center gap-4 mt-12">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="neon-btn"
                style={{
                  opacity: page === 1 ? 0.5 : 1,
                  cursor: page === 1 ? 'not-allowed' : 'pointer'
                }}
              >
                ← Previous
              </button>

              <div className="flex items-center px-4 py-2 rounded-lg"
                   style={{
                     background: 'rgba(255, 0, 255, 0.1)',
                     border: '2px solid rgba(255, 0, 255, 0.3)'
                   }}>
                <span className="cosmic-text font-bold">
                  Page {page}
                </span>
              </div>

              <button
                onClick={() => setPage(p => p + 1)}
                disabled={personas.length < 12}
                className="neon-btn"
                style={{
                  opacity: personas.length < 12 ? 0.5 : 1,
                  cursor: personas.length < 12 ? 'not-allowed' : 'pointer'
                }}
              >
                Next →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
