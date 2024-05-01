import { Request, Response } from 'express';

export function hello(req: Request, res: Response): void {
  res.send('hello world');
}
