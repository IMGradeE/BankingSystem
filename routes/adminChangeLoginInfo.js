var express = require('express');
var router = express.Router();

/*GET admin report select page.*/
router.get('/', function (req, res) {
    console.log("adminChangeLoginInfo.js: GET");
    res.render('adminChangeLoginInfo',{});
})


router.post('/', function (req, res) {
    console.log("adminChangeLoginInfo.js: POST");
    let dictionary = {
        "payton": 1.2,
        "john": 1.5,
        "poe": 2.02,
        "jen": 1.9,
        "fred": 1.68,
        "jeff": 4,
        "cher": 1.69,
        "joe": 1.9,
        "jerry": 1.1,
        "matt": 1.56}

    const sortedDict = Object.fromEntries(
        Object.entries(dictionary).sort(([,a],[,b]) => a - b)
    );
    /*There is a simpler way of doing this since there are never more than 10 values being passed but w/e*/
    let length = Object.values(sortedDict).length;
    let median = Object.values(sortedDict)[Math.floor(length/2)];
    if (length%2 === 0) {
        median = (Object.values(sortedDict)[Math.floor(length/2) - 1] + Object.values(sortedDict)[Math.floor(length/2)])/2;
    }
    res.render('adminreportresult',{data: req.body.education, dict: sortedDict, median: median})
})

module.exports = router;