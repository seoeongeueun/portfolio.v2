//해당 영역의 모든 이미지가 로드 되었는지 검증하는 함수
export function waitForAllImagesToLoad(container: HTMLElement): Promise<void> {
	const allImages = Array.from(container.querySelectorAll("img"));

	// 스와이퍼는 따로 검사하기 때문에 스와이퍼 슬라이드는 검사에서 제거
	const filtered = allImages.filter(img => {
		return !img.closest(".swiper-slide");
	});

	return new Promise(resolve => {
		if (filtered.length === 0) return resolve();

		let loaded = 0;

		const checkDone = () => {
			loaded++;
			if (loaded === filtered.length) {
				resolve();
			}
		};

		filtered.forEach(img => {
			if (img.complete && img.naturalWidth > 0) {
				checkDone();
			} else {
				img.addEventListener("load", checkDone, {once: true});
				img.addEventListener("error", checkDone, {once: true});
			}
		});
	});
}

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const getRandomInt = (val: number): number => Math.ceil(Math.random() * val) * (Math.random() < 0.5 ? -1 : 1);

function preventScroll(e: Event) {
	e.preventDefault();
	e.stopPropagation();
}

export function lockScroll() {
	window.addEventListener("wheel", preventScroll, {
		passive: false,
	});
	window.addEventListener("touchmove", preventScroll, {
		passive: false,
	});
}

export function unlockScroll() {
	window.removeEventListener("wheel", preventScroll);
	window.removeEventListener("touchmove", preventScroll);
}

export function throttle<T extends (...args: any[]) => void>(func: T, delay: number): T {
	let lastCall = 0;
	let timeoutId: NodeJS.Timeout | null = null;

	return function (...args: any[]) {
		const now = Date.now();

		if (now - lastCall < delay) {
			if (timeoutId) clearTimeout(timeoutId);
			timeoutId = setTimeout(() => {
				lastCall = Date.now();
				func(...args);
			}, delay);
		} else {
			lastCall = now;
			func(...args);
		}
	} as T;
}

export function debounce(fn: () => void, delay: number) {
	let timer: ReturnType<typeof setTimeout> | null = null;
	return () => {
		if (timer) clearTimeout(timer);
		timer = setTimeout(fn, delay);
	};
}
