declare module "html-to-image" {
  export interface Options {
    quality?: number
    width?: number
    height?: number
    style?: Record<string, string>
    backgroundColor?: string
    filter?: (node: Node) => boolean
    imagePlaceholder?: string
    cacheBust?: boolean
    pixelRatio?: number
    skipAutoScale?: boolean
    preferredFontFormat?: string
    fontEmbedCSS?: string
    canvasWidth?: number
    canvasHeight?: number
  }

  export function toPng(node: HTMLElement, options?: Options): Promise<string>
  export function toJpeg(node: HTMLElement, options?: Options): Promise<string>
  export function toBlob(node: HTMLElement, options?: Options): Promise<Blob>
  export function toPixelData(node: HTMLElement, options?: Options): Promise<Uint8ClampedArray>
  export function toSvg(node: HTMLElement, options?: Options): Promise<string>
  export function toCanvas(node: HTMLElement, options?: Options): Promise<HTMLCanvasElement>
}

