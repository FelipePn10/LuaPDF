import { db } from "@/db";
import { getPineconeClient } from "@/lib/pinecone";
import { SendMessageValidator } from "@/lib/validators/SendMessageValidator";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { CohereEmbeddings } from "@langchain/cohere";
import { PineconeStore } from "@langchain/pinecone";
import { NextRequest } from "next/server";
import { CohereClientV2 } from "cohere-ai";

import { CohereStream, StreamingTextResponse } from "ai"

export const POST = async (req: NextRequest) => {
    const body = await req.json();

    const { getUser } = getKindeServerSession();
    const user = await getUser();
    const { id: userId } = user;

    if (!userId) return new Response("Unauthorized", { status: 401 });

    const { fileId, message } = SendMessageValidator.parse(body);

    const file = await db.file.findFirst({
        where: {
            id: fileId,
            userId,
        },
    });

    if (!file) return new Response("Not Found", { status: 404 });

    await db.message.create({
        data: {
            text: message,
            isUserMessage: true,
            userId,
            fileId,
        },
    });

    // 1: Vetoriza a mensagem com Cohere
    const embeddings = new CohereEmbeddings({
        apiKey: process.env.COHERE_API_KEY!,
    });

    const pineconeIndex = getPineconeClient.Index('luapdf')

    const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
        pineconeIndex,
        namespace: file.id,
    });

    const results = await vectorStore.similaritySearch(message, 4);

    const prevMessages = await db.message.findMany({
        where: {
            fileId,
        },
        orderBy: {
            createdAt: 'asc',
        },
        take: 6,
    });

    const formattedPrevMessages = prevMessages.map((msg) => ({
        role: msg.isUserMessage ? ("user" as const) : ("assistant" as const),
        content: msg.text,
    }));

    const cohere = new CohereClientV2({
        token: process.env.COHERE_API_KEY,
    });

    type StreamChunk = any;

    const response = await cohere.chat({
        model: 'c4ai-aya-23-8b',
        messages: [
            {
                role: 'system',
                content:
                    'Use the following pieces of context (or previous conversation if needed) to answer the users question in markdown format.',
            },
            {
                role: 'user',
                content: `Use the following pieces of context (or previous conversation if needed) to answer the user's question in markdown format. If you don't know the answer, just say that you don't know, don't try to make up an answer.
    
              \n----------------\n
              
              PREVIOUS CONVERSATION:
              ${formattedPrevMessages.map((message) => {
                    if (message.role === 'user') return `User: ${message.content}\n`;
                    return `Assistant: ${message.content}\n`;
                })}
    
              \n----------------\n
    
              CONTEXT:
              ${results.map((r) => r.pageContent).join('\n\n')}
    
              USER INPUT: ${message}`,
            },
        ],
    });

    //check and if necessary change later!:

    const stream = CohereStream(response as unknown as AsyncIterable<StreamChunk>, {
        async onCompletion(completion) {
            await db.message.create({
                data: {
                    text: completion,
                    isUserMessage: false,
                    userId,
                    fileId,
                },
            });
        },
    });

    return new StreamingTextResponse(stream);
}













































{/* 
    const response = await cohere.chat.completions.create({
    model: "c4ai-aya-23-8b",
    temperature: 0,
    stream: true,
    messages: [
        messages: [
      {
        role: 'system',
        content:
          'Use the following pieces of context (or previous conversaton if needed) to answer the users question in markdown format.',
      },
      {
        role: 'user',
        content: `Use the following pieces of context (or previous conversaton if needed) to answer the users question in markdown format. \nIf you don't know the answer, just say that you don't know, don't try to make up an answer.
        
  \n----------------\n
  
  PREVIOUS CONVERSATION:
  ${formattedPrevMessages.map((message) => {
    if (message.role === 'user') return `User: ${message.content}\n`
    return `Assistant: ${message.content}\n`
  })}
  
  \n----------------\n
  
  CONTEXT:
  ${results.map((r) => r.pageContent).join('\n\n')}
  
  USER INPUT: ${message}`,
      },
    ],
    ]
    })
    
    */}