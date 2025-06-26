// Logging utility - fallback to console if electron-log fails
let log
try {
  log = require('electron-log')
} catch (error) {
  console.warn('electron-log not available, using console fallback')
  log = {
    info: console.log,
    warn: console.warn,
    error: console.error
  }
}

class SentimentService {
  constructor() {
    this.pipeline = null
    this.isInitialized = false
    this.isInitializing = false
  }

  /**
   * Sentiment analysis pipeline'ını başlat
   */
  async initializePipeline() {
    if (this.isInitialized || this.isInitializing) {
      return this.pipeline
    }

    this.isInitializing = true
    
    try {
      // Transformers.js'i dinamik olarak import et
      const { pipeline } = await import('@xenova/transformers')
      
      log.info('🤖 Sentiment analysis modeli yükleniyor...')
      
      // Türkçe destekli sentiment analysis modeli
      this.pipeline = await pipeline(
        'sentiment-analysis',
        'nlptown/bert-base-multilingual-uncased-sentiment',
        {
          // Quantization ile performans optimizasyonu
          dtype: 'q8'
        }
      )
      
      this.isInitialized = true
      this.isInitializing = false
      
      log.info('✅ Sentiment analysis modeli başarıyla yüklendi')
      return this.pipeline
      
    } catch (error) {
      this.isInitializing = false
      log.error('❌ Sentiment analysis modeli yüklenemedi:', error)
      throw new Error('Sentiment analysis modeli yüklenemedi')
    }
  }

  /**
   * Metin sentiment analizi yap
   */
  async analyzeSentiment(text) {
    try {
      if (!text || typeof text !== 'string' || text.trim().length === 0) {
        return {
          sentiment: 'neutral',
          score: 0.5,
          confidence: 'low'
        }
      }

      // Pipeline'ı başlat (eğer başlatılmamışsa)
      if (!this.isInitialized) {
        await this.initializePipeline()
      }

      // Sentiment analizi yap
      const result = await this.pipeline(text.trim())
      
      if (!result || !Array.isArray(result) || result.length === 0) {
        throw new Error('Geçersiz sentiment analizi sonucu')
      }

      const prediction = result[0]
      
      // Sonucu normalize et
      const normalizedResult = this.normalizeSentimentResult(prediction)
      
      log.info(`🎭 Sentiment analizi: "${text.substring(0, 50)}..." -> ${normalizedResult.sentiment} (${normalizedResult.score})`)
      
      return normalizedResult
      
    } catch (error) {
      log.error('❌ Sentiment analizi hatası:', error)
      
      // Hata durumunda neutral döndür
      return {
        sentiment: 'neutral',
        score: 0.5,
        confidence: 'low',
        error: error.message
      }
    }
  }

  /**
   * Batch sentiment analizi (birden fazla metin)
   */
  async analyzeBatchSentiment(texts) {
    if (!Array.isArray(texts) || texts.length === 0) {
      return []
    }

    const results = []
    
    // Her metin için sırayla analiz yap (paralel işlem bellek sorunlarına neden olabilir)
    for (const text of texts) {
      const result = await this.analyzeSentiment(text)
      results.push(result)
    }

    return results
  }

  /**
   * Model sonucunu normalize et
   */
  normalizeSentimentResult(prediction) {
    const { label, score } = prediction
    
    // BERT multilingual sentiment model sonuçlarını normalize et
    // Bu model 1-5 yıldız rating sistemi kullanır
    let sentiment, normalizedScore, confidence
    
    if (label === '5 stars' || label === '4 stars') {
      sentiment = score > 0.8 ? 'very_positive' : 'positive'
      normalizedScore = Math.min(0.5 + (score * 0.5), 1.0)
    } else if (label === '3 stars') {
      sentiment = 'neutral'
      normalizedScore = 0.5
    } else if (label === '2 stars' || label === '1 star') {
      sentiment = score > 0.8 ? 'very_negative' : 'negative'
      normalizedScore = Math.max(0.5 - (score * 0.5), 0.0)
    } else {
      // Fallback: POSITIVE/NEGATIVE labels
      if (label === 'POSITIVE') {
        sentiment = score > 0.8 ? 'very_positive' : 'positive'
        normalizedScore = Math.min(0.5 + (score * 0.5), 1.0)
      } else if (label === 'NEGATIVE') {
        sentiment = score > 0.8 ? 'very_negative' : 'negative'
        normalizedScore = Math.max(0.5 - (score * 0.5), 0.0)
      } else {
        sentiment = 'neutral'
        normalizedScore = 0.5
      }
    }

    // Confidence seviyesi belirle
    if (score >= 0.8) {
      confidence = 'high'
    } else if (score >= 0.6) {
      confidence = 'medium'
    } else {
      confidence = 'low'
    }

    return {
      sentiment,
      score: parseFloat(normalizedScore.toFixed(3)),
      confidence,
      raw: {
        label,
        score: parseFloat(score.toFixed(3))
      }
    }
  }

  /**
   * Sentiment istatistikleri hesapla
   */
  calculateSentimentStats(sentimentResults) {
    if (!Array.isArray(sentimentResults) || sentimentResults.length === 0) {
      return {
        average: 0.5,
        distribution: {},
        dominant: 'neutral',
        confidence: 'low'
      }
    }

    const distribution = {
      very_positive: 0,
      positive: 0,
      neutral: 0,
      negative: 0,
      very_negative: 0
    }

    let totalScore = 0
    let highConfidenceCount = 0

    sentimentResults.forEach(result => {
      if (result.sentiment && distribution.hasOwnProperty(result.sentiment)) {
        distribution[result.sentiment]++
      }
      
      if (typeof result.score === 'number') {
        totalScore += result.score
      }
      
      if (result.confidence === 'high') {
        highConfidenceCount++
      }
    })

    const average = totalScore / sentimentResults.length
    
    // En dominant sentiment'i bul
    const dominant = Object.keys(distribution).reduce((a, b) => 
      distribution[a] > distribution[b] ? a : b
    )

    // Genel confidence seviyesi
    const overallConfidence = highConfidenceCount / sentimentResults.length >= 0.5 ? 'high' : 
                             highConfidenceCount / sentimentResults.length >= 0.3 ? 'medium' : 'low'

    return {
      average: parseFloat(average.toFixed(3)),
      distribution,
      dominant,
      confidence: overallConfidence,
      total: sentimentResults.length
    }
  }

  /**
   * Pipeline durumunu kontrol et
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      isInitializing: this.isInitializing,
      modelName: 'nlptown/bert-base-multilingual-uncased-sentiment',
      supportedLanguages: ['tr', 'en', 'de', 'fr', 'es', 'it', 'pt', 'nl']
    }
  }

  /**
   * Pipeline'ı temizle (bellek tasarrufu için)
   */
  async cleanup() {
    if (this.pipeline) {
      this.pipeline = null
      this.isInitialized = false
      log.info('🧹 Sentiment analysis pipeline temizlendi')
    }
  }
}

module.exports = new SentimentService() 