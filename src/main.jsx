import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './styles/reset.css'
import './styles/variables.css'
import './styles/global.css'
import './styles/layout.css'
import './styles/components.css'

// 화면 폭 비율을 단위 없는 숫자로 계산해 CSS 변수로 넣습니다(구형 Safari는 calc(길이/길이) 미지원).
function updateViewportScale() {
  const w = window.innerWidth
  const root = document.documentElement.style
  root.setProperty('--k19', String(w / 1920)) // 1920px 상한 없음: 큰 화면에서도 히어로가 꽉 차게 비례 확대
  root.setProperty('--k11', String(Math.min(w, 1440) / 1100))
  root.setProperty('--m487', String(w / 487))
  root.setProperty('--u487', String(487 / w))
}
updateViewportScale()
window.addEventListener('resize', updateViewportScale)
window.addEventListener('orientationchange', updateViewportScale)

// 렌더 중 에러가 나면 React가 화면 전체를 비워서 "파란 빈 화면"만 남고 새로고침 전까지 안 풀립니다.
// 그 상황을 막기 위해: 에러 내용을 화면/콘솔에 보여주고, 처음 한 번은 자동으로 새로고침해서 복구합니다.
class RootErrorBoundary extends React.Component {
  state = { error: null }
  static getDerivedStateFromError(error) {
    return { error }
  }
  componentDidCatch(error, info) {
    console.error('[RootErrorBoundary]', error, info?.componentStack)
    document.getElementById('boot-loading')?.remove()
    try {
      if (!sessionStorage.getItem('rootErrorReloaded')) {
        sessionStorage.setItem('rootErrorReloaded', '1')
        window.location.reload()
      }
    } catch (e) {
      /* sessionStorage 사용 불가 — 무시 */
    }
  }
  render() {
    if (this.state.error) {
      return (
        <pre style={{ padding: 24, whiteSpace: 'pre-wrap', color: '#333', font: '14px monospace' }}>
          {String(this.state.error?.stack || this.state.error)}
        </pre>
      )
    }
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RootErrorBoundary>
      <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <App />
      </BrowserRouter>
    </RootErrorBoundary>
  </React.StrictMode>,
)
