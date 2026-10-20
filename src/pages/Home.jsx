import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import gsap from 'gsap'
import { SplitText } from 'gsap/SplitText'
import Header from '../components/Header'
import HomeFooter from '../components/HomeFooter'
import HomeProjectList from '../components/HomeProjectList'
import '../componentsStyle/glassBox.css'
import GlassBox from '../components/GlassBox'
import { LiquidGlass } from '../lib/quidlass.esm.js';
import '../componentsStyle/home.css'

gsap.registerPlugin(SplitText)

// 모바일 글래스박스 유리 효과 값 — 데스크탑 각 박스의 <LiquidGlass> 값과 동일하게
// 박스별로 따로 맞춘 값입니다(데스크탑 값을 바꾸면 여기도 같이 바꿔주세요).
const MOBILE_GLASS_PRODUCT = {
  borderRadius: 10,
  blur: 5.5,
  contrast: 1.0,
  brightness: 1.07,
  saturation: 1.0,
  shadowIntensity: 0.28,
  elasticity: 0.27,
  elasticityActivationZone: 100,
  swirlIntensity: 12.3,
  swirlScale: 0.8,
  swirlRadius: 1.1,
  edgeThicknessPx: 24,
  swirlEdges: 'all',
  zIndex: 3,
  enableInnerGlow: true,
  style: { backgroundColor: 'rgba(255, 255, 255, 0.08)' },
}
const MOBILE_GLASS_DEPARTMENT = {
  borderRadius: 10,
  blur: 5.5,
  contrast: 1.0,
  brightness: 1.06,
  saturation: 1.0,
  shadowIntensity: 0.28,
  elasticity: 0.27,
  elasticityActivationZone: 100,
  swirlIntensity: 10.3,
  swirlScale: 1.5,
  swirlRadius: 1.5,
  edgeThicknessPx: 20,
  swirlEdges: 'all',
  zIndex: 3,
  enableInnerGlow: true,
  style: { backgroundColor: 'rgba(255, 255, 255, 0.08)' },
}
const MOBILE_GLASS_SKILLS = {
  borderRadius: 10,
  blur: 3.5,
  contrast: 1.0,
  brightness: 1.09,
  saturation: 1.0,
  shadowIntensity: 0.28,
  elasticity: 0.27,
  elasticityActivationZone: 100,
  swirlIntensity: 10.3,
  swirlScale: 1.5,
  swirlRadius: 1.1,
  edgeThicknessPx: 20,
  swirlEdges: 'all',
  zIndex: 3,
  enableInnerGlow: true,
  style: { backgroundColor: 'rgba(255, 255, 255, 0.08)' },
}
// 데스크탑 GlassBox(blur 0 / opacity 0)와 동일하게 자체 배경·블러를 없애
// 유리 효과는 LiquidGlass가 전담하게 합니다.
const MOBILE_BOX_VARS = { '--glass-box-opacity': 0, '--glass-box-blur': '0px' }

export default function Home({ loadingFinished = false }) {
  const { state } = useLocation()
  const heroRef = useRef(null)
  const [liquidGlassActive, setLiquidGlassActive] = useState(false)

  useLayoutEffect(() => {
    let splitText
    const context = gsap.context(() => {
      // 모바일 박스는 기존 일반 glass-box라 예전 모션(opacity+blur) 그대로.
      // 데스크탑 유리 박스: backdrop-filter가 걸린 요소의 "조상"에 opacity나
      // filter를 걸면 유리가 뒤를 못 보고 빈 패널이 되기 때문에, 박스 전체가
      // 아니라 유리를 이루는 레이어들(LiquidGlass 내부 배경 레이어 + glass-box)
      // "자기 자신"의 opacity만 0→1로 올립니다 — 자기 opacity는 자기 효과와
      // 함께 자연스럽게 페이드되고 뒤 비침은 유지됩니다. 글자/아이콘은 예전처럼
      // opacity+blur로 나타납니다.
      const glassEnter = gsap.utils.toArray('.home__glass-enter')
      const glassParts = glassEnter.map((box) => ({
        // LiquidGlass 바깥 껍데기(style의 옅은 흰 배경이 칠해진 요소) — 이건
        // backdrop-filter 요소들의 조상이라 opacity를 걸 수 없어서 배경색
        // 알파값만 0→목표값으로 올립니다.
        root: box.querySelector(':scope > div'),
        layers: gsap.utils.toArray(
          box.querySelectorAll(':scope > div > div:not(:last-child), .glass-box'),
        ),
        content: gsap.utils.toArray(
          box.querySelectorAll('.glass-box__icon, .glass-box__label, .glass-box__items'),
        ),
      }))
      const allGlassLayers = glassParts.flatMap((p) => p.layers)
      const allGlassContent = glassParts.flatMap((p) => p.content)
      const heroImage = '.home__hero-img-me, .home__hero-mobile-img-me'
      const heroText = '.home__hero-text'
      const heroTextSplit = '.home__hero-text-split'

      // 전체 텍스트가 아닌 내부 split 대상만 글자 단위로 분리합니다.
      splitText = SplitText.create(heroTextSplit, { type: 'chars' })

      // 로딩이 끝나기 전에는 시작 상태만 준비하고 애니메이션을 대기합니다.
      gsap.set(allGlassLayers, { opacity: 0 })
      gsap.set(
        glassParts.map((p) => p.root).filter(Boolean),
        { backgroundColor: 'rgba(255, 255, 255, 0)' },
      )
      gsap.set(allGlassContent, { opacity: 0, filter: 'blur(5px)' })
      gsap.set(heroImage, { opacity: 0, filter: 'blur(5px)', scale: 0.8, transformOrigin: '50% 50%' })
      // 왼쪽 desc 문구: 한 줄씩 투명도 0→1 + 아래에서 위로 올라오며 등장
      // 각 줄은 overflow:hidden 마스크 안에 있고, 안쪽 글자가 마스크 아래(가려진
      // 곳)에서 위로 천천히 올라옵니다.
      const descLines = gsap.utils.toArray('.home__hero-desc-line-inner')
      gsap.set(descLines, { yPercent: 110 })
      // 태블릿/모바일(≤1440px)은 시작 위치(y)를 덜 낮게 — 숫자를 줄이면 더 위에서 시작
      // 모바일(≤681px): 오른쪽에서 들어오는 느낌은 유지하면서 아래쪽은 마스크 선에서 잘림. 숫자(%)를 키우면 더 아래에서(더 가려진 채) 올라옴
      // ▼ [모바일 YEONSU 모션] 레퍼런스(heynesh) 영상처럼: 글자 전체가 오른쪽 아래(마스크 선 밖)에서
      //   대각선으로 올라오고, 글자마다 시간차(뒤 글자일수록 살짝 늦게/아래에서)로 따라옵니다.
      //   마스크 선은 home.css 모바일의 .home__hero-text-wrap height(245px)
      const isMobileHero = window.innerWidth <= 681
      const MOBILE_START_X = '170%'   // 시작 가로 위치(클수록 더 오른쪽 바깥에서)
      const MOBILE_START_Y = '180%'  // 시작 세로 위치(클수록 더 아래). 시작 시 글자 전체가 마스크 선 아래로 완전히 가려지게 충분히 크게
      const heroTextStartY = isMobileHero ? MOBILE_START_Y : window.innerWidth <= 1440 ? '40%' : '100%'
      // 모바일: 투명(0)에서 시작해 빠르게 나타납니다(숫자를 키우면 더 천천히)
      const MOBILE_FADE_DURATION = 0.25
      const MOBILE_FADE_DELAY = 0.02
      gsap.set(heroText, { x: isMobileHero ? MOBILE_START_X : '100%', y: heroTextStartY, opacity: isMobileHero ? 0 : 1 })
      // 모바일: 글자 개별 시작 y를 낮춰야(100→40) 글자가 처음부터 보여서 '오른쪽에서 쓸려 들어오는' 움직임이 보입니다.
      // 100이면 글자가 가려진 채 제자리에서 왼쪽부터 순서대로 솟아올라 '왼쪽에서 나오는' 느낌이 됩니다.
      gsap.set(splitText.chars, { yPercent: isMobileHero ? 40 : 100 })
      setLiquidGlassActive(false)
      if (!loadingFinished) return

      const timeline = gsap.timeline()
      timeline.to(heroText, {
        x: '0%',
        y: '0%',
        // 모바일은 더 빠르고 탄력 있게(숫자를 줄이면 더 빨라짐)
        duration: isMobileHero ? 0.75 : 0.8,
        ease: isMobileHero ? 'power4.out' : 'power2.out',
      })
      timeline.to(splitText.chars, {
        yPercent: 0,
        // 모바일: 글자 전체가 들어오는 동안(0.3초) 글자가 하나씩 위로 올라가도록,
        // 글자 모션 전체 길이(duration + 글자수×stagger)가 이동 시간(0.3초) 안에 끝나게 짧게 잡았습니다.
        duration: isMobileHero ? 0.22 : 0.6,
        stagger: isMobileHero ? 0.015 : 0.08,
        ease: isMobileHero ? 'power4.out' : 'power2.out',
      }, '<')
      // 모바일 투명도: 글자가 마스크 선 위로 처음 보이기 시작하는 순간(이동 시작 직후)에 같이 시작.
      // 이동이 power4.out이라 아주 빨리 보이기 시작하므로 지연은 아주 짧게(MOBILE_FADE_DELAY).
      // 투명도가 너무 일찍 올라 보이면 DELAY를 키우고, 늦게 들어오면 줄이세요.
      if (isMobileHero) timeline.to(heroText, { opacity: 1, duration: MOBILE_FADE_DURATION, ease: 'none' }, `<+=${MOBILE_FADE_DELAY}`)
      timeline.to(heroImage, {
        opacity: 1,
        filter: 'blur(0px)',
        scale: 1,
        duration: 1.2,
        ease: 'power2.out',
        // 등장 순서: me 이미지 → 글래스박스 → desc. 이미지는 YEONSU 텍스트가
        // 끝나길 기다리지 않고 0.35초 뒤에 바로 시작(예전엔 0.8초 뒤)합니다.
      }, '<+=0.7')
      // 글래스박스는 예전처럼 "me 이미지가 끝나는 시점"에 들어오므로, 이미지가
      // 빨라진 만큼 같이 앞당겨집니다.
      // ▼ [글래스박스 모션 ①] 박스 등장 시작 기준 시점(boxesIn). 이미지 시작 +0.7초 지점
      //   (시작 시점을 바꾸려면 위 heroImage 트윈 끝의 '<+=0.7'을 고치세요)
      timeline.addLabel('boxesIn')
      // desc는 글래스박스가 모두 들어오기 시작한 뒤(마지막 박스가 시작하는
      // 0.7초 이후)에 한 줄씩 차분하게
      timeline.to(descLines, {
        yPercent: 0,
        duration: 1.4,
        stagger: 0.18,
        ease: 'power3.out',
        onComplete: () => gsap.set(descLines, { clearProps: 'transform' }),
      // ▼ [모바일 desc 등장 시점] boxesIn 기준 몇 초 뒤에 시작할지. 숫자를 줄이면 더 빨리(0이면 글래스박스와 동시, 음수면 그보다 먼저)
      }, isMobileHero ? 'boxesIn+=0.3' : 'boxesIn+=1')
      // 박스마다 0.35초 간격으로 차례로(기존 stagger와 동일) 등장
      glassParts.forEach((part, i) => {
        // 데스크탑 3개 + 모바일 3개가 같이 잡히므로 i % 3으로 각 세트 안에서 차례로 등장
        // ▼ [글래스박스 모션 ②] 박스 사이 등장 간격(초) — 0.35 = 1번째 0초, 2번째 0.35초, 3번째 0.7초
        const at = `boxesIn+=${(i % 3) * 0.4}`
        if (part.root) {
          timeline.to(part.root, {
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            duration: 0.8, // ▼ [글래스박스 모션 ③] 배경이 차오르는 시간(초)
            ease: 'power2.out',
          }, at)
        }
        timeline.to(part.layers, {
          opacity: 1,
          duration: 0.8, // ▼ [글래스박스 모션 ③] 유리 레이어가 나타나는 시간(초)
          ease: 'power2.out',
          // 레이어가 원래 갖고 있던 값(투명도 등)으로 복원
          onComplete: () => gsap.set(part.layers, { clearProps: 'opacity' }),
        }, at)
        timeline.to(part.content, {
          opacity: 1,
          filter: 'blur(0px)',
          duration: 0.8, // ▼ [글래스박스 모션 ③] 안쪽 아이콘·글자가 나타나는 시간(초)
          stagger: 0.12, // 안쪽 요소끼리 간격(초)
          ease: 'power2.out',
          onComplete: () => {
            gsap.set(part.content, { clearProps: 'opacity,filter' })
            if (i === glassParts.length - 1) setLiquidGlassActive(true)
          },
        }, at)
      })
    }, heroRef)

    return () => {
      splitText?.revert()
      context.revert()
    }
  }, [loadingFinished])

  // Header의 WORK 링크를 눌렀을 때(다른 페이지에서 올 때 포함) 주소에 "#work"를
  // 붙이지 않고, 라우터 state로만 신호를 받아 프로젝트 목록으로 스크롤합니다.
  // 새로고침해도 같은 스크롤이 반복되지 않게 처리 후 state는 비웁니다.
  useEffect(() => {
    if (state?.scrollTo !== 'work') return
    document.getElementById('work')?.scrollIntoView({ behavior: 'smooth' })
    window.history.replaceState({ ...window.history.state, usr: null }, '')
  }, [state])

  return (
    <div className="home" data-node-id="380:3913" >
      <Header />
      {/* TODO: 대략적인 임시 구현 — 실제 인터랙티브 히어로는 별도로 제작 예정 */}
      <section className="home__hero" ref={heroRef} data-node-id="380:3921">
        <div className="home__hero-text-wrap">
          {/* 우측아래에서 올라오면서 좌측상단으로 이동하는 애니메이션을 적용한 텍스트입니다. */}
          <p className="home__hero-text">
            {/* 각 텍스트를 쪼개서 글자 단위로 애니메이션을 적용할 수 있습니다. */}
            <span className="home__hero-text-split">YEONSU</span>
          </p>
        </div>
        <div className="home__hero-img-me-wrap">
          <img src={`${import.meta.env.BASE_URL}assets/home/image-me-fixed.svg`} alt="YEONSU" className="home__hero-img-me" />
        </div>


        {/* YEONSU 텍스트(font-size)와 me 이미지(width)는 min(100vw,1920px)/1920px
            비율로 줄어드는데, 이 박스들은 transform의 px 오프셋(320px, 80px 등)이
            고정값이라 화면이 좁아져도 그대로 유지돼서 다른 요소들과 같은 자리에서
            줄어들지 않고 점점 어긋나 보였습니다 — 오프셋에도 똑같은 비율을 곱해서
            같은 기준으로 함께 줄어들게 맞춥니다. */}
        <div className="home__product_design_box">
          <div className="home__glass-enter">
            <LiquidGlass
              borderRadius={10}
              blur={5.5}
              contrast={1.0}
              brightness={1.07}
              saturation={1.0}
              shadowIntensity={0.28}
              elasticity={0.27}
              elasticityActivationZone={100}
              swirlIntensity={12.3}
              swirlScale={0.8}
              swirlRadius={1.1}
              edgeThicknessPx={24}
              swirlEdges="all"
              zIndex={3}
              enableInnerGlow
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
            >
              <GlassBox curvature={10} width='229px' smallIcon height='116px' blur={0} opacity={0}
                iconSrc={`${import.meta.env.BASE_URL}assets/home/icon-product-designer2.png`}
                lines={['Product', 'Designer']}
              />
            </LiquidGlass>
          </div>
        </div>


        <div
          className="home__department_of_visual_design_box">
          {/* liquidGlassActive로 가리지 않고 처음부터 렌더링합니다 — 이 박스
              자체는 이미 gsap의 boxes 배열에 들어있어서 opacity/blur로
              기존 등장 모션이 그대로 적용되고, 유리 효과(LiquidGlass)만
              Product Designer 박스와 동일하게 적용됩니다. */}
          {/* home__glass-enter: 등장 모션(위로 올라오며 커짐)을 transform만으로
              주는 안쪽 래퍼입니다. filter/opacity가 걸린 조상 밑에서는 안쪽
              backdrop-filter가 뒤를 못 보는데, transform은 그런 제약이 없어서
              모션 도중에도 유리효과가 계속 비칩니다. */}
          <div className="home__glass-enter">
            <LiquidGlass
              borderRadius={10}
              blur={5.5}
              contrast={1.0}
              brightness={1.06}
              saturation={1.0}
              shadowIntensity={0.28}
              elasticity={0.27}
              elasticityActivationZone={100}
              swirlIntensity={10.3}
              swirlScale={1.5}
              swirlRadius={1.5}
              edgeThicknessPx={20}
              swirlEdges="all"
              zIndex={3}
              enableInnerGlow
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
            >
              <GlassBox curvature={10} width='189px' height='186px' blur={0} opacity={0}
                iconSrc={`${import.meta.env.BASE_URL}assets/home/icon-design.png`}
                lines={['DEPARTMENT', 'OF VISUAL', 'DESIGN']}
                flexDirection='column'
              />
            </LiquidGlass>
          </div>
        </div>
        <div
          className="home__skills_box">
          <div className="home__glass-enter">
            <LiquidGlass
              borderRadius={10}
              blur={3.5}
              contrast={1.0}
              brightness={1.09}
              saturation={1.0}
              shadowIntensity={0.28}
              elasticity={0.27}
              elasticityActivationZone={100}
              swirlIntensity={10.3}
              swirlScale={1.5}
              swirlRadius={1.1}
              edgeThicknessPx={20}
              swirlEdges="all"
              zIndex={3}
              enableInnerGlow
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
            >
              <GlassBox curvature={10} width='264px' height='202px' blur={0} opacity={0}
                flexDirection='column'
                items={[
                  { iconSrc: `${import.meta.env.BASE_URL}assets/home/icon-fast.png`, text: 'Fast Worker' },
                  { iconSrc: `${import.meta.env.BASE_URL}assets/home/Icon-communication.png`, text: 'Communication' },
                  { iconSrc: `${import.meta.env.BASE_URL}assets/home/Icon-Perseverance.png`, text: 'Perseverance' },
                  { iconSrc: `${import.meta.env.BASE_URL}assets/home/Icon-ai.png`, text: 'AI Proficiency' },
                ]}
              />
            </LiquidGlass>
          </div>
        </div>

        {/* home__hero-desc는 일부러 home__hero-stage 밖에 둡니다 — stage에
            transform(scale)이 걸려 있으면 CSS 스펙상 그 transform이
            position:fixed 자식의 기준(containing block)이 돼버려서, 진짜
            브라우저 뷰포트가 아니라 stage 박스 기준으로 "고정"되는 바람에
            화면에 안 붙고 다른 요소에 가려지는 문제가 있었습니다. stage
            밖으로 꺼내야 CSS의 position:fixed(뷰포트 하단 60px 고정)가
            의도대로 동작합니다. */}
        <p className="home__hero-desc">
          <span className="home__hero-desc-line" style={{ display: 'block', overflow: 'hidden' }}>
            <span className="home__hero-desc-line-inner" style={{ display: 'block' }}> 빠른 실행력과 꼼꼼함을 인정받으며</span></span>
          <span className="home__hero-desc-line" style={{ display: 'block', overflow: 'hidden' }}>
            <span className="home__hero-desc-line-inner" style={{ display: 'block' }}>완성도 높은 결과를 이끌어가는</span></span>
          <span className="home__hero-desc-line" style={{ display: 'block', overflow: 'hidden' }}>
            <span className="home__hero-desc-line-inner" style={{ display: 'block' }}>프로덕트 디자이너 김연수입니다.</span></span>
        </p>



        {/* 모바일(681px 이하) 전용 hero 레이아웃!!! — Figma 모바일 가이드
    (node 402:6128) 기준 */}
        <div className="home__hero-mobile-stage">
          <div className="home__hero-text-wrap">
            {/* 우측아래에서 올라오면서 좌측상단으로 이동하는 애니메이션을 적용한 텍스트입니다. */}
            <p className="home__hero-text">
              {/* 각 텍스트를 쪼개서 글자 단위로 애니메이션을 적용할 수 있습니다. */}
              <span className="home__hero-text-split">YEONSU</span>
            </p>
          </div>
          <img src={`${import.meta.env.BASE_URL}assets/home/image-me-mobile.svg`} alt="YEONSU" className="home__hero-mobile-img-me" />

          <div className="home__department_of_visual_design_box">
            <div className="home__glass-enter">
              <LiquidGlass {...MOBILE_GLASS_DEPARTMENT}>
                <GlassBox
                curvature={10} width='122px' blur={0} opacity={0}
                iconSrc={`${import.meta.env.BASE_URL}assets/home/icon-design.png`}
                lines={['DEPARTMENT', 'OF VISUAL', 'DESIGN']}
                flexDirection='column'
              />
              </LiquidGlass>
            </div>
          </div>

          <div className="home__product_design_box">
            <div className="home__glass-enter">
              <LiquidGlass {...MOBILE_GLASS_PRODUCT}>
                <GlassBox
                curvature={10} width='235px' smallIcon blur={0} opacity={0}
                iconSrc={`${import.meta.env.BASE_URL}assets/home/icon-product-designer2.png`}
                lines={['Product', 'Designer']}
              />
              </LiquidGlass>
            </div>
          </div>

          <div className="home__skills_box">
            <div className="home__glass-enter">
              <LiquidGlass {...MOBILE_GLASS_SKILLS}>
                <GlassBox
                curvature={10} width='191px' blur={0} opacity={0}
                flexDirection='column'
                items={[
                  { iconSrc: `${import.meta.env.BASE_URL}assets/home/icon-fast.png`, text: 'Fast Worker' },
                  { iconSrc: `${import.meta.env.BASE_URL}assets/home/Icon-communication.png`, text: 'Communication' },
                  { iconSrc: `${import.meta.env.BASE_URL}assets/home/Icon-Perseverance.png`, text: 'Perseverance' },
                  { iconSrc: `${import.meta.env.BASE_URL}assets/home/Icon-ai.png`, text: 'AI Proficiency' },
                ]}
              />
              </LiquidGlass>
            </div>
          </div>

          <p className="home__hero-mobile-desc">
            <span className="home__hero-desc-line" style={{ display: 'block', overflow: 'hidden' }}><span className="home__hero-desc-line-inner" style={{ display: 'block' }}>빠른 작업 능력과 세밀함을 인정받으며</span></span>
            <span className="home__hero-desc-line" style={{ display: 'block', overflow: 'hidden' }}><span className="home__hero-desc-line-inner" style={{ display: 'block' }}>완성도 높은 결과를 이끌어가는</span></span>
            <span className="home__hero-desc-line" style={{ display: 'block', overflow: 'hidden' }}><span className="home__hero-desc-line-inner" style={{ display: 'block' }}>프로덕트 디자이너 김연수입니다.</span></span>
          </p>
        </div>
      </section>

      <div className="home__project-wrap" data-node-id="380:3948">
        <HomeProjectList id="work" footer={<HomeFooter />} />
      </div>
    </div >
  )


}
