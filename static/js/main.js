// Variável global para armazenar os resultados da última busca
let vagasGlobais = [];

function alternarModalFiltros(abrir) {
    const modal = document.getElementById('modal-filtros');
    if (abrir) {
        modal.classList.remove('hidden');
    } else {
        modal.classList.add('hidden');
    }
}

function aplicarFiltrosEBuscar() {
    alternarModalFiltros(false);
    realizarBusca();
}

// Função principal de Busca
async function realizarBusca() {

    document.getElementById('btn-limpar-filtros').classList.remove('hidden');

    const cargo = document.getElementById('cargo').value;
    const local = document.getElementById('local').value;
    const tipoContrato = document.getElementById('tipo-contrato').value;
    const empresa = document.getElementById('empresa').value;
    const modelo = document.getElementById('modelo').value;
    const dataPost = document.getElementById('data-post').value;

    const container = document.getElementById('resultados');
    const painelDetalhes = document.getElementById('vaga-detalhes');



    container.innerHTML = '<p class="text-center text-gray-500 animate-pulse">Buscando vagas nas plataformas...</p>';

    const temFiltroAvancado = empresa.trim() !== '' || tipoContrato !== '' || modelo !== '' || dataPost !== 'all';

    if (temFiltroAvancado) {
        document.getElementById('btn-limpar-filtros').classList.remove('hidden');
    } else {
        document.getElementById('btn-limpar-filtros').classList.add('hidden');
    }

    // Reseta o painel da direita para o estado vazio inicial
    document.getElementById('detalhes-vazio').classList.remove('hidden');
    document.getElementById('detalhes-conteudo').classList.add('hidden');

    try {
        let url = `/buscar?q=${encodeURIComponent(cargo)}&local=${encodeURIComponent(local)}`;

        if (tipoContrato) url += `&employment_types=${tipoContrato}`;
        if (empresa.trim()) url += `&empresa=${encodeURIComponent(empresa)}`;
        if (modelo) url += `&modelo=${modelo}`;
        if (dataPost !== 'all') url += `&data_post=${dataPost}`;

        const response = await fetch(url);
        const vagas = await response.json();

        container.innerHTML = '';

        if (vagas.length === 0 || vagas.erro) {
            container.innerHTML = '<p class="text-center text-red-500 font-medium">Nenhuma vaga encontrada para os filtros aplicados.</p>';
            return;
        }
        // Organiza da mais recente (hoje) para a mais antiga
        vagas.sort((a, b) => {
            const dataA = new Date(a.job_posted_at_datetime_utc || 0);
            const dataB = new Date(b.job_posted_at_datetime_utc || 0);
            return dataB - dataA;
        });
        // Salva as vagas na variável global para podermos acessá-las no clique posterior
        vagasGlobais = vagas;

        // Renderiza os mini cards resumidos na esquerda
        vagas.forEach((vaga, index) => {
            const card = document.createElement('div');
            card.className = "medium-blue p-5 rounded-xl shadow-sm flex justify-between items-start hover:border-blue-400 cursor-pointer transition active:scale-[0.99]";

            // SOLUÇÃO: Vinculamos o evento de clique de forma nativa na memória do JS
            card.onclick = function () {
                exibirDetalhesVaga(index);
            };

            card.innerHTML = `
                <div class="flex-1 pr-4">
                    <h2 class="text-lg font-bold text-gray-900 leading-tight">${vaga.job_title}</h2>
                    <p class="text-black font-medium text-sm mt-1">${vaga.employer_name}</p>
                    <p class="text-black text-xs mt-2 line-clamp-2">${vaga.job_description || 'Sem descrição.'}</p>
                </div>
                <div class="flex flex-col items-end gap-1 shrink-0 text-right">
                    <span class="text-[10px] font-semibold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-md">${vaga.job_publisher || 'Web'}</span>
                    <span class="text-[10px] text-gray-700 bg-white px-2 py-0.5 rounded-md">${vaga.job_city || local || 'Brasil'}</span>
                    <span class="text-[10px] text-gray-700 bg-white px-2 py-0.5 rounded-md">${vaga.job_employment_type || 'Integral'}
                </div>
            `;
            container.appendChild(card);
        });

    } catch (error) {
        container.innerHTML = '<p class="text-center text-red-500 font-medium">Erro crítico no servidor backend.</p>';
    }
}

// NOVA FUNÇÃO: Disparada ao clicar em qualquer card da esquerda
function exibirDetalhesVaga(index) {
    const vaga = vagasGlobais[index];

    const divVazio = document.getElementById('detalhes-vazio');
    const divConteudo = document.getElementById('detalhes-conteudo');

    // Esconde o aviso de "vazio" e exibe o container de conteúdo
    divVazio.classList.add('hidden');
    divConteudo.classList.remove('hidden');

    // Força o container do painel a alinhar o conteúdo no topo (removendo o justify-center do estado vazio)
    document.getElementById('vaga-detalhes').classList.remove('justify-center');

    // Monta o template da direita exatamente igual ao mockup do seu Figma
    divConteudo.innerHTML = `
        <div class="flex items-center gap-4 mb-4">
            <div class="w-12 h-12 bg-white rounded-full flex items-center justify-center font-bold text-xl text-blue-600 shadow-sm">
                ${vaga.employer_name ? vaga.employer_name.charAt(0).toUpperCase() : 'V'}
            </div>
            <div>
                <h2 class="text-xl font-bold leading-tight">${vaga.employer_name}</h2>
                <p class="text-gray-500 text-xs">${vaga.job_posted_at_datetime_utc ? new Date(vaga.job_posted_at_datetime_utc).toLocaleDateString('pt-BR') : 'Publicada recentemente'}</p>
            </div>
        </div>

        <div class="flex flex-wrap gap-2 mb-4">
            <span class="text-xs font-medium bg-blue-200 text-blue-900 px-3 py-1 rounded-full">📍 ${vaga.job_city || 'Brasil'}</span>
            <span class="text-xs font-medium bg-blue-200 text-blue-900 px-3 py-1 rounded-full">💼 ${vaga.job_employment_type || 'Não especificado'}</span>
            <span class="text-xs font-medium bg-blue-200 text-blue-900 px-3 py-1 rounded-full">🌐 Originário: ${vaga.job_publisher}</span>
        </div>

        <h3 class="text-lg font-extrabold mb-2 text-gray-900">${vaga.job_title}</h3>

        <div class="flex-1 overflow-y-auto max-h-[350px] pr-2 text-sm text-gray-800 space-y-3 scrollbar-thin">
            <p class="font-semibold text-gray-900">Descrição e Requisitos:</p>
            <p class="whitespace-pre-line leading-relaxed">${vaga.job_description || 'Nenhuma descrição detalhada fornecida.'}</p>
        </div>

        <div class="mt-6 pt-4 border-t border-blue-200">
            <a href="${vaga.job_apply_link}" target="_blank" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl shadow transition active:scale-95 flex items-center justify-center gap-2">
                Candidatar-se na Fonte Original →
            </a>
        </div>
    `;
}

function limparFiltros() {
    // 1. Zera APENAS as configurações de dentro do modal avançado
    document.getElementById('empresa').value = '';
    document.getElementById('tipo-contrato').value = '';
    document.getElementById('modelo').value = '';
    document.getElementById('data-post').value = 'all';
    
    // 2. Esconde o botão vermelho de limpar imediatamente
    document.getElementById('btn-limpar-filtros').classList.add('hidden');
    
    // 3. Dispara a busca novamente! Como limpamos os campos acima, ela será 
    // uma busca genérica baseada apenas no Cargo e Local atuais, trazendo tudo ordenado.
    realizarBusca();
}