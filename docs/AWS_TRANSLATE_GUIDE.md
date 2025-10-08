# AWS Translate Integration - Global Page Translation

This document describes the AWS Translate integration for whole-page translation across the Checkmate application.

## Overview

The global translation system allows users to translate the entire website into their preferred language using AWS Translate. Unlike component-level translation, this approach translates all visible text content on the page dynamically.

## Architecture

### Core Components

1. **Global Translation Service** (`lib/global-translate.ts`)
   - **Client-side**: API calls to `/api/translate` endpoint
   - **Server-side**: Direct AWS Translate SDK integration (`translateTextServer`, `translateTextsServer`)
   - Intelligent language detection
   - Translation caching with expiry (24 hours)
   - DOM traversal and text node translation
   - Support for 3 languages: English, Malay, Chinese

2. **API Route** (`app/api/translate/route.ts`)
   - Secure server-side translation endpoint
   - Handles AWS credentials safely (never exposed to client)
   - Processes single and batch translation requests
   - Validates language codes and request format

3. **Global Translation Provider** (`components/global-translation-provider.tsx`)
   - React context for translation state management
   - Auto-translation on language change
   - Translation progress tracking
   - Original content restoration

4. **Global Translation Toggle** (`components/global-translation-toggle.tsx`)
   - UI controls for language selection
   - Auto-translation toggle
   - Manual translation triggers
   - Mobile-friendly interface

5. **Translation Status Indicator** (`components/translation-status-indicator.tsx`)
   - Visual feedback during translation
   - Progress indication
   - Success confirmation

### Client-Server Architecture

```
[Client Browser]                    [Next.js Server]
     │                                    │
     ├─ User selects language             │
     │                                    │
     ├─ translateText() ─────────────────>├─ POST /api/translate
     │   (via fetch API)                  │
     │                                    ├─ translateTextServer()
     │                                    │   (uses AWS SDK)
     │                                    │
     │                                    ├─ AWS Translate API
     │                                    │   (AWS_ACCESS_KEY_ID)
     │                                    │   (AWS_SECRET_ACCESS_KEY)
     │                                    │
     │<──── Translated text ──────────────┤
     │                                    │
     ├─ Update DOM with translation       │
     └─ Cache result                      │
```

**Security Benefits:**
- ✅ AWS credentials never exposed to client
- ✅ API key usage controlled server-side
- ✅ Request validation and sanitization
- ✅ Rate limiting possible on server route

## Features

### ✅ Automatic Page Translation
- Translates ALL visible text content on the page
- Preserves HTML structure and formatting
- Excludes technical elements (code blocks, scripts, etc.)
- Maintains original text for restoration

### ✅ Smart Language Detection
- Auto-detects source language using heuristics
- Supports Chinese characters detection
- Detects Malay by common words
- Falls back to English

### ✅ Supported Languages
- 🇺🇸 **English** (en) - Default language
- 🇲🇾 **Malay** (ms) - Bahasa Malaysia
- 🇨🇳 **Chinese** (zh) - 中文

### ✅ Performance Optimizations
- **Caching**: 24-hour cache for translated content
- **Batch Processing**: Groups identical text for single translations
- **Deduplication**: Translates unique text only once
- **Lazy Translation**: Only translates when needed

### ✅ Supported Languages

| Language | Code | Native Name |
|----------|------|-------------|
| English | en | English |
| Malay | ms | Bahasa Malaysia |
| Chinese | zh | 中文 |
| Spanish | es | Español |
| French | fr | Français |
| German | de | Deutsch |
| Japanese | ja | 日本語 |
| Korean | ko | 한국어 |
| Arabic | ar | العربية |
| Hindi | hi | हिन्दी |
| Portuguese | pt | Português |
| Russian | ru | Русский |
| Italian | it | Italiano |
| Thai | th | ไทย |
| Vietnamese | vi | Tiếng Việt |
| Indonesian | id | Bahasa Indonesia |
| Filipino | tl | Filipino |
| Turkish | tr | Türkçe |

## Usage

### Basic Usage

1. **Enable Auto-Translation**
   - Click the Globe icon in the header
   - Toggle "Auto-translate entire page"
   - Select your preferred language
   - The page will automatically translate

2. **Manual Translation**
   - Click the Globe icon
   - Turn OFF auto-translation
   - Select your language
   - Click "Translate Now" button

3. **Restore Original**
   - Click "Show Original" to restore English text
   - Or switch back to English language

### For Developers

#### Using the Global Translation Provider

```tsx
import { useGlobalTranslation } from "@/components/global-translation-provider";

function MyComponent() {
  const { 
    language,                    // Current language
    setLanguage,                 // Change language
    t,                          // Static translations
    isTranslating,              // Translation in progress
    enableAutoTranslation,      // Auto-translation enabled
    translateCurrentPage,       // Manually translate page
    restoreToOriginal,          // Restore original content
    hasTranslatedContent        // Has translated content
  } = useGlobalTranslation();

  return (
    <div>
      <p>Current language: {language}</p>
      <button onClick={() => setLanguage("es")}>
        Translate to Spanish
      </button>
    </div>
  );
}
```

#### Excluding Elements from Translation

Add `data-no-translate` attribute to exclude elements:

```tsx
<div data-no-translate>
  This text will NOT be translated
</div>

<code>
  // Code blocks are automatically excluded
  const example = "Not translated";
</code>
```

#### API Usage

**Translate Text:**
```typescript
POST /api/translate
{
  "text": "Hello, world!",
  "targetLanguage": "es",
  "sourceLanguage": "en"  // optional, defaults to "auto"
}

Response:
{
  "success": true,
  "data": {
    "translatedText": "¡Hola, mundo!",
    "sourceLanguage": "en"
  }
}
```

**Batch Translate:**
```typescript
POST /api/translate
{
  "texts": ["Hello", "World", "Goodbye"],
  "targetLanguage": "fr"
}

Response:
{
  "success": true,
  "data": [
    { "translatedText": "Bonjour", "sourceLanguage": "en" },
    { "translatedText": "Monde", "sourceLanguage": "en" },
    { "translatedText": "Au revoir", "sourceLanguage": "en" }
  ]
}
```

**Get Supported Languages:**
```typescript
GET /api/translate

Response:
{
  "success": true,
  "data": {
    "supportedLanguages": ["en", "ms", "zh", ...],
    "availableLanguages": [...],
    "features": [...]
  }
}
```

## Configuration

### Environment Variables

Ensure AWS credentials are configured:

```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
APP_REGION=us-east-1
```

### AWS Permissions

The AWS IAM user/role needs:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "translate:TranslateText"
      ],
      "Resource": "*"
    }
  ]
}
```

## How It Works

### Translation Flow

1. **User selects language** → Updates context state
2. **Auto-translation enabled?** → Trigger page translation
3. **DOM traversal** → Find all text nodes (excluding excluded selectors)
4. **Group identical texts** → Reduce API calls
5. **Translate unique texts** → Call AWS Translate API
6. **Apply translations** → Update DOM with translated text
7. **Mark elements** → Add `data-translated` attribute
8. **Cache results** → Store for 24 hours

### Restoration Flow

1. **User clicks "Show Original"** or **switches to English**
2. **Find translated elements** → Query `[data-translated="true"]`
3. **Restore original text** → Use `data-original-text` attribute
4. **Remove markers** → Clean up translation markers

## Advanced Features

### Smart Caching

- **Key Generation**: Uses text hash + language pair
- **Expiry**: 24-hour TTL
- **Memory Management**: Automatic cleanup of expired entries
- **Performance**: ~10x faster for cached translations

### Translation Exclusions

Default excluded selectors:
- `script`, `style`, `code`, `pre`
- `[data-no-translate]`, `.no-translate`
- `input`, `textarea`, `select`
- `[contenteditable]`
- Button labels and ARIA attributes

### Progress Tracking

```tsx
const { translationProgress } = useGlobalTranslation();

// Progress: 0-100
<Progress value={translationProgress} />
```

## Best Practices

### ✅ DO
- Enable auto-translation for consistent UX
- Use caching for frequently accessed content
- Exclude technical/code content from translation
- Provide visual feedback during translation

### ❌ DON'T  
- Translate the same content multiple times
- Include sensitive data in translations
- Rely on translation for critical legal/medical content
- Forget to handle translation errors gracefully

## Troubleshooting

### Translation not working?

1. **Check AWS credentials**: Verify environment variables
2. **Check IAM permissions**: Ensure `translate:TranslateText` is allowed
3. **Check console errors**: Look for API errors
4. **Check language support**: Verify language is supported
5. **Clear cache**: Use `clearTranslationCache()`

### Slow translations?

1. **Enable caching**: Automatic, but check cache hit rate
2. **Reduce content**: Exclude unnecessary elements
3. **Batch requests**: Already implemented
4. **Check AWS region**: Use nearest region

### Incorrect translations?

1. **Check source language**: Verify auto-detection
2. **Provide context**: Longer text = better translation
3. **Use manual mode**: Test with specific source language
4. **Report to AWS**: Some translations may need improvement

## Migration from Component Translation

If migrating from component-level translation:

1. **Remove individual translation components**
2. **Update imports** to use `useGlobalTranslation`
3. **Enable auto-translation** in settings
4. **Test thoroughly** across all pages
5. **Monitor performance** and cache effectiveness

## Cost Optimization

AWS Translate pricing (as of 2024):
- $15 per million characters
- First 2 million characters/month free (12 months)

**Optimization tips:**
- Leverage 24-hour cache
- Exclude non-translatable content
- Use batch translations
- Monitor usage via AWS console

## Future Enhancements

- [ ] User preference persistence in database
- [ ] Translation quality feedback
- [ ] Custom glossaries for technical terms
- [ ] Real-time translation for user-generated content
- [ ] A/B testing for translation approaches
- [ ] Analytics for translation usage

## Support

For issues or questions:
- Check [AWS Translate Documentation](https://docs.aws.amazon.com/translate/)
- Review console errors
- Check AWS CloudWatch logs
- Contact team for assistance

---

**Built with ❤️ using AWS Translate**
