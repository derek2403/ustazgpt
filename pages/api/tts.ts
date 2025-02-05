import type { NextApiRequest, NextApiResponse } from 'next';
import { API_CONFIG } from '../../config/constants';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('TTS API: Attempting to connect to Flask server...');
    
    const flaskResponse = await fetch(`${API_CONFIG.TTS_SERVER_URL}/tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'audio/wav',
      },
      body: JSON.stringify(req.body),
    });

    console.log('TTS API: Flask response status:', flaskResponse.status);

    if (!flaskResponse.ok) {
      const errorText = await flaskResponse.text();
      console.error('TTS API: Flask error:', errorText);
      throw new Error(errorText || 'TTS server error');
    }

    const audioBuffer = await flaskResponse.arrayBuffer();
    console.log('TTS API: Received audio buffer size:', audioBuffer.byteLength);
    
    res.setHeader('Content-Type', 'audio/wav');
    res.setHeader('Content-Length', audioBuffer.byteLength);
    res.send(Buffer.from(audioBuffer));

  } catch (error: any) {
    console.error('TTS API Error:', error);
    res.status(500).json({ 
      error: 'Failed to generate speech',
      details: error.message 
    });
  }
} 