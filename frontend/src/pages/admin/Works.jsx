import { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';

export default function AdminWorks() {
  const { success, error } = useToast();
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingWork, setEditingWork] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchWorks();
  }, []);

  const fetchWorks = async () => {
    try {
      const response = await fetch('/api/works?all=true', { credentials: 'include' });
      const data = await response.json();
      if (data.success) setWorks(data.data);
    } catch (err) {
      error('Failed to fetch works');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this work?')) return;
    try {
      const response = await fetch(`/admin/works/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (response.ok) {
        success('Work deleted successfully');
        fetchWorks();
      }
    } catch (err) {
      error('Failed to delete work');
    }
  };

  const handleFeature = async (id) => {
    try {
      const response = await fetch(`/admin/works/${id}/feature`, {
        method: 'POST',
        credentials: 'include'
      });
      if (response.ok) {
        success('Work featured status updated');
        fetchWorks();
      }
    } catch (err) {
      error('Failed to update featured status');
    }
  };

  const filteredWorks = works.filter(work =>
    work.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    work.author_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Works</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            Add Work
          </button>
          <button className="px-4 py-2 border rounded-lg hover:bg-accent">
            Import from Drive
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="search"
          placeholder="Search works..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full max-w-md px-4 py-2 border rounded-lg"
        />
      </div>

      {/* Works Table */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Title</th>
              <th className="text-left px-4 py-3 font-medium">Author</th>
              <th className="text-left px-4 py-3 font-medium">Category</th>
              <th className="text-left px-4 py-3 font-medium">Views</th>
              <th className="text-left px-4 py-3 font-medium">Featured</th>
              <th className="text-left px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredWorks.length > 0 ? (
              filteredWorks.map(work => (
                <tr key={work.id} className="border-t">
                  <td className="px-4 py-3">
                    <div className="font-medium line-clamp-1">{work.title}</div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{work.author_name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{work.category_name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{work.view_count}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleFeature(work.id)}
                      className={`px-2 py-1 rounded text-xs ${work.is_featured ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'}`}
                    >
                      {work.is_featured ? 'Featured' : 'Not Featured'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingWork(work)}
                        className="px-2 py-1 text-sm border rounded hover:bg-accent"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(work.id)}
                        className="px-2 py-1 text-sm border border-red-200 text-red-600 rounded hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No works found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Form Modal - placeholder */}
      {(showForm || editingWork) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingWork ? 'Edit Work' : 'Add Work'}
            </h2>
            <p className="text-muted-foreground mb-4">Work form will be implemented here</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setShowForm(false); setEditingWork(null); }}
                className="px-4 py-2 border rounded-lg hover:bg-accent"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
