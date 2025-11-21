const express = require("express");
const router = express.Router();
const personas = require("../../data/personas.json");

router.get("/", (req, res) => {
  res.json(
    personas.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
    }))
  );
});

module.exports = router;
