"use client";
import {Fragment, useEffect, useRef, useState} from "react";
import {stacks, GSAP_OPTION} from "../lib/constants";
import {getRandomInt, debounce} from "../lib/tools";
import Image from "next/image";
import gsap from "gsap";
import {Observer} from "gsap/Observer";

export default function Pool() {
	const poolRef = useRef<HTMLDivElement | null>(null);
	// 랜덤 위치는 hydration 불일치를 피하기 위해 마운트 후 state로 생성 (state라서 생성 후 리렌더됨)
	const [charPositions, setCharPositions] = useState<Record<string, {x: number; y: number}> | null>(null);
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
		if (!poolRef.current || !charPositions) return;

		resetCharAndShadowTransforms(poolRef.current);
		clampAllChars(poolRef.current);

		gsap.defaults({overwrite: true});

		//과부화 방지용 쓰로틀 추가
		let lastMoveTime = 0;
		const moveThrottle = 40;

		let moveCharsFrameId: number | null = null;

		function moveChars({event, deltaX, deltaY}: {event: Event; deltaX: number; deltaY: number}) {
			if (moveCharsFrameId) return;

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

		const handleMouseMove = (e: PointerEvent) => {
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
			tweenRef.current = {};
			//shadowElRef.current = {};

			poolRef.current?.removeEventListener("pointermove", handleMouseMove);
			poolRef.current?.removeEventListener("pointerleave", handleMouseLeave);
			if (moveCharsFrameId) cancelAnimationFrame(moveCharsFrameId);
			if (rippleFrameId) cancelAnimationFrame(rippleFrameId);
		};
	}, [charPositions]);

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
						<feTurbulence id="turbwave" type="fractalNoise" baseFrequency="0.03 0.08" numOctaves="1" result="turbulence" />
						<feDisplacementMap id="dispMap" in="SourceGraphic" in2="turbulence" scale="10" />
					</filter>
				</defs>
			</svg>
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
								style={{
									top: `${y}%`,
									left: `${x}%`,
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
								}}
							></div>
						</Fragment>
					);
				})}
		</div>
	);
}
