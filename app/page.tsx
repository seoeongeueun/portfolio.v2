"use client";
import Image from "next/image";
import StackIcon from "tech-stack-icons";
import {MdKeyboardDoubleArrowDown} from "react-icons/md";
import TextEn from "./data/text-en.json" assert {type: "json"};
import {useEffect, useState, useRef} from "react";
import Cartridge from "./components/cartridge";
import Gameboy from "./components/gameboy";
import ProjectsData from "./data/projects.json" assert {type: "json"};
import "./styles/global.scss";

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
	const [tags, setTags] = useState<string[]>(["WORK", "PERSONAL"]);
	const mainRef = useRef<HTMLDivElement>(null);
	const longDivRef = useRef<HTMLDivElement>(null);
	const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
	const stacks = {
		js: "java\nscript",
		typescript: "type\nscript",
		python: "python",
		reactjs: "react.js",
		nextjs2: "next.js",
		electron: "electron",
		nodejs: "node.js",
		redux: "redux",
		docker: "docker",
		postgresql: "postgre\nsql",
		mongodb: "mongo\ndb",
		css3: "css",
		html5: "html",
		tailwindcss: "tailwind css",
		ps: "photo\nshop",
	};

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
		const throttle = (callback: Function, delay: number) => {
			let lastCall = 0;
			return (...args: any) => {
				const now = Date.now();
				if (now - lastCall >= delay) {
					lastCall = now;
					callback(...args);
				}
			};
		};

		const handleMobileCardIntersection: IntersectionObserverCallback = (entries, observer) => {
			entries.forEach(entry => {
				if (entry.isIntersecting) {
					const cardContainer = document.querySelector<HTMLDivElement>("#cartridge-cards-container");
					const firstChild = cardContainer?.firstElementChild as HTMLElement | null;

					if (firstChild) {
						firstChild.classList.add("spread");
					}
					if (cardContainer) {
						//카드 중앙으로 스크롤
						const halfScroll = cardContainer.scrollWidth / 2;
						cardContainer.scrollLeft = halfScroll;
						observer.unobserve(entry.target);
					}
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
			const cardContainer = document.querySelector<HTMLDivElement>(".cartridge-cards");
			if (!cardContainer) return;

			const mobileCardObserver = new IntersectionObserver(handleMobileCardIntersection, {
				root: null,
				rootMargin: "0px",
				threshold: 0.6,
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
			leftElements.forEach(element => {
				element.dataset.side = "left";
				titleObserver.observe(element);
			});

			return () => {
				mobileCardObserver.disconnect();
				upElements.forEach(element => titleObserver.unobserve(element));
				leftElements.forEach(element => titleObserver.unobserve(element));
			};
		};

		const setupCardHoverEvents = () => {
			const cardList = document.querySelectorAll<HTMLElement>(".cartridge-cards #card");
			const parentContainer = document.querySelector<HTMLDivElement>("#cartridge-cards-container");

			if (!parentContainer) return;

			const handleMouseEnter = (event: MouseEvent) => {
				const hoveredCard = event.currentTarget as HTMLElement;
				cardList.forEach(card => card.classList.remove("selected"));
				//hoveredCard.scrollIntoView({behavior: "smooth", block: "nearest", inline: "center"});

				const addSelectedClass = () => {
					document.querySelectorAll(".cartridge-cards #card").forEach(card => card.classList.remove("selected"));
					hoveredCard.classList.add("selected");
				};
				setTimeout(addSelectedClass, 100);
			};

			const handleMouseLeave = (event: MouseEvent) => {
				const hoveredCard = event.currentTarget as HTMLElement;
				hoveredCard.classList.remove("selected");
			};

			const handleCardClick = (event: MouseEvent) => {
				const clickedCard = event.currentTarget as HTMLElement;
				const rect = clickedCard.getBoundingClientRect();
				const cardsDiv = document.querySelector<HTMLDivElement>("#cartridge-cards");
				if (!cardsDiv) return;

				if (!rect) return;

				document.querySelectorAll(".cartridge-cards #card").forEach(card => card.classList.remove("clicked"));

				const parentWidth = parentContainer.clientWidth;
				const scrollWidth = parentContainer.scrollWidth;
				const cardLeft = clickedCard.offsetLeft;
				const cardWidth = clickedCard.clientWidth;
				const scrollLeft = parentContainer.scrollLeft;

				/* 
					선택된 카드를 중앙으로 위치하게 스크롤 하는 로직 + 자동으로 필요한 만큼 여백 추가
					어떤 디자인을 택할지에 따라 사용하지 않을 수도 있음
				*/

				//첫번째 카드의 시작 위치를 빼서 여백 없는 정확한 카드 뭉치의 너비를 계산
				const firstCard = document.querySelector<HTMLDivElement>(".card-1");
				if (!firstCard) return;
				const computedLeft = (getComputedStyle(cardsDiv).left || "0").replace("px", "");
				const currentLeft = parseFloat(computedLeft);

				const leftMargin = Math.abs(firstCard.offsetLeft) - currentLeft;
				const absoluteCenter = window.innerWidth / 2 - cardWidth / 2;
				const distanceNeeded = rect.left - absoluteCenter;
				const remainingScroll = parentContainer.scrollWidth - parentContainer.clientWidth - parentContainer.scrollLeft;

				console.log("remianing: ", remainingScroll);
				console.log("distnace: ", distanceNeeded);
				parentContainer.scrollTo({top: 0, left: parentContainer.scrollLeft + distanceNeeded, behavior: "smooth"});
				//스크롤이 이미 가장자리이기 때문에 추가 여백이 필요함

				if (remainingScroll - Math.abs(distanceNeeded) < 0) {
					console.log("adding margin");
					const margin = distanceNeeded - remainingScroll;

					// 왼쪽 가장자리인지, 오른쪽 가장자리인지에 따라 다른 계산 (margin < 0 => 왼쪽 가장자리)
					cardsDiv.style.left = `${margin < 0 ? currentLeft + leftMargin + Math.abs(distanceNeeded) - remainingScroll : margin * -1}px`;
				} else {
					cardsDiv.style.left = "";
				}

				clickedCard.classList.add("clicked");

				//게임기로 이동하기 위해 필요한 거리 계산
				const gameboyHead = document.querySelector("#gameboy-head");
				if (gameboyHead) {
					const position = gameboyHead.getBoundingClientRect()?.top;
					const current = rect?.top;
					const currentScroll = document.querySelector("#main")?.scrollTop || 0;

					// 게임기 위치 - 카드의 현재 y 위치 - 현재 스크롤 위치 / 2
					const distance = position - current - currentScroll / 2;
					clickedCard.style.setProperty("--y-distance", `${distance}px`);
				}

				const handleAnimationEnd = () => {
					//gameboyHead?.scrollIntoView({behavior: "smooth"});
					setTimeout(() => {
						clickedCard.classList.remove("clicked");
						clickedCard.removeEventListener("animationend", handleAnimationEnd);
						cardsDiv.style.left = "";
					}, 700);
				};

				clickedCard.addEventListener("animationend", handleAnimationEnd);

				return () => {
					clickedCard.removeEventListener("animationend", handleAnimationEnd);
				};
			};

			cardList.forEach(card => {
				card.addEventListener("mouseenter", handleMouseEnter);
				card.addEventListener("mouseleave", handleMouseLeave);
				card.addEventListener("click", handleCardClick);
			});

			return () => {
				cardList.forEach(card => {
					card.removeEventListener("mouseenter", handleMouseEnter);
					card.removeEventListener("mouseleave", handleMouseLeave);
					card.removeEventListener("click", handleCardClick);
				});
			};
		};

		setupObservers();
		setupCardHoverEvents();

		const main = document.querySelector<HTMLDivElement>("#main");
		if (!main) return;

		const handleBackgroundColorChange = (startColor: [number, number, number], endColor: [number, number, number]) => {
			const scrollFraction = main.scrollHeight > main.clientHeight ? main.scrollTop / (main.scrollHeight - main.clientHeight) : 0;

			const r = Math.round(startColor[0] + (endColor[0] - startColor[0]) * scrollFraction);
			const g = Math.round(startColor[1] + (endColor[1] - startColor[1]) * scrollFraction);
			const b = Math.round(startColor[2] + (endColor[2] - startColor[2]) * scrollFraction);

			main.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
		};

		main.addEventListener("scroll", () => handleBackgroundColorChange([216, 221, 224], [0, 0, 46]));

		const title = document.querySelector<HTMLDivElement>("#main-title");
		const miniTitle = document.querySelector<HTMLDivElement>("#mini-title");

		if (!title || !miniTitle) return;

		const handleAnimationEnd = () => {
			miniTitle.classList.add("loaded");
			title.removeEventListener("animationend", handleAnimationEnd); // Cleanup
		};

		title.addEventListener("animationend", handleAnimationEnd);

		return () => {
			main.removeEventListener("scroll", () => handleBackgroundColorChange([216, 221, 224], [0, 0, 46]));
		};
	}, []);

	const handleProjectsFilter = (e: React.ChangeEvent<HTMLInputElement>) => {
		const {name, checked} = e.target as HTMLInputElement;

		setTags(prev => {
			if (checked) {
				return [...prev, name.toUpperCase()];
			} else {
				return prev.filter(filter => filter !== name.toUpperCase());
			}
		});
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
		<div
			id="main"
			ref={mainRef}
			className="py-52 text-gray-4 w-full h-full flex flex-col items-center justify-start overflow-y-scroll overflow-x-hidden gap-4"
		>
			<section>
				<div className="flex flex-col justify-center items-center">
					<p id="mini-title" className="underline-text opacity-0 ml-auto text-gray-4 text-s lg:text-xl rotate-10 -mb-8 md:-mb-[3rem] z-30">
						FRONTEND DEVELOPER
					</p>
					<p id="main-title" className="main-title md:whitespace-nowrap font-normal text-center text-[7rem] md:text-[10rem] lg:text-[12rem]">
						SEONGEUN PARK
					</p>
				</div>

				<div className="flex flex-wrap items-center justify-center w-full gap-1 md:gap-8 shrink-0">
					{Object.entries(stacks).map(([k, v]) => (
						<div key={k} className="p-2 group relative w-12 h-12 md:w-20 md:h-20 shrink-0">
							<StackIcon name={k} className="w-full h-full" />
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
			<section className="!items-end px-80">
				<div className="fade-up-section flex flex-col justify-start items-start mr-auto">
					<p className="subtitle">CAREER</p>
					<p className="text-s max-w-1/2 whitespace-pre-line">{textFile["001"]}</p>
				</div>
				<div ref={longDivRef} className="career-cards-container fade-left-section">
					<div className="career-card w-full bg-red-500 p-10 rounded-xl">
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
					<div className="career-card w-full bg-yellow-500 p-10 rounded-xl">
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
					<div className="career-card w-full flex flex-col items-start justify-start bg-cyan-500 p-10 rounded-xl">
						<p className="text-lg text-white">Bachelor's Degree of Computer Science</p>
						<div className="mb-2 flex flex-row items-center justify-between w-full">
							<p>The State University of New York, Stony Brook</p>
							<p>2023년 8월 - 2024년 11월</p>
						</div>
						<p>Stony Brook University에서 Computer Science를 전공했습니다.</p>
					</div>
				</div>
			</section>
			<section>
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
					id="cartridge-cards-container"
					className="w-full flex items-start justify-center overflow-x-auto overflow-y-visible min-h-screen md:min-h-[100vh]"
				>
					<div id="cartridge-cards" className="cartridge-cards relative">
						{/* <div id="card" className="card card-4">
						<Cartridge />
					</div>
					<div id="card" className="card card-3">
						<Cartridge />
					</div>
					<div id="card" className="card card-2">
						<Cartridge />
					</div>
					<div id="card" className="card card-1">
						<Cartridge />
					</div> */}
						{Object.entries(projects).map(([k, v]) => (
							<div id="card" key={v.title} className={`card card-${k}`}>
								<Cartridge project={v} />
							</div>
						))}
					</div>
				</div>
				<div className="relative">
					<Gameboy />
				</div>
			</section>
		</div>
	);
}
