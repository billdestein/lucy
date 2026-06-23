import { GoogleGenAI } from '@google/genai'
import { config } from '../config'

const ai = new GoogleGenAI({ apiKey: config.googleApiKey })

// Text-to-image generation. Used when no source pic is focused ('empty').
export async function generateImageFromText(promptText: string): Promise<Buffer> {
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: promptText,
    })
    const images = response.generatedImages
    if (!images || images.length === 0 || !images[0].image?.imageBytes) {
        throw new Error('No image returned from imagen-4.0-generate-001')
    }
    // imageBytes is a base64-encoded string.
    return Buffer.from(images[0].image.imageBytes, 'base64')
}

// Image mutation. Pass contents as a flat array of parts (NOT wrapped in a role object).
// Always use mimeType 'image/png' regardless of the source file's actual mime type. No
// config block is needed. This works with a standard Google API key.
export async function mutateImage(sourceBytesBase64: string, promptText: string): Promise<Buffer> {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: [
            { inlineData: { data: sourceBytesBase64, mimeType: 'image/png' } },
            { text: promptText },
        ] as any,
    })
    const parts = response.candidates?.[0]?.content?.parts
    if (!parts) {
        throw new Error('No content parts returned from gemini-2.5-flash-image')
    }
    const imagePart = parts.find((p: any) => p.inlineData)
    const data = (imagePart as any)?.inlineData?.data
    if (!data) {
        throw new Error('No inline image data returned from gemini-2.5-flash-image')
    }
    return Buffer.from(data, 'base64')
}
