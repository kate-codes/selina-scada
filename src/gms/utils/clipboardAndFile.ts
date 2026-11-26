export async function copyTextToClipboard(text: string): Promise<void> {
    await navigator.clipboard.writeText(text)
}

/** Turns a schema's display name into a safe download filename, falling back to a
 *  generic name for an empty/symbols-only title. */
export function slugifyFilename(name: string, fallback: string): string {
    const slug = name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
    return slug || fallback
}

export function downloadJsonFile(filename: string, contents: string): void {
    const blob = new Blob([contents], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
}

export function readUploadedJsonFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result ?? ''))
        reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'))
        reader.readAsText(file)
    })
}
