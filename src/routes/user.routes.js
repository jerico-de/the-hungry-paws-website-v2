const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const userController = require("../controllers/user.controller");

router.get("/profile", requireAuth, userController.getProfile);
router.put("/profile", requireAuth, userController.updateProfile);
router.put("/change-password", requireAuth, userController.changePassword);
router.delete("/account", requireAuth, userController.deleteAccount);

module.exports = router;
