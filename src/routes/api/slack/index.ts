import { createApp } from '../../app';
import commandRoute from './command';
import interactRoute from './interact';

const app = createApp();

app.route('/', commandRoute);
app.route('/', interactRoute);

export default app;
