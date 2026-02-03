const express = require("express");
const router = express.Router();
const { isLoggedIn } = require("../middleware/auth");
const petController = require("../controllers/pet.controller");

router.get("/", isLoggedIn, petController.getPets);
router.post("/", isLoggedIn, petController.addPet);
router.put("/:id", isLoggedIn, petController.updatePet);
router.delete("/:id", isLoggedIn, petController.deletePet);
router.get("/:id", isLoggedIn, petController.getPetById);

module.exports = router;
