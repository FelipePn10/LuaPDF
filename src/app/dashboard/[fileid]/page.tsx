import ChatWrapper from "@/components/chat/ChatWrapper"
import PdfRenderer from "@/components/PdfRenderer"
import { db } from "@/db"
import { auth } from "@clerk/nextjs/server"
import { notFound, redirect } from "next/navigation"

interface PageProps {
    params: {
        fileid: string
    }
}

interface FileData {
    id: string
    url: string
    userId: string
}

const Page = async ({ params }: PageProps) => {
    const { fileid } = params

    try {
        const { userId } = await auth()

        if (!userId) {
            redirect('/sign-in')
        }

        const file = await db.file.findFirst({
            where: {
                id: fileid,
                userId
            },
        }) as FileData | null

        if (!file) {
            notFound()
        }

        return (
            <div className="flex-1 justify-between flex flex-col h-[calc(100vh-3.5rem)]">
                <div className="mx-auto w-full max-w-8xl grow lg:flex xl:px-2">
                    {/* Left side */}
                    <div className="flex-1 xl:flex">
                        <div className="px-4 py-6 sm:px-6 lg:pl-8 xl:flex-1 xl:pl-6">
                            <PdfRenderer url={file.url} />
                        </div>
                    </div>

                    {/* Right side */}
                    <div className="shrink-0 flex-[0.75] border-t border-gray-200 lg:w-96 lg:border-1 lg:border-t-0">
                        <ChatWrapper fileId={file.id} />
                    </div>
                </div>
            </div>
        )
    } catch (error) {
        console.error('Error in dashboard:', error)
        redirect('/error')
    }
}

export default Page