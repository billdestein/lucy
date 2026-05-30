import { GoogleGenAI } from '@google/genai'
import { config } from '../config'

const ai = new GoogleGenAI({ apiKey: config.googleApiKey })

// Text-to-image generation. Works with a standard Google API key.
export async function generateImageFromText(promptText: string): Promise<Buffer> {
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: promptText,
        config: { numberOfImages: 1 },
    })
    const b64 = response.generatedImages?.[0]?.image?.imageBytes
    if (!b64) {
        throw new Error('Imagen returned no image bytes')
    }
    return Buffer.from(b64, 'base64')
}

// Image mutation. The source bytes are always passed with mimeType 'image/png' regardless
// of the source file's actual mime type. Contents is a flat array of parts (not wrapped in
// a role object) and no config block is passed.
export async function mutateImage(sourceBytesBase64: string, promptText: string): Promise<Buffer> {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: [
            { inlineData: { data: sourceBytesBase64, mimeType: 'image/png' } },
            { text: promptText },
        ],
    })
    const parts = response.candidates?.[0]?.content?.parts ?? []
    for (const part of parts) {
        const data = part.inlineData?.data
        if (data) {
            return Buffer.from(data, 'base64')
        }
    }
    throw new Error('Gemini returned no image part')
}
