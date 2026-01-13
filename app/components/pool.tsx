"use client";
import {Fragment, useEffect, useRef} from "react";
import {stacks, MARGIN_SIZE, GSAP_OPTION} from "../lib/constants";
import {getRandomInt, debounce} from "../lib/tools";
import Image from "next/image";
import gsap from "gsap";
import {Observer} from "gsap/Observer";

export default function Pool() {
	const poolRef = useRef<HTMLDivElement | null>(null);
	const poolRectRef = useRef<{left: number; right: number; top: number; bottom: number} | null>(null); //테두리를 제외한 내부 영역
	const charPositionsRef = useRef<Record<string, {x: number; y: number}>>({});
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

		const debouncedResize = debounce(() => {
			measurePool();

			// 컴포넌트 언마운트시 모든 char 위치 초기화
			if (!poolRef.current) return;
			resetCharAndShadowTransforms(poolRef.current);
			initializeCharPositions(poolRef.current, stacks);
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
		if (!poolRef.current) return;

		measurePool();
		resetCharAndShadowTransforms(poolRef.current);
		initializeCharPositions(poolRef.current, stacks);

		gsap.defaults({overwrite: true});

		//과부화 방지용 쓰로틀 추가
		let lastMoveTime = 0;
		const moveThrottle = 40;

		let moveCharsFrameId: number | null = null;

		function moveChars({event, deltaX, deltaY}: {event: Event; deltaX: number; deltaY: number}) {
			if (moveCharsFrameId) return;

			const poolRect = poolRectRef.current;

			if (!poolRect) return;

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
				let newX = charBounds.left + deltaX * t;
				let newY = charBounds.top + deltaY * t;

				//이미지는 회전하기 때문에 w/h를 나누는 의미가 없음. 평균 값을 사용해서 계산하자
				const IMAGE_SIZE = (charBounds.width + charBounds.height) / 2;

				// newX/newY는 좌상단 기준이므로, 경계도 좌상단 기준으로 clamp
				if (newX < poolRect.left) newX = poolRect.left;
				if (newX + IMAGE_SIZE > poolRect.right) newX = poolRect.right - IMAGE_SIZE;

				if (newY < poolRect.top) newY = poolRect.top;
				if (newY + IMAGE_SIZE > poolRect.bottom) newY = poolRect.bottom - IMAGE_SIZE;

				const xMovement = newX - charBounds.left;
				const yMovement = newY - charBounds.top;

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
	}, [stacks]);

	function measurePool() {
		if (!poolRef.current) return;

		const rect = poolRef.current.getBoundingClientRect();

		const borderPx = Math.min(window.innerWidth, window.innerHeight) * MARGIN_SIZE;
		const BUFFER_MARGIN = borderPx / 4; //수영장 상단 테두리만 원근법을 위해 추가 두께가 부여되었기 때문에 그걸 반영

		// border를 제외한 내부 영역
		poolRectRef.current = {
			top: rect.top + borderPx + BUFFER_MARGIN,
			left: rect.left + borderPx,
			right: rect.right - borderPx,
			bottom: rect.bottom - borderPx,
		};
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

	//이미지를 매번 랜덤한 위치에 배치
	function initializeCharPositions(container: HTMLElement, stacks: Record<string, any>) {
		Object.keys(stacks).forEach(key => {
			if (!charPositionsRef.current[key]) {
				charPositionsRef.current[key] = {
					x: getRandomInt(40),
					y: getRandomInt(40),
				};
			}
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
			{Object.keys(charPositionsRef.current).length > 0 &&
				Object.keys(stacks).map(k => {
					const {x, y} = charPositionsRef.current[k] || {x: 0, y: 0};

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
