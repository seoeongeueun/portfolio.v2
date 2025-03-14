"use client";
import Image from "next/image";
import StackIcon from "tech-stack-icons";
import {MdKeyboardDoubleArrowDown} from "react-icons/md";
import TextEn from "./data/text-en.json" assert {type: "json"};
import {useEffect, useState} from "react";
import Cartridge from "./components/cartridge";
import Gameboy from "./components/gameboy";
import "./styles/global.scss";

type TextFileType = Record<string, string>;

export default function Home() {
	const [textFile, setTextFile] = useState<TextFileType>(TextEn);
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

		const setupObservers = () => {
			const cardContainer = document.querySelector<HTMLDivElement>(".cartridge-cards");
			if (!cardContainer) return;

			const mobileCardObserver = new IntersectionObserver(handleMobileCardIntersection, {
				root: null,
				rootMargin: "0px",
				threshold: 0.6,
			});

			mobileCardObserver.observe(cardContainer);
			return () => mobileCardObserver.disconnect();
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
	}, []);

	return (
		<div id="main" className="text-white w-full h-full flex flex-col items-center justify-start overflow-y-scroll overflow-x-hidden gap-4">
			<p className="main-title font-dunggeunmo font-normal text-center text-[5rem] md:text-[10rem] lg:text-[12rem]">SEOEONGEUEUN</p>
			<p className="text-cyan-300 text-s">{textFile["001"]}</p>
			<p className="text-white text-s">@seoeongeueun</p>

			<div className="flex flex-wrap items-center justify-center w-full gap-1 md:gap-3">
				{Object.entries(stacks).map(([k, v]) => (
					<div key={k} className="group relative w-12 h-12 md:w-12 md:h-12 shrink-0">
						<StackIcon name={k} className="w-full h-full" />
						<div className="group-hover:opacity-100 opacity-0 transition-opacity duration-300 overflow-hidden absolute text-center w-full h-full top-0 left-0 flex items-center justify-center bg-black/75">
							<span className="text-white text-xxxs whitespace-pre-line">{v.toUpperCase()}</span>
						</div>
					</div>
				))}
			</div>
			<div className="flex flex-col items-center justify-center">
				<span>{textFile["000"]}</span>
				<MdKeyboardDoubleArrowDown color="white" size="1rem" className="animate-slide-down"></MdKeyboardDoubleArrowDown>
			</div>
			<div
				id="cartridge-cards-container"
				className="w-full flex items-start justify-center overflow-x-auto overflow-y-visible min-h-screen md:min-h-[100vh] bg-white"
			>
				<div id="cartridge-cards" className="cartridge-cards relative">
					<div id="card" className="card card-4">
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
					</div>
				</div>
			</div>
			<div className="relative">
				<Gameboy />
			</div>
		</div>
	);
}
