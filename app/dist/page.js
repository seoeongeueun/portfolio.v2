"use client";
"use strict";
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
exports.__esModule = true;
var image_1 = require("next/image");
var md_1 = require("react-icons/md");
var text_en_json_1 = require("./data/text-en.json");
assert;
{
    type: "json";
}
;
var react_1 = require("react");
var cartridge_1 = require("./components/cartridge");
var gameboy_1 = require("./components/gameboy");
var projects_json_1 = require("./data/projects.json");
assert;
{
    type: "json";
}
;
require("./styles/global.scss");
require("./styles/gsap.scss");
var constants_1 = require("./lib/constants");
var gsap_1 = require("gsap");
var Observer_1 = require("gsap/Observer");
gsap_1["default"].registerPlugin(Observer_1.Observer);
var getRandomInt = function (val) { return Math.ceil(Math.random() * val) * (Math.random() < 0.5 ? -1 : 1); };
function Home() {
    var _a = react_1.useState(text_en_json_1["default"]), textFile = _a[0], setTextFile = _a[1];
    var _b = react_1.useState(projects_json_1["default"]), projects = _b[0], setProjects = _b[1];
    var _c = react_1.useState(null), highlightedIndex = _c[0], setHighlightedIndex = _c[1];
    var _d = react_1.useState(["WORK", "PERSONAL"]), tags = _d[0], setTags = _d[1];
    var _e = react_1.useState(""), selectedProjectTitle = _e[0], setSelectedProjectTitle = _e[1];
    var _f = react_1.useState(false), isGameboyOn = _f[0], setIsGameboyOn = _f[1];
    var positionsRef = react_1.useRef([]);
    var bowlRef = react_1.useRef(null);
    var charPositionsRef = react_1.useRef({});
    var mainRef = react_1.useRef(null);
    var stickyRef = react_1.useRef(null);
    var careerCardsRef = react_1.useRef(null);
    var cartridgeCardsContainerRef = react_1.useRef(null);
    var cartridgeCardsRef = react_1.useRef(null);
    var mainTitleRef = react_1.useRef(null);
    var miniTitleRef = react_1.useRef(null);
    var gameboyHeadRef = react_1.useRef(null);
    var charRefs = react_1.useRef({});
    var shadowRefs = react_1.useRef({});
    var prevScrollTop = react_1.useRef(0);
    function preventScroll(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    function lockScroll() {
        window.addEventListener("wheel", preventScroll, {
            passive: false
        });
        window.addEventListener("touchmove", preventScroll, {
            passive: false
        });
    }
    function unlockScroll() {
        window.removeEventListener("wheel", preventScroll);
        window.removeEventListener("touchmove", preventScroll);
    }
    //pseudo element의 너비를 계산하는 함수
    var getPseudoBounds = function (element, pseudo) {
        var style = window.getComputedStyle(element, pseudo);
        var width = parseFloat(style.width);
        var height = parseFloat(style.height);
        var top = element.getBoundingClientRect().top + parseFloat(style.top);
        var left = element.getBoundingClientRect().left + parseFloat(style.left);
        return { top: top, left: left, right: left + width, bottom: top + height, width: width, height: height };
    };
    react_1.useEffect(function () {
        var _a, _b;
        if (!bowlRef.current)
            return;
        Object.keys(constants_1.stacks).forEach(function (key) {
            if (!charPositionsRef.current[key]) {
                charPositionsRef.current[key] = {
                    x: getRandomInt(40),
                    y: getRandomInt(40)
                };
            }
        });
        gsap_1["default"].defaults({ overwrite: true });
        gsap_1["default"].to(".char", {
            x: function () { return getRandomInt(10); },
            y: function () { return getRandomInt(10); },
            rotation: function () { return getRandomInt(20); },
            duration: 5
        });
        var moveCharsFrameId = null;
        var rippleFrameId = null;
        var moveChars = function (obj) {
            if (moveCharsFrameId)
                return;
            moveCharsFrameId = requestAnimationFrame(function () {
                var _a;
                var event = obj.event, deltaX = obj.deltaX, deltaY = obj.deltaY;
                var el = event.target;
                var id = el.classList.contains("char") ? (_a = el.className.match(/char-(\S+)/)) === null || _a === void 0 ? void 0 : _a[1] : null;
                if (!id || !bowlRef.current)
                    return;
                var shadow = document.querySelector(".shadow-" + id);
                var charBounds = el.getBoundingClientRect();
                var pseudoBounds = getPseudoBounds(bowlRef.current, "::before");
                console.log(pseudoBounds);
                var bowlBounds = bowlRef.current.getBoundingClientRect();
                var t = 3;
                var newX = charBounds.left + deltaX * t;
                var newY = charBounds.top + deltaY * t;
                var vmin = Math.min(window.innerWidth, window.innerHeight);
                var yMargin = (vmin * 4) / 100;
                var xMargin = (vmin * 15.2) / 100;
                if (newX < bowlBounds.left + xMargin)
                    newX = bowlBounds.left + xMargin;
                if (newX + charBounds.width > pseudoBounds.right)
                    newX = pseudoBounds.right - charBounds.width;
                if (newY < bowlBounds.top + yMargin)
                    newY = bowlBounds.top + yMargin;
                if (newY + charBounds.height > pseudoBounds.bottom + yMargin)
                    newY = pseudoBounds.bottom - charBounds.height + yMargin;
                var xMovement = newX - charBounds.left;
                var yMovement = newY - charBounds.top;
                gsap_1["default"].to(el, {
                    x: "+=" + xMovement,
                    y: "+=" + yMovement,
                    rotation: "-=" + deltaX * t * Math.sign(event.clientY - (charBounds.top + charBounds.height / 2)),
                    duration: 3,
                    ease: "expo.out"
                });
                if (shadow) {
                    gsap_1["default"].to(shadow, {
                        x: "+=" + xMovement,
                        y: "+=" + yMovement,
                        duration: 3,
                        ease: "expo.out"
                    });
                }
                moveCharsFrameId = null;
            });
        };
        var observer = Observer_1.Observer.create({
            target: bowlRef.current,
            onMove: function (self) {
                var mouseEvent = self.event;
                if (self.event instanceof MouseEvent && self.event.target instanceof HTMLElement && self.event.target.matches(".char")) {
                    moveChars({
                        event: mouseEvent,
                        deltaX: self.deltaX,
                        deltaY: self.deltaY
                    });
                }
            }
        });
        var turbWave = document.querySelector("#turbwave");
        var dispMap = document.querySelector("#dispMap");
        var handleMouseMove = function (e) {
            if (rippleFrameId)
                return;
            rippleFrameId = requestAnimationFrame(function () {
                var _a;
                var rect = (_a = bowlRef.current) === null || _a === void 0 ? void 0 : _a.getBoundingClientRect();
                if (!rect)
                    return;
                var x = (e.clientX - rect.left) / rect.width;
                var y = (e.clientY - rect.top) / rect.height;
                gsap_1["default"].to(turbWave, {
                    attr: { baseFrequency: 0.01 + y * 0.02 + " " + (0.04 + x * 0.04) },
                    duration: 0.3,
                    ease: "power2.out"
                });
                gsap_1["default"].to(dispMap, {
                    attr: { scale: 3 + y * 15 },
                    duration: 0.3,
                    ease: "power2.out"
                });
                rippleFrameId = null;
            });
        };
        var handleMouseLeave = function () {
            turbWave === null || turbWave === void 0 ? void 0 : turbWave.setAttribute("baseFrequency", "0.01 0.03");
            dispMap === null || dispMap === void 0 ? void 0 : dispMap.setAttribute("scale", "2");
        };
        (_a = bowlRef.current) === null || _a === void 0 ? void 0 : _a.addEventListener("mousemove", handleMouseMove);
        (_b = bowlRef.current) === null || _b === void 0 ? void 0 : _b.addEventListener("mouseleave", handleMouseLeave);
        return function () {
            observer.kill();
            if (moveCharsFrameId)
                cancelAnimationFrame(moveCharsFrameId);
            if (rippleFrameId)
                cancelAnimationFrame(rippleFrameId);
        };
    }, [constants_1.stacks]);
    //sticky div가 맨 위에 붙은 상황 (지금 화면의 중심인 경우)
    react_1.useEffect(function () {
        var _a;
        if (!careerCardsRef.current || !stickyRef.current)
            return;
        var container = careerCardsRef.current;
        var cards = Array.from(container.querySelectorAll(".career-card"));
        var cardHeight = ((_a = cards[0]) === null || _a === void 0 ? void 0 : _a.offsetHeight) || 0;
        var totalCards = cards.length;
        var totalScrollHeight = cardHeight * totalCards;
        var marginTop = cardHeight / -2; //카드 사이 간격을 줄이기 위해 카드 높이 반을 뺌
        var currentOffset = 0;
        var prevScrollTop = window.scrollY;
        var positions = cards.map(function (_, i) { return i * cardHeight; });
        var isStickyVisible = function () {
            //무한 카드 스위칭을 막기 위해 하단에 카드 세개가 남았을 때 루프를 종료
            var rect = stickyRef.current.getBoundingClientRect();
            return rect.bottom > cardHeight * 3 && rect.top < window.innerHeight;
        };
        var updateHighlight = function () {
            var closestCard = null;
            var closestDistance = Infinity;
            cards.forEach(function (card) {
                var rect = card.getBoundingClientRect();
                var distanceToTop = Math.abs(rect.top);
                if (distanceToTop < closestDistance) {
                    closestDistance = distanceToTop;
                    closestCard = card;
                }
                card.classList.remove("highlighted");
            });
            if (closestCard) {
                closestCard.classList.add("highlighted");
            }
        };
        var updatePositions = function (deltaY) {
            currentOffset += deltaY;
            if (isStickyVisible()) {
                cards.forEach(function (card, index) {
                    positions[index] += deltaY;
                    // Loop card positions when they exit the viewport
                    if (positions[index] <= -cardHeight) {
                        positions[index] += (cardHeight + marginTop) * (totalCards * totalCards);
                    }
                    if (positions[index] >= totalScrollHeight) {
                        positions[index] -= (cardHeight + marginTop) * (totalCards * totalCards);
                    }
                    card.style.setProperty("--y-distance", positions[index] + "px");
                });
            }
            updateHighlight();
        };
        var handleScroll = function () {
            var scrollTop = window.scrollY;
            var deltaY = scrollTop - prevScrollTop;
            prevScrollTop = scrollTop;
            updatePositions(-deltaY);
        };
        window.addEventListener("scroll", handleScroll);
        return function () {
            window.removeEventListener("scroll", handleScroll);
        };
    }, []);
    react_1.useEffect(function () {
        if (!gameboyHeadRef.current || !isGameboyOn)
            return;
        var gameboyHead = gameboyHeadRef.current;
        var gameboyScreen = gameboyHead.querySelector(".gameboy-screen");
        if (!gameboyScreen)
            return;
        var initialScrollY = window.scrollY;
        var maxScreenWidth = window.innerWidth * 0.7; // 최대 70vw
        var maxScale = maxScreenWidth / gameboyScreen.offsetWidth; // 최대 scale 값
        var lastScrollY = window.scrollY; // 이전 스크롤 위치
        var originalLeft = gameboyScreen.offsetLeft; //scale 적용 전에 screen의 왼쪽 거리를 계산
        var handleScroll = function () {
            var scrollY = window.scrollY;
            var scrollDiff = scrollY - initialScrollY; // 기준점 대비 스크롤 이동량
            // 스크롤 위 방향 감지
            if (scrollY < lastScrollY) {
                //스크롤을 올릴 때는 자연스럽게 작아지기 위해 기준점을 현재 위치에서 200px 정도 멀리 잡는다
                scrollDiff -= 100;
            }
            else {
                scrollDiff += 300;
            }
            var newScale = 1 + scrollDiff * 0.002;
            // 1보다는 크고 maxscale보다는 작게
            newScale = Math.max(1, Math.min(newScale, maxScale));
            //1 이하로는 작아지지 못하게 지정
            gameboyHead.style.setProperty("--scale", newScale.toString());
            lastScrollY = scrollY;
        };
        window.addEventListener("scroll", handleScroll);
        return function () {
            window.removeEventListener("scroll", handleScroll);
        };
    }, [isGameboyOn]);
    react_1.useEffect(function () {
        var handleMobileCardIntersection = function (entries, observer) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    var cardContainer = cartridgeCardsContainerRef.current;
                    if (cardContainer) {
                        var firstChild = cardContainer.firstElementChild;
                        if (firstChild) {
                            firstChild.classList.add("spread");
                        }
                        var halfScroll = cardContainer.scrollWidth / 2;
                        cardContainer.scrollLeft = halfScroll;
                    }
                    observer.unobserve(entry.target);
                }
            });
        };
        var handleTitleIntersection = function (entries, observer) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    var side = entry.target.dataset.side;
                    entry.target.classList.add("fade-" + side);
                    observer.unobserve(entry.target);
                }
            });
        };
        var handleStickyIntersection = function (entries, observer) {
            entries.forEach(function (entry) {
                console.log(entry.boundingClientRect.top);
                if (entry.boundingClientRect.top <= 0) {
                    entry.target.classList.add("stuck");
                    console.log("styck");
                    lockScroll();
                }
                else {
                    entry.target.classList.remove("stuck");
                }
            });
        };
        var setupObservers = function () {
            var cardContainer = cartridgeCardsRef.current;
            if (!cardContainer)
                return;
            var mobileCardObserver = new IntersectionObserver(handleMobileCardIntersection, {
                root: null,
                rootMargin: "0px",
                threshold: 0.7
            });
            var titleObserver = new IntersectionObserver(handleTitleIntersection, {
                root: null,
                rootMargin: "0px",
                threshold: 0.5
            });
            mobileCardObserver.observe(cardContainer);
            //fade 애니메이션 효과가 필요한 div
            var upElements = document.querySelectorAll(".fade-up-section");
            var leftElements = document.querySelectorAll(".fade-left-section");
            upElements.forEach(function (element) {
                element.dataset.side = "up";
                titleObserver.observe(element);
            });
            // leftElements.forEach(element => {
            // 	element.dataset.side = "left";
            // 	titleObserver.observe(element);
            // });
            return function () {
                mobileCardObserver.disconnect();
                upElements.forEach(function (element) { return titleObserver.unobserve(element); });
                //leftElements.forEach(element => titleObserver.unobserve(element));
            };
        };
        return setupObservers();
    }, []);
    /* 카트리지 (=통칭 카드) 호버 & 펼침 이벤트 관리 */
    react_1.useEffect(function () {
        var parentContainer = cartridgeCardsContainerRef.current;
        var cardsDiv = cartridgeCardsRef.current;
        if (!cardsDiv || !parentContainer)
            return;
        var handleMouseEnter = function (event) {
            // const hoveredCard = event.currentTarget as HTMLElement;
            // setTimeout(() => {
            // 	hoveredCard?.scrollIntoView({behavior: "smooth", block: "nearest", inline: "center"});
            // }, 500);
        };
        function onCardClick(event) {
            var clickedCard = event.currentTarget;
            var rect = clickedCard.getBoundingClientRect();
            if (!rect || !cardsDiv || !parentContainer)
                return;
            var cards = cardsDiv.querySelectorAll("#card");
            cards.forEach(function (card) { return card.classList.remove("clicked"); });
            /*
                선택된 카드를 중앙으로 위치하게 스크롤 하는 로직 + 자동으로 필요한 만큼 여백 추가
                어떤 디자인을 택할지에 따라 사용하지 않을 수도 있음
            */
            var parentRect = parentContainer.getBoundingClientRect();
            var cardRect = clickedCard.getBoundingClientRect();
            var cardCenterInParentViewport = cardRect.left - parentRect.left + cardRect.width / 2;
            var cardCenterInParentScrollCoords = parentContainer.scrollLeft + cardCenterInParentViewport;
            var windowCenterX = window.innerWidth / 2;
            var desiredDelta = cardCenterInParentScrollCoords - windowCenterX;
            var maxScroll = parentContainer.scrollWidth - parentContainer.clientWidth;
            var currentScroll = parentContainer.scrollLeft;
            var targetScroll = desiredDelta;
            if (targetScroll < 0)
                targetScroll = 0;
            if (targetScroll > maxScroll)
                targetScroll = maxScroll;
            parentContainer.scrollTo({
                top: 0,
                left: targetScroll,
                behavior: "smooth"
            });
            var waitForScrollEnd = function () {
                if (Math.abs(parentContainer.scrollLeft - targetScroll) < 1) {
                    var actualDelta = currentScroll + desiredDelta - targetScroll;
                    if (actualDelta !== 0 && Math.round(targetScroll) !== Math.round(desiredDelta)) {
                        var computedLeft = getComputedStyle(cardsDiv).left || "0";
                        var currentLeft = parseFloat(computedLeft);
                        var newLeft = desiredDelta < 0 ? currentLeft + Math.abs(desiredDelta) : currentLeft - actualDelta;
                        cardsDiv.style.transition = "left 1s ease-in-out 0.2s";
                        cardsDiv.style.left = newLeft + "px";
                        setTimeout(function () {
                            moveGameboyHead();
                        }, 1400);
                    }
                    else {
                        cardsDiv.style.left = "";
                        cardsDiv.style.transition = "";
                        setTimeout(function () {
                            moveGameboyHead();
                        }, 800);
                    }
                }
                else {
                    requestAnimationFrame(waitForScrollEnd);
                }
            };
            clickedCard.classList.add("clicked");
            requestAnimationFrame(waitForScrollEnd);
            //게임기로 이동하기 위해 필요한 거리 계산
            var moveGameboyHead = function () {
                var gameboyHead = document.querySelector("#gameboy-head");
                if (gameboyHead) {
                    var referencePosition = gameboyHead.getBoundingClientRect().top;
                    var cardPosition = rect.top;
                    var distance = referencePosition - cardPosition - clickedCard.offsetHeight * 0.4;
                    //카트리지가 들어간 효과를 위해 추가 Y 값 (= 20)
                    clickedCard.style.setProperty("--y-distance", distance + 20 + "px");
                    clickedCard.classList.add("moveY");
                    setTimeout(function () {
                        var _a;
                        (_a = gameboyHeadRef.current) === null || _a === void 0 ? void 0 : _a.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
                    }, 300);
                }
            };
            var handleAnimationEnd = function () {
                setIsGameboyOn(true);
                setTimeout(function () {
                    // clickedCard.classList.remove("clicked");
                    // cardsDiv.style.left = "";
                    // cardsDiv.style.transition = "";
                    clickedCard.removeEventListener("animationend", handleAnimationEnd);
                }, 700);
            };
            clickedCard.addEventListener("animationend", handleAnimationEnd);
        }
        var cards = cardsDiv.querySelectorAll("#card");
        cards.forEach(function (card) {
            card.addEventListener("mouseenter", handleMouseEnter);
            card.addEventListener("click", onCardClick);
        });
        return function () {
            cards.forEach(function (card) {
                card.removeEventListener("mouseenter", handleMouseEnter);
                card.removeEventListener("click", onCardClick);
            });
        };
    }, []);
    /* 스크롤 위치에 따라 배경색을 변경하는 로직*/
    react_1.useEffect(function () {
        if (!mainRef.current)
            return;
        var main = mainRef.current;
        function handleBackgroundColorChange() {
            var startColor = [148, 216, 255];
            var endColor = [0, 0, 46];
            var scrollTop = window.scrollY;
            var scrollHeight = document.body.scrollHeight;
            var clientHeight = window.innerHeight;
            var scrollFraction = scrollTop / (scrollHeight - clientHeight);
            var r = Math.round(startColor[0] + (endColor[0] - startColor[0]) * scrollFraction);
            var g = Math.round(startColor[1] + (endColor[1] - startColor[1]) * scrollFraction);
            var b = Math.round(startColor[2] + (endColor[2] - startColor[2]) * scrollFraction);
            document.documentElement.style.setProperty("--main-bg", "rgb(" + r + ", " + g + ", " + b + ")");
        }
        window.addEventListener("scroll", handleBackgroundColorChange);
        return function () {
            window.removeEventListener("scroll", handleBackgroundColorChange);
        };
    }, []);
    /* 메인 페이지 타이틀에 애니메이션 추가 */
    react_1.useEffect(function () {
        if (!mainTitleRef.current || !miniTitleRef.current)
            return;
        var title = mainTitleRef.current;
        var miniTitle = miniTitleRef.current;
        function onTitleAnimationEnd() {
            miniTitle.classList.add("loaded");
            title.removeEventListener("animationend", onTitleAnimationEnd);
        }
        title.addEventListener("animationend", onTitleAnimationEnd);
        return function () {
            title.removeEventListener("animationend", onTitleAnimationEnd);
        };
    }, []);
    var handleProjectsFilter = function (e) {
        var _a = e.target, name = _a.name, checked = _a.checked;
        setTags(function (prev) { return (checked ? __spreadArrays(prev, [name.toUpperCase()]) : prev.filter(function (filter) { return filter !== name.toUpperCase(); })); });
    };
    react_1.useEffect(function () {
        if (!tags) {
            setProjects({});
        }
        else {
            var filteredProjects = Object.entries(projects_json_1["default"])
                .filter(function (_a) {
                var _ = _a[0], project = _a[1];
                return project.tags.some(function (tag) { return tags.includes(tag); });
            })
                .reduce(function (acc, _a) {
                var key = _a[0], project = _a[1];
                acc[key] = project;
                return acc;
            }, {});
            setProjects(filteredProjects);
        }
    }, [tags]);
    return (React.createElement("div", { ref: mainRef, className: "py-52 text-gray-4 w-full h-[300vh] flex flex-col items-center justify-start gap-4 overflow-visible" },
        React.createElement("div", { className: "fixed top-0 p-4 pointer-events-none w-full" },
            React.createElement("div", { className: "w-full flex flex-row items-center justify-between mb-auto" },
                React.createElement("span", null, "ha"))),
        React.createElement("section", { className: "flex-col" },
            React.createElement("div", { className: "flex flex-col justify-center items-center" },
                React.createElement("p", { ref: miniTitleRef, className: "underline-text opacity-0 ml-auto text-gray-4 text-s lg:text-xl rotate-10 -mb-8 md:-mb-[3rem] z-30" }, "FRONTEND DEVELOPER"),
                React.createElement("p", { ref: mainTitleRef, className: "main-title md:whitespace-nowrap font-normal text-center text-[7rem] md:text-[10rem] lg:text-[12rem]" }, "SEONGEUN's")),
            React.createElement("div", { className: "w-full flex justify-center h-fit" },
                React.createElement("div", { ref: bowlRef, className: "bowl" },
                    React.createElement("svg", { width: "0", height: "0" },
                        React.createElement("defs", null,
                            React.createElement("filter", { id: "turb" },
                                React.createElement("feTurbulence", { id: "turbwave", type: "fractalNoise", baseFrequency: "0.02 0.04", numOctaves: "3", result: "turbulence" }),
                                React.createElement("feDisplacementMap", { id: "dispMap", "in": "SourceGraphic", in2: "turbulence", scale: "5" })))),
                    Object.keys(charPositionsRef.current).length > 0 &&
                        Object.keys(constants_1.stacks).map(function (k) {
                            var _a = charPositionsRef.current[k] || { x: 0, y: 0 }, x = _a.x, y = _a.y;
                            return (React.createElement(react_1.Fragment, { key: k },
                                React.createElement(image_1["default"], { src: "/icons/" + k + ".png", alt: k, className: "char char-" + k, width: 70, height: 70, style: {
                                        top: y + "%",
                                        left: x + "%"
                                    } }),
                                React.createElement("div", { className: "shadow shadow-" + k, style: {
                                        top: "calc(" + y + "% + 20%)",
                                        left: "calc(" + x + "% - 3%)"
                                    } })));
                        }))),
            React.createElement("div", { className: "fixed bottom-0 p-20 pointer-events-none z-[99]" },
                React.createElement("div", { className: "flex flex-col items-center justify-center text-white text-xl" },
                    React.createElement("span", { className: "drop-shadow-md" }, textFile["000"]),
                    React.createElement(md_1.MdKeyboardDoubleArrowDown, { color: "white", size: "3rem", className: "animate-slide-down drop-shadow-lg" })))),
        React.createElement("section", { ref: stickyRef, className: "pt-32 flex-row !justify-between !items-end mb-[10rem]" },
            React.createElement("div", { className: "fade-up-section flex flex-col justify-start items-start mb-auto" },
                React.createElement("p", { className: "subtitle" }, "CAREER"),
                React.createElement("p", { className: "text-s max-w-1/2 whitespace-pre-line" }, textFile["001"])),
            React.createElement("div", { ref: careerCardsRef, className: "career-cards-container pt-32 spread" },
                React.createElement("div", { className: "career-card w-full bg-red-500 p-10" },
                    React.createElement("p", { className: "text-lg text-white" }, "Frontend Developer"),
                    React.createElement("div", { className: "mb-2 flex flex-row items-center justify-between w-full" },
                        React.createElement("p", null, "BATON"),
                        React.createElement("p", null, "2023\uB144 8\uC6D4 - 2024\uB144 11\uC6D4")),
                    React.createElement("ul", null,
                        React.createElement("li", null, "React.js, Next.js, Typescript, jQuery \uB4F1\uC744 \uC0AC\uC6A9\uD558\uC5EC \uB2E4\uC591\uD55C \uD074\uB77C\uC774\uC5B8\uD2B8\uC758 \uC6F9 \uC560\uD50C\uB9AC\uCF00\uC774\uC158\uACFC \uAD00\uB9AC\uC790 \uD398\uC774\uC9C0\uB97C \uAC1C\uBC1C\uD558\uACE0, \uBC18\uC751\uD615 \uB514\uC790\uC778\uACFC \uCD5C\uC801\uD654\uB41C \uC560\uB2C8\uBA54\uC774\uC158\uC744 \uAD6C\uD604\uD588\uC2B5\uB2C8\uB2E4."),
                        React.createElement("li", null, "\uD544\uC694\uC5D0 \uB530\uB77C API \uC124\uACC4\uC640 MySQL\uACFC PostgreSQL \uB370\uC774\uD130\uBCA0\uC774\uC2A4 \uC124\uACC4 \uBC0F \uCFFC\uB9AC \uC791\uC131 \uB4F1 \uBC31\uC5D4\uB4DC \uC791\uC5C5\uC744 \uD3EC\uD568\uD55C \uD1B5\uD569 \uAC1C\uBC1C\uC744 \uC218\uD589\uD558\uC5EC \uD504\uB860\uD2B8-\uBC31 \uAC04\uC758 \uC6D0\uD65C\uD55C \uB370\uC774\uD130 \uC5F0\uB3D9\uC744 \uAD6C\uD604\uD588\uC2B5\uB2C8\uB2E4."),
                        React.createElement("li", null, "\uD300\uC758 \uAC1C\uBC1C \uD6A8\uC728\uC131\uC744 \uC704\uD574 \uC801\uADF9\uC801\uC73C\uB85C \uC0C8\uB85C\uC6B4 \uC2A4\uD0DD\uC744 \uD14C\uC2A4\uD2B8\uD558\uACE0 \uB3C4\uC785\uD558\uC5EC \uD300\uC758 \uAC1C\uBC1C \uC2DC\uC2A4\uD15C\uC744 \uD604\uB300\uD654\uD558\uACE0 \uC791\uC5C5 \uC0DD\uC0B0\uC131 \uD5A5\uC0C1\uC5D0 \uAE30\uC5EC\uD588\uC2B5\uB2C8\uB2E4."))),
                React.createElement("div", { className: "career-card w-full bg-yellow-500 p-10" },
                    React.createElement("p", { className: "text-lg text-white" }, "Software Engineer"),
                    React.createElement("div", { className: "mb-2 flex flex-row items-center justify-between w-full" },
                        React.createElement("p", null, "Market Stadium"),
                        React.createElement("p", null, "2023\uB144 8\uC6D4 - 2024\uB144 11\uC6D4")),
                    React.createElement("ul", null,
                        React.createElement("li", null, "\uD480\uC2A4\uD0DD \uAC1C\uBC1C\uC790 \uC778\uD134\uC73C\uB85C React.js, Semantic UI, Chart.js\uB97C \uC0AC\uC6A9\uD558\uC5EC macroeconomics \uC9C0\uD45C \uB370\uC774\uD130\uB97C \uADF8\uB798\uD504\uB85C \uC2DC\uAC01\uD654\uD558\uB294 \uB300\uC2DC\uBCF4\uB4DC \uAE30\uB2A5\uC744 \uAD6C\uD604\uD588\uC2B5\uB2C8\uB2E4."),
                        React.createElement("li", null, "DynamoDB \uC640 \uC5F0\uB3D9\uB41C RESTful API\uB97C \uAC1C\uBC1C\uD558\uC5EC \uAD00\uB828 \uB370\uC774\uD130\uB97C \uAD00\uB9AC\uD558\uACE0 \uC870\uD68C\uD558\uB294 \uAE30\uB2A5\uC744 \uB9CC\uB4E4\uC5C8\uC2B5\uB2C8\uB2E4."),
                        React.createElement("li", null, "Mocha\uC640 Chai\uB97C \uC774\uC6A9\uD574 \uB370\uC774\uD130 \uC720\uD6A8\uC131 \uAC80\uC99D \uD14C\uC2A4\uD2B8\uB97C \uCD94\uAC00\uD558\uC5EC \uC548\uC815\uC131\uC744 \uB192\uC600\uC2B5\uB2C8\uB2E4."))),
                React.createElement("div", { className: "career-card w-full flex flex-col items-start justify-start bg-cyan-500 p-10" },
                    React.createElement("p", { className: "text-lg text-white" }, "Bachelor's Degree of Computer Science"),
                    React.createElement("div", { className: "mb-2 flex flex-row items-center justify-between w-full" },
                        React.createElement("p", null, "The State University of New York, Stony Brook"),
                        React.createElement("p", null, "2023\uB144 8\uC6D4 - 2024\uB144 11\uC6D4")),
                    React.createElement("p", null, "Stony Brook University\uC5D0\uC11C Computer Science\uB97C \uC804\uACF5\uD588\uC2B5\uB2C8\uB2E4.")))),
        React.createElement("section", { className: "flex-col full-section !h-fit" },
            React.createElement("p", { className: "subtitle" }, "PROJECTS"),
            React.createElement("div", { className: "w-full text-gray-4 h-fit flex flex-row items-center justify-center gap-[5rem] tracking-tighter text-lg md:text-xl " },
                React.createElement("div", { className: "filter-type flex flex-row items-center gap-8" },
                    React.createElement("input", { type: "checkbox", id: "filter-personal", name: "personal", defaultChecked: true, onChange: handleProjectsFilter, className: "cursor-pointer" }),
                    React.createElement("label", null, textFile["002"])),
                React.createElement("div", { className: "filter-type flex flex-row items-center gap-8" },
                    React.createElement("input", { type: "checkbox", id: "filter-work", name: "work", defaultChecked: true, onChange: handleProjectsFilter, className: "cursor-pointer" }),
                    React.createElement("label", null, textFile["003"]))),
            React.createElement("div", { ref: cartridgeCardsContainerRef, className: "w-full flex items-start justify-center overflow-x-auto overflow-y-visible min-h-screen md:min-h-[100vh]" },
                React.createElement("div", { ref: cartridgeCardsRef, className: "cartridge-cards relative" }, Object.entries(projects).map(function (_a) {
                    var k = _a[0], v = _a[1];
                    return (React.createElement("div", { id: "card", key: v.title, className: "card card-" + k, onClick: function () { return setSelectedProjectTitle(k); } },
                        React.createElement(cartridge_1["default"], { project: v })));
                }))),
            React.createElement("div", { ref: gameboyHeadRef, className: "relative gameboy-section mt-60 " + (isGameboyOn && "power-on") },
                React.createElement(gameboy_1["default"], { project: projects_json_1["default"][selectedProjectTitle] }))),
        React.createElement("section", { className: "flex-col bg-red-100 opacity-50 mt-[150vh] fade-up-section" },
            React.createElement("div", { className: "flex flex-col justify-start items-center mb-auto" },
                React.createElement("p", { className: "subtitle" }, "CONTACTS"),
                React.createElement("p", { className: "text-s max-w-1/2 whitespace-pre-line" }, textFile["001"])))));
}
exports["default"] = Home;
