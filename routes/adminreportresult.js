var express = require('express');
var router = express.Router();

/*GET admin result report page*/
router.get('/', function (req, res) {

    res.render('adminreportresult',{data: req.body.education, dict: sortedDict, median: median});
})

module.exports = router;