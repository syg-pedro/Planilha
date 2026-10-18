# Compatibilidade com APKs antigos

Este diretório é publicado exclusivamente no projeto Vercel antigo que possui
`planilha-mocha.vercel.app`. Ele encaminha páginas, arquivos e APIs para
`https://planilha-cyan.vercel.app`, que concentra a configuração do Supabase.

O endereço permanece o mesmo dentro do WebView: não há redirecionamento para o
navegador externo, nem cópia de chaves privadas entre projetos. Respostas de API
não podem ser armazenadas em cache compartilhado.

Não publique a aplicação Nuxt sem autenticação nesse projeto. Publique a raiz do
repositório no projeto principal pelo GitHub e use somente este diretório para
atualizar a compatibilidade com APKs existentes.

Para publicar, configure `VERCEL_ORG_ID` e `VERCEL_PROJECT_ID` com os identificadores
do projeto antigo e execute `vercel deploy deployment/legacy-mobile --prod`.
Confira o destino, a configuração pública do login e o preflight CORS antes de
promover o domínio legado. Não modifique o vínculo Vercel da raiz do repositório.
