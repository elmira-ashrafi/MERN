import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, random } from "remotion";
import { COLORS } from "../theme";

const CONFETTI_COLORS = [COLORS.primary, COLORS.accentHover, COLORS.success, "#ffc107"];

const MatchScene = () => {
    const frame = useCurrentFrame();
    const { fps, width, height } = useVideoConfig();

    const cardIn = spring({ frame, fps, config: { damping: 12 } });
    const badgeIn = spring({ frame: frame - 20, fps, config: { damping: 10 } });
    const textIn = interpolate(frame, [40, 55], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

    return (
        <AbsoluteFill style={{ backgroundColor: COLORS.white, alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
            {frame > 15 &&
                new Array(24).fill(0).map((_, i) => {
                    const seed = `confetti-${i}`;
                    const startX = random(seed + "x") * width;
                    const fallDelay = random(seed + "d") * 20;
                    const t = Math.max(0, frame - 15 - fallDelay);
                    const y = interpolate(t, [0, 70], [-20, height * 0.55], { extrapolateRight: "clamp" });
                    const opacity = interpolate(t, [0, 10, 60, 70], [0, 1, 1, 0], { extrapolateRight: "clamp" });
                    const rotate = t * (random(seed + "r") > 0.5 ? 6 : -6);
                    return (
                        <div
                            key={seed}
                            style={{
                                position: "absolute",
                                left: startX,
                                top: y,
                                width: 8,
                                height: 8,
                                opacity,
                                background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
                                transform: `rotate(${rotate}deg)`,
                                borderRadius: 2,
                            }}
                        />
                    );
                })}

            <div
                style={{
                    position: "relative",
                    transform: `scale(${cardIn})`,
                    width: 220,
                    background: COLORS.white,
                    border: `3px solid ${COLORS.primary}`,
                    borderRadius: 18,
                    padding: 24,
                    textAlign: "center",
                    fontFamily: "sans-serif",
                    boxShadow: "0 14px 34px rgba(13,110,253,0.25)",
                }}
            >
                <div style={{ fontSize: 48 }}>👩‍🔧</div>
                <div style={{ fontWeight: 700, marginTop: 6, color: COLORS.ink }}>Sam — $38</div>
                <div
                    style={{
                        position: "absolute",
                        top: -18,
                        right: -18,
                        transform: `scale(${badgeIn})`,
                        background: COLORS.success,
                        color: COLORS.white,
                        borderRadius: "50%",
                        width: 44,
                        height: 44,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 22,
                        boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
                    }}
                >
                    ✓
                </div>
            </div>

            <div
                style={{
                    marginTop: 24,
                    opacity: textIn,
                    transform: `translateY(${interpolate(textIn, [0, 1], [12, 0])}px)`,
                    fontFamily: "sans-serif",
                    fontWeight: 700,
                    fontSize: 24,
                    color: COLORS.primaryDark,
                }}
            >
                Job done. That easy. 🎉
            </div>
        </AbsoluteFill>
    );
};

export default MatchScene;
