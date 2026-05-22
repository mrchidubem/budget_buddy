/**
 * AuthLayout
 * Split layout for sign-in and registration — brand panel + form column.
 */

import React from 'react';

/**
 * @param {Object} props
 * @param {string} props.eyebrow
 * @param {string} props.title
 * @param {string} props.description
 * @param {string[]} props.bullets - Value propositions on brand panel
 * @param {React.ReactNode} props.children - Form component
 */
const AuthLayout = ({ eyebrow, title, description, bullets, children }) => {
  return (
    <div className="bb-app-canvas min-h-screen flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-[1100px] grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-stretch">
          <aside className="bb-auth-panel" aria-hidden="false">
            <div>
              <div className="flex items-center gap-3 mb-10">
                <div
                  className="w-10 h-10 rounded-[10px] bg-accent-600 flex items-center justify-center"
                  aria-hidden="true"
                >
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-2.21 0-4 1.79-4 4m8 0c0-2.21-1.79-4-4-4m0 8v4m-6 0h12" />
                  </svg>
                </div>
                <span className="text-lg font-semibold tracking-tight">Budget Buddy</span>
              </div>
              <p className="text-sm text-slate-400">{eyebrow}</p>
              <h1 className="mt-3 text-3xl font-semibold leading-snug text-white">{title}</h1>
              <p className="mt-4 text-sm text-slate-300 leading-relaxed max-w-md">{description}</p>
            </div>
            <ul className="mt-10 space-y-4 border-t border-white/10 pt-8">
              {bullets.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-slate-300">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-accent-500 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </aside>

          <div className="flex items-center justify-center lg:min-h-[560px]">
            <div className="bb-auth-form-wrap w-full">{children}</div>
          </div>
        </div>
      </div>

      <footer className="py-6 text-center text-xs text-[#6b7c8f]">
        © {new Date().getFullYear()} Budget Buddy. Personal finance management platform.
      </footer>
    </div>
  );
};

export default AuthLayout;
