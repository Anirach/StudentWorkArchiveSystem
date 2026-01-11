// Work Type Icon component - displays icon based on work type name or icon property
export default function WorkTypeIcon({ workType, icon, className = "w-4 h-4" }) {
  // Determine which icon to show based on icon property or work type name
  const iconType = icon || getIconFromWorkType(workType);

  const icons = {
    // Folder icon for Projects
    folder: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
      </svg>
    ),
    // File-text icon for Reports
    'file-text': (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    // Book icon for Thesis
    book: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    // Presentation icon
    presentation: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
      </svg>
    ),
    // Default document icon
    default: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    )
  };

  return icons[iconType] || icons.default;
}

// Helper function to get icon from work type name
function getIconFromWorkType(workTypeName) {
  if (!workTypeName) return 'default';

  const name = workTypeName.toLowerCase();
  if (name.includes('project')) return 'folder';
  if (name.includes('report')) return 'file-text';
  if (name.includes('thesis')) return 'book';
  if (name.includes('presentation')) return 'presentation';
  return 'default';
}

// Badge component that shows both icon and type name
export function WorkTypeBadge({ workType, icon, showLabel = true, className = "" }) {
  if (!workType && !icon) return null;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded-full ${className}`}>
      <WorkTypeIcon workType={workType} icon={icon} className="w-3 h-3" />
      {showLabel && workType && <span>{workType}</span>}
    </span>
  );
}
