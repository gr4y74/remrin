import { LLM } from "@/types"

const DEEPSEEK_PLATFORM_LINK = "https://platform.deepseek.com/"

// DeepSeek V3 (REMRIN Default)
const DEEPSEEK_CHAT: LLM = {
    modelId: "deepseek-chat",
    modelName: "DeepSeek V3",
    provider: "openai", // Uses OpenAI-compatible API, routes to /api/chat/openai
    hostedId: "deepseek-chat",
    platformLink: DEEPSEEK_PLATFORM_LINK,
    imageInput: false,
    pricing: {
        currency: "USD",
        unit: "1M tokens",
        inputCost: 0.14,
        outputCost: 0.28
    }
}

// DeepSeek Coder
const DEEPSEEK_CODER: LLM = {
    modelId: "deepseek-coder",
    modelName: "DeepSeek Coder",
    provider: "openai", // Uses OpenAI-compatible API, routes to /api/chat/openai
    hostedId: "deepseek-coder",
    platformLink: DEEPSEEK_PLATFORM_LINK,
    imageInput: false,
    pricing: {
        currency: "USD",
        unit: "1M tokens",
        inputCost: 0.14,
        outputCost: 0.28
    }
}

export const DEEPSEEK_LLM_LIST: LLM[] = [DEEPSEEK_CHAT, DEEPSEEK_CODER]
