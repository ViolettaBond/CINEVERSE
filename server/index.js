import { config } from './src/config.js';
import app from './src/app.js';

app.listen(config.port, () => {
  console.log(`Server started on port ${config.port}`);
});
