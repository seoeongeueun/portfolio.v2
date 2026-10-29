"use client";
import {Fragment, useEffect, useRef, useState} from "react";
import {stacks, GSAP_OPTION} from "../lib/constants";
import {getRandomInt, debounce} from "../lib/tools";
import Image from "next/image";
import gsap from "gsap";
import {Observer} from "gsap/Observer";

// 수영장 기본 물결 값 (svg 초기값이자 낙하 애니메이션이 끝난 뒤 유지되는 값)
const POOL_TURBULENCE = {baseFrequency: "0.03 0.08", scale: 10};

export default function Pool() {
	const poolRef = useRef<HTMLDivElement | null>(null);
	// 랜덤 위치는 hydration 불일치를 피하기 위해 마운트 후 state로 생성 (state라서 생성 후 리렌더됨)
	const [charPositions, setCharPositions] = useState<Record<string, {x: number; y: number}> | null>(null);
	const [loadedChars, setLoadedChars] = useState<Record<string, boolean>>({}); //로딩 바 진행률용
	const totalChars = Object.keys(stacks).length;
	const loadedCount = Object.keys(loadedChars).length;
	const allLoaded = loadedCount >= totalChars;
	const tweenRef = useRef<
		Record<
			string,
			{
				x: ReturnType<typeof gsap.quickTo>;
				y: ReturnType<typeof gsap.quickTo>;
				rot: ReturnType<typeof gsap.quickTo>;
				sx?: ReturnType<typeof gsap.quickTo>;
				sy?: ReturnType<typeof gsap.quickTo>; //그림자 위치용 sx와 sy
			}
		>
	>({});
	const shadowElRef = useRef<Record<string, HTMLElement | null>>({});
	const ringLayerRef = useRef<HTMLDivElement | null>(null);
	const dropLayerRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		if (!poolRef.current) return;

		setCharPositions(Object.fromEntries(Object.keys(stacks).map(key => [key, {x: getRandomInt(40), y: getRandomInt(40)}])));

		const debouncedResize = debounce(() => {
			// 리사이즈시 모든 char 위치 초기화 후 수영장 안으로 보정
			if (!poolRef.current) return;
			resetCharAndShadowTransforms(poolRef.current);
			clampAllChars(poolRef.current);
		}, 200);

		window.addEventListener("resize", debouncedResize);

		return () => {
			window.removeEventListener("resize", debouncedResize);
		};
	}, []);

	useEffect(() => {
		const waveTl = gsap.timeline({repeat: 1, yoyo: true, ease: "power3.inOut"});
		waveTl
			.to("#dispShore", {
				attr: {scale: 50},
				scrollTrigger: {
					trigger: ".main-page",
					scroller: ".main-page",
					start: "top top",
					end: "bottom top",
					scrub: 0.3,
				},
			})
			.to("#turbShore", {
				attr: {baseFrequency: "0.02 0.08"},
				scrollTrigger: {
					trigger: ".main-page",
					scroller: ".main-page",
					start: "top top",
					end: "bottom top",
					scrub: 0.3,
				},
			});
		// 이미지 크기를 알아야 clamp 가능하므로 모두 로드된 후에 시작
		if (!poolRef.current || !charPositions || !allLoaded) return;

		resetCharAndShadowTransforms(poolRef.current);
		clampAllChars(poolRef.current);

		gsap.defaults({overwrite: true});

		//과부화 방지용 쓰로틀 추가
		let lastMoveTime = 0;
		const moveThrottle = 40;

		let moveCharsFrameId: number | null = null;
		let isDropping = true; //등장 애니메이션 중에는 overwrite로 끊기지 않도록 인터랙션 막기

		function moveChars({event, deltaX, deltaY}: {event: Event; deltaX: number; deltaY: number}) {
			if (moveCharsFrameId || isDropping) return;

			//시간으로 throttle 계산
			if (Date.now() - lastMoveTime < moveThrottle) return;
			lastMoveTime = Date.now();

			moveCharsFrameId = requestAnimationFrame(() => {
				moveCharsFrameId = null;

				const el = event.target as HTMLElement;
				const id = el.classList.contains("char") ? el.className.match(/char-(\S+)/)?.[1] : null;
				if (!id || !poolRef.current) return;

				const shadow = shadowElRef.current[id]; //캐싱했던 그림자 요소를 바로 사용
				const charBounds = el.getBoundingClientRect();

				const t = 3; //이동 강도
				const {x: xMovement, y: yMovement} = getClampedMove(el, deltaX * t, deltaY * t);

				// quickTo 핸들러가 없으면 생성 (요소당 1회)
				if (!tweenRef.current[id]) {
					tweenRef.current[id] = {
						x: gsap.quickTo(el, "x", GSAP_OPTION),
						y: gsap.quickTo(el, "y", GSAP_OPTION),
						rot: gsap.quickTo(el, "rotation", GSAP_OPTION),
					};

					if (shadow) {
						tweenRef.current[id].sx = gsap.quickTo(shadow, "x", GSAP_OPTION);
						tweenRef.current[id].sy = gsap.quickTo(shadow, "y", GSAP_OPTION);
					}
				}

				// 현재 transform 값 기반으로 위치 계산
				const curX = gsap.getProperty(el, "x") as number;
				const curY = gsap.getProperty(el, "y") as number;
				const curR = gsap.getProperty(el, "rotation") as number;

				tweenRef.current[id].x(curX + xMovement);
				tweenRef.current[id].y(curY + yMovement);

				// 회전도 누적 값으로
				const rotDelta = deltaX * 1.2 * Math.sign(event instanceof PointerEvent ? event.clientY - (charBounds.top + charBounds.height / 2) : 1);

				tweenRef.current[id].rot(curR - rotDelta);

				if (shadow && tweenRef.current[id].sx && tweenRef.current[id].sy) {
					const curSX = gsap.getProperty(shadow, "x") as number;
					const curSY = gsap.getProperty(shadow, "y") as number;
					tweenRef.current[id].sx!(curSX + xMovement);
					tweenRef.current[id].sy!(curSY + yMovement);
				}
			});
		}

		//마우스 드래그
		const observer = Observer.create({
			target: poolRef.current,
			type: "pointer,touch,mouse",
			onMove: (self: any) => {
				const e = self.event;
				const el = e?.target as HTMLElement;

				if (el && el.matches(".char")) {
					const boost = self.pointerType === "touch" ? 3 : 1;

					moveChars({
						event: e,
						deltaX: self.deltaX * boost,
						deltaY: self.deltaY * boost,
					});
				}
			},
		});

		let rippleFrameId: number | null = null;
		let lastWaveTime = 0;
		const waveThrottle = 50;

		const turbWave = document.querySelector("#turbwave");
		const dispMap = document.querySelector("#dispMap");

		// 로딩 완료 후 이미지가 하나씩 위에서 떨어지고, 착지할 때마다 수영장에 물결
		// gsap.defaults의 overwrite: true가 같은 타겟의 이전 tween을 죽이지 않도록 타임라인은 overwrite: false
		const dropTl = gsap.timeline({defaults: {overwrite: false}, onComplete: () => (isDropping = false)});
		const DROP_DURATION = 0.5;
		const DROP_GAP = 0.2; //이미지 간 낙하 간격

		poolRef.current.querySelectorAll<HTMLElement>(".char").forEach((el, i) => {
			const at = i * DROP_GAP;
			const id = el.className.match(/char-(\S+)/)?.[1];
			const shadow = id ? shadowElRef.current[id] : null;

			// 위에서 보는 시점이므로 크게 보이다가 가속하며 작아져 착지
			// visibility: hidden 상태에서는 from의 autoAlpha 종료값이 0으로 읽히므로 fromTo로 명시
			dropTl.fromTo(el, {autoAlpha: 0, scale: 1.8, rotation: "random(-25, 25)"}, {autoAlpha: 1, scale: 1, rotation: 0, duration: DROP_DURATION, ease: "power3.in"}, at);
			// 착지: 물속으로 가라앉았다가 (작아지고 반투명해져 물색이 비침) 다시 떠오르며 살짝 출렁임
			const land = at + DROP_DURATION;
			const SINK_DURATION = 0.35;
			const RISE_DURATION = 0.9;
			dropTl.call(() => splash(el), [], land);
			dropTl.to(el, {scale: 0.88, autoAlpha: 0.75, duration: SINK_DURATION, ease: "power2.out"}, land);
			dropTl.to(el, {scale: 1, autoAlpha: 1, duration: RISE_DURATION, ease: "back.out(1.8)"}, land + SINK_DURATION);
			if (shadow) {
				gsap.set(shadow, {clearProps: "opacity"}); //이전에 실행된 타임라인이 남긴 inline opacity 제거 (strict mode 재실행 대비)
				const shadowOpacity = parseFloat(getComputedStyle(shadow).opacity); //css에 지정된 그림자 투명도 유지
				dropTl.fromTo(shadow, {autoAlpha: 0, scale: 0.2}, {autoAlpha: shadowOpacity, scale: 1, duration: DROP_DURATION, ease: "power2.in"}, at);
				// 가라앉는 동안 그림자도 아이템과 겹치며 흐려짐
				dropTl.to(shadow, {scale: 0.85, autoAlpha: shadowOpacity * 0.7, duration: SINK_DURATION, ease: "power2.out"}, land);
				dropTl.to(shadow, {scale: 1, autoAlpha: shadowOpacity, duration: RISE_DURATION, ease: "back.out(1.8)"}, land + SINK_DURATION);
			}

			// 착지마다 물결이 튀었다가 기본 물결 값으로 돌아오므로, 마지막 착지 후에도 수영장이 잔잔히 일렁임
			if (dispMap) dropTl.fromTo(dispMap, {attr: {scale: 20}}, {attr: {scale: POOL_TURBULENCE.scale}, duration: 1.2, ease: "power2.out", immediateRender: false}, at + DROP_DURATION);
			if (turbWave)
				dropTl.fromTo(turbWave, {attr: {baseFrequency: "0.01 0.02"}}, {attr: {baseFrequency: POOL_TURBULENCE.baseFrequency}, duration: 1.2, ease: "power2.out", immediateRender: false}, at + DROP_DURATION);
		});

		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) dropTl.progress(1);

		const handleMouseMove = (e: PointerEvent) => {
			if (isDropping) return;
			//과부화 방지
			if (Date.now() - lastWaveTime < waveThrottle) return;
			lastWaveTime = Date.now();

			if (rippleFrameId) return;

			rippleFrameId = requestAnimationFrame(() => {
				rippleFrameId = null;
				const rect = poolRef.current?.getBoundingClientRect();
				if (!poolRef.current || !turbWave || !dispMap || !rect) return;

				const x = (e.clientX - rect.left) / rect.width;
				const y = (e.clientY - rect.top) / rect.height;

				gsap.to(turbWave, {
					attr: {baseFrequency: `${0.01 + y * 0.02} ${0.04 + x * 0.04}`},
					duration: 0.2,
					ease: "none",
				});

				gsap.to(dispMap, {
					attr: {scale: 6 + y * 15},
					duration: 0.2,
					ease: "none",
				});
			});
		};

		const handleMouseLeave = () => {
			turbWave?.setAttribute("baseFrequency", "0.01 0.03");
			dispMap?.setAttribute("scale", "2");
		};

		poolRef.current.addEventListener("pointermove", handleMouseMove);
		poolRef.current.addEventListener("pointerleave", handleMouseLeave);

		return () => {
			observer.kill();
			waveTl.kill();
			dropTl.kill();
			tweenRef.current = {};
			//shadowElRef.current = {};

			poolRef.current?.removeEventListener("pointermove", handleMouseMove);
			poolRef.current?.removeEventListener("pointerleave", handleMouseLeave);
			if (moveCharsFrameId) cancelAnimationFrame(moveCharsFrameId);
			if (rippleFrameId) cancelAnimationFrame(rippleFrameId);
		};
	}, [charPositions, allLoaded]);

	// 이미지를 (dx, dy)만큼 옮기려 할 때 수영장 내부를 벗어나지 않도록 보정된 이동량 반환
	// 스크롤하면 뷰포트 좌표가 바뀌므로 수영장 영역은 매번 새로 측정
	function getClampedMove(el: HTMLElement, dx: number, dy: number) {
		const pool = poolRef.current;
		if (!pool) return {x: 0, y: 0};

		const rect = pool.getBoundingClientRect();
		const scale = rect.width / pool.offsetWidth || 1; //부모가 scale된 경우 대비
		const border = pool.clientLeft * scale;
		const BUFFER_MARGIN = border / 4; //수영장 상단 테두리만 원근법을 위해 추가 두께가 부여되었기 때문에 그걸 반영

		// 회전해도 이미지가 테두리를 넘지 않도록 회전 무관한 외접원 반지름으로 계산 (offsetWidth는 transform 영향 없음)
		const radius = (Math.hypot(el.offsetWidth, el.offsetHeight) / 2) * scale;

		// 회전 중에도 중심점은 변하지 않으므로 중심 기준으로 clamp
		const b = el.getBoundingClientRect();
		const cx = b.left + b.width / 2;
		const cy = b.top + b.height / 2;

		const clamp = (v: number, min: number, max: number) => (min > max ? (min + max) / 2 : Math.min(Math.max(v, min), max));
		const newCx = clamp(cx + dx, rect.left + border + radius, rect.right - border - radius);
		const newCy = clamp(cy + dy, rect.top + border + BUFFER_MARGIN + radius, rect.bottom - border - radius);

		return {x: newCx - cx, y: newCy - cy};
	}

	//이미지 위치 강제 리셋
	function resetCharAndShadowTransforms(container: HTMLElement) {
		const allChars = container.querySelectorAll<HTMLElement>(".char");
		allChars.forEach(char => {
			gsap.set(char, {x: 0, y: 0, rotation: 0});
		});

		shadowElRef.current = {};

		const allShadows = container.querySelectorAll<HTMLElement>(".shadow");
		allShadows.forEach(shadow => {
			gsap.set(shadow, {x: 0, y: 0});

			//그림자 요소를 캐싱 (나중에 애니메이션 부여할때 따로 호출 안 해도 되게)
			const id = shadow.dataset.id;
			if (!id) return;

			shadowElRef.current[id] = shadow;
		});
	}

	// 아이템 착지 지점에 퍼지는 물결 링과 튀는 물방울 생성 (애니메이션 끝나면 제거)
	function splash(el: HTMLElement) {
		const pool = poolRef.current;
		const ringLayer = ringLayerRef.current;
		const dropLayer = dropLayerRef.current;
		if (!pool || !ringLayer || !dropLayer) return;

		// 레이어는 수영장 padding box 기준이므로 뷰포트 좌표를 레이어 좌표로 변환
		const rect = pool.getBoundingClientRect();
		const scale = rect.width / pool.offsetWidth || 1;
		const b = el.getBoundingClientRect();
		const cx = (b.left + b.width / 2 - rect.left) / scale - pool.clientLeft;
		const cy = (b.top + b.height / 2 - rect.top) / scale - pool.clientTop;
		const size = el.offsetWidth;

		const spawn = (layer: HTMLElement, className: string, px: number) => {
			const node = document.createElement("div");
			node.className = className;
			node.style.width = node.style.height = `${px}px`;
			node.style.left = `${cx}px`;
			node.style.top = `${cy}px`;
			layer.appendChild(node);
			gsap.set(node, {xPercent: -50, yPercent: -50});
			return node;
		};

		// 물결 링: 시간차로 3겹 퍼짐
		for (let i = 0; i < 3; i++) {
			const ring = spawn(ringLayer, "splash-ring", size);
			gsap.fromTo(
				ring,
				{scale: 0.4, opacity: 0.4},
				{scale: 1.6 + i * 0.5, opacity: 0, duration: 1.4 + i * 0.3, delay: i * 0.18, ease: "power2.out", onComplete: () => ring.remove()},
			);
		}

		// 물방울: 사방으로 튀었다가 (위에서 보는 시점이라 커졌다 작아짐) 사라짐
		const DROP_COUNT = 6;
		for (let i = 0; i < DROP_COUNT; i++) {
			const drop = spawn(dropLayer, "splash-drop", gsap.utils.random(4, 8));
			const angle = (i / DROP_COUNT) * Math.PI * 2 + gsap.utils.random(-0.3, 0.3);
			const dist = size * gsap.utils.random(0.4, 0.7);
			const duration = gsap.utils.random(0.5, 0.8);
			gsap
				.timeline({defaults: {overwrite: false}, onComplete: () => drop.remove()}) //같은 물방울에 x/y와 scale tween이 동시에 걸리므로 overwrite 끔
				.to(drop, {x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, duration, ease: "power2.out"}, 0)
				.fromTo(drop, {scale: 0.5}, {scale: 1.6, duration: duration / 2, ease: "power1.out"}, 0)
				.to(drop, {scale: 0.3, opacity: 0, duration: duration / 2, ease: "power1.in"}, duration / 2);
		}
	}

	//랜덤 배치로 테두리 밖에 놓인 이미지를 수영장 안으로 옮김 (그림자도 같이)
	function clampAllChars(container: HTMLElement) {
		container.querySelectorAll<HTMLElement>(".char").forEach(el => {
			const {x, y} = getClampedMove(el, 0, 0);
			gsap.set(el, {x, y});

			const id = el.className.match(/char-(\S+)/)?.[1];
			const shadow = id ? shadowElRef.current[id] : null;
			if (shadow) gsap.set(shadow, {x, y});
		});
	}

	return (
		<div ref={poolRef} className="pool">
			<svg width="0" height="0">
				<defs>
					<filter id="turb">
						<feTurbulence id="turbwave" type="fractalNoise" baseFrequency={POOL_TURBULENCE.baseFrequency} numOctaves="1" result="turbulence" />
						<feDisplacementMap id="dispMap" in="SourceGraphic" in2="turbulence" scale={POOL_TURBULENCE.scale} />
					</filter>
				</defs>
			</svg>
			<div ref={ringLayerRef} className="splash-layer rings" />
			<div ref={dropLayerRef} className="splash-layer drops" />
			{!allLoaded && (
				<div className="w-1/2 h-2 rounded-full bg-white/40 overflow-hidden z-20" role="progressbar" aria-valuemin={0} aria-valuemax={totalChars} aria-valuenow={loadedCount}>
					<div className="h-full bg-white transition-[width] duration-300" style={{width: `${(loadedCount / totalChars) * 100}%`}} />
				</div>
			)}
			{/* <span className="pool-intro lowercase max-w-10/12 text-md md:text-5xl">hover to disturb</span> */}
			{charPositions &&
				Object.keys(stacks).map(k => {
					const {x, y} = charPositions[k] || {x: 0, y: 0};

					return (
						<Fragment key={k}>
							<Image
								src={`/icons/${k}.png`}
								alt={k}
								draggable={false}
								className={`char char-${k} ${k}`}
								width={100}
								height={100}
								onLoad={() => setLoadedChars(prev => ({...prev, [k]: true}))}
								onError={() => setLoadedChars(prev => ({...prev, [k]: true}))} //실패해도 로딩 바가 멈추지 않도록
								style={{
									top: `${y}%`,
									left: `${x}%`,
									visibility: "hidden", //등장 애니메이션(dropTl)에서 보이게 처리
								}}
							/>
							<div
								ref={el => {
									if (el) shadowElRef.current[k] = el;
								}}
								data-id={k}
								className={`shadow shadow-${k}`}
								style={{
									top: `calc(${y}% + 20%)`,
									left: `calc(${x}% - 3%)`,
									visibility: "hidden", //등장 애니메이션(dropTl)에서 보이게 처리
								}}
							></div>
						</Fragment>
					);
				})}
		</div>
	);
}
