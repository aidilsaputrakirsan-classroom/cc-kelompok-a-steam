import React from 'react'

function Spinner({ size = 40, color = "#2E75B6" }) {
  return (
    <div style={styles.container}>
      <div
        style={{
          ...styles.spinner,
          width: size,
          height: size,
          borderColor: color,
          borderTopColor: 'transparent',
        }}
      />
    </div>
  )
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '1rem',
  },
  spinner: {
    border: '4px solid',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
}

// CSS animation (akan ditambahkan ke global CSS atau inline)
const keyframes = `
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`

// Inject keyframes ke document head jika belum ada
if (typeof document !== 'undefined' && !document.getElementById('spinner-keyframes')) {
  const style = document.createElement('style')
  style.id = 'spinner-keyframes'
  style.textContent = keyframes
  document.head.appendChild(style)
}

export default Spinner