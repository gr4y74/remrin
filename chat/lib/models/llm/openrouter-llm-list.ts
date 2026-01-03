import { LLM } from "@/types"

export const OPENROUTER_LLM_LIST: LLM[] = [
    {
        modelId: "mistralai/mistral-7b-instruct:free",
        modelName: "Mistral 7B Instruct (FREE)",
        provider: "openrouter",
        hostedId: "mistralai/mistral-7b-instruct:free",
        platformLink: "https://openrouter.ai",
        imageInput: false
    },
    {
        modelId: "meta-llama/llama-3.1-8b-instruct:free",
        modelName: "Llama 3 8B Instruct (FREE)",
        provider: "openrouter",
        hostedId: "meta-llama/llama-3.1-8b-instruct:free",
        platformLink: "https://openrouter.ai",
        imageInput: false
    }
]
