// ====================================================
// FREE PORT CMS - Google Apps Script
// このコードをGoogle Apps Scriptのエディタに貼り付けてください
// ====================================================

// 設定
var ADMIN_PASSWORD = '0000'; // 管理画面のパスワード（変更してください）
var SPREADSHEET_ID = '183fNtEqTYHBJSskXH7PBKG_vPu7FKqErRGN7L0o6giQ';

function getSpreadsheet() {
  if (SPREADSHEET_ID) {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

// ========== シート初期化 ==========
function initSheets() {
  var ss = getSpreadsheet();
  var sheets = ['sections', 'plans', 'options', 'images'];
  sheets.forEach(function(name) {
    if (!ss.getSheetByName(name)) {
      ss.insertSheet(name);
    }
  });

  // sections ヘッダー
  var sec = ss.getSheetByName('sections');
  if (sec.getLastRow() === 0) {
    sec.appendRow(['id', 'page', 'section_key', 'label_ja', 'label_en', 'title', 'body', 'body2', 'order']);
  }

  // plans ヘッダー
  var plans = ss.getSheetByName('plans');
  if (plans.getLastRow() === 0) {
    plans.appendRow(['id', 'page', 'plan_key', 'name_en', 'name_ja', 'price', 'description', 'description2', 'tags', 'order']);
  }

  // options ヘッダー
  var opts = ss.getSheetByName('options');
  if (opts.getLastRow() === 0) {
    opts.appendRow(['id', 'page', 'group_key', 'group_name_en', 'group_name_ja', 'item_name', 'price', 'order']);
  }

  // images ヘッダー
  var imgs = ss.getSheetByName('images');
  if (imgs.getLastRow() === 0) {
    imgs.appendRow(['id', 'page', 'section_key', 'image_url', 'alt', 'position', 'order']);
  }
}

// ========== データ読み込み ==========
function getSheetData(sheetName) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() <= 1) return [];

  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var rows = [];
  for (var i = 1; i < data.length; i++) {
    var row = {};
    for (var j = 0; j < headers.length; j++) {
      row[headers[j]] = data[i][j];
    }
    rows.push(row);
  }
  return rows;
}

function getPageData(page) {
  var allSections = getSheetData('sections');
  var allPlans = getSheetData('plans');
  var allOptions = getSheetData('options');
  var allImages = getSheetData('images');

  return {
    sections: allSections.filter(function(r) { return r.page === page; }),
    plans: allPlans.filter(function(r) { return r.page === page; }),
    options: allOptions.filter(function(r) { return r.page === page; }),
    images: allImages.filter(function(r) { return r.page === page; })
  };
}

// ========== データ書き込み ==========
function updateSheetRow(sheetName, id, updates) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var idCol = headers.indexOf('id');

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][idCol]) === String(id)) {
      for (var key in updates) {
        var col = headers.indexOf(key);
        if (col >= 0) {
          sheet.getRange(i + 1, col + 1).setValue(updates[key]);
        }
      }
      return true;
    }
  }
  return false;
}

function addSheetRow(sheetName, rowData) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var newRow = headers.map(function(h) { return rowData[h] || ''; });
  sheet.appendRow(newRow);
  return true;
}

function deleteSheetRow(sheetName, id) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var idCol = headers.indexOf('id');

  for (var i = data.length - 1; i >= 1; i--) {
    if (String(data[i][idCol]) === String(id)) {
      sheet.deleteRow(i + 1);
      return true;
    }
  }
  return false;
}

// ========== 全データ保存（ページ単位で一括） ==========
function savePageData(page, payload) {
  var ss = getSpreadsheet();

  // sections
  if (payload.sections) {
    replacePageData(ss, 'sections', page, payload.sections);
  }
  // plans
  if (payload.plans) {
    replacePageData(ss, 'plans', page, payload.plans);
  }
  // options
  if (payload.options) {
    replacePageData(ss, 'options', page, payload.options);
  }
  // images
  if (payload.images) {
    replacePageData(ss, 'images', page, payload.images);
  }

  return { success: true };
}

function replacePageData(ss, sheetName, page, newRows) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return;

  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var pageCol = headers.indexOf('page');

  // 該当ページの行を削除（下から）
  for (var i = data.length - 1; i >= 1; i--) {
    if (String(data[i][pageCol]) === page) {
      sheet.deleteRow(i + 1);
    }
  }

  // 新しいデータを追加
  newRows.forEach(function(row) {
    row.page = page;
    var newRow = headers.map(function(h) { return row[h] !== undefined ? row[h] : ''; });
    sheet.appendRow(newRow);
  });
}

// ========== HTTP ハンドラ ==========
function doGet(e) {
  var action = e.parameter.action || '';
  var result = {};

  if (action === 'getPageData') {
    result = getPageData(e.parameter.page || '');
  } else if (action === 'getAllPages') {
    var pages = ['camp', 'coffee', 'gear', 'goods', 'furniture', 'about', 'access'];
    result = {};
    pages.forEach(function(p) {
      result[p] = getPageData(p);
    });
  } else if (action === 'checkPassword') {
    result = { valid: e.parameter.pw === ADMIN_PASSWORD };
  } else if (action === 'getReservedDates') {
    result = { dates: getReservedDates() };
  } else {
    result = { error: 'unknown action' };
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var payload;
  try {
    payload = JSON.parse(e.postData.contents);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: 'invalid JSON' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // 既存の予約処理（actionがない場合）
  if (!payload.action || payload.action === 'submitReservation') {
    return handleReservation(payload);
  }

  // CMS操作はパスワード必須
  if (payload.password !== ADMIN_PASSWORD) {
    return ContentService.createTextOutput(JSON.stringify({ error: 'unauthorized' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  var result = {};

  if (payload.action === 'savePageData') {
    result = savePageData(payload.page, payload.data);
  } else if (payload.action === 'updateRow') {
    result = { success: updateSheetRow(payload.sheet, payload.id, payload.data) };
  } else if (payload.action === 'addRow') {
    result = { success: addSheetRow(payload.sheet, payload.data) };
  } else if (payload.action === 'deleteRow') {
    result = { success: deleteSheetRow(payload.sheet, payload.id) };
  } else {
    result = { error: 'unknown action' };
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ========== 予約済み日付の取得 ==========
function getReservedDates() {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName('reservations');
  if (!sheet || sheet.getLastRow() <= 1) return [];
  var data = sheet.getDataRange().getValues();
  var dates = [];
  for (var i = 1; i < data.length; i++) {
    var d = data[i][1]; // 宿泊日 列
    if (!d) continue;
    if (d instanceof Date) {
      var y = d.getFullYear();
      var m = ('0' + (d.getMonth() + 1)).slice(-2);
      var day = ('0' + d.getDate()).slice(-2);
      dates.push(y + '-' + m + '-' + day);
    } else {
      dates.push(String(d));
    }
  }
  return dates;
}

// ========== 既存の予約処理 ==========
function handleReservation(payload) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName('reservations');
  if (!sheet) {
    sheet = ss.insertSheet('reservations');
    sheet.appendRow(['日時', '宿泊日', '人数', 'プラン', 'オプション', '合計', '名前', 'メール', '電話', '備考']);
  }

  // 重複予約チェック（同日1組のみ）
  var reserved = getReservedDates();
  if (payload.date && reserved.indexOf(payload.date) !== -1) {
    return ContentService.createTextOutput(JSON.stringify({
      error: 'duplicate',
      message: 'この日付はすでに予約されています'
    })).setMimeType(ContentService.MimeType.JSON);
  }

  sheet.appendRow([
    new Date(),
    payload.date,
    payload.guests,
    payload.plan,
    payload.options,
    payload.total,
    payload.name,
    payload.email,
    payload.phone,
    payload.notes
  ]);

  // 予約内容テンプレート
  var reservationDetail =
    '■ ご利用日: ' + payload.date + '\n' +
    '■ 人数: ' + payload.guests + '名\n' +
    '■ プラン: ' + payload.plan + '\n' +
    (payload.options ? '■ オプション: ' + payload.options + '\n' : '') +
    '■ 合計: ' + payload.total + '\n' +
    (payload.phone ? '■ 電話: ' + payload.phone + '\n' : '') +
    (payload.notes ? '■ 備考: ' + payload.notes + '\n' : '');

  // お客様への自動返信メール
  if (payload.email) {
    try {
      MailApp.sendEmail({
        to: payload.email,
        subject: '【FREE PORT】ご予約ありがとうございます',
        body: payload.name + ' 様\n\n' +
          'ご予約を承りました。\n\n' +
          reservationDetail + '\n' +
          'ご不明な点がございましたら、お気軽にご連絡ください。\n\n' +
          'FREE PORT\n' +
          '〒869-3207 熊本県宇城市三角町三角浦1337-11\n' +
          'milspec.cps@gmail.com'
      });
    } catch(e) {
      Logger.log('お客様メール送信エラー: ' + e.toString());
    }
  }

  // オーナーへの通知メール
  try {
    MailApp.sendEmail({
      to: 'milspec.cps@gmail.com',
      subject: '【FREE PORT】新規予約: ' + (payload.name || '名前なし') + ' 様',
      body: '新しい予約が入りました。\n\n' +
        '■ 名前: ' + (payload.name || '未入力') + '\n' +
        '■ メール: ' + (payload.email || '未入力') + '\n' +
        reservationDetail + '\n' +
        'スプレッドシートで確認:\nhttps://docs.google.com/spreadsheets/d/183fNtEqTYHBJSskXH7PBKG_vPu7FKqErRGN7L0o6giQ/edit'
    });
  } catch(e) {
    Logger.log('オーナー通知メール送信エラー: ' + e.toString());
  }

  return ContentService.createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
