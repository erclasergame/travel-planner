import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Chiamata all'API OpenRouter per ottenere tutti i modelli
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'Travel Planner - Models List'
      }
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Processa e categorizza i modelli
    const processedModels = data.data.map((model: any) => {
      const pricing = model.pricing;
      const promptPrice = parseFloat(pricing?.prompt || '0');
      
      // Determina categoria basata sul prezzo
      let category = 'premium';
      if (promptPrice === 0) {
        category = 'free';
      } else if (promptPrice < 1) {
        category = 'cheap';
      }
      
      // Estrae provider dal nome modello
      const provider = model.id.includes('/') ? 
        model.id.split('/')[0] : 
        'Unknown';
      
      // Calcola costo per 1M token
      const costPer1M = promptPrice > 0 ? 
        `$${(promptPrice * 1000000).toFixed(2)}/1M` : 
        'Gratuito';
      
      return {
        id: model.id,
        name: model.name || model.id.split('/')[1] || model.id,
        provider: provider.charAt(0).toUpperCase() + provider.slice(1),
        category: category,
        cost: costPer1M,
        description: model.description || `Modello ${category === 'free' ? 'gratuito' : 'a pagamento'} di ${provider}`,
        contextLength: model.context_length || 'N/A',
        pricing: {
          prompt: promptPrice,
          completion: parseFloat(pricing?.completion || '0')
        },
        topProvider: model.top_provider || null
      };
    });

    // Ordina per categoria e prezzo
    const sortedModels = processedModels.sort((a: any, b: any) => {
      // Prima i gratuiti, poi economici, poi premium
      const categoryOrder = { 'free': 0, 'cheap': 1, 'premium': 2 };
      if (categoryOrder[a.category] !== categoryOrder[b.category]) {
        return categoryOrder[a.category] - categoryOrder[b.category];
      }
      // All'interno della categoria, ordina per prezzo
      return a.pricing.prompt - b.pricing.prompt;
    });

    // Filtra solo i modelli più rilevanti per travel planning
    const relevantModels = sortedModels.filter((model: any) => {
      const modelId = model.id.toLowerCase();
      // Include modelli gratuiti e modelli buoni per text generation
      return model.category === 'free' || 
             modelId.includes('gpt') ||
             modelId.includes('claude') ||
             modelId.includes('gemini') ||
             modelId.includes('llama') ||
             modelId.includes('deepseek') ||
             modelId.includes('mistral') ||
             modelId.includes('phi') ||
             modelId.includes('qwen');
    });

    return NextResponse.json({
      success: true,
      models: relevantModels,
      total: relevantModels.length,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Models API Error:', error);
    
    // Fallback ai modelli statici in caso di errore
    const fallbackModels = [
      {
        id: 'google/gemma-2-9b-it:free',
        name: 'Gemma 2 9B',
        provider: 'Google',
        category: 'free',
        cost: 'Gratuito',
        description: 'Modello gratuito per test e sviluppo'
      },
      {
        id: 'meta-llama/llama-3.1-8b-instruct:free',
        name: 'Llama 3.1 8B',
        provider: 'Meta',
        category: 'free',
        cost: 'Gratuito',
        description: 'Modello open-source potente e gratuito'
      },
      {
        id: 'deepseek/deepseek-chat',
        name: 'DeepSeek Chat',
        provider: 'DeepSeek',
        category: 'cheap',
        cost: '$0.14/1M',
        description: 'Ottimo rapporto qualità/prezzo'
      }
    ];

    return NextResponse.json({
      success: false,
      models: fallbackModels,
      total: fallbackModels.length,
      error: 'Fallback to static models',
      lastUpdated: new Date().toISOString()
    });
  }
}