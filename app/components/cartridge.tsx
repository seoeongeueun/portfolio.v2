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
						<div className="title flex flex-col items-center justify-center text-xxl">
							<p>PROJECT NAME</p>
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
			</div>
		</div>
	);
}
