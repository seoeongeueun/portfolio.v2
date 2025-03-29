"use client";
import Image from "next/image";
import {MdKeyboardDoubleArrowDown} from "react-icons/md";
import TextEn from "./data/text-en.json" assert {type: "json"};
import {Fragment, useEffect, useState, useRef} from "react";
import Cartridge from "./components/cartridge";
import Gameboy, {Project} from "./components/gameboy";
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
import {waitForAllImagesToLoad, sleep, lockScroll, unlockScroll, getRandomInt} from "./lib/tools";
import "swiper/css";
import "swiper/css/pagination";

gsap.registerPlugin(Observer);
gsap.registerPlugin(ScrollTrigger);
gsap.registerPlugin(Draggable);

type TextFileType = Record<string, string>;

interface Projects {
	[key: string]: Project;
}

export default function Home() {
	const [textFile, setTextFile] = useState<TextFileType>(TextEn);
	const [projects, setProjects] = useState<Projects>(ProjectsData);
	const [tags, setTags] = useState<string[]>(["WORK", "PERSONAL"]);
	const [selectedProject, setSelectedProject] = useState<Project>();
	const [isGameboyOn, setIsGameboyOn] = useState<boolean>(false);
	const [isReadyToExplode, setIsReadyToExplode] = useState<boolean>(false);
	const [isSpecialSlide, setIsSpecialSlide] = useState<boolean>(false);
	const [isSectionReady, setIsSectionReady] = useState<boolean>(false);

	const bowlRef = useRef<HTMLDivElement | null>(null);
	const charPositionsRef = useRef<Record<string, {x: number; y: number}>>({});

	const mainRef = useRef<HTMLDivElement>(null);
	const shoreRef = useRef<HTMLDivElement>(null);
	const towelsRef = useRef<HTMLDivElement>(null);
	const cartridgeCardsContainerRef = useRef<HTMLDivElement>(null);
	const cartridgeCardsRef = useRef<HTMLDivElement>(null);
	const mainTitleRef = useRef<HTMLParagraphElement>(null);
	const miniTitleRef = useRef<HTMLParagraphElement>(null);
	const gameboyHeadRef = useRef<HTMLDivElement>(null);
	const beachRef = useRef<HTMLDivElement>(null);
	const dustCanvasRef = useRef<HTMLCanvasElement | null>(null);
	const overshootRef = useRef<HTMLDivElement>(null);
	const projectDetailRef = useRef<HTMLDivElement>(null);
	const swiperReadyRef = useRef<{
		promise: Promise<void>;
		resolve: () => void;
	} | null>(null);

	//pseudo element의 너비를 계산하는 함수
	const getPseudoBounds = (element: HTMLElement, pseudo: "::before" | "::after") => {
		const style = window.getComputedStyle(element, pseudo);
		const width = parseFloat(style.width);
		const height = parseFloat(style.height);
		const top = element.getBoundingClientRect().top + parseFloat(style.top);
		const left = element.getBoundingClientRect().left + parseFloat(style.left);
		return {top, left, right: left + width, bottom: top + height, width, height};
	};

	useEffect(() => {
		const waveTl = gsap.timeline({repeat: 1, yoyo: true, ease: "power3.inOut"});
		waveTl
			.to("#dispShore", {
				attr: {scale: 50},
				scrollTrigger: {
					trigger: ".main-page",
					start: "top top",
					end: "bottom bottom",
					scrub: 1,
				},
			})
			.to("#turbShore", {
				attr: {baseFrequency: "0.02 0.08"},
				scrollTrigger: {
					trigger: ".main-page",
					start: "top top",
					end: "bottom bottom",
					scrub: 1,
				},
			});
		if (!bowlRef.current) return;

		Object.keys(stacks).forEach(key => {
			if (!charPositionsRef.current[key]) {
				charPositionsRef.current[key] = {
					x: getRandomInt(40),
					y: getRandomInt(40),
				};
			}
		});

		gsap.defaults({overwrite: true});

		let bowlRect: DOMRect;
		let pseudoRect: any;

		function measureBowl() {
			if (!bowlRef.current) return;
			bowlRect = bowlRef.current.getBoundingClientRect();
			pseudoRect = getPseudoBounds(bowlRef.current, "::before");
		}
		measureBowl();

		//과부화 방지용 쓰로틀 추가
		let lastMoveTime = 0;
		const moveThrottle = 40;

		let moveCharsFrameId: number | null = null;

		function moveChars({event, deltaX, deltaY}: {event: MouseEvent; deltaX: number; deltaY: number}) {
			if (moveCharsFrameId) return;

			//시간으로 throttle 계산
			if (Date.now() - lastMoveTime < moveThrottle) return;
			lastMoveTime = Date.now();

			moveCharsFrameId = requestAnimationFrame(() => {
				moveCharsFrameId = null;

				const el = event.target as HTMLElement;
				const id = el.classList.contains("char") ? el.className.match(/char-(\S+)/)?.[1] : null;
				if (!id || !bowlRef.current) return;

				const shadow = document.querySelector(`.shadow-${id}`) as HTMLElement;
				const charBounds = el.getBoundingClientRect();

				const t = 1;
				let newX = charBounds.left + deltaX * t;
				let newY = charBounds.top + deltaY * t;

				const vmin = Math.min(window.innerWidth, window.innerHeight);
				const yMargin = (vmin * 4) / 100;
				const xMargin = (vmin * 12) / 100;
				console.log(newY, bowlRect.top, yMargin, pseudoRect.top, bowlRect.top - yMargin - charBounds.width);
				if (newX < bowlRect.left + xMargin) newX = bowlRect.left + xMargin;
				if (newX + charBounds.width > pseudoRect.right - xMargin) newX = pseudoRect.right - xMargin - charBounds.width / 2.5;
				if (newY < bowlRect.top + yMargin) newY = bowlRect.top + yMargin;
				if (newY + charBounds.height > bowlRect.bottom - yMargin) newY = bowlRect.bottom - charBounds.height - yMargin;

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
			target: bowlRef.current,
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
				const rect = bowlRef.current?.getBoundingClientRect();
				if (!bowlRef.current || !turbWave || !dispMap || !rect) return;

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

		bowlRef.current.addEventListener("mousemove", handleMouseMove);
		bowlRef.current.addEventListener("mouseleave", handleMouseLeave);

		return () => {
			observer.kill();
			bowlRef.current?.removeEventListener("mousemove", handleMouseMove);
			bowlRef.current?.removeEventListener("mouseleave", handleMouseLeave);
			if (moveCharsFrameId) cancelAnimationFrame(moveCharsFrameId);
			if (rippleFrameId) cancelAnimationFrame(rippleFrameId);
		};
	}, [stacks]);

	//해변 div를 고정하고 비치타월 페이드인 스크롤 + 해변 픽셀화
	useEffect(() => {
		if (!beachRef.current || !shoreRef.current || !towelsRef.current) return;

		const towels = Array.from(towelsRef.current.querySelectorAll<HTMLElement>(".towel-wrapper"));
		if (towels.length === 0) return;

		const totalTowels = Object.keys(CareerData).length;
		const towelsHeight = towels[0].offsetHeight;
		const gap = parseFloat(getComputedStyle(towels[0]).marginTop);
		const scrollPerTowel = towelsHeight + gap;
		const totalTowelDistance = scrollPerTowel * totalTowels;
		const totalScrollDistance = totalTowelDistance;

		let particles: any[] = [];
		let dustCtx: CanvasRenderingContext2D | null = null;
		let dustCanvas: HTMLCanvasElement | null = null;
		let dustReady = false;
		let dustRemoved = false;
		let dustTriggered = false;
		let currentDustProgress = 0;
		let smoothedDustProgress = 0;
		let rafId: number;

		function animateDust() {
			rafId = requestAnimationFrame(animateDust);
			smoothedDustProgress += (currentDustProgress - smoothedDustProgress) * 0.05;
			if (dustReady) drawDust(smoothedDustProgress);
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

			particles = [];

			dustCanvas = document.createElement("canvas");
			dustCanvas.width = width;
			dustCanvas.height = height;
			dustCanvas.style.position = "fixed";
			dustCanvas.style.top = `${beachRef.current.offsetTop}px`;
			dustCanvas.style.left = `${beachRef.current.offsetLeft}px`;
			dustCanvas.style.width = `${beachRef.current.offsetWidth}px`;
			dustCanvas.style.height = `${beachRef.current.offsetHeight}px`;
			dustCanvas.style.zIndex = "99";
			dustCanvas.style.pointerEvents = "none";
			beachRef.current.parentElement!.insertBefore(dustCanvas, beachRef.current);

			dustCtx = dustCanvas.getContext("2d");

			for (let y = 0; y < height; y += PARTICLE_SIZE) {
				for (let x = 0; x < width; x += PARTICLE_SIZE) {
					const i = (y * width + x) * 4;
					const r = data[i];
					const g = data[i + 1];
					const b = data[i + 2];
					const a = data[i + 3];
					if (a > 0) {
						particles.push({
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
			dustReady = true;
			dustRemoved = false;
			dustCanvas.style.display = "block";
		};

		const drawDust = (progress: number) => {
			if (!dustCtx || !dustCanvas) return;

			const {width, height} = dustCanvas;
			dustCtx.clearRect(0, 0, width, height);
			const dustProgress = gsap.utils.clamp(0, 1, (progress - DUST_TIMING) * AMPLIFY_BY);
			//color를 칠하는 단계가 마무리 되었으면 원래 beachref div를 투명 처리
			beachRef.current!.style.opacity = dustProgress >= FILL_END ? "0" : "1";

			particles.forEach(p => {
				const localProgress = gsap.utils.clamp(0, 1, (dustProgress - p.delay) / (1 - p.delay));
				const alpha = p.a * 1.7;

				//각자 단계 지속시간 const 값으로 진행도를 계산
				const fillStrength = gsap.utils.clamp(0, 1, (localProgress - BORDER_END) / (FILL_END - BORDER_END));
				const moveStrength = gsap.utils.clamp(0, 1, (localProgress - FILL_END) / (1 - FILL_END));
				const x = p.x + p.dx * moveStrength;
				const y = p.y + p.dy * moveStrength;

				//채워진 정도에 따라 alpha 조절
				const fadeAlpha = alpha * (1 - moveStrength);
				const fillAlpha = alpha * fillStrength * (1 - moveStrength);

				if (fillStrength > 0) {
					dustCtx!.fillStyle = `rgba(${p.r},${p.g},${p.b},${fillAlpha})`;
					dustCtx!.fillRect(x, y, PARTICLE_SIZE, PARTICLE_SIZE);
				}

				const borderAlphaStrength = gsap.utils.clamp(0, 1, localProgress / BORDER_END);
				const borderAlpha = fadeAlpha * borderAlphaStrength * 0.3;

				// border는 항상 그리되 이동된 위치에만
				dustCtx!.strokeStyle = `rgba(0,0,0,${borderAlpha})`;
				dustCtx!.strokeRect(x, y, PARTICLE_SIZE, PARTICLE_SIZE);
			});
		};

		ScrollTrigger.create({
			trigger: beachRef.current,
			start: "top top",
			end: `+=${totalScrollDistance}`,
			pin: true,
			pinSpacing: false,
			scrub: true,
			markers: true,
			onUpdate: self => {
				const progress = self.progress;
				const towelProgress = gsap.utils.clamp(0, 1, progress * AMPLIFY_BY);
				currentDustProgress = gsap.utils.clamp(0, 1, (progress - DUST_TIMING) * AMPLIFY_BY);

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

				// dust 캔버스 생성 예약 (부하 줄이기 위해 setTimeout)
				if (progress >= DUST_TIMING && !dustReady && !dustTriggered) {
					dustTriggered = true;

					requestAnimationFrame(() => {
						setTimeout(() => {
							const targetY = -towelProgress * scrollPerTowel * totalTowels;
							createDust(targetY);
						}, 320);
					});
				}

				if (smoothedDustProgress === 0 && !dustRemoved) {
					dustCanvas?.remove();
					dustCanvas = null;
					dustCtx = null;
					dustReady = false;
					dustRemoved = true;
					particles = [];
					towelsRef.current!.style.transform = "";
				}

				if (progress < DUST_TIMING && dustTriggered) {
					dustTriggered = false;
				}
			},

			onLeaveBack: () => {
				beachRef.current!.style.opacity = "1";
				dustCanvas?.remove();
				dustCanvas = null;
				dustCtx = null;
				dustReady = false;
				dustRemoved = true;
				dustTriggered = false;
				particles = [];
			},
		});

		rafId = requestAnimationFrame(animateDust);

		return () => {
			ScrollTrigger.getAll().forEach(st => st.kill());
			dustCanvas?.remove();
			dustCanvas = null;
			dustCtx = null;
			dustReady = false;
			dustRemoved = false;
			dustTriggered = false;
			particles = [];
			cancelAnimationFrame(rafId);
		};
	}, [CareerData]);

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

	// useEffect(() => {
	// 	const handleMobileCardIntersection: IntersectionObserverCallback = (entries, observer) => {
	// 		entries.forEach(entry => {
	// 			if (entry.isIntersecting) {
	// 				const cardContainer = cartridgeCardsContainerRef.current;
	// 				if (cardContainer) {
	// 					const firstChild = cardContainer.firstElementChild as HTMLElement | null;
	// 					if (firstChild) {
	// 						firstChild.classList.add("spread");
	// 					}
	// 					const halfScroll = cardContainer.scrollWidth / 2;
	// 					cardContainer.scrollLeft = halfScroll;
	// 				}
	// 				observer.unobserve(entry.target);
	// 			}
	// 		});
	// 	};

	// 	const handleTitleIntersection: IntersectionObserverCallback = (entries, observer) => {
	// 		entries.forEach(entry => {
	// 			if (entry.isIntersecting) {
	// 				const side = (entry.target as HTMLElement).dataset.side;
	// 				entry.target.classList.add(`fade-${side}`);
	// 				observer.unobserve(entry.target);
	// 			}
	// 		});
	// 	};

	// 	const setupObservers = () => {
	// 		const cardContainer = cartridgeCardsRef.current;
	// 		if (!cardContainer) return;

	// 		const mobileCardObserver = new IntersectionObserver(handleMobileCardIntersection, {
	// 			root: null,
	// 			rootMargin: "0px",
	// 			threshold: 0.7,
	// 		});

	// 		const titleObserver = new IntersectionObserver(handleTitleIntersection, {
	// 			root: null,
	// 			rootMargin: "0px",
	// 			threshold: 0.5,
	// 		});

	// 		mobileCardObserver.observe(cardContainer);

	// 		//fade 애니메이션 효과가 필요한 div
	// 		const upElements = document.querySelectorAll<HTMLElement>(".fade-up-section");
	// 		const leftElements = document.querySelectorAll<HTMLElement>(".fade-left-section");

	// 		upElements.forEach(element => {
	// 			element.dataset.side = "up";
	// 			titleObserver.observe(element);
	// 		});

	// 		return () => {
	// 			mobileCardObserver.disconnect();
	// 			upElements.forEach(element => titleObserver.unobserve(element));
	// 		};
	// 	};

	// 	return setupObservers();
	// }, []);

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

	/* 카트리지 (=통칭 카드) 호버 & 선택 이벤트 관리 */
	useEffect(() => {
		const parentContainer = cartridgeCardsContainerRef.current;
		const cardsDiv = cartridgeCardsRef.current;
		if (!cardsDiv || !parentContainer) return;

		const cards = cardsDiv.querySelectorAll<HTMLElement>(".card");
		const timeouts: ReturnType<typeof setTimeout>[] = [];

		const handleClearChanges = () => {
			cardsDiv.style.left = "";
			cardsDiv.style.transition = "";
		};

		function onCardClick(event: MouseEvent) {
			const clickedCard = event.currentTarget as HTMLElement;
			const rect = clickedCard.getBoundingClientRect();
			//선택한 프로젝트의 키를 카드 데이터에서 가져옴
			const projectKey = clickedCard.dataset.project;

			if (!rect || !cardsDiv || !parentContainer || !projectKey) return;

			const projectData = ProjectsData[projectKey as keyof typeof ProjectsData];
			if (projectData) setSelectedProject(projectData as Project);

			lockScroll();
			clickedCard.classList.add("forbid-click");
			cards.forEach(card => card.classList.remove("clicked"));

			/* 
				선택된 카드를 중앙으로 위치하게 스크롤 하는 로직 + 자동으로 필요한 만큼 여백 추가
				어떤 디자인을 택할지에 따라 사용하지 않을 수도 있음
			*/
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

			if (desiredDelta > maxScroll) {
				cardsDiv.style.left = `${-1 * desiredDelta}px`;
				const t = setTimeout(() => {
					clickedCard.classList.add("clicked");
					moveGameboyHead();
				}, 500);
				timeouts.push(t);
			} else {
				clickedCard.classList.add("clicked");
				requestAnimationFrame(waitForScrollEnd);
			}

			//게임기로 이동하기 위해 필요한 거리 계산
			const moveGameboyHead = () => {
				const gameboyHead = document.querySelector("#gameboy-head");
				if (gameboyHead) {
					const t = setTimeout(() => {
						const referencePosition = gameboyHead.getBoundingClientRect().top;
						const cardPosition = rect.top;
						const distance = referencePosition - cardPosition - clickedCard.offsetHeight * 0.4;
						clickedCard.style.setProperty("--y-distance", `${distance + 20}px`);
						clickedCard.classList.add("moveY");
						const t2 = setTimeout(() => {
							window.scrollTo({top: window.scrollY + distance, behavior: "smooth"});
						}, 300);
						timeouts.push(t2);
					}, 800);
					timeouts.push(t);
				}
			};
		}

		cards.forEach(card => {
			card.addEventListener("click", onCardClick);
		});

		return () => {
			cards.forEach(card => {
				card.removeEventListener("click", onCardClick);
			});
			timeouts.forEach(t => clearTimeout(t));
		};
	}, []);

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

	const handleProjectsFilter = (e: React.ChangeEvent<HTMLInputElement>) => {
		const {name, checked} = e.target;
		setTags(prev => (checked ? [...prev, name.toUpperCase()] : prev.filter(filter => filter !== name.toUpperCase())));
	};

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
		let timeoutId: ReturnType<typeof setTimeout> | null = null;

		if (selectedProject) {
			//프로젝트가 선택되면 카트리지 장착 애니메이션 이후 게임기를 켠다
			timeoutId = setTimeout(() => {
				setIsGameboyOn(true);
			}, 2000);

			const section = projectDetailRef.current;
			if (!section) return;

			//바뀐 스와이퍼에 새로운 ready promise를 연결
			let resolve: () => void;
			const promise = new Promise<void>(r => (resolve = r));
			swiperReadyRef.current = {promise, resolve: resolve!};

			const run = async () => {
				//section 내부 이미지와 swiper가 모두 로딩 되면 준비 완료로 변경
				//최소로 3초는 기다리기
				await Promise.all([waitForAllImagesToLoad(section), swiperReadyRef.current!.promise, sleep(3000)]);

				setIsSectionReady(true);
			};

			run();
		} else {
			setIsGameboyOn(false);
			setIsSectionReady(false);
			projectDetailRef.current?.classList.remove("clear", "ready");
		}

		return () => {
			if (timeoutId) clearTimeout(timeoutId);
		};
	}, [selectedProject]);

	useEffect(() => {
		if (!isSectionReady) return;

		const cardsDiv = cartridgeCardsRef.current;
		if (!cardsDiv) return;

		const cards = cardsDiv.querySelectorAll<HTMLElement>(".card");

		const timeoutId = setTimeout(() => {
			cardsDiv.style.left = "";
			cardsDiv.style.transition = "";
			unlockScroll();

			cards.forEach(card => {
				card.classList.remove("forbid-click", "moveY", "clicked");
			});
		}, 3000);

		const handleCloseOnScroll = (e: Event) => {
			e.preventDefault();
			e.stopPropagation();
			handleCloseProject();
		};

		window.addEventListener("wheel", handleCloseOnScroll, {passive: false});
		window.addEventListener("touchmove", handleCloseOnScroll, {passive: false});
		window.addEventListener("keydown", handleCloseOnScroll);

		return () => {
			clearTimeout(timeoutId);
			window.removeEventListener("wheel", handleCloseOnScroll);
			window.removeEventListener("touchmove", handleCloseOnScroll);
			window.removeEventListener("keydown", handleCloseOnScroll);
		};
	}, [isSectionReady]);

	const handleCloseProject = () => {
		const section = projectDetailRef.current;
		if (!section) return;

		section.classList.add("clear");

		const clearProjectPage = () => {
			setTimeout(() => {
				setIsGameboyOn(false);
				setSelectedProject(undefined);
				unlockScroll();
				section.classList.remove("clear", "ready");
			}, 300);
		};
		section.addEventListener("animationend", clearProjectPage);

		return () => {
			section.removeEventListener("animationend", clearProjectPage);
		};
	};

	return (
		<div ref={mainRef} className="main-page text-white w-full flex flex-col items-center justify-start">
			<div className="fixed top-0 p-4 pointer-events-none w-full">
				<div className="w-full flex flex-row items-center justify-between mb-auto">
					<span>ha</span>
				</div>
			</div>
			<section className="w-full flex flex-col items-center pt-52">
				<div className="flex flex-col justify-center items-center">
					<p ref={miniTitleRef} className="underline-text opacity-0 ml-auto text-white text-s lg:text-xl rotate-10 -mb-8 md:-mb-[3rem] z-30">
						SEOEONGEUEUN's
					</p>
					<p ref={mainTitleRef} className="main-title md:whitespace-nowrap font-normal text-center text-[7rem] md:text-[10rem] lg:text-[12rem]">
						The Pool
					</p>
					<div className="w-full text-xxxl text-white flex flex-row items-center justify-center gap-2">
						of my floating ideas <Image src="/assets/flippers.png" width={50} height={50} alt="flippers" />
					</div>
				</div>

				<div className="w-full flex justify-center h-fit">
					<div ref={bowlRef} className="bowl">
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

				<div className="fixed w-full bottom-0 p-20 pointer-events-none z-[99]">
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
					<div className="float-left w-1/2 flex flex-col justify-start items-start shore-title">
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
						<p className="description text-m max-w-1/2 whitespace-pre-line">{textFile["001"]}</p>
					</div>
					<div ref={towelsRef} className="float-left towels-container spread w-1/2">
						{CareerData &&
							Object.entries(CareerData).map(([k, v], i) => (
								<div className="towel-wrapper">
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
										className="towel w-full flex flex-col items-start justify-start p-10 px-12"
										style={{filter: `url(#wibble-${i + 1})`}}
									>
										<div className="flex flex-wrap items-center justify-start mb-2">
											<p className="title mr-4 whitespace-nowrap">{v.position}</p>
											<p>@ {k}</p>
										</div>

										<ul>{v.text_kr?.length > 0 && v.text_kr.map((t, i) => <li key={k + i}>{t}</li>)}</ul>
										<p className="tag mt-auto ml-auto">{v.date}</p>
									</div>
								</div>
							))}
					</div>
				</section>
			</div>

			<section className="w-full full-section min-h-screen text-center font-dunggeunmo projects-section relative">
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
				<div ref={cartridgeCardsContainerRef} className="gallery px-24 w-full flex overflow-x-auto overflow-y-hidden min-h-screen md:min-h-[100vh]">
					<div ref={cartridgeCardsRef} className="cartridge-loop h-fit flex flex-row w-full gap-8 md:gap-24 md:py-40">
						{Object.entries(projects).map(([k, v]) => (
							<div key={v.title} data-project={k} className={`card card-${k} w-fit`}>
								<Cartridge project={v} />
							</div>
						))}
					</div>
				</div>
				<div className={`relative -mt-32 overflow-hidden gameboy-section ${isGameboyOn && "power-on"} flex flex-col items-center justify-center`}>
					<Gameboy project={selectedProject} />
				</div>
				{selectedProject && (
					<section
						ref={projectDetailRef}
						className={`project-section absolute bottom-0 left-0 z-40 h-screen text-start opacity-0 ${isSectionReady ? "ready" : ""} full-section font-dunggeunmo w-full flex flex-col items-center justify-start bg-blue-400`}
					>
						<div className="project-header tracking-widest text-xl py-8 px-24 pb-8 w-full sticky top-0 flex flex-row items-start justify-between">
							<div className="flex flex-col items-center justify-start">
								<p>PERSON</p>
								<p className="text-theme-yellow">X {selectedProject.ppl_count || 1}</p>
							</div>
							<div className="flex flex-col items-center justify-start">
								<p className="text-xxxl text-theme-yellow">{selectedProject.title.toUpperCase()}</p>
								<p>{selectedProject?.subtitle}</p>
							</div>

							{/* <div className="stacks-box flex flex-row p-4 outline-2 outline-black">
							<Image src="/icons/mysql.png" alt="stack" width={200} height={200} />
						</div> */}
							<button className="text-xxxl cursor-pointer" onClick={() => handleCloseProject()}>
								<p className="pointer-events-none">X</p>
							</button>
						</div>

						<div className="project-detail flex flex-col md:flex-row w-full h-full items-start justify-start relative px-12 md:px-[15%] mt-16">
							<Swiper
								modules={[Pagination, Autoplay]}
								pagination={{clickable: true}}
								spaceBetween={20}
								slidesPerView={1}
								loop={true}
								autoplay={{delay: 5000, disableOnInteraction: true}}
								onSwiper={(swiper: SwiperClass) => {
									if (swiper.initialized) {
										swiperReadyRef.current?.resolve();
									} else {
										swiper.on("init", () => swiperReadyRef.current?.resolve());
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
								className={`projects-swiper max-w-full md:max-w-1/2 h-auto`}
							>
								<SwiperSlide>
									<video src={"/projects/orgd/video1.mp4"} autoPlay muted loop playsInline />
								</SwiperSlide>
								<SwiperSlide>
									<Image src={"/projects/orgd/orgd0.jpg"} alt="project" width={2000} height={2000} />
								</SwiperSlide>
								<SwiperSlide>
									<Image src={"/projects/orgd/orgd1.jpg"} alt="project" width={2000} height={2000} />
								</SwiperSlide>
								<SwiperSlide>
									<Image src={"/projects/orgd/orgd3.png"} alt="project" width={2000} height={2000} />
								</SwiperSlide>
								<SwiperSlide data-id="special-slide">
									<div
										className={`arrow-text flex flex-row items-center justify-start overflow-hidden h-fit ${isSpecialSlide ? "show" : ""}`}
									>
										<div className="arrow ml-2"></div>
										<p className={`text-lg whitespace-nowrap opacity-0 ml-2 ${isSpecialSlide ? "opacity-100" : "opacity-0"}`}>that's me!</p>
									</div>
									<Image src={"/projects/orgd/orgd4.png"} alt="project" width={2000} height={2000} />
								</SwiperSlide>
								<SwiperSlide>
									<Image src={"/projects/orgd/orgd5.png"} alt="project" width={2000} height={2000} />
								</SwiperSlide>
							</Swiper>
							<div className="project-description w-full md:max-w-1/2 h-full md:h-[70vh] flex flex-col gap-4 z-30 ml-0 md:ml-20 overflow-y-auto">
								<div className="sub">
									<p>프로젝트 소개</p>
								</div>
								<ul>{selectedProject.introduction_kr?.map((intro, i) => <li key={"intro" + i}>{intro}</li>)}</ul>
								<div className="sub">
									<p>주요 성과 및 기여</p>
								</div>
								<ul>{selectedProject.contribution_kr?.map((c, i) => <li key={"c" + i}>{c}</li>)}</ul>
								<div className="sub mt-4">
									<p>회고</p>
								</div>
								<ul>{selectedProject.review_kr?.map((r, i) => <li key={"r" + i}>{r}</li>)}</ul>
							</div>
						</div>
						<div className="fish animate-float absolute">
							<Image src="/assets/fish0.gif" alt="fish" width={100} height={100} />
						</div>
						<div className="absolute bottom-28 left-[5%]">
							<Image src="/assets/coral.png" alt="coral" width={100} height={100} />
						</div>
						<div className="floor absolute bottom-0 bg-theme-sand w-full h-32 z-10 border-t-2 border-black"></div>
					</section>
				)}
			</section>

			{/* <div className="h-screen">Top content</div>
			<div className="h-screen">Top content</div> */}

			{/* <section className="flex-col bg-red-100 opacity-50 mt-[150vh] fade-up-section">
				<div className="flex flex-col justify-start items-center mb-auto">
					<p className="subtitle">CONTACTS</p>
					<p className="text-s max-w-1/2 whitespace-pre-line">{textFile["001"]}</p>
				</div>
			</section> */}
		</div>
	);
}
