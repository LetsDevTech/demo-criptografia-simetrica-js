# Criptografia simétrica 'from scratch' no navegador

O objetivo dessa demonstração é esclarecer como funciona uma troca de mensagens protegidas por criptografia simétrica.
O código será executado direto no navegador de internet, só precisamos de javascript puro.
Vamos demonstrar como:

* Derivar chaves
* Utilizar o AES para criptografar e descriptografar mensagens

Na imagem abaixo temos um cenário típico de aplicação da criptografia simétrica:

![overview](./desenhos/overview.png)

> Na imagem Alice envia uma mensagem para o Bob. A mensagem é criptografada com o algoritmo AES-GCM e é utilizada uma chave previamente acordada entre Alice e Bob (e que somente eles dois tem conhecimento). O texto vai criptografado pela internet, passa por diversos roteadores e de algum modo um terceiro personagem, a Eve, consegue interceptar o tráfego da internet e obter a mensagem que Alice enviou para Bob. Mas como a mensagem está protegida pelo uso de criptografia, Eve não consegue abrir ou modificar a mensagem em transito sem que Bob perceba.

---

> Para ajudar na conversão dos bytes em string base64(e vice-versa) utilizamos o código encontrado em https://gist.github.com/enepomnyaschih/72c423f727d395eeaa09697058238727 ([base64.js](./base64.js)) que é uma implementação da [RFC 4648](https://www.rfc-editor.org/rfc/rfc4648).

---

Na nossa demonstração, vamos fazer uso das interfaces [Crypto](https://developer.mozilla.org/en-US/docs/Web/API/Crypto) e [SubtleCrypto](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto), especificadas na [Web CryptoAPI](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API) que tem implementações disponíveis nos navegadores modernos.

## Derivação de chaves

No nosso cenário uma senha é necessaria. O AES tem três versões sendo que cada uma recebe uma chave de tamanho diferente sendo 128, 192 ou 256 bits. Quanto maior a chave maior a força da criptografia. Atualmente muitas aplicações ainda usam 128 bits visto que ainda fornecem um bom nível de segurança. 

Podemos forçar o usuário a escolher uma senha que seja exatamente desses tamanhos mas essa abordagem é um tanto incomum e queremos aproveitar o exemplo para demonstrar como podemos derivar criar chaves mais fortes a partir de entradas fornecidas pelo usuário. Para tal vamos submeter a senha escolhida por Alice e Bob a um algoritmo de derivação de senha chamado H**KDF** (**KDF - Key Derivation Function**). Esse é um algoritmo muito popular utilizado para derivar chaves a partir de uma chave mestra. A interface do HKDF exige obrigatoriamente alguns dados além da senha fornecida pelos usuários:

* Algoritmo de HASH 
* Sal (*salt*)

O algoritmo de hash é uma função que recebe uma entrada de tamanho variável e gera uma saída única para aquela determinada entrada (podemos ter colisões mas isso é assunto para outra hora...). Eles são muito utilizados para garantir a integridade dos dados. É como se a função de hash fizesse um resumo digital de alguma outra coisa. Por exemplo: baixei um programa da internet, mas preciso ter certeza de que o conteúdo do programa não foi alterado em transito ou alguém mal intencionado modificou o arquivo original antes de eu baixar. Se a pessoa que disponilizou o download colocar o hash do arquivo na página, podemos refazer o cálculo do hash depois de baixar o arquivo e comparar os valores. Se os valores forem iguais significa que o arquivo está correto (se não bater você já tem ideia do que pode ter acontecido...). 

O *salt*, ou sal se traduzirmos para o português, é um ingrediente que utilizamos em algumas receitas e ele modifica o sabor da comida a depender do tanto de sal que adicionamos. No algoritmo de derivação de senha ele tem a função de justamente fazer mudar o resultado da chave derivada. No caso como estamos nos baseando na senha inicial de Alice e Bob, temos que usar a mesma receita para derivar a mesma chave nos dois lados. 

## Criptografia simétrica

A criptografia simétrica funciona "embaralhando" ou "bagunçando" uma mensagem de texto com base em uma chave que deve ser mantida em segredo. A mesma chave utilizada para proteger a mensagem é utilizada para descriptografar o conteúdo pelo destinatário o que significa que ANTES a chave deve ser ACORDADA entre as partes (esse assunto por si só rende uma discussão a parte). Portanto assumimos que somente o remetente e destinatário tem acesso ao segredo utilizado para as operações criptográficas. O algoritmo que vamos utilizar nessa demonstração é o AES no modo GCM que é um dos mais utilizados atualmente para operações de criptografia simétrica e é uma construção bastante completa por si só, pois além de fornecer a propriedade da confidencialidade, garante a integridade das mensagens criptografadas (autenticidade). 