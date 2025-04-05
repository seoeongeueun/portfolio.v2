"use client";
import Image from "next/image";
import Link from "next/link";
import {MdKeyboardDoubleArrowDown} from "react-icons/md";
import TextEn from "./data/text-en.json" assert {type: "json"};
import TextKr from "./data/text-kr.json" assert {type: "json"};
import {Fragment, useEffect, useState, useRef, useCallback, useLayoutEffect} from "react";
import Cartridge from "./components/cartridge";
import Gameboy from "./components/gameboy";
import ProjectsData from "./data/projects.json" assert {type: "json"};
import CareerData from "./data/careers.json" assert {type: "json"};
import "./styles/global.scss";
import "./styles/gsap.scss";
import {stacks, PARTICLE_SIZE, AMPLIFY_BY, BORDER_END, FILL_END, DUST_TIMING} from "./lib/constants";
import gsap from "gsap";
import {Observer} from "gsap/Observer";
import {ScrollTrigger} from "gsap/ScrollTrigger";
import {Draggable} from "gsap/Draggable";
import html2canvas from "html2canvas";
import {Swiper, SwiperSlide} from "swiper/react";
import {Pagination, Autoplay} from "swiper/modules";
import {Swiper as SwiperClass} from "swiper/types";
import {waitForAllImagesToLoad, sleep, lockScroll, unlockScroll, getRandomInt, throttle, debounce, preventScroll} from "./lib/tools";
import "swiper/css";
import "swiper/css/pagination";

gsap.registerPlugin(Observer);
gsap.registerPlugin(ScrollTrigger);
gsap.registerPlugin(Draggable);

type TextFileType = Record<string, string>;
export interface Project {
	title: string;
	subtitle: string;
	thumbnail: string;
	route: string;
	tags: string[];
	theme: string;
	stacks: string[];
	images: string[];
	contribution_kr: string[];
	introduction_kr: string[];
	ppl_count: number;
	links: Record<string, string>[];
	dark?: boolean;
	review_kr?: string[];
}

interface Projects {
	[key: string]: Project;
}

export default function Home() {
	const [isEnglish, setIsEnglish] = useState<boolean>(true);
	const [textFile, setTextFile] = useState<TextFileType>(TextEn);
	const [projects, setProjects] = useState<Projects>(ProjectsData);
	const [tags, setTags] = useState<string[]>(["WORK", "PERSONAL"]);
	const [selectedProject, setSelectedProject] = useState<Project>();
	const [isGameboyOn, setIsGameboyOn] = useState<boolean>(false);
	const [isSpecialSlide, setIsSpecialSlide] = useState<boolean>(false);
	const [isSectionReady, setIsSectionReady] = useState<boolean>(false);
	const [headerOpen, setHeaderOpen] = useState<boolean>(false);
	const [showMessage, setShowMessage] = useState<boolean>(true);

	const poolRef = useRef<HTMLDivElement | null>(null);
	const poolRectRef = useRef<DOMRect | null>(null);
	const pseudoRectRef = useRef<{left: number; right: number; top: number; bottom: number} | null>(null);
	const charPositionsRef = useRef<Record<string, {x: number; y: number}>>({});

	const mainRef = useRef<HTMLDivElement>(null);
	const shoreRef = useRef<HTMLDivElement>(null);
	const towelsRef = useRef<HTMLDivElement>(null);
	const cartridgeCardsContainerRef = useRef<HTMLDivElement>(null);
	const cartridgeCardsRef = useRef<HTMLDivElement>(null);
	const mainTitleRef = useRef<HTMLParagraphElement>(null);
	const miniTitleRef = useRef<HTMLParagraphElement>(null);
	const beachRef = useRef<HTMLDivElement>(null);
	//해변의 dust 단계를 저장
	const dustState = useRef<{
		dustCanvas: HTMLCanvasElement | null;
		dustCtx: CanvasRenderingContext2D | null;
		dustReady: boolean;
		dustRemoved: boolean;
		dustTriggered: boolean;
		particles: any[];
		rafId: number | null;
		scrollTriggers: ScrollTrigger[];
	}>({
		dustCanvas: null,
		dustCtx: null,
		dustReady: false,
		dustRemoved: false,
		dustTriggered: false,
		particles: [],
		rafId: null,
		scrollTriggers: [],
	});
	const projectDetailRef = useRef<HTMLDivElement>(null);
	const swiperReadyRef = useRef<{
		promise: Promise<void>;
		resolve: () => void;
	} | null>(null);
	const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

	//pseudo element의 너비를 계산하는 함수
	const getPseudoBounds = (element: HTMLElement, pseudo: "::before" | "::after") => {
		const style = window.getComputedStyle(element, pseudo);
		const width = parseFloat(style.width);
		const height = parseFloat(style.height);
		const top = element.getBoundingClientRect().top + parseFloat(style.top);
		const left = element.getBoundingClientRect().left + parseFloat(style.left);
		return {top, left, right: left + width, bottom: top + height, width, height};
	};

	function measurePool() {
		if (!poolRef.current) return;
		poolRectRef.current = poolRef.current.getBoundingClientRect();
		pseudoRectRef.current = getPseudoBounds(poolRef.current, "::before");
	}

	function resetCharAndShadowTransforms(container: HTMLElement) {
		const allChars = container.querySelectorAll<HTMLElement>(".char");
		allChars.forEach(char => {
			gsap.set(char, {x: 0, y: 0, rotation: 0});
		});

		const allShadows = container.querySelectorAll<HTMLElement>(".shadow");
		allShadows.forEach(shadow => {
			gsap.set(shadow, {x: 0, y: 0});
		});
	}

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

	//첫 시작부터 필요한 함수들
	useEffect(() => {
		const isKorean = navigator.language.startsWith("ko");
		setIsEnglish(!isKorean);

		if (!poolRef.current) return;

		const debouncedResize = debounce(() => {
			measurePool();

			// 모든 char 위치 초기화
			if (!poolRef.current) return;
			resetCharAndShadowTransforms(poolRef.current);
			initializeCharPositions(poolRef.current, stacks);
		}, 200);

		window.addEventListener("resize", debouncedResize);

		return () => {
			window.removeEventListener("resize", debouncedResize);
			timeoutsRef.current.forEach(t => clearTimeout(t));
			timeoutsRef.current = [];
		};
	}, []);

	useEffect(() => {
		let timeoutId: ReturnType<typeof setTimeout> | null = null;

		const checkScrollIdle = () => {
			const scrollTop = window.scrollY || document.documentElement.scrollTop;
			const scrollHeight = document.documentElement.scrollHeight;
			const windowHeight = window.innerHeight;

			const isAtTop = scrollTop === 0;
			const isNotAtBottom = scrollTop < scrollHeight - windowHeight;

			if ((isAtTop || isNotAtBottom) && !showMessage) {
				setShowMessage(true);
			}
		};

		const handleScroll = debounce(() => {
			const scrollTop = window.scrollY || document.documentElement.scrollTop;
			const scrollHeight = document.documentElement.scrollHeight;
			const windowHeight = window.innerHeight;

			const isNotAtTop = scrollTop > 0;
			const isAtBottom = scrollTop >= scrollHeight - windowHeight;

			if ((isNotAtTop || isAtBottom) && showMessage) {
				setShowMessage(false);
			}

			if (timeoutId) clearTimeout(timeoutId);
			timeoutId = setTimeout(checkScrollIdle, 4000); //4초간 모션 없는 경우
		}, 200);

		timeoutId = setTimeout(checkScrollIdle, 4000);

		window.addEventListener("scroll", handleScroll);

		return () => {
			window.removeEventListener("scroll", handleScroll);
			if (timeoutId) clearTimeout(timeoutId);
		};
	}, [showMessage]);

	useEffect(() => {
		if (isEnglish) {
			setTextFile(TextEn);
		} else {
			setTextFile(TextKr);
		}
	}, [isEnglish]);

	useEffect(() => {
		const waveTl = gsap.timeline({repeat: 1, yoyo: true, ease: "power3.inOut"});
		waveTl
			.to("#dispShore", {
				attr: {scale: 50},
				scrollTrigger: {
					trigger: ".main-page",
					start: "top top",
					end: "bottom top",
					scrub: 0.3,
				},
			})
			.to("#turbShore", {
				attr: {baseFrequency: "0.02 0.08"},
				scrollTrigger: {
					trigger: ".main-page",
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

		function moveChars({event, deltaX, deltaY}: {event: MouseEvent; deltaX: number; deltaY: number}) {
			if (moveCharsFrameId) return;
			measurePool();
			const poolRect = poolRectRef.current;
			const pseudoRect = pseudoRectRef.current;

			if (!poolRect || !pseudoRect) return;

			//시간으로 throttle 계산
			if (Date.now() - lastMoveTime < moveThrottle) return;
			lastMoveTime = Date.now();

			moveCharsFrameId = requestAnimationFrame(() => {
				moveCharsFrameId = null;

				const el = event.target as HTMLElement;
				const id = el.classList.contains("char") ? el.className.match(/char-(\S+)/)?.[1] : null;
				if (!id || !poolRef.current) return;

				const shadow = document.querySelector(`.shadow-${id}`) as HTMLElement;
				const charBounds = el.getBoundingClientRect();

				const t = 3; //이동 강도
				let newX = charBounds.left + deltaX * t;
				let newY = charBounds.top + deltaY * t;

				const vmin = Math.min(window.innerWidth, window.innerHeight);
				const yMargin = (vmin * 4) / 100;
				const xMargin = (vmin * 12) / 100;

				const width = charBounds.width;
				const height = charBounds.height;

				if (!poolRect || !pseudoRect) return;

				if (newX < poolRect.left + xMargin) newX = poolRect.left + xMargin;
				if (newX + width > pseudoRect.right - xMargin) newX = pseudoRect.right - xMargin - width;
				if (newY < poolRect.top + yMargin) newY = poolRect.top + yMargin;
				if (newY + height > poolRect.bottom - yMargin) newY = poolRect.bottom - height - yMargin;

				const xMovement = newX - charBounds.left;
				const yMovement = newY - charBounds.top;

				gsap.to(el, {
					x: `+=${xMovement}`,
					y: `+=${yMovement}`,
					rotation: `-=${deltaX * 1.2 * Math.sign(event.clientY - (charBounds.top + charBounds.height / 2))}`,
					duration: 3,
					ease: "expo.out",
				});

				if (shadow) {
					gsap.to(shadow, {
						x: `+=${xMovement}`,
						y: `+=${yMovement}`,
						duration: 3,
						ease: "expo.out",
					});
				}
			});
		}

		//마우스 드래그
		const observer = Observer.create({
			target: poolRef.current,
			onMove: self => {
				const mouseEvent = self.event as MouseEvent;
				if (self.event instanceof MouseEvent && self.event.target instanceof HTMLElement && self.event.target.matches(".char")) {
					moveChars({
						event: mouseEvent,
						deltaX: self.deltaX,
						deltaY: self.deltaY,
					});
				}
			},
		});

		let rippleFrameId: number | null = null;
		let lastWaveTime = 0;
		const waveThrottle = 50;

		const turbWave = document.querySelector("#turbwave");
		const dispMap = document.querySelector("#dispMap");

		const handleMouseMove = (e: MouseEvent) => {
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

		poolRef.current.addEventListener("mousemove", handleMouseMove);
		poolRef.current.addEventListener("mouseleave", handleMouseLeave);

		return () => {
			observer.kill();
			waveTl.kill();
			poolRef.current?.removeEventListener("mousemove", handleMouseMove);
			poolRef.current?.removeEventListener("mouseleave", handleMouseLeave);
			if (moveCharsFrameId) cancelAnimationFrame(moveCharsFrameId);
			if (rippleFrameId) cancelAnimationFrame(rippleFrameId);
		};
	}, [stacks]);

	//dust 상태를 초기화하는 함수
	const cleanupDustEffect = useCallback(() => {
		const ds = dustState.current;
		ds.scrollTriggers.forEach(st => st.kill());
		ds.scrollTriggers = [];

		if (ds.rafId != null) {
			cancelAnimationFrame(ds.rafId);
			ds.rafId = null;
		}

		if (ds.dustCanvas) {
			ds.dustCanvas.remove();
			ds.dustCanvas = null;
		}
		ds.dustCtx = null;
		ds.dustReady = false;
		ds.dustRemoved = false;
		ds.dustTriggered = false;
		ds.particles = [];
	}, []);

	//해변 div를 고정하고 비치타월 페이드인 스크롤 + 해변 픽셀화
	const initDustEffect = useCallback(() => {
		cleanupDustEffect();

		if (!beachRef.current || !shoreRef.current || !towelsRef.current || !dustState.current) return;

		const towels = Array.from(towelsRef.current.querySelectorAll<HTMLElement>(".towel-wrapper"));
		if (towels.length === 0) return;

		const ds = dustState.current;

		const totalTowels = Object.keys(CareerData).length;
		const towelsHeight = towels[0].offsetHeight;
		const gap = parseFloat(getComputedStyle(towels[0]).marginTop);
		const scrollPerTowel = towelsHeight + gap;
		//const totalTowelDistance = scrollPerTowel * totalTowels;
		const totalScrollDistance = towelsRef.current.offsetHeight;

		let currentDustProgress = 0;
		let smoothedDustProgress = 0;

		function animateDust() {
			ds.rafId = requestAnimationFrame(animateDust);
			smoothedDustProgress += (currentDustProgress - smoothedDustProgress) * 0.05;
			if (ds.dustReady) drawDust(smoothedDustProgress);
		}

		const createDust = async (currentY: number) => {
			if (!beachRef.current) return;
			//towel이 이동한 값을 가져와서 반영 20은 미세 보정
			towelsRef.current!.style.transform = `translateY(${currentY - gap - 20}px)`;

			const canvas = await html2canvas(beachRef.current!, {
				backgroundColor: null,
				scale: 1,
			});

			const srcCtx = canvas.getContext("2d");
			if (!srcCtx) return;

			const {width, height} = canvas;
			const data = srcCtx.getImageData(0, 0, width, height).data;

			ds.particles = [];

			ds.dustCanvas = document.createElement("canvas");
			ds.dustCanvas.width = width;
			ds.dustCanvas.height = height;
			ds.dustCanvas.style.position = "fixed";
			ds.dustCanvas.style.top = `${beachRef.current.offsetTop}px`;
			ds.dustCanvas.style.left = `${beachRef.current.offsetLeft}px`;
			ds.dustCanvas.style.width = `${beachRef.current.offsetWidth}px`;
			ds.dustCanvas.style.height = `${beachRef.current.offsetHeight}px`;
			ds.dustCanvas.style.zIndex = "99";
			ds.dustCanvas.style.pointerEvents = "none";
			beachRef.current.parentElement!.insertBefore(ds.dustCanvas, beachRef.current);

			ds.dustCtx = ds.dustCanvas.getContext("2d") || null;

			for (let y = 0; y < height; y += PARTICLE_SIZE) {
				for (let x = 0; x < width; x += PARTICLE_SIZE) {
					const i = (y * width + x) * 4;
					const r = data[i];
					const g = data[i + 1];
					const b = data[i + 2];
					const a = data[i + 3];
					if (a > 0) {
						ds.particles.push({
							x,
							y,
							dx: (Math.random() - 0.5) * 300,
							dy: (Math.random() - 1) * 500,
							r,
							g,
							b,
							a: a / 255,
							delay: Math.random() * 0.2,
						});
					}
				}
			}
			ds.dustReady = true;
			ds.dustRemoved = false;
			ds.dustCanvas.style.display = "block";
		};

		const drawDust = (dustProgress: number) => {
			if (!ds.dustCtx || !ds.dustCanvas) return;

			const {width, height} = ds.dustCanvas;
			ds.dustCtx.clearRect(0, 0, width, height);
			//const dustProgress = gsap.utils.clamp(0, 1, (progress - DUST_TIMING) * AMPLIFY_BY);

			const clampedDust = gsap.utils.clamp(0, 1, dustProgress);
			//color를 칠하는 단계가 마무리 되었으면 원래 beachref div를 투명 처리
			beachRef.current!.style.opacity = dustProgress >= FILL_END ? "0" : "1";

			ds.particles.forEach(p => {
				const localProgress = gsap.utils.clamp(0, 1, (clampedDust - p.delay) / (1 - p.delay));
				const alpha = p.a * 1.7;

				const fillStrength = Math.min(Math.max((localProgress - BORDER_END) / (FILL_END - BORDER_END), 0), 1);
				const moveStrength = Math.min(Math.max((localProgress - FILL_END) / (1 - FILL_END), 0), 1);
				const x = p.x + p.dx * moveStrength;
				const y = p.y + p.dy * moveStrength;

				//채워진 정도에 따라 alpha 조절
				const fadeAlpha = alpha * (1 - moveStrength);
				const fillAlpha = alpha * fillStrength * (1 - moveStrength);

				if (fillStrength > 0 && ds.dustCtx) {
					ds.dustCtx.fillStyle = `rgba(${p.r},${p.g},${p.b},${fillAlpha})`;
					ds.dustCtx.fillRect(x, y, PARTICLE_SIZE, PARTICLE_SIZE);
				}

				const borderAlphaStrength = Math.min(Math.max(localProgress / BORDER_END, 0), 1);
				const borderAlpha = fadeAlpha * borderAlphaStrength * 0.3;

				// border는 항상 그리되 이동된 위치에만
				ds.dustCtx!.strokeStyle = `rgba(0,0,0,${borderAlpha})`;
				ds.dustCtx!.strokeRect(x, y, PARTICLE_SIZE, PARTICLE_SIZE);
			});
		};

		const st = ScrollTrigger.create({
			trigger: beachRef.current,
			start: "top top",
			end: `+=${totalScrollDistance}`,
			pin: true,
			pinSpacing: false,
			toggleActions: "play reverse play reverse",
			onUpdate: self => {
				const progress = self.progress;
				const towelProgress = gsap.utils.clamp(0, 1, progress * AMPLIFY_BY);

				// towel 움직임
				gsap.to(towelsRef.current, {
					y: -towelProgress * scrollPerTowel * totalTowels,
					overwrite: true,
					ease: "none",
				});

				towels.forEach((towel, i) => {
					const revealStart = i / totalTowels;
					const revealEnd = (i + 1) / totalTowels;
					let fadeProgress = (towelProgress - revealStart) / (revealEnd - revealStart);
					fadeProgress = gsap.utils.clamp(0, 1, fadeProgress);

					gsap.to(towel, {
						autoAlpha: fadeProgress + 0.3,
						y: 50 - 50 * fadeProgress,
						overwrite: true,
						ease: "power2.out",
						duration: 0.1,
					});
				});

				//power2.inOut로 초반~중반 천천히, 후반 빠르게
				currentDustProgress = gsap.parseEase("power2.inOut")(gsap.utils.clamp(0, 1, (progress - DUST_TIMING) * AMPLIFY_BY));

				if (ds.dustReady) {
					drawDust(currentDustProgress);
				}

				// dust 캔버스 생성 예약 (부하 줄이기 위해 setTimeout)
				if (progress >= DUST_TIMING && !ds.dustReady && !ds.dustTriggered) {
					ds.dustTriggered = true;

					// requestAnimationFrame(() => {
					// 	setTimeout(() => {
					// 		const targetY = -towelProgress * scrollPerTowel * totalTowels;
					// 		createDust(targetY);
					// 	}, 320);
					// });
					const targetY = -towelProgress * scrollPerTowel * totalTowels;
					createDust(targetY);
				}

				if (currentDustProgress === 0 && !ds.dustRemoved) {
					ds.dustCanvas?.remove();
					ds.dustCanvas = null;
					ds.dustCtx = null;
					ds.dustReady = false;
					ds.dustRemoved = true;
					ds.particles = [];
					towelsRef.current!.style.transform = "";
				}

				if (progress < DUST_TIMING && ds.dustTriggered) {
					ds.dustTriggered = false;
				}
			},
			onLeaveBack: () => {
				//beachRef.current!.style.opacity = "1";
				ds.dustCanvas?.remove();
				ds.dustCanvas = null;
				ds.dustCtx = null;
				ds.dustReady = false;
				ds.dustRemoved = true;
				ds.dustTriggered = false;
				ds.particles = [];
			},
			onLeave: () => {
				beachRef.current!.style.opacity = "0";
			},
		});

		ds.scrollTriggers.push(st);

		//ds.rafId = requestAnimationFrame(animateDust);
	}, [cleanupDustEffect]);

	useEffect(() => {
		initDustEffect();

		//리사이즈시 새로 dust 적용
		const debouncedResize = debounce(() => {
			initDustEffect();
		}, 300);

		window.addEventListener("resize", debouncedResize);

		return () => {
			window.removeEventListener("resize", debouncedResize);
			cleanupDustEffect();
		};
	}, [initDustEffect, cleanupDustEffect]);

	//호버 중인 비치타올에 turbulence 지정
	useEffect(() => {
		const allTowels = document.querySelectorAll<HTMLDivElement>(".towel");

		allTowels.forEach(towel => {
			const i = towel.getAttribute("data-towel-index");
			if (!i) return;

			const turb = document.querySelector<SVGElement>(`#turbTowel-${i}`);
			const disp = document.querySelector<SVGElement>(`#wibble-${i} feDisplacementMap`);
			if (!turb || !disp) return;

			let frame = 0;
			let animating = false;

			function animateWiggle() {
				if (!animating) return;
				frame += 0.03;

				const x = 0.002 + Math.sin(frame) * 0.001;
				const y = 0.003 + Math.cos(frame) * 0.001;

				turb?.setAttribute("baseFrequency", `${x} ${y}`);
				requestAnimationFrame(animateWiggle);
			}

			function startWibble() {
				if (animating) return;
				animating = true;
				animateWiggle();
				disp?.setAttribute("scale", "50");
			}

			function stopWibble() {
				animating = false;
				turb?.setAttribute("baseFrequency", `0.002 0.003`);
				disp?.setAttribute("scale", "0");
			}

			towel.addEventListener("mouseenter", () => {
				startWibble();
			});

			towel.addEventListener("mouseleave", () => {
				//highlighted가 들어간 경우는 마우스와 상관 없이 wibble
				if (!towel.classList.contains("highlighted")) {
					stopWibble();
				}
			});

			//hightlihgted 클래스가 들어갔는지 감지
			const observer = new MutationObserver(() => {
				if (towel.parentElement?.classList.contains("highlighted")) {
					startWibble();
				} else if (!towel.matches(":hover")) {
					stopWibble();
				}
			});
			if (towel.parentElement) observer.observe(towel.parentElement, {attributes: true, attributeFilter: ["class"]});
		});
	}, []);

	//카트리지 카드 wrapper에 마우스 드래그 스크롤 기능 추가
	useEffect(() => {
		const parentContainer = cartridgeCardsContainerRef.current;
		if (!parentContainer) return;

		let isDragging = false;
		let startX = 0;
		let scrollLeft = 0;
		let dragDistance = 0;

		const onMouseDown = (e: MouseEvent) => {
			isDragging = true;
			startX = e.pageX - parentContainer.offsetLeft;
			scrollLeft = parentContainer.scrollLeft;
			dragDistance = 0;
			parentContainer.classList.add("dragging");
		};

		const onMouseLeave = () => {
			isDragging = false;
			parentContainer.classList.remove("dragging");
		};

		const onMouseUp = () => {
			isDragging = false;
			parentContainer.classList.remove("dragging");
		};

		const onMouseMove = (e: MouseEvent) => {
			if (!isDragging) return;
			e.preventDefault();
			const x = e.pageX - parentContainer.offsetLeft;
			const walk = (x - startX) * 1.5;
			parentContainer.scrollLeft = scrollLeft - walk;
			dragDistance += Math.abs(walk);
		};

		const onClick = (e: MouseEvent) => {
			if (dragDistance > 5) {
				e.stopPropagation();
				e.preventDefault();
			}
		};

		parentContainer.addEventListener("mousedown", onMouseDown);
		parentContainer.addEventListener("mouseleave", onMouseLeave);
		parentContainer.addEventListener("mouseup", onMouseUp);
		parentContainer.addEventListener("mousemove", onMouseMove);
		parentContainer.addEventListener("click", onClick, true);

		return () => {
			parentContainer.removeEventListener("mousedown", onMouseDown);
			parentContainer.removeEventListener("mouseleave", onMouseLeave);
			parentContainer.removeEventListener("mouseup", onMouseUp);
			parentContainer.removeEventListener("mousemove", onMouseMove);
			parentContainer.removeEventListener("click", onClick, true);
		};
	}, []);

	//선택된 카트리지를 돌려보내기
	const handleClearChanges = useCallback(() => {
		const cardsDiv = cartridgeCardsRef.current;
		if (!cardsDiv) return;

		cardsDiv.style.left = "";
		cardsDiv.style.transition = "";
	}, []);

	/* 카트리지 (=통칭 카드) 호버 & 선택 이벤트 관리 */
	const handleCardClick = useCallback(
		(event: React.MouseEvent<HTMLDivElement>, projectKey: string) => {
			const parentContainer = cartridgeCardsContainerRef.current;
			const cardsDiv = cartridgeCardsRef.current;
			const clickedCard = event.currentTarget as HTMLDivElement;
			if (!parentContainer || !cardsDiv) return;

			const rect = clickedCard.getBoundingClientRect();
			if (!rect || !projectKey) return;

			// 선택한 프로젝트 정보 가져오기
			const projectData = ProjectsData[projectKey as keyof typeof ProjectsData];
			if (projectData) setSelectedProject(projectData);

			// swiperReadyRef 갱신
			let resolveFn!: () => void;
			const promise = new Promise<void>(r => (resolveFn = r));
			swiperReadyRef.current = {promise, resolve: resolveFn};

			lockScroll();
			// 이 카드만 더블 클릭 등을 방지
			clickedCard.classList.add("forbid-click");

			// 이미 클릭된 다른 카드들의 "clicked" 클래스 제거
			const allCards = parentContainer.querySelectorAll<HTMLDivElement>(".card");
			allCards.forEach(card => card.classList.remove("clicked"));

			// 선택된 카드를 중앙으로 스크롤하기
			const parentRect = parentContainer.getBoundingClientRect();
			const cardRect = clickedCard.getBoundingClientRect();

			const cardCenterInParentViewport = cardRect.left - parentRect.left + cardRect.width / 2;
			const cardCenterInParentScrollCoords = parentContainer.scrollLeft + cardCenterInParentViewport;
			const windowCenterX = window.innerWidth / 2;
			const desiredDelta = cardCenterInParentScrollCoords - windowCenterX;
			const maxScroll = parentContainer.scrollWidth - parentContainer.clientWidth;
			const currentScroll = parentContainer.scrollLeft;

			let targetScroll = desiredDelta;
			if (targetScroll < 0) targetScroll = 0;
			if (targetScroll > maxScroll) targetScroll = maxScroll;

			parentContainer.scrollTo({
				left: targetScroll,
				behavior: "smooth",
			});

			// 스크롤이 끝났는지 감시하는 함수
			const waitForScrollEnd = () => {
				if (Math.abs(parentContainer.scrollLeft - targetScroll) <= 1) {
					const actualDelta = currentScroll + desiredDelta - targetScroll;
					if (actualDelta !== 0 && Math.round(targetScroll) !== Math.round(desiredDelta)) {
						const computedLeft = getComputedStyle(cardsDiv).left || "0";
						const currentLeft = parseFloat(computedLeft);

						const newLeft = desiredDelta < 0 ? currentLeft + Math.abs(desiredDelta) : currentLeft - actualDelta;

						cardsDiv.style.transition = "left 1s ease-in-out 0.2s";
						cardsDiv.style.left = `${newLeft}px`;
					} else {
						handleClearChanges();
					}
					moveGameboyHead();
				} else {
					requestAnimationFrame(waitForScrollEnd);
				}
			};

			// 게임보이 위치로 카드가 움직이는 애니메이션
			const moveGameboyHead = () => {
				const gameboyHead = document.querySelector<HTMLDivElement>("#gameboy-head");
				if (gameboyHead) {
					const t = setTimeout(() => {
						clickedCard.classList.add("clicked");
						// .top 계산
						const referencePosition = gameboyHead.getBoundingClientRect().top;
						const cardPosition = rect.top;
						const distance = referencePosition - cardPosition - clickedCard.offsetHeight * 0.4;
						clickedCard.style.setProperty("--y-distance", `${distance + 20}px`);
						clickedCard.classList.add("moveY");

						// 카드 애니메이션 끝나면 게임보이 켜기
						const handleAnimationEnd = () => {
							setIsGameboyOn(true);
							clickedCard.removeEventListener("animationend", handleAnimationEnd);
						};
						clickedCard.addEventListener("animationend", handleAnimationEnd);

						// 0.3초 뒤 스크롤을 화면 맨 아래로
						const t2 = setTimeout(() => {
							window.scrollTo({top: document.body.scrollHeight, behavior: "smooth"});
						}, 300);
						timeoutsRef.current.push(t2);
					}, 800);
					timeoutsRef.current.push(t);
				}
			};

			// 만약 delta > maxScroll이면 바로 left를 세팅 + 약간 텀을 두고 애니메이션
			if (desiredDelta > maxScroll) {
				cardsDiv.style.left = `${-1 * desiredDelta}px`;
				const t = setTimeout(() => {
					clickedCard.classList.add("clicked");
					moveGameboyHead();
				}, 500);
				timeoutsRef.current.push(t);
			} else {
				clickedCard.classList.add("clicked");
				requestAnimationFrame(waitForScrollEnd);
			}
		},
		[handleClearChanges]
	);

	/* 메인 페이지 타이틀에 애니메이션 추가 */
	useEffect(() => {
		if (!mainTitleRef.current || !miniTitleRef.current) return;
		const title = mainTitleRef.current;
		const miniTitle = miniTitleRef.current;

		function onTitleAnimationEnd() {
			miniTitle.classList.add("loaded");
			title.removeEventListener("animationend", onTitleAnimationEnd);
		}
		title.addEventListener("animationend", onTitleAnimationEnd);

		return () => {
			title.removeEventListener("animationend", onTitleAnimationEnd);
		};
	}, []);

	const handleProjectsFilter = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		const {name, checked} = e.target;
		setTags(prev => (checked ? [...prev, name.toUpperCase()] : prev.filter(filter => filter !== name.toUpperCase())));
	}, []);

	useEffect(() => {
		if (!tags) {
			setProjects({});
		} else {
			const filteredProjects = Object.entries(ProjectsData)
				.filter(([_, project]) => project.tags.some(tag => tags.includes(tag)))
				.reduce<Projects>((acc, [key, project]) => {
					acc[key] = project;
					return acc;
				}, {});
			setProjects(filteredProjects);
		}
	}, [tags]);

	useEffect(() => {
		if (!selectedProject) {
			swiperReadyRef.current = null;
			setIsGameboyOn(false);
			setIsSectionReady(false);
			return;
		}

		const section = projectDetailRef.current;
		if (!section) return;

		const run = async () => {
			//section 내부 이미지와 swiper가 모두 로딩 되면 준비 완료로 변경 + 최소로 3초는 기다리기
			await Promise.all([waitForAllImagesToLoad(section), swiperReadyRef.current?.promise, sleep(3000)]);

			setIsSectionReady(true);
		};

		run();
	}, [selectedProject]);

	useEffect(() => {
		//프로젝트 상세 페이지가 보여질때 뒷 배경 스크롤 막고 내부 스크롤은 허용
		if (!isSectionReady) {
			document.documentElement.style.overflow = "";
		} else {
			document.documentElement.style.overflow = "hidden";
			unlockScroll();
		}
	}, [isSectionReady]);

	const handleCloseProject = useCallback(() => {
		const section = projectDetailRef.current;
		const cardsDiv = cartridgeCardsRef.current;
		if (!section || !cardsDiv) return;

		handleClearChanges();
		setSelectedProject(undefined);
		const cards = cardsDiv.querySelectorAll<HTMLElement>(":scope > .card");
		cards.forEach(card => {
			card.classList.remove("forbid-click", "moveY", "clicked");
		});
	}, []);

	const usePerformanceMonitor = (label: string) => {
		useEffect(() => {
			const start = performance.now();
			return () => {
				const end = performance.now();
				console.log(`${label}: ${end - start}ms`);
			};
		}, [label]);
	};

	const openHeader = () => {
		setHeaderOpen(prev => !prev);
	};

	useEffect(() => {
		console.log(swiperReadyRef.current);
	}, [swiperReadyRef.current]);

	return (
		<div ref={mainRef} className="main-page text-white w-full h-fit flex flex-col items-center justify-start">
			<div className={`fixed top-0 h-fit main-header pointer-events-none w-full h-fit z-40 flex flex-row-reverse`}>
				<button className="pointer-events-auto w-20 h-20 flex items-center justify-center float-right" onClick={() => openHeader()}>
					<div className="lifebuoy mini hover:rotate-60 transition-transform duration-300"></div>
				</button>
				{headerOpen && (
					<div className="pointer-events-auto contact-box opacity-90 drop-shadow-sm mt-4 bg-theme-orange p-4 w-fit h-fit rounded-sm border border-4 border-white text-white outline-4 outline-theme-orange">
						<div className="flex flex-row items-center mb-1">
							<p className="text-md mr-2 mt-2">CONTACTS</p>
							<Image src="/assets/anchor.svg" alt="anchor" width={15} height={15} />
						</div>
						<Link
							className="text-[1rem] hover:underline underline-offset-2 decoration-white"
							href="https://github.com/seoeongeueun"
							target="__blank"
						>
							github.com/seoeongeueun
						</Link>
						<p className="text-[1rem]">seongeun9901@gmail.com</p>
						<div className="flex flex-row items-center justify-end w-full space-x-4 mt-2">
							<button
								onClick={() => setIsEnglish(false)}
								className={`cursor-pointer ${!isEnglish ? "underline" : ""} hover:underline underline-offset-2 decoration-white`}
							>
								KR
							</button>
							<button
								onClick={() => setIsEnglish(true)}
								className={`cursor-pointer ${isEnglish ? "underline" : ""} hover:underline underline-offset-2 decoration-white`}
							>
								EN
							</button>
						</div>
					</div>
				)}
			</div>
			<section className="pool-section w-full flex flex-col items-center pt-52">
				<div className="flex flex-col justify-center items-center">
					<p ref={miniTitleRef} className="underline-text opacity-0 ml-[90%] text-white text-s lg:text-xl rotate-10 -mb-6 md:-mb-[3rem] z-30">
						SEOEONGEUEUN's
					</p>
					<p ref={mainTitleRef} className="main-title whitespace-nowrap font-normal text-center text-[6rem] md:text-[10rem] lg:text-[12rem]">
						The Pool
					</p>
					<div className="w-full text-md md:text-xxxl text-white flex flex-row items-center justify-center gap-2">
						of my floating ideas <Image src="/assets/flippers.png" width={50} height={50} alt="flippers" className="w-12 h-12" />
					</div>
				</div>

				<div className="w-full flex justify-center h-fit mt-12">
					<div ref={poolRef} className="pool">
						<svg width="0" height="0">
							<defs>
								<filter id="turb">
									<feTurbulence id="turbwave" type="fractalNoise" baseFrequency="0.01 0.08" numOctaves="1" result="turbulence" />
									<feDisplacementMap id="dispMap" in="SourceGraphic" in2="turbulence" scale="5" />
								</filter>
							</defs>
						</svg>
						{Object.keys(charPositionsRef.current).length > 0 &&
							Object.keys(stacks).map(k => {
								const {x, y} = charPositionsRef.current[k] || {x: 0, y: 0};

								return (
									<Fragment key={k}>
										<Image
											src={`/icons/${k}.png`}
											alt={k}
											className={`char char-${k} ${k}`}
											width={100}
											height={100}
											style={{
												top: `${y}%`,
												left: `${x}%`,
											}}
										/>
										<div
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
				</div>

				<div className={`fixed w-full bottom-0 p-20 pointer-events-none z-[99] transition-opacity ${showMessage ? "opacity-100" : "opacity-0"}`}>
					<div className="flex flex-col items-center justify-center text-white text-xl">
						<span className="drop-shadow-md">{textFile["000"]}</span>
						<MdKeyboardDoubleArrowDown color="white" size="3rem" className="animate-slide-down drop-shadow-lg"></MdKeyboardDoubleArrowDown>
					</div>
				</div>
			</section>
			<div ref={beachRef} className="w-full beach-container relative">
				<svg width="0" height="0">
					<defs>
						<filter id="shore">
							<feTurbulence id="turbShore" type="fractalNoise" baseFrequency="0.01 0.05" numOctaves="1" result="turbulence" />
							<feDisplacementMap id="dispShore" in="SourceGraphic" in2="turbulence" scale="70" />
						</filter>
					</defs>
				</svg>
				<div className="shore-overlay z-20"></div>
				<div className="grain-overlay" />
				<section ref={shoreRef} className="w-full shore relative z-20">
					<div className="float-left w-full py-32 lg:py-0 md:w-1/2 md:pr-16 lg:pr-40 flex flex-col justify-start items-start shore-title">
						<div className="flex flex-row items-center justify-start">
							<p className="subtitle">CAREER</p>
							<div className="foot-pair flex flex-row items-center justify-start ml-[-0.8rem]">
								<div className="footprint">
									<div className="toes">
										<div />
										<div />
										<div />
										<div />
										<div />
									</div>
									<div className="bridge">
										<div />
										<div />
									</div>
									<div className="mid-top"></div>
									<div className="mid-bottom" />
									<div className="heel"></div>
								</div>
								<div className="footprint right">
									<div className="toes">
										<div />
										<div />
										<div />
										<div />
										<div />
									</div>
									<div className="bridge">
										<div />
										<div />
									</div>
									<div className="mid-top"></div>
									<div className="mid-bottom" />
									<div className="heel"></div>
								</div>
							</div>
						</div>
						<p className="description text-m whitespace-pre-line break-keep">{textFile["001"]}</p>
					</div>
					<div ref={towelsRef} className="float-left towels-container spread w-full md:w-1/2">
						{CareerData &&
							Object.entries(CareerData).map(([k, v], i) => (
								<div key={"towel" + i} className="towel-wrapper">
									<svg>
										<filter id={`wibble-${i + 1}`}>
											<feTurbulence
												id={`turbTowel-${i + 1}`}
												type="fractalNoise"
												baseFrequency="0.002 0.003"
												numOctaves="1"
												result="turbulence"
											/>
											<feDisplacementMap in2="turbulence" in="SourceGraphic" scale="0" xChannelSelector="R" yChannelSelector="G" />
										</filter>
									</svg>
									<div
										data-towel-index={i + 1}
										className="towel w-full flex flex-col items-start justify-start p-10 md:px-12"
										style={{filter: `url(#wibble-${i + 1})`}}
									>
										<div className="flex flex-wrap items-center justify-start mb-2 lg:mb-4">
											<p className="title">{v.position}</p>
											<p className="ml-auto lg:ml-2">@ {k}</p>
										</div>

										{isEnglish ? (
											<ul>{v.text_en?.length > 0 && v.text_en.map((t, i) => <li key={k + i}>{t}</li>)}</ul>
										) : (
											<ul>{v.text_kr?.length > 0 && v.text_kr.map((t, i) => <li key={k + i}>{t}</li>)}</ul>
										)}
										<p className="tag mt-auto ml-auto">{v.date}</p>
									</div>
								</div>
							))}
					</div>
				</section>
			</div>

			<section className="w-full full-section text-center font-dunggeunmo projects-section relative -mt-[20vh] md:-mt-0">
				<p className="subtitle">PROJECTS</p>
				<div className="w-full h-fit flex flex-row items-center justify-center gap-[5rem] text-lg md:text-xl ">
					<div className="filter-type flex flex-row items-center gap-8">
						<input type="checkbox" id="filter-personal" name="personal" defaultChecked onChange={handleProjectsFilter} className="cursor-pointer" />
						<label>{textFile["002"]}</label>
					</div>
					<div className="filter-type flex flex-row items-center gap-8">
						<input type="checkbox" id="filter-work" name="work" defaultChecked onChange={handleProjectsFilter} className="cursor-pointer" />
						<label>{textFile["003"]}</label>
					</div>
				</div>
				<div ref={cartridgeCardsContainerRef} className="gallery px-24 w-full flex items-center overflow-x-auto overflow-y-hidden min-h-[40rem]">
					<div ref={cartridgeCardsRef} className="cartridge-loop h-fit flex flex-row w-full gap-16 md:gap-24 md:py-40">
						{Object.entries(projects).map(([k, v]) => (
							<Cartridge key={v.title} projectKey={k} project={v} onSelectProject={handleCardClick} />
						))}
					</div>
				</div>
				<div
					className={`relative -mt-32 lg:mt-0 overflow-hidden gameboy-section ${isGameboyOn && "power-on"} left-1/2 -translate-x-1/2 flex flex-col items-center justify-center`}
				>
					<Gameboy title={selectedProject?.title} />
				</div>
				{selectedProject && swiperReadyRef.current && (
					<section
						ref={projectDetailRef}
						className={`project-section flex flex-col absolute bottom-0 left-0 z-40 py-6 md:py-8 text-start opacity-0 ${isSectionReady ? "ready" : ""} full-section font-dunggeunmo w-full flex flex-col items-center justify-start bg-blue-400`}
					>
						<div className="project-header tracking-widest text-m md:text-xl px-8 md:px-12 h-fit lg:px-24 pb-8 w-full flex flex-row items-start justify-between">
							<div className="flex flex-col items-center justify-start">
								<p>PERSON</p>
								<p className={selectedProject.dark ? "dark" : "normal"} style={{color: selectedProject.theme}}>
									X {selectedProject.ppl_count || 1}
								</p>
							</div>
							<div className="flex flex-col items-center justify-start">
								<p className={`text-xxl lg:text-xxxl ${selectedProject.dark ? "dark" : "normal"}`} style={{color: selectedProject.theme}}>
									{selectedProject.title.toUpperCase()}
								</p>
								<p>{selectedProject?.subtitle}</p>
							</div>
							<button className="text-xxxl cursor-pointer" onClick={() => handleCloseProject()}>
								<p className="pointer-events-none">X</p>
							</button>
						</div>

						<div className="project-detail flex flex-col lg:flex-row w-full min-h-0 flex-1 items-start justify-start px-12 md:px-[8%] lg:px-[12%] lg:mt-4 z-20">
							<Swiper
								modules={[Pagination, Autoplay]}
								pagination={{clickable: true}}
								spaceBetween={20}
								slidesPerView={1}
								loop={true}
								autoplay={{delay: 6000, disableOnInteraction: true}}
								onSwiper={(swiper: SwiperClass) => {
									console.log("🔥 onSwiper fired");
									console.log("🧪 swiperReadyRef in onSwiper", swiperReadyRef.current);
									const firstSlide = swiper.slides[swiper.activeIndex] as HTMLElement;
									if (!firstSlide) return;

									const img = firstSlide.querySelector("img");
									if (!img) return;

									if (img.complete) {
										console.log("Swiper first slide is already ready");
										swiperReadyRef.current?.resolve?.();
									} else {
										//아직 로딩 중인 경우
										img.onload = () => {
											console.log("First slide image finished loading");
											swiperReadyRef.current?.resolve?.();
										};
										img.onerror = () => {
											//로드 실패 => 프로젝트 선택을 초기화
											setSelectedProject(undefined);
										};
									}
								}}
								onSlideChange={(swiper: SwiperClass) => {
									const activeSlide = swiper.slides[swiper.activeIndex];
									if (activeSlide?.dataset.id === "special-slide") {
										setIsSpecialSlide(true);
									} else {
										setIsSpecialSlide(false);
									}
								}}
								className={`projects-swiper max-w-full lg:max-w-1/2`}
							>
								{selectedProject.images?.length > 0 &&
									selectedProject.images.map((img, i) => {
										const isSpecial = img.includes("special");
										const isVideo = img.endsWith(".mp4") || img.endsWith(".mov");

										return (
											<SwiperSlide key={`${selectedProject.title}-${i}`} data-id={isSpecial ? "special-slide" : undefined}>
												{isSpecial && (
													<div
														className={`arrow-text flex flex-row items-center justify-start overflow-hidden h-fit ${isSpecialSlide ? "show" : ""}`}
													>
														<div className="arrow ml-2"></div>
														<p
															className={`text-lg whitespace-nowrap opacity-0 ml-2 ${
																isSpecialSlide ? "opacity-100" : "opacity-0"
															}`}
														>
															me!
														</p>
													</div>
												)}
												{isVideo ? (
													<video src={`/projects/${selectedProject.route}${img}`} autoPlay muted loop playsInline />
												) : (
													<Image
														src={`/projects/${selectedProject.route}${img}`}
														alt={`${selectedProject.title} image ${i}`}
														width={2000}
														height={2000}
													/>
												)}
											</SwiperSlide>
										);
									})}
							</Swiper>
							<div
								className={`project-description ${isEnglish && "en"} w-full lg:max-w-1/2 h-1/2 lg:h-full flex flex-col gap-4 z-30 ml-0 mt-8 lg:mt-0 lg:ml-20 overflow-y-auto`}
							>
								<div className="sub flex flex-row items-end justify-between">
									<p>{textFile["004"]}</p>
									{selectedProject.links && (
										<div
											className={`stacks-box shrink-0 flex flex-row items-center justify-center space-x-5 mr-2 ${selectedProject.dark ? "dark" : "normal"}`}
											style={{borderColor: selectedProject.theme}}
										>
											{selectedProject.links.flatMap((linkObj, i) =>
												Object.entries(linkObj).map(([k, v]) => {
													const isGithub = v.includes("github");
													const icon = isGithub ? "/icons/github.svg" : "/icons/link.svg";
													const alt = isGithub ? "github" : "link";

													return (
														<Link
															key={`${i}-${k}`}
															href={v}
															target="__blank"
															className="flex flex-col items-center justify-center w-fit"
														>
															<Image src={icon} alt={alt} width={50} height={50} />
															<p>{k}</p>
														</Link>
													);
												})
											)}
										</div>
									)}
								</div>
								<ul>{selectedProject.introduction_kr?.map((intro, i) => <li key={"intro" + i}>{intro}</li>)}</ul>
								<div className="sub">
									<p>{textFile["005"]}</p>
								</div>
								<ul>{selectedProject.contribution_kr?.map((c, i) => <li key={"c" + i}>{c}</li>)}</ul>
								{selectedProject.review_kr && (
									<>
										<div className="sub mt-4">
											<p>{textFile["006"]}</p>
										</div>

										<ul>
											{selectedProject.review_kr.map((r, i) => (
												<li key={"r" + i}>{r}</li>
											))}
										</ul>
									</>
								)}
							</div>
						</div>
						<div className="fish animate-float absolute">
							<Image src="/assets/fish0.gif" alt="fish" width={100} height={100} unoptimized />
						</div>
						<div className="absolute bottom-28 left-[5%]">
							<Image src="/assets/coral.png" alt="coral" width={100} height={100} />
						</div>
						<div className="floor absolute bottom-0 bg-theme-sand w-full h-32 z-10 border-t-2 border-black"></div>
					</section>
				)}
			</section>
		</div>
	);
}
