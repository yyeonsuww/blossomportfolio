import { useEffect, useState } from 'react'
import '../componentsStyle/project-summary-section.css'

function MetaItem({ label, children }) {
  return <div className="project-summary__meta"><p className="project-summary__label">{label}</p><div className="project-summary__value">{children}</div></div>
}

export default function ProjectSummarySection({
  duration = '8주',
  overview = '티켓 중고 거래 사기는 지나간 공연 경험을 환불로도 되돌릴 수 없어 거래 전 예방이 더욱 중요합니다. 하지만 사기 발생이 높은  X(트위터)에서 실시간 매물과 팬덤 접근성 때문에 티켓 거래가 계속되고 있습니다. 이에 익숙한 거래 환경은 유지하면서 AI 이미지 검증을 통해 티켓 사기를 예방하는 서비스를 설계했습니다.',
  projectType = '1인 프로젝트',
  property1 = 'Desktop',
  role = '리서치,\nUIUX디자인,\n프로토타입,\n사용성 테스트',
  tools = 'Figma,\nFigjam,\nFigmaMake,\nClaude,\nLovable',
}) {
  // 처음부터 현재 화면 크기로 시작(마운트 직후 리렌더로 페이드 클래스가 지워지는 것 방지)
  const [isViewportTablet, setIsViewportTablet] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 1440px)').matches
  )

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 1440px)')
    const updateBreakpoint = () => setIsViewportTablet(mediaQuery.matches)
    updateBreakpoint()
    mediaQuery.addEventListener('change', updateBreakpoint)
    return () => mediaQuery.removeEventListener('change', updateBreakpoint)
  }, [])

  const isTablet = property1 === 'Tablet' || isViewportTablet
  return (
    <section className={`project-summary project-summary--${isTablet ? 'tablet' : 'desktop'}`} data-node-id="291:1704">
      <div className="project-summary__overview">
        <p className="project-summary__label">OVERVIEW</p>
        <p className="project-summary__overview-text">{overview}</p>
      </div>
      <MetaItem label="PROJECT TYPE">{projectType}</MetaItem>
      <MetaItem label="DURATION">{duration}</MetaItem>
      <MetaItem label="TOOLS"><p>{tools}</p></MetaItem>
      <MetaItem label="ROLE"><p>{role}</p></MetaItem>
    </section>
  )
}
