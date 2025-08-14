import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { model, prompt } = body;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'Travel Planner - Model Test'
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 100,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Test se riesce a generare JSON
    let isValidJSON = false;
    let parsedContent = null;
    
    try {
      parsedContent = JSON.parse(content);
      isValidJSON = true;
    } catch (e) {
      isValidJSON = false;
    }

    return NextResponse.json({ 
      success: true,
      model: model,
      content: content,
      isValidJSON: isValidJSON,
      parsedContent: parsedContent,
      usage: data.usage
    });

  } catch (error: unknown) {
    console.error('Model Test Error:', error);
    
    // Type guard per error handling
    const err = error as Error;
    
    return NextResponse.json(
      { 
        success: false,
        error: err.message
      },
      { status: 500 }
    );
  }
}