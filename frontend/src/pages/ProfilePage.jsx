import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('favorites');

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
        {activeTab === 'favorites' && (
          <div className="text-center text-muted-foreground py-12">
            <p>Your favorite works will appear here.</p>
          </div>
        )}
        {activeTab === 'votes' && (
          <div className="text-center text-muted-foreground py-12">
            <p>Works you've voted on will appear here.</p>
          </div>
        )}
        {activeTab === 'comments' && (
          <div className="text-center text-muted-foreground py-12">
            <p>Your comments will appear here.</p>
          </div>
        )}
      </div>

      {/* Notification Preferences */}
      <div className="mt-12 border-t pt-8">
        <h2 className="text-lg font-semibold mb-4">Notification Preferences</h2>
        <div className="space-y-4">
          <label className="flex items-center gap-3">
            <input type="checkbox" className="w-4 h-4 rounded" defaultChecked={user?.notify_new_works} />
            <span>Notify me about new works</span>
          </label>
          <label className="flex items-center gap-3">
            <input type="checkbox" className="w-4 h-4 rounded" defaultChecked={user?.notify_comments} />
            <span>Notify me about replies to my comments</span>
          </label>
        </div>
      </div>
    </div>
  );
}
