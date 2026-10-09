import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Google GenAI
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', hasGeminiKey: Boolean(apiKey) });
});

// Proxy for Google Apps Script to bypass browser CORS
app.post('/api/gas/proxy', async (req, res) => {
  const { url, payload } = req.body;
  const targetUrl = url || 'https://script.google.com/macros/s/AKfycbxiyZvirJeN4u9BJfAvQMNOiOlCh4r7RZ5argx9ye-lYGVtP1ZnOov3pMTOpcg29bvq/exec';

  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload || {}),
      redirect: 'follow',
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    res.json({ success: true, status: response.status, data });
  } catch (error: any) {
    console.error('GAS proxy error:', error?.message);
    res.status(500).json({ success: false, error: error?.message || 'Failed to reach Apps Script' });
  }
});

// AI: Check drug interactions and dietary advice
app.post('/api/ai/analyze-interactions', async (req, res) => {
  if (!ai) {
    return res.status(503).json({
      error: 'GEMINI_API_KEY가 설정되지 않았습니다. 기본 복약 가이드를 이용해주세요.',
    });
  }

  const { medications } = req.body;
  if (!Array.isArray(medications) || medications.length === 0) {
    return res.status(400).json({ error: '등록된 복용 약물이 없습니다.' });
  }

  const medSummary = medications
    .map(
      (m: any, idx: number) =>
        `${idx + 1}. ${m.name} (시간: ${m.time || '지정 안 됨'}, 용량: ${m.dosage || '1정'}, 용법/메모: ${m.memo || '없음'}, 구분: ${m.category || '기타'})`
    )
    .join('\n');

  const prompt = `당신은 친절하고 전문적인 대한민국 임상 약사 AI입니다. 
다음은 사용자가 현재 복용 중인 약품 및 영양제 목록입니다:

${medSummary}

다음 항목을 알기 쉽게 한국어로 분석하여 마크다운 형태로 안내해주세요:
1. **약물 및 영양제 간 상호작용 및 복용 간격 제안**: 함께 복용해도 안전한지, 시간 간격을 두어야 하는 조합이 있는지(예: 칼슘과 철분 2시간 간격, 유산균은 공복 등)
2. **주의해야 할 음식 및 음료**: (예: 자몽, 카페인, 우유, 알코올과의 상호작용)
3. **복용 꿀팁 및 권장 복용 시간 점검**: 현재 설정된 복용 시간대가 이상적인지 조언
4. **주의 증상 및 전문가 상담 권고**: 부작용 발생 시 주의점

*주의: "본 정보는 참고용이며 전문의 또는 약사의 상담을 대체할 수 없습니다"라는 의학적 안내 문구를 반드시 하단에 포함하세요.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    res.json({ analysis: response.text });
  } catch (err: any) {
    console.error('AI analysis error:', err);
    res.status(500).json({ error: err?.message || 'AI 분석 처리 중 오류가 발생했습니다.' });
  }
});

// AI: Ask medication Q&A
app.post('/api/ai/medication-advice', async (req, res) => {
  if (!ai) {
    return res.status(503).json({ error: 'GEMINI_API_KEY가 설정되지 않았습니다.' });
  }

  const { question, medications } = req.body;
  if (!question) {
    return res.status(400).json({ error: '질문 내용을 입력해주세요.' });
  }

  const medContext = Array.isArray(medications) && medications.length > 0
    ? medications.map((m: any) => `- ${m.name} (${m.time}, ${m.memo || ''})`).join('\n')
    : '등록된 약물 없음';

  const prompt = `당신은 환자의 건강을 진심으로 생각하는 친절하고 꼼꼼한 약사 AI입니다.
[환자의 복용 약물 목록]
${medContext}

[환자의 질문]
${question}

환자가 이해하기 쉽게 명확하고 신뢰성 있는 복약 지도를 제공하세요. 
질문이 특정 약에 대한 복용법, 누락 시 대처법, 부작용, 보관법 등이라면 구체적이고 실천 가능한 조언을 제공하고, 전문의 상담이 필요한 경우 정중히 안내하세요.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    res.json({ answer: response.text });
  } catch (err: any) {
    console.error('AI advice error:', err);
    res.status(500).json({ error: err?.message || '답변 생성 실패' });
  }
});

// AI: Smart prescription text parser
app.post('/api/ai/parse-prescription', async (req, res) => {
  if (!ai) {
    return res.status(503).json({ error: 'GEMINI_API_KEY가 설정되지 않았습니다.' });
  }

  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: '처방전 또는 약 텍스트를 입력해주세요.' });
  }

  const prompt = `사용자가 입력한 처방전, 복약 지도서, 약 봉투 내용에서 약물 정보를 추출하여 정확한 JSON 배열 형식으로만 응답해주세요.

입력 텍스트:
"""${text}"""

반드시 다음 JSON 배열 구조로만 반환하세요 (마크다운 백틱 없이 순수 JSON):
[
  {
    "name": "약 이름 (예: 비타민 D 1000IU, 아모디핀정 5mg)",
    "time": "HH:mm 형식의 권장 복용 시간 (예: 아침 식후면 '08:30', 점심 '13:00', 저녁 '19:00', 취침전 '22:00', 알 수 없으면 '09:00')",
    "dosage": "1회 복용량 (예: 1정, 1포, 2캡슐)",
    "memo": "용법 및 주의사항 (예: 식후 30분, 물 1컵과 함께, 졸음 유발 주의)",
    "category": "prescription | supplement | chronic | otc 중 하나 (기본값: prescription)"
  }
]`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '[]');
    res.json({ medications: parsed });
  } catch (err: any) {
    console.error('AI prescription parse error:', err);
    res.status(500).json({ error: '처방전 텍스트 분석에 실패했습니다.' });
  }
});

// Setup Vite or static serving
async function start() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server started on http://0.0.0.0:${PORT}`);
  });
}

start();
