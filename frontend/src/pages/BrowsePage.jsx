import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams, useLocation } from 'react-router-dom';

export default function BrowsePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const [works, setWorks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [meta, setMeta] = useState({ page: 1, total_pages: 1, total: 0 });

  const currentPage = parseInt(searchParams.get('page') || '1');
  const searchQuery = searchParams.get('q') || '';
  const categoryFilter = searchParams.get('category') || '';
  const sortBy = searchParams.get('sort') || 'date';

  const fetchWorks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage,
        sort: sortBy,
        ...(searchQuery && { q: searchQuery }),
        ...(categoryFilter && { category: categoryFilter })
      });
      const response = await fetch(`/api/works?${params}`);
      const data = await response.json();
      if (data.success) {
        setWorks(data.data);
        if (data.meta) setMeta(data.meta);
      }
    } catch (error) {
      console.error('Failed to fetch works:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, sortBy, searchQuery, categoryFilter]);

  // Fetch works whenever location changes (handles back button)
  useEffect(() => {
    fetchWorks();
  }, [location.key, fetchWorks]);

  useEffect(() => {
    fetchFilters();
  }, []);

  const fetchFilters = async () => {
    try {
      const [catRes, tagRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/tags')
      ]);
      const [catData, tagData] = await Promise.all([catRes.json(), tagRes.json()]);
      if (catData.success) setCategories(catData.data);
      if (tagData.success) setTags(tagData.data);
    } catch (error) {
      console.error('Failed to fetch filters:', error);
    }
  };

  const handleSort = (sort) => {
    searchParams.set('sort', sort);
    searchParams.set('page', '1');
    setSearchParams(searchParams);
  };

  const handleClearFilters = () => {
    setSearchParams({});
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Filters */}
        <aside className="w-full lg:w-64 shrink-0">
          <div className="sticky top-24 space-y-6">
            <div>
              <h3 className="font-semibold mb-3">Categories</h3>
              <div className="space-y-2">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      searchParams.set('category', cat.id);
                      searchParams.set('page', '1');
                      setSearchParams(searchParams);
                    }}
                    className={`block w-full text-left px-3 py-2 rounded text-sm hover:bg-accent ${categoryFilter === String(cat.id) ? 'bg-primary text-primary-foreground' : ''}`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <span
                    key={tag.id}
                    className="px-2 py-1 text-xs rounded-full border cursor-pointer hover:bg-accent"
                    style={{ borderColor: tag.color }}
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
            <button
              onClick={handleClearFilters}
              className="w-full px-4 py-2 border rounded text-sm hover:bg-accent"
            >
              Clear Filters
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          {/* Controls */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-muted-foreground">
              {meta.total} works found
            </p>
            <div className="flex items-center gap-4">
              <select
                value={sortBy}
                onChange={(e) => handleSort(e.target.value)}
                className="h-10 px-3 rounded border bg-background text-sm"
              >
                <option value="date">Newest First</option>
                <option value="rating">Highest Rated</option>
                <option value="views">Most Viewed</option>
                <option value="downloads">Most Downloaded</option>
              </select>
              <div className="flex border rounded">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-accent' : ''}`}
                  aria-label="Grid view"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-accent' : ''}`}
                  aria-label="List view"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Works Grid/List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : works.length > 0 ? (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
              {works.map(work => (
                <Link
                  key={work.id}
                  to={`/works/${work.id}`}
                  className={`group block border rounded-lg overflow-hidden hover:shadow-lg transition-shadow ${viewMode === 'list' ? 'flex' : ''}`}
                >
                  <div className={`bg-muted ${viewMode === 'grid' ? 'aspect-video' : 'w-48 h-32 shrink-0'}`}></div>
                  <div className="p-4">
                    <h3 className="font-semibold group-hover:text-primary line-clamp-2">{work.title}</h3>
                    <p className="text-sm text-muted-foreground">{work.author_name}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>{work.view_count} views</span>
                      <span>{work.download_count} downloads</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No works found matching your criteria.</p>
              <button onClick={handleClearFilters} className="text-primary hover:underline">
                Clear filters and try again
              </button>
            </div>
          )}

          {/* Pagination */}
          {meta.total_pages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: meta.total_pages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => {
                    searchParams.set('page', String(page));
                    setSearchParams(searchParams);
                  }}
                  className={`w-10 h-10 rounded ${page === currentPage ? 'bg-primary text-primary-foreground' : 'border hover:bg-accent'}`}
                >
                  {page}
                </button>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
