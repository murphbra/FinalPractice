const express = require('express');
const app = express();

const { Datastore } = require('@google-cloud/datastore');
const bodyParser = require('body-parser');

const datastore = new Datastore();

const LODGING = "Lodging";

const router = express.Router();

app.use(bodyParser.json());

function fromDatastore(item) {
    item.id = item[Datastore.KEY].id;
    return item;
}

/* ------------- Begin Lodging Model Functions ------------- */
function post_lodging(name, description, price) {
    var key = datastore.key(LODGING);
    const new_lodging = { "name": name, "description": description, "price": price };
    return datastore.save({ "key": key, "data": new_lodging }).then(() => { return key });
}

/**
 * The function datastore.query returns an array, where the element at index 0
 * is itself an array. Each element in the array at element 0 is a JSON object
 * with an entity fromt the type "Lodging".
 */
function get_lodgings() {
    const q = datastore.createQuery(LODGING);
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

function put_lodging(id, name, description, price) {
    const key = datastore.key([LODGING, parseInt(id, 10)]);
    const lodging = { "name": name, "description": description, "price": price };
    return datastore.save({ "key": key, "data": lodging });
}

function delete_lodging(id) {
    const key = datastore.key([LODGING, parseInt(id, 10)]);
    return datastore.delete(key);
}

/* ------------- End Model Functions ------------- */

/* ------------- Begin Controller Functions ------------- */

router.get('/', function (req, res) {
    const lodgings = get_lodgings()
        .then((lodgings) => {
            res.status(200).json(lodgings);
        });
});

router.post('/', function (req, res) {
    post_lodging(req.body.name, req.body.description, req.body.price)
        .then(key => { res.status(200).send('{ "id": ' + key.id + ' }') });
});

router.put('/:id', function (req, res) {
    put_lodging(req.params.id, req.body.name, req.body.description, req.body.price)
        .then(res.status(200).end());
});

router.delete('/:id', function (req, res) {
    delete_lodging(req.params.id).then(res.status(200).end())
});

/**
 * This route is not in the file discussed in the video. It demonstrates how to
 * get a single lodging from Datastore using the provided id and also how to 
 * determine when no lodging exists with that ID.
 */
router.get('/:id', function (req, res) {
    get_lodging(req.params.id)
        .then(lodging => {
            if (lodging[0] === undefined || lodging[0] === null) {
                // The 0th element is undefined. This means there is no lodging with this id
                res.status(404).json({ 'Error': 'No lodding exists with this id' });
            } else {
                // Return the 0th element which is the lodging with this id
                res.status(200).json(lodging[0]);
            }
        });
});

/* ------------- End Controller Functions ------------- */

app.use('/lodgings', router);

// Listen to the App Engine-specified port, or 8080 otherwise
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}...`);
});