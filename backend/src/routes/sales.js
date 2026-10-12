const express = require("express");

const salesController = require("../controllers/salesController");

const router = express.Router();

router.get("/", salesController.list);
router.get("/summary", salesController.summary);
router.post("/", salesController.create);
router.patch("/:id/cancel", salesController.cancel);

module.exports = router;
