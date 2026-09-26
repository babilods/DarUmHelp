document.addEventListener("DOMContentLoaded", () => {
    // Normaliza texto para busca: minúsculas e sem acentos (ex: "matematica" acha "Matemática")
    function normalizarTexto(texto) {
        return (texto || "")
            .normalize("NFD")
            .replace(/[̀-ͯ]/g, "")
            .toLowerCase();
    }

    // 1. DADOS DOS PROFESSORES
    let teachersData = [];

    // Opções de preferências/pagamento do aluno (espelham as choices do backend)
    const NIVEL_ACADEMICO_OPCOES = [
        { value: "fundamental", label: "Ensino Fundamental" },
        { value: "medio", label: "Ensino Médio" },
        { value: "graduacao", label: "Graduação" },
        { value: "pos_graduacao", label: "Pós-graduação" },
        { value: "outro", label: "Outro" },
    ];
    const OBJETIVO_OPCOES = [
        { value: "reforco_escolar", label: "Reforço escolar" },
        { value: "vestibular_enem", label: "Vestibular / ENEM" },
        { value: "concurso_publico", label: "Concurso público" },
        { value: "idioma", label: "Aprender um idioma" },
        { value: "curso_superior", label: "Apoio em disciplina da faculdade" },
        { value: "desenvolvimento_profissional", label: "Desenvolvimento profissional" },
        { value: "hobby_interesse_pessoal", label: "Hobby / interesse pessoal" },
        { value: "outro", label: "Outro" },
    ];
    const BANDEIRA_OPCOES = [
        { value: "visa", label: "Visa" },
        { value: "mastercard", label: "Mastercard" },
        { value: "elo", label: "Elo" },
        { value: "amex", label: "American Express" },
        { value: "outro", label: "Outro" },
    ];

    // 2. DADOS DE MATÉRIAS (7 categorias)
    const CATEGORIA_LABEL = {
        exatas: "Exatas e Ciências da Natureza",
        humanas: "Linguagens e Humanas",
        concursos: "Concursos Públicos",
        idiomas: "Idiomas",
        tech: "Tecnologia e Programação",
        dadosti: "Ciência de Dados e TI Avançada",
        habilidades: "Habilidades Profissionais e Outros",
    };

    const subjectsData = [
        // --- Exatas e Ciências da Natureza ---
        { id: 1, name: "Matemática", detalhe: "Básica, Álgebra, Geometria, Trigonometria", category: "exatas", icon: "ruler", bg: "bg-blue-50 text-blue-600" },
        { id: 2, name: "Física", detalhe: "Mecânica, Termologia, Óptica, Eletromagnetismo", category: "exatas", icon: "zap", bg: "bg-blue-50 text-blue-600" },
        { id: 3, name: "Química", detalhe: "Geral, Físico-Química, Orgânica", category: "exatas", icon: "flask-conical", bg: "bg-blue-50 text-blue-600" },
        { id: 4, name: "Biologia", detalhe: "Citologia, Genética, Ecologia, Zoologia, Botânica", category: "exatas", icon: "dna", bg: "bg-blue-50 text-blue-600" },
        { id: 5, name: "Ciências Naturais", detalhe: "Ensino Fundamental", category: "exatas", icon: "leaf", bg: "bg-blue-50 text-blue-600" },

        // --- Linguagens e Humanas ---
        { id: 6, name: "Língua Portuguesa", category: "humanas", icon: "book-text", bg: "bg-rose-50 text-rose-600" },
        { id: 7, name: "Redação", category: "humanas", icon: "pen-line", bg: "bg-rose-50 text-rose-600" },
        { id: 8, name: "Literatura", category: "humanas", icon: "book-open", bg: "bg-rose-50 text-rose-600" },
        { id: 9, name: "História", category: "humanas", icon: "scroll-text", bg: "bg-rose-50 text-rose-600" },
        { id: 10, name: "Geografia", category: "humanas", icon: "globe", bg: "bg-rose-50 text-rose-600" },
        { id: 11, name: "Filosofia", category: "humanas", icon: "brain", bg: "bg-rose-50 text-rose-600" },
        { id: 12, name: "Sociologia", category: "humanas", icon: "users", bg: "bg-rose-50 text-rose-600" },

        // --- Concursos Públicos ---
        { id: 13, name: "Direito", detalhe: "Constitucional, Administrativo, Processual Penal, Civil e Processual Civil, Tributário", category: "concursos", icon: "scale", bg: "bg-amber-50 text-amber-700" },
        { id: 14, name: "Português para Concursos", category: "concursos", icon: "book-text", bg: "bg-amber-50 text-amber-700" },
        { id: 15, name: "Raciocínio Lógico-Matemático (RLM)", category: "concursos", icon: "calculator", bg: "bg-amber-50 text-amber-700" },
        { id: 16, name: "Informática Básica e Avançada", category: "concursos", icon: "monitor", bg: "bg-amber-50 text-amber-700" },
        { id: 17, name: "Atualidades e Conhecimentos Gerais", category: "concursos", icon: "newspaper", bg: "bg-amber-50 text-amber-700" },
        { id: 18, name: "Administração Pública", category: "concursos", icon: "building-2", bg: "bg-amber-50 text-amber-700" },
        { id: 19, name: "AFO (Administração Financeira e Orçamentária)", category: "concursos", icon: "wallet", bg: "bg-amber-50 text-amber-700" },
        { id: 20, name: "Contabilidade Geral e Pública", category: "concursos", icon: "calculator", bg: "bg-amber-50 text-amber-700" },
        { id: 21, name: "Arquivologia", category: "concursos", icon: "archive", bg: "bg-amber-50 text-amber-700" },

        // --- Idiomas ---
        { id: 22, name: "Inglês", detalhe: "Geral, Conversação, Business, Viagem", category: "idiomas", icon: "languages", bg: "bg-indigo-50 text-indigo-600" },
        { id: 23, name: "Inglês Instrumental", detalhe: "Para provas, mestrado e concursos", category: "idiomas", icon: "file-text", bg: "bg-indigo-50 text-indigo-600" },
        { id: 24, name: "Preparatório para Exames de Proficiência", detalhe: "TOEFL, IELTS, Cambridge", category: "idiomas", icon: "award", bg: "bg-indigo-50 text-indigo-600" },
        { id: 25, name: "Espanhol", detalhe: "Geral e DELE", category: "idiomas", icon: "languages", bg: "bg-indigo-50 text-indigo-600" },
        { id: 26, name: "Francês", detalhe: "Geral e DELF/DALF", category: "idiomas", icon: "languages", bg: "bg-indigo-50 text-indigo-600" },
        { id: 27, name: "Alemão", category: "idiomas", icon: "languages", bg: "bg-indigo-50 text-indigo-600" },
        { id: 28, name: "Italiano", category: "idiomas", icon: "languages", bg: "bg-indigo-50 text-indigo-600" },
        { id: 29, name: "Mandarim / Chinês", category: "idiomas", icon: "languages", bg: "bg-indigo-50 text-indigo-600" },
        { id: 30, name: "Japonês", category: "idiomas", icon: "languages", bg: "bg-indigo-50 text-indigo-600" },
        { id: 31, name: "Coreano", category: "idiomas", icon: "languages", bg: "bg-indigo-50 text-indigo-600" },
        { id: 32, name: "Libras", detalhe: "Língua Brasileira de Sinais", category: "idiomas", icon: "hand", bg: "bg-indigo-50 text-indigo-600" },

        // --- Tecnologia e Programação ---
        { id: 33, name: "Lógica de Programação", category: "tech", icon: "code", bg: "bg-purple-50 text-purple-600" },
        { id: 34, name: "Desenvolvimento Web", detalhe: "HTML, CSS, JavaScript, React, Vue, Angular", category: "tech", icon: "code-2", bg: "bg-purple-50 text-purple-600" },
        { id: 35, name: "Backend", detalhe: "Node.js, Python, Java, C#, PHP, Ruby", category: "tech", icon: "server", bg: "bg-purple-50 text-purple-600" },
        { id: 36, name: "Desenvolvimento Mobile", detalhe: "Flutter, React Native, Swift/iOS, Kotlin/Android", category: "tech", icon: "smartphone", bg: "bg-purple-50 text-purple-600" },
        { id: 37, name: "Banco de Dados", detalhe: "SQL, MySQL, PostgreSQL, MongoDB", category: "tech", icon: "database", bg: "bg-purple-50 text-purple-600" },
        { id: 38, name: "Design UX/UI", category: "tech", icon: "palette", bg: "bg-purple-50 text-purple-600" },

        // --- Ciência de Dados e TI Avançada ---
        { id: 39, name: "Ciência de Dados e Análise de Dados", category: "dadosti", icon: "bar-chart-3", bg: "bg-cyan-50 text-cyan-700" },
        { id: 40, name: "Power BI, Tableau e Metabase", category: "dadosti", icon: "pie-chart", bg: "bg-cyan-50 text-cyan-700" },
        { id: 41, name: "Inteligência Artificial, Machine Learning e Engenharia de Prompt", category: "dadosti", icon: "brain-circuit", bg: "bg-cyan-50 text-cyan-700" },
        { id: 42, name: "Cibersegurança e Ethical Hacking", category: "dadosti", icon: "shield-check", bg: "bg-cyan-50 text-cyan-700" },
        { id: 43, name: "DevOps e Cloud Computing", detalhe: "AWS, Azure, Google Cloud", category: "dadosti", icon: "cloud", bg: "bg-cyan-50 text-cyan-700" },

        // --- Habilidades Profissionais e Outros ---
        { id: 44, name: "Finanças Pessoais e Investimentos", category: "habilidades", icon: "piggy-bank", bg: "bg-emerald-50 text-emerald-600" },
        { id: 45, name: "Marketing Digital e Vendas", category: "habilidades", icon: "megaphone", bg: "bg-emerald-50 text-emerald-600" },
        { id: 46, name: "Música (Instrumentos, Canto, Teoria Musical)", category: "habilidades", icon: "music", bg: "bg-emerald-50 text-emerald-600" },
        { id: 47, name: "Metodologia Científica e Orientação de TCC", category: "habilidades", icon: "microscope", bg: "bg-emerald-50 text-emerald-600" },
    ];

    // 3. CONTEÚDOS BUROCRÁTICOS E POLÍTICAS
    const policyContents = {
        privacy: {
            title: '<i data-lucide="lock" class="w-5 h-5 inline-block align-[-3px] mr-1"></i> Política de Privacidade',
            content: `
                <p>A sua privacidade é de extrema importância para o <strong>DarUmHelp</strong>. Esta Política de Privacidade descreve como coletamos, usamos, armazenamos e protegemos suas informações pessoais ao utilizar nossa plataforma de aulas particulares.</p>
                
                <h4 class="font-bold text-slate-900 text-sm mt-3">1. Coleta de Informações</h4>
                <p>Coletamos informações necessárias para a prestação dos serviços, tais como: nome, e-mail, perfil de acesso (aluno ou professor), histórico de agendamentos e registros de transações de pagamento via PIX.</p>

                <h4 class="font-bold text-slate-900 text-sm mt-3">2. Uso das Informações</h4>
                <p>Os dados coletados são utilizados exclusivamente para:</p>
                <ul class="list-disc pl-5 space-y-1 my-2">
                    <li>Conectar alunos e professores parceiros;</li>
                    <li>Processar o agendamento de aulas e pagamentos;</li>
                    <li>Oferecer suporte técnico e viabilizar a comunicação via chat interno;</li>
                    <li>Melhorar continuamente a experiência na plataforma.</li>
                </ul>

                <h4 class="font-bold text-slate-900 text-sm mt-3">3. Proteção e Segurança</h4>
                <p>Adotamos medidas técnicas de segurança rigorosas para proteger seus dados contra acessos não autorizados, alteração ou destruição. Não vendemos ou compartilhamos seus dados pessoais com terceiros para fins publicitários.</p>

                <h4 class="font-bold text-slate-900 text-sm mt-3">4. Seus Direitos</h4>
                <p>Você pode solicitar a alteração, exportação ou exclusão definitiva da sua conta e dados a qualquer momento entrando em contato com a nossa equipe de suporte.</p>
            `
        },
        terms: {
            title: '<i data-lucide="scroll-text" class="w-5 h-5 inline-block align-[-3px] mr-1"></i> Termos e Condições de Uso',
            content: `
                <p>Ao se cadastrar e utilizar a plataforma <strong>DarUmHelp</strong>, você concorda expressamente com os Termos e Condições descritos abaixo:</p>

                <h4 class="font-bold text-slate-900 text-sm mt-3">1. Papel da Plataforma</h4>
                <p>O DarUmHelp atua como uma ponte de intermediação tecnológica entre alunos que buscam apoio acadêmico e professores autônomos credenciados.</p>

                <h4 class="font-bold text-slate-900 text-sm mt-3">2. Conduta de Alunos e Professores</h4>
                <p>Todos os usuários comprometem-se a manter um ambiente profissional, respeitoso e cordial no chat e durante as sessões de aula. É estritamente proibido o uso de linguagem ofensiva, assédio ou qualquer conduta inadequada.</p>

                <h4 class="font-bold text-slate-900 text-sm mt-3">3. Pagamentos e Taxas</h4>
                <p>Os pagamentos são efetuados diretamente na plataforma por meio do sistema PIX seguro. O agendamento só é confirmado e liberado no painel do professor mediante a aprovação do pagamento.</p>

                <h4 class="font-bold text-slate-900 text-sm mt-3">4. Propriedade Intelectual</h4>
                <p>Todo o conteúdo, marcas e layout do DarUmHelp são de propriedade exclusiva da plataforma. Materiais didáticos compartilhados pelos professores no chat pertencem aos seus respectivos autores.</p>
            `
        },
        refund: {
            title: '<i data-lucide="banknote" class="w-5 h-5 inline-block align-[-3px] mr-1"></i> Política de Cancelamento e Reembolso',
            content: `
                <p>Entendemos que imprevistos acontecem. Nossa política de cancelamento busca equilibrar o compromisso entre alunos e a agenda dos professores.</p>

                <h4 class="font-bold text-slate-900 text-sm mt-3">1. Cancelamento pelo Aluno</h4>
                <ul class="list-disc pl-5 space-y-1 my-2">
                    <li><strong>Até 24h antes da aula:</strong> Reembolso integral (100%) do valor pago.</li>
                    <li><strong>Com menos de 24h de antecedência:</strong> Reembolso de 50% do valor para ressarcimento da agenda reservada do professor.</li>
                    <li><strong>Não comparecimento (No-show):</strong> Não haverá reembolso.</li>
                </ul>

                <h4 class="font-bold text-slate-900 text-sm mt-3">2. Cancelamento pelo Professor</h4>
                <p>Caso o professor precise cancelar a aula, o aluno receberá reembolso de 100% do valor investido ou a opção de reagendar a aula sem custos adicionais.</p>

                <h4 class="font-bold text-slate-900 text-sm mt-3">3. Processamento do Reembolso</h4>
                <p>Os reembolsos aprovados são efetuados via PIX na mesma conta de origem do pagamento em até 2 dias úteis.</p>
            `
        },
        help: {
            title: '<i data-lucide="circle-help" class="w-5 h-5 inline-block align-[-3px] mr-1"></i> Central de Ajuda & Suporte',
            content: `
                <p>Precisa de ajuda com seu agendamento, pagamento ou tem alguma dúvida técnica?</p>

                <div class="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 my-4 space-y-2">
                    <h4 class="font-bold text-indigo-950 text-sm">Canais Atendimentos Rápidos:</h4>
                    <p class="flex items-center gap-1.5"><i data-lucide="mail" class="w-3.5 h-3.5 text-indigo-600"></i> <strong>E-mail de Suporte:</strong> suporte@darumhelp.com.br</p>
                    <p class="flex items-center gap-1.5"><i data-lucide="message-circle" class="w-3.5 h-3.5 text-indigo-600"></i> <strong>WhatsApp Atendimento:</strong> (11) 99999-8888</p>
                    <p class="flex items-center gap-1.5"><i data-lucide="clock" class="w-3.5 h-3.5 text-indigo-600"></i> <strong>Horário de Funcionamento:</strong> Segunda a Sexta, das 08h às 20h.</p>
                </div>

                <h4 class="font-bold text-slate-900 text-sm mt-3">Perguntas Frequentes (FAQ)</h4>
                <p><strong>Como funciona a aula?</strong> As aulas ocorrem online através do link gerado no chat ou combinado entre professor e aluno no agendamento.</p>
                <p><strong>E se eu tiver problemas de conexão?</strong> Caso ocorra algum problema técnico comprovado durante a aula, entre em contato imediatamente com o suporte.</p>
            `
        }
    };

    // ELEMENTOS DOM
    const teachersGrid = document.getElementById("teachersGrid");
    const subjectsGrid = document.getElementById("subjectsGrid");
    const yearSpan = document.getElementById("year");
    const menuBtns = document.querySelectorAll(".menu-btn");
    const views = document.querySelectorAll(".view");

    // Elementos de Pesquisa
    const heroQuery = document.getElementById("heroQuery");
    const heroSearchBtn = document.getElementById("heroSearchBtn");
    const subjectSearchInput = document.getElementById("subjectSearchInput");
    const categoryBtns = document.querySelectorAll(".filter-btn");
    const subjectChips = document.querySelectorAll("#subjectChips button");

    // Elementos do Menu de 3 Pontos e Políticas
    const btnMoreOptions = document.getElementById("btnMoreOptions");
    const moreOptionsMenu = document.getElementById("moreOptionsMenu");
    const policyBtns = document.querySelectorAll(".menu-btn-policy");
    const policyTitle = document.getElementById("policyTitle");
    const policyBody = document.getElementById("policyBody");

    // Elementos de Sessão e Modais
    const btnLogin = document.getElementById("btnLogin");
    const btnRegister = document.getElementById("btnRegister");
    const btnLogout = document.getElementById("btnLogout");
    const welcomeLabel = document.getElementById("welcomeLabel");
    const modal = document.getElementById("modal");
    const modalClose = document.getElementById("modalClose");
    const modalContent = document.getElementById("modalContent");

    // Elementos da Sala de Videochamada (WebRTC)
    const videoCallModal = document.getElementById("videoCallModal");
    const videoCallStatus = document.getElementById("videoCallStatus");
    const localVideo = document.getElementById("localVideo");
    const remoteVideo = document.getElementById("remoteVideo");
    const localVideoLabel = document.getElementById("localVideoLabel");
    const remoteVideoLabel = document.getElementById("remoteVideoLabel");
    const remoteVideoWaiting = document.getElementById("remoteVideoWaiting");
    const videoToggleCamBtn = document.getElementById("videoToggleCamBtn");
    const videoToggleMicBtn = document.getElementById("videoToggleMicBtn");
    const videoLeaveBtn = document.getElementById("videoLeaveBtn");
    const videoCallCloseBtn = document.getElementById("videoCallCloseBtn");

    let currentUser = JSON.parse(localStorage.getItem("darumhelp_user")) || null;
    let bookingsList = [];
    let meuPerfilProfessor = null;
    let meuPerfilAluno = null;
    let minhasDisciplinas = [];
    let minhasDisponibilidades = [];
    let meusFavoritos = [];
    let meusCartoes = [];
    let minhaCarteira = null;
    let minhasEstatisticas = null;
    let minhasAvaliacoesRecebidas = [];
    let ultimoFiltroProfessores = null;
    let selectedCategory = "all";

    // Estado do chat em tempo real (WebSocket)
    let chatSocket = null;

    // Estado da chamada de vídeo (WebRTC)
    let videoSocket = null;
    let peerConnection = null;
    let localStream = null;
    let meuPapelVideo = null; // "aluno" ou "professor"

    function wsUrl(path) {
        const protocolo = location.protocol === "https:" ? "wss:" : "ws:";
        return `${protocolo}//${location.host}${path}`;
    }

    // Helpers de integração com a API Django (sessão via cookie + CSRF)
    function getCookie(name) {
        const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
        return match ? decodeURIComponent(match[2]) : null;
    }

    async function apiFetch(url, options = {}) {
        const method = (options.method || "GET").toUpperCase();
        const headers = { ...(options.headers || {}) };
        const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;

        if (method !== "GET" && method !== "HEAD") {
            headers["X-CSRFToken"] = getCookie("csrftoken");
            // FormData (upload de arquivo) não pode ter Content-Type manual: o
            // navegador precisa definir o boundary do multipart sozinho.
            if (options.body && !headers["Content-Type"] && !isFormData) {
                headers["Content-Type"] = "application/json";
            }
        }

        return fetch(url, { ...options, headers, credentials: "include" });
    }

    // Recria os ícones Lucide após qualquer innerHTML dinâmico (o Lucide só
    // substitui <i data-lucide="..."> pelos <svg> que já estão no DOM no
    // momento em que é chamado).
    function refreshIcons() {
        if (window.lucide && typeof window.lucide.createIcons === "function") {
            window.lucide.createIcons();
        }
    }

    // 3.1 TOASTS (substituem alert() nativo) e MODAL DE CONFIRMAÇÃO (substituem confirm()/prompt())
    const toastContainer = document.getElementById("toastContainer");

    function showToast(message, type = "info") {
        if (!toastContainer) {
            window.alert(message);
            return;
        }
        const icone = type === "success" ? "check-circle-2" : type === "error" ? "circle-x" : "info";
        const el = document.createElement("div");
        el.className = `toast${type === "success" ? " toast-success" : type === "error" ? " toast-error" : ""}`;
        el.innerHTML = `<i data-lucide="${icone}" class="w-4 h-4 flex-shrink-0 mt-0.5"></i><span>${message}</span>`;
        toastContainer.appendChild(el);
        refreshIcons();
        setTimeout(() => {
            el.classList.add("toast-leaving");
            setTimeout(() => el.remove(), 200);
        }, 4200);
    }

    // Modal genérico de confirmação/escolha. Sem `options`, funciona como um
    // confirm() (resolve true/false). Com `options`, vira um seletor de
    // motivo (resolve o value escolhido, ou null se cancelado).
    function showConfirmModal({ title, message = "", confirmLabel = "Confirmar", cancelLabel = "Cancelar", variant = "default", options = null }) {
        return new Promise((resolve) => {
            const modalEl = document.getElementById("confirmModal");
            const titleEl = document.getElementById("confirmModalTitle");
            const messageEl = document.getElementById("confirmModalMessage");
            const optionsEl = document.getElementById("confirmModalOptions");
            const iconWrap = document.getElementById("confirmModalIconWrap");
            const confirmBtn = document.getElementById("confirmModalConfirmBtn");
            const cancelBtn = document.getElementById("confirmModalCancelBtn");

            if (!modalEl) { resolve(window.confirm(message || title)); return; }

            titleEl.textContent = title;
            messageEl.textContent = message;
            messageEl.style.whiteSpace = "pre-line";
            messageEl.classList.toggle("hidden", !message);
            confirmBtn.textContent = confirmLabel;
            cancelBtn.textContent = cancelLabel;

            const perigoso = variant === "danger";
            confirmBtn.className = perigoso
                ? "flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl transition"
                : "flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition";
            iconWrap.className = perigoso
                ? "w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0"
                : "w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0";
            iconWrap.innerHTML = `<i data-lucide="${perigoso ? "triangle-alert" : "circle-help"}" class="w-5 h-5"></i>`;

            let selecionado = options && options.length ? options[0].value : null;
            if (options && options.length) {
                optionsEl.innerHTML = options.map((op, i) => `
                    <label class="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs font-semibold text-slate-700">
                        <input type="radio" name="confirmModalOption" value="${op.value}" ${i === 0 ? "checked" : ""} class="accent-indigo-600">
                        ${op.label}
                    </label>
                `).join("");
                optionsEl.classList.remove("hidden");
                optionsEl.querySelectorAll('input[name="confirmModalOption"]').forEach(input => {
                    input.addEventListener("change", () => { selecionado = input.value; });
                });
            } else {
                optionsEl.classList.add("hidden");
                optionsEl.innerHTML = "";
            }

            refreshIcons();

            function cleanup(result) {
                modalEl.classList.add("hidden");
                confirmBtn.removeEventListener("click", onConfirm);
                cancelBtn.removeEventListener("click", onCancel);
                resolve(result);
            }
            function onConfirm() { cleanup(options ? selecionado : true); }
            function onCancel() { cleanup(options ? null : false); }

            confirmBtn.addEventListener("click", onConfirm);
            cancelBtn.addEventListener("click", onCancel);
            modalEl.classList.remove("hidden");
        });
    }

    // Substituto direto de window.confirm(). variant "danger" deixa o botão vermelho.
    function showConfirm(message, { title = "Confirmar ação", variant = "default" } = {}) {
        return showConfirmModal({ title, message, variant });
    }

    // Substituto do prompt() de escolha (usado na denúncia de mensagem).
    function showChoice(title, options) {
        return showConfirmModal({ title, options, confirmLabel: "Enviar" });
    }

    // Busca os professores no Django
    async function carregarProfessores() {
        try {
            const response = await apiFetch('/api/professores/');
            if (!response.ok) throw new Error('Erro ao buscar professores');
            const data = await response.json();

            // Formata os dados vindos do Django para a estrutura esperada pelo layout
            teachersData = data.map(prof => {
                const nomeCompleto = prof.usuario
                    ? `${prof.usuario.first_name} ${prof.usuario.last_name}`.trim() || prof.usuario.username
                    : 'Professor';

                return {
                    id: prof.id,
                    name: prof.nome || nomeCompleto,
                    subject: prof.materia || prof.disciplina || 'Matéria',
                    bio: prof.biografia || prof.bio || 'Sem biografia disponível.',
                    rating: prof.avaliacao || 5.0,
                    price: prof.preco_hora || prof.valor_hora || prof.preco || 0,
                    image: prof.foto || prof.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
                    ...prof
                };
            });

            if (typeof renderTeachers === 'function') {
                renderTeachers();
            }
        } catch (erro) {
            console.error('Erro ao carregar professores:', erro);
        }
    }

    // Busca as aulas do usuário logado no Django
    async function carregarAulas() {
        try {
            const response = await apiFetch('/api/aulas/');
            if (!response.ok) throw new Error('Erro ao buscar aulas');
            bookingsList = await response.json();

            if (typeof renderStudentDashboard === 'function') renderStudentDashboard();
            if (typeof renderMeusProfessoresView === 'function') renderMeusProfessoresView();
            if (typeof renderTeacherDashboard === 'function') renderTeacherDashboard();
            if (typeof renderMeusAlunosView === 'function') renderMeusAlunosView();
        } catch (erro) {
            console.error('Erro ao carregar aulas:', erro);
        }
    }

    // Cancela uma aula enviando ação POST para a API do Django (RN05)
    async function cancelarAulaAPI(aulaId) {
        try {
            const response = await apiFetch(`/api/aulas/${aulaId}/cancelar/`, { method: 'POST' });
            const data = await response.json();

            if (response.ok) {
                showToast(data.mensagem || 'Aula cancelada com sucesso!', 'success');
                await carregarAulas();
            } else {
                showToast(data.mensagem || 'Não foi possível cancelar a aula.', 'error');
            }
        } catch (erro) {
            console.error('Erro no cancelamento:', erro);
        }
    }

    // Professor marca que o aluno não compareceu à aula (sem direito a reembolso)
    async function marcarNoShowAPI(aulaId) {
        try {
            const response = await apiFetch(`/api/aulas/${aulaId}/no-show/`, { method: 'POST' });
            const data = await response.json();

            if (response.ok) {
                showToast(data.mensagem || 'Não comparecimento registrado.', 'success');
                await carregarAulas();
            } else {
                showToast(data.mensagem || 'Não foi possível registrar o não comparecimento.', 'error');
            }
        } catch (erro) {
            console.error('Erro ao marcar não comparecimento:', erro);
        }
    }

    // Professor marca a aula como efetivamente concluída (libera a avaliação para o aluno)
    async function marcarConcluidoAPI(aulaId) {
        try {
            const response = await apiFetch(`/api/aulas/${aulaId}/concluir/`, { method: 'POST' });
            const data = await response.json();

            if (response.ok) {
                showToast(data.mensagem || 'Aula marcada como concluída.', 'success');
                await carregarAulas();
            } else {
                showToast(data.mensagem || 'Não foi possível concluir a aula.', 'error');
            }
        } catch (erro) {
            console.error('Erro ao concluir aula:', erro);
        }
    }

    // Aluno avalia o professor de uma aula concluída
    async function enviarAvaliacaoAPI(aulaId, nota, comentario) {
        try {
            const resp = await apiFetch(`/api/aulas/${aulaId}/avaliacao/`, {
                method: 'POST',
                body: JSON.stringify({ nota, comentario }),
            });
            const data = await resp.json();

            if (!resp.ok) {
                showToast(data.non_field_errors?.[0] || data.detail || 'Não foi possível registrar sua avaliação.', 'error');
                return;
            }

            showToast('Avaliação enviada. Obrigado pelo feedback!', 'success');
            await carregarAulas();
        } catch (erro) {
            console.error('Erro ao enviar avaliação:', erro);
            showToast('Erro ao enviar avaliação. Tente novamente.', 'error');
        }
    }

    // Busca o perfil (dados + status de verificação de currículo) e a agenda
    // (disciplinas/disponibilidades) do professor logado
    async function carregarMeuPerfilProfessor() {
        if (!currentUser || currentUser.role !== 'teacher') {
            meuPerfilProfessor = null;
            minhasDisciplinas = [];
            minhasDisponibilidades = [];
            minhaCarteira = null;
            minhasEstatisticas = null;
            minhasAvaliacoesRecebidas = [];
            return;
        }
        try {
            const resp = await apiFetch('/api/professores/me/');
            meuPerfilProfessor = resp.ok ? await resp.json() : null;
        } catch (erro) {
            console.error('Erro ao carregar perfil do professor:', erro);
        }

        if (meuPerfilProfessor) {
            try {
                // /api/disciplinas/ e /api/disponibilidades/ listam de todos os
                // professores (endpoint genérico) — filtramos as que são minhas.
                const [respDisc, respDisp, respCarteira, respStats, respAvaliacoes] = await Promise.all([
                    apiFetch('/api/disciplinas/'),
                    apiFetch('/api/disponibilidades/'),
                    apiFetch('/api/professores/me/carteira/'),
                    apiFetch('/api/professores/me/estatisticas/'),
                    apiFetch(`/api/professores/${meuPerfilProfessor.id}/avaliacoes/`),
                ]);
                const todasDisciplinas = respDisc.ok ? await respDisc.json() : [];
                const todasDisponibilidades = respDisp.ok ? await respDisp.json() : [];
                minhasDisciplinas = todasDisciplinas.filter(d => d.professor === meuPerfilProfessor.id);
                minhasDisponibilidades = todasDisponibilidades.filter(d => d.professor === meuPerfilProfessor.id);
                minhaCarteira = respCarteira.ok ? await respCarteira.json() : null;
                minhasEstatisticas = respStats.ok ? await respStats.json() : null;
                minhasAvaliacoesRecebidas = respAvaliacoes.ok ? await respAvaliacoes.json() : [];
            } catch (erro) {
                console.error('Erro ao carregar disciplinas/disponibilidade/carteira:', erro);
            }
        }

        if (typeof renderTeacherDashboard === 'function') renderTeacherDashboard();
    }

    // Busca o perfil (dados pessoais + preferências) do aluno logado, além
    // dos favoritos e cartões salvos — tudo usado na Área do Aluno.
    async function carregarMeuPerfilAluno() {
        if (!currentUser || currentUser.role !== 'student') {
            meuPerfilAluno = null;
            meusFavoritos = [];
            meusCartoes = [];
            return;
        }
        try {
            const resp = await apiFetch('/api/contas/aluno/me/');
            meuPerfilAluno = resp.ok ? await resp.json() : null;

            const [respFavoritos, respCartoes] = await Promise.all([
                apiFetch('/api/contas/aluno/me/favoritos/'),
                apiFetch('/api/contas/aluno/me/cartoes/'),
            ]);
            meusFavoritos = respFavoritos.ok ? await respFavoritos.json() : [];
            meusCartoes = respCartoes.ok ? await respCartoes.json() : [];
        } catch (erro) {
            console.error('Erro ao carregar perfil do aluno:', erro);
        }

        if (typeof renderStudentDashboard === 'function') renderStudentDashboard();
        if (typeof renderMeusProfessoresView === 'function') renderMeusProfessoresView();
    }

    // ---- Aviso de mensagens novas no chat ----
    // O WebSocket do chat só fica aberto com a conversa aberta, então para avisar
    // de mensagens novas o front consulta /api/aulas/nao-lidas/ periodicamente.
    const INTERVALO_AVISO_MENSAGENS_MS = 15000;
    const TITULO_BASE = document.title;
    let naoLidasPorAula = {};
    let avisoMensagensTimer = null;

    function aplicarAvisosMensagens() {
        const total = Object.values(naoLidasPorAula).reduce((soma, n) => soma + n, 0);

        document.querySelectorAll(".badge-nao-lidas").forEach(badge => {
            badge.textContent = total > 9 ? "9+" : String(total);
            badge.classList.toggle("hidden", total === 0);
        });

        document.querySelectorAll(".btn-open-chat").forEach(btn => {
            const n = naoLidasPorAula[btn.getAttribute("data-booking-id")] || 0;
            let badge = btn.querySelector(".badge-chat-btn");
            if (!badge) {
                badge = document.createElement("span");
                badge.className = "badge-chat-btn hidden min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-[18px] text-center";
                btn.appendChild(badge);
            }
            badge.textContent = n > 9 ? "9+" : String(n);
            badge.classList.toggle("hidden", n === 0);
            badge.title = n === 1 ? "1 mensagem nova" : `${n} mensagens novas`;
        });

        document.title = total > 0 ? `(${total}) ${TITULO_BASE}` : TITULO_BASE;
    }

    async function verificarMensagensNaoLidas() {
        if (!currentUser || (currentUser.role !== "student" && currentUser.role !== "teacher")) {
            naoLidasPorAula = {};
            aplicarAvisosMensagens();
            return;
        }
        try {
            const resp = await apiFetch('/api/aulas/nao-lidas/');
            if (!resp.ok) return;
            const data = await resp.json();
            naoLidasPorAula = data.porAula || {};
            aplicarAvisosMensagens();
        } catch (erro) {
            console.error('Erro ao verificar mensagens novas:', erro);
        }
    }

    function iniciarAvisosMensagens() {
        clearInterval(avisoMensagensTimer);
        avisoMensagensTimer = null;
        verificarMensagensNaoLidas();
        if (currentUser) {
            avisoMensagensTimer = setInterval(verificarMensagensNaoLidas, INTERVALO_AVISO_MENSAGENS_MS);
        }
    }

    // ---- Troca de e-mail (aluno e professor) ----
    // O e-mail é também o login, então o backend exige a senha atual para trocar.
    function abrirModalAlterarEmail() {
        openModal(`
            <form id="formAlterarEmail" class="space-y-4">
                <div class="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <i data-lucide="mail" class="w-5 h-5 text-indigo-600"></i>
                    <h3 class="font-bold text-slate-900 text-sm">Alterar e-mail</h3>
                </div>
                <p class="text-xs text-slate-500">Seu e-mail também é o seu login. Depois de trocar, use o novo e-mail para entrar na plataforma.</p>
                <div>
                    <label class="block text-xs font-bold text-slate-600 mb-1">E-mail atual</label>
                    <input type="email" value="${escapeHtml(currentUser?.email || '')}" disabled class="w-full px-3 py-2 border border-slate-200 bg-slate-50 text-slate-400 rounded-xl text-sm">
                </div>
                <div>
                    <label class="block text-xs font-bold text-slate-600 mb-1">Novo e-mail</label>
                    <input type="email" id="inputNovoEmail" required class="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-indigo-500">
                </div>
                <div>
                    <label class="block text-xs font-bold text-slate-600 mb-1">Senha atual (para confirmar)</label>
                    <input type="password" id="inputSenhaConfirmaEmail" required autocomplete="current-password" class="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-indigo-500">
                </div>
                <button type="submit" class="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition">Salvar novo e-mail</button>
            </form>
        `);

        document.getElementById("formAlterarEmail").addEventListener("submit", async (e) => {
            e.preventDefault();
            const email = document.getElementById("inputNovoEmail").value.trim();
            const senha = document.getElementById("inputSenhaConfirmaEmail").value;
            try {
                const resp = await apiFetch('/api/contas/me/email/', {
                    method: 'POST',
                    body: JSON.stringify({ email, senha }),
                });
                const data = await resp.json();
                if (!resp.ok) {
                    const primeiroErro = Object.values(data).find(v => Array.isArray(v) && v.length);
                    showToast(primeiroErro?.[0] || data.detail || 'Não foi possível alterar o e-mail.', 'error');
                    return;
                }
                currentUser.email = data.email;
                localStorage.setItem("darumhelp_user", JSON.stringify(currentUser));
                if (modal) modal.classList.add("hidden");
                showToast('E-mail alterado! Use o novo e-mail no próximo login.', 'success');
                if (currentUser.role === 'teacher') await carregarMeuPerfilProfessor();
                if (currentUser.role === 'student') await carregarMeuPerfilAluno();
                if (typeof renderTeacherDashboard === 'function' && currentUser.role === 'teacher') renderTeacherDashboard();
            } catch (erro) {
                console.error('Erro ao alterar e-mail:', erro);
                showToast('Erro ao alterar o e-mail. Tente novamente.', 'error');
            }
        });
    }

    document.addEventListener("click", (e) => {
        if (e.target.closest(".btn-alterar-email")) abrirModalAlterarEmail();
    });

    // Professor exclui currículo, documento ou vídeo (ex.: enviou o arquivo errado).
    const EXCLUSAO_ARQUIVO = {
        curriculo: {
            url: '/api/professores/me/curriculo/',
            titulo: 'Excluir currículo',
            texto: 'Tem certeza? Sem currículo, seu perfil deixa de aparecer nas buscas dos alunos até você enviar outro e ele ser aprovado.',
            ok: 'Currículo excluído. Envie outro para voltar a aparecer nas buscas.',
        },
        documento: {
            url: '/api/professores/me/documento/',
            titulo: 'Excluir documento',
            texto: 'Tem certeza? O arquivo será apagado e você precisará enviar o documento novamente para ser verificado.',
            ok: 'Documento excluído.',
        },
        video: {
            url: '/api/professores/me/video/',
            titulo: 'Excluir vídeo',
            texto: 'Tem certeza que deseja remover seu vídeo de apresentação?',
            ok: 'Vídeo removido.',
        },
    };

    document.addEventListener("click", async (e) => {
        const btn = e.target.closest(".btn-excluir-arquivo");
        if (!btn) return;
        const cfg = EXCLUSAO_ARQUIVO[btn.getAttribute("data-tipo")];
        if (!cfg) return;
        const confirmado = await showConfirm(cfg.texto, { title: cfg.titulo, variant: "danger" });
        if (!confirmado) return;
        try {
            const resp = await apiFetch(cfg.url, { method: 'DELETE' });
            if (!resp.ok) {
                showToast('Não foi possível excluir. Tente novamente.', 'error');
                return;
            }
            meuPerfilProfessor = await resp.json();
            showToast(cfg.ok, 'success');
            if (typeof renderTeacherDashboard === 'function') renderTeacherDashboard();
        } catch (erro) {
            console.error('Erro ao excluir arquivo:', erro);
            showToast('Erro ao excluir. Tente novamente.', 'error');
        }
    });

    // Depois de editar o nome no perfil, atualiza a sessão salva e o "Olá, ..." do topo
    // (senão o nome antigo continuaria aparecendo até o próximo login).
    function atualizarNomeExibido(nome) {
        if (!currentUser || !nome || currentUser.name === nome) return;
        currentUser.name = nome;
        localStorage.setItem("darumhelp_user", JSON.stringify(currentUser));
        if (welcomeLabel) welcomeLabel.textContent = `Olá, ${currentUser.name}!`;
    }

    // Aluno atualiza nome/sobre do próprio perfil
    async function atualizarMeuPerfilAlunoAPI(dados) {
        try {
            const resp = await apiFetch('/api/contas/aluno/me/', {
                method: 'PATCH',
                body: JSON.stringify(dados),
            });
            const data = await resp.json();
            if (!resp.ok) {
                const primeiroErro = Object.values(data).find(v => Array.isArray(v) && v.length);
                const msg = primeiroErro?.[0] || data.detail || 'Não foi possível salvar o perfil.';
                showToast(msg, 'error');
                return;
            }
            showToast('Perfil atualizado com sucesso!', 'success');
            atualizarNomeExibido(data.nome);
            await carregarMeuPerfilAluno();
        } catch (erro) {
            console.error('Erro ao atualizar perfil do aluno:', erro);
            showToast('Erro ao salvar o perfil. Tente novamente.', 'error');
        }
    }

    // Aluno favorita/desfavorita um professor
    async function alternarFavoritoAPI(professorId, jaFavoritado) {
        try {
            const resp = jaFavoritado
                ? await apiFetch(`/api/contas/aluno/me/favoritos/${professorId}/`, { method: 'DELETE' })
                : await apiFetch('/api/contas/aluno/me/favoritos/adicionar/', {
                    method: 'POST',
                    body: JSON.stringify({ professor: professorId }),
                });

            if (!resp.ok && resp.status !== 204) {
                const data = await resp.json().catch(() => ({}));
                showToast(data.detail || 'Não foi possível atualizar os favoritos.', 'error');
                return;
            }
            showToast(jaFavoritado ? 'Professor removido dos favoritos.' : 'Professor salvo nos favoritos!', 'success');
            await carregarMeuPerfilAluno();
            if (typeof renderTeachers === 'function' && teachersGrid) renderTeachers(ultimoFiltroProfessores);
        } catch (erro) {
            console.error('Erro ao favoritar professor:', erro);
            showToast('Erro ao atualizar os favoritos. Tente novamente.', 'error');
        }
    }

    // Aluno adiciona um cartão salvo (dados fictícios: só apelido/bandeira/4 últimos dígitos/validade)
    async function adicionarCartaoAPI(dados) {
        try {
            const resp = await apiFetch('/api/contas/aluno/me/cartoes/', {
                method: 'POST',
                body: JSON.stringify(dados),
            });
            const data = await resp.json();
            if (!resp.ok) {
                const primeiroErro = Object.values(data).find(v => Array.isArray(v) && v.length);
                showToast(primeiroErro?.[0] || data.detail || 'Não foi possível salvar o cartão.', 'error');
                return;
            }
            showToast('Cartão salvo com sucesso!', 'success');
            await carregarMeuPerfilAluno();
        } catch (erro) {
            console.error('Erro ao salvar cartão:', erro);
            showToast('Erro ao salvar o cartão. Tente novamente.', 'error');
        }
    }

    // Aluno remove um cartão salvo
    async function removerCartaoAPI(cartaoId) {
        try {
            const resp = await apiFetch(`/api/contas/aluno/me/cartoes/${cartaoId}/`, { method: 'DELETE' });
            if (!resp.ok && resp.status !== 204) {
                showToast('Não foi possível remover o cartão.', 'error');
                return;
            }
            showToast('Cartão removido.', 'success');
            await carregarMeuPerfilAluno();
        } catch (erro) {
            console.error('Erro ao remover cartão:', erro);
            showToast('Erro ao remover o cartão. Tente novamente.', 'error');
        }
    }

    // Aluno envia/troca a foto de perfil
    async function enviarAvatarAlunoAPI(file) {
        const formData = new FormData();
        formData.append('avatar', file);

        try {
            const resp = await apiFetch('/api/contas/aluno/me/avatar/', {
                method: 'POST',
                body: formData,
            });
            const data = await resp.json();
            if (!resp.ok) {
                showToast(data.avatar?.[0] || data.detail || 'Não foi possível enviar a foto.', 'error');
                return;
            }
            showToast('Foto atualizada com sucesso!', 'success');
            await carregarMeuPerfilAluno();
        } catch (erro) {
            console.error('Erro ao enviar foto:', erro);
            showToast('Erro ao enviar a foto. Tente novamente.', 'error');
        }
    }

    // Professor atualiza biografia/preço/metodologia/vídeo (link)/PIX/política de cancelamento
    async function atualizarMeuPerfilAPI(dados) {
        try {
            const resp = await apiFetch('/api/professores/me/', {
                method: 'PATCH',
                body: JSON.stringify(dados),
            });
            const data = await resp.json();
            if (!resp.ok) {
                const primeiroErro = Object.values(data).find(v => Array.isArray(v) && v.length);
                const msg = primeiroErro?.[0] || data.detail || 'Não foi possível salvar o perfil.';
                showToast(msg, 'error');
                return;
            }
            showToast('Perfil atualizado com sucesso!', 'success');
            atualizarNomeExibido(data.nome);
            await carregarMeuPerfilProfessor();
        } catch (erro) {
            console.error('Erro ao atualizar perfil:', erro);
            showToast('Erro ao salvar o perfil. Tente novamente.', 'error');
        }
    }

    // Professor envia/troca a foto de perfil (upload de imagem)
    async function enviarAvatarAPI(file) {
        const formData = new FormData();
        formData.append('avatar', file);

        try {
            const resp = await apiFetch('/api/professores/me/avatar/', {
                method: 'POST',
                body: formData,
            });
            const data = await resp.json();
            if (!resp.ok) {
                showToast(data.avatar?.[0] || data.detail || 'Não foi possível enviar a foto.', 'error');
                return;
            }
            showToast('Foto atualizada com sucesso!', 'success');
            await carregarMeuPerfilProfessor();
        } catch (erro) {
            console.error('Erro ao enviar foto:', erro);
            showToast('Erro ao enviar a foto. Tente novamente.', 'error');
        }
    }

    // Professor envia/troca o vídeo de apresentação (upload de arquivo — substitui o link, se houver)
    async function enviarVideoApresentacaoAPI(file) {
        const formData = new FormData();
        formData.append('video', file);

        try {
            const resp = await apiFetch('/api/professores/me/video/', {
                method: 'POST',
                body: formData,
            });
            const data = await resp.json();
            if (!resp.ok) {
                showToast(data.video?.[0] || data.detail || 'Não foi possível enviar o vídeo.', 'error');
                return;
            }
            showToast('Vídeo de apresentação enviado!', 'success');
            await carregarMeuPerfilProfessor();
        } catch (erro) {
            console.error('Erro ao enviar vídeo:', erro);
            showToast('Erro ao enviar o vídeo. Tente novamente.', 'error');
        }
    }

    // Professor envia RG/CNH (+ CPF opcional) para reduzir perfis fake
    async function enviarDocumentoIdentidadeAPI(file, cpf) {
        const formData = new FormData();
        formData.append('documento', file);
        if (cpf) formData.append('cpf', cpf);

        try {
            const resp = await apiFetch('/api/professores/me/documento/', {
                method: 'POST',
                body: formData,
            });
            const data = await resp.json();
            if (!resp.ok) {
                showToast(data.documento?.[0] || data.cpf?.[0] || data.detail || 'Não foi possível enviar o documento.', 'error');
                return;
            }
            showToast('Documento enviado! Ele ficará "Pendente" até um moderador revisar.', 'success');
            await carregarMeuPerfilProfessor();
        } catch (erro) {
            console.error('Erro ao enviar documento:', erro);
            showToast('Erro ao enviar o documento. Tente novamente.', 'error');
        }
    }

    // Professor solicita um saque do saldo disponível na carteira (instantâneo/simulado)
    async function solicitarSaqueAPI(valor) {
        try {
            const resp = await apiFetch('/api/professores/me/saques/', {
                method: 'POST',
                body: JSON.stringify({ valor }),
            });
            const data = await resp.json();
            if (!resp.ok) {
                const primeiroErro = Object.values(data).find(v => Array.isArray(v) && v.length);
                showToast(primeiroErro?.[0] || data.detail || 'Não foi possível solicitar o saque.', 'error');
                return;
            }
            showToast('Saque solicitado com sucesso!', 'success');
            await carregarMeuPerfilProfessor();
        } catch (erro) {
            console.error('Erro ao solicitar saque:', erro);
            showToast('Erro ao solicitar o saque. Tente novamente.', 'error');
        }
    }

    // Professor cadastra uma disciplina que leciona
    async function criarDisciplinaAPI(nome, descricao) {
        try {
            const resp = await apiFetch('/api/disciplinas/', {
                method: 'POST',
                body: JSON.stringify({ nome, descricao }),
            });
            const data = await resp.json();
            if (!resp.ok) {
                showToast(data.nome?.[0] || data.detail || 'Não foi possível adicionar a disciplina.', 'error');
                return;
            }
            showToast('Disciplina adicionada!', 'success');
            await carregarMeuPerfilProfessor();
        } catch (erro) {
            console.error('Erro ao criar disciplina:', erro);
            showToast('Erro ao adicionar disciplina. Tente novamente.', 'error');
        }
    }

    async function removerDisciplinaAPI(id) {
        try {
            const resp = await apiFetch(`/api/disciplinas/${id}/`, { method: 'DELETE' });
            if (!resp.ok) {
                const data = await resp.json().catch(() => ({}));
                // perform_destroy levanta ValidationError com string simples, que a
                // DRF serializa como lista JSON (["mensagem"]), não {detail: "..."}.
                showToast((Array.isArray(data) ? data[0] : data.detail) || 'Não foi possível remover a disciplina.', 'error');
                return;
            }
            showToast('Disciplina removida.', 'success');
            await carregarMeuPerfilProfessor();
        } catch (erro) {
            console.error('Erro ao remover disciplina:', erro);
            showToast('Erro ao remover disciplina. Tente novamente.', 'error');
        }
    }

    // Professor cadastra um ou mais horários de disponibilidade de uma vez (um
    // POST por dia marcado na grade semanal — cada dia pode ter início/fim
    // diferentes). Mostra um resumo único no final em vez de um toast por dia.
    async function criarDisponibilidadesEmLoteAPI(listaDeDados) {
        let sucessos = 0;
        const erros = [];

        for (const dados of listaDeDados) {
            try {
                const resp = await apiFetch('/api/disponibilidades/', {
                    method: 'POST',
                    body: JSON.stringify(dados),
                });
                const data = await resp.json();
                if (!resp.ok) {
                    const msg = data.non_field_errors?.[0] || data.horario_fim?.[0] || data.horario_inicio?.[0] || data.disciplina?.[0] || data.detail || 'Não foi possível adicionar.';
                    const nomeDisc = (minhasDisciplinas.find(d => String(d.id) === String(dados.disciplina)) || {}).nome;
                    erros.push(`${DIA_SEMANA_LABEL[dados.dia_semana] || dados.dia_semana}${nomeDisc ? ` (${nomeDisc})` : ''}: ${msg}`);
                } else {
                    sucessos++;
                }
            } catch (erro) {
                console.error('Erro ao criar disponibilidade:', erro);
                erros.push(`${DIA_SEMANA_LABEL[dados.dia_semana] || dados.dia_semana}: erro de conexão.`);
            }
        }

        if (sucessos > 0) {
            showToast(`${sucessos} horário(s) adicionado(s)!`, 'success');
        }
        erros.forEach(msg => showToast(msg, 'error'));

        await carregarMeuPerfilProfessor();
    }

    async function removerDisponibilidadeAPI(id) {
        try {
            const resp = await apiFetch(`/api/disponibilidades/${id}/`, { method: 'DELETE' });
            if (!resp.ok) {
                const data = await resp.json().catch(() => ({}));
                showToast((Array.isArray(data) ? data[0] : data.detail) || 'Não foi possível remover o horário.', 'error');
                return;
            }
            showToast('Horário removido.', 'success');
            await carregarMeuPerfilProfessor();
        } catch (erro) {
            console.error('Erro ao remover disponibilidade:', erro);
            showToast('Erro ao remover horário. Tente novamente.', 'error');
        }
    }

    // Professor envia/atualiza o currículo (PDF) para triagem + revisão humana
    async function enviarCurriculoAPI(file) {
        const formData = new FormData();
        formData.append('curriculo', file);

        try {
            const resp = await apiFetch('/api/professores/me/curriculo/', {
                method: 'POST',
                body: formData,
            });
            const data = await resp.json();

            if (!resp.ok) {
                showToast(data.curriculo?.[0] || data.detail || 'Não foi possível enviar o currículo.', 'error');
                return;
            }

            showToast('Currículo enviado! Ele ficará "Pendente" até um moderador revisar e aprovar.', 'success');
            await carregarMeuPerfilProfessor();
            renderTeacherDashboard();
        } catch (erro) {
            console.error('Erro ao enviar currículo:', erro);
            showToast('Erro ao enviar o currículo. Tente novamente.', 'error');
        }
    }

    if (yearSpan) yearSpan.textContent = new Date().getFullYear();

    // Mudar de Visão
    function switchView(viewTarget) {
        views.forEach(v => v.classList.add("hidden"));
        const target = document.getElementById(`view-${viewTarget}`);
        if (target) target.classList.remove("hidden");

        if (viewTarget === "student") renderStudentDashboard();
        if (viewTarget === "meusprofessores") renderMeusProfessoresView();
        if (viewTarget === "teacher") renderTeacherDashboard();
        if (viewTarget === "meusalunos") renderMeusAlunosView();
    }

    function closeChatSocket() {
        if (chatSocket) {
            chatSocket.close();
            chatSocket = null;
        }
    }

    function openModal(html) {
        closeChatSocket();
        if (modalContent && modal) {
            modalContent.innerHTML = html;
            modal.classList.remove("hidden");
            refreshIcons();
        }
    }

    if (modalClose && modal) {
        modalClose.addEventListener("click", () => {
            closeChatSocket();
            modal.classList.add("hidden");
        });
    }

    // 4. RENDERIZAR PROFESSORES
    function renderTeachers(filterSubject = null) {
        if (!teachersGrid) return;
        ultimoFiltroProfessores = filterSubject;

        let filteredTeachers = teachersData;
        if (filterSubject) {
            filteredTeachers = teachersData.filter(t => {
                const materias = (t.subjects && t.subjects.length) ? t.subjects : [t.subject];
                return materias.some(m => normalizarTexto(m).includes(normalizarTexto(filterSubject)));
            });
        }

        if (filteredTeachers.length === 0) {
            teachersGrid.innerHTML = `
                <div class="col-span-full py-8 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 space-y-3">
                    <i data-lucide="user-x" class="w-7 h-7 mx-auto"></i>
                    <p class="text-sm font-semibold">Nenhum professor cadastrado para "${filterSubject}" no momento.</p>
                    <p class="text-xs text-slate-400 max-w-sm mx-auto">Explore outras matérias no catálogo, ou seja o primeiro professor a ensinar isso na plataforma!</p>
                    <button onclick="document.querySelector('[data-view=search]').click()" class="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl transition inline-flex items-center gap-1.5">
                        <i data-lucide="layout-grid" class="w-3.5 h-3.5"></i> Ver todas as matérias
                    </button>
                </div>
            `;
            refreshIcons();
            return;
        }

        const podeFavoritar = currentUser && currentUser.role === 'student';
        const idsFavoritados = new Set(meusFavoritos.map(f => f.id));

        teachersGrid.innerHTML = filteredTeachers.map(t => `
            <div class="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4">
                <div class="flex items-start gap-4">
                    <img src="${t.avatar}" alt="${t.name}" class="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-100 shadow-sm">
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center justify-between gap-1">
                            <h4 class="font-bold text-slate-900 text-base truncate flex items-center gap-1">
                                ${t.name}
                                ${t.identidadeVerificada ? `<i data-lucide="badge-check" class="w-4 h-4 text-emerald-500 shrink-0" title="Identidade verificada"></i>` : ''}
                            </h4>
                            <div class="flex items-center gap-1 shrink-0">
                                <span class="text-xs font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100">${t.badge}</span>
                                ${podeFavoritar ? `
                                    <button class="btn-favoritar p-1 rounded-md hover:bg-rose-50 transition" data-teacher-id="${t.id}" data-favoritado="${idsFavoritados.has(t.id)}" title="${idsFavoritados.has(t.id) ? 'Remover dos favoritos' : 'Salvar nos favoritos'}">
                                        <i data-lucide="heart" class="w-3.5 h-3.5 ${idsFavoritados.has(t.id) ? 'fill-rose-500 text-rose-500' : 'text-slate-300'}"></i>
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                        <p class="text-xs font-semibold text-indigo-600 mt-0.5">${t.subject}</p>
                        <div class="flex items-center gap-1 mt-2 text-xs">
                            ${t.reviewsCount > 0 ? `
                                <span class="text-amber-400 text-sm">★</span>
                                <span class="font-extrabold text-amber-500">${t.rating.toFixed(1)}</span>
                            ` : `<span class="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-md px-1.5 py-0.5"><i data-lucide="sparkles" class="w-3 h-3"></i> Novo na plataforma</span>`}
                            ${t.reviewsCount > 0 ? `
                                <button class="btn-ver-avaliacoes text-indigo-600 hover:text-indigo-800 font-semibold underline underline-offset-2" data-teacher-id="${t.id}">
                                    Ver ${t.reviewsCount === 1 ? '1 avaliação' : `${t.reviewsCount} avaliações`}
                                </button>
                            ` : `<span class="text-slate-400">ainda sem avaliações</span>`}
                        </div>
                    </div>
                </div>
                <div>
                    <p class="text-xs text-slate-600 leading-relaxed bio-texto line-clamp-2">${t.bio}</p>
                    ${t.bio && t.bio.length > 100 ? `
                        <button class="btn-ver-mais-bio text-[11px] font-bold text-indigo-600 hover:text-indigo-700 mt-0.5" data-teacher-id="${t.id}">
                            Ver mais
                        </button>
                    ` : ''}
                </div>
                ${t.curriculoUrl ? `
                    <a href="${t.curriculoUrl}" target="_blank" rel="noopener" class="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 underline">
                        <i data-lucide="file-text" class="w-3 h-3"></i> Ver currículo
                    </a>
                ` : ''}
                <div class="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                        <span class="text-xs text-slate-400 block">Preço por hora</span>
                        <span class="font-extrabold text-indigo-950 text-base">R$ ${t.price.toFixed(2).replace('.', ',')}</span>
                    </div>
                    <button class="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-indigo-950 font-bold text-xs rounded-xl transition shadow-sm btn-agendar" data-teacher-id="${t.id}">
                        Agendar Aula
                    </button>
                </div>
            </div>
        `).join('');
        refreshIcons();

        document.querySelectorAll(".btn-agendar").forEach(btn => {
            btn.addEventListener("click", () => {
                const teacherId = parseInt(btn.getAttribute("data-teacher-id"));
                abrirModalAgendamento(teacherId);
            });
        });

        document.querySelectorAll(".btn-ver-avaliacoes").forEach(btn => {
            btn.addEventListener("click", () => abrirModalAvaliacoes(parseInt(btn.getAttribute("data-teacher-id"))));
        });

        document.querySelectorAll(".btn-favoritar").forEach(btn => {
            btn.addEventListener("click", () => {
                const teacherId = parseInt(btn.getAttribute("data-teacher-id"));
                const jaFavoritado = btn.getAttribute("data-favoritado") === "true";
                alternarFavoritoAPI(teacherId, jaFavoritado);
            });
        });

        document.querySelectorAll(".btn-ver-mais-bio").forEach(btn => {
            btn.addEventListener("click", () => {
                const texto = btn.previousElementSibling;
                const truncado = texto.classList.toggle("line-clamp-2");
                btn.textContent = truncado ? "Ver mais" : "Ver menos";
            });
        });
    }

    // Avaliações de um professor, vistas pelo card da busca antes de agendar.
    async function abrirModalAvaliacoes(teacherId) {
        const teacher = teachersData.find(t => t.id === teacherId);
        if (!teacher) return;

        let avaliacoes = [];
        try {
            const resp = await apiFetch(`/api/professores/${teacherId}/avaliacoes/`);
            if (resp.ok) avaliacoes = await resp.json();
        } catch (erro) {
            console.error('Erro ao carregar avaliações:', erro);
        }

        // Quantas avaliações de cada nota (5 a 1), para as barrinhas do resumo.
        const porNota = [5, 4, 3, 2, 1].map(n => ({ nota: n, qtd: avaliacoes.filter(a => a.nota === n).length }));
        const resumo = avaliacoes.length ? `
            <div class="flex items-center gap-4 bg-amber-50 border border-amber-100 rounded-xl p-3">
                <div class="text-center shrink-0">
                    <p class="text-3xl font-black text-amber-500">${teacher.rating.toFixed(1)}</p>
                    <p class="text-amber-400 text-sm">${estrelas(Math.round(teacher.rating))}</p>
                    <p class="text-[10px] text-slate-500">${avaliacoes.length} ${avaliacoes.length === 1 ? 'avaliação' : 'avaliações'}</p>
                </div>
                <div class="flex-1 space-y-0.5">
                    ${porNota.map(p => `
                        <div class="flex items-center gap-2 text-[10px] text-slate-500">
                            <span class="w-3 text-right">${p.nota}</span>
                            <div class="flex-1 h-1.5 bg-white rounded-full overflow-hidden"><div class="h-full bg-amber-400" style="width:${Math.round(p.qtd / avaliacoes.length * 100)}%"></div></div>
                            <span class="w-4">${p.qtd}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : '';

        openModal(`
            <div class="space-y-4">
                <div class="flex items-center gap-3 border-b border-slate-100 pb-3">
                    <img src="${escapeHtml(teacher.avatar)}" class="w-12 h-12 rounded-xl object-cover">
                    <div>
                        <h3 class="font-bold text-slate-900 text-sm">Avaliações de ${escapeHtml(teacher.name)}</h3>
                        <p class="text-xs text-indigo-600 font-semibold">${escapeHtml(teacher.subject)}</p>
                    </div>
                </div>
                ${resumo}
                <div class="space-y-2 max-h-72 overflow-y-auto pr-1">
                    ${avaliacoes.length ? avaliacoes.map(a => `
                        <div class="bg-slate-50 border border-slate-100 rounded-xl p-3">
                            <div class="flex items-center justify-between gap-2">
                                <p class="text-xs font-bold text-slate-800">${escapeHtml(a.studentName)}</p>
                                <p class="text-[10px] text-slate-400">${escapeHtml(a.date)}</p>
                            </div>
                            <p class="text-amber-500 text-xs">${estrelas(a.nota)}</p>
                            ${a.comentario ? `<p class="text-xs text-slate-600 mt-1">"${escapeHtml(a.comentario)}"</p>` : ''}
                        </div>
                    `).join('') : `<p class="text-xs text-slate-400 text-center py-4">Este professor ainda não recebeu avaliações.</p>`}
                </div>
                <button id="btnAgendarDasAvaliacoes" class="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-indigo-950 font-bold text-xs rounded-xl transition shadow-sm">
                    Agendar aula com ${escapeHtml(teacher.name)}
                </button>
            </div>
        `);
        document.getElementById("btnAgendarDasAvaliacoes").addEventListener("click", () => abrirModalAgendamento(teacherId));
    }

    // 5. RENDERIZAR MATÉRIAS
    function renderSubjects() {
        if (!subjectsGrid) return;

        const subjectsPageTitle = document.getElementById("subjectsPageTitle");
        if (subjectsPageTitle) {
            subjectsPageTitle.textContent = selectedCategory === "all"
                ? "Encontre sua matéria"
                : (CATEGORIA_LABEL[selectedCategory] || "Encontre sua matéria");
        }

        const searchTerm = subjectSearchInput ? subjectSearchInput.value : "";

        const filtered = subjectsData.filter(s => {
            const matchesCat = selectedCategory === "all" || s.category === selectedCategory;
            const matchesSearch = normalizarTexto(s.name).includes(normalizarTexto(searchTerm));
            return matchesCat && matchesSearch;
        });

        if (filtered.length === 0) {
            subjectsGrid.innerHTML = `
                <div class="col-span-full py-12 text-center text-slate-400 space-y-3">
                    <i data-lucide="search-x" class="w-9 h-9 mx-auto"></i>
                    <p class="text-sm font-semibold">Nenhuma matéria encontrada no catálogo${searchTerm ? ` para "${searchTerm}"` : ''}.</p>
                    ${searchTerm ? `
                        <p class="text-xs text-slate-400 max-w-sm mx-auto">O catálogo é só um guia — um professor pode ensinar algo que ainda não está nele. Que tal procurar direto pelos professores cadastrados?</p>
                        <button id="btnBuscarProfessoresFallback" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition inline-flex items-center gap-1.5">
                            <i data-lucide="search" class="w-3.5 h-3.5"></i> Buscar professores de "${searchTerm}"
                        </button>
                    ` : ''}
                </div>
            `;
            refreshIcons();
            const btnFallback = document.getElementById("btnBuscarProfessoresFallback");
            if (btnFallback) {
                btnFallback.addEventListener("click", () => executarBuscaGlobal(searchTerm));
            }
            return;
        }

        subjectsGrid.innerHTML = filtered.map(s => `
            <div class="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition group flex flex-col justify-between space-y-4">
                <div class="w-12 h-12 rounded-2xl ${s.bg} flex items-center justify-center">
                    <i data-lucide="${s.icon}" class="w-6 h-6"></i>
                </div>
                <div>
                    <h3 class="font-bold text-slate-900 text-base group-hover:text-indigo-600 transition">${s.name}</h3>
                    <p class="text-xs text-slate-500 mt-0.5">${s.detalhe || 'Aulas particulares e reforço sob medida.'}</p>
                </div>
                <button class="w-full py-2 bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1 btn-ver-professores" data-subject="${s.name}">
                    Ver Professores <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
                </button>
            </div>
        `).join('');
        refreshIcons();

        document.querySelectorAll(".btn-ver-professores").forEach(btn => {
            btn.addEventListener("click", () => {
                const subjectName = btn.getAttribute("data-subject");
                switchView("home");
                renderTeachers(subjectName);
            });
        });
    }

    // 6. AGENDAMENTO E PAGAMENTO VIA PIX
    const DIA_SEMANA_LABEL = {
        segunda: "Segunda", terca: "Terça", quarta: "Quarta", quinta: "Quinta", sexta: "Sexta",
        sabado: "Sábado", domingo: "Domingo"
    };
    const ORDEM_DIAS_SEMANA = Object.keys(DIA_SEMANA_LABEL);

    // Mesma regra do backend (ANTECEDENCIA_MINIMA_MINUTOS em agendamento/serializers.py).
    const ANTECEDENCIA_MINIMA_MINUTOS = 60;

    // Texto digitado por usuários (ex.: mensagens do chat) nunca deve ir cru para
    // o innerHTML — senão uma "mensagem" com <img onerror=...> vira código rodando
    // no navegador do outro participante.
    function escapeHtml(texto) {
        return String(texto ?? '')
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    // Bolinha com a foto da pessoa; sem foto, mostra as iniciais do nome.
    // `tamanho` = classes de largura/altura; pode incluir um text-* para o tamanho das iniciais.
    function avatarBolinha(nome, url, tamanho = 'w-7 h-7') {
        if (url) {
            return `<img src="${escapeHtml(url)}" alt="${escapeHtml(nome)}" class="${tamanho} rounded-full object-cover border border-slate-200 flex-shrink-0">`;
        }
        const partes = String(nome || '?').trim().split(/\s+/);
        const iniciais = ((partes[0]?.[0] || '?') + (partes.length > 1 ? partes[partes.length - 1][0] : '')).toUpperCase();
        const texto = /\btext-/.test(tamanho) ? '' : 'text-[10px]';
        return `<div class="${tamanho} ${texto} rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center flex-shrink-0">${escapeHtml(iniciais)}</div>`;
    }

    // Ordena janelas de disponibilidade de segunda a domingo e, no mesmo dia, pelo horário de início.
    function ordenarJanelas(janelas) {
        return [...janelas].sort((a, b) =>
            (ORDEM_DIAS_SEMANA.indexOf(a.dia_semana) - ORDEM_DIAS_SEMANA.indexOf(b.dia_semana))
            || a.horario_inicio.localeCompare(b.horario_inicio));
    }

    // "2 dias e 3 horas", "5 horas e 20 minutos", "45 minutos"
    function formatarAntecedencia(totalMinutos) {
        const m = Math.max(0, totalMinutos);
        const plural = (n, s, p) => `${n} ${n === 1 ? s : p}`;
        const dias = Math.floor(m / 1440), horas = Math.floor((m % 1440) / 60), minutos = m % 60;
        if (dias > 0) return plural(dias, 'dia', 'dias') + (horas ? ` e ${plural(horas, 'hora', 'horas')}` : '');
        if (horas > 0) return plural(horas, 'hora', 'horas') + (minutos ? ` e ${plural(minutos, 'minuto', 'minutos')}` : '');
        return plural(minutos, 'minuto', 'minutos');
    }

    // Até quando o aluno cancela com reembolso integral: 24h antes do início da aula.
    function prazoReembolsoIntegral(b) {
        const [dia, mes, ano] = b.date.split('/').map(Number);
        const [hora, minuto] = b.time.split(':').map(Number);
        return new Date(new Date(ano, mes - 1, dia, hora, minuto).getTime() - 24 * 3600000);
    }

    // "sáb, 27/09 às 06:00"
    function formatarDataHora(d) {
        const dias = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
        const p = n => String(n).padStart(2, '0');
        return `${dias[d.getDay()]}, ${p(d.getDate())}/${p(d.getMonth() + 1)} às ${p(d.getHours())}:${p(d.getMinutes())}`;
    }

    function formatarReais(valor) {
        return `R$ ${Number(valor).toFixed(2).replace('.', ',')}`;
    }

    // Texto da confirmação de cancelamento com antecedência, % e valor do reembolso
    // (mesma regra do backend, RN05: professor cancela → 100%; aluno com 24h ou
    // mais → 100%; aluno com menos de 24h → 0%). `papel` = 'aluno' | 'professor'.
    function textoConfirmacaoCancelamento(b, papel) {
        const [dia, mes, ano] = b.date.split('/').map(Number);
        const [hora, minuto] = b.time.split(':').map(Number);
        const minutosAteAula = Math.floor((new Date(ano, mes - 1, dia, hora, minuto) - new Date()) / 60000);
        const antecedencia = formatarAntecedencia(minutosAteAula);
        const pago = formatarReais(b.price);
        const pertoDoLimite = Math.abs(minutosAteAula - 24 * 60) <= 5;

        let texto;
        if (papel === 'professor') {
            texto = `Você está cancelando com ${antecedencia} de antecedência.
`
                + `Como o cancelamento é do professor, o aluno recebe o reembolso integral: ${pago} (100% do valor pago).`;
        } else if (minutosAteAula >= 24 * 60) {
            texto = `Você está cancelando com ${antecedencia} de antecedência (24 horas ou mais).
`
                + `Você receberá o reembolso integral: ${pago} (100% do valor pago).

`
                + `Se deixar para cancelar depois de ${formatarDataHora(prazoReembolsoIntegral(b))} `
                + `(menos de 24 horas antes da aula), você receberia R$ 0,00 (0%).`;
        } else {
            texto = `Você está cancelando com apenas ${antecedencia} de antecedência (menos de 24 horas).
`
                + `Pela política de cancelamento, você não receberá reembolso: R$ 0,00 dos ${pago} pagos (0%).`;
        }
        if (pertoDoLimite) texto += `

Atenção: faltam cerca de 24 horas — o valor final é calculado no momento em que você confirmar.`;
        return texto + `

Tem certeza que deseja cancelar esta aula?`;
    }

    function dataLocalISO(d) {
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    function minutosParaHHMM(total) {
        return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
    }
    // "às segundas", "aos sábados" — sábado e domingo são masculinos.
    const DIA_SEMANA_PLURAL = {
        segunda: "às segundas", terca: "às terças", quarta: "às quartas", quinta: "às quintas",
        sexta: "às sextas", sabado: "aos sábados", domingo: "aos domingos"
    };

    // Opções de duração da aula (até 2h30) — mesma lista usada no formulário do
    // professor (pré-visualização de preço) e no modal de agendamento do aluno.
    const DURACAO_OPCOES = [
        { minutos: 30, label: "30 minutos" },
        { minutos: 60, label: "1 hora" },
        { minutos: 90, label: "1h30" },
        { minutos: 120, label: "2 horas" },
        { minutos: 150, label: "2h30" },
    ];

    async function abrirModalAgendamento(teacherId) {
        if (!currentUser) {
            showToast("Por favor, faça login ou cadastre-se para agendar uma aula!", 'error');
            btnLogin.click();
            return;
        }

        const teacher = teachersData.find(t => t.id === teacherId);
        if (!teacher) return;

        let disponibilidades = [];
        let avaliacoes = [];
        try {
            const [respDisp, respAval] = await Promise.all([
                apiFetch(`/api/professores/${teacherId}/disponibilidades/`),
                apiFetch(`/api/professores/${teacherId}/avaliacoes/`),
            ]);
            if (respDisp.ok) disponibilidades = await respDisp.json();
            if (respAval.ok) avaliacoes = await respAval.json();
        } catch (erro) {
            console.error('Erro ao buscar disponibilidade/avaliações:', erro);
        }

        // Matérias que o professor realmente tem horário cadastrado (dedup por disciplina).
        const disciplinasComHorario = [];
        const disciplinasVistas = new Set();
        disponibilidades.forEach(d => {
            if (!disciplinasVistas.has(d.disciplina)) {
                disciplinasVistas.add(d.disciplina);
                disciplinasComHorario.push({ id: d.disciplina, nome: d.disciplinaNome || 'Matéria' });
            }
        });
        const materiaUnica = disciplinasComHorario.length === 1;

        const avaliacoesHtml = avaliacoes.length
            ? avaliacoes.slice(0, 5).map(a => `
                <div class="border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                    <p class="text-xs font-bold text-amber-500">
                        ${'★'.repeat(a.nota)}${'☆'.repeat(5 - a.nota)}
                        <span class="text-slate-600 font-semibold">${a.studentName}</span>
                    </p>
                    ${a.comentario ? `<p class="text-xs text-slate-500 mt-0.5">"${escapeHtml(a.comentario)}"</p>` : ''}
                </div>
            `).join('')
            : `<p class="text-xs text-slate-400">Ainda não há avaliações de alunos para este professor.</p>`;

        // Pode agendar a partir de hoje (data local, não UTC — senão à noite o
        // "hoje" viraria amanhã); o horário mínimo de hoje é tratado em
        // atualizarHorarioEPreco (antecedência mínima de 1h, mesma regra do backend).
        const minDate = dataLocalISO(new Date());

        openModal(`
            <div id="bookingStep1" class="space-y-4">
                <div class="flex items-center gap-3 border-b border-slate-100 pb-3">
                    <img src="${teacher.avatar}" class="w-12 h-12 rounded-xl object-cover">
                    <div>
                        <h3 class="font-bold text-slate-900 text-base flex items-center gap-1.5">
                            Agendar com ${teacher.name}
                            ${teacher.identidadeVerificada ? `<i data-lucide="badge-check" class="w-4 h-4 text-emerald-500" title="Identidade verificada"></i>` : ''}
                        </h3>
                        <p class="text-xs text-indigo-600 font-semibold">${teacher.subject} • R$ ${teacher.price.toFixed(2).replace('.', ',')} por hora</p>
                        ${teacher.curriculoUrl ? `
                            <a href="${teacher.curriculoUrl}" target="_blank" rel="noopener" class="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 underline mt-1">
                                <i data-lucide="file-text" class="w-3 h-3"></i> Ver currículo (formação e experiência)
                            </a>
                        ` : ''}
                    </div>
                </div>

                ${teacher.videoUrl ? `
                    <div class="aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-900">
                        <iframe src="${embedUrlVideo(teacher.videoUrl)}" class="w-full h-full" allowfullscreen referrerpolicy="strict-origin-when-cross-origin" allow="encrypted-media; picture-in-picture"></iframe>
                    </div>
                ` : ''}

                ${teacher.metodologia ? `
                    <div class="bg-indigo-50/60 border border-indigo-100 rounded-xl p-3">
                        <p class="text-xs font-bold text-indigo-700 flex items-center gap-1.5"><i data-lucide="lightbulb" class="w-3.5 h-3.5"></i> Como funciona a aula</p>
                        <p class="text-xs text-slate-600 mt-1">${teacher.metodologia}</p>
                    </div>
                ` : ''}

                <details class="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <summary class="text-xs font-bold text-slate-700 cursor-pointer flex items-center gap-1.5"><i data-lucide="star" class="w-3.5 h-3.5 text-amber-400"></i> Avaliações de alunos (${avaliacoes.length})</summary>
                    <div class="mt-2 space-y-2 max-h-40 overflow-y-auto pr-1">${avaliacoesHtml}</div>
                </details>

                <form id="bookingForm" class="space-y-3">
                    <div>
                        <label class="block text-xs font-bold text-slate-600 mb-1">Matéria</label>
                        <select id="bookingMateria" required class="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-medium focus:outline-indigo-500">
                            ${!materiaUnica ? `<option value="">Selecione a matéria</option>` : ''}
                            ${disciplinasComHorario.map(d => `<option value="${d.id}">${d.nome}</option>`).join('')}
                        </select>
                        ${disciplinasComHorario.length === 0 ? `<p class="text-[11px] text-amber-600 mt-1">Este professor ainda não tem horários cadastrados.</p>` : ''}
                    </div>

                    <div>
                        <label class="block text-xs font-bold text-slate-600 mb-1">Data da Aula</label>
                        <input type="date" id="bookingDate" min="${minDate}" required ${!materiaUnica ? 'disabled' : ''} class="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-indigo-500 disabled:bg-slate-50 disabled:text-slate-300">
                        <p id="bookingDateAviso" class="hidden text-[11px] text-red-600 font-semibold mt-1 flex items-center gap-1"><i data-lucide="triangle-alert" class="w-3 h-3"></i> <span></span></p>
                    </div>

                    <div>
                        <label class="block text-xs font-bold text-slate-600 mb-1">Janela de Disponibilidade do Professor</label>
                        <select id="bookingTime" required class="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-medium focus:outline-indigo-500">
                            <option value="">Selecione a data primeiro</option>
                        </select>
                    </div>

                    <div id="bookingHorarioWrap" class="hidden space-y-3">
                        <div>
                            <label class="block text-xs font-bold text-slate-600 mb-1">Duração da Aula</label>
                            <select id="bookingDuracao" class="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-medium focus:outline-indigo-500">
                                ${DURACAO_OPCOES.map(op => `<option value="${op.minutos}" ${op.minutos === 60 ? 'selected' : ''}>${op.label}</option>`).join('')}
                            </select>
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-600 mb-1">Horário de Início <span id="bookingHorarioFaixa" class="text-slate-400 font-normal"></span></label>
                            <input type="time" id="bookingHorario" class="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-indigo-500">
                            <p id="bookingConflitoAviso" class="hidden text-[11px] text-red-600 font-semibold mt-1 flex items-center gap-1"><i data-lucide="triangle-alert" class="w-3 h-3"></i> Esse horário já está ocupado na agenda do professor. Escolha outro horário.</p>
                        </div>
                        <p id="bookingAviso24h" class="hidden text-[11px] text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 flex items-start gap-1.5"><i data-lucide="info" class="w-3.5 h-3.5 flex-shrink-0 mt-0.5"></i> Essa aula começa em menos de 24 horas: se você cancelar, não haverá reembolso.</p>
                        <p class="text-xs text-indigo-600 font-bold bg-indigo-50 rounded-lg px-3 py-2">Valor da aula: R$ <span id="bookingPrecoCalculado">0,00</span></p>
                    </div>

                    <div>
                        <label class="block text-xs font-bold text-slate-600 mb-2">Forma de Pagamento</label>
                        <div class="grid grid-cols-3 gap-2">
                            <label class="payment-option cursor-pointer">
                                <input type="radio" name="paymentMethod" value="PIX" class="peer sr-only" checked>
                                <div class="p-3 border-2 border-indigo-200 peer-checked:border-indigo-600 peer-checked:bg-indigo-50 rounded-xl flex flex-col items-center gap-1 text-center transition">
                                    <i data-lucide="qr-code" class="w-5 h-5 text-indigo-600"></i>
                                    <span class="text-[11px] font-bold text-slate-700">PIX</span>
                                </div>
                            </label>
                            <label class="payment-option cursor-pointer">
                                <input type="radio" name="paymentMethod" value="cartao" class="peer sr-only">
                                <div class="p-3 border-2 border-slate-200 peer-checked:border-indigo-600 peer-checked:bg-indigo-50 rounded-xl flex flex-col items-center gap-1 text-center transition">
                                    <i data-lucide="credit-card" class="w-5 h-5 text-slate-500"></i>
                                    <span class="text-[11px] font-bold text-slate-700">Cartão</span>
                                </div>
                            </label>
                            <label class="payment-option cursor-pointer">
                                <input type="radio" name="paymentMethod" value="boleto" class="peer sr-only">
                                <div class="p-3 border-2 border-slate-200 peer-checked:border-indigo-600 peer-checked:bg-indigo-50 rounded-xl flex flex-col items-center gap-1 text-center transition">
                                    <i data-lucide="barcode" class="w-5 h-5 text-slate-500"></i>
                                    <span class="text-[11px] font-bold text-slate-700">Boleto</span>
                                </div>
                            </label>
                        </div>
                    </div>

                    <button type="submit" id="btnIrPagamento" class="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-indigo-950 font-bold rounded-xl transition mt-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                        Ir para o Pagamento (R$ <span id="bookingBtnPreco">${teacher.price.toFixed(2).replace('.', ',')}</span>)
                    </button>
                </form>
            </div>

            <div id="bookingStep2" class="hidden space-y-4 text-center">

                <div id="paymentPix" class="hidden space-y-4">
                    <div>
                        <i data-lucide="qr-code" class="w-8 h-8 mx-auto text-indigo-600"></i>
                        <h3 class="font-bold text-indigo-950 text-lg mt-1">Pagamento via PIX</h3>
                        <p class="text-xs text-slate-500">Escaneie o QR Code abaixo para efetuar o pagamento.</p>
                    </div>

                    <div class="bg-slate-50 p-4 rounded-2xl border border-slate-200 inline-block mx-auto">
                        <img src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=DarUmHelp-Pix-Aula" alt="QR Code Pix" class="mx-auto rounded-lg shadow-sm">
                    </div>

                    <div class="space-y-1">
                        <p class="text-xs text-slate-500">Chave PIX Copia e Cola:</p>
                        <input type="text" readonly value="00020126360014BR.GOV.BCB.PIX0114+551199999999952040000" class="w-full px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-mono text-center text-slate-600 select-all">
                    </div>
                </div>

                <div id="paymentCartao" class="hidden space-y-3">
                    <div>
                        <i data-lucide="credit-card" class="w-8 h-8 mx-auto text-indigo-600"></i>
                        <h3 class="font-bold text-indigo-950 text-lg mt-1">Pagamento no Cartão</h3>
                        <p class="text-xs text-slate-500">Ambiente simulado — nenhum dado real de cartão é enviado.</p>
                    </div>
                    <div class="text-left space-y-2">
                        <input type="text" placeholder="Número do cartão" maxlength="19" class="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono">
                        <input type="text" placeholder="Nome impresso no cartão" class="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm">
                        <div class="grid grid-cols-2 gap-2">
                            <input type="text" placeholder="Validade (MM/AA)" maxlength="5" class="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono">
                            <input type="text" placeholder="CVV" maxlength="4" class="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono">
                        </div>
                    </div>
                </div>

                <div id="paymentBoleto" class="hidden space-y-3">
                    <div>
                        <i data-lucide="barcode" class="w-8 h-8 mx-auto text-indigo-600"></i>
                        <h3 class="font-bold text-indigo-950 text-lg mt-1">Pagamento por Boleto</h3>
                        <p class="text-xs text-slate-500">Vencimento em 3 dias úteis. A aula é confirmada assim que o pagamento é identificado.</p>
                    </div>
                    <div class="space-y-1">
                        <p class="text-xs text-slate-500">Linha digitável:</p>
                        <input type="text" id="bookingBoletoLinha" readonly value="" class="w-full px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-[10px] font-mono text-center text-slate-600 select-all">
                    </div>
                </div>

                <div class="text-left bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-start gap-2">
                    <i data-lucide="shield-alert" class="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5"></i>
                    <div class="text-[11px] text-amber-800 leading-relaxed">
                        <strong>Política de cancelamento:</strong> cancelando com pelo menos 24h de antecedência, você recebe
                        <strong>100% de reembolso</strong>. Cancelando com menos de 24h, <strong>não há reembolso</strong>.
                        Se o professor faltar, o reembolso é sempre de 100%.
                    </div>
                </div>

                <button id="btnConfirmPayment" class="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition shadow-sm">
                    Confirmar Pagamento e Finalizar
                </button>
            </div>
        `);
        refreshIcons();

        let tempBooking = null;
        let horariosOcupados = [];

        // JS: getDay() = 0(domingo)..6(sábado). Mapeia pro código usado no backend.
        const JS_DAY_TO_CODE = { 0: 'domingo', 1: 'segunda', 2: 'terca', 3: 'quarta', 4: 'quinta', 5: 'sexta', 6: 'sabado' };

        // Ao trocar a matéria, libera/reinicia o campo de data (o horário
        // disponível depende de qual matéria foi escolhida).
        document.getElementById("bookingMateria").addEventListener("change", (e) => {
            const dateInput = document.getElementById("bookingDate");
            const selectTime = document.getElementById("bookingTime");
            const wrap = document.getElementById("bookingHorarioWrap");
            const aviso = document.getElementById("bookingDateAviso");

            dateInput.disabled = !e.target.value;
            dateInput.value = '';
            selectTime.innerHTML = '<option value="">Selecione a data primeiro</option>';
            wrap.classList.add("hidden");
            aviso.classList.add("hidden");
        });

        // Ao escolher a data, filtra a lista de janelas pra só mostrar as que
        // são da matéria escolhida E caem naquele dia da semana — e avisa
        // claramente se o professor não atende essa matéria naquele dia (em
        // vez de deixar marcar uma combinação inválida).
        document.getElementById("bookingDate").addEventListener("change", (e) => {
            const selectTime = document.getElementById("bookingTime");
            const aviso = document.getElementById("bookingDateAviso");
            const avisoTexto = aviso.querySelector("span");
            const wrap = document.getElementById("bookingHorarioWrap");
            const materiaId = document.getElementById("bookingMateria").value;

            selectTime.innerHTML = '';
            wrap.classList.add("hidden");

            if (!e.target.value) {
                selectTime.innerHTML = '<option value="">Selecione a data primeiro</option>';
                aviso.classList.add("hidden");
                return;
            }

            const [ano, mes, dia] = e.target.value.split('-').map(Number);
            const diaSemanaEscolhido = JS_DAY_TO_CODE[new Date(ano, mes - 1, dia).getDay()];

            const disponibilidadesDaMateria = disponibilidades.filter(d => String(d.disciplina) === String(materiaId));
            const janelasDoDia = ordenarJanelas(disponibilidadesDaMateria.filter(d => d.dia_semana === diaSemanaEscolhido));

            if (janelasDoDia.length === 0) {
                const diasQueAtende = [...new Set(disponibilidadesDaMateria.map(d => d.dia_semana))]
                    .sort((a, b) => ORDEM_DIAS_SEMANA.indexOf(a) - ORDEM_DIAS_SEMANA.indexOf(b))
                    .map(d => DIA_SEMANA_LABEL[d] || d)
                    .join(', ');
                avisoTexto.textContent = `O professor não atende essa matéria ${DIA_SEMANA_PLURAL[diaSemanaEscolhido]}.` +
                    (diasQueAtende ? ` Dias disponíveis para essa matéria: ${diasQueAtende}.` : ' Nenhum horário cadastrado para essa matéria no momento.');
                aviso.classList.remove("hidden");
                selectTime.innerHTML = '<option value="">Nenhuma janela nesse dia</option>';
                refreshIcons();
                return;
            }

            aviso.classList.add("hidden");
            selectTime.innerHTML = '<option value="">Selecione um horário</option>' +
                janelasDoDia.map(d => `<option value="${d.id}">${DIA_SEMANA_LABEL[d.dia_semana] || d.dia_semana} - ${d.horario_inicio.slice(0, 5)} às ${d.horario_fim.slice(0, 5)}</option>`).join('');
        });

        // Recalcula o min/max do horário de início (conforme a duração escolhida
        // cabe na janela) e o preço proporcional, sempre que a janela ou a
        // duração mudam.
        function atualizarHorarioEPreco() {
            const disp = disponibilidades.find(d => String(d.id) === document.getElementById("bookingTime").value);
            const wrap = document.getElementById("bookingHorarioWrap");
            const input = document.getElementById("bookingHorario");
            const faixa = document.getElementById("bookingHorarioFaixa");
            const precoEl = document.getElementById("bookingPrecoCalculado");
            const btnPrecoEl = document.getElementById("bookingBtnPreco");

            if (!disp) {
                wrap.classList.add("hidden");
                return;
            }

            const duracaoMin = parseInt(document.getElementById("bookingDuracao").value, 10);
            const inicio = disp.horario_inicio.slice(0, 5);
            const fimJanela = disp.horario_fim.slice(0, 5);
            const [fh, fm] = fimJanela.split(':').map(Number);
            // Último início possível = fim da janela menos a duração escolhida.
            const fimMinutos = fh * 60 + fm - duracaoMin;

            if (fimMinutos < (() => { const [ih, im] = inicio.split(':').map(Number); return ih * 60 + im; })()) {
                // Duração escolhida não cabe nem uma vez nessa janela.
                faixa.textContent = `(essa duração não cabe nessa janela, que vai até ${fimJanela})`;
                input.min = '';
                input.max = '';
                wrap.classList.remove("hidden");
                return;
            }

            const ultimoInicio = minutosParaHHMM(fimMinutos);

            // Aula para hoje: só a partir de agora + 1h (arredondado para cima
            // de 5 em 5 minutos), além de respeitar o início da janela.
            let menorInicio = inicio;
            const ehHoje = document.getElementById("bookingDate").value === dataLocalISO(new Date());
            if (ehHoje) {
                const agora = new Date();
                const minimoHoje = Math.ceil((agora.getHours() * 60 + agora.getMinutes() + ANTECEDENCIA_MINIMA_MINUTOS) / 5) * 5;
                if (minimoHoje > fimMinutos) {
                    faixa.textContent = `(hoje não dá mais tempo nessa janela — é preciso agendar com 1h de antecedência; escolha outra data)`;
                    input.min = '';
                    input.max = '';
                    wrap.classList.remove("hidden");
                    atualizarAvisoReembolso();
                    return;
                }
                if (minutosParaHHMM(minimoHoje) > menorInicio) menorInicio = minutosParaHHMM(minimoHoje);
            }

            input.min = menorInicio;
            input.max = ultimoInicio;
            if (!input.value || input.value < menorInicio || input.value > ultimoInicio) {
                input.value = menorInicio;
            }
            faixa.textContent = ehHoje && menorInicio !== inicio
                ? `(hoje, entre ${menorInicio} e ${ultimoInicio} — mínimo de 1h de antecedência)`
                : `(entre ${inicio} e ${ultimoInicio}, janela até ${fimJanela})`;
            wrap.classList.remove("hidden");
            atualizarAvisoReembolso();

            const preco = teacher.price * duracaoMin / 60;
            const precoTexto = preco.toFixed(2).replace('.', ',');
            if (precoEl) precoEl.textContent = precoTexto;
            if (btnPrecoEl) btnPrecoEl.textContent = precoTexto;
        }

        // RN05: cancelamento do aluno com menos de 24h não tem reembolso — avisa
        // antes de pagar quando a aula escolhida já está dentro dessa janela.
        function atualizarAvisoReembolso() {
            const avisoEl = document.getElementById("bookingAviso24h");
            const dataVal = document.getElementById("bookingDate").value;
            const horarioVal = document.getElementById("bookingHorario").value;
            if (!avisoEl) return;
            if (!dataVal || !horarioVal) {
                avisoEl.classList.add("hidden");
                return;
            }
            const [ano, mes, dia] = dataVal.split('-').map(Number);
            const [hh, mm] = horarioVal.split(':').map(Number);
            const horasAteAula = (new Date(ano, mes - 1, dia, hh, mm) - new Date()) / 3600000;
            avisoEl.classList.toggle("hidden", horasAteAula >= 24);
        }

        // Busca os horários já ocupados dessa janela nessa data específica, pra
        // avisar o aluno JÁ aqui (não só depois, quando tentar pagar).
        async function carregarOcupadosEChecar() {
            const dispId = document.getElementById("bookingTime").value;
            const dataVal = document.getElementById("bookingDate").value;
            horariosOcupados = [];
            if (dispId && dataVal) {
                try {
                    const resp = await apiFetch(`/api/disponibilidades/${dispId}/ocupados/?data=${dataVal}`);
                    if (resp.ok) horariosOcupados = await resp.json();
                } catch (erro) {
                    console.error('Erro ao verificar horários ocupados:', erro);
                }
            }
            verificarConflito();
        }

        // Compara o horário/duração escolhidos com as faixas já ocupadas e
        // mostra o aviso + trava o botão de ir pro pagamento se bater.
        function verificarConflito() {
            const aviso = document.getElementById("bookingConflitoAviso");
            const btn = document.getElementById("btnIrPagamento");
            const horarioVal = document.getElementById("bookingHorario").value;
            const duracaoMin = parseInt(document.getElementById("bookingDuracao").value, 10);

            if (!horarioVal || !duracaoMin || horariosOcupados.length === 0) {
                aviso.classList.add("hidden");
                if (btn) btn.disabled = false;
                return;
            }

            const [hh, mm] = horarioVal.split(':').map(Number);
            const inicioMin = hh * 60 + mm;
            const fimMin = inicioMin + duracaoMin;

            const temConflito = horariosOcupados.some(o => {
                const [oh, om] = o.horario.split(':').map(Number);
                const [ofh, ofm] = o.horarioFim.split(':').map(Number);
                const ocupadoInicio = oh * 60 + om;
                const ocupadoFim = ofh * 60 + ofm;
                return inicioMin < ocupadoFim && fimMin > ocupadoInicio;
            });

            aviso.classList.toggle("hidden", !temConflito);
            if (btn) btn.disabled = temConflito;
        }

        document.getElementById("bookingTime").addEventListener("change", () => {
            atualizarHorarioEPreco();
            carregarOcupadosEChecar();
        });
        document.getElementById("bookingDuracao").addEventListener("change", () => {
            atualizarHorarioEPreco();
            verificarConflito();
        });
        document.getElementById("bookingHorario").addEventListener("input", () => {
            verificarConflito();
            atualizarAvisoReembolso();
        });

        document.getElementById("bookingForm").addEventListener("submit", (e) => {
            e.preventDefault();
            const dateVal = document.getElementById("bookingDate").value;
            const disponibilidadeId = document.getElementById("bookingTime").value;
            const horarioVal = document.getElementById("bookingHorario").value;
            const duracaoVal = parseInt(document.getElementById("bookingDuracao").value, 10);
            const materiaSelect = document.getElementById("bookingMateria");
            const contentVal = materiaSelect.options[materiaSelect.selectedIndex]?.text || '';

            if (!disponibilidadeId) {
                showToast("Selecione um dia disponível.", 'error');
                return;
            }
            const inputHorario = document.getElementById("bookingHorario");
            const ehHoje = dateVal === dataLocalISO(new Date());
            if (ehHoje && inputHorario.min && horarioVal && horarioVal < inputHorario.min) {
                showToast(`Para hoje, escolha um horário a partir de ${inputHorario.min} (é preciso agendar com pelo menos 1 hora de antecedência).`, 'error');
                return;
            }
            if (!horarioVal || !inputHorario.min || !inputHorario.max || horarioVal < inputHorario.min || horarioVal > inputHorario.max) {
                showToast(ehHoje
                    ? "Hoje não dá mais tempo de agendar nessa janela (é preciso 1 hora de antecedência). Escolha outra data."
                    : "Escolha um horário de início que caiba a duração selecionada dentro da janela do professor.", 'error');
                return;
            }
            verificarConflito();
            if (document.getElementById("btnIrPagamento")?.disabled) {
                showToast("Esse horário já está ocupado na agenda do professor. Escolha outro horário.", 'error');
                return;
            }

            const metodoEscolhido = document.querySelector('input[name="paymentMethod"]:checked')?.value || 'PIX';
            const precoFinal = teacher.price * duracaoVal / 60;

            tempBooking = {
                disponibilidade: disponibilidadeId,
                data: dateVal,
                horario: horarioVal,
                duracao_minutos: duracaoVal,
                conteudo: contentVal,
                metodo: metodoEscolhido,
            };

            // Mostra só a tela de pagamento do método escolhido, com o valor já calculado.
            document.getElementById("paymentPix").classList.toggle("hidden", metodoEscolhido !== "PIX");
            document.getElementById("paymentCartao").classList.toggle("hidden", metodoEscolhido !== "cartao");
            document.getElementById("paymentBoleto").classList.toggle("hidden", metodoEscolhido !== "boleto");
            const boletoLinha = document.getElementById("bookingBoletoLinha");
            if (boletoLinha) {
                boletoLinha.value = `34191.79001 01043.510047 91020.150008 8 96520000${String(Math.round(precoFinal * 100)).padStart(6, '0')}`;
            }

            document.getElementById("bookingStep1").classList.add("hidden");
            document.getElementById("bookingStep2").classList.remove("hidden");
        });

        document.getElementById("btnConfirmPayment").addEventListener("click", async () => {
            if (!tempBooking) return;

            try {
                const resp = await apiFetch('/api/aulas/', {
                    method: 'POST',
                    body: JSON.stringify(tempBooking),
                });
                const data = await resp.json();

                if (!resp.ok) {
                    const mensagem = Array.isArray(data)
                        ? data.join(' ')
                        : (data.non_field_errors?.[0] || data.detail || 'Não foi possível confirmar o agendamento.');
                    showToast(mensagem, 'error');
                    return;
                }

                modal.classList.add("hidden");
                showToast(`Aula agendada com sucesso com ${teacher.name}! Redirecionando para Meus Professores...`, 'success');
                await carregarAulas();
                switchView("meusprofessores");
            } catch (erro) {
                console.error('Erro ao confirmar agendamento:', erro);
                showToast('Erro ao confirmar o agendamento. Tente novamente.', 'error');
            }
        });
    }

    // 7. ÁREA DO ALUNO
    function renderStudentDashboard() {
        const studentView = document.getElementById("view-student");
        if (!studentView) return;

        // bookingsList já vem filtrado pelo backend para o usuário autenticado.
        const myBookings = bookingsList;

        studentView.innerHTML = `
            <div class="space-y-6">
                <div>
                    <h2 class="text-2xl font-black text-slate-900 flex items-center gap-2"><i data-lucide="graduation-cap" class="w-6 h-6 text-indigo-600"></i> Área do Aluno</h2>
                    <p class="text-xs text-slate-500 mt-1">Gerencie seus dados, preferências e pagamentos. Suas aulas e professores ficam na aba "Meus Professores".</p>
                </div>

                ${renderDadosPessoaisCard()}
                ${renderPreferenciasEstudoCard()}
                ${renderPagamentosContaSection(myBookings)}
            </div>
        `;
        refreshIcons();

        const formAvatarAluno = document.getElementById("formAvatarAluno");
        if (formAvatarAluno) {
            formAvatarAluno.addEventListener("submit", async (e) => {
                e.preventDefault();
                const file = document.getElementById("inputAvatarAlunoFile").files[0];
                if (!file) return;
                await enviarAvatarAlunoAPI(file);
            });
        }

        const formMeuPerfilAluno = document.getElementById("formMeuPerfilAluno");
        if (formMeuPerfilAluno) {
            formMeuPerfilAluno.addEventListener("submit", async (e) => {
                e.preventDefault();
                const nome = document.getElementById("inputNomeAluno").value.trim();
                const telefone = document.getElementById("inputTelefoneAluno").value.trim();
                const sobre = document.getElementById("inputSobreAluno").value.trim();
                await atualizarMeuPerfilAlunoAPI({ nome, telefone, sobre });
            });
        }

        const formPreferenciasAluno = document.getElementById("formPreferenciasAluno");
        if (formPreferenciasAluno) {
            formPreferenciasAluno.addEventListener("submit", async (e) => {
                e.preventDefault();
                const nivel_academico = document.getElementById("inputNivelAcademico").value;
                const objetivo = document.getElementById("inputObjetivoAluno").value;
                await atualizarMeuPerfilAlunoAPI({ nivel_academico, objetivo });
            });
        }

        const formAdicionarMateriaInteresse = document.getElementById("formAdicionarMateriaInteresse");
        if (formAdicionarMateriaInteresse) {
            formAdicionarMateriaInteresse.addEventListener("submit", async (e) => {
                e.preventDefault();
                const input = document.getElementById("inputNovaMateriaInteresse");
                const nova = input.value.trim();
                if (!nova) return;
                const atuais = meuPerfilAluno?.materias_interesse || [];
                if (atuais.some(m => normalizarTexto(m) === normalizarTexto(nova))) {
                    showToast('Essa matéria já está na sua lista.', 'error');
                    return;
                }
                if (atuais.length >= 10) {
                    showToast('Você pode adicionar no máximo 10 matérias de interesse.', 'error');
                    return;
                }
                await atualizarMeuPerfilAlunoAPI({ materias_interesse: [...atuais, nova] });
            });
        }

        document.querySelectorAll(".btn-remover-materia-interesse").forEach(btn => {
            btn.addEventListener("click", async () => {
                const materia = btn.getAttribute("data-materia");
                const atuais = meuPerfilAluno?.materias_interesse || [];
                await atualizarMeuPerfilAlunoAPI({ materias_interesse: atuais.filter(m => m !== materia) });
            });
        });

        const formAdicionarCartao = document.getElementById("formAdicionarCartao");
        if (formAdicionarCartao) {
            formAdicionarCartao.addEventListener("submit", async (e) => {
                e.preventDefault();
                const apelido = document.getElementById("inputCartaoApelido").value.trim();
                const bandeira = document.getElementById("inputCartaoBandeira").value;
                const ultimos_digitos = document.getElementById("inputCartaoDigitos").value.trim();
                const validade = document.getElementById("inputCartaoValidade").value.trim();
                await adicionarCartaoAPI({ apelido, bandeira, ultimos_digitos, validade });
            });
        }

        document.querySelectorAll(".btn-remover-cartao").forEach(btn => {
            btn.addEventListener("click", async () => {
                const ok = await showConfirm("Remover este cartão salvo?", { title: "Remover cartão", variant: "danger" });
                if (ok) removerCartaoAPI(btn.getAttribute("data-cartao-id"));
            });
        });
    }

    // --- Seção 1: Dados Pessoais (foto, nome, e-mail, telefone, sobre mim) ---
    function renderDadosPessoaisCard() {
        const p = meuPerfilAluno;
        if (!p) return '';
        return `
            <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
                <h3 class="font-bold text-slate-900 text-sm flex items-center gap-1.5"><i data-lucide="user" class="w-4 h-4 text-indigo-600"></i> Dados Pessoais</h3>

                <div class="flex items-center gap-3">
                    ${p.avatarUrl
                        ? `<img src="${p.avatarUrl}" alt="Sua foto" class="w-16 h-16 rounded-xl object-cover border border-slate-200">`
                        : `<div class="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400"><i data-lucide="user" class="w-7 h-7"></i></div>`
                    }
                    <form id="formAvatarAluno" class="flex-1 flex flex-col sm:flex-row gap-2">
                        <input type="file" id="inputAvatarAlunoFile" accept="image/png,image/jpeg,image/webp" required class="flex-1 text-xs border border-slate-200 rounded-lg px-2 py-1.5">
                        <button type="submit" class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition whitespace-nowrap">
                            ${p.avatarUrl ? 'Trocar Foto' : 'Enviar Foto'}
                        </button>
                    </form>
                </div>

                <form id="formMeuPerfilAluno" class="space-y-3 pt-2 border-t border-slate-100">
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label class="block text-xs font-bold text-slate-600 mb-1">Nome Completo</label>
                            <input type="text" id="inputNomeAluno" value="${p.nome || ''}" required class="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-indigo-500">
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-600 mb-1">Telefone</label>
                            <input type="tel" id="inputTelefoneAluno" value="${p.telefone || ''}" placeholder="(00) 00000-0000" class="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-indigo-500">
                        </div>
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-600 mb-1">E-mail</label>
                        <div class="flex gap-2">
                            <input type="email" value="${escapeHtml(p.email || '')}" disabled class="flex-1 min-w-0 px-3 py-2 border border-slate-200 bg-slate-50 text-slate-400 rounded-xl text-sm cursor-not-allowed">
                            <button type="button" class="btn-alterar-email px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition whitespace-nowrap">Alterar</button>
                        </div>
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-600 mb-1">Sobre mim</label>
                        <textarea id="inputSobreAluno" rows="2" placeholder="Conte um pouco sobre você, suas matérias favoritas ou objetivos..." class="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-indigo-500">${p.sobre || ''}</textarea>
                    </div>
                    <button type="submit" class="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition">Salvar Perfil</button>
                </form>
            </div>
        `;
    }

    // --- Seção 2: Preferências de Estudo (nível acadêmico, objetivo, matérias de interesse) ---
    function renderPreferenciasEstudoCard() {
        const p = meuPerfilAluno;
        if (!p) return '';
        const materias = p.materias_interesse || [];
        return `
            <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
                <h3 class="font-bold text-slate-900 text-sm flex items-center gap-1.5"><i data-lucide="target" class="w-4 h-4 text-indigo-600"></i> Preferências de Estudo</h3>

                <form id="formPreferenciasAluno" class="space-y-3">
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label class="block text-xs font-bold text-slate-600 mb-1">Nível acadêmico</label>
                            <select id="inputNivelAcademico" class="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-indigo-500">
                                <option value="">Selecione...</option>
                                ${NIVEL_ACADEMICO_OPCOES.map(o => `<option value="${o.value}" ${p.nivel_academico === o.value ? 'selected' : ''}>${o.label}</option>`).join('')}
                            </select>
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-600 mb-1">Objetivo principal</label>
                            <select id="inputObjetivoAluno" class="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-indigo-500">
                                <option value="">Selecione...</option>
                                ${OBJETIVO_OPCOES.map(o => `<option value="${o.value}" ${p.objetivo === o.value ? 'selected' : ''}>${o.label}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                    <button type="submit" class="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition">Salvar Preferências</button>
                </form>

                <div class="pt-3 border-t border-slate-100 space-y-2">
                    <label class="block text-xs font-bold text-slate-600">Matérias de interesse</label>
                    <div class="flex flex-wrap gap-1.5">
                        ${materias.length === 0
                            ? `<p class="text-xs text-slate-400">Nenhuma matéria adicionada ainda.</p>`
                            : materias.map(m => `
                                <span class="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-indigo-100">
                                    ${m}
                                    <button type="button" class="btn-remover-materia-interesse hover:text-rose-600" data-materia="${m}"><i data-lucide="x" class="w-3 h-3"></i></button>
                                </span>
                            `).join('')
                        }
                    </div>
                    <form id="formAdicionarMateriaInteresse" class="flex gap-2">
                        <input type="text" id="inputNovaMateriaInteresse" placeholder="Ex: Matemática, Inglês..." maxlength="100" class="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-indigo-500">
                        <button type="submit" class="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl transition whitespace-nowrap">Adicionar</button>
                    </form>
                </div>
            </div>
        `;
    }

    // --- Seção 3: Minhas Aulas & Favoritos ---
    // Aba "Meus Professores" do aluno — espelho da aba "Meus Alunos" do professor:
    // aulas agendadas (com chat/vídeo/cancelar), aulas para avaliar e favoritos.
    function renderMeusProfessoresView() {
        const view = document.getElementById("view-meusprofessores");
        if (!view) return;

        if (currentUser && currentUser.role !== "student" && currentUser.role !== "admin") {
            view.innerHTML = `
                <div class="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-2">
                    <i data-lucide="lock" class="w-9 h-9 mx-auto text-slate-300"></i>
                    <h3 class="font-bold text-slate-800">Acesso Restrito</h3>
                    <p class="text-xs text-slate-500">Esta área é destinada apenas para alunos cadastrados.</p>
                </div>
            `;
            refreshIcons();
            return;
        }

        view.innerHTML = `
            <div class="space-y-6">
                <div>
                    <h2 class="text-2xl font-black text-slate-900 flex items-center gap-2"><i data-lucide="users" class="w-6 h-6 text-indigo-600"></i> Meus Professores</h2>
                    <p class="text-xs text-slate-500 mt-1">Suas aulas agendadas, conversas com os professores, aulas para avaliar e professores favoritos.</p>
                </div>
                ${renderMinhasAulasFavoritosSection(bookingsList)}
            </div>
        `;
        refreshIcons();

        view.querySelectorAll(".btn-open-chat").forEach(btn => {
            btn.addEventListener("click", () => {
                abrirModalChat(btn.getAttribute("data-booking-id"), btn.getAttribute("data-chat-with"), btn.getAttribute("data-somente-leitura") === "1");
            });
        });

        view.querySelectorAll(".btn-open-video").forEach(btn => {
            btn.addEventListener("click", () => {
                abrirSalaVideo(btn.getAttribute("data-booking-id"), btn.getAttribute("data-chat-with"));
            });
        });

        view.querySelectorAll(".btn-cancelar-aula").forEach(btn => {
            btn.addEventListener("click", async () => {
                const aula = bookingsList.find(b => String(b.id) === btn.getAttribute("data-booking-id"));
                const texto = aula ? textoConfirmacaoCancelamento(aula, 'aluno') : "Tem certeza que deseja cancelar esta aula?";
                const ok = await showConfirm(texto, { title: "Cancelar aula", variant: "danger" });
                if (ok) cancelarAulaAPI(btn.getAttribute("data-booking-id"));
            });
        });

        view.querySelectorAll(".form-avaliar").forEach(form => {
            form.addEventListener("submit", (e) => {
                e.preventDefault();
                const nota = parseInt(form.querySelector(".avaliar-nota").value, 10);
                const comentario = form.querySelector(".avaliar-comentario").value.trim();
                enviarAvaliacaoAPI(form.getAttribute("data-booking-id"), nota, comentario);
            });
        });

        view.querySelectorAll(".btn-remover-favorito").forEach(btn => {
            btn.addEventListener("click", () => {
                alternarFavoritoAPI(parseInt(btn.getAttribute("data-teacher-id")), true);
            });
        });

        aplicarAvisosMensagens();
    }

    function renderMinhasAulasFavoritosSection(myBookings) {
        const proximasAulas = myBookings.filter(b => b.status === 'pendente' || b.status === 'confirmado');
        // Aulas concluídas que ainda podem ser avaliadas, ou que já foram — é aqui
        // que o formulário/estrelas de avaliação aparece pro aluno.
        const aulasParaAvaliar = myBookings.filter(b => b.status === 'concluido' && (b.canAvaliar || b.avaliacao));
        const aulasCanceladas = myBookings.filter(b => b.status === 'cancelado');

        return `
            <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
                <h3 class="font-bold text-slate-900 text-sm flex items-center gap-1.5"><i data-lucide="calendar-check" class="w-4 h-4 text-indigo-600"></i> Minhas Aulas & Favoritos</h3>

                <div class="space-y-3">
                    <h4 class="text-xs font-bold text-slate-500 uppercase tracking-wide">Aulas agendadas</h4>
                    ${proximasAulas.length === 0 ? `
                        <div class="bg-slate-50 rounded-xl p-6 text-center space-y-2">
                            <i data-lucide="book-open" class="w-7 h-7 mx-auto text-slate-300"></i>
                            <p class="text-xs text-slate-500">Você não possui aulas agendadas no momento.</p>
                            <button onclick="document.querySelector('[data-view=home]').click()" class="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-sm hover:bg-indigo-700 transition">
                                Buscar Professores
                            </button>
                        </div>
                    ` : `
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            ${proximasAulas.map(b => bookingCardAluno(b)).join('')}
                        </div>
                    `}
                </div>

                ${aulasParaAvaliar.length > 0 ? `
                    <div class="space-y-3 pt-3 border-t border-slate-100">
                        <h4 class="text-xs font-bold text-slate-500 uppercase tracking-wide">Aulas concluídas <span class="normal-case font-semibold text-slate-400">— avalie o professor</span></h4>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            ${aulasParaAvaliar.map(b => bookingConcluidaCardAluno(b)).join('')}
                        </div>
                    </div>
                ` : ''}

                ${aulasCanceladas.length > 0 ? `
                    <div class="space-y-3 pt-3 border-t border-slate-100">
                        <h4 class="text-xs font-bold text-slate-500 uppercase tracking-wide">Aulas canceladas</h4>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            ${aulasCanceladas.map(b => bookingCanceladaCardAluno(b)).join('')}
                        </div>
                    </div>
                ` : ''}

                <div class="space-y-3 pt-3 border-t border-slate-100">
                    <h4 class="text-xs font-bold text-slate-500 uppercase tracking-wide">Professores favoritos</h4>
                    ${meusFavoritos.length === 0 ? `
                        <p class="text-xs text-slate-400">Você ainda não salvou nenhum professor. Clique no ❤ no card de um professor para salvá-lo aqui.</p>
                    ` : `
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            ${meusFavoritos.map(f => `
                                <div class="flex items-center gap-3 bg-slate-50 rounded-xl p-3 border border-slate-100">
                                    <img src="${f.avatar}" class="w-12 h-12 rounded-xl object-cover border border-slate-200">
                                    <div class="flex-1 min-w-0">
                                        <p class="font-bold text-slate-900 text-sm truncate">${f.name}</p>
                                        <p class="text-xs text-indigo-600 font-semibold truncate">${f.subject}</p>
                                        <p class="text-xs text-slate-500">R$ ${f.price.toFixed(2).replace('.', ',')} · ★ ${f.rating.toFixed(1)}</p>
                                    </div>
                                    <button class="btn-remover-favorito p-1.5 rounded-lg hover:bg-rose-50 text-rose-500 transition shrink-0" data-teacher-id="${f.id}" title="Remover dos favoritos">
                                        <i data-lucide="heart-off" class="w-4 h-4"></i>
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                    `}
                </div>
            </div>
        `;
    }

    // --- Seção 4: Pagamentos & Conta ---
    function renderPagamentosContaSection(myBookings) {
        return `
            <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
                <h3 class="font-bold text-slate-900 text-sm flex items-center gap-1.5"><i data-lucide="wallet" class="w-4 h-4 text-indigo-600"></i> Pagamentos & Conta</h3>

                <div class="space-y-2">
                    <h4 class="text-xs font-bold text-slate-500 uppercase tracking-wide">Histórico de transações</h4>
                    ${myBookings.length === 0 ? `
                        <p class="text-xs text-slate-400">Nenhuma transação até o momento.</p>
                    ` : `
                        <div class="overflow-x-auto -mx-1">
                            <table class="w-full text-xs">
                                <thead>
                                    <tr class="text-left text-slate-400 border-b border-slate-100">
                                        <th class="py-2 px-1 font-semibold">Data</th>
                                        <th class="py-2 px-1 font-semibold">Professor</th>
                                        <th class="py-2 px-1 font-semibold">Método</th>
                                        <th class="py-2 px-1 font-semibold">Valor</th>
                                        <th class="py-2 px-1 font-semibold">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${myBookings.map(b => `
                                        <tr class="border-b border-slate-50">
                                            <td class="py-2 px-1 text-slate-600 whitespace-nowrap">${b.date}</td>
                                            <td class="py-2 px-1 text-slate-800 font-semibold whitespace-nowrap">${b.teacherName}</td>
                                            <td class="py-2 px-1 text-slate-600 whitespace-nowrap">${b.paymentMethod}</td>
                                            <td class="py-2 px-1 text-slate-800 font-bold whitespace-nowrap">R$ ${b.price.toFixed(2).replace('.', ',')}</td>
                                            <td class="py-2 px-1 whitespace-nowrap"><span class="px-2 py-0.5 rounded-md text-[10px] font-bold ${statusPillClass(b.status)}">${b.status}</span></td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    `}
                </div>

                <div class="space-y-2 pt-3 border-t border-slate-100">
                    <h4 class="text-xs font-bold text-slate-500 uppercase tracking-wide">Cartões salvos</h4>
                    ${meusCartoes.length === 0 ? `<p class="text-xs text-slate-400">Nenhum cartão salvo.</p>` : `
                        <div class="space-y-2">
                            ${meusCartoes.map(c => `
                                <div class="flex items-center justify-between gap-3 bg-slate-50 rounded-xl p-3 border border-slate-100">
                                    <div class="flex items-center gap-2.5 min-w-0">
                                        <i data-lucide="credit-card" class="w-5 h-5 text-indigo-600 shrink-0"></i>
                                        <div class="min-w-0">
                                            <p class="text-xs font-bold text-slate-800 truncate">${c.apelido || bandeiraLabel(c.bandeira)} •••• ${c.ultimos_digitos}</p>
                                            <p class="text-[11px] text-slate-500">${bandeiraLabel(c.bandeira)} · válido até ${c.validade}</p>
                                        </div>
                                    </div>
                                    <button class="btn-remover-cartao p-1.5 rounded-lg hover:bg-rose-50 text-rose-500 transition shrink-0" data-cartao-id="${c.id}" title="Remover cartão">
                                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                    `}

                    <form id="formAdicionarCartao" class="grid grid-cols-2 gap-2 pt-2">
                        <input type="text" id="inputCartaoApelido" placeholder="Apelido (opcional)" maxlength="50" class="col-span-2 px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-indigo-500">
                        <select id="inputCartaoBandeira" class="px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-indigo-500">
                            ${BANDEIRA_OPCOES.map(o => `<option value="${o.value}">${o.label}</option>`).join('')}
                        </select>
                        <input type="text" id="inputCartaoDigitos" placeholder="Últimos 4 dígitos" maxlength="4" inputmode="numeric" pattern="[0-9]{4}" required class="px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-indigo-500">
                        <input type="text" id="inputCartaoValidade" placeholder="MM/AAAA" maxlength="7" required class="px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-indigo-500">
                        <button type="submit" class="col-span-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition">Adicionar Cartão</button>
                    </form>
                    <p class="text-[10px] text-slate-400">Guardamos só os 4 últimos dígitos e a validade — nunca o número completo ou o código de segurança.</p>
                </div>
            </div>
        `;
    }

    // Card individual de uma aula agendada, na visão do aluno.
    function bookingCardAluno(b) {
        return `
            <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
                <div class="flex items-center gap-3">
                    <img src="${b.teacherAvatar}" class="w-14 h-14 rounded-xl object-cover border border-slate-100">
                    <div>
                        <h4 class="font-bold text-slate-900 text-sm">${b.teacherName}</h4>
                        <p class="text-xs font-semibold text-indigo-600">${b.subject}</p>
                        <span class="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md mt-1 border border-emerald-100">
                            <i data-lucide="check" class="w-2.5 h-2.5"></i> Pagamento ${b.paymentMethod} Confirmado
                        </span>
                    </div>
                </div>

                <div class="bg-slate-50 p-3 rounded-xl space-y-1 text-xs">
                    <p class="text-slate-700"><strong>Data:</strong> ${b.date}, ${b.time}–${b.endTime}</p>
                    <p class="text-slate-700"><strong>Conteúdo:</strong> ${b.content}</p>
                    <p class="text-slate-700"><strong>Valor:</strong> R$ ${b.price.toFixed(2).replace('.', ',')}</p>
                    <p class="text-slate-700"><strong>Status:</strong> ${b.status}</p>
                    ${refundBadge(b)}
                    ${b.canCancel ? (new Date() < prazoReembolsoIntegral(b)
                        ? `<p class="text-[11px] text-emerald-700 mt-1 flex items-center gap-1"><i data-lucide="shield-check" class="w-3 h-3"></i> Reembolso integral (${formatarReais(b.price)}) se cancelar até ${formatarDataHora(prazoReembolsoIntegral(b))}. Depois disso: R$ 0,00.</p>`
                        : `<p class="text-[11px] text-amber-700 mt-1 flex items-center gap-1"><i data-lucide="info" class="w-3 h-3"></i> Menos de 24h para a aula: cancelar agora não dá reembolso (R$ 0,00).</p>`) : ''}
                </div>

                <button class="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition shadow-sm flex items-center justify-center gap-2 btn-open-chat" data-booking-id="${b.id}" data-chat-with="${escapeHtml(b.teacherName)}" data-somente-leitura="${conversaEncerrada(b) ? '1' : ''}">
                    <i data-lucide="message-circle" class="w-4 h-4"></i> ${conversaEncerrada(b) ? 'Ver conversa' : 'Abrir Chat com o Professor'}
                </button>

                ${podeEntrarNaAula(b) ? `
                    <button class="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition shadow-sm flex items-center justify-center gap-2 btn-open-video" data-booking-id="${b.id}" data-chat-with="${b.teacherName}">
                        <i data-lucide="video" class="w-4 h-4"></i> Entrar na Aula
                    </button>
                ` : ''}

                ${b.canCancel ? `
                    <button class="w-full py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-xl transition btn-cancelar-aula" data-booking-id="${b.id}">
                        Cancelar Aula / Solicitar Reembolso
                    </button>
                ` : seloSituacaoAula(b, 'aluno')}

                ${avaliacaoSectionAluno(b)}
            </div>
        `;
    }

    // Card de uma aula já concluída — só o essencial + o bloco de avaliação
    // (formulário se ainda não avaliou, ou a nota/comentário já enviados).
    function bookingConcluidaCardAluno(b) {
        return `
            <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
                <div class="flex items-center gap-3">
                    <img src="${b.teacherAvatar}" class="w-14 h-14 rounded-xl object-cover border border-slate-100">
                    <div>
                        <h4 class="font-bold text-slate-900 text-sm">${b.teacherName}</h4>
                        <p class="text-xs font-semibold text-indigo-600">${b.subject}</p>
                        <p class="text-[11px] text-slate-500 mt-0.5">${b.date}, ${b.time}–${b.endTime}</p>
                    </div>
                </div>
                ${avaliacaoSectionAluno(b)}
                ${botaoVerConversa(b)}
            </div>
        `;
    }

    // Aula concluída ou cancelada: a conversa continua disponível, só para leitura.
    function botaoVerConversa(b) {
        return `
            <button class="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 btn-open-chat" data-booking-id="${b.id}" data-chat-with="${escapeHtml(b.teacherName)}" data-somente-leitura="1">
                <i data-lucide="message-square-text" class="w-4 h-4"></i> Ver conversa
            </button>
        `;
    }

    function bookingCanceladaCardAluno(b) {
        return `
            <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between space-y-3">
                <div class="flex items-center gap-3">
                    <img src="${b.teacherAvatar}" class="w-12 h-12 rounded-xl object-cover border border-slate-100">
                    <div>
                        <h4 class="font-bold text-slate-900 text-sm">${escapeHtml(b.teacherName)}</h4>
                        <p class="text-xs font-semibold text-indigo-600">${escapeHtml(b.subject)}</p>
                        <p class="text-[11px] text-slate-500 mt-0.5">${b.date}, ${b.time}–${b.endTime}</p>
                    </div>
                </div>
                <div class="text-xs">${refundBadge(b)}</div>
                ${botaoVerConversa(b)}
            </div>
        `;
    }

    // Selo colorido por status de uma transação/aula
    function statusPillClass(status) {
        const mapa = {
            pendente: 'bg-amber-50 text-amber-700',
            confirmado: 'bg-emerald-50 text-emerald-700',
            cancelado: 'bg-red-50 text-red-700',
            concluido: 'bg-slate-100 text-slate-600',
        };
        return mapa[status] || 'bg-slate-100 text-slate-600';
    }

    // Nome de exibição de uma bandeira de cartão
    function bandeiraLabel(value) {
        const opcao = BANDEIRA_OPCOES.find(o => o.value === value);
        return opcao ? opcao.label : 'Cartão';
    }

    // Estrelas de uma avaliação (nota de 1 a 5) como texto ★/☆
    function estrelas(nota) {
        return '★'.repeat(nota) + '☆'.repeat(5 - nota);
    }

    // Já passou do horário de término da aula? (b.date "dd/mm/aaaa", b.endTime "HH:MM")
    // Usado pra esconder o botão "Entrar na Aula" mesmo se o professor ainda não
    // clicou em "Marcar como Concluída" — sem isso o botão de vídeo continua
    // aparecendo indefinidamente depois que a aula já aconteceu.
    function aulaJaPassou(b) {
        const [dia, mes, ano] = b.date.split('/').map(Number);
        const [hora, minuto] = b.endTime.split(':').map(Number);
        const fimDaAula = new Date(ano, mes - 1, dia, hora, minuto);
        return new Date() > fimDaAula;
    }

    // Chat só para leitura: aula cancelada/concluída ou horário da aula já terminou (mesma regra do backend).
    function conversaEncerrada(b) {
        return ['cancelado', 'concluido'].includes(b.status) || aulaJaPassou(b);
    }

    // Já passou do horário de início da aula?
    function aulaComecou(b) {
        const [dia, mes, ano] = b.date.split('/').map(Number);
        const [hora, minuto] = b.time.split(':').map(Number);
        return new Date() >= new Date(ano, mes - 1, dia, hora, minuto);
    }

    // Aula marcada (não cancelada/concluída) e ainda não terminou: dá para entrar na videochamada.
    function podeEntrarNaAula(b) {
        return ['pendente', 'confirmado'].includes(b.status) && !aulaJaPassou(b);
    }

    // Selo no lugar do "Cancelar" depois que a aula começa. `papel` = 'aluno' | 'professor'.
    function seloSituacaoAula(b, papel) {
        if (b.status === 'cancelado') return '';
        const selo = (icone, cor, titulo, detalhe) => `
            <div class="w-full rounded-xl px-3 py-2 border ${cor} text-xs flex items-start gap-2">
                <i data-lucide="${icone}" class="w-4 h-4 flex-shrink-0 mt-0.5"></i>
                <div><p class="font-bold">${titulo}</p>${detalhe ? `<p class="text-[11px] opacity-80 mt-0.5">${detalhe}</p>` : ''}</div>
            </div>`;
        if (b.status === 'concluido') {
            return selo('circle-check-big', 'bg-slate-50 border-slate-200 text-slate-700', 'Aula finalizada', '');
        }
        if (aulaJaPassou(b)) {
            return papel === 'professor'
                ? selo('circle-check-big', 'bg-amber-50 border-amber-200 text-amber-800', 'Aula finalizada', 'Confirme abaixo se a aula aconteceu ou se o aluno não compareceu.')
                : selo('circle-check-big', 'bg-slate-50 border-slate-200 text-slate-700', 'Aula finalizada', 'Aguardando o professor confirmar a conclusão para liberar a avaliação.');
        }
        if (aulaComecou(b)) {
            return selo('radio', 'bg-emerald-50 border-emerald-200 text-emerald-800', 'Aula em andamento', 'O cancelamento não está mais disponível.');
        }
        return '';
    }

    // Bloco de avaliação exibido no card do aluno: formulário (se puder avaliar)
    // ou a avaliação já enviada.
    function avaliacaoSectionAluno(b) {
        if (b.avaliacao) {
            return `
                <div class="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs space-y-1">
                    <p class="font-bold text-amber-600">${estrelas(b.avaliacao.nota)} <span class="text-slate-500 font-semibold">Sua avaliação</span></p>
                    ${b.avaliacao.comentario ? `<p class="text-slate-600">"${escapeHtml(b.avaliacao.comentario)}"</p>` : ''}
                </div>
            `;
        }

        if (!b.canAvaliar) return '';

        return `
            <form class="form-avaliar space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-100" data-booking-id="${b.id}">
                <label class="block text-xs font-bold text-slate-600">Avalie o professor desta aula</label>
                <select class="avaliar-nota w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs">
                    <option value="5">★★★★★ Excelente</option>
                    <option value="4">★★★★☆ Muito bom</option>
                    <option value="3">★★★☆☆ Bom</option>
                    <option value="2">★★☆☆☆ Regular</option>
                    <option value="1">★☆☆☆☆ Ruim</option>
                </select>
                <textarea class="avaliar-comentario w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs" rows="2" placeholder="Deixe um elogio ou crítica (opcional)"></textarea>
                <button type="submit" class="w-full py-2 bg-amber-400 hover:bg-amber-300 text-indigo-950 font-bold text-xs rounded-xl transition">
                    Enviar Avaliação
                </button>
            </form>
        `;
    }

    // 7.1 Selo visual do status de reembolso (usado nos dois dashboards)
    function refundBadge(b) {
        if (!b.refundStatus) return '';
        const cor = b.refundPercentage >= 100
            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
            : (b.refundPercentage > 0 ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-red-50 text-red-700 border-red-100');
        return `<span class="inline-block text-[10px] font-bold px-2 py-0.5 rounded-md border mt-1 ${cor}">${b.refundStatus}</span>`;
    }

    // 8. ÁREA DO PROFESSOR
    function renderTeacherDashboard() {
        const teacherView = document.getElementById("view-teacher");
        if (!teacherView) return;

        if (currentUser && currentUser.role !== "teacher" && currentUser.role !== "admin") {
            teacherView.innerHTML = `
                <div class="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-2">
                    <i data-lucide="lock" class="w-9 h-9 mx-auto text-slate-300"></i>
                    <h3 class="font-bold text-slate-800">Acesso Restrito</h3>
                    <p class="text-xs text-slate-500">Esta área é destinada apenas para professores cadastrados.</p>
                </div>
            `;
            refreshIcons();
            return;
        }

        teacherView.innerHTML = `
            <div class="space-y-6">
                <div>
                    <h2 class="text-2xl font-black text-slate-900 flex items-center gap-2"><i data-lucide="presentation" class="w-6 h-6 text-indigo-600"></i> Área do Professor</h2>
                    <p class="text-xs text-slate-500 mt-1">Gerencie seu perfil, currículo, disciplinas e horários disponíveis.</p>
                </div>

                ${currentUser.role === "teacher" ? renderCurriculoCard() : ''}
                ${currentUser.role === "teacher" ? renderMeuPerfilCard() : ''}
                ${currentUser.role === "teacher" ? renderVideoApresentacaoCard() : ''}
                ${currentUser.role === "teacher" ? renderDocumentoIdentidadeCard() : ''}
                ${currentUser.role === "teacher" ? renderDisciplinasCard() : ''}
                ${currentUser.role === "teacher" ? renderDisponibilidadeCard() : ''}
                ${currentUser.role === "teacher" ? renderCarteiraCard() : ''}
                ${currentUser.role === "teacher" ? renderReputacaoCard() : ''}
            </div>
        `;
        refreshIcons();

        const formCurriculo = document.getElementById("formCurriculo");
        if (formCurriculo) {
            formCurriculo.addEventListener("submit", async (e) => {
                e.preventDefault();
                const file = document.getElementById("inputCurriculo").files[0];
                if (!file) return;
                await enviarCurriculoAPI(file);
            });
        }

        const formAvatar = document.getElementById("formAvatar");
        if (formAvatar) {
            formAvatar.addEventListener("submit", async (e) => {
                e.preventDefault();
                const file = document.getElementById("inputAvatarFile").files[0];
                if (!file) return;
                await enviarAvatarAPI(file);
            });
        }

        const formMeuPerfil = document.getElementById("formMeuPerfil");
        if (formMeuPerfil) {
            formMeuPerfil.addEventListener("submit", async (e) => {
                e.preventDefault();
                const nome = document.getElementById("inputNomeProfessor").value.trim();
                const telefone = document.getElementById("inputTelefoneProfessor").value.trim();
                const biografia = document.getElementById("inputBiografia").value.trim();
                const preco_hora = document.getElementById("inputPrecoHora").value;
                const metodologia_ensino = document.getElementById("inputMetodologiaEnsino").value.trim();
                await atualizarMeuPerfilAPI({ nome, telefone, biografia, preco_hora, metodologia_ensino });
            });
        }

        const inputPrecoHora = document.getElementById("inputPrecoHora");
        const precoBreakdown = document.getElementById("precoBreakdown");
        if (inputPrecoHora && precoBreakdown) {
            const atualizarBreakdown = () => {
                const valorHora = parseFloat(inputPrecoHora.value);
                if (!valorHora || valorHora <= 0) {
                    precoBreakdown.textContent = '';
                    return;
                }
                precoBreakdown.textContent = DURACAO_OPCOES
                    .map(op => `${op.label}: R$ ${(valorHora * op.minutos / 60).toFixed(2).replace('.', ',')}`)
                    .join('  ·  ');
            };
            inputPrecoHora.addEventListener("input", atualizarBreakdown);
            atualizarBreakdown();
        }

        const formNovaDisciplina = document.getElementById("formNovaDisciplina");
        if (formNovaDisciplina) {
            formNovaDisciplina.addEventListener("submit", async (e) => {
                e.preventDefault();
                const nome = document.getElementById("inputNovaDisciplinaNome").value.trim();
                const descricao = document.getElementById("inputNovaDisciplinaDescricao").value.trim();
                if (!nome) return;
                await criarDisciplinaAPI(nome, descricao);
            });
        }

        document.querySelectorAll(".btn-remover-disciplina").forEach(btn => {
            btn.addEventListener("click", async () => {
                const ok = await showConfirm("Remover esta disciplina?", { title: "Remover disciplina", variant: "danger" });
                if (ok) removerDisciplinaAPI(btn.getAttribute("data-id"));
            });
        });

        // Grade semanal: marcar o dia libera os campos de início/fim daquele dia.
        document.querySelectorAll(".disp-dia-check").forEach(chk => {
            chk.addEventListener("change", () => {
                const dia = chk.getAttribute("data-dia");
                const inicio = document.querySelector(`.disp-dia-inicio[data-dia="${dia}"]`);
                const fim = document.querySelector(`.disp-dia-fim[data-dia="${dia}"]`);
                if (inicio) inicio.disabled = !chk.checked;
                if (fim) fim.disabled = !chk.checked;
            });
        });

        const formNovaDisponibilidade = document.getElementById("formNovaDisponibilidade");
        if (formNovaDisponibilidade) {
            formNovaDisponibilidade.addEventListener("submit", async (e) => {
                e.preventDefault();
                const disciplinas = [...document.querySelectorAll(".disp-disciplina-check:checked")].map(c => c.value);
                if (disciplinas.length === 0) {
                    showToast("Marque pelo menos uma disciplina.", 'error');
                    return;
                }

                // Uma janela por dia × disciplina marcada.
                const diasSelecionados = [];
                document.querySelectorAll(".disp-dia-check:checked").forEach(chk => {
                    const dia = chk.getAttribute("data-dia");
                    const inicio = document.querySelector(`.disp-dia-inicio[data-dia="${dia}"]`).value;
                    const fim = document.querySelector(`.disp-dia-fim[data-dia="${dia}"]`).value;
                    if (!inicio || !fim) return;
                    disciplinas.forEach(disciplina => {
                        diasSelecionados.push({ disciplina, dia_semana: dia, horario_inicio: inicio, horario_fim: fim });
                    });
                });

                if (diasSelecionados.length === 0) {
                    showToast("Marque pelo menos um dia e preencha os horários dele.", 'error');
                    return;
                }

                await criarDisponibilidadesEmLoteAPI(diasSelecionados);
            });
        }

        document.querySelectorAll(".btn-remover-disponibilidade").forEach(btn => {
            btn.addEventListener("click", async () => {
                const ok = await showConfirm("Remover este horário?", { title: "Remover horário", variant: "danger" });
                if (ok) removerDisponibilidadeAPI(btn.getAttribute("data-id"));
            });
        });

        const formVideoLink = document.getElementById("formVideoLink");
        if (formVideoLink) {
            formVideoLink.addEventListener("submit", async (e) => {
                e.preventDefault();
                const video_apresentacao_url = document.getElementById("inputVideoUrl").value.trim();
                await atualizarMeuPerfilAPI({ video_apresentacao_url });
            });
        }

        const formVideoArquivo = document.getElementById("formVideoArquivo");
        if (formVideoArquivo) {
            formVideoArquivo.addEventListener("submit", async (e) => {
                e.preventDefault();
                const file = document.getElementById("inputVideoArquivo").files[0];
                if (!file) return;
                await enviarVideoApresentacaoAPI(file);
            });
        }

        const formDocumentoIdentidade = document.getElementById("formDocumentoIdentidade");
        if (formDocumentoIdentidade) {
            formDocumentoIdentidade.addEventListener("submit", async (e) => {
                e.preventDefault();
                const file = document.getElementById("inputDocumentoIdentidade").files[0];
                const cpf = document.getElementById("inputCpf").value.trim();
                if (!file) return;
                await enviarDocumentoIdentidadeAPI(file, cpf);
            });
        }

        const formSaque = document.getElementById("formSaque");
        if (formSaque) {
            formSaque.addEventListener("submit", async (e) => {
                e.preventDefault();
                const valor = document.getElementById("inputValorSaque").value;
                if (!valor || parseFloat(valor) <= 0) return;
                const ok = await showConfirm(`Confirmar saque de R$ ${parseFloat(valor).toFixed(2).replace('.', ',')} via PIX?`, { title: "Solicitar saque" });
                if (ok) await solicitarSaqueAPI(valor);
            });
        }

        const formChavePix = document.getElementById("formChavePix");
        if (formChavePix) {
            formChavePix.addEventListener("submit", async (e) => {
                e.preventDefault();
                const chave_pix = document.getElementById("inputChavePix").value.trim();
                await atualizarMeuPerfilAPI({ chave_pix });
            });
        }

    }

    // 8.1 MEUS ALUNOS (aulas agendadas com o professor — separado da Área do
    // Professor pra não misturar gestão de perfil com a lista de alunos/aulas).
    // Cartão de uma aula na aba "Meus Alunos" do professor.
    function bookingCardProfessor(b) {
        return `
                            <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
                                <div class="flex items-center gap-3">
                                    ${avatarBolinha(b.studentName, b.studentAvatar, 'w-12 h-12 text-sm')}
                                    <div>
                                        <h4 class="font-bold text-slate-900 text-sm">Aluno: ${escapeHtml(b.studentName)}</h4>
                                        <p class="text-xs text-slate-500">${b.studentEmail}</p>
                                        <span class="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md mt-1 border border-emerald-100">
                                            <i data-lucide="check" class="w-2.5 h-2.5"></i> Recebido via ${b.paymentMethod}
                                        </span>
                                    </div>
                                </div>

                                <div class="bg-slate-50 p-3 rounded-xl space-y-1 text-xs">
                                    <p class="text-slate-700"><strong>Matéria/Conteúdo:</strong> ${b.content}</p>
                                    <p class="text-slate-700"><strong>Data e Horário:</strong> ${b.date}, ${b.time}–${b.endTime}</p>
                                    <p class="text-slate-700"><strong>Valor da Aula:</strong> R$ ${b.price.toFixed(2).replace('.', ',')}</p>
                                    <p class="text-slate-700"><strong>Status:</strong> ${b.status}</p>
                                    ${refundBadge(b)}
                                </div>

                                <button class="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition shadow-sm flex items-center justify-center gap-2 btn-open-chat" data-booking-id="${b.id}" data-chat-with="${escapeHtml(b.studentName)}" data-somente-leitura="${conversaEncerrada(b) ? '1' : ''}">
                                    <i data-lucide="message-circle" class="w-4 h-4"></i> ${conversaEncerrada(b) ? 'Ver conversa' : 'Abrir Chat com o Aluno'}
                                </button>

                                ${podeEntrarNaAula(b) ? `
                                    <button class="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition shadow-sm flex items-center justify-center gap-2 btn-open-video" data-booking-id="${b.id}" data-chat-with="${b.studentName}">
                                        <i data-lucide="video" class="w-4 h-4"></i> Entrar na Aula
                                    </button>
                                ` : ''}

                                ${b.canCancel ? `
                                    <button class="w-full py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-xl transition btn-cancelar-aula" data-booking-id="${b.id}">
                                        Cancelar Aula
                                    </button>
                                ` : seloSituacaoAula(b, 'professor')}

                                ${b.canMarkNoShow ? `
                                    <button class="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition btn-no-show" data-booking-id="${b.id}">
                                        Aluno não compareceu
                                    </button>
                                ` : ''}

                                ${b.canMarkConcluido ? `
                                    <button class="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl transition btn-concluir-aula flex items-center justify-center gap-1.5" data-booking-id="${b.id}">
                                        <i data-lucide="check-check" class="w-3.5 h-3.5"></i> Marcar Aula como Concluída
                                    </button>
                                ` : ''}

                                ${b.avaliacao ? `
                                    <div class="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs space-y-1">
                                        <p class="font-bold text-amber-600">${estrelas(b.avaliacao.nota)} <span class="text-slate-500 font-semibold">Avaliação recebida</span></p>
                                        ${b.avaliacao.comentario ? `<p class="text-slate-600">"${escapeHtml(b.avaliacao.comentario)}"</p>` : ''}
                                    </div>
                                ` : (b.status === 'concluido' ? `
                                    <p class="text-[11px] text-slate-500 bg-slate-50 rounded-xl px-3 py-2 flex items-center gap-1.5"><i data-lucide="hourglass" class="w-3.5 h-3.5"></i> Aguardando a avaliação do aluno.</p>
                                ` : '')}
                            </div>
                        `;
    }

    function secaoAulasProfessor(titulo, aulas, textoVazio) {
        return `
            <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
                <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wide">${titulo} <span class="text-slate-400 font-semibold normal-case">(${aulas.length})</span></h3>
                ${aulas.length === 0
                    ? `<p class="text-xs text-slate-400">${textoVazio}</p>`
                    : `<div class="grid grid-cols-1 md:grid-cols-2 gap-4">${aulas.map(b => bookingCardProfessor(b)).join('')}</div>`}
            </div>
        `;
    }

    function renderMeusAlunosView() {
        const view = document.getElementById("view-meusalunos");
        if (!view) return;

        if (currentUser && currentUser.role !== "teacher" && currentUser.role !== "admin") {
            view.innerHTML = `
                <div class="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-2">
                    <i data-lucide="lock" class="w-9 h-9 mx-auto text-slate-300"></i>
                    <h3 class="font-bold text-slate-800">Acesso Restrito</h3>
                    <p class="text-xs text-slate-500">Esta área é destinada apenas para professores cadastrados.</p>
                </div>
            `;
            refreshIcons();
            return;
        }

        // bookingsList já vem filtrado pelo backend para o professor autenticado.
        const myTeacherBookings = bookingsList;
        const aulasAgendadas = myTeacherBookings.filter(b => b.status === 'pendente' || b.status === 'confirmado');
        const aulasConcluidas = myTeacherBookings.filter(b => b.status === 'concluido');
        const aulasCanceladas = myTeacherBookings.filter(b => b.status === 'cancelado');

        view.innerHTML = `
            <div class="space-y-6">
                <div>
                    <h2 class="text-2xl font-black text-slate-900 flex items-center gap-2"><i data-lucide="users" class="w-6 h-6 text-indigo-600"></i> Meus Alunos</h2>
                    <p class="text-xs text-slate-500 mt-1">Alunos que já agendaram aulas com você, aulas confirmadas e pagamentos recebidos.</p>
                </div>

                ${myTeacherBookings.length === 0 ? `
                    <div class="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-2">
                        <i data-lucide="calendar" class="w-9 h-9 mx-auto text-slate-300"></i>
                        <h3 class="font-bold text-slate-800 text-base">Nenhum agendamento recebido até o momento.</h3>
                        <p class="text-xs text-slate-500">Assim que um aluno agendar uma aula com você, os detalhes aparecerão aqui.</p>
                    </div>
                ` : `
                    ${secaoAulasProfessor('Aulas agendadas', aulasAgendadas, 'Nenhuma aula agendada no momento.')}
                    ${secaoAulasProfessor('Aulas concluídas', aulasConcluidas, 'Nenhuma aula concluída ainda. Depois do horário da aula, marque-a como concluída para liberar a avaliação do aluno.')}
                    ${aulasCanceladas.length ? secaoAulasProfessor('Aulas canceladas', aulasCanceladas, '') : ''}
                `}
            </div>
        `;
        refreshIcons();

        view.querySelectorAll(".btn-open-chat").forEach(btn => {
            btn.addEventListener("click", () => {
                const bookingId = btn.getAttribute("data-booking-id");
                const chatWith = btn.getAttribute("data-chat-with");
                abrirModalChat(bookingId, chatWith, btn.getAttribute("data-somente-leitura") === "1");
            });
        });

        view.querySelectorAll(".btn-open-video").forEach(btn => {
            btn.addEventListener("click", () => {
                const bookingId = btn.getAttribute("data-booking-id");
                const chatWith = btn.getAttribute("data-chat-with");
                abrirSalaVideo(bookingId, chatWith);
            });
        });

        view.querySelectorAll(".btn-cancelar-aula").forEach(btn => {
            btn.addEventListener("click", async () => {
                const aula = bookingsList.find(b => String(b.id) === btn.getAttribute("data-booking-id"));
                const texto = aula ? textoConfirmacaoCancelamento(aula, 'professor') : "Tem certeza que deseja cancelar esta aula?";
                const ok = await showConfirm(texto, { title: "Cancelar aula", variant: "danger" });
                if (ok) cancelarAulaAPI(btn.getAttribute("data-booking-id"));
            });
        });

        view.querySelectorAll(".btn-no-show").forEach(btn => {
            btn.addEventListener("click", async () => {
                const ok = await showConfirm("Confirmar que o aluno não compareceu a esta aula? Isso cancela a aula sem direito a reembolso.", { title: "Não comparecimento", variant: "danger" });
                if (ok) marcarNoShowAPI(btn.getAttribute("data-booking-id"));
            });
        });

        view.querySelectorAll(".btn-concluir-aula").forEach(btn => {
            btn.addEventListener("click", async () => {
                const ok = await showConfirm("Confirmar que esta aula aconteceu e foi concluída? Isso libera a avaliação para o aluno.", { title: "Concluir aula" });
                if (ok) marcarConcluidoAPI(btn.getAttribute("data-booking-id"));
            });
        });

        aplicarAvisosMensagens();
    }

    // Selo de cor por status de verificação do currículo
    function statusVerificacaoBadge(status, temArquivo = true) {
        if (!temArquivo && status !== 'aprovado') {
            return `<span class="inline-block text-[10px] font-bold px-2 py-0.5 rounded-md border bg-slate-50 text-slate-500 border-slate-200">Não enviado</span>`;
        }
        const mapa = {
            pendente: { label: "Pendente de revisão", cls: "bg-amber-50 text-amber-700 border-amber-100" },
            aprovado: { label: "Aprovado", cls: "bg-emerald-50 text-emerald-700 border-emerald-100" },
            rejeitado: { label: "Rejeitado", cls: "bg-red-50 text-red-700 border-red-100" },
        };
        const info = mapa[status] || mapa.pendente;
        return `<span class="inline-block text-[10px] font-bold px-2 py-0.5 rounded-md border ${info.cls}">${info.label}</span>`;
    }

    // Card com biografia/preço/foto — o que os alunos veem no perfil público do professor.
    function renderMeuPerfilCard() {
        const p = meuPerfilProfessor;
        if (!p) return '';
        return `
            <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
                <h3 class="font-bold text-slate-900 text-sm flex items-center gap-1.5"><i data-lucide="user" class="w-4 h-4 text-indigo-600"></i> Meu Perfil Público</h3>
                <p class="text-xs text-slate-500">Essas informações aparecem para os alunos na busca e na sua página de professor.</p>

                <div class="flex items-center gap-3">
                    ${p.avatarUrl
                        ? `<img src="${p.avatarUrl}" alt="Sua foto" class="w-16 h-16 rounded-xl object-cover border border-slate-200">`
                        : `<div class="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400"><i data-lucide="user" class="w-7 h-7"></i></div>`
                    }
                    <form id="formAvatar" class="flex-1 flex flex-col sm:flex-row gap-2">
                        <input type="file" id="inputAvatarFile" accept="image/png,image/jpeg,image/webp" required class="flex-1 text-xs border border-slate-200 rounded-lg px-2 py-1.5">
                        <button type="submit" class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition whitespace-nowrap">
                            ${p.avatarUrl ? 'Trocar Foto' : 'Enviar Foto'}
                        </button>
                    </form>
                </div>

                <form id="formMeuPerfil" class="space-y-3 pt-2 border-t border-slate-100">
                    <div>
                        <label class="block text-xs font-bold text-slate-600 mb-1">Nome</label>
                        <input type="text" id="inputNomeProfessor" value="${p.nome || ''}" required maxlength="150" class="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-indigo-500">
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label class="block text-xs font-bold text-slate-600 mb-1">Telefone</label>
                            <input type="tel" id="inputTelefoneProfessor" value="${p.telefone || ''}" maxlength="20" placeholder="(00) 00000-0000" class="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-indigo-500">
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-600 mb-1">E-mail</label>
                            <div class="flex gap-2">
                            <input type="email" value="${escapeHtml(p.email || '')}" disabled class="flex-1 min-w-0 px-3 py-2 border border-slate-200 bg-slate-50 text-slate-400 rounded-xl text-sm cursor-not-allowed">
                            <button type="button" class="btn-alterar-email px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition whitespace-nowrap">Alterar</button>
                        </div>
                        </div>
                    </div>
                    <p class="text-[11px] text-slate-500 flex items-start gap-1.5 -mt-1"><i data-lucide="lock" class="w-3 h-3 flex-shrink-0 mt-0.5"></i> Telefone e e-mail não aparecem para os alunos — só você e a administração da plataforma veem.</p>
                    <div>
                        <label class="block text-xs font-bold text-slate-600 mb-1">Biografia</label>
                        <textarea id="inputBiografia" rows="3" placeholder="Conte um pouco sobre sua formação e experiência..." class="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-indigo-500">${p.biografia || ''}</textarea>
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-600 mb-1">Metodologia de Ensino</label>
                        <textarea id="inputMetodologiaEnsino" rows="3" placeholder="Como funciona sua aula? Ex: foco em resolução de exercícios, mapas mentais, teoria do zero..." class="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-indigo-500">${p.metodologia_ensino || ''}</textarea>
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-600 mb-1">Preço por hora (R$)</label>
                        <input type="number" id="inputPrecoHora" min="0.01" step="0.01" value="${p.preco_hora || ''}" required class="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-indigo-500">
                        <p class="text-[11px] text-slate-500 mt-1">O aluno escolhe a duração da aula (30min a 2h30) — o preço é calculado proporcional a esse valor por hora:</p>
                        <p id="precoBreakdown" class="text-[11px] text-indigo-600 font-semibold mt-1"></p>
                    </div>
                    <button type="submit" class="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition">Salvar Perfil</button>
                </form>
            </div>
        `;
    }

    // Card com a lista de disciplinas que o professor leciona + formulário pra adicionar.
    // É pré-requisito pra cadastrar disponibilidade (cada horário pertence a uma disciplina).
    function renderDisciplinasCard() {
        const listaHtml = minhasDisciplinas.length
            ? minhasDisciplinas.map(d => `
                <div class="flex items-center justify-between gap-2 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
                    <div>
                        <p class="text-xs font-bold text-slate-800">${d.nome}</p>
                        ${d.descricao ? `<p class="text-[11px] text-slate-500">${d.descricao}</p>` : ''}
                    </div>
                    <button class="btn-remover-disciplina text-red-500 hover:text-red-700 text-xs font-bold" data-id="${d.id}">Remover</button>
                </div>
            `).join('')
            : `<p class="text-xs text-slate-400">Nenhuma disciplina cadastrada ainda.</p>`;

        return `
            <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
                <h3 class="font-bold text-slate-900 text-sm flex items-center gap-1.5"><i data-lucide="book-open" class="w-4 h-4 text-indigo-600"></i> Minhas Disciplinas</h3>
                <p class="text-xs text-slate-500">O que você ensina. Cadastre pelo menos uma disciplina para poder oferecer horários.</p>
                <div class="space-y-2">${listaHtml}</div>
                <form id="formNovaDisciplina" class="flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-100">
                    <input type="text" id="inputNovaDisciplinaNome" placeholder="Ex: Matemática" required class="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-indigo-500">
                    <input type="text" id="inputNovaDisciplinaDescricao" placeholder="Descrição (opcional)" class="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-indigo-500">
                    <button type="submit" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition whitespace-nowrap">+ Adicionar</button>
                </form>
            </div>
        `;
    }

    // Card com os horários que o professor oferece (o que os alunos veem pra agendar).
    // Cada janela pode ter uma ou mais aulas marcadas dentro dela (aluno escolhe o
    // horário exato na hora de agendar) — remover/editar só é bloqueado pelo backend
    // quando há aula ativa dentro da janela (o erro aparece como toast).
    function renderDisponibilidadeCard() {
        const listaHtml = minhasDisponibilidades.length
            ? ordenarJanelas(minhasDisponibilidades).map(d => `
                <div class="flex items-center justify-between gap-2 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
                    <div>
                        <p class="text-xs font-bold text-slate-800">${DIA_SEMANA_LABEL[d.dia_semana] || d.dia_semana} · ${d.horario_inicio.slice(0, 5)} às ${d.horario_fim.slice(0, 5)}</p>
                        <p class="text-[11px] text-slate-500">${(minhasDisciplinas.find(x => x.id === d.disciplina) || {}).nome || ''} ${d.status === 'indisponivel' ? '· <span class="text-slate-400">Pausado</span>' : ''}</p>
                    </div>
                    <button class="btn-remover-disponibilidade text-red-500 hover:text-red-700 text-xs font-bold" data-id="${d.id}">Remover</button>
                </div>
            `).join('')
            : `<p class="text-xs text-slate-400">Nenhum horário cadastrado ainda.</p>`;

        const diasGrid = Object.entries(DIA_SEMANA_LABEL).map(([valor, label]) => `
            <div class="flex items-center gap-2 py-1.5 border-b border-slate-50 last:border-0">
                <label class="flex items-center gap-2 w-24 flex-shrink-0 cursor-pointer">
                    <input type="checkbox" class="disp-dia-check accent-indigo-600" data-dia="${valor}">
                    <span class="text-xs font-semibold text-slate-700">${label}</span>
                </label>
                <input type="time" class="disp-dia-inicio flex-1 px-2 py-1.5 border border-slate-200 rounded-lg text-xs disabled:bg-slate-50 disabled:text-slate-300" data-dia="${valor}" disabled>
                <span class="text-slate-300 text-xs">até</span>
                <input type="time" class="disp-dia-fim flex-1 px-2 py-1.5 border border-slate-200 rounded-lg text-xs disabled:bg-slate-50 disabled:text-slate-300" data-dia="${valor}" disabled>
            </div>
        `).join('');

        const formHtml = minhasDisciplinas.length ? `
            <form id="formNovaDisponibilidade" class="space-y-3 pt-2 border-t border-slate-100">
                <div>
                    <label class="block text-[10px] font-bold text-slate-500 mb-1">Disciplinas destes horários (pode marcar mais de uma)</label>
                    <div class="flex flex-wrap gap-2">
                        ${minhasDisciplinas.map((d, i) => `
                            <label class="inline-flex items-center gap-1.5 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs cursor-pointer hover:bg-slate-50">
                                <input type="checkbox" class="disp-disciplina-check accent-indigo-600" value="${d.id}" ${i === 0 ? 'checked' : ''}>
                                ${escapeHtml(d.nome)}
                            </label>
                        `).join('')}
                    </div>
                    <p class="text-[10px] text-slate-400 mt-1">Você pode atender várias matérias no mesmo horário — o sistema nunca deixa marcar duas aulas ao mesmo tempo com você.</p>
                </div>
                <div>
                    <label class="block text-[10px] font-bold text-slate-500 mb-1">Marque os dias e o horário de cada um (pode variar por dia)</label>
                    ${diasGrid}
                </div>
                <button type="submit" class="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition">+ Adicionar dias selecionados</button>
            </form>
        ` : `<p class="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg p-2">Cadastre uma disciplina acima antes de adicionar horários.</p>`;

        return `
            <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
                <h3 class="font-bold text-slate-900 text-sm flex items-center gap-1.5"><i data-lucide="calendar-clock" class="w-4 h-4 text-indigo-600"></i> Minha Disponibilidade</h3>
                <p class="text-xs text-slate-500">Janelas de horário em que você está disponível — os alunos escolhem o horário de início e a duração da aula dentro delas.</p>
                <div class="space-y-2">${listaHtml}</div>
                ${formHtml}
            </div>
        `;
    }

    // Card de upload/status do currículo, exibido no topo da Área do Professor.
    // Enquanto o status não for "aprovado", o professor não aparece nas buscas dos alunos.
    function botaoExcluirArquivo(tipo, rotulo) {
        return `<button type="button" class="btn-excluir-arquivo inline-flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-700" data-tipo="${tipo}"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i> ${rotulo}</button>`;
    }

    function renderCurriculoCard() {
        const p = meuPerfilProfessor;
        return `
            <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
                <div class="flex items-center justify-between gap-2">
                    <h3 class="font-bold text-slate-900 text-sm flex items-center gap-1.5"><i data-lucide="file-text" class="w-4 h-4 text-indigo-600"></i> Verificação de Currículo</h3>
                    ${p ? statusVerificacaoBadge(p.status_verificacao, !!p.curriculoUrl) : ''}
                </div>
                <p class="text-xs text-slate-500">
                    Envie seu currículo em PDF. Uma triagem automática analisa o conteúdo e, em seguida,
                    um moderador revisa e aprova antes do seu perfil aparecer nas buscas dos alunos.
                </p>
                <p class="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-2 flex items-start gap-1.5">
                    <i data-lucide="triangle-alert" class="w-3.5 h-3.5 flex-shrink-0 mt-0.5"></i>
                    <span><strong>Atenção:</strong> depois de aprovado, este PDF fica visível para qualquer aluno
                    no seu perfil público. Evite incluir telefone, endereço ou outros dados de contato pessoais —
                    use o chat da plataforma para se comunicar com os alunos.</span>
                </p>
                ${p && p.status_verificacao === "rejeitado" && p.motivo_rejeicao ? `
                    <p class="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg p-2">
                        <strong>Motivo da rejeição:</strong> ${escapeHtml(p.motivo_rejeicao)}
                    </p>
                ` : ''}
                ${p && p.verificacao_detalhe ? `
                    <details class="text-xs text-slate-500">
                        <summary class="cursor-pointer font-semibold text-slate-600">Ver resultado da triagem automática</summary>
                        <p class="mt-1">${escapeHtml(p.verificacao_detalhe)}</p>
                    </details>
                ` : ''}
                ${p && p.curriculoUrl ? `
                    <div class="flex items-center justify-between gap-2 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
                        <a href="${p.curriculoUrl}" target="_blank" rel="noopener" class="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 underline">
                            <i data-lucide="file-text" class="w-3.5 h-3.5"></i> Ver currículo enviado
                        </a>
                        ${botaoExcluirArquivo('curriculo', 'Excluir')}
                    </div>
                ` : ''}
                <form id="formCurriculo" class="flex items-center gap-2">
                    <input type="file" id="inputCurriculo" accept="application/pdf" required
                        class="flex-1 text-xs border border-slate-200 rounded-lg px-2 py-1.5">
                    <button type="submit" class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition">
                        ${p && p.curriculoUrl ? 'Enviar outro' : 'Enviar'}
                    </button>
                </form>
            </div>
        `;
    }

    // Converte um link de vídeo do YouTube/Vimeo em URL de embed pra tocar no iframe.
    function embedUrlVideo(url) {
        const matchYoutube = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
        if (matchYoutube) return `https://www.youtube.com/embed/${matchYoutube[1]}`;
        const matchVimeo = url.match(/vimeo\.com\/(\d+)/);
        if (matchVimeo) return `https://player.vimeo.com/video/${matchVimeo[1]}`;
        return url;
    }

    // Card do vídeo de apresentação (1-2min): link do YouTube/Vimeo OU upload de arquivo.
    function renderVideoApresentacaoCard() {
        const p = meuPerfilProfessor;
        if (!p) return '';
        const temLink = !!p.video_apresentacao_url;
        const temArquivo = !!p.videoApresentacaoArquivoUrl;
        return `
            <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
                <h3 class="font-bold text-slate-900 text-sm flex items-center gap-1.5"><i data-lucide="video" class="w-4 h-4 text-indigo-600"></i> Vídeo de Apresentação</h3>
                <p class="text-xs text-slate-500">Um vídeo curto (1-2min) contando sua didática e experiência. Alunos convertem muito mais quando veem seu tom de voz antes de contratar.</p>

                ${temLink ? `
                    <div class="aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-900">
                        <iframe src="${embedUrlVideo(p.video_apresentacao_url)}" class="w-full h-full" allowfullscreen referrerpolicy="strict-origin-when-cross-origin" allow="encrypted-media; picture-in-picture"></iframe>
                    </div>
                ` : temArquivo ? `
                    <video src="${p.videoApresentacaoArquivoUrl}" controls class="w-full rounded-xl border border-slate-200"></video>
                ` : `
                    <p class="text-xs text-slate-400 bg-slate-50 rounded-lg p-3 text-center">Nenhum vídeo cadastrado ainda.</p>
                `}
                ${temLink || temArquivo ? `<div class="flex justify-end">${botaoExcluirArquivo('video', 'Excluir vídeo')}</div>` : ''}

                <form id="formVideoLink" class="flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-100">
                    <input type="url" id="inputVideoUrl" placeholder="Link do YouTube ou Vimeo" value="${p.video_apresentacao_url || ''}" class="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-indigo-500">
                    <button type="submit" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition whitespace-nowrap">Salvar Link</button>
                </form>
                <form id="formVideoArquivo" class="flex items-center gap-2">
                    <input type="file" id="inputVideoArquivo" accept="video/mp4,video/webm,video/quicktime" class="flex-1 text-xs border border-slate-200 rounded-lg px-2 py-1.5">
                    <button type="submit" class="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-lg transition whitespace-nowrap">Enviar Arquivo</button>
                </form>
                <p class="text-[10px] text-slate-400">Preencha um dos dois — o link tem prioridade se os dois estiverem preenchidos.</p>
            </div>
        `;
    }

    // Card de upload do documento de identificação (RG/CNH) + CPF — reduz perfis fake.
    // Documento nunca aparece no perfil público (ver ProfessorPublicSerializer no backend).
    function renderDocumentoIdentidadeCard() {
        const p = meuPerfilProfessor;
        return `
            <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
                <div class="flex items-center justify-between gap-2">
                    <h3 class="font-bold text-slate-900 text-sm flex items-center gap-1.5"><i data-lucide="id-card" class="w-4 h-4 text-indigo-600"></i> Documento de Identificação</h3>
                    ${p ? statusVerificacaoBadge(p.status_documento, !!p.documentoIdentidadeUrl) : ''}
                </div>
                <p class="text-xs text-slate-500">
                    Envie seu RG ou CNH e informe seu CPF. Isso ajuda a plataforma a coibir perfis falsos —
                    seu documento nunca é exibido publicamente, só a equipe de revisão tem acesso.
                </p>
                ${p && p.documentoIdentidadeUrl ? `
                    <div class="flex items-center justify-between gap-2 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
                        <a href="${p.documentoIdentidadeUrl}" target="_blank" rel="noopener" class="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 underline">
                            <i data-lucide="id-card" class="w-3.5 h-3.5"></i> Ver documento enviado
                        </a>
                        ${botaoExcluirArquivo('documento', 'Excluir')}
                    </div>
                ` : ''}
                <form id="formDocumentoIdentidade" class="space-y-2">
                    <input type="text" id="inputCpf" placeholder="CPF (somente números)" maxlength="14" value="${(p && p.cpf) || ''}" class="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-indigo-500">
                    <div class="flex items-center gap-2">
                        <input type="file" id="inputDocumentoIdentidade" accept="image/jpeg,image/png,application/pdf" required class="flex-1 text-xs border border-slate-200 rounded-lg px-2 py-1.5">
                        <button type="submit" class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition whitespace-nowrap">
                            ${p && p.documentoIdentidadeUrl ? 'Enviar outro' : 'Enviar'}
                        </button>
                    </div>
                </form>
            </div>
        `;
    }

    // Card da carteira: saldo, extrato, chave PIX e solicitação de saque (tudo simulado/instantâneo).
    function renderCarteiraCard() {
        const c = minhaCarteira;
        const p = meuPerfilProfessor;
        if (!c || !p) return '';
        return `
            <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
                <h3 class="font-bold text-slate-900 text-sm flex items-center gap-1.5"><i data-lucide="wallet" class="w-4 h-4 text-indigo-600"></i> Carteira & Repasses</h3>

                <div class="grid grid-cols-3 gap-2 text-center">
                    <div class="bg-emerald-50 rounded-xl p-3">
                        <p class="text-[10px] font-bold text-emerald-700 uppercase">Saldo Disponível</p>
                        <p class="text-base font-black text-emerald-700">R$ ${c.saldoDisponivel.toFixed(2).replace('.', ',')}</p>
                    </div>
                    <div class="bg-slate-50 rounded-xl p-3">
                        <p class="text-[10px] font-bold text-slate-500 uppercase">Total Recebido</p>
                        <p class="text-base font-black text-slate-800">R$ ${c.totalGanho.toFixed(2).replace('.', ',')}</p>
                    </div>
                    <div class="bg-slate-50 rounded-xl p-3">
                        <p class="text-[10px] font-bold text-slate-500 uppercase">Já Sacado</p>
                        <p class="text-base font-black text-slate-800">R$ ${c.totalSacado.toFixed(2).replace('.', ',')}</p>
                    </div>
                </div>

                <div class="space-y-2 pt-2 border-t border-slate-100">
                    <label class="block text-xs font-bold text-slate-600">Chave PIX para receber</label>
                    <form id="formChavePix" class="flex gap-2">
                        <input type="text" id="inputChavePix" placeholder="CPF, e-mail, telefone ou chave aleatória" value="${p.chave_pix || ''}" class="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-indigo-500">
                        <button type="submit" class="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl transition whitespace-nowrap">Salvar</button>
                    </form>
                </div>

                <div class="space-y-2 pt-2 border-t border-slate-100">
                    <label class="block text-xs font-bold text-slate-600">Solicitar saque</label>
                    <form id="formSaque" class="flex gap-2">
                        <input type="number" id="inputValorSaque" min="0.01" step="0.01" max="${c.saldoDisponivel}" placeholder="Valor (R$)" ${!p.chave_pix ? 'disabled' : ''} class="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-indigo-500 disabled:bg-slate-50">
                        <button type="submit" ${!p.chave_pix || c.saldoDisponivel <= 0 ? 'disabled' : ''} class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl transition whitespace-nowrap">Sacar</button>
                    </form>
                    ${!p.chave_pix ? `<p class="text-[11px] text-amber-600">Cadastre uma chave PIX acima antes de solicitar saques.</p>` : ''}
                </div>

                <div class="space-y-2 pt-2 border-t border-slate-100">
                    <label class="block text-xs font-bold text-slate-600">Extrato</label>
                    ${c.extrato.length === 0 ? `<p class="text-xs text-slate-400">Nenhuma movimentação ainda.</p>` : `
                        <div class="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                            ${c.extrato.map(item => `
                                <div class="flex items-center justify-between text-xs bg-slate-50 rounded-lg px-3 py-2">
                                    <div>
                                        <p class="font-semibold text-slate-700">${escapeHtml(item.descricao)}</p>
                                        <p class="text-[10px] text-slate-400">${item.data}</p>
                                    </div>
                                    <span class="font-bold ${item.tipo === 'saque' ? 'text-red-500' : 'text-emerald-600'}">${item.tipo === 'saque' ? '-' : '+'} R$ ${item.valor.toFixed(2).replace('.', ',')}</span>
                                </div>
                            `).join('')}
                        </div>
                    `}
                </div>
            </div>
        `;
    }

    // Card de reputação: média/depoimentos dos alunos + estatísticas de desempenho.
    function renderReputacaoCard() {
        const stats = minhasEstatisticas;
        if (!stats) return '';
        return `
            <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
                <h3 class="font-bold text-slate-900 text-sm flex items-center gap-1.5"><i data-lucide="star" class="w-4 h-4 text-indigo-600"></i> Reputação e Avaliações</h3>

                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                    <div class="bg-amber-50 rounded-xl p-3">
                        <p class="text-[10px] font-bold text-amber-700 uppercase">Nota Média</p>
                        <p class="text-base font-black text-amber-700">★ ${stats.avaliacaoMedia.toFixed(1)}</p>
                        <p class="text-[10px] text-slate-400">${stats.totalAvaliacoes} avaliações</p>
                    </div>
                    <div class="bg-slate-50 rounded-xl p-3">
                        <p class="text-[10px] font-bold text-slate-500 uppercase">Aulas Concluídas</p>
                        <p class="text-base font-black text-slate-800">${stats.aulasConcluidas}</p>
                    </div>
                    <div class="bg-slate-50 rounded-xl p-3">
                        <p class="text-[10px] font-bold text-slate-500 uppercase">Alunos Atendidos</p>
                        <p class="text-base font-black text-slate-800">${stats.alunosAtendidos}</p>
                    </div>
                    <div class="bg-slate-50 rounded-xl p-3">
                        <p class="text-[10px] font-bold text-slate-500 uppercase">Taxa de Resposta</p>
                        <p class="text-base font-black text-slate-800">${stats.taxaResposta === null ? '—' : stats.taxaResposta + '%'}</p>
                    </div>
                </div>

                <div class="space-y-2 pt-2 border-t border-slate-100">
                    <label class="block text-xs font-bold text-slate-600">Depoimentos recebidos</label>
                    ${minhasAvaliacoesRecebidas.length === 0 ? `<p class="text-xs text-slate-400">Nenhuma avaliação recebida ainda.</p>` : `
                        <div class="space-y-2 max-h-56 overflow-y-auto pr-1">
                            ${minhasAvaliacoesRecebidas.map(av => `
                                <div class="bg-slate-50 rounded-xl p-3 text-xs space-y-1">
                                    <p class="font-bold text-amber-500">${estrelas(av.nota)} <span class="text-slate-500 font-semibold">${av.studentName}</span></p>
                                    ${av.comentario ? `<p class="text-slate-600">"${av.comentario}"</p>` : ''}
                                    <p class="text-[10px] text-slate-400">${av.date}</p>
                                </div>
                            `).join('')}
                        </div>
                    `}
                </div>
            </div>
        `;
    }

    // 9. CHAT EM TEMPO REAL NO MODAL
    const MOTIVOS_DENUNCIA = [
        { value: 'ofensa_assedio', label: 'Ofensa/Assédio' },
        { value: 'ameaca', label: 'Ameaça' },
        { value: 'conteudo_sexual', label: 'Conteúdo sexual impróprio' },
        { value: 'discriminacao', label: 'Discriminação' },
        { value: 'contato_externo', label: 'Tentativa de contato fora da plataforma' },
        { value: 'outro', label: 'Outro' },
    ];

    async function denunciarMensagem(bookingId, mensagemId) {
        const motivo = await showChoice("Por que você está denunciando esta mensagem?", MOTIVOS_DENUNCIA);
        if (!motivo) return;

        try {
            const resp = await apiFetch(`/api/aulas/${bookingId}/mensagens/${mensagemId}/denunciar/`, {
                method: 'POST',
                body: JSON.stringify({ motivo }),
            });
            const data = await resp.json();
            showToast(data.mensagem || (resp.ok ? 'Denúncia registrada com sucesso.' : 'Não foi possível registrar a denúncia.'), resp.ok ? 'success' : 'error');
        } catch (erro) {
            console.error('Erro ao denunciar mensagem:', erro);
        }
    }

    // somenteLeitura: aula concluída/cancelada — mostra o histórico sem o campo de envio.
    async function abrirModalChat(bookingId, participantName, somenteLeitura = false) {
        let messages = [];

        async function carregarMensagens() {
            try {
                const resp = await apiFetch(`/api/aulas/${bookingId}/mensagens/`);
                if (resp.ok) messages = await resp.json();
            } catch (erro) {
                console.error('Erro ao carregar mensagens:', erro);
            }
        }

        function renderMessages() {
            if (messages.length === 0) {
                return `<div class="text-center text-[10px] text-slate-400 py-1">Nenhuma mensagem ainda. Envie a primeira!</div>`;
            }
            return messages.map(m => {
                const isMe = m.sender === currentUser?.name;
                return `
                    <div class="flex items-end gap-2 ${isMe ? 'flex-row-reverse' : ''}">
                        ${avatarBolinha(m.sender, m.senderAvatar)}
                        <div class="flex flex-col max-w-[80%] ${isMe ? 'items-end' : 'items-start'}">
                            <div class="rounded-2xl px-3 py-2 text-xs ${isMe ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-slate-100 text-slate-800 rounded-bl-none'} shadow-sm">
                                <p class="font-bold text-[10px] ${isMe ? 'text-indigo-200' : 'text-slate-500'} mb-0.5">${escapeHtml(m.sender)}</p>
                                <p class="break-words">${escapeHtml(m.text)}</p>
                            </div>
                            <div class="flex items-center gap-2 mt-0.5 px-1">
                                <span class="text-[9px] text-slate-400">${escapeHtml(m.time)}</span>
                                ${!isMe ? `<button class="text-[9px] text-slate-400 hover:text-red-500 btn-denunciar-msg inline-flex items-center gap-0.5" data-message-id="${m.id}"><i data-lucide="flag" class="w-2.5 h-2.5"></i> Denunciar</button>` : ''}
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        function renderChatContent() {
            return `
                <div class="flex flex-col h-[380px]">
                    <div class="flex items-center gap-2 pb-3 border-b border-slate-100">
                        <i data-lucide="message-circle" class="w-5 h-5 text-indigo-600"></i>
                        <div>
                            <h3 class="font-bold text-slate-900 text-sm">Conversa com ${participantName}</h3>
                            ${somenteLeitura
                                ? '<p class="text-[10px] text-slate-500 font-semibold">Aula encerrada · conversa apenas para leitura</p>'
                                : '<p class="text-[10px] text-emerald-600 font-semibold">Online no DarUmHelp</p>'}
                        </div>
                    </div>

                    <div id="chatBox" class="flex-1 overflow-y-auto py-3 space-y-2 pr-1">
                        ${renderMessages()}
                    </div>

                    ${somenteLeitura ? `
                        <p class="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center gap-1.5"><i data-lucide="lock" class="w-3 h-3"></i> Esta aula já foi encerrada. Para conversar de novo, é preciso agendar uma nova aula.</p>
                    ` : `
                    <form id="chatForm" class="pt-2 border-t border-slate-100 flex gap-2">
                        <input type="text" id="chatInput" placeholder="Escreva sua mensagem..." required class="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-indigo-500">
                        <button type="submit" class="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-indigo-950 font-bold text-xs rounded-xl transition shadow-sm">
                            Enviar
                        </button>
                    </form>
                    `}
                </div>
            `;
        }

        function scrollChatToBottom() {
            const chatBox = document.getElementById("chatBox");
            if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;
        }

        function atualizarChatBox() {
            const chatBox = document.getElementById("chatBox");
            if (!chatBox) return;
            chatBox.innerHTML = renderMessages();
            refreshIcons();
            scrollChatToBottom();
        }

        function bindChatBoxEvents() {
            const chatBox = document.getElementById("chatBox");
            if (!chatBox) return;
            chatBox.addEventListener("click", (e) => {
                const btn = e.target.closest(".btn-denunciar-msg");
                if (!btn) return;
                denunciarMensagem(bookingId, btn.getAttribute("data-message-id"));
            });
        }

        function bindChatForm() {
            const form = document.getElementById("chatForm");
            if (!form) return;

            form.addEventListener("submit", async (e) => {
                e.preventDefault();
                const input = document.getElementById("chatInput");
                const text = input.value.trim();
                if (!text) return;

                try {
                    const resp = await apiFetch(`/api/aulas/${bookingId}/mensagens/`, {
                        method: 'POST',
                        body: JSON.stringify({ text }),
                    });
                    const data = await resp.json();

                    if (resp.ok) {
                        input.value = "";
                        // A própria mensagem chega via WebSocket (broadcast para o grupo,
                        // incluindo o remetente) e atualiza a tela — não precisa recarregar aqui.
                    } else {
                        showToast(data.mensagem || 'Não foi possível enviar a mensagem.', 'error');
                    }
                } catch (erro) {
                    console.error('Erro ao enviar mensagem:', erro);
                }
            });
        }

        function conectarChatSocket() {
            closeChatSocket();
            chatSocket = new WebSocket(wsUrl(`/ws/chat/${bookingId}/`));
            chatSocket.onmessage = (event) => {
                const mensagem = JSON.parse(event.data);
                messages.push(mensagem);
                atualizarChatBox();
                // Chegou com o chat aberto: já foi vista, não deve virar aviso depois.
                if (mensagem.sender !== currentUser?.name) {
                    apiFetch(`/api/aulas/${bookingId}/mensagens/lidas/`, { method: 'POST' }).catch(() => {});
                }
            };
        }

        await carregarMensagens();
        // Carregar o histórico já marcou a conversa como lida no servidor.
        delete naoLidasPorAula[String(bookingId)];
        aplicarAvisosMensagens();
        openModal(renderChatContent());
        refreshIcons();
        bindChatBoxEvents();
        bindChatForm();
        scrollChatToBottom();
        conectarChatSocket();
    }

    // 9.1 SALA DE VIDEOCHAMADA (WebRTC)
    function encerrarChamada(avisarOutroLado = true) {
        if (videoSocket) {
            if (avisarOutroLado && videoSocket.readyState === WebSocket.OPEN) {
                videoSocket.send(JSON.stringify({ type: "leave" }));
            }
            videoSocket.close();
            videoSocket = null;
        }
        if (peerConnection) {
            peerConnection.close();
            peerConnection = null;
        }
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            localStream = null;
        }
        if (remoteVideo) remoteVideo.srcObject = null;
        if (localVideo) localVideo.srcObject = null;
        if (videoCallModal) {
            videoCallModal.classList.add("hidden");
            videoCallModal.classList.remove("flex");
        }
        meuPapelVideo = null;
    }

    async function abrirSalaVideo(bookingId, participantName) {
        if (!currentUser) return;

        meuPapelVideo = currentUser.role === "teacher" ? "professor" : "aluno";

        if (localVideoLabel) localVideoLabel.textContent = `Você (${currentUser.name})`;
        if (remoteVideoLabel) remoteVideoLabel.textContent = participantName;
        if (remoteVideoWaiting) remoteVideoWaiting.classList.remove("hidden");
        if (videoCallStatus) videoCallStatus.textContent = "Conectando...";
        if (videoCallModal) {
            videoCallModal.classList.remove("hidden");
            videoCallModal.classList.add("flex");
        }

        try {
            localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        } catch (erro) {
            console.error('Erro ao acessar câmera/microfone:', erro);
            showToast('Não foi possível acessar sua câmera/microfone. Verifique as permissões do navegador.', 'error');
            encerrarChamada(false);
            return;
        }

        if (localVideo) localVideo.srcObject = localStream;

        peerConnection = new RTCPeerConnection({
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        });

        localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

        peerConnection.ontrack = (event) => {
            if (remoteVideo) remoteVideo.srcObject = event.streams[0];
            if (remoteVideoWaiting) remoteVideoWaiting.classList.add("hidden");
            if (videoCallStatus) videoCallStatus.textContent = "Em chamada";
        };

        peerConnection.onicecandidate = (event) => {
            if (event.candidate && videoSocket && videoSocket.readyState === WebSocket.OPEN) {
                videoSocket.send(JSON.stringify({ type: "ice-candidate", candidate: event.candidate }));
            }
        };

        videoSocket = new WebSocket(wsUrl(`/ws/sala/${bookingId}/`));

        videoSocket.onmessage = async (event) => {
            const data = JSON.parse(event.data);

            switch (data.type) {
                case "peer_joined":
                    if (videoCallStatus) videoCallStatus.textContent = `${participantName} entrou na sala.`;
                    if (meuPapelVideo === "professor") {
                        const offer = await peerConnection.createOffer();
                        await peerConnection.setLocalDescription(offer);
                        videoSocket.send(JSON.stringify({ type: "offer", sdp: peerConnection.localDescription }));
                    }
                    break;

                case "offer":
                    await peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));
                    const answer = await peerConnection.createAnswer();
                    await peerConnection.setLocalDescription(answer);
                    videoSocket.send(JSON.stringify({ type: "answer", sdp: peerConnection.localDescription }));
                    break;

                case "answer":
                    await peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));
                    break;

                case "ice-candidate":
                    try {
                        await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
                    } catch (erro) {
                        console.error('Erro ao adicionar ICE candidate:', erro);
                    }
                    break;

                case "peer_left":
                    if (remoteVideo) remoteVideo.srcObject = null;
                    if (remoteVideoWaiting) remoteVideoWaiting.classList.remove("hidden");
                    if (videoCallStatus) videoCallStatus.textContent = `${participantName} saiu da sala.`;
                    break;

                case "room_full":
                    showToast("Esta sala já está com os dois participantes conectados em outra aba/dispositivo.", 'error');
                    encerrarChamada(false);
                    break;
            }
        };

        videoSocket.onerror = () => {
            if (videoCallStatus) videoCallStatus.textContent = "Erro de conexão com a sala.";
        };
    }

    if (videoToggleCamBtn) {
        videoToggleCamBtn.addEventListener("click", () => {
            if (!localStream) return;
            localStream.getVideoTracks().forEach(track => {
                track.enabled = !track.enabled;
                videoToggleCamBtn.classList.toggle("opacity-40", !track.enabled);
            });
        });
    }

    if (videoToggleMicBtn) {
        videoToggleMicBtn.addEventListener("click", () => {
            if (!localStream) return;
            localStream.getAudioTracks().forEach(track => {
                track.enabled = !track.enabled;
                videoToggleMicBtn.classList.toggle("opacity-40", !track.enabled);
            });
        });
    }

    if (videoLeaveBtn) {
        videoLeaveBtn.addEventListener("click", () => encerrarChamada(true));
    }

    if (videoCallCloseBtn) {
        videoCallCloseBtn.addEventListener("click", () => encerrarChamada(true));
    }

    // 10. MENU DE 3 PONTOS E POLÍTICAS
    if (btnMoreOptions && moreOptionsMenu) {
        btnMoreOptions.addEventListener("click", (e) => {
            e.stopPropagation();
            moreOptionsMenu.classList.toggle("hidden");
        });

        document.addEventListener("click", (e) => {
            if (!moreOptionsMenu.contains(e.target) && e.target !== btnMoreOptions) {
                moreOptionsMenu.classList.add("hidden");
            }
        });
    }

    policyBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            const type = btn.getAttribute("data-policy");
            const policy = policyContents[type];

            if (policy && policyTitle && policyBody) {
                policyTitle.innerHTML = policy.title;
                policyBody.innerHTML = policy.content;
                refreshIcons();

                if (moreOptionsMenu) moreOptionsMenu.classList.add("hidden");
                switchView("policy");
            }
        });
    });

    // 11. EVENTOS DE PESQUISA E NAVEGAÇÃO
    // Busca por PROFESSORES de verdade (não só o catálogo decorativo de matérias
    // — um professor pode cadastrar qualquer disciplina, mesmo uma que não esteja
    // na lista curada da página Matérias). Leva pra Home já filtrado.
    function executarBuscaGlobal(termo) {
        const termoLimpo = (termo || '').trim();
        if (!termoLimpo) return;
        switchView("home");
        renderTeachers(termoLimpo);
    }

    // Chips do hero agora navegam por categoria (não mais por matéria individual)
    // — leva pra página Matérias já com o filtro certo ativo.
    function executarBuscaPorCategoria(categoria) {
        selectedCategory = categoria;
        if (subjectSearchInput) subjectSearchInput.value = '';

        categoryBtns.forEach(b => {
            const ativo = b.getAttribute("data-cat") === categoria;
            b.classList.toggle("bg-indigo-600", ativo);
            b.classList.toggle("text-white", ativo);
            b.classList.toggle("bg-slate-100", !ativo);
            b.classList.toggle("text-slate-700", !ativo);
        });

        switchView("search");
        renderSubjects();
    }

    if (heroSearchBtn && heroQuery) {
        heroSearchBtn.addEventListener("click", () => executarBuscaGlobal(heroQuery.value));
        heroQuery.addEventListener("keypress", (e) => {
            if (e.key === "Enter") executarBuscaGlobal(heroQuery.value);
        });
    }

    if (subjectSearchInput) {
        subjectSearchInput.addEventListener("input", renderSubjects);
    }

    subjectChips.forEach(chip => {
        chip.addEventListener("click", () => {
            const categoria = chip.getAttribute("data-cat");
            if (categoria) executarBuscaPorCategoria(categoria);
        });
    });

    categoryBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            categoryBtns.forEach(b => {
                b.classList.remove("bg-indigo-600", "text-white");
                b.classList.add("bg-slate-100", "text-slate-700");
            });

            btn.classList.remove("bg-slate-100", "text-slate-700");
            btn.classList.add("bg-indigo-600", "text-white");

            selectedCategory = btn.getAttribute("data-cat");
            renderSubjects();
        });
    });

    menuBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            const targetView = btn.getAttribute("data-view");
            if (targetView === "home") renderTeachers();
            switchView(targetView);
        });
    });

    // 12. CONTROLE DE SESSÃO E MENUS
    function updateMenuPermissions() {
        const btnStudentArea = document.querySelector('[data-view="student"]');
        const btnMeusProfessoresArea = document.querySelector('[data-view="meusprofessores"]');
        const btnTeacherArea = document.querySelector('[data-view="teacher"]');
        const btnMeusAlunosArea = document.querySelector('[data-view="meusalunos"]');
        const btnAdminArea = document.querySelector('[data-view="admin"]');

        if (btnMeusProfessoresArea) btnMeusProfessoresArea.classList.add("hidden");
        if (btnStudentArea) btnStudentArea.classList.add("hidden");
        if (btnTeacherArea) btnTeacherArea.classList.add("hidden");
        if (btnMeusAlunosArea) btnMeusAlunosArea.classList.add("hidden");
        if (btnAdminArea) btnAdminArea.classList.add("hidden");

        if (currentUser) {
            if (welcomeLabel) welcomeLabel.textContent = `Olá, ${currentUser.name}!`;
            if (btnLogin) btnLogin.classList.add("hidden");
            if (btnRegister) btnRegister.classList.add("hidden");
            if (btnLogout) btnLogout.classList.remove("hidden");

            if (currentUser.role === "student") {
                if (btnStudentArea) btnStudentArea.classList.remove("hidden");
                if (btnMeusProfessoresArea) btnMeusProfessoresArea.classList.remove("hidden");
            } else if (currentUser.role === "teacher") {
                if (btnTeacherArea) btnTeacherArea.classList.remove("hidden");
                if (btnMeusAlunosArea) btnMeusAlunosArea.classList.remove("hidden");
            } else if (currentUser.role === "admin") {
                if (btnStudentArea) btnStudentArea.classList.remove("hidden");
                if (btnMeusProfessoresArea) btnMeusProfessoresArea.classList.remove("hidden");
                if (btnTeacherArea) btnTeacherArea.classList.remove("hidden");
                if (btnMeusAlunosArea) btnMeusAlunosArea.classList.remove("hidden");
                if (btnAdminArea) btnAdminArea.classList.remove("hidden");
            }
        } else {
            if (welcomeLabel) welcomeLabel.textContent = "";
            if (btnLogin) btnLogin.classList.remove("hidden");
            if (btnRegister) btnRegister.classList.remove("hidden");
            if (btnLogout) btnLogout.classList.add("hidden");
        }

        // Liga (ou desliga, se saiu da conta) a checagem de mensagens novas.
        iniciarAvisosMensagens();
    }

    if (btnLogin) {
        btnLogin.addEventListener("click", () => {
            openModal(`
                <h3 class="text-xl font-bold text-indigo-950 mb-1">Entrar no DarUmHelp</h3>
                <p class="text-xs text-slate-500 mb-4">Acesse sua conta para gerenciar suas aulas.</p>
                <form id="loginForm" class="space-y-3">
                    <div>
                        <label class="block text-xs font-bold text-slate-600 mb-1">E-mail</label>
                        <input type="email" id="loginEmail" placeholder="seu@email.com" required autocomplete="email" class="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-indigo-500">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-600 mb-1">Senha</label>
                        <input type="password" id="loginPassword" placeholder="••••••••" required class="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-indigo-500">
                    </div>
                    <button type="submit" class="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-indigo-950 font-bold rounded-xl transition mt-2 shadow-sm">Entrar</button>
                </form>
            `);

            document.getElementById("loginForm").addEventListener("submit", async (e) => {
                e.preventDefault();
                const email = document.getElementById("loginEmail").value;
                const senha = document.getElementById("loginPassword").value;
                // O papel (aluno/professor) é definido pelo cadastro no banco, não pela escolha aqui no login.

                try {
                    const resp = await apiFetch('/api/contas/login/', {
                        method: 'POST',
                        body: JSON.stringify({ email, senha }),
                    });
                    const data = await resp.json();

                    if (!resp.ok) {
                        showToast(data.non_field_errors?.[0] || 'E-mail ou senha inválidos.', 'error');
                        return;
                    }

                    currentUser = data;
                    localStorage.setItem("darumhelp_user", JSON.stringify(currentUser));
                    updateMenuPermissions();
                    modal.classList.add("hidden");
                    await carregarAulas();
                    await carregarMeuPerfilProfessor();
                    await carregarMeuPerfilAluno();

                    if (currentUser.role === "student") switchView("student");
                    else if (currentUser.role === "teacher") switchView("teacher");
                } catch (erro) {
                    console.error('Erro no login:', erro);
                    showToast('Erro ao entrar. Tente novamente.', 'error');
                }
            });
        });
    }

    if (btnRegister) {
        btnRegister.addEventListener("click", () => {
            openModal(`
                <h3 class="text-xl font-bold text-indigo-950 mb-1">Criar sua Conta</h3>
                <p class="text-xs text-slate-500 mb-4">Cadastre-se para aprender ou ensinar no DarUmHelp.</p>
                <form id="registerForm" class="space-y-3">
                    <div>
                        <label class="block text-xs font-bold text-slate-600 mb-1">Nome Completo</label>
                        <input type="text" id="regName" placeholder="Seu nome" required class="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-indigo-500">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-600 mb-1">E-mail</label>
                        <input type="email" id="regEmail" placeholder="seu@email.com" required class="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-indigo-500">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-600 mb-1">Senha</label>
                        <input type="password" id="regPassword" placeholder="Crie uma senha forte" required class="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-indigo-500">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-600 mb-1">Confirmar Senha</label>
                        <input type="password" id="regPasswordConfirm" placeholder="Digite a senha novamente" required class="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-indigo-500">
                        <p id="regPasswordAviso" class="hidden text-[11px] text-red-600 font-semibold mt-1">As senhas não coincidem.</p>
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-600 mb-2">Eu quero:</label>
                        <div class="grid grid-cols-2 gap-2">
                            <label class="cursor-pointer">
                                <input type="radio" name="regRole" value="student" class="peer sr-only" checked>
                                <div class="p-3 border-2 border-slate-200 peer-checked:border-indigo-600 peer-checked:bg-indigo-50 rounded-xl flex flex-col items-center gap-1.5 text-center transition">
                                    <i data-lucide="graduation-cap" class="w-6 h-6 text-indigo-600"></i>
                                    <span class="text-xs font-bold text-slate-800">Aprender</span>
                                    <span class="text-[10px] text-slate-500">Quero ser Aluno</span>
                                </div>
                            </label>
                            <label class="cursor-pointer">
                                <input type="radio" name="regRole" value="teacher" class="peer sr-only">
                                <div class="p-3 border-2 border-slate-200 peer-checked:border-indigo-600 peer-checked:bg-indigo-50 rounded-xl flex flex-col items-center gap-1.5 text-center transition">
                                    <i data-lucide="presentation" class="w-6 h-6 text-slate-500"></i>
                                    <span class="text-xs font-bold text-slate-800">Dar Aulas</span>
                                    <span class="text-[10px] text-slate-500">Quero ser Professor</span>
                                </div>
                            </label>
                        </div>
                    </div>
                    <button type="submit" class="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition mt-2 shadow-sm">Concluir Cadastro</button>
                </form>
            `);

            document.getElementById("registerForm").addEventListener("submit", async (e) => {
                e.preventDefault();
                const nome = document.getElementById("regName").value;
                const email = document.getElementById("regEmail").value;
                const senha = document.getElementById("regPassword").value;
                const senhaConfirm = document.getElementById("regPasswordConfirm").value;
                const tipo = document.querySelector('input[name="regRole"]:checked')?.value || 'student';
                const avisoSenha = document.getElementById("regPasswordAviso");

                if (senha !== senhaConfirm) {
                    avisoSenha.classList.remove("hidden");
                    showToast("As senhas digitadas não coincidem.", 'error');
                    return;
                }
                avisoSenha.classList.add("hidden");

                try {
                    const resp = await apiFetch('/api/contas/registro/', {
                        method: 'POST',
                        body: JSON.stringify({ nome, email, senha, tipo }),
                    });
                    const data = await resp.json();

                    if (!resp.ok) {
                        const mensagem = data.email?.[0] || data.senha?.[0] || data.nome?.[0] || 'Não foi possível concluir o cadastro.';
                        showToast(mensagem, 'error');
                        return;
                    }

                    currentUser = data;
                    localStorage.setItem("darumhelp_user", JSON.stringify(currentUser));
                    updateMenuPermissions();
                    modal.classList.add("hidden");
                    await carregarAulas();
                    await carregarMeuPerfilProfessor();
                    await carregarMeuPerfilAluno();

                    if (currentUser.role === "student") switchView("student");
                    else if (currentUser.role === "teacher") switchView("teacher");
                } catch (erro) {
                    console.error('Erro no cadastro:', erro);
                    showToast('Erro ao concluir cadastro. Tente novamente.', 'error');
                }
            });
        });
    }

    if (btnLogout) {
        btnLogout.addEventListener("click", async () => {
            closeChatSocket();
            encerrarChamada(false);
            try {
                await apiFetch('/api/contas/logout/', { method: 'POST' });
            } catch (erro) {
                console.error('Erro ao sair:', erro);
            }
            currentUser = null;
            bookingsList = [];
            meuPerfilProfessor = null;
            meuPerfilAluno = null;
            localStorage.removeItem("darumhelp_user");
            updateMenuPermissions();
            switchView("home");
        });
    }

    // 13. Inicialização da Página
    async function inicializarSessao() {
        try {
            await apiFetch('/api/contas/csrf/'); // garante o cookie CSRF antes do primeiro POST
        } catch (erro) {
            console.error('Erro ao preparar sessão:', erro);
        }

        try {
            const resp = await apiFetch('/api/contas/me/');
            const dados = resp.ok ? await resp.json() : null;
            if (dados && dados.autenticado) {
                delete dados.autenticado;
                currentUser = dados;
                localStorage.setItem("darumhelp_user", JSON.stringify(currentUser));
            } else {
                currentUser = null;
                localStorage.removeItem("darumhelp_user");
            }
        } catch (erro) {
            console.error('Erro ao verificar sessão:', erro);
        }

        updateMenuPermissions();
        if (currentUser) await carregarAulas();  // visitante não tem aulas (evita 403 no console)
        await carregarMeuPerfilProfessor();
        await carregarMeuPerfilAluno();
    }

    renderTeachers();
    renderSubjects();
    updateMenuPermissions();
    carregarProfessores();
    inicializarSessao();
    refreshIcons(); // renderiza os ícones estáticos do HTML inicial (header, hero, modais)
});
