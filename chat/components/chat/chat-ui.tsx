import Loading from "@/app/[locale]/loading"
import { useChatHandler } from "@/components/chat/chat-hooks/use-chat-handler"
import { RemrinContext } from "@/context/context"
import { getAssistantToolsByAssistantId } from "@/db/assistant-tools"
import { getChatFilesByChatId } from "@/db/chat-files"
import { getChatById } from "@/db/chats"
import { getMessageFileItemsByMessageId } from "@/db/message-file-items"
import { getMessagesByChatId } from "@/db/messages"
import { getMessageImageFromStorage } from "@/db/storage/message-images"
import { convertBlobToBase64 } from "@/lib/blob-to-b64"
import useHotkey from "@/lib/hooks/use-hotkey"
import { LLMID, MessageImage } from "@/types"
import { useParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { FC, useCallback, useContext, useEffect, useState } from "react"
import { IconChevronUp, IconChevronDown } from "@tabler/icons-react"
import { ChatHelp } from "./chat-help"
import { useScroll } from "./chat-hooks/use-scroll"
import { ChatInput } from "./chat-input"
import { ChatMessages } from "./chat-messages"
import { ChatScrollButtons } from "./chat-scroll-buttons"
import { ChatSecondaryButtons } from "./chat-secondary-buttons"
import { TypingIndicator } from "@/components/chat-enhanced"
import { FollowButton } from "@/components/profile"
import { ChatHeaderMiniProfile } from "./chat-header-mini-profile"
import { ChatBackgroundToggle } from "./chat-background-toggle"

interface ChatUIProps { }

export const ChatUI: FC<ChatUIProps> = ({ }) => {
  useHotkey("o", () => handleNewChat())

  const params = useParams()

  const {
    setChatMessages,
    selectedChat,
    setSelectedChat,
    chatMessages,
    userInput,
    chatSettings,
    setChatSettings,
    setChatImages,
    assistants,
    setSelectedAssistant,
    setChatFileItems,
    setChatFiles,
    setShowFilesDisplay,
    chatFileItems,
    selectedPersona,
    chatBackgroundEnabled,
    setUseRetrieval,
    setSelectedTools,
    isGenerating
  } = useContext(RemrinContext)

  const { handleNewChat, handleFocusChatInput } = useChatHandler()

  const {
    messagesStartRef,
    messagesEndRef,
    handleScroll,
    scrollToBottom,
    setIsAtBottom,
    isAtTop,
    isAtBottom,
    isOverflowing,
    scrollToTop
  } = useScroll()

  const [loading, setLoading] = useState(true)
  const [showChatHeader, setShowChatHeader] = useState(true)

  const fetchMessages = useCallback(async () => {
    const fetchedMessages = await getMessagesByChatId(params.chatid as string)

    const imagePromises: Promise<MessageImage>[] = fetchedMessages.flatMap(
      message =>
        message.image_paths
          ? message.image_paths.map(async imagePath => {
            const url = await getMessageImageFromStorage(imagePath)

            if (url) {
              const response = await fetch(url)
              const blob = await response.blob()
              const base64 = await convertBlobToBase64(blob)

              return {
                messageId: message.id,
                path: imagePath,
                base64,
                url,
                file: null
              }
            }

            return {
              messageId: message.id,
              path: imagePath,
              base64: "",
              url,
              file: null
            }
          })
          : []
    )

    const images: MessageImage[] = await Promise.all(imagePromises.flat())
    setChatImages(images)

    const messageFileItemPromises = fetchedMessages.map(
      async message => await getMessageFileItemsByMessageId(message.id)
    )

    const messageFileItems = await Promise.all(messageFileItemPromises)

    const uniqueFileItems = messageFileItems.flatMap(item => item.file_items)
    setChatFileItems(uniqueFileItems)

    const chatFiles = await getChatFilesByChatId(params.chatid as string)

    if (chatFiles) {
      setChatFiles(
        chatFiles.files.map(file => ({
          id: file.id,
          name: file.name,
          type: file.type,
          file: null
        }))
      )
    }

    setUseRetrieval(true)
    setShowFilesDisplay(true)

    const fetchedChatMessages = fetchedMessages.map(message => {
      return {
        message,
        fileItems: messageFileItems
          .filter(messageFileItem => messageFileItem.id === message.id)
          .flatMap(messageFileItem =>
            messageFileItem.file_items.map(fileItem => fileItem.id)
          )
      }
    })

    setChatMessages(fetchedChatMessages)
  }, [params.chatid, setChatFileItems, setChatFiles, setChatImages, setChatMessages, setShowFilesDisplay, setUseRetrieval])

  const fetchChat = useCallback(async () => {
    const chat = await getChatById(params.chatid as string)
    if (!chat) return

    if (chat.assistant_id) {
      const assistant = assistants.find(
        assistant => assistant.id === chat.assistant_id
      )

      if (assistant) {
        setSelectedAssistant(assistant)

        const assistantTools = (
          await getAssistantToolsByAssistantId(assistant.id)
        ).tools
        setSelectedTools(assistantTools)
      }
    }

    setSelectedChat(chat)
    setChatSettings({
      model: chat.model as LLMID,
      prompt: chat.prompt,
      temperature: chat.temperature,
      contextLength: chat.context_length,
      includeProfileContext: chat.include_profile_context,
      includeWorkspaceInstructions: chat.include_workspace_instructions,
      embeddingsProvider: chat.embeddings_provider as "openai" | "local"
    })
  }, [assistants, params.chatid, setChatSettings, setSelectedAssistant, setSelectedChat, setSelectedTools])

  useEffect(() => {
    const fetchData = async () => {
      try {
        await fetchMessages()
        await fetchChat()

        scrollToBottom()
        setIsAtBottom(true)
      } catch (error) {
        console.error("Error fetching chat data:", error)
      } finally {
        setLoading(false)
      }
    }

    if (params.chatid) {
      fetchData().then(() => {
        handleFocusChatInput()
      })
    } else {
      setLoading(false)
    }
  }, [fetchChat, fetchMessages, handleFocusChatInput, params.chatid, scrollToBottom, setIsAtBottom])

  if (loading) {
    return <Loading />
  }

  return (
    <div className="relative flex h-full flex-col items-center">
      <div className="absolute left-4 top-2.5 flex justify-center">
        <ChatScrollButtons
          isAtTop={isAtTop}
          isAtBottom={isAtBottom}
          isOverflowing={isOverflowing}
          scrollToTop={scrollToTop}
          scrollToBottom={scrollToBottom}
        />
      </div>

      <div className="absolute right-4 top-1 flex h-[40px] items-center space-x-2 z-30">
        <ChatBackgroundToggle />
        <ChatSecondaryButtons />
      </div>

      {/* Chat Header - Mini Profile Card */}
      {selectedPersona ? (
        <div className="relative z-20 w-full min-w-[300px] px-2 sm:w-[600px] md:w-[700px] lg:w-[700px] xl:w-[800px]">
          <ChatHeaderMiniProfile />
        </div>
      ) : showChatHeader ? (
        <div className="bg-secondary flex max-h-[50px] min-h-[50px] w-full items-center justify-between border-b-2 px-4 font-bold">
          <div className="flex-1 text-center">
            <div className="mx-auto max-w-[200px] truncate sm:max-w-[400px] md:max-w-[500px] lg:max-w-[600px] xl:max-w-[700px]">
              {selectedChat?.name || "Chat"}
            </div>
          </div>
          <button
            onClick={() => setShowChatHeader(false)}
            className="text-muted-foreground hover:text-foreground p-1 transition-colors"
            title="Hide Header"
          >
            <IconChevronUp size={20} />
          </button>
        </div>
      ) : (
        <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2">
          <button
            onClick={() => setShowChatHeader(true)}
            className="bg-secondary/40 hover:bg-secondary/60 text-muted-foreground hover:text-foreground flex items-center gap-1 rounded-b-xl px-4 py-1.5 transition-all backdrop-blur-sm"
            title="Show Header"
          >
            <IconChevronDown size={16} />
            <span className="text-xs font-medium">Show Header</span>
          </button>
        </div>
      )}

      <div
        className="relative z-10 flex size-full flex-col overflow-auto border-b"
        onScroll={handleScroll}
      >
        <div ref={messagesStartRef} />

        <ChatMessages />

        {/* Typing Indicator - Shows during AI response generation */}
        {isGenerating && (
          <div className="mx-auto w-full min-w-[300px] max-w-[600px] px-4 py-2 sm:max-w-[700px] lg:max-w-[700px] xl:max-w-[800px]">
            <TypingIndicator characterName={selectedPersona?.name} />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="relative z-20 w-full min-w-[300px] items-end px-2 pb-3 pt-0 sm:w-[600px] sm:pb-8 sm:pt-5 md:w-[700px] lg:w-[700px] xl:w-[800px]">
        <ChatInput />
      </div>


    </div >
  )
}
