const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const petController = require("../controllers/pet.controller");

router.get("/", requireAuth, petController.getPets);
router.post("/", requireAuth, petController.addPet);
router.put("/:id", requireAuth, petController.updatePet);
router.delete("/:id", requireAuth, petController.deletePet);
router.get("/:id", requireAuth, petController.getPetById);

module.exports = router;
