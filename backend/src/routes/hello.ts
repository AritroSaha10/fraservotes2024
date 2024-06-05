import type { Request, Response } from "express";

export function hello(req: Request, res: Response): void {
    res.sendStatus(200);
    res.end();
}
