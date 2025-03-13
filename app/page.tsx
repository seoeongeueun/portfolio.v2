"use client";
import Image from "next/image";
import StackIcon from "tech-stack-icons";
import {MdKeyboardDoubleArrowDown} from "react-icons/md";
import TextEn from "./data/text-en.json" assert {type: "json"};
import {useEffect, useState} from "react";
import Cartridge from "./components/cartridge";

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
						const halfScroll = cardContainer.scrollWidth / 2 - 500;
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
			const parentContainer = document.querySelector<HTMLDivElement>(".cartridge-cards");

			if (!parentContainer) return;

			const handleMouseEnter = (event: MouseEvent) => {
				const hoveredCard = event.currentTarget as HTMLElement;
				cardList.forEach(card => card.classList.remove("selected"));
				hoveredCard.scrollIntoView({behavior: "smooth", block: "nearest", inline: "center"});

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

			cardList.forEach(card => {
				card.addEventListener("mouseenter", handleMouseEnter);
				card.addEventListener("mouseleave", handleMouseLeave);
			});

			return () => {
				cardList.forEach(card => {
					card.removeEventListener("mouseenter", handleMouseEnter);
					card.removeEventListener("mouseleave", handleMouseLeave);
				});
			};
		};

		setupObservers();
		setupCardHoverEvents();
	}, []);

	return (
		<div className="text-white w-full h-full flex flex-col items-center justify-start overflow-y-scroll overflow-x-hidden gap-4">
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
				className="w-full flex items-start justify-center overflow-x-auto overflow-y-visible min-h-screen md:min-h-[130vh] bg-white"
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
		</div>
	);
}
