import { NextRequest, NextResponse } from 'next/server';

// Simple translation cache to reduce API calls
const translationCache = new Map<string, string>();

export async function POST(request: NextRequest) {
  try {
    const { text, targetLang } = await request.json();
    
    if (!text || !targetLang) {
      return NextResponse.json(
        { error: 'Text and target language are required' },
        { status: 400 }
      );
    }

    // If target is English, return original text
    if (targetLang === 'en') {
      return NextResponse.json({ translatedText: text });
    }

    // Check cache first
    const cacheKey = `${text}_${targetLang}`;
    if (translationCache.has(cacheKey)) {
      return NextResponse.json({ 
        translatedText: translationCache.get(cacheKey),
        cached: true 
      });
    }

    // Use Google Translate API (free tier)
    try {
      const { translate } = await import('@vitalets/google-translate-api');
      const result = await translate(text, { to: targetLang });
      
      // Cache the result
      translationCache.set(cacheKey, result.text);
      
      return NextResponse.json({ 
        translatedText: result.text,
        cached: false 
      });
    } catch (translateError) {
      console.error('Translation error:', translateError);
      // Fallback: return original text if translation fails
      return NextResponse.json({ 
        translatedText: text,
        error: 'Translation service unavailable' 
      });
    }

  } catch (error) {
    console.error('Translation API error:', error);
    return NextResponse.json(
      { error: 'Failed to translate text' },
      { status: 500 }
    );
  }
}
