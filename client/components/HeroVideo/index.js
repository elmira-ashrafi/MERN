import { useEffect, useRef, useState } from "react";
import { Player } from "@remotion/player";
import HeroComposition from "@/remotion/HeroComposition";
import { CHAPTER_FRAMES, CHAPTERS, FPS, TOTAL_FRAMES } from "@/remotion/theme";
import styles from "./heroVideo.module.css";

const HeroVideo = () => {
    const playerRef = useRef(null);
    const [mode, setMode] = useState("product");
    const [playing, setPlaying] = useState(true);
    const [activeChapter, setActiveChapter] = useState(0);

    // keep the chapter dots (and their a11y label) synced to whatever frame is actually playing,
    // including when the user drags the built-in scrubber rather than clicking a dot
    useEffect(() => {
        const player = playerRef.current;
        if (!player) return;

        const onFrameUpdate = (e) => {
            setActiveChapter(Math.min(CHAPTERS.length - 1, Math.floor(e.detail.frame / CHAPTER_FRAMES)));
        };
        const onPlay = () => setPlaying(true);
        const onPause = () => setPlaying(false);

        player.addEventListener("frameupdate", onFrameUpdate);
        player.addEventListener("play", onPlay);
        player.addEventListener("pause", onPause);

        return () => {
            player.removeEventListener("frameupdate", onFrameUpdate);
            player.removeEventListener("play", onPlay);
            player.removeEventListener("pause", onPause);
        };
    }, []);

    const goToChapter = (i) => {
        playerRef.current?.seekTo(CHAPTERS[i].start);
        setActiveChapter(i);
    };

    const togglePlay = () => {
        if (playing) {
            playerRef.current?.pause();
        } else {
            playerRef.current?.play();
        }
    };

    const restart = () => {
        playerRef.current?.seekTo(0);
        playerRef.current?.play();
    };

    return (
        <div className={styles.wrap}>
            <div className={styles.playerFrame}>
                <Player
                    ref={playerRef}
                    component={HeroComposition}
                    inputProps={{ mode }}
                    durationInFrames={TOTAL_FRAMES}
                    fps={FPS}
                    compositionWidth={640}
                    compositionHeight={360}
                    style={{ width: "100%" }}
                    loop
                    autoPlay
                    clickToPlay={false}
                />
            </div>

            <div className={styles.controls}>
                <button type="button" className={styles.iconBtn} onClick={togglePlay} aria-label={playing ? "Pause" : "Play"}>
                    {playing ? "⏸" : "▶"}
                </button>

                <div className={styles.chapters} role="tablist" aria-label="Video chapters">
                    {CHAPTERS.map((chapter, i) => (
                        <button
                            key={chapter.key}
                            type="button"
                            role="tab"
                            aria-selected={activeChapter === i}
                            aria-label={chapter.label}
                            title={chapter.label}
                            onClick={() => goToChapter(i)}
                            className={`${styles.chapterDot} ${activeChapter === i ? styles.chapterDotActive : ""}`}
                        />
                    ))}
                </div>

                <div className={styles.modeToggle} role="group" aria-label="Choose what you need">
                    <button
                        type="button"
                        className={`${styles.modeBtn} ${mode === "product" ? styles.modeBtnActive : ""}`}
                        onClick={() => setMode("product")}
                    >
                        🛍️ Product
                    </button>
                    <button
                        type="button"
                        className={`${styles.modeBtn} ${mode === "service" ? styles.modeBtnActive : ""}`}
                        onClick={() => setMode("service")}
                    >
                        🔧 Service
                    </button>
                </div>

                <button type="button" className={styles.iconBtn} onClick={restart} aria-label="Restart">
                    ↺
                </button>
            </div>

            <div className={styles.chapterLabel}>{CHAPTERS[activeChapter].label}</div>
        </div>
    );
};

export default HeroVideo;
