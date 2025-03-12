import Image from "next/image";
import StackIcon from "tech-stack-icons";
import {MdKeyboardDoubleArrowDown} from "react-icons/md";

export default function Home() {
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
		mongodb: "mongodb",
		css3: "css",
		html5: "html",
		tailwindcss: "tailwind css",
		ps: "photo\nshop",
	};

	return (
		<div className="text-white w-full h-full p-[1.2rem] md:p-[1.2rem] lg:p-[4rem] flex flex-col items-center justify-start overflow-y-scroll">
			<p className="main-title text-center text-[5rem] md:text-[10rem] lg:text-[12rem]">SEONGEUN PARK</p>
			<div className="flex flex-wrap items-center justify-center w-full gap-1 md:gap-2">
				{Object.entries(stacks).map(([k, v]) => (
					<div key={k} className="group relative w-12 h-12 md:w-16 md:h-16 shrink-0">
						<StackIcon name={k} className="w-full h-full" />
						<div className="group-hover:opacity-100 opacity-0 transition-opacity duration-300 overflow-hidden absolute text-center w-full h-full top-0 left-0 flex items-center justify-center bg-black/75">
							<span className="text-white text-sm whitespace-pre-line">{v.toUpperCase()}</span>
						</div>
					</div>
				))}
			</div>
			<div className="flex flex-col items-center justify-center">
				<span>Scroll Down to Start</span>
				<MdKeyboardDoubleArrowDown color="white" size="1rem" className="animate-slide-down"></MdKeyboardDoubleArrowDown>
			</div>
		</div>
	);
}
