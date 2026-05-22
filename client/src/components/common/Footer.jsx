/**
 * Footer
 * Minimal legal strip for desktop layouts (hidden on mobile when BottomNav is active).
 */

import React from 'react';

const Footer = () => (
  <footer className="border-t border-[#dce3ed] bg-white">
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:justify-between gap-1 text-xs text-[#6b7c8f]">
      <span className="font-medium text-[#3d4f63]">Budget Buddy</span>
      <span>Secure personal finance · {new Date().getFullYear()}</span>
    </div>
  </footer>
);

export default Footer;
