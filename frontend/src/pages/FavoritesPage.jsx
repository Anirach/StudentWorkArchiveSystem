import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      const response = await fetch('/api/works/favorites', { credentials: 'include' });
      const data = await response.json();
      if (data.success) setFavorites(data.data);
    } catch (error) {
      console.error('Failed to fetch favorites:', error);
    } finally {
      setLoading(false);
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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">My Favorites</h1>

      {favorites.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map(work => (
            <Link
              key={work.id}
              to={`/works/${work.id}`}
              className="group block border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
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
        <div className="text-center py-16">
          <svg className="w-16 h-16 mx-auto text-muted-foreground mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <h2 className="text-lg font-semibold mb-2">No favorites yet</h2>
          <p className="text-muted-foreground mb-4">Start browsing and add works to your favorites!</p>
          <Link to="/works" className="inline-flex px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
            Browse Works
          </Link>
        </div>
      )}
    </div>
  );
}
