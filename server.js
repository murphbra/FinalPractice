//test comment!!!!!!

const express = require('express');
const app = express();

const { Datastore } = require('@google-cloud/datastore');
const bodyParser = require('body-parser');

const datastore = new Datastore();

//const LODGING = "Lodging";
const BOAT = "Boat"; 

const SLIP = "Slip"; 

const router = express.Router();

app.use(bodyParser.json());

function fromDatastore(item) {
    item.id = item[Datastore.KEY].id;
    return item;
}

app.set('trust proxy', true); 
/* ------------- Begin Lodging Model Functions ------------- */
/*
function post_lodging(name, description, price) {
    var key = datastore.key(LODGING);
    const new_lodging = { "name": name, "description": description, "price": price };
    return datastore.save({ "key": key, "data": new_lodging }).then(() => { return key });
}
*/
function post_boat(name, type, length) {
    var key = datastore.key(BOAT);
    const new_boat = { "name": name, "type": type, "length": length };
    return datastore.save({ "key": key, "data": new_boat }).then(() => { 
        new_boat.id = key.id; 
        return new_boat });
}

function post_slip(number) {
    var key = datastore.key(SLIP);
    const new_slip = { "number": number, "current_boat": null };
    return datastore.save({ "key": key, "data": new_slip }).then(() => { 
        new_slip.id = key.id; 
        return new_slip });
}
/**
 * The function datastore.query returns an array, where the element at index 0
 * is itself an array. Each element in the array at element 0 is a JSON object
 * with an entity fromt the type "Lodging".
 */

function get_boats() {
    const q = datastore.createQuery(BOAT);
    return datastore.runQuery(q).then((entities) => {
        // Use Array.map to call the function fromDatastore. This function
        // adds id attribute to every element in the array at element 0 of
        // the variable entities
        return entities[0].map(fromDatastore);
    });
}

function get_slips() {
    const q = datastore.createQuery(SLIP);
    return datastore.runQuery(q).then((entities) => {
        // Use Array.map to call the function fromDatastore. This function
        // adds id attribute to every element in the array at element 0 of
        // the variable entities
        return entities[0].map(fromDatastore);
    });
}
/**
 * This function is not in the code discussed in the video. It demonstrates how
 * to get a single entity from Datastore using an id.
 * Note that datastore.get returns an array where each element is a JSON object 
 * corresponding to an entity of the Type "Lodging." If there are no entities
 * in the result, then the 0th element is undefined.
 * @param {number} id Int ID value
 * @returns An array of length 1.
 *      If a lodging with the provided id exists, then the element in the array
 *           is that lodging
 *      If no lodging with the provided id exists, then the value of the 
 *          element is undefined
 */
/*
function get_lodging(id) {
    const key = datastore.key([LODGING, parseInt(id, 10)]);
    return datastore.get(key).then((entity) => {
        if (entity[0] === undefined || entity[0] === null) {
            // No entity found. Don't try to add the id attribute
            return entity;
        } else {
            // Use Array.map to call the function fromDatastore. This function
            // adds id attribute to every element in the array entity
            return entity.map(fromDatastore);
        }
    });
}
*/

function get_boat(id) {
    const key = datastore.key([BOAT, parseInt(id, 10)]);
    return datastore.get(key).then((entity) => {
        if (entity[0] === undefined || entity[0] === null) {
            // No entity found. Don't try to add the id attribute
            return entity;
        } else {
            // Use Array.map to call the function fromDatastore. This function
            // adds id attribute to every element in the array entity
            return entity.map(fromDatastore);
        }
    });
}

function get_slip(id) {
    const key = datastore.key([SLIP, parseInt(id, 10)]);
    return datastore.get(key).then((entity) => {
        if (entity[0] === undefined || entity[0] === null) {
            // No entity found. Don't try to add the id attribute
            return entity;
        } else {
            // Use Array.map to call the function fromDatastore. This function
            // adds id attribute to every element in the array entity
            return entity.map(fromDatastore);
        }
    });
}

function put_lodging(id, name, description, price) {
    const key = datastore.key([LODGING, parseInt(id, 10)]);
    const lodging = { "name": name, "description": description, "price": price };
    return datastore.save({ "key": key, "data": lodging });
}


function put_boat_in_slip(slip_id, boat_id) {
    const slip_key = datastore.key([SLIP, parseInt(slip_id, 10)]);
    return datastore.get(slip_key).then((entity) => {
            entity[0].current_boat = boat_id; 
        }); 
    }


/* ------------- End Model Functions ------------- */

/* ------------- Begin Controller Functions ------------- */

router.get('/boats', function (req, res) {
    const boats = get_boats().then((boats) => {

            for(var i = 0; i< boats.length ; i++)
            {
                boats[i].self = "https://cs493a3.wm.r.appspot.com/boats/" + boats[i].id; 
            }
            res.status(200).json(boats);
        });
});

router.get('/slips', function (req, res) {
    const slips = get_slips().then((slips) => {

            for(var i = 0; i< slips.length ; i++)
            {
                slips[i].self = "https://cs493a3.wm.r.appspot.com/slips/" + slips[i].id; 
            }
            res.status(200).json(slips);
        });
});

router.post('/boats', function (req, res) {
    if(req.body.length === undefined)
    {
        res.status(400).json({ 'Error': 'The request object is missing at least one of the required attributes' }).end(); 
    } 
    if(req.body.name === undefined)
    {
        res.status(400).json({ 'Error': 'The request object is missing at least one of the required attributes' }).end(); 
    }
    if(req.body.type === undefined)
    {
        res.status(400).json({ 'Error': 'The request object is missing at least one of the required attributes' }).end(); 
    }
    else 
    {
        post_boat(req.body.name, req.body.type, req.body.length).then(new_boat => { 
            new_boat.self = "https://cs493a3.wm.r.appspot.com/boats/" + new_boat.id; 
            res.status(201).send(new_boat); 
        }); 
    }
});

router.post('/slips', function (req, res) {
    if(req.body.number === undefined)
    {
        res.status(400).json({ 'Error': 'The request object is missing the required number' }).end(); 
    } 
    else 
    {
        post_slip(req.body.number).then(new_slip => { 
            new_slip.self = "https://cs493a3.wm.r.appspot.com/slips/" + new_slip.id; 
            res.status(201).send(new_slip); 
        }); 
    }
});

router.put('/lodgings/:id', function (req, res) {
    put_lodging(req.params.id, req.body.name, req.body.description, req.body.price)
        .then(res.status(200).end());
});

/*
doSomething()
.then(result => doSomethingElse(result))
.then(newResult => doThirdThing(newResult))
.then(finalResult => {
  console.log(`Got the final result: ${finalResult}`);
})
*/ 

router.put('/slips/:slip_id/:boat_id', function (req, res) {
    
    get_slip(req.params.slip_id)
    
    .then (slip => function(slip)
        {
            if (slip[0] === undefined || slip[0] === null) 
            {
                // The 0th element is undefined. This means there is no lodging with this id
                res.status(404).json({ 'Error': 'The specified boat and/or slip does not exist' }).end(); 
            }

            else if (slip[0].current_boat !== null)
            {
                res.status(403).json({ 'Error': 'The slip is not empty'}).end(); 
            }
        })
    
    .then (get_boat(req.params.boat_id))
    
    .then(boat => function(boat)
        {
            if (boat[0] === undefined || boat[0] === null) 
            {
                // The 0th element is undefined. This means there is no lodging with this id
                res.status(404).json({ 'Error': 'The specified boat and/or slip does not exist' }).end(); 
            }
        })

    .then (put_boat_in_slip(req.params.slip_id, req.params.boat_id))
    
    .then(res.status(204).end() ); 
}); 


/**
 * This route is not in the file discussed in the video. It demonstrates how to
 * get a single lodging from Datastore using the provided id and also how to 
 * determine when no lodging exists with that ID.
 */
router.get('/boats/:id', function (req, res) {
    get_boat(req.params.id)
        .then(boat => {
            if (boat[0] === undefined || boat[0] === null) {
                // The 0th element is undefined. This means there is no lodging with this id
                res.status(404).json({ 'Error': 'No boat with this boat_id exists' });
            } else {
                // Return the 0th element which is the boat with this id
                boat[0].self = "https://cs493a3.wm.r.appspot.com/boats/" + boat[0].id; 
                res.status(200).json(boat[0]);
            }
        });
});

router.get('/slips/:id', function (req, res) {
    get_slip(req.params.id)
        .then(slip => {
            if (slip[0] === undefined || slip[0] === null) {
                // The 0th element is undefined. This means there is no lodging with this id
                res.status(404).json({ 'Error': 'No slip with this slip_id exists' });
            } else {
                // Return the 0th element which is the boat with this id
                slip[0].self = "https://cs493a3.wm.r.appspot.com/slips/" + slip[0].id; 
                res.status(200).json(slip[0]);
            }
        });
});

router.patch('/boats/:id', function (req, res) {
    if(req.body.length === undefined)
    {
        res.status(400).json({ 'Error': 'The request object is missing at least one of the required attributes' }).end(); 
    } 
    if(req.body.name === undefined)
    {
        res.status(400).json({ 'Error': 'The request object is missing at least one of the required attributes' }).end(); 
    }
    if(req.body.type === undefined)
    {
        res.status(400).json({ 'Error': 'The request object is missing at least one of the required attributes' }).end(); 
    }
    else{
        get_boat(req.params.id)
        .then(boat => {
            if (boat[0] === undefined || boat[0] === null) {
                // The 0th element is undefined. This means there is no lodging with this id
                res.status(404).json({ 'Error': 'No boat with this boat_id exists' });
            } else {
                // Return the 0th element which is the boat with this id
                boat[0].name = req.body.name;
                boat[0].type = req.body.type;
                boat[0].length = req.body.length;
                boat[0].self = "https://cs493a3.wm.r.appspot.com/boats/" + boat[0].id; 
                res.status(200).json(boat[0]);
            }
        });

    }
});
/* ------------- End Controller Functions ------------- */

app.use('/', router);

// Listen to the App Engine-specified port, or 8080 otherwise
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}...`);
});