import type { Metadata } from "next";
import "./globals.css";
export const metadata:Metadata={title:"JIANG.OS — Personal Web Operating System",description:"Projects, notes, code and tools — organized as a personal web operating system.",icons:{icon:"/favicon.svg"}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en" suppressHydrationWarning><body>{children}</body></html>}
