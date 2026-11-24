// Configuração e Árvore de Perguntas do Aplicativo

const COLOR_PALETTES = {
  'Verde': '#2E8B57',
  'Amarelo': '#D99B00',
  'Azul': '#2563EB',
  'Vermelho': '#DC2626',
  'Avermelhado': '#B91C1C',
  'Laranja': '#EA580C',
  'Branco': '#FFFFFF',
  'Preto': '#1F2937',
  'Cinza': '#6B7280',
  'Marrom': '#8D5B4C',
  'Bege': '#D2B48C',
  'Prateado': '#94A3B8',
  'Multicolorido': 'linear-gradient(135deg, #EF4444, #F59E0B, #10B981, #3B82F6)',
  'Outra / não sei': '#9CA3AF'
};

const COUNTRIES_LIST = [
  'Brasil',
  'Argentina',
  'Colômbia',
  'Bolívia',
  'Peru',
  'Paraguai',
  'Uruguai',
  'Estados Unidos',
  'México',
  'Portugal',
  'Espanha',
  'Austrália'
];

const INITIAL_QUESTION = {
  id: 'group',
  title: 'Qual grupo?',
  type: 'group-cards',
  options: [
    { label: 'Ave', value: 'ave', image: 'images/groups/ave.jpg' },
    { label: 'Réptil', value: 'reptil', image: 'images/groups/reptil.jpg' },
    { label: 'Peixe', value: 'peixe', image: 'images/groups/peixe.jpg' },
    { label: 'Mamífero', value: 'mamifero', image: 'images/groups/mamifero.jpg' },
    { label: 'Artrópode', value: 'artropode', image: 'images/groups/artropode.jpg' }
  ]
};

const QUESTIONS_BY_GROUP = {
  ave: [
    {
      id: 'color',
      title: 'Qual é a cor predominante?',
      type: 'color',
      options: [
        'Verde', 'Amarelo', 'Azul', 'Vermelho', 'Laranja',
        'Branco', 'Preto', 'Cinza', 'Marrom', 'Multicolorido', 'Outra / não sei'
      ]
    },
    {
      id: 'size',
      title: 'Qual o tamanho aproximado?',
      type: 'pill',
      options: [
        { label: 'Muito pequeno (menor que um pardal)', value: 'muito-pequeno' },
        { label: 'Pequeno (semelhante a um pardal)', value: 'pequeno' },
        { label: 'Médio (semelhante a um pombo)', value: 'medio' },
        { label: 'Grande (semelhante a uma galinha)', value: 'grande' },
        { label: 'Muito grande', value: 'muito-grande' }
      ]
    },
    {
      id: 'country',
      title: 'Em qual país foi observado?',
      type: 'country',
      options: COUNTRIES_LIST
    }
  ],

  mamifero: [
    {
      id: 'hasFur',
      title: 'Possui pelos ou pelagem visível?',
      type: 'pill',
      options: [
        { label: 'Sim', value: 'sim' },
        { label: 'Não', value: 'nao' },
        { label: 'Não consigo identificar', value: 'naosei' }
      ]
    },
    {
      id: 'color',
      title: 'Qual a cor predominante?',
      type: 'color',
      options: [
        'Branco', 'Preto', 'Cinza', 'Marrom', 'Bege',
        'Amarelo', 'Avermelhado', 'Multicolorido', 'Outra / não sei'
      ]
    },
    {
      id: 'size',
      title: 'Qual o porte aproximado?',
      type: 'pill',
      options: [
        { label: 'Muito pequeno (semelhante a um rato)', value: 'muito-pequeno' },
        { label: 'Pequeno (semelhante a um gato)', value: 'pequeno' },
        { label: 'Médio (semelhante a um cachorro)', value: 'medio' },
        { label: 'Grande (semelhante a um ser humano)', value: 'grande' },
        { label: 'Gigante (elefante, baleia etc.)', value: 'gigante' }
      ]
    },
    {
      id: 'country',
      title: 'Em qual país foi observado?',
      type: 'country',
      options: COUNTRIES_LIST
    }
  ],

  reptil: [
    {
      id: 'body',
      title: 'Como é o corpo?',
      type: 'pill',
      options: [
        { label: 'Comprido e sem patas (cobra)', value: 'cobra', icon: '🐍' },
        { label: 'Com quatro patas', value: 'patas', icon: '🦎' },
        { label: 'Com casco', value: 'casco', icon: '🐢' },
        { label: 'Não consigo identificar', value: 'naosei' }
      ]
    },
    {
      id: 'color',
      title: 'Qual a cor predominante?',
      type: 'color',
      options: [
        'Verde', 'Marrom', 'Cinza', 'Preto', 'Amarelo',
        'Branco', 'Vermelho', 'Multicolorido', 'Outra / não sei'
      ]
    },
    {
      id: 'size',
      title: 'Qual o tamanho aproximado?',
      type: 'pill',
      options: [
        { label: 'Muito pequeno', value: 'muito-pequeno' },
        { label: 'Pequeno', value: 'pequeno' },
        { label: 'Médio', value: 'medio' },
        { label: 'Grande', value: 'grande' }
      ]
    },
    {
      id: 'country',
      title: 'Em qual país foi observado?',
      type: 'country',
      options: COUNTRIES_LIST
    }
  ],

  peixe: [
    {
      id: 'color',
      title: 'Qual a cor predominante?',
      type: 'color',
      options: [
        'Prateado', 'Cinza', 'Preto', 'Branco', 'Amarelo',
        'Laranja', 'Vermelho', 'Azul', 'Verde', 'Marrom', 'Multicolorido', 'Outra / não sei'
      ]
    },
    {
      id: 'size',
      title: 'Qual o tamanho aproximado?',
      type: 'pill',
      options: [
        { label: 'Muito pequeno (menor que a mão)', value: 'muito-pequeno' },
        { label: 'Pequeno (do tamanho da mão)', value: 'pequeno' },
        { label: 'Médio (do tamanho do antebraço)', value: 'medio' },
        { label: 'Grande (maior que o antebraço)', value: 'grande' }
      ]
    },
    {
      id: 'water',
      title: 'Onde foi encontrado?',
      type: 'pill',
      options: [
        { label: 'Água doce', value: 'doce', icon: '🏞️' },
        { label: 'Água salgada', value: 'salgada', icon: '🌊' },
        { label: 'Não sei', value: 'naosei' }
      ]
    },
    {
      id: 'country',
      title: 'Em qual país foi observado?',
      type: 'country',
      options: COUNTRIES_LIST
    }
  ],

  artropode: {
    branchQuestion: {
      id: 'legs',
      title: 'Tem quantas patas?',
      type: 'pill',
      options: [
        { label: 'Tem 6 patas (Inseto)', value: '6', icon: '🐜' },
        { label: 'Tem 8 patas (Aracnídeo)', value: '8', icon: '🕷️' },
        { label: 'Não sei / Não consigo identificar', value: 'naosei', icon: '❓' }
      ]
    },
    branches: {
      '6': [
        {
          id: 'hasWings',
          title: 'Possui asas?',
          type: 'pill',
          options: [
            { label: 'Sim', value: 'sim' },
            { label: 'Não', value: 'nao' },
            { label: 'Não sei', value: 'naosei' }
          ]
        },
        {
          id: 'color',
          title: 'Qual a cor predominante?',
          type: 'color',
          options: [
            'Verde', 'Amarelo', 'Azul', 'Vermelho', 'Laranja',
            'Branco', 'Preto', 'Cinza', 'Marrom', 'Multicolorido', 'Outra / não sei'
          ]
        },
        {
          id: 'country',
          title: 'Em qual país foi observado?',
          type: 'country',
          options: COUNTRIES_LIST
        }
      ],
      '8': [
        {
          id: 'hasStinger',
          title: 'Possui uma cauda com ferrão?',
          type: 'pill',
          options: [
            { label: 'Sim', value: 'sim', icon: '🦂' },
            { label: 'Não', value: 'nao', icon: '🕷️' },
            { label: 'Não sei', value: 'naosei' }
          ]
        },
        {
          id: 'color',
          title: 'Qual a cor predominante?',
          type: 'color',
          options: [
            'Preto', 'Marrom', 'Cinza', 'Amarelo', 'Branco',
            'Vermelho', 'Bege', 'Multicolorido', 'Outra / não sei'
          ]
        },
        {
          id: 'country',
          title: 'Em qual país foi observado?',
          type: 'country',
          options: COUNTRIES_LIST
        }
      ],
      'naosei': [
        {
          id: 'hasWings',
          title: 'Possui asas?',
          type: 'pill',
          options: [
            { label: 'Sim', value: 'sim' },
            { label: 'Não', value: 'nao' },
            { label: 'Não sei', value: 'naosei' }
          ]
        },
        {
          id: 'hasStinger',
          title: 'Possui uma cauda com ferrão?',
          type: 'pill',
          options: [
            { label: 'Sim', value: 'sim' },
            { label: 'Não', value: 'nao' },
            { label: 'Não sei', value: 'naosei' }
          ]
        },
        {
          id: 'color',
          title: 'Qual a cor predominante?',
          type: 'color',
          options: [
            'Verde', 'Amarelo', 'Azul', 'Vermelho', 'Laranja',
            'Branco', 'Preto', 'Cinza', 'Marrom', 'Bege', 'Multicolorido', 'Outra / não sei'
          ]
        },
        {
          id: 'country',
          title: 'Em qual país foi observado?',
          type: 'country',
          options: COUNTRIES_LIST
        }
      ]
    }
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    INITIAL_QUESTION,
    QUESTIONS_BY_GROUP,
    COLOR_PALETTES,
    COUNTRIES_LIST
  };
}
