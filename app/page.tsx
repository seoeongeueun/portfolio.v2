"use client";
import Image from "next/image";
import {MdKeyboardDoubleArrowDown} from "react-icons/md";
import TextEn from "./data/text-en.json" assert {type: "json"};
import {useEffect, useState, useRef, useCallback, act} from "react";
import Cartridge from "./components/cartridge";
import Gameboy from "./components/gameboy";
import ProjectsData from "./data/projects.json" assert {type: "json"};
import "./styles/global.scss";
import "./styles/gsap.scss";
import {stacks} from "./lib/constants";
import gsap from "gsap";
import {Observer} from "gsap/Observer";

gsap.registerPlugin(Observer);

const getRandomInt = (val: number): number => Math.ceil(Math.random() * val) * (Math.random() < 0.5 ? -1 : 1);

type TextFileType = Record<string, string>;
interface Project {
	title: string;
	subtitle: string;
	thumbnail: string;
	tags: string[];
	theme: string;
}

interface Projects {
	[key: string]: Project;
}

export default function Home() {
	const [textFile, setTextFile] = useState<TextFileType>(TextEn);
	const [projects, setProjects] = useState<Projects>(ProjectsData);
	const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
	const [tags, setTags] = useState<string[]>(["WORK", "PERSONAL"]);
	const [selectedProjectTitle, setSelectedProjectTitle] = useState<string>("");
	const [isGameboyOn, setIsGameboyOn] = useState<boolean>(false);
	//const [chars, setChars] = useState<string[]>(["typescript", "javascript"]);

	const bowlRef = useRef<HTMLDivElement | null>(null);
	const mainRef = useRef<HTMLDivElement>(null);
	const stickyRef = useRef<HTMLDivElement>(null);
	const careerCardsRef = useRef<HTMLDivElement>(null);
	const cartridgeCardsContainerRef = useRef<HTMLDivElement>(null);
	const cartridgeCardsRef = useRef<HTMLDivElement>(null);
	const mainTitleRef = useRef<HTMLParagraphElement>(null);
	const miniTitleRef = useRef<HTMLParagraphElement>(null);
	const gameboyHeadRef = useRef<HTMLDivElement>(null);

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

	useEffect(() => {
		if (!bowlRef.current) return;

		gsap.defaults({overwrite: true});

		gsap.to(".char", {
			xPercent: () => getRandomInt(10),
			yPercent: () => getRandomInt(10),
			rotation: () => getRandomInt(20),
			duration: 5,
		});

		const moveChars = (obj: {event: MouseEvent; deltaX: number; deltaY: number}) => {
			const {event, deltaX, deltaY} = obj;
			const el = event.target as HTMLElement;
			const id = el.classList.contains("char") ? el.className.match(/char-(\S+)/)?.[1] : null;

			if (!id) return; // If no ID is found, exit function

			const shadow = document.querySelector(`.shadow-${id}`) as HTMLElement;
			const r = el.getBoundingClientRect();
			const y = event.clientY - (r.top + Math.floor(r.height / 2));
			const t = 5;

			// Move both char and shadow
			gsap.to(el, {
				xPercent: `+=${deltaX * t}`,
				yPercent: `+=${deltaY * t}`,
				rotation: `-=${deltaX * t * Math.sign(y)}`,
				duration: 3,
				ease: "expo.out",
			});

			if (shadow) {
				gsap.to(shadow, {
					xPercent: `+=${deltaX * t}`,
					yPercent: `+=${deltaY * t}`,
					duration: 3,
					ease: "expo.out",
				});
			}
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

		return () => observer.kill();
	}, [stacks]);

	//sticky div가 맨 위에 붙은 상황 (지금 화면의 중심인 경우)
	useEffect(() => {
		if (!careerCardsRef.current || !stickyRef.current) return;

		const container = careerCardsRef.current;
		const cards = Array.from(container.querySelectorAll<HTMLDivElement>(".career-card"));
		const cardHeight = cards[0]?.offsetHeight || 0;
		const totalCards = cards.length;
		const totalScrollHeight = cardHeight * totalCards;
		const marginTop = cardHeight / -2; //카드 사이 간격을 줄이기 위해 카드 높이 반을 뺌

		let currentOffset = 0;
		let prevScrollTop = window.scrollY;
		let positions = cards.map((_, i) => i * cardHeight);

		const isStickyVisible = () => {
			//무한 카드 스위칭을 막기 위해 하단에 카드 세개가 남았을 때 루프를 종료
			const rect = stickyRef.current!.getBoundingClientRect();
			return rect.bottom > cardHeight * 3 && rect.top < window.innerHeight;
		};

		const updateHighlight = () => {
			let closestCard = null;
			let closestDistance = Infinity;

			cards.forEach(card => {
				const rect = card.getBoundingClientRect();
				const distanceToTop = Math.abs(rect.top);

				if (distanceToTop < closestDistance) {
					closestDistance = distanceToTop;
					closestCard = card;
				}

				card.classList.remove("highlighted");
			});

			if (closestCard) {
				(closestCard as HTMLDivElement).classList.add("highlighted");
			}
		};

		const updatePositions = deltaY => {
			currentOffset += deltaY;
			if (isStickyVisible()) {
				cards.forEach((card, index) => {
					positions[index] += deltaY;

					// Loop card positions when they exit the viewport
					if (positions[index] <= -cardHeight) {
						positions[index] += (cardHeight + marginTop) * (totalCards * totalCards);
					}

					if (positions[index] >= totalScrollHeight) {
						positions[index] -= (cardHeight + marginTop) * (totalCards * totalCards);
					}
					card.style.setProperty("--y-distance", positions[index] + "px");
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

	useEffect(() => {
		if (!gameboyHeadRef.current || !isGameboyOn) return;

		const gameboyHead = gameboyHeadRef.current;
		const gameboyScreen = gameboyHead.querySelector<HTMLDivElement>(".gameboy-screen");
		if (!gameboyScreen) return;

		const initialScrollY = window.scrollY;
		let maxScreenWidth = window.innerWidth * 0.7; // 최대 70vw
		let maxScale = maxScreenWidth / gameboyScreen.offsetWidth; // 최대 scale 값
		let lastScrollY = window.scrollY; // 이전 스크롤 위치

		const originalLeft = gameboyScreen.offsetLeft; //scale 적용 전에 screen의 왼쪽 거리를 계산

		const handleScroll = () => {
			const scrollY = window.scrollY;
			let scrollDiff = scrollY - initialScrollY; // 기준점 대비 스크롤 이동량

			// 스크롤 위 방향 감지
			if (scrollY < lastScrollY) {
				//스크롤을 올릴 때는 자연스럽게 작아지기 위해 기준점을 현재 위치에서 200px 정도 멀리 잡는다
				scrollDiff -= 100;
			} else {
				scrollDiff += 300;
			}
			let newScale = 1 + scrollDiff * 0.002;
			// 1보다는 크고 maxscale보다는 작게
			newScale = Math.max(1, Math.min(newScale, maxScale));

			//1 이하로는 작아지지 못하게 지정
			gameboyHead.style.setProperty("--scale", newScale.toString());

			lastScrollY = scrollY;
		};

		window.addEventListener("scroll", handleScroll);
		return () => {
			window.removeEventListener("scroll", handleScroll);
		};
	}, [isGameboyOn]);

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

		const handleStickyIntersection: IntersectionObserverCallback = (entries, observer) => {
			entries.forEach(entry => {
				console.log(entry.boundingClientRect.top);
				if (entry.boundingClientRect.top <= 0) {
					entry.target.classList.add("stuck");
					console.log("styck");
					lockScroll();
				} else {
					entry.target.classList.remove("stuck");
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

		const handleMouseEnter = (event: MouseEvent) => {
			// const hoveredCard = event.currentTarget as HTMLElement;
			// setTimeout(() => {
			// 	hoveredCard?.scrollIntoView({behavior: "smooth", block: "nearest", inline: "center"});
			// }, 500);
		};
		function onCardClick(event: MouseEvent) {
			const clickedCard = event.currentTarget as HTMLElement;
			const rect = clickedCard.getBoundingClientRect();
			if (!rect || !cardsDiv || !parentContainer) return;

			const cards = cardsDiv.querySelectorAll<HTMLElement>("#card");
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
				top: 0,
				left: targetScroll,
				behavior: "smooth",
			});

			const waitForScrollEnd = () => {
				if (Math.abs(parentContainer.scrollLeft - targetScroll) < 1) {
					const actualDelta = currentScroll + desiredDelta - targetScroll;

					if (actualDelta !== 0 && Math.round(targetScroll) !== Math.round(desiredDelta)) {
						const computedLeft = getComputedStyle(cardsDiv).left || "0";
						const currentLeft = parseFloat(computedLeft);

						const newLeft = desiredDelta < 0 ? currentLeft + Math.abs(desiredDelta) : currentLeft - actualDelta;

						cardsDiv.style.transition = "left 1s ease-in-out 0.2s";
						cardsDiv.style.left = `${newLeft}px`;

						setTimeout(() => {
							moveGameboyHead();
						}, 1400);
					} else {
						cardsDiv.style.left = "";
						cardsDiv.style.transition = "";
						setTimeout(() => {
							moveGameboyHead();
						}, 800);
					}
				} else {
					requestAnimationFrame(waitForScrollEnd);
				}
			};
			clickedCard.classList.add("clicked");
			requestAnimationFrame(waitForScrollEnd);

			//게임기로 이동하기 위해 필요한 거리 계산
			const moveGameboyHead = () => {
				const gameboyHead = document.querySelector("#gameboy-head");
				if (gameboyHead) {
					const referencePosition = gameboyHead.getBoundingClientRect().top;
					const cardPosition = rect.top;
					const distance = referencePosition - cardPosition - clickedCard.offsetHeight * 0.4;

					//카트리지가 들어간 효과를 위해 추가 Y 값 (= 20)
					clickedCard.style.setProperty("--y-distance", `${distance + 20}px`);
					clickedCard.classList.add("moveY");
					setTimeout(() => {
						gameboyHeadRef.current?.scrollIntoView({behavior: "smooth", block: "center", inline: "center"});
					}, 300);
				}
			};

			const handleAnimationEnd = () => {
				setIsGameboyOn(true);

				setTimeout(() => {
					// clickedCard.classList.remove("clicked");
					// cardsDiv.style.left = "";
					// cardsDiv.style.transition = "";

					clickedCard.removeEventListener("animationend", handleAnimationEnd);
				}, 700);
			};

			clickedCard.addEventListener("animationend", handleAnimationEnd);
		}
		const cards = cardsDiv.querySelectorAll<HTMLElement>("#card");
		cards.forEach(card => {
			card.addEventListener("mouseenter", handleMouseEnter);
			card.addEventListener("click", onCardClick);
		});

		return () => {
			cards.forEach(card => {
				card.removeEventListener("mouseenter", handleMouseEnter);
				card.removeEventListener("click", onCardClick);
			});
		};
	}, []);

	/* 스크롤 위치에 따라 배경색을 변경하는 로직*/
	useEffect(() => {
		if (!mainRef.current) return;
		const main = mainRef.current;

		function handleBackgroundColorChange() {
			const startColor: [number, number, number] = [216, 221, 224];
			const endColor: [number, number, number] = [0, 0, 46];

			const scrollTop = window.scrollY;
			const scrollHeight = document.body.scrollHeight;
			const clientHeight = window.innerHeight;
			const scrollFraction = scrollTop / (scrollHeight - clientHeight);

			const r = Math.round(startColor[0] + (endColor[0] - startColor[0]) * scrollFraction);
			const g = Math.round(startColor[1] + (endColor[1] - startColor[1]) * scrollFraction);
			const b = Math.round(startColor[2] + (endColor[2] - startColor[2]) * scrollFraction);

			document.documentElement.style.setProperty("--main-bg", `rgb(${r}, ${g}, ${b})`);
		}

		window.addEventListener("scroll", handleBackgroundColorChange);
		return () => {
			window.removeEventListener("scroll", handleBackgroundColorChange);
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

	return (
		<div ref={mainRef} className="py-52 text-gray-4 w-full h-[300vh] flex flex-col items-center justify-start gap-4 overflow-visible">
			<div className="fixed top-0 p-4 pointer-events-none w-full">
				<div className="w-full flex flex-row items-center justify-between mb-auto">
					<span>ha</span>
				</div>
			</div>

			<div className="container">
				<div className="placemat" />

				<div ref={bowlRef} className="bowl">
					<div className="ladder">
						<div className="step"></div>
						<div className="step"></div>
						<div className="step"></div>
						<div className="step"></div>
					</div>
					{Object.keys(stacks).flatMap(k => {
						const top = getRandomInt(40);
						const left = getRandomInt(40);

						return [
							<Image
								key={k + "-icon"}
								src={`/icons/${k}.png`}
								alt="typescript"
								className={`char char-${k}`}
								width={70}
								height={70}
								style={{
									top: `${top}%`,
									left: `${left}%`,
								}}
							/>,
							<div
								key={k + "-shadow"}
								className={`shadow shadow-${k}`}
								style={{
									top: `calc(${top}% + 10%)`,
									left: `calc(${left}% + 1%)`,
								}}
							></div>,
						];
					})}
				</div>
			</div>
			<section className="flex-col">
				<div className="flex flex-col justify-center items-center">
					<p ref={miniTitleRef} className="underline-text opacity-0 ml-auto text-gray-4 text-s lg:text-xl rotate-10 -mb-8 md:-mb-[3rem] z-30">
						FRONTEND DEVELOPER
					</p>
					<p ref={mainTitleRef} className="main-title md:whitespace-nowrap font-normal text-center text-[7rem] md:text-[10rem] lg:text-[12rem]">
						SEONGEUN
					</p>
				</div>

				<div className="flex flex-wrap items-center justify-center w-full gap-1 md:gap-8 shrink-0">
					{Object.entries(stacks).map(([k, v]) => (
						<div key={k} className="p-2 group relative w-12 h-12 md:w-20 md:h-20 shrink-0">
							<Image alt={k + "-icon"} src={`/icons/${k}.svg`} width={50} height={50} />
							<div className="group-hover:opacity-100 opacity-0 transition-opacity duration-300 overflow-hidden absolute text-center w-full h-full top-0 left-0 flex items-center justify-center bg-black/50 rounded-sm">
								<span className=" font-nanumbarunpen text-white !font-extralight text-xxs whitespace-pre-line">{v.toUpperCase()}</span>
							</div>
						</div>
					))}
				</div>
				<img src="/assets/thekid.gif" alt="kid" className="mt-[10rem]" />
				<div className="fixed bottom-0 p-20 pointer-events-none z-[99]">
					<div className="flex flex-col items-center justify-center text-white text-xl">
						<span className="drop-shadow-md">{textFile["000"]}</span>
						<MdKeyboardDoubleArrowDown color="white" size="3rem" className="animate-slide-down drop-shadow-lg"></MdKeyboardDoubleArrowDown>
					</div>
				</div>
			</section>
			<section ref={stickyRef} className="pt-32 flex-row !justify-between !items-end mb-[10rem]">
				<div className="fade-up-section flex flex-col justify-start items-start mb-auto">
					<p className="subtitle">CAREER</p>
					<p className="text-s max-w-1/2 whitespace-pre-line">{textFile["001"]}</p>
				</div>
				<div ref={careerCardsRef} className="career-cards-container pt-32 spread">
					<div className="career-card w-full bg-red-500 p-10">
						<p className="text-lg text-white">Frontend Developer</p>
						<div className="mb-2 flex flex-row items-center justify-between w-full">
							<p>BATON</p>
							<p>2023년 8월 - 2024년 11월</p>
						</div>
						<ul>
							<li>
								React.js, Next.js, Typescript, jQuery 등을 사용하여 다양한 클라이언트의 웹 애플리케이션과 관리자 페이지를 개발하고, 반응형
								디자인과 최적화된 애니메이션을 구현했습니다.
							</li>
							<li>
								필요에 따라 API 설계와 MySQL과 PostgreSQL 데이터베이스 설계 및 쿼리 작성 등 백엔드 작업을 포함한 통합 개발을 수행하여 프론트-백
								간의 원활한 데이터 연동을 구현했습니다.
							</li>
							<li>
								팀의 개발 효율성을 위해 적극적으로 새로운 스택을 테스트하고 도입하여 팀의 개발 시스템을 현대화하고 작업 생산성 향상에
								기여했습니다.
							</li>
						</ul>
					</div>
					<div className="career-card w-full bg-yellow-500 p-10">
						<p className="text-lg text-white">Software Engineer</p>
						<div className="mb-2 flex flex-row items-center justify-between w-full">
							<p>Market Stadium</p>
							<p>2023년 8월 - 2024년 11월</p>
						</div>
						<ul>
							<li>
								풀스택 개발자 인턴으로 React.js, Semantic UI, Chart.js를 사용하여 macroeconomics 지표 데이터를 그래프로 시각화하는 대시보드
								기능을 구현했습니다.
							</li>
							<li>DynamoDB 와 연동된 RESTful API를 개발하여 관련 데이터를 관리하고 조회하는 기능을 만들었습니다.</li>
							<li>Mocha와 Chai를 이용해 데이터 유효성 검증 테스트를 추가하여 안정성을 높였습니다.</li>
						</ul>
					</div>
					<div className="career-card w-full flex flex-col items-start justify-start bg-cyan-500 p-10">
						<p className="text-lg text-white">Bachelor's Degree of Computer Science</p>
						<div className="mb-2 flex flex-row items-center justify-between w-full">
							<p>The State University of New York, Stony Brook</p>
							<p>2023년 8월 - 2024년 11월</p>
						</div>
						<p>Stony Brook University에서 Computer Science를 전공했습니다.</p>
					</div>
				</div>
			</section>
			<section className="flex-col full-section !h-fit">
				<p className="subtitle">PROJECTS</p>
				<div className="w-full text-gray-4 h-fit flex flex-row items-center justify-center gap-[5rem] tracking-tighter text-lg md:text-xl ">
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
					className="w-full flex items-start justify-center overflow-x-auto overflow-y-visible min-h-screen md:min-h-[100vh]"
				>
					<div ref={cartridgeCardsRef} className="cartridge-cards relative">
						{Object.entries(projects).map(([k, v]) => (
							<div id="card" key={v.title} className={`card card-${k}`} onClick={() => setSelectedProjectTitle(k)}>
								<Cartridge project={v} />
							</div>
						))}
					</div>
				</div>
				<div ref={gameboyHeadRef} className={`relative gameboy-section mt-60 ${isGameboyOn && "power-on"}`}>
					<Gameboy project={ProjectsData[selectedProjectTitle as keyof typeof ProjectsData]} />
				</div>
			</section>
			<section className="flex-col bg-red-100 opacity-50 mt-[150vh] fade-up-section">
				<div className="flex flex-col justify-start items-center mb-auto">
					<p className="subtitle">CONTACTS</p>
					<p className="text-s max-w-1/2 whitespace-pre-line">{textFile["001"]}</p>
				</div>
			</section>
		</div>
	);
}
