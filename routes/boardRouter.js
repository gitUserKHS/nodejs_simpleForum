const express = require('express');
const router = express.Router();

// import board controller
const boardMiddleWare = require('../Controllers/board/board.controller');

router.get('/', boardMiddleWare.showList);
router.get('/write', boardMiddleWare.writePost);
router.post('/writeAfter', boardMiddleWare.afterWritePost);
router.post('/deletePost', boardMiddleWare.deletePost);
router.get('/Post', boardMiddleWare.displayPost);

module.exports = router;
