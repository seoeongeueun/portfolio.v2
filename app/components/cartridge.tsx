import Image from "next/image";
import {useState, useEffect} from "react";
import {Project} from "@/app/page";

type CartridgePropsType = {
	project: Project;
	projectKey: string;
	onSelectProject: (event: React.MouseEvent<HTMLDivElement>, projectKey: string) => void;
};

export default function Cartridge({project, projectKey, onSelectProject}: CartridgePropsType) {
	return (
		<div className={`card card-${projectKey} w-fit`} onClick={event => onSelectProject(event, projectKey)}>
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
							<div className="title flex flex-col items-center justify-center text-m md:text-xxl lg:text-xxxl font-tenada">
								<p className="tracking-tighter md:mt-2" style={{color: project.theme}}>
									{project.title}
								</p>
								<span className="text-xxs md:text-s md:-mt-2">{project.subtitle}</span>
							</div>
						</div>
					</div>
					<div className="body flex flex-row justify-between">
						<div className="edge"></div>

						<div className="image-frame">
							<div className="thumbnail" style={{backgroundImage: `url(/projects/${project.route}${project.thumbnail})`}}></div>
						</div>
						<div className="edge right"></div>
					</div>
					<div className="tags text-xxxxs md:text-xxxs w-full px-4 md:px-8 gap-1 md:gap-2 lg:gap-3 flex flex-wrap items-center justify-end">
						{project.tags.map((t, i) => (
							<div key={t + i} className="tag" style={{backgroundColor: project.theme}}>
								{t}
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
