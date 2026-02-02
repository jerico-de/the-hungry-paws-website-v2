const express = require("express");
const router = express.Router();
const { isLoggedIn } = require("../middleware/auth");
const userController = require("../controllers/user.controller");

router.get("/profile", isLoggedIn, userController.getProfile);
router.put("/profile", isLoggedIn, userController.updateProfile);
router.put("/change-password", isLoggedIn, userController.changePassword);
router.delete("/account", isLoggedIn, userController.deleteAccount);

module.exports = router;
