const express = require("express");
const twilio = require("twilio");

require("dotenv").config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const accountSid = process.env.TWILLIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

app.get("/", (req, res) => {
  res.send("Chatbot online e funcionando!");
});

app.post("/webhook", (req, res) => {
  const incommingMessage = req.body.Body;
  console.log(incommingMessage);
  const from = req.body.From;
  const To = process.env.TWILIO_PHONE_NUMBER;

  console.log("Mensagem recebida:", incommingMessage);
  console.log("De:", from);

  const responseMessage = `Você disse: ${incommingMessage}`;

  client.messages
    .create({
      body: responseMessage,
      from: To,
      to: from,
    })
    .then(() => {
      res.status(200).send("Mensagem enviada!");
    })
    .catch((err) => {
      console.error("Erro ao enviar mensagem:", err);
      res.status(500).send("Erro ao enviar mensagem.");
    });
});

const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
