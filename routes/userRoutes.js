const express = require("express");
const { signup, login, deleteUser, editUser, findUserById } = require("../controller/userController");
const authenticateUser = require("../middleware/userAuth");

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/:userId", authenticateUser, findUserById);
router.delete("/delete/:userId", authenticateUser, deleteUser);
router.put("/edit/:userId", authenticateUser, editUser);

module.exports = router;
