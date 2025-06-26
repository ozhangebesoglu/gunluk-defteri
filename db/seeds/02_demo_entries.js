const { v4: uuidv4 } = require('uuid')

exports.seed = async function(knex) {
  await knex('diary_entries').del()
  
  const demoEntries = [
    {
      id: uuidv4(),
      title: 'Güzel Bir Başlangıç',
      content: 'Bugün yeni günlük uygulamama ilk girişimi yapıyorum. Oldukça heyecanlıyım! Bu dijital günlük sayesinde düşüncelerimi daha düzenli tutabileceğimi umuyorum.',
      entry_date: knex.raw("CURRENT_DATE - INTERVAL '7 days'"),
      day_of_week: 'Pazartesi',
      tags: ['Mutluluk', 'Başarı'],
      sentiment: 'positive',
      sentiment_score: 0.8,
      weather: 'Güneşli',
      location: 'İstanbul',
      is_favorite: true,
      word_count: 32,
      read_time: 1
    },
    {
      id: uuidv4(),
      title: 'İş Yoğunluğu',
      content: 'Bugün işte çok yoğun bir gün geçirdim. Proje deadline\'ı yaklaşıyor ve takım olarak epey stres altındayız. Ancak iyi bir ekip çalışması sergiliyoruz.',
      entry_date: knex.raw("CURRENT_DATE - INTERVAL '6 days'"),
      day_of_week: 'Salı',
      tags: ['İş'],
      sentiment: 'neutral',
      sentiment_score: 0.5,
      weather: 'Bulutlu',
      location: 'Ankara',
      is_favorite: false,
      word_count: 28,
      read_time: 1
    },
    {
      id: uuidv4(),
      title: 'Aile Yemeği',
      content: 'Akşam ailecek toplandık ve uzun zamandır hasret kaldığımız ev yemeklerini yedik. Annemin yaptığı dolma ve baklava muhteşemdi. Bu tür anların kıymetini bilmek lazım.',
      entry_date: knex.raw("CURRENT_DATE - INTERVAL '5 days'"),
      day_of_week: 'Çarşamba',
      tags: ['Aile', 'Mutluluk'],
      sentiment: 'very_positive',
      sentiment_score: 0.9,
      weather: 'Yağmurlu',
      location: 'İzmir',
      is_favorite: true,
      word_count: 35,
      read_time: 1
    },
    {
      id: uuidv4(),
      title: 'Yeni Şeyler Öğreniyorum',
      content: 'Bugün Electron ve PostgreSQL hakkında çok şey öğrendim. Özellikle güvenlik konularında dikkat edilmesi gerekenler çok önemli. contextIsolation ve nodeIntegration ayarları kritik.',
      entry_date: knex.raw("CURRENT_DATE - INTERVAL '4 days'"),
      day_of_week: 'Perşembe',
      tags: ['Öğrenme', 'İş'],
      sentiment: 'positive',
      sentiment_score: 0.7,
      weather: 'Güneşli',
      location: 'İstanbul',
      is_favorite: false,
      word_count: 31,
      read_time: 1
    },
    {
      id: uuidv4(),
      title: 'Hafta Sonu Keyfi',
      content: 'Harika bir hafta sonu geçiriyorum! Arkadaşlarımla pikniğe gittik, doğanın içinde nefes aldık. Şehir hayatının stresinden uzaklaşmak bazen çok iyi geliyor.',
      entry_date: knex.raw("CURRENT_DATE - INTERVAL '2 days'"),
      day_of_week: 'Cumartesi',
      tags: ['Mutluluk', 'Seyahat'],
      sentiment: 'very_positive',
      sentiment_score: 0.85,
      weather: 'Güneşli',
      location: 'Bolu',
      is_favorite: true,
      word_count: 26,
      read_time: 1
    }
  ]
  
  await knex('diary_entries').insert(demoEntries)
} 