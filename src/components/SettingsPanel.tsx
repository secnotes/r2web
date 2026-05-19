import { useState } from 'react'
import { t, setLang, getLang } from '../lib/i18n'

interface SettingsPanelProps {
  onClose: () => void
}

export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const [theme, setTheme] = useState<'dark' | 'light'>(document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark')
  const [language, setLanguageState] = useState<'en' | 'zh'>(getLang())

  const applyTheme = (newTheme: 'dark' | 'light') => {
    setTheme(newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
    localStorage.setItem('r2web-theme', newTheme)
  }

  const applyLanguage = (newLang: 'en' | 'zh') => {
    setLanguageState(newLang)
    setLang(newLang)
    window.dispatchEvent(new CustomEvent('langchange'))
  }

  return (
    <div className="sp-overlay" onClick={onClose}>
      <div className="sp-panel" onClick={e => e.stopPropagation()}>
        <div className="sp-header">
          <h3>{t('settings')}</h3>
          <button className="sp-close" onClick={onClose}>×</button>
        </div>
        <div className="sp-content">
          <div className="sp-section">
            <label className="sp-label">{t('theme')}</label>
            <div className="sp-options">
              <button
                className={`sp-option ${theme === 'dark' ? 'sp-active' : ''}`}
                onClick={() => applyTheme('dark')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12,3A9,9 0 0,0 9,18A9,9 0 0,1 12,3M12,21A9,9 0 0,1 12,3A9,9 0 0,0 12,21Z"/>
                </svg>
                {t('dark')}
              </button>
              <button
                className={`sp-option ${theme === 'light' ? 'sp-active' : ''}`}
                onClick={() => applyTheme('light')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,2L14.39,5.42C13.65,5.15 12.84,5 12,5C11.16,5 10.35,5.15 9.61,5.42L12,2M3.34,7L7.5,6.65C6.9,7.16 6.36,7.78 5.94,8.5C5.5,9.24 5.25,10 5.11,10.79L3.34,7M3.36,17L5.12,13.23C5.26,14 5.53,14.78 5.95,15.5C6.37,16.24 6.91,16.86 7.5,17.37L3.36,17M20.65,7L18.88,10.79C18.74,10 18.47,9.23 18.05,8.5C17.63,7.77 17.1,7.15 16.5,6.64L20.65,7M20.64,17L16.5,17.36C17.09,16.85 17.62,16.23 18.04,15.5C18.46,14.77 18.73,14 18.87,13.21L20.64,17M12,22L9.59,18.56C10.33,18.83 11.14,19 12,19C12.82,19 13.63,18.83 14.37,18.56L12,22Z"/>
                </svg>
                {t('light')}
              </button>
            </div>
          </div>
          <div className="sp-section">
            <label className="sp-label">{t('language')}</label>
            <div className="sp-options">
              <button
                className={`sp-option ${language === 'en' ? 'sp-active' : ''}`}
                onClick={() => applyLanguage('en')}
              >
                {t('english')}
              </button>
              <button
                className={`sp-option ${language === 'zh' ? 'sp-active' : ''}`}
                onClick={() => applyLanguage('zh')}
              >
                {t('chinese')}
              </button>
            </div>
          </div>
        </div>
        <style>{`
          .sp-overlay {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
          }
          .sp-panel {
            background: var(--bg-secondary);
            border: 1px solid var(--border);
            border-radius: 8px;
            width: 320px;
            max-width: 90vw;
          }
          .sp-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 16px;
            border-bottom: 1px solid var(--border);
          }
          .sp-header h3 {
            color: var(--text-primary);
            font-size: 0.95rem;
            margin: 0;
          }
          .sp-close {
            background: none;
            border: none;
            color: var(--text-secondary);
            font-size: 1.2rem;
            cursor: pointer;
            padding: 4px;
          }
          .sp-close:hover { color: var(--text-primary); }
          .sp-content {
            padding: 16px;
          }
          .sp-section {
            margin-bottom: 16px;
          }
          .sp-section:last-child { margin-bottom: 0; }
          .sp-label {
            color: var(--text-secondary);
            font-size: 0.85rem;
            margin-bottom: 8px;
            display: block;
          }
          .sp-options {
            display: flex;
            gap: 8px;
          }
          .sp-option {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            padding: 8px 12px;
            background: var(--bg-tertiary);
            border: 1px solid var(--border);
            border-radius: 6px;
            color: var(--text-secondary);
            cursor: pointer;
            font-size: 0.85rem;
            transition: all 0.2s;
          }
          .sp-option:hover {
            background: var(--bg-primary);
            color: var(--text-primary);
          }
          .sp-active {
            border-color: var(--accent);
            color: var(--accent);
            background: rgba(137, 180, 250, 0.1);
          }
        `}</style>
      </div>
    </div>
  )
}