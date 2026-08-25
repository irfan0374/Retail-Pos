import bwipjs from 'bwip-js'

/** Renders a Code128 barcode (with human-readable text) as a PNG data URL, generated on demand. */
export async function renderBarcodePng(value: string): Promise<string> {
  const buffer = await bwipjs.toBuffer({
    bcid: 'code128',
    text: value,
    scale: 3,
    height: 12,
    includetext: true,
    textxalign: 'center'
  })
  return `data:image/png;base64,${buffer.toString('base64')}`
}
