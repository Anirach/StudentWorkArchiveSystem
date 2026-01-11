import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function HomePage() {
  const [featuredWorks, setFeaturedWorks] = useState([]);
  const [recentWorks, setRecentWorks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch data would go here
    setLoading(false);
  }, []);

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

      {/* Featured Works */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6">Featured Works</h2>
          {featuredWorks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredWorks.map(work => (
                <Link
                  key={work.id}
                  to={`/works/${work.id}`}
                  className="group block border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="aspect-video bg-muted"></div>
                  <div className="p-4">
                    <h3 className="font-semibold group-hover:text-primary">{work.title}</h3>
                    <p className="text-sm text-muted-foreground">{work.author_name}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>No featured works yet.</p>
            </div>
          )}
        </div>
      </section>

      {/* Recent Works */}
      <section className="py-12 bg-muted/30">
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
                  <div className="aspect-video bg-muted"></div>
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
