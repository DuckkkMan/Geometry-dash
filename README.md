# Geometry Dash — Fan Prototype

Protótipo de navegador inspirado em jogos de plataforma de ritmo, feito com HTML, CSS e JavaScript puro.

## Recursos

- Menu principal, seleção de fases, recordes, tentativas, pausa e conclusão.
- Seis modos jogáveis: Cube, Ship, Ball, UFO, Wave e Robot (o Robot tem visual de bola e salto variável).
- Portais desenhados em tempo real no Canvas, com brilho, anéis e partículas; sem modo Spider.
- Garagem com 16 skins PNG próprias em `Skins/`: 6 Cube e 2 de cada outro modo, com degradê personalizável entre duas cores.
- Editor com biblioteca categorizada e busca global, blocos de vários tamanhos, half/quarter blocks, rampas, plataformas curtas/longas/finas, espinhos, pads, orbs, serras de tamanhos diferentes, moedas, triggers, portais e decorações.
- Ferramentas de seleção com arraste alinhado à grade, mover câmera, apagar, copiar/colar/duplicar e histórico de desfazer/refazer.
- Importação e exportação de fases em JSON.
- Modo prática, checkpoints, progresso e trilha do jogador.
- Controles por teclado, mouse e toque; interface responsiva para celular.
- Salvamento local no navegador.

## Controles

- **PC:** Espaço, seta para cima ou clique para jogar; Esc/P pausa.
- **Celular:** toque para jogar; segurar por alguns segundos pausa.
- **Editor:** arraste para colocar elementos; use MÃO/MOVER para navegar; SELECIONAR para mover objetos.
- **Editor (atalhos):** Ctrl+Z desfazer, Ctrl+Y ou Ctrl+Shift+Z refazer, Ctrl+C copiar, Ctrl+V colar, Ctrl+D duplicar, Ctrl+X recortar, Esc desmarcar e Delete apagar a seleção. Arraste um objeto selecionado para movê-lo na grade. A grade usa células de 44 px e fica alinhada ao chão. Use o inspetor para ajustar posição, rotação, escala e grupos.

## Executar

Abra index.html em um navegador moderno. Não é necessário instalar dependências.

## Publicar com GitHub Pages

1. Abra **Settings → Pages** neste repositório.
2. Em **Build and deployment**, selecione **Deploy from a branch**.
3. Escolha a branch **main** e a pasta **/ (root)**.
4. Salve e aguarde o GitHub publicar o site.

Projeto de fã, não oficial, sem músicas, fases ou recursos proprietários do jogo original.


## Atualização 1.5

- 16 imagens PNG em `Skins/`, com proporção original preservada.
- Degradê entre COR 1 e COR 2 aplicado às áreas claras das artes monocromáticas.
- Seis modos: Cube, Ship, Ball, UFO, Wave e Robot. O Robot usa a skin de bola/robô e salto variável.
- Spider removido dos modos e portais.
- Três fases novas: Carbon Rush, Afterglow e Final Drive.
- Novos objetos: bloco 3×2 e plataforma extra longa.


## Correções de estabilidade e interface

- Cores das skins atualizam as miniaturas em tempo real e o degradê continua aplicado durante a partida.
- Ball e Robot giram continuamente; Ball aceita novos toques para alternar a gravidade no ar.
- Trail desenhada atrás do jogador usando a posição real no mundo.
- Canvas do editor mantém proporção 9:5 ao redimensionar, evitando deformar as células da grade.
- Registro de atualizações acessível pelo botão ao lado das configurações.


### Patch 1.5.1

- Atualização em tempo real das cores e miniaturas das skins.
- Rotação contínua de Ball e Robot.
- Rastro de movimento global restaurado atrás do jogador.
- Alternância de gravidade da Ball em toques sucessivos durante o voo.
- Registro de atualizações no menu e canvas do editor com proporção preservada.
