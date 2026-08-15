import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { COLORS } from "../theme";

const AskScene = ({ mode }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const pop = spring({ frame, fps, config: { damping: 12, mass: 0.6 } });
    const bubbleOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
    const isProduct = mode === "product";

    return (
        <AbsoluteFill style={{ backgroundColor: COLORS.white, alignItems: "center", justifyContent: "center" }}>
            <div
                style={{
                    fontSize: 110,
                    transform: `scale(${pop})`,
                    filter: "drop-shadow(0 8px 16px rgba(13,110,253,0.25))",
                }}
            >
                {isProduct ? "🛍️" : "🔧"}
            </div>

            <div
                style={{
                    marginTop: 28,
                    opacity: bubbleOpacity,
                    background: COLORS.accent,
                    color: COLORS.primaryDark,
                    padding: "14px 28px",
                    borderRadius: 999,
                    fontSize: 26,
                    fontWeight: 600,
                    fontFamily: "sans-serif",
                }}
            >
                Need a {isProduct ? "product" : "service"}?
            </div>

            <div style={{ marginTop: 12, opacity: bubbleOpacity, fontSize: 16, color: "#6c757d", fontFamily: "sans-serif" }}>
                Tap the toggle below to try both
            </div>
        </AbsoluteFill>
    );
};

export default AskScene;
