import React, { useContext } from 'react';
import { Switch } from 'antd';
import { ThemeContext } from '../utils/ThemeContext';

const DarkModeToggle = () => {
  const { theme, toggleTheme } = useContext(ThemeContext);

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
      <span>{theme === 'light' ? 'Light' : 'Dark'} Mode</span>
      <Switch
        checked={theme === 'dark'}
        onChange={toggleTheme}
        checkedChildren="Dark"
        unCheckedChildren="Light"
      />
    </div>
  );
};

export default DarkModeToggle;