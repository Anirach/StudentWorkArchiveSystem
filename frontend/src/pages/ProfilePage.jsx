import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('favorites');
  const [favorites, setFavorites] = useState([]);
  const [votes, setVotes] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Notification preferences state
  const [notifyNewWorks, setNotifyNewWorks] = useState(false);
  const [notifyComments, setNotifyComments] = useState(true);
  const [savingPrefs, setSavingPrefs] = useState(false);

  // Initialize preferences from user data
  useEffect(() => {
    if (user) {
      setNotifyNewWorks(!!user.notify_new_works);
      setNotifyComments(!!user.notify_comments);
    }
  }, [user]);

  useEffect(() => {
    fetchUserData();
  }, [activeTab]);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'favorites') {
        const response = await fetch('/api/works/favorites', { credentials: 'include' });
        const data = await response.json();
        if (data.success) setFavorites(data.data);
      } else if (activeTab === 'votes') {
        const response = await fetch('/api/works/user/votes', { credentials: 'include' });
        const data = await response.json();
        if (data.success) setVotes(data.data);
      } else if (activeTab === 'comments') {
        const response = await fetch('/api/works/user/comments', { credentials: 'include' });
        const data = await response.json();
        if (data.success) setComments(data.data);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-4 h-4 ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Profile Header */}
      <div className="flex items-center gap-4 mb-8">
        <img
          src={user?.avatar_url || '/default-avatar.png'}
          alt={user?.name}
          className="w-20 h-20 rounded-full"
        />
        <div>
          <h1 className="text-2xl font-bold">{user?.name}</h1>
          <p className="text-muted-foreground">{user?.email}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b mb-6">
        <nav className="flex gap-4">
          {['favorites', 'votes', 'comments'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 px-1 border-b-2 font-medium capitalize ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            >
              My {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {activeTab === 'favorites' && (
              <div>
                {favorites.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {favorites.map(work => (
                      <Link
                        key={work.id}
                        to={`/works/${work.id}`}
                        className="block border rounded-lg p-4 hover:shadow-lg transition-shadow"
                      >
                        <h3 className="font-semibold line-clamp-2 hover:text-primary">{work.title}</h3>
                        <p className="text-sm text-muted-foreground">{work.author_name}</p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <span>{work.category_name}</span>
                          {work.avg_rating && (
                            <span className="flex items-center">
                              <svg className="w-4 h-4 text-yellow-400 fill-yellow-400" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              {Number(work.avg_rating).toFixed(1)}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Added {formatDate(work.favorited_at)}
                        </p>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-12">
                    <svg className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <p>No favorite works yet.</p>
                    <Link to="/works" className="text-primary hover:underline text-sm mt-2 inline-block">
                      Browse works to add favorites
                    </Link>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'votes' && (
              <div>
                {votes.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {votes.map(work => (
                      <Link
                        key={work.id}
                        to={`/works/${work.id}`}
                        className="block border rounded-lg p-4 hover:shadow-lg transition-shadow"
                      >
                        <h3 className="font-semibold line-clamp-2 hover:text-primary">{work.title}</h3>
                        <p className="text-sm text-muted-foreground">{work.author_name}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-sm text-muted-foreground">Your rating:</span>
                          {renderStars(work.user_vote)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Rated {formatDate(work.voted_at)}
                        </p>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-12">
                    <svg className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    <p>No votes yet.</p>
                    <Link to="/works" className="text-primary hover:underline text-sm mt-2 inline-block">
                      Browse works to vote
                    </Link>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'comments' && (
              <div>
                {comments.length > 0 ? (
                  <div className="space-y-4">
                    {comments.map(comment => (
                      <div key={comment.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <Link
                            to={`/works/${comment.work_id}`}
                            className="font-semibold text-primary hover:underline"
                          >
                            {comment.work_title}
                          </Link>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(comment.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-foreground">{comment.content}</p>
                        {comment.parent_id && (
                          <span className="text-xs text-muted-foreground mt-2 inline-block">
                            (Reply to another comment)
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-12">
                    <svg className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <p>No comments yet.</p>
                    <Link to="/works" className="text-primary hover:underline text-sm mt-2 inline-block">
                      Browse works to leave comments
                    </Link>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Notification Preferences */}
      <div className="mt-12 border-t pt-8">
        <h2 className="text-lg font-semibold mb-4">Notification Preferences</h2>
        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
              checked={notifyNewWorks}
              onChange={(e) => setNotifyNewWorks(e.target.checked)}
            />
            <span>Notify me about new works</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
              checked={notifyComments}
              onChange={(e) => setNotifyComments(e.target.checked)}
            />
            <span>Notify me about replies to my comments</span>
          </label>
        </div>
        <button
          onClick={savePreferences}
          disabled={savingPrefs}
          className="mt-6 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
        >
          {savingPrefs && (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent"></div>
          )}
          {savingPrefs ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </div>
  );

  async function savePreferences() {
    setSavingPrefs(true);
    try {
      const response = await fetch('/auth/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          notify_new_works: notifyNewWorks,
          notify_comments: notifyComments
        })
      });

      const data = await response.json();

      if (data.success) {
        addToast('Preferences saved successfully', 'success');
        // Update user context with new preferences
        if (updateUser) {
          updateUser(data.data);
        }
      } else {
        addToast(data.error?.message || 'Failed to save preferences', 'error');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      addToast('Failed to save preferences', 'error');
    } finally {
      setSavingPrefs(false);
    }
  }
}
