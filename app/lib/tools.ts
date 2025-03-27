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
