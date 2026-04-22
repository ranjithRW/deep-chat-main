import {Request, Response} from 'express';
import https from 'https';

export class Custom {
  public static async chat(body: Request['body'], res: Response) {
    const messages = body.messages.map((m: {role: string; text: string}) => ({
      role: m.role === 'ai' ? 'assistant' : 'user',
      content: m.text,
    }));

    const reqBody = JSON.stringify({model: 'gpt-4o-mini', messages});

    const req = https.request(
      'https://api.openai.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + process.env.OPENAI_API_KEY,
        },
      },
      (apiRes) => {
        let data = '';
        apiRes.on('data', (chunk) => (data += chunk));
        apiRes.on('end', () => {
          const result = JSON.parse(data);
          if (result.error) {
            res.status(500).json({error: result.error.message});
          } else {
            res.json({text: result.choices[0].message.content});
          }
        });
      }
    );
    req.on('error', (e) => res.status(500).json({error: e.message}));
    req.write(reqBody);
    req.end();
  }

  public static async chatStream(body: Request['body'], res: Response) {
    const messages = body.messages.map((m: {role: string; text: string}) => ({
      role: m.role === 'ai' ? 'assistant' : 'user',
      content: m.text,
    }));

    const reqBody = JSON.stringify({model: 'gpt-4o-mini', messages, stream: true});

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    const req = https.request(
      'https://api.openai.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + process.env.OPENAI_API_KEY,
        },
      },
      (apiRes) => {
        apiRes.on('data', (chunk) => {
          const lines = chunk.toString().split('\n').filter((l: string) => l.trim());
          for (const line of lines) {
            const data = line.replace(/^data: /, '').trim();
            if (!data || data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) res.write(`data: ${JSON.stringify({text: content})}\n\n`);
            } catch {}
          }
        });
        apiRes.on('end', () => res.end());
      }
    );
    req.on('error', () => res.end());
    req.write(reqBody);
    req.end();
  }

  public static async files(req: Request, res: Response) {
    const files = req.files as Express.Multer.File[];
    const fileNames = files?.map((f) => f.originalname).join(', ') || 'none';
    const userText = req.body.message1 ? JSON.parse(req.body.message1).text : '';

    const prompt = userText
      ? `The user uploaded: ${fileNames}. They said: "${userText}". Acknowledge the files and respond helpfully.`
      : `The user uploaded these files: ${fileNames}. Acknowledge them and respond helpfully.`;

    const reqBody = JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{role: 'user', content: prompt}],
    });

    const apiReq = https.request(
      'https://api.openai.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + process.env.OPENAI_API_KEY,
        },
      },
      (apiRes) => {
        let data = '';
        apiRes.on('data', (chunk) => (data += chunk));
        apiRes.on('end', () => {
          const result = JSON.parse(data);
          if (result.error) {
            res.status(500).json({error: result.error.message});
          } else {
            res.json({text: result.choices[0].message.content});
          }
        });
      }
    );
    apiReq.on('error', (e) => res.status(500).json({error: e.message}));
    apiReq.write(reqBody);
    apiReq.end();
  }
}
