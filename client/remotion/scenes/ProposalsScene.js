import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { COLORS } from "../theme";

const PROVIDERS = [
    { name: "Alex", avatar: "🧑‍🔧", from: -260, delay: 0, price: "$45" },
    { name: "Sam", avatar: "👩‍🔧", from: 0, delay: 10, price: "$38" },
    { name: "Jordan", avatar: "🧑‍🏭", from: 260, delay: 20, price: "$52" },
];

const ProposalsScene = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const headingIn = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

    return (
        <AbsoluteFill style={{ backgroundColor: COLORS.white, alignItems: "center", justifyContent: "center" }}>
            <div
                style={{
                    position: "absolute",
                    top: 46,
                    opacity: headingIn,
                    fontFamily: "sans-serif",
                    fontWeight: 700,
                    fontSize: 22,
                    color: COLORS.primaryDark,
                }}
            >
                Providers are sending proposals...
            </div>

            <div style={{ display: "flex", gap: 22, marginTop: 30 }}>
                {PROVIDERS.map((p) => {
                    const s = spring({ frame: frame - p.delay, fps, config: { damping: 13, mass: 0.7 } });
                    const y = interpolate(s, [0, 1], [70, 0]);
                    return (
                        <div
                            key={p.name}
                            style={{
                                opacity: s,
                                transform: `translateY(${y}px) scale(${interpolate(s, [0, 1], [0.7, 1])})`,
                                width: 150,
                                background: COLORS.white,
                                border: `2px solid ${COLORS.accent}`,
                                borderRadius: 14,
                                padding: 16,
                                textAlign: "center",
                                fontFamily: "sans-serif",
                                boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
                            }}
                        >
                            <div style={{ fontSize: 40 }}>{p.avatar}</div>
                            <div style={{ fontWeight: 600, marginTop: 6, color: COLORS.ink }}>{p.name}</div>
                            <div
                                style={{
                                    marginTop: 8,
                                    display: "inline-block",
                                    background: COLORS.primary,
                                    color: COLORS.white,
                                    borderRadius: 999,
                                    padding: "4px 12px",
                                    fontSize: 14,
                                    fontWeight: 700,
                                }}
                            >
                                {p.price}
                            </div>
                        </div>
                    );
                })}
            </div>
        </AbsoluteFill>
    );
};

export default ProposalsScene;
