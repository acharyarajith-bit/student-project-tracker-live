
import { createApp } from './project-api.js';

const app = createApp();
const port = Number(process.env.PORT) || 3000;

app.listen(port, () => {
  console.log(`Student Project Tracker: http://localhost:${port}`);
});
