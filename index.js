import { base64ToBytes, bytesToBase64 } from './base64.js'

const KEY_LENGTH = 128
const INTERACTIONS = 64000 + 128
const encoder = new TextEncoder()
const decoder = new TextDecoder()

// No nosso exemplo vamos utilizar o mesmo sal para derivar a chave simétrica
const SALT = new Uint8Array([124, 31, 201, 28, 94, 74, 199, 78, 116, 125, 80, 158, 224, 147, 172, 227]) //obterSal()

function obterSal() {
    return crypto.getRandomValues(new Uint8Array(16))
}

async function derivarChaveDeSenha(senha) {
    let ret = {}

    // cria o SAL
    ret.salt = SALT // o sal tem que ser o mesmo NO CASO DESSE EXEMPLO
    
    let hkdfParams = {
        name: "HKDF",
        hash: "SHA-256",
        salt: ret.salt,
        info: new Uint8Array(0)
    }
    
    let baseKey = await crypto.subtle.importKey("raw", encoder.encode(senha).buffer, "HKDF", false, ["deriveKey"])

    let aesKeyGenParams = {
        name: "AES-GCM",
        length: KEY_LENGTH
    }

    ret.key = await crypto.subtle.deriveKey( hkdfParams, baseKey, aesKeyGenParams, false, ["decrypt", "encrypt"])

    return ret
}

function criarIV() {
    return crypto.getRandomValues(new Uint8Array(12)) //  https://developer.mozilla.org/en-US/docs/Web/API/AesGcmParams#properties
}

async function criptografarMensagem(mensagem, chaveOuSenha) {

    var chave
    if (typeof chaveOuSenha === 'string')
        chave = (await derivarChaveDeSenha(chaveOuSenha)).key
    else
        chave = chave

    let msgBuffer = encoder.encode(mensagem)

    let iv = criarIV()

    let aesGcmParams = {
        name: "AES-GCM",
        iv: iv
    }

    let cipherText = new Uint8Array(await crypto.subtle.encrypt(aesGcmParams, chave, msgBuffer))
    
    return {
        iv: iv,
        cipherTextB64: bytesToBase64(cipherText)
    }
}

async function descriptografarMensagem(cipherTextB64, iv, chaveOuSenha) {

    var chave
    if (typeof chaveOuSenha === 'string')
        chave = (await derivarChaveDeSenha(chaveOuSenha)).key
    else
        chave = chave

    let cipherText = base64ToBytes(cipherTextB64)

    let aesGcmParams = {
        name: "AES-GCM",
        iv: iv
    }

    return decoder.decode((await crypto.subtle.decrypt(aesGcmParams, chave, cipherText)))
}


function pegaDadosForm1() {
    let pwd1 = document.getElementById('pwd1').value
    let msg1 = document.getElementById('msg1').value
    let iv1 = document.getElementById('iv1').value

    return {
        pwd1, msg1, iv1
    }
}

function pegaDadosForm2() {
    let pwd2 = document.getElementById('pwd2').value
    let iv1 = document.getElementById('iv1').value
    let encryptedB64 = document.getElementById('encryptedB64').textContent

    return {
        pwd2, iv1, encryptedB64
    }
}

function erroConsole1(mensagem) {
    document.getElementById('console1').textContent = mensagem.toUpperCase()
}

function erroConsole2(mensagem) {
    document.getElementById('console2').textContent = mensagem.toUpperCase()
}

function escreveSaidaCriptografada(mensagem) {
    document.getElementById('encryptedB64').textContent = mensagem
}

function escreveSaidaDescriptografada(mensagem) {
    document.getElementById('decryptedMessage').textContent = mensagem
}

async function btEncryptClick() {
    let dados = pegaDadosForm1()

    if (!dados.pwd1 || dados.pwd1.length == 0) {
        erroConsole1("Preencher a senha")
        return
    }

    if (!dados.msg1 || dados.msg1.length == 0) {
        erroConsole1("Preencher a mensagem")
        return
    }

    let criptografado = await criptografarMensagem(dados.msg1, dados.pwd1)

    document.getElementById('iv1').value = JSON.stringify({ iv: criptografado.iv })

    escreveSaidaCriptografada( criptografado.cipherTextB64 )

    erroConsole1("mensagem criptografada")
}

function converterIV(ivTexto) {
    let ivObj = JSON.parse(ivTexto).iv

    let ret = new Uint8Array(Object.keys(ivObj).length)
    let i = 0
    for(let k of Object.keys(ivObj)) {
        ret[i] = ivObj[k]
        i++
    }

    return ret
}

async function btDecryptClick() {
    let dados = pegaDadosForm2()

    if (!dados.pwd2 || dados.pwd2.length == 0) {
        erroConsole2("Preencher a senha")
        return
    }

    if (!dados.iv1 || dados.iv1.length == 0) {
        erroConsole2("Criptografe alguma mensagem antes")
        return
    }

    let iv
    try {
        iv = converterIV(dados.iv1)
    }
    catch (e) {
        erroConsole2("Refaça a criptografia da mensagem. Erro recriando o IV: " + e.message)
        return
    }
    
    
    try {
        base64ToBytes(dados.encryptedB64)
    }
    catch (e) {
        erroConsole2("Refaça a criptografia da mensagem. Erro recuperando bytes criptografados: " + e.message)
        return
    }
    
    try {
        escreveSaidaDescriptografada(await descriptografarMensagem(dados.encryptedB64, iv, dados.pwd2))
        erroConsole2("Mensagem descriptografada")
    }
    catch (e) {
        console.log(e)
        erroConsole2("erro descriptografando mensagem :" + e)
    }
}

// para tornar utilizavel no console e facilitar os testes e demos interativas
window.btEncryptClick = btEncryptClick
window.btDecryptClick = btDecryptClick
window.derivarChaveDeSenha = derivarChaveDeSenha
window.criptografarMensagem = criptografarMensagem
window.descriptografarMensagem = descriptografarMensagem

