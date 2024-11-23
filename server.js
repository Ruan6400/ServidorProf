const express = require('express');
const path = require('path');
const multer = require('multer');
const {Pool} = require('pg');
require('dotenv').config();

let idprof;
let nomeprof;

//criação do objeto que vai gerenciar as apis
const app = express();

//preparando o express para receber as informações de login
app.use(express.urlencoded({extended:true}));

//armazenamento de arquivos em buffer para enviar
const modoDeArmazenamento = multer.memoryStorage();
const upload = multer({storage:modoDeArmazenamento});

//dados do banco ocultos por segurança
const dadosBd = {
    user:process.env.DB_USER,
    password:process.env.DB_PASSWORD,
    database:process.env.DB_NAME,
    port:process.env.DB_PORT,
    host:process.env.DB_HOST
}

//conexão ao banco de dados
const pool = new Pool(dadosBd);

async function CriarBanco() {
    console.log("conectando ao banco de dados...");
    try{
        await pool.query(`
            CREATE TABLE IF NOT EXISTS professor(
                id SERIAL PRIMARY KEY,
                senha INT NOT NULL,
                nome VARCHAR(50)
            );
            CREATE TABLE IF NOT EXISTS arquivos(
                id SERIAL PRIMARY KEY,
                nome VARCHAR(50),
                tipo  VARCHAR(10),
                dados BYTEA,
                professor_id INT NOT NULL,
                CONSTRAINT fk_professor FOREIGN KEY (professor_id) REFERENCES professor(id)
            );`)
            console.log("Banco conectado com sucesso");
    }catch(erro){
        console.error(erro);
    }
}

//Validar login
app.post('/login',(req,res)=>{
    try{
        const {senha,nome} = req.body;
        const consulta = pool.query("SELECT senha FROM professor WHERE nome = $1;",[nome]);
        if(consulta.rows.length === 0 || consulta.rows[0].senha != senha){
            res.send('<script>alert("Usuário ou senha incorretos")</script>')
        }else{
            // nomeprof = consulta.rows[0].nome;
            // idprof = consulta.rows[0].id;

            //na verdade as informações sobre o usuário não ficam aqui
        }
        

    }catch(erro){
        console.error("Falha no login | "+erro);
    }
})

//Salvar arquivos no banco de dados
app.post('/upload',upload.single('file'),async (req,res)=>{

    // //Verificar se foi realmente enviado um arquivo
    // if (!req.file) {
    //     return res.status(400).send('Nenhuma imagem foi enviada.');
    // }

    // try{
    //     const {originalname,mimetype,buffer} = req.file;
    //     //await pool.query('INSERT INTO ')
    // }catch(erro){
    //     console.error("Erro no banco de dados | "+erro);
    // }
})

app.get('/download/:id',async (req,res)=>{
    // Configurar o cabeçalho de resposta para download
    // res.setHeader('Content-Disposition', `attachment; filename="${arquivo.nome_arquivo}"`);
    // res.setHeader('Content-Type', arquivo.tipo_arquivo);

    // // Enviar o arquivo
    // res.send(arquivo.conteudo);
})

//Comando para criar a base de dados caso não exista
CriarBanco();

//comando para deixar o servidor ativo
app.listen(3000,'0.0.0.0',()=>{
    console.log('Conexão bem sucedida');
});