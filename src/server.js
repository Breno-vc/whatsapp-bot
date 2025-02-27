const express = require("express");
const twilio = require("twilio");

const { exec } = require("child_process");
const fs = require("fs");
const axios = require("axios");
const path = require("path");

require("dotenv").config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const accountSid = process.env.TWILLIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

async function downloadAudio(url, filePath) {
  try {
    const response = await axios({
      url,
      responseType: "stream",
      auth: {
        username: process.env.TWILIO_ACCOUNT_SID, // Seu Account SID
        password: process.env.TWILIO_AUTH_TOKEN, // Seu Auth Token
      },
    });
    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    return new Promise((res, rej) => {
      writer.on("finish", res);
      writer.on("error", rej);
    });
  } catch (error) {
    console.error("Erro ao baixar o áudio:", error);
    throw error;
  }
}

function transcribeAudio(filePath) {
  return new Promise((resolve, reject) => {
    exec(
      `python3.11 src/transcriber.py ${filePath}`,
      (error, stdout, stderr) => {
        if (error) {
          console.error("Erro ao transcrever o áudio:", error);
          reject(error);
        } else {
          resolve(stdout.trim());
        }
      }
    );
  });
}

app.get("/", (req, res) => {
  res.send("Chatbot online e funcionando!");
});

app.post("/webhook", async (req, res) => {
  const from = req.body.From;
  let responseMessage;

  if (req.body.NumMedia > 0 && req.body.MediaContentType0 === "audio/ogg") {
    const audioUrl = req.body.MediaUrl0;
    const filePath = "./temp_audio.ogg";

    try {
      await downloadAudio(audioUrl, filePath);
      console.log("audio baixado com sucesso:", filePath);

      const transcription = await transcribeAudio(filePath);
      console.log("texto transcrito:", transcription);

      responseMessage = `você disse: ${transcription}`;
    } catch (error) {
      console.error("Erro ao processar o áudio:", error);
    } finally {
      // Remover o arquivo temporário
      fs.unlinkSync(filePath);
    }
  } else {
    const incomingMessage = req.body.Body;
    responseMessage = `Você disse: ${incomingMessage}`;
  }
  client.messages
    .create({
      body: responseMessage,
      from: process.env.TWILIO_PHONE_NUMBER,
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
