require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;
const API_URL = 'https://api-animals.dataandapis.com/v1/animals';

// Função para obter a API Key dinamicamente mesmo se o .env tiver sido editado
function getApiKey() {
  if (process.env.DATA_AND_APIS_KEY && process.env.DATA_AND_APIS_KEY.trim().length > 5) {
    return process.env.DATA_AND_APIS_KEY.trim();
  }
  try {
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8');
      const match = content.match(/DATA_AND_APIS_KEY=(.+)/);
      if (match && match[1] && match[1].trim().length > 5) {
        return match[1].trim();
      }
    }
  } catch (e) {}
  return '';
}

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Cache local simples em arquivo para poupar a cota de 500 requisições
const cacheDir = path.join(__dirname, 'cache');
if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir, { recursive: true });
}

// Carregar dados de semente (seed)
let seedAnimals = [];
try {
  const seedPath = path.join(__dirname, 'data', 'seed-animals.json');
  if (fs.existsSync(seedPath)) {
    seedAnimals = JSON.parse(fs.readFileSync(seedPath, 'utf-8'));
  }
} catch (err) {
  console.error('Erro ao carregar seed-animals.json:', err.message);
}

// Dicionário de tradução e mapeamento
const COLOR_MAP = {
  verde: ['green', 'verde'],
  amarelo: ['yellow', 'gold', 'amarelo', 'dourado'],
  azul: ['blue', 'azul'],
  vermelho: ['red', 'vermelho', 'avermelhado', 'crimson'],
  avermelhado: ['red', 'avermelhado', 'reddish', 'rust'],
  laranja: ['orange', 'laranja'],
  branco: ['white', 'branco'],
  preto: ['black', 'preto', 'dark'],
  cinza: ['grey', 'gray', 'cinza'],
  marrom: ['brown', 'marrom'],
  bege: ['tan', 'beige', 'bege', 'cream', 'fawn'],
  prateado: ['silver', 'prateado', 'grey', 'gray']
};

const COUNTRY_MAP = {
  brasil: 'Brazil',
  brazil: 'Brazil',
  estadosunidos: 'United States',
  eua: 'United States',
  mexico: 'Mexico',
  argentina: 'Argentina',
  colombia: 'Colombia',
  bolivia: 'Bolivia',
  peru: 'Peru',
  paraguai: 'Paraguay',
  uruguai: 'Uruguay',
  portugal: 'Portugal',
  espanha: 'Spain',
  franca: 'France',
  australia: 'Australia'
};

const GROUP_CLASS_MAP = {
  ave: ['Aves'],
  mamifero: ['Mammalia'],
  reptil: ['Reptilia'],
  peixe: ['Actinopterygii', 'Chondrichthyes'],
  artropode: ['Insecta', 'Arachnida']
};

// Extrai o melhor nome amigável em português quando disponível em altNames
function extractBestDisplayName(name, altNames) {
  if (Array.isArray(altNames)) {
    const ptMatch = altNames.find(a => /[áàâãéêíóôõúç]/i.test(a) && a.length > 2);
    if (ptMatch) return `${ptMatch} (${name})`;
  }
  return name;
}

// Avaliador de tamanho relativo por peso/grupo
function matchesRelativeSize(group, sizeKey, weightLbs) {
  if (!sizeKey || sizeKey === 'naosei') return true;
  if (weightLbs == null || isNaN(weightLbs)) return true; // não descarta se o peso não estiver catalogado

  const s = sizeKey.toLowerCase().replace(/[^a-z]/g, '');

  if (group === 'ave') {
    if (s.includes('muitopequeno')) return weightLbs < 0.1;
    if (s.includes('pequeno') && !s.includes('muito')) return weightLbs >= 0.1 && weightLbs < 0.5;
    if (s.includes('medio')) return weightLbs >= 0.5 && weightLbs < 2.0;
    if (s.includes('grande') && !s.includes('muito')) return weightLbs >= 2.0 && weightLbs < 8.0;
    if (s.includes('muitogrande')) return weightLbs >= 8.0;
  } else if (group === 'mamifero') {
    if (s.includes('muitopequeno')) return weightLbs < 0.6;
    if (s.includes('pequeno') && !s.includes('muito')) return weightLbs >= 0.6 && weightLbs < 15;
    if (s.includes('medio')) return weightLbs >= 15 && weightLbs < 80;
    if (s.includes('grande') && !s.includes('muito') && !s.includes('gigante')) return weightLbs >= 80 && weightLbs < 400;
    if (s.includes('gigante')) return weightLbs >= 400;
  } else if (group === 'reptil') {
    if (s.includes('muitopequeno')) return weightLbs < 0.2;
    if (s.includes('pequeno')) return weightLbs >= 0.2 && weightLbs < 2.5;
    if (s.includes('medio')) return weightLbs >= 2.5 && weightLbs < 30;
    if (s.includes('grande')) return weightLbs >= 30;
  } else if (group === 'peixe') {
    if (s.includes('muitopequeno')) return weightLbs < 0.2;
    if (s.includes('pequeno')) return weightLbs >= 0.2 && weightLbs < 1.5;
    if (s.includes('medio')) return weightLbs >= 1.5 && weightLbs < 15;
    if (s.includes('grande')) return weightLbs >= 15;
  }

  return true;
}

// Endpoint de status
app.get('/api/status', (req, res) => {
  const currentKey = getApiKey();
  res.json({
    status: 'online',
    hasApiKey: Boolean(currentKey && currentKey.length > 5),
    cachedFiles: fs.readdirSync(cacheDir).length,
    seedCount: seedAnimals.length
  });
});

// Endpoint de lista de países para seleção rápida
app.get('/api/countries', (req, res) => {
  const countries = [
    { id: 'Brasil', label: 'Brasil 🇧🇷' },
    { id: 'Argentina', label: 'Argentina 🇦🇷' },
    { id: 'Colombia', label: 'Colômbia 🇨🇴' },
    { id: 'Bolivia', label: 'Bolívia 🇧🇴' },
    { id: 'Peru', label: 'Peru 🇵🇪' },
    { id: 'Paraguai', label: 'Paraguai 🇵🇾' },
    { id: 'Uruguai', label: 'Uruguai 🇺🇾' },
    { id: 'Estados Unidos', label: 'Estados Unidos 🇺🇸' },
    { id: 'Mexico', label: 'México 🇲🇽' },
    { id: 'Portugal', label: 'Portugal 🇵🇹' },
    { id: 'Espanha', label: 'Espanha 🇪🇸' },
    { id: 'Australia', label: 'Austrália 🇦🇺' }
  ];
  res.json(countries);
});

// Função para buscar na API externa com cache inteligente
async function fetchFromDataAndApis(className, country) {
  const key = getApiKey();
  if (!key) return [];

  const cacheKey = `cache_${(className || 'all')}_${(country || 'all')}.json`
    .toLowerCase()
    .replace(/[^a-z0-9_.]/g, '');
  const cacheFile = path.join(cacheDir, cacheKey);

  // Se existe em cache, usa
  if (fs.existsSync(cacheFile)) {
    try {
      return JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
    } catch (e) {}
  }

  try {
    const params = { limit: 100 };
    if (className) params.class = className;
    if (country) params.country = country;

    console.log(`[Animals API] Buscando: class=${className || 'qualquer'}, country=${country || 'qualquer'}`);
    const response = await axios.get(API_URL, {
      headers: { 'X-Api-Key': key },
      params,
      timeout: 8000
    });

    const results = response.data?.results || [];
    if (Array.isArray(results) && results.length > 0) {
      fs.writeFileSync(cacheFile, JSON.stringify(results, null, 2));
    }
    return results;
  } catch (err) {
    console.warn(`[Animals API] Falha na consulta (${className}, ${country}):`, err.message);
    return [];
  }
}

// Endpoint principal de consulta e filtro
app.get('/api/animals', async (req, res) => {
  try {
    const {
      group,       // ave, mamifero, reptil, peixe, artropode
      subgroup,    // inseto, aracnideo
      color,       // verde, amarelo, etc.
      size,        // muito-pequeno, pequeno, medio, grande, muito-grande, gigante
      country,     // Brasil, etc.
      hasFur,      // sim, nao
      body,        // cobra, patas, casco
      water,       // doce, salgada
      hasWings,    // sim, nao
      hasStinger,  // sim, nao
      legs         // 6, 8
    } = req.query;

    const currentKey = getApiKey();
    let pool = [];

    // Se tiver API Key e grupo selecionado, busca diretamente da API Animals
    if (currentKey && group) {
      const enCountry = country ? (COUNTRY_MAP[country.toLowerCase().replace(/\s+/g, '')] || country) : null;
      let targetClasses = GROUP_CLASS_MAP[group.toLowerCase()] || [];

      // Ajuste fino para subgrupos de artrópodes
      if (group === 'artropode') {
        if (subgroup === 'inseto' || legs === '6') {
          targetClasses = ['Insecta'];
        } else if (subgroup === 'aracnideo' || legs === '8') {
          targetClasses = ['Arachnida'];
        }
      }

      // Busca na API para as classes do grupo
      for (const targetClass of targetClasses) {
        const rawResults = await fetchFromDataAndApis(targetClass, enCountry);
        
        for (const item of rawResults) {
          // Garante foto autêntica oficial do acervo
          const officialImg = item.image || item.imageUrl || null;
          if (!officialImg) continue; // Pula se não tiver imagem

          const commonName = extractBestDisplayName(item.name, item.altNames);

          pool.push({
            slug: item.slug || (item.name ? item.name.toLowerCase().replace(/\s+/g, '-') : 'animal'),
            name: item.name || 'Animal',
            commonNamePt: commonName,
            scientificName: item.scientificName || item.taxonomy?.scientificName || '',
            taxonomy: item.taxonomy || { class: targetClass },
            colors: Array.isArray(item.colors) ? item.colors.map(c => c.toLowerCase()) : [],
            colorsPt: Array.isArray(item.colors) ? item.colors : [],
            weightLbs: item.weightLbs != null ? item.weightLbs : null,
            countries: enCountry ? [enCountry] : (Array.isArray(item.countries) ? item.countries : []),
            isRemote: true,
            habitat: item.habitat || 'Habitat natural catalogado',
            diet: item.diet || 'Onívoro',
            image: officialImg,
            summary: item.summary || item.description || `Espécie catalogada pertencente à classe ${targetClass}.`
          });
        }
      }
    }

    // Se a API externa não retornou animais (ou sem chave), usa a base seed
    if (pool.length === 0) {
      pool = [...seedAnimals];
    }

    // Aplicação dos filtros progressivos
    let filtered = pool.filter(animal => {
      const animClass = (animal.taxonomy?.class || '').toLowerCase();
      const animOrder = (animal.taxonomy?.order || '').toLowerCase();
      const animName = (animal.name || '').toLowerCase();

      // --- FILTRO DE GRUPO ---
      if (group) {
        const allowedClasses = (GROUP_CLASS_MAP[group.toLowerCase()] || []).map(c => c.toLowerCase());
        if (allowedClasses.length > 0 && !allowedClasses.includes(animClass)) {
          return false;
        }
      }

      // --- SUBGRUPO (Artropoda: Inseto vs Aracnídeo) ---
      if (group === 'artropode') {
        if (subgroup === 'inseto' || legs === '6') {
          if (animClass !== 'insecta') return false;
        } else if (subgroup === 'aracnideo' || legs === '8') {
          if (animClass !== 'arachnida') return false;
        }
      }

      // --- FILTRO DE PAÍS (se for da base local seed) ---
      if (!animal.isRemote && country && country.trim() !== '') {
        const cLower = country.toLowerCase().trim();
        const enEquiv = (COUNTRY_MAP[cLower.replace(/\s+/g, '')] || country).toLowerCase();
        
        const hasCountry = (animal.countries || []).some(c => c.toLowerCase().includes(cLower) || c.toLowerCase().includes(enEquiv)) ||
                           (animal.countriesPt || []).some(c => c.toLowerCase().includes(cLower));
        if (!hasCountry) return false;
      }

      // --- FILTRO DE COR ---
      if (color && color.trim() !== '' && !['outra', 'naosei', 'outra / não sei', 'todas'].includes(color.toLowerCase())) {
        const cKey = color.toLowerCase().replace(/[^a-z]/g, '');
        const searchColors = COLOR_MAP[cKey] || [color.toLowerCase()];

        const animColors = [
          ...(animal.colors || []),
          ...(animal.colorsPt || [])
        ].map(c => c.toLowerCase());

        if (cKey === 'multicolorido') {
          if (animColors.length < 2 && !animColors.some(c => c.includes('multi') || c.includes('color'))) {
            return false;
          }
        } else {
          const matchColor = animColors.some(ac => 
            searchColors.some(sc => ac.includes(sc) || sc.includes(ac))
          );
          if (!matchColor) return false;
        }
      }

      // --- FILTRO DE TAMANHO RELATIVO (desativado para artrópodes) ---
      if (group !== 'artropode' && size && size.trim() !== '' && size !== 'naosei') {
        // Se for seed e tiver sizeCategory explícito
        if (animal.measurements?.sizeCategory) {
          const sKey = size.toLowerCase().replace(/[^a-z]/g, '');
          const animSize = animal.measurements.sizeCategory.toLowerCase();
          if (sKey.includes('muitopequeno') && animSize !== 'muito-pequeno') return false;
          if (sKey.includes('pequeno') && !sKey.includes('muito') && animSize !== 'pequeno') return false;
          if (sKey.includes('medio') && animSize !== 'medio') return false;
          if (sKey.includes('muitogrande') && animSize !== 'muito-grande') return false;
          if (sKey.includes('gigante') && animSize !== 'gigante') return false;
          if (sKey.includes('grande') && !sKey.includes('muito') && animSize !== 'grande') return false;
        } else {
          // Se for da API externa, avalia pelo peso weightLbs
          if (!matchesRelativeSize(group, size, animal.weightLbs)) {
            return false;
          }
        }
      }

      // --- FILTRO DE RÉPTEIS (CORPO) ---
      if (group === 'reptil' && body && !body.includes('identificar')) {
        const bLower = body.toLowerCase();
        const isSnake = animOrder.includes('squamata') && (animName.includes('snake') || animName.includes('viper') || animName.includes('boa') || animName.includes('anaconda') || animName.includes('cobra'));
        const isTurtle = animOrder.includes('testudines') || animName.includes('turtle') || animName.includes('tortoise');

        if (bLower.includes('cobra') || bLower.includes('comprido')) {
          if (animal.bodyType !== 'cobra' && !isSnake) return false;
        } else if (bLower.includes('casco')) {
          if (animal.bodyType !== 'casco' && !isTurtle) return false;
        } else if (bLower.includes('quatro') || bLower.includes('patas')) {
          if (animal.bodyType === 'cobra' || isSnake || isTurtle) return false;
        }
      }

      // --- FILTRO DE MAMÍFEROS (PELOS) ---
      if (group === 'mamifero' && hasFur && !hasFur.includes('identificar')) {
        const isHairless = animName.includes('whale') || animName.includes('dolphin') || animName.includes('porpoise') || animName.includes('manatee');
        if (hasFur.toLowerCase() === 'sim' && (animal.hasFur === false || isHairless)) return false;
        if (hasFur.toLowerCase() === 'nao' && animal.hasFur !== false && !isHairless) return false;
      }

      // --- FILTRO DE INSETOS (ASAS) ---
      if (hasWings && !hasWings.includes('sei')) {
        const isWingless = animName.includes('ant') || animName.includes('flea') || animName.includes('silverfish');
        if (hasWings.toLowerCase() === 'sim' && (animal.hasWings === false || isWingless)) return false;
        if (hasWings.toLowerCase() === 'nao' && animal.hasWings !== false && !isWingless) return false;
      }

      // --- FILTRO DE ARACNÍDEOS (FERRÃO) ---
      if (hasStinger && !hasStinger.includes('sei')) {
        const isScorpion = animOrder.includes('scorpiones') || animName.includes('scorpion');
        if (hasStinger.toLowerCase() === 'sim' && (animal.hasStinger !== true && !isScorpion)) return false;
        if (hasStinger.toLowerCase() === 'nao' && (animal.hasStinger === true || isScorpion)) return false;
      }

      return true;
    });

    res.json({
      total: filtered.length,
      results: filtered
    });
  } catch (error) {
    console.error('Erro na rota /api/animals:', error);
    res.status(500).json({ error: 'Erro ao filtrar animais', message: error.message });
  }
});

// Endpoint de detalhe completo por slug (com consulta à API externa e cache)
app.get('/api/animals/:slug', async (req, res) => {
  const { slug } = req.params;
  const key = getApiKey();

  if (key) {
    const cacheDetailFile = path.join(cacheDir, `detail_${slug}.json`);
    if (fs.existsSync(cacheDetailFile)) {
      try {
        return res.json(JSON.parse(fs.readFileSync(cacheDetailFile, 'utf-8')));
      } catch (e) {}
    }

    try {
      const response = await axios.get(`${API_URL}/${slug}`, {
        headers: { 'X-Api-Key': key },
        timeout: 6000
      });
      if (response.data && response.data.name) {
        fs.writeFileSync(cacheDetailFile, JSON.stringify(response.data, null, 2));
        return res.json(response.data);
      }
    } catch (e) {
      // continua para o fallback local
    }
  }

  const local = seedAnimals.find(a => a.slug === slug);
  if (local) {
    return res.json(local);
  }

  res.status(404).json({ error: 'Animal não encontrado' });
});

app.listen(PORT, () => {
  const currentKey = getApiKey();
  console.log(`\n======================================================`);
  console.log(`🚀 Servidor Que bicho é esse? rodando em http://localhost:${PORT}`);
  console.log(`📡 Chave Animals API: ${currentKey ? 'Ativa e Conectada (' + currentKey.substring(0, 8) + '...)' : 'Não configurada'}`);
  console.log(`======================================================\n`);
});
