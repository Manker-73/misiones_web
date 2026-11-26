import './style.css'

// ── Cambio de tema: el botón guarda la elección; sin elección se sigue al sistema ──
const root = document.documentElement
const toggle = document.querySelector('#theme-toggle')

function setTheme(theme) {
  root.classList.toggle('dark', theme === 'dark')
  localStorage.setItem('theme', theme)
  toggle?.setAttribute('aria-pressed', String(theme === 'dark'))
}

toggle?.addEventListener('click', () => {
  setTheme(root.classList.contains('dark') ? 'light' : 'dark')
})
