import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import gsap from "gsap";
import Home from "./pages/Home";
import ProjectPassing from "./pages/work/ProjectPassing";
import ProjectKakaoT from "./pages/work/ProjectKakaoT";
import ProjectHyundai from "./pages/work/ProjectHyundai";
import About from "./pages/about/About";
import LoadingScreen from "./components/LoadingScreen";
import CursorFollower from "./components/CursorFollower";

// Without this, navigating to a new page keeps whatever scroll position the
// previous page was left at (e.g. clicking the 패싱 카드 from the middle of
// Home's project row would land partway down ProjectPassing instead of at
// its Hero). A route with a hash (like "/#work") is left alone so Home's
// own scrollIntoView effect can handle jumping to that section.
//
// The app uses HashRouter, so a hard refresh doesn't reliably get the
// browser's own native scroll restoration (the URL's own "#/..." fragment
// makes browsers treat it inconsistently). So instead of leaning on that,
// this saves the scroll position for the CURRENT route to sessionStorage
// as the user scrolls, and restores it itself on the very first mount
// (app boot / refresh) — a real in-app navigation to a different page
// still resets to the top as before.
function ScrollManager() {
  const { pathname, hash } = useLocation();
  // null = "haven't handled any route yet". Comparing against the actual
  // pathname (rather than flipping a one-shot boolean) keeps this correct
  // even though React 18 StrictMode calls this effect twice on mount in
  // dev — the second call sees the same pathname it just handled and is a
  // no-op, instead of misreading itself as "no longer the first run" and
  // forcing a scroll back to the top.
  const lastPathname = useRef(null);

  // Keep sessionStorage up to date with where the user actually is on this
  // route, so a refresh has something to restore.
  useEffect(() => {
    const key = `scrollY:${pathname}`;
    let rafId = null;
    const onScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        sessionStorage.setItem(key, String(window.scrollY));
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [pathname]);

  useEffect(() => {
    if (hash) return;
    if (lastPathname.current === pathname) return;
    const isInitialLoad = lastPathname.current === null;
    lastPathname.current = pathname;

    if (isInitialLoad) {
      const saved = sessionStorage.getItem(`scrollY:${pathname}`);
      if (saved === null) return;
      const target = parseInt(saved, 10);
      // Re-applied a couple of times over ~1.5s to ride out late layout
      // shifts (web fonts / the loading screen unmounting) that would
      // otherwise nudge the restored position back up. Each retry checks
      // it's still the same route before acting, in case a real
      // navigation happens in the meantime.
      window.scrollTo(0, target);
      const timeouts = [100, 400, 1200].map((delay) =>
        setTimeout(() => {
          if (lastPathname.current === pathname) window.scrollTo(0, target);
        }, delay)
      );
      return () => timeouts.forEach(clearTimeout);
    }

    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return null;
}

// 홈으로 이동하면 라우터가 주소를 "/myportfolio"(끝 슬래시 없음)로 만들어서, 이 상태로
// 새로고침하거나 로고를 다시 누르면 개발 서버/호스팅이 "/myportfolio/"가 맞다고 안내하며 오류가 납니다.
// 경로가 바뀔 때마다 끝 슬래시가 빠진 베이스 주소를 "/myportfolio/"로 바로잡습니다(화면 이동 없음).
function BaseSlashFix() {
  const location = useLocation();
  useEffect(() => {
    const base = import.meta.env.BASE_URL.replace(/\/$/, "");
    if (base && window.location.pathname === base) {
      window.history.replaceState(
        window.history.state,
        "",
        `${base}/${window.location.search}${window.location.hash}`
      );
    }
  }, [location]);
  return null;
}

function PageTransitionRoutes({ loadingFinished }) {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [outgoingLocation, setOutgoingLocation] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const outgoingRef = useRef(null);
  const incomingRef = useRef(null);

  useLayoutEffect(() => {
    const isSameRoute =
      location.pathname === displayLocation.pathname &&
      location.search === displayLocation.search &&
      location.hash === displayLocation.hash;
    if (isSameRoute) return;
    setOutgoingLocation(displayLocation);
    setDisplayLocation(location);
    setIsTransitioning(true);
  }, [location.pathname, location.search, location.hash, displayLocation]);

  useLayoutEffect(() => {
    if (!isTransitioning || !incomingRef.current) return undefined;

    const timeline = gsap.timeline({
      onComplete: () => {
        // 전환이 끝나도 incoming 래퍼에 inline으로 남는 filter: blur(0px)/opacity는
        // 이 래퍼를 position:fixed의 기준(containing block)으로 만들어버려서,
        // 안에 있는 고정 헤더가 화면이 아니라 이 래퍼 기준으로 같이 스크롤돼
        // 버립니다(페이지를 이동한 뒤에만 헤더가 안 고정되던 원인). 전환
        // 직후 이 값들을 완전히 제거합니다.
        if (incomingRef.current) {
          gsap.set(incomingRef.current, { clearProps: 'opacity,filter' });
        }
        setOutgoingLocation(null);
        setIsTransitioning(false);
      },
    });

    // 홈에서 나가는 경우엔 나가는 쪽 홈을 아예 그리지 않습니다(아래 showOutgoing).
    // 나가는 홈을 새로 마운트하면 홈 인트로(YEONSU가 올라오는 모션)가 처음부터 다시 재생돼서
    // 프로젝트 페이지 뒤로 블러된 채 보였기 때문입니다.
    if (outgoingRef.current) {
      timeline.to(outgoingRef.current, {
        opacity: 0,
        filter: 'blur(8px)',
        duration: 0.6,
        ease: 'power2.inOut',
      })
    }
    timeline
      .fromTo(incomingRef.current,
        { opacity: 0, filter: 'blur(8px)' },
        { opacity: 1, filter: 'blur(0px)', duration: 0.85, ease: 'power2.out' },
        0.15,
      );

    return () => timeline.kill();
  }, [isTransitioning]);

  const showOutgoing = outgoingLocation && outgoingLocation.pathname !== '/'

  const renderRoutes = (routeLocation) => (
    <Routes location={routeLocation}>
      <Route path="/" element={<Home loadingFinished={loadingFinished} />} />
      <Route path="/works/project-passing" element={<ProjectPassing />} />
      <Route path="/works/kakao-t" element={<ProjectKakaoT />} />
      <Route path="/works/hyundai" element={<ProjectHyundai />} />
      <Route path="/about" element={<About />} />
      {/* 없는 주소는 스타터 키트의 크림색 404 페이지 대신 홈으로 보냅니다 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {showOutgoing && (
        <div ref={outgoingRef} style={{ position: 'absolute', inset: 0, zIndex: 2, width: '100%' }}>
          {renderRoutes(outgoingLocation)}
        </div>
      )}
      <div ref={incomingRef} style={{ position: 'relative', zIndex: 1, width: '100%' }}>
        {renderRoutes(displayLocation)}
      </div>
    </div>
  );
}

export default function App() {
  // Shown once on first load (Figma node 573:8409, "ING") — counts up to
  // 100% then fades out on its own; unmounted here for good so it never
  // reappears on later in-app navigation.
  const [showLoadingScreen, setShowLoadingScreen] = useState(true);
  const [loadingFinished, setLoadingFinished] = useState(false);

  const handleLoadingFinish = () => {
    setShowLoadingScreen(false);
    setLoadingFinished(true);
  };

  useEffect(() => {
    // body에 overflow-y:auto를 주면 body가 스크롤 컨테이너가 되어 WORK 리스트의
    // position:sticky가 화면에 고정되지 않고 그냥 흘러갑니다 — 그래서 로딩 중
    // 스크롤 잠금은 html(문서 루트)에 걸고, 끝나면 값을 비워 둡니다.
    const root = document.documentElement;
    const previousOverflowY = root.style.overflowY;
    root.style.overflowY = showLoadingScreen ? "hidden" : "";
    document.body.style.overflowY = "";

    return () => {
      root.style.overflowY = previousOverflowY;
    };
  }, [showLoadingScreen]);

  return (
    <div className={`site-shell${showLoadingScreen ? " is-loading" : ""}`}>
      <CursorFollower />
      {showLoadingScreen && (
        <LoadingScreen onFinish={handleLoadingFinish} />
      )}
      <BaseSlashFix />
      <ScrollManager />
      <PageTransitionRoutes loadingFinished={loadingFinished} />
    </div>
  );
}
