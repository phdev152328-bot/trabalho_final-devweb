/* Organizaê — funcionalidades em JavaScript puro.
   As tarefas ficam salvas no localStorage deste navegador. */
/*Aqui eu tive ajuda da IA para certas duvidas */
(() => {
  "use strict";

  const CHAVE = "organizae.tasks.v1";
  const tela = {
    formulario: document.querySelector("#task-form"),
    titulo: document.querySelector("#task-title"),
    materia: document.querySelector("#task-subject"),
    prazo: document.querySelector("#task-date"),
    lista: document.querySelector("#task-list"),
    vazia: document.querySelector("#empty-state"),
    tituloVazio: document.querySelector("#empty-title"),
    textoVazio: document.querySelector("#empty-description"),
    busca: document.querySelector("#task-search"),
    filtros: document.querySelectorAll(".filter-button"),
    total: document.querySelector("#total-count"),
    pendentes: document.querySelector("#pending-count"),
    concluidas: document.querySelector("#done-count"),
    totalFiltro: document.querySelector("#filter-all-count"),
    pendentesFiltro: document.querySelector("#filter-pending-count"),
    concluidasFiltro: document.querySelector("#filter-completed-count"),
    legendaProgresso: document.querySelector("#progress-caption"),
    barraProgresso: document.querySelector("#progress-bar"),
    progresso: document.querySelector("#progress-fill"),
    dataHoje: document.querySelector("#today-date"),
    ano: document.querySelector("#current-year"),
    dialogo: document.querySelector("#edit-dialog"),
    formularioEdicao: document.querySelector("#edit-form"),
    idEdicao: document.querySelector("#edit-id"),
    tituloEdicao: document.querySelector("#edit-task-title"),
    materiaEdicao: document.querySelector("#edit-task-subject"),
    prazoEdicao: document.querySelector("#edit-task-date"),
    aviso: document.querySelector("#toast"),
    armazenamento: document.querySelector(".storage-note")
  };

  let tarefas = carregarTarefas();
  let filtroAtual = "all";
  let temporizadorAviso;

  iniciar();

  // Inicia a página e conecta os controles às suas ações.
  function iniciar() {
    const hoje = new Date();
    tela.dataHoje.textContent = new Intl.DateTimeFormat("pt-BR", {
      weekday: "long", day: "numeric", month: "long"
    }).format(hoje);
    tela.ano.textContent = hoje.getFullYear();
    tela.prazo.min = paraDataInput(hoje);
    tela.prazoEdicao.min = tela.prazo.min;

    tela.formulario.addEventListener("submit", adicionarTarefa);
    tela.lista.addEventListener("click", tratarCliqueNaLista);
    tela.lista.addEventListener("change", concluirTarefa);
    tela.busca.addEventListener("input", atualizarTela);
    tela.formularioEdicao.addEventListener("submit", salvarEdicao);

    tela.filtros.forEach((botao) => {
      botao.addEventListener("click", () => filtrarTarefas(botao.dataset.filter));
    });
    document.querySelectorAll(".close-dialog").forEach((botao) => {
      botao.addEventListener("click", () => tela.dialogo.close());
    });
    tela.dialogo.addEventListener("click", (evento) => {
      if (evento.target === tela.dialogo) tela.dialogo.close();
    });

    atualizarTela();
  }

  // Lê e grava a lista no armazenamento local do navegador.
  function carregarTarefas() {
    try {
      const salvas = JSON.parse(localStorage.getItem(CHAVE) || "[]");
      return Array.isArray(salvas) ? salvas.filter(tarefaValida) : [];
    } catch {
      mostrarEstadoArmazenamento(false);
      return [];
    }
  }

  function tarefaValida(tarefa) {
    return tarefa && typeof tarefa.id === "string"
      && typeof tarefa.title === "string"
      && typeof tarefa.completed === "boolean";
  }

  function salvarTarefas() {
    try {
      localStorage.setItem(CHAVE, JSON.stringify(tarefas));
      mostrarEstadoArmazenamento(true);
    } catch {
      mostrarEstadoArmazenamento(false);
    }
  }

  function mostrarEstadoArmazenamento(disponivel) {
    const icone = document.createElement("span");
    icone.setAttribute("aria-hidden", "true");
    icone.textContent = disponivel ? "◉" : "!";
    const mensagem = document.createTextNode(disponivel
      ? " Suas tarefas ficam salvas neste dispositivo."
      : " O armazenamento está indisponível; as tarefas podem não ficar salvas.");
    tela.armazenamento.replaceChildren(icone, mensagem);
  }

  // Cria, edita, conclui e remove tarefas.
  function adicionarTarefa(evento) {
    evento.preventDefault();
    const titulo = tela.titulo.value.trim();
    if (!titulo) {
      tela.titulo.setCustomValidity("Digite o nome da tarefa.");
      tela.titulo.reportValidity();
      tela.titulo.addEventListener("input", () => tela.titulo.setCustomValidity(""), { once: true });
      return;
    }

    tarefas.unshift({
      id: criarId(),
      title: titulo,
      subject: tela.materia.value.trim(),
      dueDate: tela.prazo.value,
      completed: false,
      createdAt: new Date().toISOString()
    });
    salvarTarefas();
    tela.formulario.reset();
    atualizarTela();
    tela.titulo.focus();
    mostrarAviso("Tarefa adicionada.");
  }

  function tratarCliqueNaLista(evento) {
    const botao = evento.target.closest("button[data-action]");
    if (!botao) return;
    const tarefa = encontrarTarefa(botao);
    if (!tarefa) return;

    if (botao.dataset.action === "edit") abrirEdicao(tarefa);
    if (botao.dataset.action === "delete") excluirTarefa(tarefa);
  }

  function concluirTarefa(evento) {
    const caixa = evento.target;
    if (!caixa.matches("input[data-action='toggle']")) return;
    const tarefa = encontrarTarefa(caixa);
    if (!tarefa) return;

    tarefa.completed = caixa.checked;
    tarefa.completedAt = tarefa.completed ? new Date().toISOString() : "";
    salvarTarefas();
    atualizarTela();
    mostrarAviso(tarefa.completed ? "Tarefa concluída." : "Tarefa voltou para a lista.");
  }

  function encontrarTarefa(elemento) {
    const item = elemento.closest("[data-task-id]");
    return tarefas.find((tarefa) => tarefa.id === item?.dataset.taskId);
  }

  function abrirEdicao(tarefa) {
    tela.idEdicao.value = tarefa.id;
    tela.tituloEdicao.value = tarefa.title;
    tela.materiaEdicao.value = tarefa.subject || "";
    tela.prazoEdicao.value = tarefa.dueDate || "";
    if (typeof tela.dialogo.showModal === "function") tela.dialogo.showModal();
  }

  function salvarEdicao(evento) {
    evento.preventDefault();
    const tarefa = tarefas.find((item) => item.id === tela.idEdicao.value);
    const titulo = tela.tituloEdicao.value.trim();
    if (!tarefa || !titulo) return;

    Object.assign(tarefa, {
      title: titulo,
      subject: tela.materiaEdicao.value.trim(),
      dueDate: tela.prazoEdicao.value
    });
    salvarTarefas();
    tela.dialogo.close();
    atualizarTela();
    mostrarAviso("Alterações salvas.");
  }

  function excluirTarefa(tarefa) {
    if (!window.confirm(`Excluir a tarefa “${tarefa.title}”?`)) return;
    tarefas = tarefas.filter((item) => item.id !== tarefa.id);
    salvarTarefas();
    atualizarTela();
    mostrarAviso("Tarefa excluída.");
  }

  // Aplica filtros e busca, depois atualiza lista e contadores.
  function filtrarTarefas(filtro) {
    filtroAtual = filtro;
    tela.filtros.forEach((botao) => {
      const ativo = botao.dataset.filter === filtro;
      botao.classList.toggle("is-active", ativo);
      botao.setAttribute("aria-pressed", String(ativo));
    });
    atualizarTela();
  }

  function atualizarTela() {
    atualizarContadores();
    const termo = tela.busca.value.trim().toLocaleLowerCase("pt-BR");
    const visiveis = tarefas.filter((tarefa) => {
      const peloStatus = filtroAtual === "all"
        || (filtroAtual === "pending" && !tarefa.completed)
        || (filtroAtual === "completed" && tarefa.completed);
      const texto = `${tarefa.title} ${tarefa.subject || ""}`.toLocaleLowerCase("pt-BR");
      return peloStatus && texto.includes(termo);
    });

    tela.lista.replaceChildren(...visiveis.map(criarItem));
    tela.vazia.classList.toggle("is-hidden", visiveis.length > 0);
    if (!visiveis.length) atualizarMensagemVazia(termo);
  }

  function atualizarContadores() {
    const total = tarefas.length;
    const concluidas = tarefas.filter((tarefa) => tarefa.completed).length;
    const pendentes = total - concluidas;
    const porcentagem = total ? Math.round(concluidas / total * 100) : 0;

    tela.total.textContent = total;
    tela.pendentes.textContent = pendentes;
    tela.concluidas.textContent = concluidas;
    tela.totalFiltro.textContent = total;
    tela.pendentesFiltro.textContent = pendentes;
    tela.concluidasFiltro.textContent = concluidas;
    tela.progresso.style.width = `${porcentagem}%`;
    tela.barraProgresso.setAttribute("aria-valuenow", String(porcentagem));
    tela.barraProgresso.setAttribute("aria-valuetext", `${porcentagem}% concluído`);
    tela.legendaProgresso.textContent = !total
      ? "Tudo começa com uma tarefa."
      : porcentagem === 100
        ? "Você concluiu tudo. Muito bem!"
        : `${porcentagem}% do caminho concluído.`;
  }

  function criarItem(tarefa) {
    const item = document.createElement("li");
    item.className = `task-item${tarefa.completed ? " is-completed" : ""}`;
    item.dataset.taskId = tarefa.id;

    const caixa = document.createElement("input");
    caixa.type = "checkbox";
    caixa.className = "task-check";
    caixa.checked = tarefa.completed;
    caixa.dataset.action = "toggle";
    caixa.setAttribute("aria-label", tarefa.completed
      ? `Marcar “${tarefa.title}” como não concluída`
      : `Marcar “${tarefa.title}” como concluída`);

    const conteudo = document.createElement("div");
    conteudo.className = "task-content";
    const titulo = document.createElement("p");
    titulo.className = "task-title";
    titulo.textContent = tarefa.title;
    conteudo.append(titulo);

    const detalhes = criarDetalhes(tarefa);
    if (detalhes) conteudo.append(detalhes);

    const acoes = document.createElement("div");
    acoes.className = "task-actions";
    acoes.append(
      criarBotao("edit", "Editar tarefa", "✎", "icon-button"),
      criarBotao("delete", "Excluir tarefa", "×", "icon-button delete-button")
    );
    item.append(caixa, conteudo, acoes);
    return item;
  }

  function criarDetalhes(tarefa) {
    const detalhes = document.createElement("div");
    detalhes.className = "task-meta";
    if (tarefa.subject) {
      const materia = document.createElement("span");
      materia.className = "task-subject";
      materia.textContent = tarefa.subject;
      detalhes.append(materia);
    }
    if (tarefa.dueDate) {
      const prazo = document.createElement("span");
      prazo.className = "task-deadline";
      prazo.textContent = `Prazo: ${formatarData(tarefa.dueDate)}`;
      if (!tarefa.completed && prazoVencido(tarefa.dueDate)) prazo.classList.add("is-overdue");
      detalhes.append(prazo);
    }
    return detalhes.childElementCount ? detalhes : null;
  }

  function criarBotao(acao, rotulo, simbolo, classes) {
    const botao = document.createElement("button");
    botao.type = "button";
    botao.className = classes;
    botao.dataset.action = acao;
    botao.setAttribute("aria-label", rotulo);
    botao.textContent = simbolo;
    return botao;
  }

  function atualizarMensagemVazia(termo) {
    if (termo) {
      tela.tituloVazio.textContent = "Nenhuma tarefa encontrada";
      tela.textoVazio.textContent = "Tente buscar por outro termo ou ajuste os filtros.";
    } else if (!tarefas.length) {
      tela.tituloVazio.textContent = "Sua lista começa aqui";
      tela.textoVazio.textContent = "Escreva uma tarefa acima e deixe o próximo passo mais claro.";
    } else {
      const concluidas = filtroAtual === "completed";
      tela.tituloVazio.textContent = concluidas ? "Nada concluído por enquanto" : "Tudo em dia por aqui";
      tela.textoVazio.textContent = concluidas
        ? "Quando concluir uma tarefa, ela aparecerá nesta lista."
        : "Não há tarefas pendentes neste filtro.";
    }
  }

  // Funções auxiliares para datas, identificadores e avisos.
  function formatarData(data) {
    const [ano, mes, dia] = data.split("-").map(Number);
    return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" })
      .format(new Date(ano, mes - 1, dia));
  }

  function prazoVencido(data) {
    const [ano, mes, dia] = data.split("-").map(Number);
    const prazo = new Date(ano, mes - 1, dia);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    return prazo < hoje;
  }

  function paraDataInput(data) {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const dia = String(data.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
  }

  function criarId() {
    return window.crypto?.randomUUID
      ? window.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function mostrarAviso(mensagem) {
    tela.aviso.textContent = mensagem;
    tela.aviso.classList.add("is-visible");
    window.clearTimeout(temporizadorAviso);
    temporizadorAviso = window.setTimeout(() => {
      tela.aviso.classList.remove("is-visible");
    }, 2600);
  }
})();
