import Cartridge from "./cartridge";
import {stacks} from "../lib/constants";
import Image from "next/image";

type GameboyProps = {
	project: Project;
};

interface Project {
	title: string;
	subtitle: string;
	thumbnail: string;
	tags: string[];
	theme: string;
	stacks: string[];
}

export default function Gameboy({project}: GameboyProps) {
	return (
		<div className="w-full flex items-center justify-start md:justify-center">
			<div className="gameboy-body w-[77rem] h-[30rem] flex items-center justify-center">
				<div id="gameboy-head" className="gameboy-frames flex flex-row items-center position-center">
					<div className="body-left">
						<div className="body-wing left">
							<div className="wing"></div>
							<div className="corner"></div>
						</div>
						<div className="body-side left">
							<div className="inner"></div>
							<div className="shadow"></div>
							<div className="inner bottom"></div>
							<div className="shadow bottom"></div>
							<div className="shadow bottom right"></div>
						</div>
						<div className="move-button">
							<div className="vertical">
								<div className="tip trigger" data-button-type="up"></div>
								<div className="tip trigger opacity-0" data-button-type="down"></div>
							</div>
							<div className="horizontal">
								<div className="tip trigger" data-button-type="left"></div>
								<div className="tip trigger" data-button-type="right"></div>
							</div>
							<div className="rect pointer-events-none"></div>
						</div>
						<div className="start-buttons">
							<div className="border">
								<div className="start trigger" data-button-type="power"></div>
								<span>START</span>
							</div>
							<div className="border">
								<div className="select trigger" data-button-type="select"></div>
								<span>MENU</span>
							</div>
						</div>
					</div>
					<div className="flex flex-col items-center justify-center z-20">
						<div className="body-frame relative bg-body"></div>
						<div className="body-bottom">
							<div className="base absolute bg-body w-full h-full z-20"></div>
						</div>
						{/* <div className="logo">
							<span>Workmate</span>
						</div> */}
					</div>
					<div className="body-right">
						<div className="body-side right">
							<div className="inner"></div>
							<div className="shadow"></div>
							<div className="inner bottom"></div>
							<div className="corner"></div>
						</div>
						<div className="body-wing right">
							<div className="wing"></div>
							<div className="shadow"></div>
							<div className="corner"></div>
						</div>
						<div className="power-button">
							<div id="gameboy-power" className="power"></div>
							<span>POWER</span>
						</div>
						<div className="ab-buttons">
							<div className="b-button trigger" data-button-type="b">
								<span className="pointer-events-none">B</span>
							</div>
							<div className="a-button trigger" data-button-type="a">
								<span className="pointer-events-none">A</span>
							</div>
						</div>
						<div className="speaker">
							<div className="line"></div>
							<div className="line"></div>
							<div className="line"></div>
							<div className="line"></div>
							<div className="line"></div>
						</div>
					</div>
				</div>
				<div className="relative pointer-events-none top-[4rem] w-fit h-fit flex flex-col justify-center items-center">
					<div className="frame-top">
						<div className="top">
							<div></div>
						</div>
						<div className="base">
							<div></div>
						</div>
					</div>
					<div className="frame-side right">
						<div></div>
					</div>
					{/* 화면 영역 */}
					<div className="pointer-events-auto bg-black border border-black px-[0.4rem] py-[0.8rem] w-fit z-30">
						<div className="w-[32rem] h-[20rem] bg-off-screen">
							<div className="gameboy-screen w-full h-full">
								<div className="contents w-full h-full flex flex-col justify-center items-center text-black font-dunggeunmo font-normal gap-2">
									<p className="text-xl">{project?.title.toUpperCase()}</p>
									<div className="flex flex-wrap-reverse justify-center w-full h-fit gap-2 px-4">
										{project &&
											project.stacks?.length > 0 &&
											project.stacks.map((s: string) => <Image key={s} src={`/icons/${s}.svg`} width={20} height={20} alt={s} />)}
									</div>
								</div>
							</div>
						</div>
					</div>
					<div className="frame-side left">
						<div></div>
					</div>
					<div className="frame-bottom">
						<div className="base">
							<div></div>
							<span className="playlist-title text-nowrap">PROJECTS</span>
						</div>
						<div className="top">
							<div></div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
