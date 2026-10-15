import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import '../componentsStyle/home-project-list.css'

const defaultProjects = [
  {
    tags: ['#AI검증', '#B2C', '#핀테크'],
    title: 'AI 티켓 사기 예방 ‘패싱’',
    description: 'SNS 티켓 거래의 사기 취약점을 AI 사전 검증으로 해결하는 티켓 거래 플랫폼',
    to: '/works/project-passing',
    video: `${import.meta.env.BASE_URL}assets/home-passing.mp4`,
  },
  {
    tags: ['#AI AGENT', '#SENIOR', '#REVAMP'],
    title: ['카카오T with 시니어 맞춤', 'AI 보이스 에이전트'],
    description: '디지털 사용에 어려움 겪는 시니어도 택시 호출을 끝까지 완료할 수 있도록 개선',
    to: '/works/kakao-t',
    video: `${import.meta.env.BASE_URL}assets/home-kakaot.mp4`,
  },
  {
    tags: ['#반응형', '#WEB', '#REVAMP'],
    title: '현대 자동차 홈페이지 개선',
    description: ['일관성 없는 레이아웃과 끊기는 구매흐름을', '반응형에 맞춰 재설계'],
    to: '/works/hyundai',
    video: `${import.meta.env.BASE_URL}assets/home-hyundai.mp4`,
  },
]

// 제목과 설명은 문자열 또는 여러 줄을 담은 배열로 받을 수 있습니다.
// 배열로 전달된 내용은 각 항목 사이에 줄바꿈을 넣어 표시합니다.
function Lines({ text }) {
  if (!Array.isArray(text)) return text
  return text.map((line, index) => (
    <span key={index}>
      {line}
      {index < text.length - 1 && <br />}
    </span>
  ))
}

function HomeProjectCard({ tags, title, description, to, image, video }) {
  return (
    <Link className="home-project-list__card" to={to}>
      {video ? (
        // 프로젝트 데이터에 video 경로가 있으면 미리보기 영상을 표시합니다.
        <video className="home-project-list__media" src={video} autoPlay muted loop playsInline preload="auto" />
      ) : (
        <div className="home-project-list__media" style={image ? { backgroundImage: `url(${image})` } : undefined} />
      )}
      <div className="home-project-list__gradient" />
      <div className="home-project-list__tags">
        {tags.map((tag, index) => (
          <span className="home-project-list__tag" key={`${tag}-${index}`}>{tag}</span>
        ))}
      </div>
      <div className="home-project-list__contents">
        <p className="home-project-list__title"><Lines text={title} /></p>
        <p className="home-project-list__description"><Lines text={description} /></p>
      </div>
    </Link>
  )
}

// 섹션 자체를 긴 스크롤 구간으로 만들고, 내부 콘텐츠를 화면에 고정합니다.
// 사용자가 스크롤하는 동안 카드 트랙은 왼쪽으로 이동합니다.
//
// 종료 위치는 트랙이 래퍼 밖으로 넘치는 거리만큼 이동한 위치입니다.
// 카드 이동은 transform으로 처리하며, 모든 화면 크기에서 같은 방식으로 동작합니다.

// 카드 행이 들어오기 시작하는 가로 위치(화면 너비 기준): 0.8 = 화면 왼쪽에서 80% 지점 / 1 = 화면 오른쪽 끝 바깥
const ENTER_FROM = 0.6
// 태블릿(682~1440px)에서 카드 행이 들어오기 시작하는 가로 위치 — 숫자↓ = 더 왼쪽(화면 안쪽)에서 시작, 숫자↑ = 더 오른쪽(바깥)에서 시작
const ENTER_FROM_TABLET = 0.33
// 모바일(681px 이하)에서 카드 행이 들어오기 시작하는 가로 위치(화면 너비 기준) — 0.7 = 왼쪽에서 70% 지점
const ENTER_FROM_MOBILE = 0.0
// 모바일: 카드가 끝까지 이동한 뒤 오른쪽 여백을 CSS 기본값(17px)보다 얼마나 더 줄지/늘릴지(px). 양수 = 여백이 더 커짐, 0 = 17px 그대로
const MOBILE_END_EXTRA = 0
// 모바일: 전체 고정 스크롤 구간 중 앞쪽 이 비율 안에서 카드 이동을 끝내고, 남은 구간은 마지막 위치에서 멈춰 있습니다.
// 1 = 스크롤이 끝나는 순간에야 마지막 위치에 도착 / 0.9 = 90% 지점에 도착(숫자↓ = 더 일찍 도착)
const MOBILE_MOVE_RATIO = 0.9

// footer: 고정 영역 바로 아래에 같이 붙여 보여줄 요소(푸터). 가로 스크롤하는 동안 카드 아래에 푸터가 바로 이어 보입니다.
export default function HomeProjectList({ projects = defaultProjects, id, footer = null }) {
  const sectionRef = useRef(null)
  const trackWrapRef = useRef(null)
  const trackRef = useRef(null)

  useEffect(() => {
    const section = sectionRef.current
    const trackWrap = trackWrapRef.current
    const track = trackRef.current
    if (!section || !trackWrap || !track) return

    const sticky = section.querySelector('.home-project-list__sticky')
    const work = section.querySelector('.home-project-list__work')
    let startTranslate = 0
    let endTranslate = 0
    let progressFloor = 0
    let scrollSpan = 1
    let pinTop = 0
    let moveSpan = 1
    let rafId = null

    const measure = () => {
      // transform이 없는 상태에서 트랙의 원래 위치/너비를 측정합니다.
      track.style.transform = 'none'
      const viewportWidth = window.innerWidth
      const naturalStartX = track.getBoundingClientRect().left
      // 끝 위치: 카드 행이 화면을 넘치면 마지막 카드(+오른쪽 패딩)까지 보이도록 그만큼 왼쪽으로,
      // 안 넘치면 원래 자리에서 멈춥니다.
      const endExtra = viewportWidth <= 681 ? MOBILE_END_EXTRA : 0
      const overflow = Math.max(naturalStartX + track.scrollWidth - viewportWidth + endExtra, 0)
      endTranslate = -overflow
      // 시작 위치: 카드 행의 왼쪽 끝이 화면 오른쪽 바깥(화면 너비 지점)에 있는 상태 —
      // 스크롤하면 오른쪽에서 가로로 들어옵니다.
      const isMobile = viewportWidth <= 681
      const isTablet = !isMobile && viewportWidth <= 1440
      const enterFrom = isMobile ? ENTER_FROM_MOBILE : isTablet ? ENTER_FROM_TABLET : ENTER_FROM
      startTranslate = Math.max(viewportWidth * enterFrom - naturalStartX, endTranslate)
      // 모바일(681px 이하)은 이동 구간의 앞부분(floor)을 건너뛰고 시작합니다(값↑ = 처음부터 더 들어와 있음).
      progressFloor = 0
      // 고정(sticky) 상태로 스크롤해야 하는 거리 = 실제 이동 거리.
      scrollSpan = Math.max((startTranslate - endTranslate) * (1 - progressFloor), 1)
      moveSpan = Math.max(scrollSpan * (isMobile ? MOBILE_MOVE_RATIO : 1), 1)
      // 고정 영역 전체(WORK 블록 + 아래 붙은 푸터) 높이 — 섹션 높이는 이 높이 + 이동 거리입니다.
      const stickyHeight = sticky.offsetHeight
      section.style.height = `${stickyHeight + scrollSpan}px`
      // WORK 블록(제목 + 카드 + 위·아래 패딩)만 기준으로 고정 위치를 잡습니다: 화면이 충분히 크면 맨 위(0)에 고정되고
      // 그 아래로 푸터가 바로 이어 보이며, 화면이 WORK 블록보다 낮을 때만 카드가 잘리지 않게 위로 당겨 고정합니다.
      pinTop = Math.min(0, window.innerHeight - work.offsetHeight)
      sticky.style.top = `${pinTop}px`
    }

    const update = () => {
      rafId = null
      const runway = startTranslate - endTranslate
      const rect = section.getBoundingClientRect()
      // 고정이 시작되는 순간(rect.top === pinTop)부터 scrollSpan만큼 스크롤하는 동안 0→1
      const t = Math.min(Math.max((pinTop - rect.top) / moveSpan, 0), 1)
      const progress = progressFloor + (1 - progressFloor) * t
      track.style.transform = `translateX(${startTranslate - progress * runway}px)`
    }

    const onScroll = () => {
      if (rafId) return
      // 스크롤 이벤트마다 바로 계산하지 않고 한 프레임에 한 번만 갱신합니다.
      rafId = requestAnimationFrame(update)
    }

    const onResize = () => {
      // 화면 크기가 바뀌면 카드 너비와 스크롤 구간을 다시 계산합니다.
      measure()
      update()
    }

    measure()
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    // 폰트/영상 로딩 등으로 고정 영역 높이가 바뀌면 섹션 높이도 다시 맞춥니다.
    const resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(onResize) : null
    resizeObserver?.observe(sticky)
    resizeObserver?.observe(work)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      resizeObserver?.disconnect()
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [])

  return (
    <section className="home-project-list" id={id} ref={sectionRef} data-node-id="380:2887">
      <div className="home-project-list__sticky">
        <div className="home-project-list__work">
          <h2 className="home-project-list__heading">WORK</h2>
          <div className="home-project-list__track-wrap" ref={trackWrapRef}>
            <div className="home-project-list__grid" ref={trackRef}>
              {projects.map((project, index) => (
                <HomeProjectCard key={`${index}-${Array.isArray(project.title) ? project.title.join(' ') : project.title}`} {...project} />
              ))}
            </div>
          </div>
        </div>
        {footer}
      </div>
    </section>
  )
}
