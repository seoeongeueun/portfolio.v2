export const stacks = {
	gameboy: "gameboy",
	javascript: "javascript",
	ducky: "ducky",
	laptop: "laptop",
};

//pool 섹션
export const MARGIN_SIZE = 0.05; //수영장 테두리는 현재 대략 5vmin
export const POOL_SPEED = 1.3; //수영장 아이템 속도 배율 (2 = 2배 빠르게, 0.5 = 절반 속도). 이동 거리는 그대로, 도달 시간만 변경
export const GSAP_OPTION = {duration: 3 / POOL_SPEED, ease: "power3.out"};

// beach 섹션
export const PARTICLE_SIZE = 60; //dust particle 크기
export const BORDER_END = 0.06; // border 단계 시간
export const FILL_END = 0.4; // BORDER_END - FILL_END fill이 끝나는 시간
export const MOVE_END = 1.2; // particle 이동 끝나는 시간
export const DUST_TIMING = 0.5; //scrollTrigger의 몇 퍼센트에서 dust화를 진행할건지
export const AMPLIFY_BY = 1 / (1 - DUST_TIMING); // dust화 속도
