import React, { useEffect, useState } from 'react';

export default function ThemeSelector() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <div className="theme-switcher">
      <select 
        value={theme} 
        onChange={(e) => setTheme(e.target.value)}
        style={{ padding: '5px', borderRadius: '4px' }}
      >
        <option value="light">Modo Claro</option>
        <option value="dark">Modo Escuro</option>
        <option value="ocean">Modo Oceano</option>
      </select>
    </div>
  );
}