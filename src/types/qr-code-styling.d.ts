declare module 'qr-code-styling' {
  interface Options {
    width?: number;
    height?: number;
    data?: string;
    margin?: number;
    qrOptions?: object;
    backgroundOptions?: { color?: string };
    dotsOptions?: { color?: string; type?: string };
    cornersSquareOptions?: { type?: string; color?: string; image?: string; size?: number };
    cornersDotOptions?: { type?: string; color?: string; image?: string };
    imageOptions?: { crossOrigin?: string; margin?: number };
    image?: string;
  }
  export default class QRCodeStyling {
    constructor(options: Options);
    append(parent: HTMLElement | string): void;
    update(options: Partial<Options>): void;
    download(fileName?: string, extension?: string): void;
    getRawData(extension?: string): Promise<Blob>;
  }
} 