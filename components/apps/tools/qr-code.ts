import qrcode from "qrcode-generator";
export function buildQrDataUrl(text:string):string|null{
  if(!text.trim())return null;
  const qr=qrcode(0,"M");
  qr.addData(text);
  qr.make();
  return qr.createDataURL(6,4);
}
