export async function copyTextToClipboard(text: string): Promise<void> {
    await navigator.clipboard.writeText(text)
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
