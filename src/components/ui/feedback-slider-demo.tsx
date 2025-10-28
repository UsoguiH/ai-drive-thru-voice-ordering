// demo.tsx
import * as React from "react";
import FeedbackSlider from "@/components/ui/feedback-slider";

const FeedbackSliderDemo = () => {
  return (
    <div className="w-full h-[700px] flex items-center justify-center overflow-hidden">
      <FeedbackSlider className="h-full w-full" />
    </div>
  );
};

export { FeedbackSliderDemo as DemoOne };