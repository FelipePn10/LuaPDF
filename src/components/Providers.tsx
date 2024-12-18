"use client"

import { PropsWithChildren, useState } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { trpc } from "@/app/_trpc/client"
import { httpBatchLink } from "@trpc/client"
import { ClerkProvider } from '@clerk/nextjs'
import { absoluteUrl } from "@/lib/utils"

const Providers = ({ children }: PropsWithChildren) => {
    const [queryClient] = useState(() => new QueryClient())
    const [trcpClient] = useState(() =>
        trpc.createClient({
            links: [
                httpBatchLink({
                    url: absoluteUrl('/api/trpc'),
                    headers() {
                        return {
                            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}`,
                        }
                    },
                }),
            ],
        })
    )

    return (
        <ClerkProvider>
            <trpc.Provider
                client={trcpClient}
                queryClient={queryClient}>
                <QueryClientProvider client={queryClient}>
                    {children}
                </QueryClientProvider>
            </trpc.Provider>
        </ClerkProvider>
    )
}

export default Providers