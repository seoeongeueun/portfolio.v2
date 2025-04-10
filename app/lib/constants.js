export const stacks = {
	gameboy: "gameboy",
	javascript: "javascript",
	ducky: "ducky",
	laptop: "laptop",
};

export const PARTICLE_SIZE = 50; //dust particle 크기
export const BORDER_END = 0.06; // border 단계 시간
export const FILL_END = 0.4; // BORDER_END - FILL_END fill이 끝나는 시간
export const MOVE_END = 1.2; // particle 이동 끝나는 시간
export const DUST_TIMING = 0.5; //scrollTrigger의 몇 퍼센트에서 dust화를 진행할건지
export const AMPLIFY_BY = 1 / (1 - DUST_TIMING); // dust화 속도
