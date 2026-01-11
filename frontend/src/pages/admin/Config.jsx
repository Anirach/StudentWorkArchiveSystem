import { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';

export default function AdminConfig() {
  const { success, error } = useToast();
  const [config, setConfig] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch('/admin/config', { credentials: 'include' });
      const data = await response.json();
      if (data.success) setConfig(data.data);
    } catch (err) {
      error('Failed to fetch configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/admin/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(config)
      });
      if (response.ok) {
        success('Configuration saved');
      }
    } catch (err) {
      error('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }));
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">System Configuration</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="space-y-8">
        {/* Site Settings */}
        <section className="border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Site Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Site Name</label>
              <input
                type="text"
                value={config.site_name || ''}
                onChange={(e) => updateConfig('site_name', e.target.value)}
                className="w-full max-w-md px-4 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Site Description</label>
              <textarea
                value={config.site_description || ''}
                onChange={(e) => updateConfig('site_description', e.target.value)}
                className="w-full max-w-md px-4 py-2 border rounded-lg resize-none h-24"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Items Per Page</label>
              <input
                type="number"
                value={config.items_per_page || 12}
                onChange={(e) => updateConfig('items_per_page', e.target.value)}
                className="w-32 px-4 py-2 border rounded-lg"
                min="1"
                max="100"
              />
            </div>
          </div>
        </section>

        {/* Google Drive Settings */}
        <section className="border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Google Drive Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Shared Drive ID</label>
              <input
                type="text"
                value={config.google_shared_drive_id || ''}
                onChange={(e) => updateConfig('google_shared_drive_id', e.target.value)}
                className="w-full max-w-md px-4 py-2 border rounded-lg font-mono text-sm"
                placeholder="Enter your Google Shared Drive ID"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Shared Drive URL</label>
              <input
                type="url"
                value={config.google_shared_drive_url || ''}
                onChange={(e) => updateConfig('google_shared_drive_url', e.target.value)}
                className="w-full max-w-md px-4 py-2 border rounded-lg"
                placeholder="https://drive.google.com/drive/folders/..."
              />
            </div>
          </div>
        </section>

        {/* Access Control */}
        <section className="border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Access Control</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Allowed Email Domain</label>
              <input
                type="text"
                value={config.allowed_domain || ''}
                onChange={(e) => updateConfig('allowed_domain', e.target.value)}
                className="w-full max-w-md px-4 py-2 border rounded-lg"
                placeholder="@example.com (leave empty for any domain)"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Restrict sign-in to users with this email domain
              </p>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="allow_guest_view"
                checked={config.allow_guest_view === 'true'}
                onChange={(e) => updateConfig('allow_guest_view', e.target.checked ? 'true' : 'false')}
                className="w-4 h-4 rounded"
              />
              <label htmlFor="allow_guest_view" className="text-sm">
                Allow guests to view public works without signing in
              </label>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="require_approval"
                checked={config.require_approval === 'true'}
                onChange={(e) => updateConfig('require_approval', e.target.checked ? 'true' : 'false')}
                className="w-4 h-4 rounded"
              />
              <label htmlFor="require_approval" className="text-sm">
                Require admin approval for new works
              </label>
            </div>
          </div>
        </section>

        {/* Email Settings */}
        <section className="border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Email Settings (SMTP)</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">SMTP Host</label>
                <input
                  type="text"
                  value={config.smtp_host || ''}
                  onChange={(e) => updateConfig('smtp_host', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="smtp.example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">SMTP Port</label>
                <input
                  type="number"
                  value={config.smtp_port || 587}
                  onChange={(e) => updateConfig('smtp_port', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">SMTP User</label>
                <input
                  type="text"
                  value={config.smtp_user || ''}
                  onChange={(e) => updateConfig('smtp_user', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">SMTP Password</label>
                <input
                  type="password"
                  value={config.smtp_pass || ''}
                  onChange={(e) => updateConfig('smtp_pass', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
