"use client";
import Image from "next/image";
import {MdKeyboardDoubleArrowDown} from "react-icons/md";
import TextEn from "./data/text-en.json" assert {type: "json"};
import {Fragment, useEffect, useState, useRef, useCallback, act} from "react";
import Cartridge from "./components/cartridge";
import Gameboy, {Project} from "./components/gameboy";
import ProjectsData from "./data/projects.json" assert {type: "json"};
import "./styles/global.scss";
import "./styles/gsap.scss";
import {stacks} from "./lib/constants";
import gsap from "gsap";
import {Observer} from "gsap/Observer";
import {ScrollTrigger} from "gsap/ScrollTrigger";
import html2canvas from "html2canvas";
import {Swiper, SwiperSlide} from "swiper/react";
import {Pagination, Autoplay} from "swiper/modules";
import {Swiper as SwiperClass} from "swiper/types";
import "swiper/css";
import "swiper/css/pagination";

gsap.registerPlugin(Observer);
gsap.registerPlugin(ScrollTrigger);

const getRandomInt = (val: number): number => Math.ceil(Math.random() * val) * (Math.random() < 0.5 ? -1 : 1);

type TextFileType = Record<string, string>;

interface Projects {
	[key: string]: Project;
}

export default function Home() {
	const [textFile, setTextFile] = useState<TextFileType>(TextEn);
	const [projects, setProjects] = useState<Projects>(ProjectsData);
	const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
	const [tags, setTags] = useState<string[]>(["WORK", "PERSONAL"]);
	const [selectedProjectTitle, setSelectedProjectTitle] = useState<string>("");
	const [selectedProject, setSelectedProject] = useState<Project>();
	const [isGameboyOn, setIsGameboyOn] = useState<boolean>(false);
	const [isReadyToExplode, setIsReadyToExplode] = useState<boolean>(false);
	const [isSpecialSlide, setIsSpecialSlide] = useState<boolean>(false);

	const bowlRef = useRef<HTMLDivElement | null>(null);
	const charPositionsRef = useRef<Record<string, {x: number; y: number}>>({});

	const mainRef = useRef<HTMLDivElement>(null);
	const stickyRef = useRef<HTMLDivElement>(null);
	const towelsRef = useRef<HTMLDivElement>(null);
	const cartridgeCardsContainerRef = useRef<HTMLDivElement>(null);
	const cartridgeCardsRef = useRef<HTMLDivElement>(null);
	const mainTitleRef = useRef<HTMLParagraphElement>(null);
	const miniTitleRef = useRef<HTMLParagraphElement>(null);
	const gameboyHeadRef = useRef<HTMLDivElement>(null);
	const charRefs = useRef<Record<string, HTMLElement>>({});
	const shadowRefs = useRef<Record<string, HTMLElement>>({});
	const beachRef = useRef<HTMLDivElement>(null);
	const overshootRef = useRef<HTMLDivElement>(null);

	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const hasExplodedRef = useRef(false);
	const particleSize = 50;

	const prevScrollTop = useRef(0);

	function preventScroll(e: Event) {
		e.preventDefault();
		e.stopPropagation();
	}

	function lockScroll() {
		window.addEventListener("wheel", preventScroll, {
			passive: false,
		});
		window.addEventListener("touchmove", preventScroll, {
			passive: false,
		});
	}

	function unlockScroll() {
		window.removeEventListener("wheel", preventScroll);
		window.removeEventListener("touchmove", preventScroll);
	}

	//해변 div를 canvas로 전환해 pixel 폭발 효과를 적용
	useEffect(() => {
		const explode = async () => {
			if (!beachRef.current) return;

			//선택한 div를 베이스로 canvas를 생성
			const canvas = await html2canvas(beachRef.current, {
				backgroundColor: null,
				scale: 2,
			});

			const ctx = canvas.getContext("2d");
			if (!ctx) return;

			const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
			const container = beachRef.current.parentElement;
			if (!container) return;

			//원래 div는 투명도로 숨김 처리
			beachRef.current.style.opacity = "0";

			const dustCanvas = document.createElement("canvas");
			dustCanvas.width = canvas.width;
			dustCanvas.height = canvas.height;
			dustCanvas.style.position = "absolute";
			dustCanvas.style.top = beachRef.current.offsetTop + "px";
			dustCanvas.style.left = beachRef.current.offsetLeft + "px";
			//dustCanvas.style.zIndex = "9999";

			canvasRef.current = dustCanvas;
			container.appendChild(dustCanvas);

			const dustCtx = dustCanvas.getContext("2d");
			if (!dustCtx) return;

			const particles: any[] = [];

			for (let y = 0; y < canvas.height; y += particleSize) {
				for (let x = 0; x < canvas.width; x += particleSize) {
					const i = (y * canvas.width + x) * 4;
					const [r, g, b, a] = imageData.data.slice(i, i + 4);
					if (a > 0) {
						particles.push({
							x,
							y,
							dx: (Math.random() - 0.5) * 2,
							dy: (Math.random() - 1) * 2,
							ttl: 100 + Math.random() * 60,
							life: 0,
							r,
							g,
							b,
							a,
						});
					}
				}
			}

			const animate = () => {
				dustCtx.clearRect(0, 0, canvas.width, canvas.height);
				particles.forEach(p => {
					p.x += p.dx;
					p.y += p.dy;
					p.dy += 0.1;

					const fade = 1 - p.life / p.ttl;
					if (fade > 0) {
						const alpha = (p.a / 255) * fade;
						dustCtx.fillStyle = `rgba(${p.r},${p.g},${p.b},${alpha})`;
						dustCtx.fillRect(p.x, p.y, particleSize, particleSize);

						//픽셀 효과를 위해 테두리 추가
						dustCtx.strokeStyle = `rgba(0, 0, 0, ${alpha})`;
						dustCtx.lineWidth = 0.2;
						dustCtx.strokeRect(p.x, p.y, particleSize, particleSize);
					}
				});

				if (particles.some(p => p.life < p.ttl)) {
					requestAnimationFrame(animate);
				}
			};

			animate();
		};

		const restore = () => {
			if (canvasRef.current) {
				canvasRef.current.remove();
				canvasRef.current = null;
			}
			if (beachRef.current) {
				beachRef.current.style.opacity = "1";
			}
		};

		const handleScroll = async () => {
			const rect = beachRef.current?.getBoundingClientRect();
			if (!rect) return;

			const triggerPoint = window.innerHeight * 0.7;

			if (!hasExplodedRef.current && rect.top < triggerPoint && isReadyToExplode) {
				hasExplodedRef.current = true;
				await explode();
			}

			if (hasExplodedRef.current && rect.top > triggerPoint + 50) {
				hasExplodedRef.current = false;
				restore();
			}
		};

		// window.addEventListener("scroll", handleScroll, {passive: true});
		// return () => window.removeEventListener("scroll", handleScroll);
	}, [isReadyToExplode]);

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
		gsap.to("#turbGooey", {
			attr: {baseFrequency: "0.02 0.08"},
			scrollTrigger: {
				trigger: ".wrapper",
				start: "top top",
				end: "bottom bottom",
				scrub: 1,
			},
		});

		gsap.to("#dispGooey", {
			attr: {scale: 50},
			scrollTrigger: {
				trigger: ".wrapper",
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

		gsap.to(".char", {
			x: () => getRandomInt(10),
			y: () => getRandomInt(10),
			rotation: () => getRandomInt(20),
			duration: 5,
		});

		let moveCharsFrameId: number | null = null;
		let rippleFrameId: number | null = null;

		const moveChars = (obj: {event: MouseEvent; deltaX: number; deltaY: number}) => {
			if (moveCharsFrameId) return;

			moveCharsFrameId = requestAnimationFrame(() => {
				const {event, deltaX, deltaY} = obj;
				const el = event.target as HTMLElement;
				const id = el.classList.contains("char") ? el.className.match(/char-(\S+)/)?.[1] : null;

				if (!id || !bowlRef.current) return;

				const shadow = document.querySelector(`.shadow-${id}`) as HTMLElement;
				const charBounds = el.getBoundingClientRect();
				const pseudoBounds = getPseudoBounds(bowlRef.current, "::before");
				const bowlBounds = bowlRef.current.getBoundingClientRect();
				const t = 3;

				let newX = charBounds.left + deltaX * t;
				let newY = charBounds.top + deltaY * t;

				const vmin = Math.min(window.innerWidth, window.innerHeight);
				const yMargin = (vmin * 4) / 100;
				const xMargin = (vmin * 12) / 100;

				if (newX < bowlBounds.left + xMargin) newX = pseudoBounds.left + xMargin;
				if (newX + charBounds.width > pseudoBounds.right - xMargin + 10) newX = pseudoBounds.right - charBounds.width - xMargin + 10;
				if (newY < bowlBounds.top + yMargin) newY = bowlBounds.top + yMargin;
				if (newY + charBounds.height > bowlBounds.bottom - yMargin) newY = bowlBounds.bottom - charBounds.height - yMargin;

				const xMovement = newX - charBounds.left;
				const yMovement = newY - charBounds.top;

				gsap.to(el, {
					x: `+=${xMovement}`,
					y: `+=${yMovement}`,
					rotation: `-=${deltaX * t * Math.sign(event.clientY - (charBounds.top + charBounds.height / 2))}`,
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

				moveCharsFrameId = null;
			});
		};

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

		const turbWave = document.querySelector("#turbwave");
		const dispMap = document.querySelector("#dispMap");

		const handleMouseMove = (e: MouseEvent) => {
			if (rippleFrameId) return;

			rippleFrameId = requestAnimationFrame(() => {
				const rect = bowlRef.current?.getBoundingClientRect();
				if (!rect) return;
				const x = (e.clientX - rect.left) / rect.width;
				const y = (e.clientY - rect.top) / rect.height;

				gsap.to(turbWave, {
					attr: {baseFrequency: `${0.01 + y * 0.02} ${0.04 + x * 0.04}`},
					duration: 0.3,
					ease: "power2.out",
				});

				gsap.to(dispMap, {
					attr: {scale: 5 + y * 15},
					duration: 0.3,
					ease: "power2.out",
				});
				rippleFrameId = null;
			});
		};

		const handleMouseLeave = () => {
			turbWave?.setAttribute("baseFrequency", "0.01 0.03");
			dispMap?.setAttribute("scale", "2");
		};

		bowlRef.current?.addEventListener("mousemove", handleMouseMove);
		bowlRef.current?.addEventListener("mouseleave", handleMouseLeave);

		return () => {
			observer.kill();
			if (moveCharsFrameId) cancelAnimationFrame(moveCharsFrameId);
			if (rippleFrameId) cancelAnimationFrame(rippleFrameId);
		};
	}, [stacks]);

	useEffect(() => {
		let timeoutId: ReturnType<typeof setTimeout> | null = null;

		if (!selectedProject) {
			setIsGameboyOn(false);
		} else {
			timeoutId = setTimeout(() => {
				setIsGameboyOn(true);
			}, 2000);
		}

		return () => {
			if (timeoutId) clearTimeout(timeoutId);
		};
	}, [selectedProject]);

	//비치타월 스크롤 루프
	useEffect(() => {
		if (!towelsRef.current || !stickyRef.current) return;

		const container = towelsRef.current;
		const towels = Array.from(container.querySelectorAll<HTMLDivElement>(".towel-wrapper"));
		const towelHeight = towels[0]?.offsetHeight || 0;
		const totalTowels = towels.length;
		const totalScrollHeight = towelHeight * totalTowels;
		const marginTop = towelHeight / -2;

		let currentOffset = 0;
		let prevScrollTop = window.scrollY;
		let positions = towels.map((_, i) => i * towelHeight);

		const isStickyVisible = () => {
			//무한 카드 스위칭을 막기 위해 하단에 카드 3개가 남았을 때 루프를 종료
			const rect = stickyRef.current!.getBoundingClientRect();
			const shouldContinue = rect.bottom > towelHeight * 3 && rect.top < window.innerHeight;
			setIsReadyToExplode(!shouldContinue);
			return shouldContinue;
		};

		const updateHighlight = () => {
			let closestCard = null;
			let closestDistance = Infinity;

			towels.forEach(towel => {
				const rect = towel.getBoundingClientRect();
				const distanceToTop = Math.abs(rect.top);

				if (distanceToTop < closestDistance) {
					closestDistance = distanceToTop;
					closestCard = towel;
				}

				towel.classList.remove("highlighted");
			});

			if (closestCard) {
				(closestCard as HTMLDivElement).classList.add("highlighted");
			}
		};

		const updatePositions = (deltaY: number) => {
			currentOffset += deltaY;
			if (isStickyVisible()) {
				towels.forEach((towel, index) => {
					positions[index] += deltaY;

					if (positions[index] <= -towelHeight) {
						positions[index] += (towelHeight + marginTop) * (totalTowels * totalTowels);
					}

					if (positions[index] >= totalScrollHeight) {
						positions[index] -= (towelHeight + marginTop) * (totalTowels * totalTowels);
					}
					towel.style.setProperty("--y-distance", positions[index] + "px");
				});
			}
			updateHighlight();
		};

		const handleScroll = () => {
			const scrollTop = window.scrollY;
			const deltaY = scrollTop - prevScrollTop;
			prevScrollTop = scrollTop;

			updatePositions(-deltaY);
		};

		window.addEventListener("scroll", handleScroll);

		return () => {
			window.removeEventListener("scroll", handleScroll);
		};
	}, []);

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
	// 	if (!gameboyHeadRef.current || !isGameboyOn) return;

	// 	const gameboyHead = gameboyHeadRef.current;
	// 	const gameboyScreen = gameboyHead.querySelector<HTMLDivElement>(".gameboy-screen");
	// 	if (!gameboyScreen) return;

	// 	const initialScrollY = window.scrollY;
	// 	let maxScreenWidth = window.innerWidth * 0.7; // 최대 70vw
	// 	let maxScale = maxScreenWidth / gameboyScreen.offsetWidth; // 최대 scale 값
	// 	let lastScrollY = window.scrollY; // 이전 스크롤 위치

	// 	const originalLeft = gameboyScreen.offsetLeft; //scale 적용 전에 screen의 왼쪽 거리를 계산

	// 	const handleScroll = () => {
	// 		const scrollY = window.scrollY;
	// 		let scrollDiff = scrollY - initialScrollY; // 기준점 대비 스크롤 이동량

	// 		// 스크롤 위 방향 감지
	// 		if (scrollY < lastScrollY) {
	// 			//스크롤을 올릴 때는 자연스럽게 작아지기 위해 기준점을 현재 위치에서 200px 정도 멀리 잡는다
	// 			scrollDiff -= 100;
	// 		} else {
	// 			scrollDiff += 300;
	// 		}
	// 		let newScale = 1 + scrollDiff * 0.002;
	// 		// 1보다는 크고 maxscale보다는 작게
	// 		newScale = Math.max(1, Math.min(newScale, maxScale));

	// 		//1 이하로는 작아지지 못하게 지정
	// 		gameboyHead.style.setProperty("--scale", newScale.toString());

	// 		lastScrollY = scrollY;
	// 	};

	// 	window.addEventListener("scroll", handleScroll);
	// 	return () => {
	// 		window.removeEventListener("scroll", handleScroll);
	// 	};
	// }, [isGameboyOn]);

	useEffect(() => {
		const handleMobileCardIntersection: IntersectionObserverCallback = (entries, observer) => {
			entries.forEach(entry => {
				if (entry.isIntersecting) {
					const cardContainer = cartridgeCardsContainerRef.current;
					if (cardContainer) {
						const firstChild = cardContainer.firstElementChild as HTMLElement | null;
						if (firstChild) {
							firstChild.classList.add("spread");
						}
						const halfScroll = cardContainer.scrollWidth / 2;
						cardContainer.scrollLeft = halfScroll;
					}
					observer.unobserve(entry.target);
				}
			});
		};

		const handleTitleIntersection: IntersectionObserverCallback = (entries, observer) => {
			entries.forEach(entry => {
				if (entry.isIntersecting) {
					const side = (entry.target as HTMLElement).dataset.side;
					entry.target.classList.add(`fade-${side}`);
					observer.unobserve(entry.target);
				}
			});
		};

		const setupObservers = () => {
			const cardContainer = cartridgeCardsRef.current;
			if (!cardContainer) return;

			const mobileCardObserver = new IntersectionObserver(handleMobileCardIntersection, {
				root: null,
				rootMargin: "0px",
				threshold: 0.7,
			});

			const titleObserver = new IntersectionObserver(handleTitleIntersection, {
				root: null,
				rootMargin: "0px",
				threshold: 0.5,
			});

			mobileCardObserver.observe(cardContainer);

			//fade 애니메이션 효과가 필요한 div
			const upElements = document.querySelectorAll<HTMLElement>(".fade-up-section");
			const leftElements = document.querySelectorAll<HTMLElement>(".fade-left-section");

			upElements.forEach(element => {
				element.dataset.side = "up";
				titleObserver.observe(element);
			});
			// leftElements.forEach(element => {
			// 	element.dataset.side = "left";
			// 	titleObserver.observe(element);
			// });

			return () => {
				mobileCardObserver.disconnect();
				upElements.forEach(element => titleObserver.unobserve(element));
				//leftElements.forEach(element => titleObserver.unobserve(element));
			};
		};

		return setupObservers();
	}, []);

	/* 카트리지 (=통칭 카드) 호버 & 펼침 이벤트 관리 */
	useEffect(() => {
		const parentContainer = cartridgeCardsContainerRef.current;
		const cardsDiv = cartridgeCardsRef.current;
		if (!cardsDiv || !parentContainer) return;

		const cards = cardsDiv.querySelectorAll<HTMLElement>(".card");

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
				setTimeout(() => {
					clickedCard.classList.add("clicked");
					moveGameboyHead();
				}, 500);
			} else {
				clickedCard.classList.add("clicked");
				requestAnimationFrame(waitForScrollEnd);
			}

			//게임기로 이동하기 위해 필요한 거리 계산
			const moveGameboyHead = () => {
				const gameboyHead = document.querySelector("#gameboy-head");
				if (gameboyHead) {
					setTimeout(() => {
						const referencePosition = gameboyHead.getBoundingClientRect().top;
						const cardPosition = rect.top;
						const distance = referencePosition - cardPosition - clickedCard.offsetHeight * 0.4;

						//카트리지가 들어간 효과를 위해 추가 Y 값 (= 20)
						clickedCard.style.setProperty("--y-distance", `${distance + 20}px`);
						clickedCard.classList.add("moveY");

						setTimeout(() => {
							window.scrollTo({top: window.scrollY + distance, behavior: "smooth"});
						}, 300);
					}, 800);
				}
			};

			const handleAnimationEnd = () => {
				unlockScroll();
				setTimeout(() => {
					handleClearChanges();
					cards.forEach(card => card.classList.remove("forbid-click", "moveY", "clicked"));

					clickedCard.removeEventListener("animationend", handleAnimationEnd);
				}, 1000);
			};

			clickedCard.addEventListener("animationend", handleAnimationEnd);
		}

		cards.forEach(card => {
			card.addEventListener("click", onCardClick);
		});

		return () => {
			cards.forEach(card => {
				card.removeEventListener("click", onCardClick);
			});
		};
	}, []);

	/* 스크롤 위치에 따라 배경색을 변경하는 로직*/
	// useEffect(() => {
	// 	if (!mainRef.current) return;
	// 	const main = mainRef.current;

	// 	function handleBackgroundColorChange() {
	// 		const startColor: [number, number, number] = [134, 211, 255];
	// 		const endColor: [number, number, number] = [255, 215, 151];

	// 		const scrollTop = window.scrollY;
	// 		const scrollHeight = document.body.scrollHeight;
	// 		const clientHeight = window.innerHeight;
	// 		const scrollFraction = scrollTop / (scrollHeight - clientHeight);

	// 		const r = Math.round(startColor[0] + (endColor[0] - startColor[0]) * scrollFraction);
	// 		const g = Math.round(startColor[1] + (endColor[1] - startColor[1]) * scrollFraction);
	// 		const b = Math.round(startColor[2] + (endColor[2] - startColor[2]) * scrollFraction);

	// 		document.documentElement.style.setProperty("--main-bg", `rgb(${r}, ${g}, ${b})`);
	// 	}

	// 	window.addEventListener("scroll", handleBackgroundColorChange);
	// 	return () => {
	// 		window.removeEventListener("scroll", handleBackgroundColorChange);
	// 	};
	// }, []);

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

	// useEffect(() => {
	// 	const loop = cartridgeCardsRef.current;
	// 	const gallery = cartridgeCardsContainerRef.current;

	// 	if (!loop || !gallery) return;

	// 	const buffer = 500;
	// 	const paddingRight = parseFloat(getComputedStyle(loop).paddingRight || "0");
	// 	const scrollDistance = loop.scrollWidth - gallery.offsetWidth + paddingRight;
	// 	let clickedCard: HTMLElement | null = null;

	// 	const tween = gsap.to(loop, {
	// 		x: -scrollDistance,
	// 		ease: "none",
	// 		scrollTrigger: {
	// 			trigger: ".projects-section",
	// 			start: `top top`,
	// 			end: `+=${scrollDistance * 3}`,
	// 			scrub: true,
	// 			pin: true,
	// 			pinSpacing: true,
	// 			onLeave: () => {
	// 				if (clickedCard) clickedCard.classList.remove("moveY", "clicked");
	// 			},
	// 		},
	// 	});

	// 	let outerTimeout: ReturnType<typeof setTimeout> | null = null;
	// 	let innerTimeout: ReturnType<typeof setTimeout> | null = null;

	// 	function onCardClick(e: MouseEvent) {
	// 		const card = e.currentTarget as HTMLElement;
	// 		clickedCard = card;
	// 		const cardOffset = card.offsetLeft;
	// 		const cardWidth = card.offsetWidth;
	// 		const cardCenter = cardOffset + cardWidth / 2;
	// 		const windowCenter = window.innerWidth / 2;
	// 		const containerWidth = loop!.scrollWidth;
	// 		const viewportWidth = gallery!.offsetWidth;

	// 		const desiredShift = cardCenter - windowCenter;

	// 		let fraction = desiredShift / scrollDistance;
	// 		fraction = Math.max(0, Math.min(1, fraction));

	// 		const tst = tween.scrollTrigger;
	// 		gsap.to(tween, {
	// 			progress: fraction,
	// 			duration: 0.6,
	// 			ease: "power2.inOut",
	// 			onUpdate: () => {
	// 				if (!tst) return;
	// 				const newScroll = tst.start + (tst.end - tst.start) * tween.progress();
	// 				tst.scroll(newScroll);
	// 			},
	// 		});

	// 		card.classList.add("clicked");

	// 		lockScroll();

	// 		outerTimeout = setTimeout(() => {
	// 			card.classList.add("moveY");
	// 			card.addEventListener(
	// 				"transitionend",
	// 				() => {
	// 					innerTimeout = setTimeout(() => {
	// 						unlockScroll();
	// 					}, 500);
	// 				},
	// 				{once: true}
	// 			);
	// 		}, 500);
	// 	}

	// 	const cardsDiv = cartridgeCardsRef.current;
	// 	if (!cardsDiv) return;

	// 	const cards = cardsDiv.querySelectorAll<HTMLElement>(".card");
	// 	cards.forEach(c => c.addEventListener("click", onCardClick));

	// 	return () => {
	// 		tween.scrollTrigger?.kill();
	// 		tween.kill();
	// 		cards.forEach(c => c.removeEventListener("click", onCardClick));
	// 		if (outerTimeout) clearTimeout(outerTimeout);
	// 		if (innerTimeout) clearTimeout(innerTimeout);
	// 	};
	// }, []);

	return (
		<div ref={mainRef} className="pt-52 text-white w-full overflow-hidden flex flex-col items-center justify-start">
			<div className="fixed top-0 p-4 pointer-events-none w-full">
				<div className="w-full flex flex-row items-center justify-between mb-auto">
					<span>ha</span>
				</div>
			</div>

			<section className="w-full flex flex-col items-center">
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
									<feTurbulence id="turbwave" type="fractalNoise" baseFrequency="0.02 0.04" numOctaves="3" result="turbulence" />
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
											className={`char char-${k}`}
											width={70}
											height={70}
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
			<div ref={beachRef} className="w-full h-fit beach-container">
				<svg width="0" height="0">
					<defs>
						<filter id="gooey">
							<feTurbulence id="turbGooey" type="fractalNoise" baseFrequency="0.01 0.04" numOctaves="1" result="turbulence" />
							<feDisplacementMap id="dispGooey" in="SourceGraphic" in2="turbulence" scale="70" />
						</filter>
					</defs>
				</svg>

				<div className="gooey-overlay z-20"></div>
				<div className="grain-overlay" />
				<section ref={stickyRef} className="pt-24 flex flex-row w-full min-h-screen justify-between items-center shore">
					<div className="fade-up-section flex flex-col justify-start items-start mb-auto">
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
						<p className="description text-s max-w-1/2 whitespace-pre-line">{textFile["001"]}</p>
					</div>

					<div ref={towelsRef} className="towels-container pt-32 spread">
						<div className="towel-wrapper">
							<svg>
								<filter id="wibble-1">
									<feTurbulence id="turbTowel-1" type="fractalNoise" baseFrequency="0.002 0.003" numOctaves="1" result="turbulence" />
									<feDisplacementMap in2="turbulence" in="SourceGraphic" scale="0" xChannelSelector="R" yChannelSelector="G" />
								</filter>
							</svg>
							<div data-towel-index="1" className="towel w-full flex flex-col items-start justify-start p-10" style={{filter: "url(#wibble-1)"}}>
								<p className="text-xl">Frontend Developer</p>
								<p>BATON</p>
								<ul>
									<li>
										React.js, Next.js, Typescript, jQuery 등을 사용하여 다양한 클라이언트의 웹 애플리케이션과 관리자 페이지를 개발하고,
										반응형 디자인과 최적화된 애니메이션을 구현했습니다.
									</li>
									<li>
										필요에 따라 API 설계와 MySQL과 PostgreSQL 데이터베이스 설계 및 쿼리 작성 등 백엔드 작업을 포함한 통합 개발을 수행하여
										프론트-백 간의 원활한 데이터 연동을 구현했습니다.
									</li>
									<li>
										팀의 개발 효율성을 위해 적극적으로 새로운 스택을 테스트하고 도입하여 팀의 개발 시스템을 현대화하고 작업 생산성 향상에
										기여했습니다.
									</li>
								</ul>
								<p className="tag mt-auto ml-auto">2023년 8월 - 2024년 11월</p>
							</div>
						</div>
						<div className="towel-wrapper">
							<svg>
								<filter id="wibble-2">
									<feTurbulence id="turbTowel-2" type="fractalNoise" baseFrequency="0.002 0.003" numOctaves="1" result="turbulence" />
									<feDisplacementMap in2="turbulence" in="SourceGraphic" scale="0" xChannelSelector="R" yChannelSelector="G" />
								</filter>
							</svg>
							<div data-towel-index="2" className="towel w-full flex flex-col items-start justify-start p-10" style={{filter: "url(#wibble-2)"}}>
								<p className="text-xl">Software Engineer</p>
								<p>Market Stadium</p>
								<ul>
									<li>
										풀스택 개발자 인턴으로 React.js, Semantic UI, Chart.js를 사용하여 macroeconomics 지표 데이터를 그래프로 시각화하는
										대시보드 기능을 구현했습니다.
									</li>
									<li>DynamoDB 와 연동된 RESTful API를 개발하여 관련 데이터를 관리하고 조회하는 기능을 만들었습니다.</li>
									<li>Mocha와 Chai를 이용해 데이터 유효성 검증 테스트를 추가하여 안정성을 높였습니다.</li>
								</ul>
								<p className="tag mt-auto ml-auto">2023년 8월 - 2024년 11월</p>
							</div>
						</div>
						<div className="towel-wrapper">
							<svg>
								<filter id="wibble-3">
									<feTurbulence id="turbTowel-3" type="fractalNoise" baseFrequency="0.002 0.003" numOctaves="1" result="turbulence" />
									<feDisplacementMap in2="turbulence" in="SourceGraphic" scale="0" xChannelSelector="R" yChannelSelector="G" />
								</filter>
							</svg>
							<div data-towel-index="3" className="towel w-full flex flex-col items-start justify-start p-10" style={{filter: "url(#wibble-3)"}}>
								<p className="text-xl">Bachelor's Degree of Computer Science</p>
								<p>The State University of New York, Stony Brook</p>
								<p>Stony Brook University에서 Computer Science를 전공했습니다.</p>
								<p className="tag mt-auto ml-auto">2023년 8월 - 2024년 11월</p>
							</div>
						</div>
					</div>
				</section>
			</div>
			<section className="w-full full-section min-h-screen text-center font-dunggeunmo projects-section">
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
				<div
					ref={cartridgeCardsContainerRef}
					className="gallery w-full flex items-start justify-center overflow-x-auto overflow-y-hidden min-h-screen md:min-h-[100vh]"
				>
					<div ref={cartridgeCardsRef} className="cartridge-loop h-fit flex flex-row w-full gap-8 md:gap-24 md:py-40">
						{Object.entries(projects).map(([k, v]) => (
							<div key={v.title} data-project={k} className={`card card-${k} w-fit`}>
								<Cartridge project={v} />
							</div>
						))}
					</div>
				</div>
				{/* <div
					ref={cartridgeCardsContainerRef}
					className="w-full flex items-start justify-center overflow-x-auto overflow-y-visible min-h-screen md:min-h-[100vh]"
				>
					<div ref={cartridgeCardsRef} className="cartridge-cards relative spread">
						{Object.entries(projects).map(([k, v]) => (
							<div key={v.title} className={`card card-${k}`} onClick={() => setSelectedProjectTitle(k)}>
								<Cartridge project={v} />
							</div>
						))}
					</div>
				</div> */}
				<div className={`relative -mt-32 gameboy-section ${isGameboyOn && "power-on"} flex flex-col items-center justify-center`}>
					<Gameboy project={selectedProject} />
				</div>
			</section>
			{selectedProject && isGameboyOn && (
				<section className="project-section full-section font-dunggeunmo w-full h-screen flex flex-col items-center justify-start bg-blue-400 relative">
					<div className="project-header tracking-widest z-40 text-xl py-8 px-24 pb-8 w-full sticky top-0 flex flex-row items-start justify-between">
						<div className="flex flex-col items-center justify-start">
							<p>PERSON</p>
							<p className="text-theme-yellow">X {selectedProject.ppl_count || 1}</p>
						</div>
						<div className="flex flex-col items-center justify-start">
							<p className="text-xxxl text-theme-yellow">{selectedProject.title.toUpperCase()}</p>
							<p>{selectedProject?.subtitle}</p>
						</div>

						<div className="stacks-box flex flex-row p-4 outline-2 outline-black">
							<Image src="/icons/mysql.png" alt="stack" width={200} height={200} />
						</div>
					</div>

					<div className="project-detail flex flex-col md:flex-row w-full h-full items-start justify-start relative px-12 md:px-[15%] mt-16">
						<Swiper
							modules={[Pagination, Autoplay]}
							pagination={{clickable: true}}
							spaceBetween={20}
							slidesPerView={1}
							loop={true}
							autoplay={{delay: 5000, disableOnInteraction: true}}
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
								<div className={`arrow-text flex flex-row items-center justify-start overflow-hidden h-fit ${isSpecialSlide ? "show" : ""}`}>
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
							<ul>{selectedProject.introduction_kr?.map((intro, i) => <li key={i}>{intro}</li>)}</ul>
							<div className="sub">
								<p>주요 성과 및 기여</p>
							</div>
							<ul>{selectedProject.contribution_kr?.map(c => <li>{c}</li>)}</ul>
							<div className="sub mt-4">
								<p>회고</p>
							</div>
							<ul>{selectedProject.review_kr?.map(r => <li>{r}</li>)}</ul>
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
