// Cloudflare Worker：Gemini API 安全代理
// 部署後，請在 Worker Settings → Variables 新增：GEMINI_API_KEY
// 可選環境變數：GEMINI_TEXT_MODEL=gemini-2.0-flash，GEMINI_IMAGE_MODEL=gemini-2.0-flash-preview-image-generation

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

function json(data, status=200){
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type':'application/json', ...corsHeaders }});
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
    if (request.method !== 'POST') return json({ error: 'Only POST is allowed' }, 405);
    if (!env.GEMINI_API_KEY) return json({ error: 'GEMINI_API_KEY is not configured in Cloudflare Worker variables.' }, 500);

    try {
      const { kind='text', payload={} } = await request.json();
      if (kind === 'image') return await generateImage(env, payload.prompt || '');
      return await generateText(env, payload.prompt || '', payload.schema || null);
    } catch (err) {
      return json({ error: err.message || String(err) }, 500);
    }
  }
};

async function generateText(env, prompt, schema){
  const model = env.GEMINI_TEXT_MODEL || 'gemini-2.0-flash';
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: schema ? { responseMimeType:'application/json', responseSchema:schema } : { responseMimeType:'application/json' }
  };
  const res = await fetch(endpoint, {
    method:'POST',
    headers:{ 'Content-Type':'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if(!res.ok) return json({ error:'Gemini text API error', detail:data }, res.status);
  const text = data.candidates?.[0]?.content?.parts?.map(p=>p.text||'').join('') || '';
  return json({ text, raw:data });
}

async function generateImage(env, prompt){
  // 注意：Gemini 圖片模型名稱可能依 Google API 版本調整；可在 Cloudflare 環境變數 GEMINI_IMAGE_MODEL 修改。
  const model = env.GEMINI_IMAGE_MODEL || 'gemini-2.0-flash-preview-image-generation';
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { responseModalities: ['TEXT','IMAGE'] }
  };
  const res = await fetch(endpoint, {
    method:'POST',
    headers:{ 'Content-Type':'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if(!res.ok) return json({ error:'Gemini image API error', detail:data }, res.status);
  const parts = data.candidates?.[0]?.content?.parts || [];
  const imagePart = parts.find(p => p.inlineData?.data || p.inline_data?.data);
  const imageBase64 = imagePart?.inlineData?.data || imagePart?.inline_data?.data || '';
  const mimeType = imagePart?.inlineData?.mimeType || imagePart?.inline_data?.mime_type || 'image/png';
  return json({ imageBase64, mimeType, raw:data });
}
