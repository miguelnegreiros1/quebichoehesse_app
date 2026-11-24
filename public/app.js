// Lógica Principal da Aplicação - Que Bicho é Esse?

document.addEventListener('DOMContentLoaded', () => {
  // Estado da Aplicação
  const state = {
    answers: {},
    activeQuestionsFlow: [],
    possibleSpecies: [],
    totalCount: 0,
    hasApiKey: false
  };

  // Elementos do DOM
  const dom = {
    questionsContainer: document.getElementById('questionsContainer'),
    btnReset: document.getElementById('btnReset'),
    btnViewResults: document.getElementById('btnViewResults'),
    resultsCountText: document.getElementById('resultsCountText'),
    resultsDrawer: document.getElementById('resultsDrawer'),
    drawerOverlay: document.getElementById('drawerOverlay'),
    btnCloseDrawer: document.getElementById('btnCloseDrawer'),
    drawerCountBadge: document.getElementById('drawerCountBadge'),
    activeFiltersBar: document.getElementById('activeFiltersBar'),
    speciesGallery: document.getElementById('speciesGallery'),
    emptyState: document.getElementById('emptyState'),
    animalModal: document.getElementById('animalModal'),
    modalOverlay: document.getElementById('modalOverlay'),
    btnCloseModal: document.getElementById('btnCloseModal'),
    modalAnimalImg: document.getElementById('modalAnimalImg'),
    modalTaxonClass: document.getElementById('modalTaxonClass'),
    modalDiet: document.getElementById('modalDiet'),
    modalCommonName: document.getElementById('modalCommonName'),
    modalScientificName: document.getElementById('modalScientificName'),
    modalCountries: document.getElementById('modalCountries'),
    modalHabitat: document.getElementById('modalHabitat'),
    modalSize: document.getElementById('modalSize'),
    modalColors: document.getElementById('modalColors'),
    modalDescription: document.getElementById('modalDescription')
  };

  // Inicialização
  init();

  async function init() {
    checkServerStatus();
    resetQuiz();
    setupEventListeners();
    await updateSpeciesCount();
  }

  // Verifica status do backend e chave
  async function checkServerStatus() {
    try {
      const res = await fetch('/api/status');
      const data = await res.json();
      state.hasApiKey = data.hasApiKey;
      console.log('Status do Servidor:', data);
    } catch (e) {
      console.warn('Não foi possível verificar status do backend:', e);
    }
  }

  // Reinicia todo o fluxo
  function resetQuiz() {
    state.answers = {};
    state.activeQuestionsFlow = [INITIAL_QUESTION];
    dom.questionsContainer.innerHTML = '';
    renderQuestion(INITIAL_QUESTION, 1);
    updateSpeciesCount();
  }

  // Configura Ouvintes de Eventos Globais
  function setupEventListeners() {
    dom.btnReset.addEventListener('click', resetQuiz);

    dom.btnViewResults.addEventListener('click', () => {
      openDrawer();
    });

    dom.btnCloseDrawer.addEventListener('click', closeDrawer);
    dom.drawerOverlay.addEventListener('click', closeDrawer);

    dom.btnCloseModal.addEventListener('click', closeModal);
    dom.modalOverlay.addEventListener('click', closeModal);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeModal();
        closeDrawer();
      }
    });
  }

  // Renderiza uma pergunta no fluxo em cascata
  function renderQuestion(questionConfig, questionNumber) {
    // Remove qualquer pergunta que venha depois dessa na tela se estiver sendo recalculada
    const existingElements = dom.questionsContainer.querySelectorAll('.question-item');
    for (let i = questionNumber - 1; i < existingElements.length; i++) {
      existingElements[i].remove();
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'question-item';
    wrapper.dataset.questionId = questionConfig.id;
    wrapper.dataset.stepIndex = questionNumber;

    // Título da Pergunta
    const titleEl = document.createElement('h2');
    titleEl.className = 'question-title';
    titleEl.textContent = `${questionNumber}. ${questionConfig.title}`;
    wrapper.appendChild(titleEl);

    // Contêiner de Opções
    const optionsGroup = document.createElement('div');
    optionsGroup.className = 'options-group';
    if (questionConfig.type === 'group-cards') {
      optionsGroup.classList.add('group-cards-grid');
    }

    // Renderiza de acordo com o tipo
    if (questionConfig.type === 'country') {
      renderCountrySelect(optionsGroup, questionConfig, questionNumber);
    } else {
      renderOptionButtons(optionsGroup, questionConfig, questionNumber);
    }

    wrapper.appendChild(optionsGroup);
    dom.questionsContainer.appendChild(wrapper);

    // Rola suavemente para a nova pergunta
    if (questionNumber > 1) {
      wrapper.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  // Renderiza botões normais, de cores e cards de grupos com fotos
  function renderOptionButtons(container, questionConfig, questionNumber) {
    const isColor = questionConfig.type === 'color';
    const isGroupCards = questionConfig.type === 'group-cards';

    questionConfig.options.forEach(opt => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = isGroupCards ? 'group-card-btn' : 'pill-btn';

      const label = typeof opt === 'string' ? opt : opt.label;
      const value = typeof opt === 'string' ? opt : opt.value;
      const icon = typeof opt === 'object' && opt.icon ? opt.icon : null;
      const image = typeof opt === 'object' && opt.image ? opt.image : null;

      // Card com foto para a seleção de grupo
      if (image) {
        const imgWrapper = document.createElement('div');
        imgWrapper.className = 'group-card-img-wrapper';

        const imgEl = document.createElement('img');
        imgEl.className = 'group-card-img';
        imgEl.src = image;
        imgEl.alt = label;
        imgEl.loading = 'eager';

        imgWrapper.appendChild(imgEl);
        btn.appendChild(imgWrapper);
      } else if (isColor) {
        const dot = document.createElement('span');
        dot.className = 'color-dot';
        const colorBg = COLOR_PALETTES[label] || '#555';
        if (colorBg.startsWith('linear')) {
          dot.style.background = colorBg;
        } else {
          dot.style.backgroundColor = colorBg;
        }
        btn.appendChild(dot);
      } else if (icon) {
        const iconSpan = document.createElement('span');
        iconSpan.className = 'pill-icon';
        iconSpan.textContent = icon;
        btn.appendChild(iconSpan);
      }

      const textSpan = document.createElement('span');
      textSpan.className = isGroupCards ? 'group-card-label' : 'pill-label';
      textSpan.textContent = label;
      btn.appendChild(textSpan);

      // Marca se já estava selecionado
      if (state.answers[questionConfig.id] === value) {
        btn.classList.add('active');
      }

      btn.addEventListener('click', () => {
        // Marca visual ativo
        container.querySelectorAll(isGroupCards ? '.group-card-btn' : '.pill-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Processa resposta
        handleAnswerSelected(questionConfig, value, questionNumber);
      });

      container.appendChild(btn);
    });
  }

  // Renderiza dropdown de país estilizado
  function renderCountrySelect(container, questionConfig, questionNumber) {
    const selectWrapper = document.createElement('div');
    selectWrapper.className = 'country-select-wrapper';

    const select = document.createElement('select');
    select.className = 'country-select';

    const defaultOpt = document.createElement('option');
    defaultOpt.value = '';
    defaultOpt.textContent = 'Selecione um país...';
    select.appendChild(defaultOpt);

    questionConfig.options.forEach(country => {
      const opt = document.createElement('option');
      opt.value = country;
      opt.textContent = country;
      if (state.answers[questionConfig.id] === country) {
        opt.selected = true;
      }
      select.appendChild(opt);
    });

    select.addEventListener('change', () => {
      if (select.value) {
        handleAnswerSelected(questionConfig, select.value, questionNumber);
      }
    });

    selectWrapper.appendChild(select);
    container.appendChild(selectWrapper);
  }

  // Lógica quando o usuário responde a uma pergunta
  function handleAnswerSelected(questionConfig, selectedValue, currentStepNumber) {
    state.answers[questionConfig.id] = selectedValue;

    // Remove respostas de perguntas que estavam após esta
    truncateAnswersAfter(currentStepNumber);

    // Recalcula o fluxo a partir daqui
    rebuildQuestionsFlow(questionConfig, selectedValue);

    // Atualiza contagem de espécies
    updateSpeciesCount().then(() => {
      // Avança para a próxima pergunta se houver
      const nextStepIndex = currentStepNumber;
      if (nextStepIndex < state.activeQuestionsFlow.length) {
        renderQuestion(state.activeQuestionsFlow[nextStepIndex], nextStepIndex + 1);
      } else {
        // Fim de todas as perguntas: abre o painel automaticamente conforme solicitado!
        setTimeout(() => {
          openDrawer();
        }, 350);
      }
    });
  }

  // Reconstrói a árvore de perguntas ativa com base nas escolhas
  function rebuildQuestionsFlow(lastQuestion, lastValue) {
    const group = state.answers['group'];
    if (!group) {
      state.activeQuestionsFlow = [INITIAL_QUESTION];
      return;
    }

    const newFlow = [INITIAL_QUESTION];

    if (group === 'artropode') {
      const legs = state.answers['legs'];
      newFlow.push(QUESTIONS_BY_GROUP.artropode.branchQuestion);

      if (legs) {
        const subBranch = QUESTIONS_BY_GROUP.artropode.branches[legs] || QUESTIONS_BY_GROUP.artropode.branches['naosei'];
        newFlow.push(...subBranch);
      }
    } else {
      const groupQuestions = QUESTIONS_BY_GROUP[group] || [];
      newFlow.push(...groupQuestions);
    }

    state.activeQuestionsFlow = newFlow;
  }

  // Trunca respostas posteriores ao modificar um passo anterior
  function truncateAnswersAfter(stepNumber) {
    // Mantém as chaves até o stepNumber
    const validKeys = state.activeQuestionsFlow.slice(0, stepNumber).map(q => q.id);
    for (const key of Object.keys(state.answers)) {
      if (!validKeys.includes(key)) {
        delete state.answers[key];
      }
    }
  }

  // Faz requisição ao backend para obter espécies filtradas e quantidade
  async function updateSpeciesCount() {
    dom.resultsCountText.textContent = 'Calculando espécies possíveis...';

    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(state.answers)) {
      if (value) {
        params.append(key, value);
      }
    }

    try {
      const response = await fetch(`/api/animals?${params.toString()}`);
      const data = await response.json();
      state.possibleSpecies = data.results || [];
      state.totalCount = data.total || 0;

      const count = state.totalCount;
      const countLabel = count === 1 ? '1 espécie possível' : `${count} espécies possíveis`;

      dom.resultsCountText.textContent = `Resultados: ${countLabel}`;
      dom.drawerCountBadge.textContent = count;
      renderDrawerGallery();
    } catch (err) {
      console.error('Erro ao buscar animais:', err);
      dom.resultsCountText.textContent = 'Resultados: Ver espécies possíveis';
    }
  }

  // Renderiza a galeria de espécies no painel lateral
  function renderDrawerGallery() {
    dom.speciesGallery.innerHTML = '';
    renderActiveFilterTags();

    if (state.possibleSpecies.length === 0) {
      dom.emptyState.classList.remove('hidden');
      return;
    }

    dom.emptyState.classList.add('hidden');

    state.possibleSpecies.forEach(animal => {
      const card = document.createElement('div');
      card.className = 'animal-card';

      const thumb = document.createElement('img');
      thumb.className = 'animal-thumb';
      thumb.src = animal.image || 'https://images.unsplash.com/photo-1474511320723-9a56873867b5?auto=format&fit=crop&w=400&q=80';
      thumb.alt = animal.commonNamePt || animal.name;
      thumb.loading = 'lazy';

      const info = document.createElement('div');
      info.className = 'animal-card-info';

      const name = document.createElement('h3');
      name.className = 'animal-card-name';
      name.textContent = animal.commonNamePt || animal.name;

      const scientific = document.createElement('p');
      scientific.className = 'animal-card-scientific';
      scientific.textContent = animal.scientificName || '';

      const tags = document.createElement('div');
      tags.className = 'animal-tags';

      const taxonTag = document.createElement('span');
      taxonTag.className = 'animal-tag';
      taxonTag.textContent = animal.taxonomy?.class || 'Fauna';
      tags.appendChild(taxonTag);

      if (animal.measurements?.sizeCategory) {
        const sizeTag = document.createElement('span');
        sizeTag.className = 'animal-tag';
        sizeTag.textContent = `Porte ${animal.measurements.sizeCategory}`;
        tags.appendChild(sizeTag);
      }

      info.appendChild(name);
      info.appendChild(scientific);
      info.appendChild(tags);

      card.appendChild(thumb);
      card.appendChild(info);

      card.addEventListener('click', () => {
        openAnimalModal(animal);
      });

      dom.speciesGallery.appendChild(card);
    });
  }

  // Renderiza badges dos filtros ativos no topo do drawer com termos amigáveis
  function renderActiveFilterTags() {
    dom.activeFiltersBar.innerHTML = '';
    const labelMap = {
      group: 'Grupo',
      subgroup: 'Subgrupo',
      legs: 'Patas',
      hasWings: 'Asas',
      hasStinger: 'Ferrão',
      body: 'Corpo',
      hasFur: 'Pelos',
      water: 'Ambiente',
      color: 'Cor',
      size: 'Porte',
      country: 'País'
    };

    for (const [key, val] of Object.entries(state.answers)) {
      if (val && val !== 'naosei') {
        const tag = document.createElement('span');
        tag.className = 'filter-tag';
        const label = labelMap[key] || key;
        tag.textContent = `${label}: ${val}`;
        dom.activeFiltersBar.appendChild(tag);
      }
    }
  }

  // Abre Modal de Detalhes com dados completos
  async function openAnimalModal(animal) {
    // 1. Preenchimento inicial imediato
    dom.modalAnimalImg.src = animal.image || '';
    dom.modalAnimalImg.alt = animal.commonNamePt || animal.name;

    dom.modalTaxonClass.textContent = animal.taxonomy?.class || 'Classe Indefinida';
    dom.modalDiet.textContent = animal.diet ? `Dieta: ${animal.diet}` : 'Dieta: Diversificada';

    dom.modalCommonName.textContent = animal.commonNamePt || animal.name;
    dom.modalScientificName.textContent = animal.scientificName || 'Nome científico não catalogado';

    const countries = (animal.countriesPt || animal.countries || []).join(', ') || 'América do Sul / Global';
    dom.modalCountries.textContent = countries;

    dom.modalHabitat.textContent = animal.habitat || 'Florestas tropicais, matas e cerrados';

    const sizeCat = animal.measurements?.sizeCategory ? `Porte ${animal.measurements.sizeCategory}` : (animal.weightLbs ? `${animal.weightLbs} lbs (~${(animal.weightLbs * 0.453).toFixed(1)} kg)` : 'Porte típico da espécie');
    dom.modalSize.textContent = sizeCat;

    const colors = (animal.colorsPt || animal.colors || []).join(', ') || 'Variadas';
    dom.modalColors.textContent = colors;

    dom.modalDescription.textContent = animal.summary || animal.description || 'Carregando detalhes completos da espécie...';

    dom.animalModal.classList.remove('hidden');
    dom.animalModal.setAttribute('aria-hidden', 'false');

    // 2. Busca perfil detalhado na API para obter resumo completo e biomas
    if (animal.slug) {
      try {
        const res = await fetch(`/api/animals/${animal.slug}`);
        if (res.ok) {
          const detail = await res.json();
          if (detail.image) dom.modalAnimalImg.src = detail.image;
          if (detail.summary) dom.modalDescription.textContent = detail.summary;
          if (Array.isArray(detail.biomes) && detail.biomes.length > 0) {
            dom.modalHabitat.textContent = detail.biomes.join(', ');
          }
          if (Array.isArray(detail.countries) && detail.countries.length > 0) {
            dom.modalCountries.textContent = detail.countries.slice(0, 10).join(', ');
          }
        }
      } catch (err) {
        console.warn('Erro ao carregar detalhes estendidos:', err);
      }
    }
  }

  function closeModal() {
    dom.animalModal.classList.add('hidden');
    dom.animalModal.setAttribute('aria-hidden', 'true');
  }

  function openDrawer() {
    dom.resultsDrawer.classList.add('open');
    dom.resultsDrawer.setAttribute('aria-hidden', 'false');
  }

  function closeDrawer() {
    dom.resultsDrawer.classList.remove('open');
    dom.resultsDrawer.setAttribute('aria-hidden', 'true');
  }
});
