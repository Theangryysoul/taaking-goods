import { lazy, Suspense } from "react";
import ResinArt from "./ResinArt";

const ResinObject = lazy(() => import("./ResinObject"));

export default function HeroStage() {
  return (
    <div className="resin-stage" data-cursor="Drag">
      <div className="resin-stage__fallback" aria-hidden="true">
        <ResinArt
          shape="loop"
          palette="honey"
          withBackground={false}
          className="resin-stage__svg"
        />
      </div>
      <Suspense fallback={null}>
        <ResinObject />
      </Suspense>
      <div className="stage-meta stage-meta--top">
        <span>Object 01</span>
        <span>Amber loop</span>
      </div>
      <div className="stage-meta stage-meta--bottom">
        <span>Drag to turn</span>
        <span>One of one</span>
      </div>
    </div>
  );
}
