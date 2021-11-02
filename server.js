//Author: Brayden Murphy
//CS 493 Assignment 5
// Adapted from example code provided in course materials for CS 493 

const json2html = require('json-to-html');
const express = require('express');
const app = express();

const { Datastore } = require('@google-cloud/datastore');
const bodyParser = require('body-parser');

const datastore = new Datastore();

const BOAT = "Boat"; 

const router = express.Router();

app.use(bodyParser.json());

function fromDatastore(item) {
    item.id = item[Datastore.KEY].id;
    return item;
}

app.set('trust proxy', true); 
/* ------------- Begin Lodging Model Functions ------------- */

function post_boat(name, type, length) {
    var key = datastore.key(BOAT);
    const new_boat = { "name": name, "type": type, "length": length };
    return datastore.save({ "key": key, "data": new_boat }).then(() => { 
        new_boat.id = key.id; 
        return new_boat });
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

function put_boat(id, name, type, length) {
    const key = datastore.key([BOAT, parseInt(id, 10)]);
    const boat = { "name": name, "type": type, "length": length };
    return datastore.save({ "key": key, "data": boat });
}

function delete_boat(id) {
    const key = datastore.key([BOAT, parseInt(id, 10)]);
    return datastore.delete(key); 
}


/* ------------- End Model Functions ------------- */

/* ------------- Begin Controller Functions ------------- */

router.get('/boats', function (req, res) {
    const boats = get_boats().then((boats) => {

            for(var i = 0; i< boats.length ; i++)
            {
                boats[i].self = "https://cs493a5-330723.wm.r.appspot.com/boats/" + boats[i].id; 
            }
            res.status(200).json(boats);
        });
});

router.post('/boats', function (req, res) {
    if(req.get('content-type') !== 'application/json'){
        res.status(415).json({'Error': 'Server only accepts application/json data.'}).end(); 
        return; 
    }
    const accepts = req.accepts(['application/json']); 
    if(!accepts)
    {
        res.status(406).json({'Error': 'Client must accept application/json'}).end(); 
        return; 
    }

    if(req.body.length === undefined)
    {
        res.status(400).json({ 'Error': 'The request object is missing at least one of the required attributes' }).end(); 
        return; 
    } 
    else if(req.body.name === undefined)
    {
        res.status(400).json({ 'Error': 'The request object is missing at least one of the required attributes' }).end(); 
        return; 
    }
    else if(req.body.type === undefined)
    {
        res.status(400).json({ 'Error': 'The request object is missing at least one of the required attributes' }).end(); 
        return; 
    }
    else 
    {
        const attributes = Object.keys(req.body);
        if(attributes.length > 3)
        {
            res.status(400).json({'Error': 'The request included at least one non-supported attribute'}).end(); 
            return; 
        }
        if(req.body.name.length > 20)
        {
            res.status(400).json({'Error': 'Boat name attribute must be 20 characters or less'}).end(); 
            return; 
        }
        var alphaNum = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 "; 
        for(var x=0; x<req.body.name.length; x++)
        {
            if(!alphaNum.includes(req.body.name[x]))
            {
                res.status(400).json({'Error': 'Boat name characters must be alphanumeric'}).end();
                return;  
            }
        }
        get_boats().then((boats) => {
            var repeat = false; 
            for(var i=0; i<boats.length; i++)
            {
                if(boats[i].name == req.body.name)
                {
                    res.status(403).json({'Error': 'A boat with that name already exists'}).end(); 
                    repeat = true; 
                }
            }
            return repeat; 
        }).then( (repeat) => { 
            if(!repeat)
            {
                post_boat(req.body.name, req.body.type, req.body.length).then(new_boat => { 
                    new_boat.self = "https://cs493a5-330723.wm.r.appspot.com/boats/" + new_boat.id; 
                    res.status(201).json(new_boat); 
                    return; 
                }); 
            }
        }); 
    }
});


router.get('/boats/:id', function (req, res) {
    get_boat(req.params.id)
        .then(boat => {
            if (boat[0] === undefined || boat[0] === null) {
                res.status(404).json({ 'Error': 'No boat with this boat_id exists' });
            } else {
                boat[0].self = "https://cs493a5-330723.wm.r.appspot.com/boats/" + boat[0].id; 
                const accepts = req.accepts(['application/json', 'text/html']);
                if(!accepts)
                {
                    res.status(406).json({'Error': 'Not Acceptable'});
                } 
                else if(accepts === 'application/json')
                {
                    res.status(200).json(boat[0]);
                } 
                else if(accepts === 'text/html')
                {
                    res.status(200).send(json2html(boat[0]).slice(1,-1));
                } 
            }
        });
});

router.put('/boats/:id', function (req, res) {
    if(req.get('content-type') !== 'application/json'){
        res.status(415).json({'Error': 'Server only accepts application/json data.'}).end(); 
        return; 
    }
    const accepts = req.accepts(['application/json']); 
    if(!accepts)
    {
        res.status(406).json({'Error': 'Client must accept application/json'}).end(); 
        return; 
    }

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
        const attributes = Object.keys(req.body);
        if(attributes.length > 3)
        {
            res.status(400).json({'Error': 'The request included at least one non-supported attribute'}).end(); 
            return; 
        }
        if(req.body.name.length > 20)
        {
            res.status(400).json({'Error': 'Boat name attribute must be 20 characters or less'}).end(); 
            return; 
        }
        var alphaNum = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 "; 
        for(var x=0; x<req.body.name.length; x++)
        {
            if(!alphaNum.includes(req.body.name[x]))
            {
                res.status(400).json({'Error': 'Boat name characters must be alphanumeric'}).end();
                return;  
            }
        }
        get_boat(req.params.id)
        .then(boat => {
            if (boat[0] === undefined || boat[0] === null) {
                res.status(404).json({ 'Error': 'No boat with this boat_id exists' });
            } else {
                get_boats().then((boats) => {
                    var repeat = false;
                    for(var i=0; i<boats.length; i++)
                    {
                        if(boats[i].name == req.body.name && boats[i].id != req.params.id)
                        {
                            res.status(403).json({'Error': 'A boat with that name already exists'}).end();
                            repeat = true; 
                        }
                    }
                    return repeat; 
                }).then( (repeat) => {
                    if(!repeat)
                    {
                        put_boat(req.params.id, req.body.name, req.body.type, req.body.length); 
                        boat[0].name = req.body.name;
                        boat[0].type = req.body.type;
                        boat[0].length = req.body.length;
                        boat[0].self = "https://cs493a5-330723.wm.r.appspot.com/boats/" + boat[0].id; 
                        res.location(boat[0].self); 
                        res.status(303).json(boat[0]).end();
                    }
                })
            }
        });
    }
});


router.patch('/boats/:id', function (req, res) { 
    if(req.get('content-type') !== 'application/json')
    {
        res.status(415).json({'Error': 'Server only accepts application/json data.'}).end();
        return; 
    }
    const accepts = req.accepts(['application/json']); 
    if(!accepts)
    {
        res.status(406).json({'Error': 'Client must accept application/json'}).end(); 
        return; 
    }
    const accepted = ["name", "type", "length"]; 
    const attributes = Object.keys(req.body); 
    var results = {}; 
    results.body = attributes; 
    for(var y = 0; y< attributes.length; y++)
    {
        if(!accepted.includes(attributes[y]))
        {
            res.status(400).json({'Error': "The request included at least one non-supported attribute"}).end();
            return; 
        }
    }
    if(attributes.includes("name"))
    {
        var alphaNum = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 "; 
        for(var x=0; x<req.body.name.length; x++)
        {
            if(!alphaNum.includes(req.body.name[x]))
            {
                res.status(400).json({'Error': 'Boat name characters must be alphanumeric'}).end();
                return; 
            }
        }
    }
    get_boat(req.params.id)
    .then(boat => {
        if(boat[0] === undefined || boat[0] === null)
        {
            res.status(404).json({'Error': 'No boat with this boat_id exists'});
        }
        else 
        {
            get_boats().then((boats) => {
                var duplicate = false; 
                //for(var i=0; i<boats.length; i++)
                if(attributes.includes("name"))
                {
                    for(var i=0; i<boats.length; i++)
                    {
                        if(boats[i].name == req.body.name && boats[i].id != req.params.id)
                        {
                            duplicate = true; 
                            res.status(403).json({'Error': 'A boat with that name already exists'}).end();
                        }  
                    }
                }
                return duplicate; 
            }).then ( (duplicate) => {
                if(!duplicate)
                {
                    if(attributes.includes("name")) 
                    {
                        var name = req.body.name; 
                    } 
                    if(!attributes.includes("name")) 
                    {
                        var name = boat[0].name;
                    } 
                    
                    if(attributes.includes("type")) 
                    {
                        var type = req.body.type; 
                    } 
                    if(!attributes.includes("type")) 
                    {
                        var type = boat[0].type; 
                    } 
                    
                    if(attributes.includes("length")) 
                    {
                        var length = req.body.length; 
                    } 
                    if(!attributes.includes("length")) 
                    {
                        var length = boat[0].length; 
                    } 

                    put_boat(req.params.id, name, type, length); 
                    boat[0].name = name; 
                    boat[0].type = type; 
                    boat[0].length = length; 
                    boat[0].self = "https://cs493a5-330723.wm.r.appspot.com/boats/" + boat[0].id;
                    res.status(200).json(boat[0]).end(); 
                }
            }); 
        }
    }); 
});  

router.delete('/boats/:boat_id', function(req, res) {
    get_boat(req.params.boat_id)
    .then (boat =>
        {
            if (boat[0] === undefined || boat[0] === null) 
            {
                // The 0th element is undefined. This means there is no lodging with this id
                res.status(404).json({ 'Error': 'No boat with this boat_id exists' }).end(); 
            }
            else
            {
                delete_boat(req.params.boat_id).then(res.status(204).end()); 
            }
        })
}); 

router.put('/boats', function (req, res){
    res.set('Accept', 'GET, POST');
    res.status(405).end();
});

router.delete('/boats', function (req, res){
    res.set('Accept', 'GET, POST');
    res.status(405).end();
});

router.delete('/clear', function(req, res) {
    get_boats().then  ( (boats) => {
        for(var i = 0; i<boats.length; i++)
        {
            delete_boat(boats[i].id); 
        }
        res.status(204).end(); 
    })
})

/* ------------- End Controller Functions ------------- */

app.use('/', router);

// Listen to the App Engine-specified port, or 8080 otherwise
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}...`);
});