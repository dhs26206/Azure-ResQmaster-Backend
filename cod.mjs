import express from 'express';
const app = express();

app.get('/download', (req, res) => {
  const clientIP = req.ip;
  console.log(`Client IP: ${clientIP}`);
  const file = "D:/Games/Cod MWarfare 3.rar";
  res.download(file); // Sends a file as an attachment
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
