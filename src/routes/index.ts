import express, { Express, Request, Response} from "express";
import { router as StatusRouter } from './status';
import { router as AuthRouter } from './auth';
// import { router as ListingRouter } from './listings';
import { router as InventoryRouter } from './inventory';

const setRoutes = (app: Express) => {
    app.use((err: any, req: any, res: any, next: any) => {
        res.status(500).send();
    });
    console.log('Configuring routes: ');

    app.get('/', (req: Request, res: Response) => {
        res.send('Express + TypeScript Server');
    });
    // Status
    app.use('/status', StatusRouter);
    app.use('/auth', AuthRouter);
    // app.use('/listings', ListingRouter);
    app.use('/inventory', InventoryRouter);
};

export default setRoutes;