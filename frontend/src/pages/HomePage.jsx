import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import PdfThumbnail from '../components/PdfThumbnail';

export default function HomePage() {
  const [featuredWorks, setFeaturedWorks] = useState([]);
  const [recentWorks, setRecentWorks] = useState([]);
  const [topRatedWorks, setTopRatedWorks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const carouselRef = useRef(null);

  useEffect(() => {
    fetchCategories();
    fetchFeaturedWorks();
    fetchRecentWorks();
    fetchTopRatedWorks();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      if (data.success) setCategories(data.data || []);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const fetchFeaturedWorks = async () => {
    try {
      const response = await fetch('/api/works/featured');
      const data = await response.json();
      if (data.success) setFeaturedWorks(data.data || []);
    } catch (err) {
      console.error('Failed to fetch featured works:', err);
    }
  };

  const fetchRecentWorks = async () => {
    try {
      const response = await fetch('/api/works?limit=12&sort=date');
      const data = await response.json();
      if (data.success) setRecentWorks(data.data || []);
    } catch (err) {
      console.error('Failed to fetch recent works:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTopRatedWorks = async () => {
    try {
      const response = await fetch('/api/works?limit=8&sort=rating');
      const data = await response.json();
      // Filter to only show works that have at least one vote
      const ratedWorks = (data.data || []).filter(work => work.vote_count > 0);
      setTopRatedWorks(ratedWorks);
    } catch (err) {
      console.error('Failed to fetch top-rated works:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/10 to-background py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Student Work Archive
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Browse, view, and explore student projects, reports, theses, and presentations.
            Discover amazing works from our students.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              to="/works"
              className="inline-flex items-center px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90"
            >
              Browse Works
            </Link>
          </div>
        </div>
      </section>

      {/* Browse by Category */}
      {categories.length > 0 && (
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold mb-6">Browse by Category</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {categories.map(category => (
                <Link
                  key={category.id}
                  to={`/works?category=${category.id}`}
                  className="group block p-6 bg-background border rounded-lg hover:shadow-lg hover:border-primary transition-all text-center"
                >
                  <h3 className="font-semibold group-hover:text-primary">{category.name}</h3>
                  {category.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{category.description}</p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Works Carousel */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6">Featured Works</h2>
          {featuredWorks.length > 0 ? (
            <div className="relative">
              {/* Carousel Container */}
              <div
                ref={carouselRef}
                className="overflow-hidden"
              >
                <div
                  className="flex transition-transform duration-300 ease-in-out"
                  style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                >
                  {featuredWorks.map(work => (
                    <div key={work.id} className="w-full flex-shrink-0 px-2">
                      <Link
                        to={`/works/${work.id}`}
                        className="group block border rounded-lg overflow-hidden hover:shadow-lg transition-shadow bg-background"
                      >
                        <PdfThumbnail
                          fileUrl={work.file_url}
                          googleFileId={work.google_file_id}
                          className="aspect-video"
                        />
                        <div className="p-6">
                          <h3 className="text-xl font-semibold group-hover:text-primary">{work.title}</h3>
                          <p className="text-muted-foreground mt-1">{work.author_name}</p>
                          {work.description && (
                            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{work.description}</p>
                          )}
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>

              {/* Navigation Arrows */}
              {featuredWorks.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentSlide(prev => prev > 0 ? prev - 1 : featuredWorks.length - 1)}
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-background border rounded-full p-2 shadow-lg hover:bg-muted transition-colors"
                    aria-label="Previous slide"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setCurrentSlide(prev => prev < featuredWorks.length - 1 ? prev + 1 : 0)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-background border rounded-full p-2 shadow-lg hover:bg-muted transition-colors"
                    aria-label="Next slide"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}

              {/* Dot Indicators */}
              {featuredWorks.length > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  {featuredWorks.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSlide(index)}
                      className={`w-3 h-3 rounded-full transition-colors ${
                        currentSlide === index ? 'bg-primary' : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                      }`}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>No featured works yet.</p>
            </div>
          )}
        </div>
      </section>

      {/* Top-Rated Works */}
      {topRatedWorks.length > 0 && (
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold mb-6">Top-Rated Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {topRatedWorks.map(work => (
                <Link
                  key={work.id}
                  to={`/works/${work.id}`}
                  className="group block bg-background border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <PdfThumbnail
                    fileUrl={work.file_url}
                    googleFileId={work.google_file_id}
                    className="aspect-video"
                  />
                  <div className="p-4">
                    <h3 className="font-semibold group-hover:text-primary line-clamp-2">{work.title}</h3>
                    <p className="text-sm text-muted-foreground">{work.author_name}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center text-yellow-500">
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                        </svg>
                        <span className="ml-1 text-sm font-medium">{work.avg_rating?.toFixed(1) || '0.0'}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">({work.vote_count} votes)</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Recent Works */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6">Recent Works</h2>
          {recentWorks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {recentWorks.map(work => (
                <Link
                  key={work.id}
                  to={`/works/${work.id}`}
                  className="group block bg-background border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <PdfThumbnail
                    fileUrl={work.file_url}
                    googleFileId={work.google_file_id}
                    className="aspect-video"
                  />
                  <div className="p-4">
                    <h3 className="font-semibold group-hover:text-primary line-clamp-2">{work.title}</h3>
                    <p className="text-sm text-muted-foreground">{work.author_name}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>No works yet. Check back soon!</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
