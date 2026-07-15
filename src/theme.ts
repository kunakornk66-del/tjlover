export type ThemeName = 'pastel-pink' | 'soft-blue' | 'warm-lavender';

export const applyTheme = (theme: string) => {
  if (typeof window === 'undefined') return;
  
  let styleEl = document.getElementById('dynamic-theme-overrides');
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'dynamic-theme-overrides';
    document.head.appendChild(styleEl);
  }

  if (theme === 'pastel-pink' || !theme) {
    styleEl.innerHTML = '';
    document.documentElement.style.removeProperty('--color-brand-pink');
    document.documentElement.style.removeProperty('--color-brand-soft');
    document.documentElement.style.removeProperty('--color-brand-peach');
    document.documentElement.style.removeProperty('--color-brand-cream');
    document.documentElement.style.removeProperty('--color-brand-light');
    return;
  }

  let pinkColor = '';
  let lightPinkColor = '';
  let softColor = '';
  let peachColor = '';
  let creamColor = '';

  if (theme === 'soft-blue') {
    pinkColor = '#8CC0DE'; // Soft sky blue
    lightPinkColor = '#F0F8FF'; // Alice blue
    softColor = '#D2E6F1'; // Ice blue
    peachColor = '#D0E1FD'; // Very soft blue gray
    creamColor = '#F5FAFF'; // Pale sky white
  } else if (theme === 'warm-lavender') {
    pinkColor = '#BA94EB'; // Warm Lavender
    lightPinkColor = '#FAF5FF'; // Lavender blush / pale lavender
    softColor = '#E2D5F8'; // Soft lilac
    peachColor = '#E5DCEF'; // Lavender grey border
    creamColor = '#F9F6FF'; // Pale cream lavender
  }

  // Set the CSS Custom Properties on the root html element so any variables reference updates
  document.documentElement.style.setProperty('--color-brand-pink', pinkColor);
  document.documentElement.style.setProperty('--color-brand-soft', softColor);
  document.documentElement.style.setProperty('--color-brand-peach', peachColor);
  document.documentElement.style.setProperty('--color-brand-cream', creamColor);
  document.documentElement.style.setProperty('--color-brand-light', lightPinkColor);

  // Inject a complete dynamic CSS overrides template targeting all compiled Tailwind arbitrary class rules
  styleEl.innerHTML = `
    /* Override arbitrary pink texts and backgrounds */
    .text-\\[\\#FF8E8E\\] { color: ${pinkColor} !important; }
    .bg-\\[\\#FF8E8E\\] { background-color: ${pinkColor} !important; }
    .border-\\[\\#FF8E8E\\] { border-color: ${pinkColor} !important; }
    .hover\\:bg-\\[\\#FF8E8E\\]:hover { background-color: ${pinkColor} !important; }
    .from-\\[\\#FF8E8E\\] { --tw-gradient-from: ${pinkColor} !important; --tw-gradient-to: ${pinkColor}00 !important; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to) !important; }
    .to-\\[\\#FF8E8E\\] { --tw-gradient-to: ${pinkColor} !important; }

    /* Medium pinks/accents */
    .text-\\[\\#FFD6D6\\] { color: ${softColor} !important; }
    .bg-\\[\\#FFD6D6\\] { background-color: ${softColor} !important; }
    .border-\\[\\#FFD6D6\\] { border-color: ${softColor} !important; }
    .bg-\\[\\#FFD5D5\\] { background-color: ${softColor} !important; }
    .border-\\[\\#FFD9D9\\] { border-color: ${softColor} !important; }
    .bg-\\[\\#FFF3F3\\] { background-color: ${lightPinkColor} !important; }
    .bg-\\[\\#FFF5F0\\] { background-color: ${lightPinkColor} !important; }
    .bg-\\[\\#FFE3E3\\] { background-color: ${softColor} !important; }
    .bg-\\[\\#FFE6E6\\] { background-color: ${softColor} !important; }

    /* Light pinks/soft bg */
    .bg-\\[\\#FFEFEF\\] { background-color: ${lightPinkColor} !important; }
    .border-\\[\\#FFEFEF\\] { border-color: ${lightPinkColor} !important; }
    .hover\\:bg-\\[\\#FFEFEF\\]:hover { background-color: ${lightPinkColor} !important; }
    .hover\\:text-\\[\\#FFEFEF\\]:hover { color: ${lightPinkColor} !important; }

    /* Cream/Warm white */
    .bg-\\[\\#FFF9F5\\] { background-color: ${creamColor} !important; }
    .border-\\[\\#FFF9F5\\] { border-color: ${creamColor} !important; }
    .bg-\\[\\#FFFBF9\\] { background-color: ${creamColor} !important; }
    .bg-\\[\\#FFFDFB\\] { background-color: ${creamColor} !important; }
    .bg-\\[\\#FFFDF9\\] { background-color: ${creamColor} !important; }
    .bg-\\[\\#FFFDF6\\] { background-color: ${creamColor} !important; }
    .border-brand-cream { border-color: ${creamColor} !important; }

    /* Sand/Peach borders */
    .border-\\[\\#F0E6DD\\] { border-color: ${peachColor} !important; }
    .border-brand-peach { border-color: ${peachColor} !important; }
    .bg-\\[\\#FAF8F5\\] { background-color: ${creamColor} !important; }
  `;
};
