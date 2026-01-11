import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import PdfViewer from '../components/PdfViewer';

export default function WorkDetailPage() {
  const { id, token } = useParams();
  const { isAuthenticated, user } = useAuth();
  const { success, error } = useToast();
  const [work, setWork] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('description');
  const [userVote, setUserVote] = useState(0);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    fetchWork();
    if (id) fetchComments();
  }, [id, token]);

  const fetchWork = async () => {
    setLoading(true);
    try {
      const url = token ? `/api/works/share/${token}` : `/api/works/${id}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.success) {
        setWork(data.data);
        if (data.data.user_vote) setUserVote(data.data.user_vote);
      }
    } catch (err) {
      console.error('Failed to fetch work:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/works/${id}/comments`);
      const data = await response.json();
      if (data.success) setComments(data.data);
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    }
  };

  const handleVote = async (stars) => {
    if (!isAuthenticated) {
      error('Please log in to vote');
      return;
    }
    try {
      const response = await fetch(`/api/works/${id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ stars })
      });
      const data = await response.json();
      if (data.success) {
        setUserVote(stars);
        fetchWork(); // Refresh to get new average
        success('Vote submitted!');
      }
    } catch (err) {
      error('Failed to submit vote');
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const response = await fetch(`/api/works/${id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content: newComment })
      });
      const data = await response.json();
      if (data.success) {
        setNewComment('');
        fetchComments();
        success('Comment posted!');
      }
    } catch (err) {
      error('Failed to post comment');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!work) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Work Not Found</h1>
        <p className="text-muted-foreground">The work you're looking for doesn't exist or has been removed.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm mb-6" aria-label="Breadcrumb">
        <Link to="/" className="text-muted-foreground hover:text-foreground">
          Home
        </Link>
        <span className="text-muted-foreground">/</span>
        <Link to="/works" className="text-muted-foreground hover:text-foreground">
          Browse
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="text-foreground font-medium truncate max-w-[200px]">
          {work.title}
        </span>
      </nav>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* PDF Viewer */}
        <main className="flex-1">
          <div className="min-h-[500px] mb-6">
            <PdfViewer
              fileUrl={work.file_url}
              googleFileId={work.google_file_id}
            />
          </div>

          {/* Tabs */}
          <div className="border-b mb-6">
            <nav className="flex gap-4">
              {['description', 'comments', 'related'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-3 px-1 border-b-2 font-medium capitalize ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'description' && (
            <div className="prose max-w-none">
              <p>{work.description || 'No description provided.'}</p>
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="space-y-6">
              {isAuthenticated && (
                <form onSubmit={handleComment} className="space-y-4">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    className="w-full p-3 border rounded-lg resize-none h-24"
                    required
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                  >
                    Post Comment
                  </button>
                </form>
              )}
              <div className="space-y-4">
                {comments.length > 0 ? (
                  comments.map(comment => (
                    <div key={comment.id} className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">{comment.user_name}</span>
                        <span className="text-xs text-muted-foreground">{new Date(comment.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm">{comment.content}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">No comments yet. Be the first to comment!</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'related' && (
            <div className="text-center text-muted-foreground py-8">
              Related works will be shown here.
            </div>
          )}
        </main>

        {/* Sidebar */}
        <aside className="w-full lg:w-80 shrink-0">
          <div className="sticky top-24 space-y-6">
            {/* Work Info */}
            <div className="border rounded-lg p-4 space-y-4">
              <h1 className="text-xl font-bold">{work.title}</h1>
              <div className="space-y-2 text-sm">
                <p><span className="text-muted-foreground">Author:</span> {work.author_name}</p>
                <p><span className="text-muted-foreground">Category:</span> {work.category_name}</p>
                <p><span className="text-muted-foreground">Type:</span> {work.work_type_name}</p>
                <p><span className="text-muted-foreground">Year:</span> {work.academic_year}</p>
              </div>
              <div className="flex gap-4 text-sm text-muted-foreground">
                <span>{work.view_count} views</span>
                <span>{work.download_count} downloads</span>
              </div>
            </div>

            {/* Rating */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3">Rating</h3>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      onClick={() => handleVote(star)}
                      className={`w-6 h-6 ${star <= userVote ? 'text-yellow-400' : 'text-muted-foreground'}`}
                      aria-label={`Rate ${star} stars`}
                    >
                      <svg fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </button>
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  ({work.vote_count || 0} votes)
                </span>
              </div>
              <p className="text-2xl font-bold">{work.average_rating?.toFixed(1) || '0.0'}</p>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <button className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
                Download
              </button>
              <button className="w-full px-4 py-2 border rounded-lg hover:bg-accent">
                Share
              </button>
              {isAuthenticated && (
                <button className="w-full px-4 py-2 border rounded-lg hover:bg-accent">
                  Add to Favorites
                </button>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
