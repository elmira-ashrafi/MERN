import { AbsoluteFill, Sequence } from "remotion";
import { CHAPTER_FRAMES, CHAPTERS } from "./theme";
import AskScene from "./scenes/AskScene";
import PostScene from "./scenes/PostScene";
import ProposalsScene from "./scenes/ProposalsScene";
import MatchScene from "./scenes/MatchScene";

const SCENES = [AskScene, PostScene, ProposalsScene, MatchScene];

const HeroComposition = ({ mode = "product" }) => {
    return (
        <AbsoluteFill>
            {CHAPTERS.map((chapter, i) => {
                const Scene = SCENES[i];
                return (
                    <Sequence key={chapter.key} from={i * CHAPTER_FRAMES} durationInFrames={CHAPTER_FRAMES}>
                        <Scene mode={mode} />
                    </Sequence>
                );
            })}
        </AbsoluteFill>
    );
};

export default HeroComposition;