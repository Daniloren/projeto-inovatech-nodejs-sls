const AWS = require("aws-sdk");
const express = require("express");
const serverless = require("serverless-http");

const app = express();

const ADS_TABLE = process.env.ADS_TABLE;
const CURSOS_TABLE = process.env.CURSOS_TABLE;
const USERS_TABLE = process.env.USERS_TABLE;
const dynamoDbClient = new AWS.DynamoDB.DocumentClient();
const crypto = require("crypto");

app.use(express.json());

//Pesquisa de usuários usando ID
app.get("/users/:userId", async function (req, res) {
  const params = {
    TableName: USERS_TABLE,
    Key: {
      userId: req.params.userId,
    },
  };

  try {
    const { Item } = await dynamoDbClient.get(params).promise();
    if (Item) {
      const { userId, name } = Item;
      res.json({ userId, name });
    } else {
      res
        .status(404)
        .json({ error: 'Could not find user with provided "userId"' });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Could not retreive user" });
  }
});

//Lista todos os usuários cadastrados no banco (DynamoDB)
app.get("/users", async function (req, res) {
  const params = {
    TableName: USERS_TABLE,
  };

  let scanResults = [];
  let items;
  try {
    do {
      items = await dynamoDbClient.scan(params).promise();
      items.Items.forEach((item) => scanResults.push(item));
      params.ExclusiveStartKey = items.LastEvaluatedKey;
    } while (typeof items.LastEvaluatedKey != "undefined");

    res.json({ users: items });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Could not list users" });
  }
});

//Cadastro de usuários
app.post("/users", async function (req, res) {
  const {
    userId,
    name,
    email,
    password,
    sobrenome,
    endereço,
    numero,
    bairro,
    cidade,
    estado,
    cep,
  } = req.body;
  if (typeof name !== "string") {
    res.status(400).json({ error: '"name" must be a string' });
  }

  const params = {
    TableName: USERS_TABLE,
    Item: {
      userId: crypto.randomUUID(),
      name: userId,
      name: name,
      email: email,
      password: password,
      sobrenome: sobrenome,
      endereço: endereço,
      numero: numero,
      bairro: bairro,
      cidade: cidade,
      estado: estado,
      cep: cep,
    },
  };

  try {
    await dynamoDbClient.put(params).promise();
    res.json({
      userId,
      name,
      email,
      password,
      sobrenome,
      endereço,
      numero,
      bairro,
      cidade,
      estado,
      cep,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Could not create user" });
  }
});

//Verifica se existe um usuário com login e senha informados.
//Senha não está criptografada.
app.post("/login", async function (req, res) {
  const { email, password } = req.body;
  console.log("request:", email, password);
  const params = {
    TableName: USERS_TABLE,
  };
  console.log("parametros: ", params);

  let scanResults = [];
  let items;
  try {
    //Busca todos os usuarios no banco de dados
    items = await dynamoDbClient.scan(params).promise();
    items.Items.forEach((item) => {
      //Se algum usuario tiver o login e senha informados, ele é adicionado em uma lista
      if (item.email === email && item.password === password) {
        scanResults.push(item);
      }
    });

    //Se a lista tiver só um usuario (unico com login e senha), retorna sucesso, com dados do usuário
    //Senão, retorna "Usuario não encontrado"
    if (scanResults.length != 1) {
      res.status(404).json({ error: "User not found" });
    } else {
      res.json(items.Items[0]);
    }
  } catch (error) {
    //Em caso de erro, mostra mensagem de usuário não encontrado
    console.log(error);
    res.status(500).json({ error: "Could not found user" });
  }
});

//Busca todos os ads (anuncios) cadastrados no banco
app.get("/ads", async function (req, res) {
  const params = {
    TableName: ADS_TABLE,
  };

  let scanResults = [];
  let items;
  try {
    do {
      items = await dynamoDbClient.scan(params).promise();
      items.Items.forEach((item) => scanResults.push(item));
      params.ExclusiveStartKey = items.LastEvaluatedKey;
    } while (typeof items.LastEvaluatedKey != "undefined");

    res.json({ ads: items });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Could not list ads" });
  }
});

//Adiciona e atualiza Ads (anuncios)
app.post("/ads", async function (req, res) {
  const { adsId, name, src, altText, caption, align, link } = req.body;
  if (typeof adsId !== "string") {
    res.status(400).json({ error: '"adsId" must be a string' });
  } else if (typeof name !== "string") {
    res.status(400).json({ error: '"name" must be a string' });
  }

  const params = {
    TableName: ADS_TABLE,
    Item: {
      adsId: crypto.randomUUID(),
      name: name,
      src: src,
      altText: altText,
      caption: caption,
      align: align,
      link: link,
    },
  };

  try {
    await dynamoDbClient.put(params).promise();
    res.json({ adsId, name });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Could not create ads" });
  }
});

//Lista todos os cursos
app.get("/cursos", async function (req, res) {
  const params = {
    TableName: CURSOS_TABLE,
  };

  let scanResults = [];
  let items;
  try {
    do {
      //Busca todos os cursos disponiveis no banco de dados
      items = await dynamoDbClient.scan(params).promise();
      //Adiciona em um Array
      items.Items.forEach((item) => scanResults.push(item));
      params.ExclusiveStartKey = items.LastEvaluatedKey;
    } while (typeof items.LastEvaluatedKey != "undefined");

    //retorna os cursos
    res.json({ cursos: items });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Could not list cursos" });
  }
});
//Busca cursos usando o ID
app.get("/cursos/:cursosId", async function (req, res) {
  const params = {
    TableName: CURSOS_TABLE,
    Key: {
      cursosId: req.params.cursosId,
    },
  };

  try {
    const { Item } = await dynamoDbClient.get(params).promise();
    if (Item) {
      const {
        cursosId,
        titulo,
        horasParaConclusao,
        quantidadeAtividades,
        minutosAulasGravadas,
        horasAulasAoVivo,
        linkVideo,
        conteudoDetalhado,
        categoria,
      } = Item;

      res.json({
        cursosId,
        titulo,
        horasParaConclusao,
        quantidadeAtividades,
        minutosAulasGravadas,
        horasAulasAoVivo,
        linkVideo,
        conteudoDetalhado,
        categoria,
      });
    } else {
      res
        .status(404)
        .json({ error: 'Could not find user with provided "cursosId"' });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Could not retreive curso" });
  }
});

//Cadastra Cursos
app.post("/cursos", async function (req, res) {
  const {
    cursosId,
    titulo,
    horasParaConclusao,
    quantidadeAtividades,
    minutosAulasGravadas,
    horasAulasAoVivo,
    linkVideo,
    conteudoDetalhado,
    categoria,
  } = req.body;
  if (typeof cursosId !== "string") {
    res.status(400).json({ error: '"cursosId" must be a string' });
  }

  const params = {
    TableName: CURSOS_TABLE,
    Item: {
      cursosId: cursosId,
      titulo: titulo,
      horasParaConclusao: horasParaConclusao,
      quantidadeAtividades: quantidadeAtividades,
      minutosAulasGravadas: minutosAulasGravadas,
      horasAulasAoVivo: horasAulasAoVivo,
      linkVideo: linkVideo,
      conteudoDetalhado: conteudoDetalhado,
      categoria: categoria,
    },
  };

  try {
    await dynamoDbClient.put(params).promise();
    res.json({
      cursosId,
      titulo,
      horasParaConclusao,
      quantidadeAtividades,
      minutosAulasGravadas,
      horasAulasAoVivo,
      linkVideo,
      conteudoDetalhado,
      categoria,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Could not create cursos" });
  }
});

//Metodo OPTIONS é usado para fazer chamadas de dominios diferentes. Ex:
//http://www.inovatech.com.br.s3-website-us-east-1.amazonaws.com/
//chamando
//https://2uhw4x03se.execute-api.us-east-1.amazonaws.com
app.options("/cursos", async (req, res) => {
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.send(200);
});
app.options("/login", async (req, res) => {
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.send(200);
});
app.options("/users", async (req, res) => {
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.send(200);
});

app.use((req, res, next) => {
  return res.status(404).json({
    error: "Not Found",
  });
});

module.exports.handler = serverless(app);
