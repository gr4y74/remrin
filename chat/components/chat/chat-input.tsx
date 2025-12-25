import { RemrinContext } from "@/context/context"
import useHotkey from "@/lib/hooks/use-hotkey"
import { LLM_LIST } from "@/lib/models/llm/llm-list"
import { cn } from "@/lib/utils"
import {
  IconBolt,
  IconCirclePlus,
  IconLayoutSidebarRight,
  IconPlayerStopFilled,
  IconSend,
  IconUser
} from "@tabler/icons-react"
import Image from "next/image"
import { FC, useContext, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Input } from "../ui/input"
import { TextareaAutosize } from "../ui/textarea-autosize"
import { ChatCommandInput } from "./chat-command-input"
import { ChatFilesDisplay } from "./chat-files-display"
import { useChatHandler } from "./chat-hooks/use-chat-handler"
import { useChatHistoryHandler } from "./chat-hooks/use-chat-history"
import { usePromptAndCommand } from "./chat-hooks/use-prompt-and-command"
import { useSelectFileHandler } from "./chat-hooks/use-select-file-handler"
import { SuggestedReplies } from "@/components/chat-enhanced"
import { EmojiPicker } from "./emoji-picker"

interface ChatInputProps { }

export const ChatInput: FC<ChatInputProps> = ({ }) => {
  const { t } = useTranslation()

  useHotkey("l", () => {
    handleFocusChatInput()
  })

  const [isTyping, setIsTyping] = useState<boolean>(false)

  const {
    isAssistantPickerOpen,
    focusAssistant,
    setFocusAssistant,
    userInput,
    chatMessages,
    isGenerating,
    selectedPreset,
    selectedAssistant,
    focusPrompt,
    setFocusPrompt,
    focusFile,
    focusTool,
    setFocusTool,
    isToolPickerOpen,
    isPromptPickerOpen,
    setIsPromptPickerOpen,
    isFilePickerOpen,
    setFocusFile,
    chatSettings,
    selectedTools,
    setSelectedTools,
    assistantImages,
    selectedPersona,
    setUserInput,
    isCanvasOpen,
    setIsCanvasOpen,
    isCharacterPanelOpen,
    setIsCharacterPanelOpen
  } = useContext(RemrinContext)

  const {
    chatInputRef,
    handleSendMessage,
    handleStopMessage,
    handleFocusChatInput
  } = useChatHandler()

  const { handleInputChange } = usePromptAndCommand()

  const { filesToAccept, handleSelectDeviceFile } = useSelectFileHandler()

  const {
    setNewMessageContentToNextUserMessage,
    setNewMessageContentToPreviousUserMessage
  } = useChatHistoryHandler()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const prevIsGenerating = useRef(isGenerating)

  useEffect(() => {
    setTimeout(() => {
      handleFocusChatInput()
    }, 200) // FIX: hacky
  }, [selectedPreset, selectedAssistant])

  // Fetch suggestions when AI finishes generating a response
  useEffect(() => {
    const fetchSuggestions = async () => {
      // Only fetch when isGenerating changes from true to false (AI just finished)
      if (prevIsGenerating.current && !isGenerating && chatMessages.length > 0) {
        try {
          const lastMessage = chatMessages[chatMessages.length - 1]
          const response = await fetch("/api/chat/suggestions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              personaName: selectedPersona?.name,
              recentMessages: chatMessages.slice(-3).map(m => ({
                role: m.message.role,
                content: m.message.content
              }))
            })
          })
          const data = await response.json()
          setSuggestions(data.suggestions || [])
        } catch (error) {
          console.error("Error fetching suggestions:", error)
        }
      }
      prevIsGenerating.current = isGenerating
    }

    fetchSuggestions()
  }, [isGenerating, chatMessages, selectedPersona])

  // Clear suggestions when user starts typing
  useEffect(() => {
    if (userInput.length > 0) {
      setSuggestions([])
    }
  }, [userInput])

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!isTyping && event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      setIsPromptPickerOpen(false)
      handleSendMessage(userInput, chatMessages, false)
    }

    // Consolidate conditions to avoid TypeScript error
    if (
      isPromptPickerOpen ||
      isFilePickerOpen ||
      isToolPickerOpen ||
      isAssistantPickerOpen
    ) {
      if (
        event.key === "Tab" ||
        event.key === "ArrowUp" ||
        event.key === "ArrowDown"
      ) {
        event.preventDefault()
        // Toggle focus based on picker type
        if (isPromptPickerOpen) setFocusPrompt(!focusPrompt)
        if (isFilePickerOpen) setFocusFile(!focusFile)
        if (isToolPickerOpen) setFocusTool(!focusTool)
        if (isAssistantPickerOpen) setFocusAssistant(!focusAssistant)
      }
    }

    if (event.key === "ArrowUp" && event.shiftKey && event.ctrlKey) {
      event.preventDefault()
      setNewMessageContentToPreviousUserMessage()
    }

    if (event.key === "ArrowDown" && event.shiftKey && event.ctrlKey) {
      event.preventDefault()
      setNewMessageContentToNextUserMessage()
    }

    //use shift+ctrl+up and shift+ctrl+down to navigate through chat history
    if (event.key === "ArrowUp" && event.shiftKey && event.ctrlKey) {
      event.preventDefault()
      setNewMessageContentToPreviousUserMessage()
    }

    if (event.key === "ArrowDown" && event.shiftKey && event.ctrlKey) {
      event.preventDefault()
      setNewMessageContentToNextUserMessage()
    }

    if (
      isAssistantPickerOpen &&
      (event.key === "Tab" ||
        event.key === "ArrowUp" ||
        event.key === "ArrowDown")
    ) {
      event.preventDefault()
      setFocusAssistant(!focusAssistant)
    }
  }

  const handlePaste = (event: React.ClipboardEvent) => {
    const imagesAllowed = LLM_LIST.find(
      llm => llm.modelId === chatSettings?.model
    )?.imageInput

    const items = event.clipboardData.items
    for (const item of items) {
      if (item.type.indexOf("image") === 0) {
        if (!imagesAllowed) {
          toast.error(
            `Images are not supported for this model. Use models like GPT-4 Vision instead.`
          )
          return
        }
        const file = item.getAsFile()
        if (!file) return
        handleSelectDeviceFile(file)
      }
    }
  }

  return (
    <>
      <div className="flex flex-col flex-wrap justify-center gap-2">
        <ChatFilesDisplay />

        {selectedTools &&
          selectedTools.map((tool, index) => (
            <div
              key={index}
              className="flex justify-center"
              onClick={() =>
                setSelectedTools(
                  selectedTools.filter(
                    selectedTool => selectedTool.id !== tool.id
                  )
                )
              }
            >
              <div className="flex cursor-pointer items-center justify-center space-x-1 rounded-lg bg-purple-600 px-3 py-1 hover:opacity-50">
                <IconBolt size={20} />

                <div>{tool.name}</div>
              </div>
            </div>
          ))}

        {selectedAssistant && (
          <div className="border-primary mx-auto flex w-fit items-center space-x-2 rounded-lg border p-1.5">
            {selectedAssistant.image_path && (
              <Image
                className="rounded"
                src={
                  assistantImages.find(
                    img => img.path === selectedAssistant.image_path
                  )?.base64
                }
                width={28}
                height={28}
                alt={selectedAssistant.name}
              />
            )}

            <div className="text-sm font-bold">
              Talking to {selectedAssistant.name}
            </div>
          </div>
        )}
      </div>

      {/* Suggested Replies */}
      {suggestions.length > 0 && (
        <div className="mb-2">
          <SuggestedReplies
            suggestions={suggestions}
            onSelect={(suggestion) => {
              setUserInput(suggestion)
              setSuggestions([])
              handleFocusChatInput()
            }}
          />
        </div>
      )}

      {/* Clean Input Box with Solid Background - No border */}
      <div className="relative mt-3 flex min-h-[56px] w-full items-center rounded-2xl bg-rp-surface">
        <div className="absolute bottom-[76px] left-0 max-h-[300px] w-full overflow-auto rounded-xl dark:border-none">
          <ChatCommandInput />
        </div>

        {/* Left side - Attach and Emoji */}
        <div className="flex items-center gap-1 pl-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex size-9 items-center justify-center rounded-lg text-rp-muted transition-colors hover:bg-rp-overlay hover:text-rp-text"
            title="Attach file"
          >
            <IconCirclePlus size={22} />
          </button>
          <EmojiPicker
            onEmojiSelect={(emoji) => {
              setUserInput(prev => prev + emoji)
              handleFocusChatInput()
            }}
          />
        </div>

        {/* Hidden file input */}
        <Input
          ref={fileInputRef}
          className="hidden"
          type="file"
          onChange={e => {
            if (!e.target.files) return
            handleSelectDeviceFile(e.target.files[0])
          }}
          accept={filesToAccept}
        />

        {/* Text Input */}
        <TextareaAutosize
          textareaRef={chatInputRef}
          className="flex-1 resize-none bg-transparent px-3 py-3 text-rp-text placeholder:text-rp-muted focus:outline-none"
          placeholder={t(`Ask anything. Type @  /  #  !`)}
          onValueChange={handleInputChange}
          value={userInput}
          minRows={1}
          maxRows={18}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onCompositionStart={() => setIsTyping(true)}
          onCompositionEnd={() => setIsTyping(false)}
        />

        {/* Right side - Send button only */}
        <div className="flex items-center gap-2 pr-3">
          {isGenerating ? (
            <button
              onClick={handleStopMessage}
              className="flex size-9 items-center justify-center rounded-lg bg-rp-love/80 text-white transition-colors hover:bg-rp-love"
            >
              <IconPlayerStopFilled size={18} className="animate-pulse" />
            </button>
          ) : (
            <button
              onClick={() => {
                if (!userInput) return
                handleSendMessage(userInput, chatMessages, false)
              }}
              disabled={!userInput}
              className={cn(
                "flex size-9 items-center justify-center rounded-lg bg-rp-rose text-rp-base transition-all",
                userInput ? "hover:bg-rp-rose/80 hover:scale-105" : "opacity-40 cursor-not-allowed"
              )}
            >
              <IconSend size={18} />
            </button>
          )}
        </div>
      </div>
    </>
  )
}
