import Image from "next/image";
import {useState, useEffect} from "react";

export default function Cartridge() {
	return (
		<div className="relative cartridge-container">
			<div className="head"></div>
			<div className="flex flex-col cartridge-body items-center justify-between">
				<div className="relative horizontal-lines flex flex-col w-full h-full">
					<div />
					<div />
					<div />
					<div />
					<div />
					<div className="title-container">
						<div className="title flex flex-col items-center justify-center text-m md:text-xxl font-tenada">
							<p className="tracking-tighter">Project Title</p>
							<span className="text-xxs md:text-xs">subtitle</span>
						</div>
					</div>
				</div>
				<div className="body flex flex-row justify-between">
					<div className="edge"></div>

					<div className="image-frame">
						<div className="thumbnail"></div>
					</div>
					<div className="edge right"></div>
				</div>
				<div className="tags text-xxxxs md:text-xxxs w-full px-4 md:px-8 gap-1 md:gap-2 flex flex-wrap items-center justify-end">
					<div className="tag">1 DEV</div>
					<div className="tag">SOMETHING</div>
				</div>
			</div>
		</div>
	);
}
