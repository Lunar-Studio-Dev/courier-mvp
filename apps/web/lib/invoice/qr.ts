import QRCode from "qrcode";

export async function generateQRDataUrl(content: string): Promise<string> {
  return QRCode.toDataURL(content, {
    width: 150,
    margin: 1,
    color: { dark: "#000000", light: "#ffffff" },
  });
}
