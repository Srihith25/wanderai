declare module 'dom-to-image-more' {
  interface Options {
    quality?: number;
    width?: number;
    height?: number;
    bgcolor?: string;
    style?: Record<string, string>;
    filter?: (node: HTMLElement) => boolean;
  }

  function toPng(node: HTMLElement, options?: Options): Promise<string>;
  function toJpeg(node: HTMLElement, options?: Options): Promise<string>;
  function toBlob(node: HTMLElement, options?: Options): Promise<Blob>;
  function toPixelData(node: HTMLElement, options?: Options): Promise<Uint8ClampedArray>;
  function toSvg(node: HTMLElement, options?: Options): Promise<string>;

  const domtoimage: {
    toPng: typeof toPng;
    toJpeg: typeof toJpeg;
    toBlob: typeof toBlob;
    toPixelData: typeof toPixelData;
    toSvg: typeof toSvg;
  };

  export default domtoimage;
}
