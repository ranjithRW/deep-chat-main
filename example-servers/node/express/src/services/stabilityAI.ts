import {NextFunction, Request, Response} from 'express';
import FormData from 'form-data';
import https from 'https';

// Make sure to set the STABILITY_API_KEY environment variable in a .env file (create if does not exist) - see .env.example

export class StabilityAI {
  public static async textToImage(body: Request['body'], res: Response, next: NextFunction) {
    const formData = new FormData();
    formData.append('prompt', body.messages[0].text);
    formData.append('output_format', 'png');

    const req = https.request(
      'https://api.stability.ai/v2beta/stable-image/generate/core',
      {
        method: 'POST',
        headers: {
          ...formData.getHeaders(),
          Accept: 'application/json',
          Authorization: 'Bearer ' + process.env.STABILITY_API_KEY,
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
          if (result.errors || result.name === 'Error') {
            next(result);
          } else {
            res.json({files: [{type: 'image', src: `data:image/png;base64,${result.image}`}]});
          }
        });
      }
    );
    req.on('error', next);
    formData.pipe(req);
  }

  // You can use an example image here: https://github.com/OvidijusParsiunas/deep-chat/blob/main/example-servers/ui/assets/example-image.png
  public static async imageToImage(req: Request, res: Response, next: NextFunction) {
    const formData = new FormData();
    if ((req.files as Express.Multer.File[])?.[0]) {
      const imageFile = (req.files as Express.Multer.File[])?.[0];
      formData.append('image', imageFile.buffer, {filename: imageFile.originalname, contentType: imageFile.mimetype});
      formData.append('prompt', JSON.parse(req.body.message1).text);
      formData.append('output_format', 'png');
      formData.append('strength', '0.75');
    }
    const formReq = https.request(
      'https://api.stability.ai/v2beta/stable-image/generate/sd3',
      {
        method: 'POST',
        headers: {
          ...formData.getHeaders(),
          Accept: 'application/json',
          Authorization: 'Bearer ' + process.env.STABILITY_API_KEY,
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
            if (result.errors || result.name === 'Error') {
              next(result);
            } else {
              res.json({files: [{type: 'image', src: `data:image/png;base64,${result.image}`}]});
            }
          } catch (e) {
            next(e);
          }
        });
      }
    );
    formReq.on('error', next);
    formData.pipe(formReq);
  }

  // You can use an example image here: https://github.com/OvidijusParsiunas/deep-chat/blob/main/example-servers/ui/assets/example-image.png
  public static async imageToImageUpscale(req: Request, res: Response, next: NextFunction) {
    const formData = new FormData();
    if ((req.files as Express.Multer.File[])?.[0]) {
      const imageFile = (req.files as Express.Multer.File[])?.[0];
      formData.append('image', imageFile.buffer, {filename: imageFile.originalname, contentType: imageFile.mimetype});
      formData.append('output_format', 'png');
    }
    const formReq = https.request(
      'https://api.stability.ai/v2beta/stable-image/upscale/conservative',
      {
        method: 'POST',
        headers: {
          ...formData.getHeaders(),
          Accept: 'application/json',
          Authorization: 'Bearer ' + process.env.STABILITY_API_KEY,
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
            if (result.errors || result.name === 'Error') {
              next(result);
            } else {
              res.json({files: [{type: 'image', src: `data:image/png;base64,${result.image}`}]});
            }
          } catch (e) {
            next(e);
          }
        });
      }
    );
    formReq.on('error', next);
    formData.pipe(formReq);
  }
}
