import express from "express";
import cors from "cors";

const app = express();
app.use(cors());

app.get("/getData", (req, res) => {
    res.send("Hola desde el backend");
})

app.listen(5000, () =>console.log('App corriendo en 5000'));  
