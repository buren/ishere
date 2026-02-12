import { createApp } from '../../app';
import commandRoute from './command';

const app = createApp();

app.route('/', commandRoute);

export default app;
