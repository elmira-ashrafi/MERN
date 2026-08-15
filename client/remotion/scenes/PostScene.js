import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { COLORS } from "../theme";

const FIELDS = {
    product: [
        { label: "Category", value: "Electronics" },
        { label: "Title", value: "Need a used laptop" },
        { label: "Location", value: "Downtown" },
    ],
    service: [
        { label: "Category", value: "Home Repair" },
        { label: "Title", value: "Fix a leaking pipe" },
        { label: "Location", value: "Downtown" },
    ],
};

const PostScene = ({ mode }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const fields = FIELDS[mode] ?? FIELDS.product;

    const cardIn = spring({ frame, fps, config: { damping: 14 } });
    const checkFrame = 60;
    const checkPop = spring({ frame: frame - checkFrame, fps, config: { damping: 10 } });

    return (
        <AbsoluteFill style={{ backgroundColor: COLORS.white, alignItems: "center", justifyContent: "center" }}>
            <div
                style={{
                    width: 380,
                    transform: `translateY(${interpolate(cardIn, [0, 1], [40, 0])}px)`,
                    opacity: cardIn,
                    background: COLORS.white,
                    border: `2px solid ${COLORS.accent}`,
                    borderRadius: 16,
                    padding: 24,
                    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
                    fontFamily: "sans-serif",
                }}
            >
                <div style={{ fontWeight: 700, fontSize: 20, color: COLORS.primaryDark, marginBottom: 14 }}>
                    New Request
                </div>

                {fields.map((f, i) => {
                    const rowIn = spring({ frame: frame - 10 - i * 12, fps, config: { damping: 14 } });
                    return (
                        <div
                            key={f.label}
                            style={{
                                opacity: rowIn,
                                transform: `translateX(${interpolate(rowIn, [0, 1], [-16, 0])}px)`,
                                marginBottom: 12,
                            }}
                        >
                            <div style={{ fontSize: 12, color: "#6c757d" }}>{f.label}</div>
                            <div
                                style={{
                                    marginTop: 4,
                                    padding: "8px 12px",
                                    borderRadius: 8,
                                    background: "#f4f8ff",
                                    fontSize: 15,
                                    color: COLORS.ink,
                                }}
                            >
                                {f.value}
                            </div>
                        </div>
                    );
                })}

                {frame >= checkFrame && (
                    <div
                        style={{
                            marginTop: 6,
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            transform: `scale(${checkPop})`,
                            color: COLORS.success,
                            fontWeight: 600,
                        }}
                    >
                        <span style={{ fontSize: 22 }}>✅</span> Request posted!
                    </div>
                )}
            </div>
        </AbsoluteFill>
    );
};

export default PostScene;
