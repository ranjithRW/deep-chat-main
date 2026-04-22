import {NextFunction, Request, Response} from 'express';
import https from 'https';

// Make sure to set the COHERE_API_KEY environment variable in a .env file (create if does not exist) - see .env.example

export class Cohere {
  public static async chat(body: Request['body'], res: Response, next: NextFunction) {
    const messages = body.messages.map((msg: {role: string; text: string}) => ({
      role: msg.role === 'ai' ? 'assistant' : 'user',
      content: msg.text,
    }));
    const chatBody = {model: 'command-a-03-2025', messages};
    const req = https.request(
      'https://api.cohere.com/v2/chat',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + process.env.COHERE_API_KEY,
        },
      },
      (reqResp) => {
        let data = '';
        reqResp.on('error', next);
        reqResp.on('data', (chunk) => {
          data += chunk;
        });
        reqResp.on('end', () => {
          const result = JSON.parse(data);
          if (result.message && !result.message?.content) {
            next(result);
          } else {
            res.json({text: result.message?.content?.[0]?.text ?? ''});
          }
        });
      }
    );
    req.on('error', next);
    req.write(JSON.stringify(chatBody));
    req.end();
  }

  public static async generateText(body: Request['body'], res: Response, next: NextFunction) {
    const chatBody = {
      model: 'command-a-03-2025',
      messages: [{role: 'user', content: body.messages[0].text}],
    };
    const req = https.request(
      'https://api.cohere.com/v2/chat',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + process.env.COHERE_API_KEY,
        },
      },
      (reqResp) => {
        let data = '';
        reqResp.on('error', next);
        reqResp.on('data', (chunk) => {
          data += chunk;
        });
        reqResp.on('end', () => {
          const result = JSON.parse(data);
          if (result.message && !result.message?.content) {
            next(result);
          } else {
            res.json({text: result.message?.content?.[0]?.text ?? ''});
          }
        });
      }
    );
    req.on('error', next);
    req.write(JSON.stringify(chatBody));
    req.end();
  }

  public static async summarizeText(body: Request['body'], res: Response, next: NextFunction) {
    const chatBody = {
      model: 'command-a-03-2025',
      messages: [{role: 'user', content: `Please summarize the following text:\n\n${body.messages[0].text}`}],
    };
    const req = https.request(
      'https://api.cohere.com/v2/chat',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + process.env.COHERE_API_KEY,
        },
      },
      (reqResp) => {
        let data = '';
        reqResp.on('error', next);
        reqResp.on('data', (chunk) => {
          data += chunk;
        });
        reqResp.on('end', () => {
          const result = JSON.parse(data);
          if (result.message && !result.message?.content) {
            next(result);
          } else {
            res.json({text: result.message?.content?.[0]?.text ?? ''});
          }
        });
      }
    );
    req.on('error', next);
    req.write(JSON.stringify(chatBody));
    req.end();
  }
}
