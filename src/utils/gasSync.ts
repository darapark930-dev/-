/**
 * Sync helper for Google Apps Script Web App
 */

export interface GasSyncResult {
  success: boolean;
  message: string;
  data?: any;
}

export async function logIntakeToGas(
  gasUrl: string,
  data: {
    name: string;
    time: string;
    date: string;
    status: string;
    memo?: string;
  }
): Promise<GasSyncResult> {
  try {
    const res = await fetch('/api/gas/proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: gasUrl,
        payload: {
          action: 'logIntake',
          name: data.name,
          time: data.time,
          date: data.date,
          status: data.status,
          memo: data.memo || '',
          timestamp: new Date().toISOString(),
        },
      }),
    });

    const result = await res.json();
    if (result.success) {
      return { success: true, message: 'Google Apps Script 동기화 완료', data: result.data };
    }
    return { success: false, message: result.error || '동기화 응답 실패' };
  } catch (err: any) {
    return { success: false, message: err?.message || '네트워크 요청 실패' };
  }
}

export async function testGasConnection(gasUrl: string): Promise<GasSyncResult> {
  try {
    const res = await fetch('/api/gas/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: gasUrl,
        payload: { action: 'ping' },
      }),
    });
    const result = await res.json();
    if (result.success) {
      return { success: true, message: 'Google Apps Script 연결 성공!' };
    }
    return { success: false, message: result.error || '연결 실패' };
  } catch (err: any) {
    return { success: false, message: err?.message || '연결 실패' };
  }
}

/**
 * Standard Google Apps Script (Code.gs) template for Google Sheets integration
 */
export const GAS_SAMPLE_CODE = `// ==========================================
// 스마트 약 복용 알림 Google Apps Script (Code.gs)
// 구글 스프레드시트와 연동하여 복약 기록을 저장하는 스크립트입니다.
// ==========================================

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);
  
  try {
    var raw = e.postData.contents;
    var data = JSON.parse(raw);
    var ss = SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.create("스마트_약복용_기록부");
    var sheet = ss.getSheetByName("복용기록") || ss.insertSheet("복용기록");
    
    // 헤더가 없으면 생성
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["기록일시", "날짜", "약 이름", "복용예정시간", "상태", "메모"]);
      sheet.getRange(1, 1, 1, 6).setFontWeight("bold").setBackground("#f1f5f9");
    }
    
    if (data.action === "logIntake" || data.name) {
      sheet.appendRow([
        new Date().toLocaleString("ko-KR"),
        data.date || new Date().toLocaleDateString("ko-KR"),
        data.name || "-",
        data.time || "-",
        data.status || "복용완료",
        data.memo || ""
      ]);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ result: "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ result: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  return HtmlService.createHtmlOutput("<p>스마트 약 복용 알림 API가 정상 작동 중입니다.</p>");
}
`;
