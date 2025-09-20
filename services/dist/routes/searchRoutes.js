"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const foodController_1 = require("../controllers/foodController");
const router = (0, express_1.Router)();
// Add food search endpoint
router.get('/food', foodController_1.searchFoodInDatabase);
exports.default = router;
