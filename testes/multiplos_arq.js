const express = require('express');
const multer = require('multer');
const path = require('path');

const app = express();

// Configuração do Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Diretório de destino
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName); // Define o nome do arquivo salvo
  },
});

const upload = multer({ storage });

// Rota para upload de arquivos (de um único campo com vários arquivos)
app.post('/upload-multiple', upload.array('files', 10), (req, res) => {
  try {
    res.send({
      message: 'Arquivos enviados com sucesso!',
      files: req.files,
    });
  } catch (error) {
    res.status(400).send({ error: 'Erro ao enviar os arquivos.' });
  }
});

app.listen(3000, () => {
  console.log('Servidor rodando na porta 3000');
});
