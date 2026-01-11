import { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';

export default function AdminTags() {
  const { success, error } = useToast();
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTag, setNewTag] = useState({ name: '', color: '#6B7280' });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      const response = await fetch('/api/tags', { credentials: 'include' });
      const data = await response.json();
      if (data.success) setTags(data.data);
    } catch (err) {
      error('Failed to fetch tags');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newTag.name.trim()) return;
    try {
      const response = await fetch('/api/admin/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newTag)
      });
      if (response.ok) {
        success('Tag created');
        setNewTag({ name: '', color: '#6B7280' });
        fetchTags();
      }
    } catch (err) {
      error('Failed to create tag');
    }
  };

  const handleUpdate = async (id, data) => {
    try {
      const response = await fetch(`/api/admin/tags/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      if (response.ok) {
        success('Tag updated');
        setEditingId(null);
        fetchTags();
      }
    } catch (err) {
      error('Failed to update tag');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this tag?')) return;
    try {
      const response = await fetch(`/api/admin/tags/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (response.ok) {
        success('Tag deleted');
        fetchTags();
      }
    } catch (err) {
      error('Failed to delete tag');
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
      <h1 className="text-2xl font-bold mb-6">Manage Tags</h1>

      {/* Add Tag */}
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          placeholder="New tag name"
          value={newTag.name}
          onChange={(e) => setNewTag({ ...newTag, name: e.target.value })}
          className="flex-1 max-w-md px-4 py-2 border rounded-lg"
        />
        <input
          type="color"
          value={newTag.color}
          onChange={(e) => setNewTag({ ...newTag, color: e.target.value })}
          className="w-12 h-10 p-1 border rounded-lg cursor-pointer"
          title="Pick a color"
        />
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
        >
          Add Tag
        </button>
      </div>

      {/* Tags Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tags.length > 0 ? (
          tags.map(tag => (
            <div key={tag.id} className="border rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <span
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: tag.color }}
                />
                {editingId === tag.id ? (
                  <input
                    type="text"
                    defaultValue={tag.name}
                    className="flex-1 px-2 py-1 border rounded"
                    id={`tag-name-${tag.id}`}
                  />
                ) : (
                  <span className="font-medium">{tag.name}</span>
                )}
              </div>
              {editingId === tag.id && (
                <div className="flex items-center gap-2 mb-3">
                  <label className="text-sm text-muted-foreground">Color:</label>
                  <input
                    type="color"
                    defaultValue={tag.color}
                    className="w-8 h-8 p-0 border rounded cursor-pointer"
                    id={`tag-color-${tag.id}`}
                  />
                </div>
              )}
              <div className="flex gap-2">
                {editingId === tag.id ? (
                  <>
                    <button
                      onClick={() => {
                        const name = document.getElementById(`tag-name-${tag.id}`).value;
                        const color = document.getElementById(`tag-color-${tag.id}`).value;
                        handleUpdate(tag.id, { name, color });
                      }}
                      className="px-2 py-1 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-2 py-1 text-sm border rounded hover:bg-accent"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setEditingId(tag.id)}
                      className="px-2 py-1 text-sm border rounded hover:bg-accent"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(tag.id)}
                      className="px-2 py-1 text-sm border border-red-200 text-red-600 rounded hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-8 text-muted-foreground border rounded-lg">
            No tags yet. Add one above!
          </div>
        )}
      </div>
    </div>
  );
}
