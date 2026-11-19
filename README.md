# Organizaê

Aplicação web para organizar tarefas de estudo diretamente no navegador. O projeto usa HTML5, CSS3 e JavaScript puro, sem frameworks ou bibliotecas externas.

**Aplicação publicada:** `https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/`  
> Depois de criar o repositório público e ativar o GitHub Pages, substitua o endereço acima pelo link real.

## Funcionalidades do software

- Cadastrar tarefas com título, matéria opcional e prazo opcional.
- Listar, editar, concluir e excluir tarefas.
- Filtrar tarefas por todas, a fazer ou concluídas.
- Buscar tarefas pelo título ou matéria.
- Ver contadores e uma barra de progresso das tarefas concluídas.
- Manter os dados no navegador com `localStorage`.
- Receber feedback após as ações e avisos para prazos vencidos.
- Usar a interface em telas de celular, tablet e computador.

## Como executar

1. Baixe ou clone este repositório.
2. Abra `index.html` em um navegador moderno como chrome ou firefox.

A aplicação não precisa de servidor, instalação de pacotes ou etapa de compilação. Para desenvolvimento, também pode ser aberta com uma extensão de servidor local no editor.

## Tecnologias

- **HTML5:** estrutura semântica, formulário e elementos acessíveis.
- **CSS3:** identidade visual, estados da interface e layout responsivo.
- **JavaScript puro (Vanilla JS):** eventos, atualização do DOM, filtros, validações e persistência.
- **Git e GitHub:** controle de versão e publicação com GitHub Pages.

Não há frameworks frontend, Bootstrap ou dependências de execução. As fontes DM Sans e Manrope são carregadas do Google Fonts; se a conexão não estiver disponível, o navegador usa uma fonte sem serifa local.

## Organização dos arquivos

```text
organizae/
├── index.html       # Estrutura e conteúdo da página
├── css/
│   └── style.css    # Paleta, layout, estados e responsividade
├── js/
│   └── app.js       # Funcionalidades em JavaScript puro
├── assets/          # Recursos estáticos do projeto
├── README.md        # Documentação
└── LICENSE          # Licença do projeto
```

- mencionado no trabalho

## Decisões de implementação

- As tarefas são mantidas como uma lista de objetos em JavaScript e salvas em `localStorage` após cada alteração. Assim, elas permanecem disponíveis no mesmo navegador e dispositivo.
- A interface cria os elementos das tarefas com métodos do DOM e define o conteúdo fornecido pelo usuário com `textContent`, sem interpretar esse conteúdo como HTML.
- Filtros e busca afetam a lista exibida; os contadores continuam mostrando o total geral por status.
- O HTML usa regiões e rótulos semânticos, e os controles têm nomes acessíveis para leitores de tela e navegação por teclado.
- O CSS organiza os componentes por área da interface e inclui ajustes para telas estreitas, foco visível e preferência por movimento reduzido.

- tenha um bom aproveito do software!

## Publicar no GitHub Pages

1. Crie um repositório público no GitHub e envie os arquivos do projeto.
2. No repositório, abra **Settings → Pages**.
3. Em **Build and deployment**, selecione **Deploy from a branch**.
4. Escolha a branch principal (`main`) e a pasta `/(root)`, depois salve.
5. Aguarde a publicação e copie o endereço exibido pelo GitHub Pages para o topo deste README.

## Armazenamento e privacidade

As tarefas ficam apenas no `localStorage` do navegador usado. Elas não são enviadas para um servidor ou banco de dados. Limpar os dados do navegador remove as tarefas salvas tudo pelo javascript e html.
