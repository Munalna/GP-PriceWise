import dotenv from 'dotenv';
import app from './server.js';

dotenv.config();
console.log("SUPABASE_URL =", process.env.SUPABASE_URL)
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
