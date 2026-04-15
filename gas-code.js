// ====================================================
// FREE PORT CMS - Google Apps Script
// このコードをGoogle Apps Scriptのエディタに貼り付けてください
// ====================================================

// 設定
var ADMIN_PASSWORD = '0000';
var SPREADSHEET_ID = '183fNtEqTYHBJSskXH7PBKG_vPu7FKqErRGN7L0o6giQ';

function getSpreadsheet() {
  if (SPREADSHEET_ID) {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

function initSheets() {
  var ss = getSpreadsheet();
  var sheets = ['sections', 'plans', 'options', 'images'];
  sheets.forEach(function(name) {
    if (!ss.getSheetByName(name)) {
      ss.insertSheet(name);
    }
  });
  var sec = ss.getSheetByName('sections');
  if (sec.getLastRow() === 0) {
    sec.appendRow(['id', 'page', 'section_key', 'label_ja', 'label_en', 'title', 'body', 'body2', 'order']);
  }
  var plans = ss.getSheetByName('plans');
  if (plans.getLastRow() === 0) {
    plans.appendRow(['id', 'page', 'plan_key', 'name_en', 'name_ja', 'price', 'description', 'description2', 'tags', 'order']);
  }
  var opts = ss.getSheetByName('options');
  if (opts.getLastRow() === 0) {
    opts.appendRow(['id', 'page', 'group_key', 'group_name_en', 'group_name_ja', 'item_name', 'price', 'order']);
  }
  var imgs = ss.getSheetByName('images');
  if (imgs.getLastRow() === 0) {
    imgs.appendRow(['id', 'page', 'section_key', 'image_url', 'alt', 'position', 'order']);
  }
}

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

function savePageData(page, payload) {
  var ss = getSpreadsheet();
  if (payload.sections) { replacePageData(ss, 'sections', page, payload.sections); }
  if (payload.plans) { replacePageData(ss, 'plans', page, payload.plans); }
  if (payload.options) { replacePageData(ss, 'options', page, payload.options); }
  if (payload.images) { replacePageData(ss, 'images', page, payload.images); }
  return { success: true };
}

function replacePageData(ss, sheetName, page, newRows) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return;
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var pageCol = headers.indexOf('page');
  for (var i = data.length - 1; i >= 1; i--) {
    if (String(data[i][pageCol]) === page) {
      sheet.deleteRow(i + 1);
    }
  }
  newRows.forEach(function(row) {
    row.page = page;
    var newRow = headers.map(function(h) { return row[h] !== undefined ? row[h] : ''; });
    sheet.appendRow(newRow);
  });
}

function getReservedDates() {
  return getReservations().map(function(r) { return r.date; });
}

function getReservations() {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName('reservations');
  if (!sheet || sheet.getLastRow() <= 1) return [];
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var dateIdx = 1;
  var planIdx = headers.indexOf('プラン');
  var slotIdx = headers.indexOf('時間枠');
  var results = [];
  for (var i = 1; i < data.length; i++) {
    var d = data[i][dateIdx];
    if (!d) continue;
    var dateStr;
    if (d instanceof Date) {
      var y = d.getFullYear();
      var m = ('0' + (d.getMonth() + 1)).slice(-2);
      var day = ('0' + d.getDate()).slice(-2);
      dateStr = y + '-' + m + '-' + day;
    } else {
      dateStr = String(d);
    }
    results.push({
      date: dateStr,
      plan: planIdx >= 0 ? String(data[i][planIdx] || '') : '',
      timeSlot: slotIdx >= 0 ? String(data[i][slotIdx] || '') : ''
    });
  }
  return results;
}

function ensureReservationsSheet() {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName('reservations');
  if (!sheet) {
    sheet = ss.insertSheet('reservations');
    sheet.appendRow(['日時', '宿泊日', '人数', 'プラン', 'オプション', '合計', '名前', 'メール', '電話', '備考', '時間枠']);
    return sheet;
  }
  var headers = sheet.getRange(1, 1, 1, Math.max(1, sheet.getLastColumn())).getValues()[0];
  if (headers.indexOf('時間枠') === -1) {
    sheet.getRange(1, headers.length + 1).setValue('時間枠');
  }
  return sheet;
}

function doGet(e) {
  var action = e.parameter.action || '';
  var result = {};
  if (action === 'getPageData') {
    result = getPageData(e.parameter.page || '');
  } else if (action === 'getAllPages') {
    var pages = ['camp', 'coffee', 'gear', 'goods', 'furniture', 'about', 'access'];
    result = {};
    pages.forEach(function(p) { result[p] = getPageData(p); });
  } else if (action === 'checkPassword') {
    result = { valid: e.parameter.pw === ADMIN_PASSWORD };
  } else if (action === 'getReservedDates') {
    result = { dates: getReservedDates() };
  } else if (action === 'getReservations') {
    result = { reservations: getReservations() };
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
  if (!payload.action || payload.action === 'submitReservation') {
    return handleReservation(payload);
  }
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

function handleReservation(payload) {
  var sheet = ensureReservationsSheet();

  // 重複予約チェック
  var isSaunaOnly = (payload.plan === 'サウナのみ');
  var existing = getReservations().filter(function(r) { return r.date === payload.date; });
  var conflict = false;
  for (var i = 0; i < existing.length; i++) {
    var ev = existing[i];
    if (!isSaunaOnly) { conflict = true; break; }
    if (ev.plan !== 'サウナのみ') { conflict = true; break; }
    if (ev.timeSlot && ev.timeSlot === payload.timeSlot) { conflict = true; break; }
  }
  if (payload.date && conflict) {
    return ContentService.createTextOutput(JSON.stringify({
      error: 'duplicate',
      message: 'この日付・時間帯はすでに予約されています'
    })).setMimeType(ContentService.MimeType.JSON);
  }

  sheet.appendRow([
    new Date(), payload.date, payload.guests, payload.plan,
    payload.options, payload.total, payload.name, payload.email,
    payload.phone, payload.notes, payload.timeSlot || ''
  ]);

  var reservationDetail =
    '■ ご利用日: ' + payload.date + '\n' +
    (payload.timeSlot ? '■ 利用時間: ' + payload.timeSlot + '\n' : '') +
    '■ 人数: ' + payload.guests + '名\n' +
    '■ プラン: ' + payload.plan + '\n' +
    (payload.options ? '■ オプション: ' + payload.options + '\n' : '') +
    '■ 合計: ' + payload.total + '\n' +
    (payload.phone ? '■ 電話: ' + payload.phone + '\n' : '') +
    (payload.notes ? '■ 備考: ' + payload.notes + '\n' : '');

  // お客様への確認メール
  if (payload.email) {
    try {
      MailApp.sendEmail({
        to: payload.email,
        subject: '【FREE PORT】ご予約ありがとうございます',
        body: payload.name + ' 様\n\nご予約を承りました。\n\n' +
          reservationDetail + '\n' +
          'ご不明な点がございましたら、お気軽にご連絡ください。\n\n' +
          'FREE PORT\n〒869-3207 熊本県宇城市三角町三角浦1337-11\nmilspec.cps@gmail.com'
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
