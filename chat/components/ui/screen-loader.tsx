import { LottieLoader } from "./lottie-loader"
import { FC } from "react"

interface ScreenLoaderProps { }

export const ScreenLoader: FC<ScreenLoaderProps> = () => {
  return (
    <div className="flex size-full flex-col items-center justify-center">
      <LottieLoader size={64} />
    </div>
  )
}
