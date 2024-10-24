import { trpc } from "@/app/_trpc/client"
import { INFINITE_QUERY_LIMIT } from "@/config/infinite-query"
import { Loader2, MessageSquare } from "lucide-react"
import Skeleton from "react-loading-skeleton"
import Message from "./Message"

interface MessagesProps {
    fileId: string
}

const Messages = ({ fileId }: MessagesProps) => {

    const { data, isLoading, fetchNextPage } = trpc.getPageFileMessages.useInfiniteQuery({
        fileId,
        limit: INFINITE_QUERY_LIMIT,
    }, {
        getNextPageParam: (lastPage) => lastPage?.nextCursor,
        keepPreviousData: true
    })

    const mesages = data?.pages.flatMap((page) => page.messages)

    const loadingMessages = {
        createAt: new Date().toISOString(),
        id: 'loading-message',
        isUserMessage: false,
        text: (
            <span className="flex h-full items-center justify-center">
                <Loader2 className="h-2 w-4 animate-spin" />
            </span>
        )
    }

    const combinedMessages = {
        ...(true ? [loadingMessages] : []),
        ...(mesages ?? [])
    }

    return <div className="flex max-h-[calc(100vh-3.5rem-7rem)] border-zinc-200 flex-1 flex-col-reverse gap-4 p-3 overflow-y-auto scrollbar-thumb-blue scrollbar-thumb-rounded scrollbar-track-blue-lighter scrollbar-w-2 scrollbar-touch">
        {combinedMessages && combinedMessages.length > 0 ? (
            combinedMessages.map((message, i) => {
                const isNextMessageSamePerson =
                    combinedMessages[i - 1]?.isUserMessage ===
                    combinedMessages[i]?.isUserMessage

                if (i === combinedMessages.length - 1) {
                    return <Message message={message} isNextMessageSamePerson={isNextMessageSamePerson} key={message.id} />
                } else return <Message message={message} isNextMessageSamePerson={isNextMessageSamePerson} key={message.id} />
            })
        ) : isLoading ? (
            <div className="w-full flex flex-col gap-2">
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
            </div>
        ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-2">
                <MessageSquare className="h-8 w-8 text-blue-500" />
                <h3 className="font-semibold text-xl">You&apos;re all set!</h3>
                <p className="text-zinc-500 text-sm">
                    Ask your question to get started.
                </p>
            </div>
        )}
    </div>
}

export default Messages