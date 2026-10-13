/**
 * Edição 3x: landing do grupo do WhatsApp -> planilha.
 *
 * Recebe o lead da página /grupo/ e grava numa aba da planilha.
 * Sem ManyChat, sem Hotmart: o trabalho aqui é só registrar quem entrou.
 *
 * Segredos ficam em Configurações do projeto -> Propriedades do script:
 *   CHAVE_WEBHOOK   senha que você inventa, vai na URL como ?k=...
 *   PLANILHA_ID     (opcional) id da planilha, se o script não estiver
 *                   vinculado a ela. Vinculado, nem precisa.
 *   ABA             (opcional) nome da aba. Padrão: "Leads Grupo".
 */

var PROPS = PropertiesService.getScriptProperties();
var ABA_PADRAO = 'Leads Grupo';

/* ============================ ENTRADA ============================ */

function doPost(e) {
  try {
    var chave = (e && e.parameter && e.parameter.k) || '';
    if (chave !== PROPS.getProperty('CHAVE_WEBHOOK')) {
      return resposta({ ok: false, erro: 'chave invalida' });
    }

    // A página manda text/plain pra evitar o preflight de CORS,
    // então o corpo chega como string e a gente parseia aqui.
    var corpo = JSON.parse((e.postData && e.postData.contents) || '{}');
    return registrarLead(corpo);

  } catch (err) {
    registrarErro(err, e);
    return resposta({ ok: false, erro: 'falha interna' });
  }
}

function doGet(e) {
  // ?diag=1&k=SUA_CHAVE -> raio-x da configuração, sem expor segredos
  var p = (e && e.parameter) || {};
  if (p.diag === '1' && p.k === PROPS.getProperty('CHAVE_WEBHOOK')) {
    var info = {
      ok: true,
      versao: '2026-10-13',
      aba: PROPS.getProperty('ABA') || ABA_PADRAO,
      temPlanilhaId: Boolean(PROPS.getProperty('PLANILHA_ID'))
    };
    try {
      var planilha = abrirPlanilha();
      if (!planilha) {
        info.planilha = 'NAO ABRIU. Vincule o script à planilha ou defina PLANILHA_ID';
      } else {
        info.planilha = planilha.getName();
        info.abas = planilha.getSheets().map(function (s) {
          return s.getName() + ' (' + s.getLastRow() + ' linhas)';
        });
      }
    } catch (err) {
      info.planilha = 'ERRO: ' + String(err);
    }
    return resposta(info);
  }
  return resposta({ ok: true, servico: 'Edicao 3x - grupo' });
}

/* ============================ LEAD ============================ */

function registrarLead(corpo) {
  var nome = String(corpo.nome || '').trim().slice(0, 80);
  var telefone = normalizarTelefone(corpo.whatsapp || corpo.telefone);

  if (!nome && !telefone) return resposta({ ok: false, erro: 'lead vazio' });

  var gravou = registrarPorCabecalho(PROPS.getProperty('ABA') || ABA_PADRAO, {
    quando: new Date(),
    nome: nome,
    telefone: telefone ? "+" + telefone : String(corpo.whatsapp || ''),
    origem: String(corpo.origem || '').slice(0, 200),
    referrer: String(corpo.ref || corpo.referrer || '').slice(0, 200)
  });

  return resposta({ ok: true, duplicado: !gravou });
}

/* ============================ PLANILHA ============================ */

/**
 * Grava encaixando cada campo na coluna certa, lendo o cabeçalho.
 * Assim funciona com qualquer ordem de colunas que a planilha já tenha,
 * e cria as que faltarem.
 */
function registrarPorCabecalho(nomeAba, dados) {
  var planilha = abrirPlanilha();
  if (!planilha) return false;

  var folha = planilha.getSheetByName(nomeAba) || planilha.insertSheet(nomeAba);

  var ultimaColuna = folha.getLastColumn();
  var cabecalho = ultimaColuna ? folha.getRange(1, 1, 1, ultimaColuna).getValues()[0] : [];

  if (!cabecalho.length || cabecalho.join('') === '') {
    cabecalho = ['Quando', 'Nome', 'WhatsApp', 'Origem', 'Referrer'];
    folha.getRange(1, 1, 1, cabecalho.length).setValues([cabecalho]).setFontWeight('bold');
    folha.setFrozenRows(1);
  }

  var apelidos = {
    quando:   ['quando', 'data', 'datahora', 'data hora', 'criado em', 'timestamp'],
    nome:     ['nome', 'nome completo', 'name'],
    telefone: ['whatsapp', 'telefone', 'celular', 'phone', 'fone', 'numero', 'número', 'zap'],
    origem:   ['origem', 'pagina', 'página', 'source', 'utm'],
    referrer: ['referrer', 'referencia', 'referência', 'veio de']
  };

  function limpar(t) {
    return String(t).toLowerCase().trim()
      .normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  var posicao = {};
  cabecalho.forEach(function (titulo, i) {
    var t = limpar(titulo);
    for (var campo in apelidos) {
      if (apelidos[campo].indexOf(t) !== -1 && posicao[campo] === undefined) posicao[campo] = i;
    }
  });

  var titulosPadrao = {
    quando: 'Quando', nome: 'Nome', telefone: 'WhatsApp',
    origem: 'Origem', referrer: 'Referrer'
  };
  Object.keys(titulosPadrao).forEach(function (campo) {
    if (posicao[campo] === undefined && dados[campo] !== undefined) {
      cabecalho.push(titulosPadrao[campo]);
      posicao[campo] = cabecalho.length - 1;
      folha.getRange(1, cabecalho.length).setValue(titulosPadrao[campo]).setFontWeight('bold');
    }
  });

  // Mesma pessoa preenchendo de novo não vira linha nova.
  if (posicao.telefone !== undefined && dados.telefone) {
    var ultimaLinha = folha.getLastRow();
    if (ultimaLinha > 1) {
      var telefones = folha.getRange(2, posicao.telefone + 1, ultimaLinha - 1, 1).getValues();
      var novo = chaveTelefone(dados.telefone);
      for (var i = 0; i < telefones.length; i++) {
        if (novo && chaveTelefone(telefones[i][0]) === novo) return false;
      }
    }
  }

  var linha = new Array(cabecalho.length).fill('');
  Object.keys(posicao).forEach(function (campo) {
    if (dados[campo] !== undefined) linha[posicao[campo]] = dados[campo];
  });

  folha.appendRow(linha);
  return true;
}

/* ============================ APOIO ============================ */

function normalizarTelefone(valor) {
  var d = String(valor || '').replace(/\D/g, '').replace(/^0+/, '');
  if (!d) return '';
  if (d.indexOf('55') !== 0) d = '55' + d;
  return (d.length === 12 || d.length === 13) ? d : '';
}

function chaveTelefone(v) {
  var d = String(v || '').replace(/\D/g, '').replace(/^0+/, '');
  if (!d) return '';
  if (d.indexOf('55') !== 0) d = '55' + d;
  return d;
}

function abrirPlanilha() {
  var ativa = SpreadsheetApp.getActiveSpreadsheet();
  if (ativa) return ativa;
  var id = PROPS.getProperty('PLANILHA_ID');
  return id ? SpreadsheetApp.openById(id) : null;
}

function registrarErro(err, e) {
  try {
    var planilha = abrirPlanilha();
    if (!planilha) return;
    var folha = planilha.getSheetByName('Erros') || planilha.insertSheet('Erros');
    folha.appendRow([
      new Date(), String(err),
      JSON.stringify(e && e.postData ? e.postData.contents : '').slice(0, 500)
    ]);
  } catch (_) { /* se nem o log grava, não há o que fazer */ }
}

function resposta(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ============================ TESTE ============================ */

/** Roda daqui mesmo pra conferir se a planilha está respondendo. */
function testarGravacao() {
  var r = registrarLead({
    nome: 'Teste Manual',
    whatsapp: '11999990000',
    origem: 'teste pelo editor',
    ref: '(direto)'
  });
  Logger.log(r.getContent());
  Logger.log('Se veio ok:true, confira a aba "' + (PROPS.getProperty('ABA') || ABA_PADRAO) + '".');
}
