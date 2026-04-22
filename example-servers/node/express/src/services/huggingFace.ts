import {NextFunction, Request, Response} from 'express';
import https from 'https';

// Make sure to set the HUGGING_FACE_API_KEY environment variable in a .env file (create if does not exist) - see .env.example

export class HuggingFace {
  public static async conversation(body: Request['body'], res: Response, next: NextFunction) {
    const messages = body.messages.map((m: {role: string; text: string}) => ({
      role: m.role === 'ai' ? 'assistant' : 'user',
      content: m.text,
    }));

    const reqBody = JSON.stringify({
      model: 'meta-llama/Llama-3.2-1B-Instruct',
      messages,
      max_tokens: 300,
    });

    const req = https.request(
      'https://router.huggingface.co/hf-inference/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + process.env.HUGGING_FACE_API_KEY,
        },
      },
      (reqResp) => {
        let data = '';
        reqResp.on('error', next);
        reqResp.on('data', (chunk) => {
          data += chunk;
        });
        reqResp.on('end', () => {
          try {
            const result = JSON.parse(data);
            if (result.error) {
              next(new Error(result.error));
            } else {
              res.json({text: result.choices?.[0]?.message?.content?.trim() ?? ''});
            }
          } catch (e) {
            next(new Error(`HuggingFace returned unexpected response: ${data.slice(0, 200)}`));
          }
        });
      }
    );
    req.on('error', next);
    req.write(reqBody);
    req.end();
  }

  // You can use an example image here: https://github.com/OvidijusParsiunas/deep-chat/blob/main/example-servers/ui/assets/example-image.png
  public static async imageClassification(req: Request, res: Response, next: NextFunction) {
    const url = 'https://api-inference.huggingface.co/models/google/vit-base-patch16-224';
    const parseResult = (result: any) => result[0].label;
    HuggingFace.sendFile(req, res, url, parseResult, next);
  }

  // You can use an example audio file here: https://github.com/OvidijusParsiunas/deep-chat/blob/main/example-servers/ui/assets/example-audio.m4a
  public static async speechRecognition(req: Request, res: Response, next: NextFunction) {
    const url = 'https://api-inference.huggingface.co/models/facebook/wav2vec2-large-960h-lv60-self';
    const parseResult = (result: any) => result.text;
    HuggingFace.sendFile(req, res, url, parseResult, next);
  }

  // prettier-ignore
  private static async sendFile(
      req: Request, res: Response, url: string, parseResult: (result: any) => string, next: NextFunction) {
    const fileReq = https.request(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
          Authorization: 'Bearer ' + process.env.HUGGING_FACE_API_KEY,
        },
      },
      (reqResp) => {
        let data = '';
        reqResp.on('error', next);
        reqResp.on('data', (chunk) => {
          data += chunk;
        });
        reqResp.on('end', () => {
          try {
            const result = JSON.parse(data);
            if (result.error) {
              next(result.error);
            } else {
              res.json({text: parseResult(result)});
            }
          } catch (e) {
            next(new Error(`HuggingFace returned unexpected response: ${data.slice(0, 200)}`));
          }
        });
      }
    );
    fileReq.on('error', next);
    fileReq.write((req.files as Express.Multer.File[])[0].buffer);
    fileReq.end();
  }
}
