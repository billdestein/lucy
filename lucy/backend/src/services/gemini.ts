import { GoogleGenAI } from '@google/genai'
import { config } from '../config'

const ai = new GoogleGenAI({ apiKey: config.googleApiKey })

export async function generateImage(promptText: string): Promise<Buffer> {
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: promptText,
        config: { numberOfImages: 1 },
    })
    const imageBytes = response.generatedImages?.[0]?.image?.imageBytes
    if (!imageBytes) throw new Error('No image bytes returned from generateImages')
    if (typeof imageBytes === 'string') {
        return Buffer.from(imageBytes, 'base64')
    }
    return Buffer.from(imageBytes as unknown as Uint8Array)
}

export async function mutateImage(
    sourceBase64: string,
    mimeType: string,
    promptText: string
): Promise<Buffer> {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: [
            { inlineData: { data: sourceBase64, mimeType } },
            { text: promptText },
        ] as any,
    })
    const parts = response.candidates![0].content!.parts!
    const imagePart = parts.find((p: any) => p.inlineData?.data)
    if (!imagePart?.inlineData?.data) {
        throw new Error('No image returned from Gemini')
    }
    return Buffer.from(imagePart.inlineData.data, 'base64')
}
