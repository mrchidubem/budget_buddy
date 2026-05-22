/**
 * PageHeader
 * Consistent page title block used across authenticated routes.
 */

import React from 'react';

/**
 * @param {Object} props
 * @param {string} props.eyebrow - Short context label (e.g. module name)
 * @param {string} props.title - Primary heading
 * @param {string} [props.description] - Supporting copy
 * @param {React.ReactNode} [props.actions] - Right-aligned CTAs (buttons)
 */
const PageHeader = ({ eyebrow, title, description, actions }) => {
  return (
    <header className="bb-card p-6 sm:p-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
      <div>
        {eyebrow && <p className="bb-eyebrow">{eyebrow}</p>}
        <h1 className={`bb-page-title ${eyebrow ? 'mt-1' : ''}`}>{title}</h1>
        {description && <p className="bb-page-desc">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
    </header>
  );
};

export default PageHeader;
