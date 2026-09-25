import { Binary, Braces, Calculator as CalculatorIcon, Clock, Fingerprint, QrCode, Regex } from "lucide-react";
import type { ToolDefinition } from "./types";
import { CalculatorTool } from "./calculator-view";
import { JsonFormatterTool } from "./json-formatter-view";
import { TimestampTool } from "./timestamp-view";
import { Base64Tool } from "./base64-view";
import { UuidTool } from "./uuid-view";
import { RegexTool } from "./regex-view";
import { QrCodeTool } from "./qr-code-view";
export const TOOLS: ToolDefinition[] = [
  {id:"calculator",name:"Calculator",icon:CalculatorIcon,keywords:["calc","math","arithmetic"],component:CalculatorTool},
  {id:"json",name:"JSON Formatter",icon:Braces,keywords:["json","format","pretty"],component:JsonFormatterTool},
  {id:"timestamp",name:"Timestamp",icon:Clock,keywords:["unix","epoch","date","time"],component:TimestampTool},
  {id:"base64",name:"Base64",icon:Binary,keywords:["encode","decode","base64"],component:Base64Tool},
  {id:"uuid",name:"UUID Generator",icon:Fingerprint,keywords:["uuid","guid","id"],component:UuidTool},
  {id:"regex",name:"Regex Tester",icon:Regex,keywords:["regex","regexp","pattern"],component:RegexTool},
  {id:"qr",name:"QR Code",icon:QrCode,keywords:["qr","barcode"],component:QrCodeTool}
];
