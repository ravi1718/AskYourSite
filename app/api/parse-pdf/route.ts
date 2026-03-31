import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Bypass the buggy index.js in pdf-parse 1.1.1 by targeting the lib directly
    const pdfParse = require('pdf-parse/lib/pdf-parse.js');

    const data = await pdfParse(buffer);
    return NextResponse.json({ success: true, text: data.text });
  } catch (error: any) {
    console.error("PDF Parse Error:", error);
    return NextResponse.json({ success: false, error: String(error.message) }, { status: 500 });
  }
}
