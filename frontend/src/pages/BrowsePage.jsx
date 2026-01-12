import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { WorkTypeBadge } from '../components/WorkTypeIcon';
import PdfThumbnail from '../components/PdfThumbnail';

export default function BrowsePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [works, setWorks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('browseViewMode') || 'grid';
  });
  const [meta, setMeta] = useState({ page: 1, total_pages: 1, total: 0 });
  const [expandedCategories, setExpandedCategories] = useState(new Set());

  const currentPage = parseInt(searchParams.get('page') || '1');
  const searchQuery = searchParams.get('q') || '';
  const categoryFilter = searchParams.get('category') || '';
  const tagFilter = searchParams.get('tag') || '';
  const yearFilter = searchParams.get('year') || '';
  const sortBy = searchParams.get('sort') || 'date';

  const fetchWorks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Parse sort value to extract sort column and order
      let sortColumn = sortBy;
      let sortOrder = 'desc';
      if (sortBy === 'date_asc') {
        sortColumn = 'date';
        sortOrder = 'asc';
      }

      const params = new URLSearchParams({
        page: currentPage,
        sort: sortColumn,
        order: sortOrder,
        ...(searchQuery && { q: searchQuery }),
        ...(categoryFilter && { category_id: categoryFilter }),
        ...(tagFilter && { tag_id: tagFilter }),
        ...(yearFilter && { academic_year: yearFilter })
      });
      const response = await fetch(`/api/works?${params}`);
      const data = await response.json();
      if (data.success) {
        setWorks(data.data);
        if (data.meta) setMeta(data.meta);
      } else {
        setError('Failed to load works. Please try again.');
      }
    } catch (err) {
      console.error('Failed to fetch works:', err);
      setError('Unable to connect to the server. Please check your internet connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, sortBy, searchQuery, categoryFilter, tagFilter, yearFilter]);

  const fetchFilters = useCallback(async () => {
    try {
      const [catRes, tagRes, yearsRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/tags'),
        fetch('/api/works/years')
      ]);
      const [catData, tagData, yearsData] = await Promise.all([catRes.json(), tagRes.json(), yearsRes.json()]);
      if (catData.success) setCategories(catData.data);
      if (tagData.success) setTags(tagData.data);
      if (yearsData.success) setAcademicYears(yearsData.data);
    } catch (error) {
      console.error('Failed to fetch filters:', error);
    }
  }, []);

  // Fetch works whenever URL parameters change
  useEffect(() => {
    fetchWorks();
  }, [fetchWorks]);

  // Fetch filters on mount and when returning to this page
  useEffect(() => {
    fetchFilters();

    // Handle browser back/forward navigation and page visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchFilters();
        fetchWorks();
      }
    };

    const handlePopState = () => {
      fetchFilters();
      fetchWorks();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('popstate', handlePopState);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [fetchFilters, fetchWorks]);

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
      <h1 className="sr-only">Browse Works</h1>
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Filters */}
        <aside className="w-full lg:w-64 shrink-0">
          <div className="sticky top-24 space-y-6">
            <div>
              <h2 className="font-semibold mb-3">Categories</h2>
              <div className="space-y-1">
                {(() => {
                  // Build hierarchy
                  const parentCategories = categories.filter(c => !c.parent_id);
                  const childrenMap = {};
                  categories.forEach(c => {
                    if (c.parent_id) {
                      if (!childrenMap[c.parent_id]) childrenMap[c.parent_id] = [];
                      childrenMap[c.parent_id].push(c);
                    }
                  });

                  const toggleExpand = (catId) => {
                    const newExpanded = new Set(expandedCategories);
                    if (newExpanded.has(catId)) {
                      newExpanded.delete(catId);
                    } else {
                      newExpanded.add(catId);
                    }
                    setExpandedCategories(newExpanded);
                  };

                  const selectCategory = (catId) => {
                    searchParams.set('category', catId);
                    searchParams.set('page', '1');
                    setSearchParams(searchParams);
                  };

                  return parentCategories.map(cat => {
                    const children = childrenMap[cat.id] || [];
                    const hasChildren = children.length > 0;
                    const isExpanded = expandedCategories.has(cat.id);

                    return (
                      <div key={cat.id}>
                        <div className="flex items-center">
                          {hasChildren && (
                            <button
                              onClick={() => toggleExpand(cat.id)}
                              className="p-1 hover:bg-accent rounded mr-1"
                              aria-label={isExpanded ? 'Collapse' : 'Expand'}
                            >
                              <svg
                                className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          )}
                          {!hasChildren && <div className="w-5" />}
                          <button
                            onClick={() => selectCategory(cat.id)}
                            className={`flex-1 text-left px-2 py-1.5 rounded text-sm hover:bg-accent ${categoryFilter === String(cat.id) ? 'bg-primary text-primary-foreground' : ''}`}
                          >
                            {cat.name}
                          </button>
                        </div>
                        {/* Subcategories */}
                        {hasChildren && isExpanded && (
                          <div className="ml-5 mt-1 space-y-1 border-l pl-2">
                            {children.map(child => (
                              <button
                                key={child.id}
                                onClick={() => selectCategory(child.id)}
                                className={`block w-full text-left px-2 py-1.5 rounded text-sm hover:bg-accent ${categoryFilter === String(child.id) ? 'bg-primary text-primary-foreground' : ''}`}
                              >
                                {child.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
            <div>
              <h2 className="font-semibold mb-3">Tags</h2>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => {
                  // Check if this tag is in the selected tags (comma-separated)
                  const selectedTagIds = tagFilter ? tagFilter.split(',') : [];
                  const isSelected = selectedTagIds.includes(String(tag.id));

                  const toggleTag = () => {
                    let newTagIds;
                    if (isSelected) {
                      // Remove tag
                      newTagIds = selectedTagIds.filter(id => id !== String(tag.id));
                    } else {
                      // Add tag
                      newTagIds = [...selectedTagIds, String(tag.id)];
                    }

                    if (newTagIds.length > 0) {
                      searchParams.set('tag', newTagIds.join(','));
                    } else {
                      searchParams.delete('tag');
                    }
                    searchParams.set('page', '1');
                    setSearchParams(searchParams);
                  };

                  return (
                    <button
                      key={tag.id}
                      onClick={toggleTag}
                      className={`px-2 py-1 text-xs rounded-full border cursor-pointer hover:bg-accent ${isSelected ? 'bg-primary text-primary-foreground' : ''}`}
                      style={{ borderColor: tag.color }}
                    >
                      {tag.name}
                    </button>
                  );
                })}
              </div>
            </div>
            {academicYears.length > 0 && (
              <div>
                <h2 className="font-semibold mb-3">Academic Year</h2>
                <div className="space-y-2">
                  {academicYears.map(year => (
                    <button
                      key={year}
                      onClick={() => {
                        searchParams.set('year', year);
                        searchParams.set('page', '1');
                        setSearchParams(searchParams);
                      }}
                      className={`block w-full text-left px-3 py-2 rounded text-sm hover:bg-accent ${yearFilter === String(year) ? 'bg-primary text-primary-foreground' : ''}`}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              </div>
            )}
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
                <option value="date_asc">Oldest First</option>
                <option value="rating">Highest Rated</option>
                <option value="views">Most Viewed</option>
                <option value="downloads">Most Downloaded</option>
              </select>
              <div className="flex border rounded">
                <button
                  onClick={() => {
                    setViewMode('grid');
                    localStorage.setItem('browseViewMode', 'grid');
                  }}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-accent' : ''}`}
                  aria-label="Grid view"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => {
                    setViewMode('list');
                    localStorage.setItem('browseViewMode', 'list');
                  }}
                  className={`p-2 ${viewMode === 'list' ? 'bg-accent' : ''}`}
                  aria-label="List view"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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
          ) : error ? (
            <div className="text-center py-12 border rounded-lg bg-red-50" role="alert">
              <svg className="mx-auto h-12 w-12 text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-red-600 font-medium mb-2">Something went wrong</p>
              <p className="text-red-500 text-sm mb-4">{error}</p>
              <button
                onClick={fetchWorks}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
              >
                Try Again
              </button>
            </div>
          ) : works.length > 0 ? (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
              {works.map(work => (
                <Link
                  key={work.id}
                  to={`/works/${work.id}`}
                  className={`group block border rounded-lg overflow-hidden hover:shadow-lg transition-shadow ${viewMode === 'list' ? 'flex' : ''}`}
                >
                  <div className={`relative ${viewMode === 'grid' ? 'aspect-video' : 'w-48 h-32 shrink-0'}`}>
                    <PdfThumbnail
                      fileUrl={work.file_url}
                      googleFileId={work.google_file_id}
                      className="absolute inset-0"
                    />
                    {/* Work Type Badge - positioned in top right corner */}
                    {work.work_type_name && (
                      <div className="absolute top-2 right-2 z-10">
                        <WorkTypeBadge workType={work.work_type_name} className="bg-white/90 backdrop-blur-sm shadow-sm" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold group-hover:text-primary line-clamp-2">{work.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">{work.author_name}</p>
                    {/* Show work type badge below author if not shown on image (list view fallback) */}
                    {work.work_type_name && viewMode === 'list' && (
                      <div className="mt-1">
                        <WorkTypeBadge workType={work.work_type_name} />
                      </div>
                    )}
                    {work.avg_rating !== null && work.vote_count > 0 && (
                      <div className="flex items-center gap-1 mt-2">
                        <svg className="w-4 h-4 text-yellow-500 fill-current" viewBox="0 0 24 24">
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                        </svg>
                        <span className="text-sm font-medium">{work.avg_rating?.toFixed(1)}</span>
                        <span className="text-xs text-muted-foreground">({work.vote_count})</span>
                      </div>
                    )}
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
