// Cashbook backend — Google Apps Script Web App backed by this spreadsheet.
// Deploy: Extensions > Apps Script > paste this > set SECRET below >
// Deploy > New deployment > Web app > Execute as "Me" > Who has access "Anyone" > Deploy.
// Copy the resulting /exec URL and the SECRET into the app's Settings > Connection.

var SECRET = 'CHANGE_ME_TO_A_RANDOM_SECRET';

var SHEETS = {
  accounts: ['id', 'name', 'type', 'color', 'openingBalance'],
  categories: ['id', 'name', 'type', 'color', 'icon', 'monthlyLimit'],
  transactions: ['id', 'accountId', 'categoryId', 'type', 'amount', 'note', 'date'],
  recurring: ['id', 'accountId', 'categoryId', 'type', 'amount', 'note', 'dayOfMonth', 'lastGeneratedMonth'],
};

function getSheet_(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(SHEETS[name]);
  }
  return sheet;
}

function sheetToObjects_(sheet) {
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  var headers = values[0];
  var out = [];
  for (var r = 1; r < values.length; r++) {
    if (values[r][0] === '') continue;
    var obj = {};
    for (var c = 0; c < headers.length; c++) {
      var v = values[r][c];
      if (Object.prototype.toString.call(v) === '[object Date]') {
        v = Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd');
      }
      obj[headers[c]] = v;
    }
    out.push(obj);
  }
  return out;
}

function jsonOut_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  var token = e.parameter.token;
  if (token !== SECRET) return jsonOut_({ ok: false, error: 'unauthorized' });

  var action = e.parameter.action;
  if (action === 'all') {
    var data = {};
    for (var name in SHEETS) {
      data[name] = sheetToObjects_(getSheet_(name));
    }
    return jsonOut_({ ok: true, data: data });
  }
  if (action === 'list') {
    var sheetName = e.parameter.sheet;
    if (!SHEETS[sheetName]) return jsonOut_({ ok: false, error: 'unknown sheet' });
    return jsonOut_({ ok: true, data: sheetToObjects_(getSheet_(sheetName)) });
  }
  return jsonOut_({ ok: false, error: 'unknown action' });
}

function doPost(e) {
  var body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonOut_({ ok: false, error: 'bad request body' });
  }
  if (body.token !== SECRET) return jsonOut_({ ok: false, error: 'unauthorized' });

  var name = body.sheet;
  var cols = SHEETS[name];
  if (!cols) return jsonOut_({ ok: false, error: 'unknown sheet' });

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sheet = getSheet_(name);

    if (body.action === 'create') {
      var id = Utilities.getUuid();
      var row = cols.map(function (c) {
        if (c === 'id') return id;
        var v = body.data ? body.data[c] : undefined;
        return v === undefined || v === null ? '' : v;
      });
      sheet.appendRow(row);
      return jsonOut_({ ok: true, id: id });
    }

    if (body.action === 'update') {
      var values = sheet.getDataRange().getValues();
      for (var r = 1; r < values.length; r++) {
        if (values[r][0] === body.id) {
          for (var c = 0; c < cols.length; c++) {
            var col = cols[c];
            if (body.data && Object.prototype.hasOwnProperty.call(body.data, col)) {
              var v = body.data[col];
              sheet.getRange(r + 1, c + 1).setValue(v === undefined || v === null ? '' : v);
            }
          }
          return jsonOut_({ ok: true });
        }
      }
      return jsonOut_({ ok: false, error: 'not found' });
    }

    if (body.action === 'delete') {
      var delValues = sheet.getDataRange().getValues();
      for (var d = 1; d < delValues.length; d++) {
        if (delValues[d][0] === body.id) {
          sheet.deleteRow(d + 1);
          return jsonOut_({ ok: true });
        }
      }
      return jsonOut_({ ok: false, error: 'not found' });
    }

    return jsonOut_({ ok: false, error: 'unknown action' });
  } finally {
    lock.releaseLock();
  }
}
