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
  const [isFavorited, setIsFavorited] = useState(false);
  const [relatedWorks, setRelatedWorks] = useState([]);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [replyingToId, setReplyingToId] = useState(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    fetchWork();
    if (id) {
      fetchComments();
      fetchRelatedWorks();
      recordView();
    }
  }, [id, token]);

  const fetchRelatedWorks = async () => {
    if (!id) return;
    try {
      const response = await fetch(`/api/works/${id}/related`);
      const data = await response.json();
      if (data.success) setRelatedWorks(data.data);
    } catch (err) {
      console.error('Failed to fetch related works:', err);
    }
  };

  const recordView = async () => {
    if (!id) return;
    try {
      await fetch(`/api/works/${id}/view`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (err) {
      // Silently fail - view recording is not critical
      console.error('Failed to record view:', err);
    }
  };

  const fetchWork = async () => {
    setLoading(true);
    try {
      const url = token ? `/api/works/share/${token}` : `/api/works/${id}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.success) {
        setWork(data.data);
        if (data.data.user_vote) setUserVote(data.data.user_vote);
        if (data.data.is_favorited) setIsFavorited(data.data.is_favorited);
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

  const handleEditComment = (comment) => {
    setEditingCommentId(comment.id);
    setEditCommentText(comment.content);
  };

  const handleUpdateComment = async (commentId) => {
    if (!editCommentText.trim()) return;
    try {
      const response = await fetch(`/api/works/comments/${commentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content: editCommentText })
      });
      const data = await response.json();
      if (data.success) {
        setEditingCommentId(null);
        setEditCommentText('');
        fetchComments();
        success('Comment updated!');
      }
    } catch (err) {
      error('Failed to update comment');
    }
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditCommentText('');
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    try {
      const response = await fetch(`/api/works/comments/${commentId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        fetchComments();
        success('Comment deleted!');
      }
    } catch (err) {
      error('Failed to delete comment');
    }
  };

  const handleReply = (commentId) => {
    setReplyingToId(commentId);
    setReplyText('');
  };

  const handleCancelReply = () => {
    setReplyingToId(null);
    setReplyText('');
  };

  const handleSubmitReply = async (parentId) => {
    if (!replyText.trim()) return;
    try {
      const response = await fetch(`/api/works/${id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content: replyText, parent_id: parentId })
      });
      const data = await response.json();
      if (data.success) {
        setReplyingToId(null);
        setReplyText('');
        fetchComments();
        success('Reply posted!');
      }
    } catch (err) {
      error('Failed to post reply');
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(`/api/works/${id}/download`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        // Open Google Drive file or direct URL
        const fileUrl = data.data.google_file_id
          ? `https://drive.google.com/file/d/${data.data.google_file_id}/view`
          : data.data.file_url;
        if (fileUrl) {
          window.open(fileUrl, '_blank');
        }
        // Refresh work to update download count
        fetchWork();
        success('Download started!');
      }
    } catch (err) {
      error('Failed to download file');
    }
  };

  const handleFavorite = async () => {
    if (!isAuthenticated) {
      error('Please log in to add favorites');
      return;
    }
    try {
      const method = isFavorited ? 'DELETE' : 'POST';
      const response = await fetch(`/api/works/${id}/favorite`, {
        method,
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setIsFavorited(!isFavorited);
        success(isFavorited ? 'Removed from favorites' : 'Added to favorites!');
      }
    } catch (err) {
      error('Failed to update favorites');
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
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{comment.user_name}</span>
                          <span className="text-xs text-muted-foreground">{new Date(comment.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex gap-2">
                          {isAuthenticated && (
                            <button
                              onClick={() => handleReply(comment.id)}
                              className="text-xs text-muted-foreground hover:text-foreground"
                            >
                              Reply
                            </button>
                          )}
                          {user && user.id === comment.user_id && (
                            <>
                              <button
                                onClick={() => handleEditComment(comment)}
                                className="text-xs text-muted-foreground hover:text-foreground"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                className="text-xs text-red-500 hover:text-red-700"
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      {editingCommentId === comment.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={editCommentText}
                            onChange={(e) => setEditCommentText(e.target.value)}
                            className="w-full p-2 border rounded-lg resize-none h-20 text-sm"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleUpdateComment(comment.id)}
                              className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90"
                            >
                              Save
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="px-3 py-1 text-sm border rounded hover:bg-accent"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm">{comment.content}</p>
                      )}

                      {/* Reply Form */}
                      {replyingToId === comment.id && (
                        <div className="mt-3 pl-4 border-l-2 border-muted space-y-2">
                          <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Write a reply..."
                            className="w-full p-2 border rounded-lg resize-none h-16 text-sm"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSubmitReply(comment.id)}
                              className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90"
                            >
                              Reply
                            </button>
                            <button
                              onClick={handleCancelReply}
                              className="px-3 py-1 text-sm border rounded hover:bg-accent"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Nested Replies */}
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="mt-3 pl-4 border-l-2 border-muted space-y-3">
                          {comment.replies.map(reply => (
                            <div key={reply.id} className="pt-3">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm">{reply.user_name}</span>
                                  <span className="text-xs text-muted-foreground">{new Date(reply.created_at).toLocaleDateString()}</span>
                                </div>
                                {user && user.id === reply.user_id && (
                                  <button
                                    onClick={() => handleDeleteComment(reply.id)}
                                    className="text-xs text-red-500 hover:text-red-700"
                                  >
                                    Delete
                                  </button>
                                )}
                              </div>
                              <p className="text-sm">{reply.content}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">No comments yet. Be the first to comment!</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'related' && (
            <div className="space-y-4">
              {relatedWorks.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {relatedWorks.map(relatedWork => (
                    <Link
                      key={relatedWork.id}
                      to={`/works/${relatedWork.id}`}
                      className="block border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <h4 className="font-medium line-clamp-2 mb-1">{relatedWork.title}</h4>
                      <p className="text-sm text-muted-foreground">{relatedWork.author_name}</p>
                      {relatedWork.category_name && (
                        <span className="inline-block mt-2 text-xs bg-muted px-2 py-1 rounded">
                          {relatedWork.category_name}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No related works found.</p>
              )}
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
              <p className="text-2xl font-bold">{work.avg_rating?.toFixed(1) || '0.0'}</p>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <button
                onClick={handleDownload}
                className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
              >
                Download
              </button>
              <button className="w-full px-4 py-2 border rounded-lg hover:bg-accent">
                Share
              </button>
              {isAuthenticated && (
                <button
                  onClick={handleFavorite}
                  className="w-full px-4 py-2 border rounded-lg hover:bg-accent"
                >
                  {isFavorited ? 'Remove from Favorites' : 'Add to Favorites'}
                </button>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
